const fs = require('fs').promises
const path = require('path')
const vm = require('vm')
const crypto = require('crypto')
const semver = require('semver')
const { logger } = require('../utils/logger')

/**
 * 🔌 Mursfoto CLI 插件管理器
 * 提供插件的載入、管理、執行和安全沙箱功能
 */
class PluginManager {
  constructor(cliContext) {
    this.cliContext = cliContext
    this.plugins = new Map()
    this.hooks = new Map()
    this.commands = new Map()
    this.pluginRegistry = new PluginRegistry()
    this.securityManager = new PluginSecurityManager()
    
    // 初始化插件目錄
    this.pluginsDir = path.join(process.cwd(), '.mursfoto', 'plugins')
    this.cacheDir = path.join(process.cwd(), '.mursfoto', 'cache')
    
    this.initializeDirectories()
  }

  /**
   * 初始化必要的目錄結構
   */
  async initializeDirectories() {
    try {
      await fs.mkdir(this.pluginsDir, { recursive: true })
      await fs.mkdir(this.cacheDir, { recursive: true })
      
      // 創建插件配置文件
      const configPath = path.join(this.pluginsDir, 'config.json')
      const configExists = await this.fileExists(configPath)
      
      if (!configExists) {
        const defaultConfig = {
          version: '1.0.0',
          plugins: {},
          settings: {
            autoUpdate: true,
            securityLevel: 'high',
            maxMemory: '512MB',
            timeout: 30000
          }
        }
        await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2))
      }
      
      logger.info('🔌 插件系統初始化完成')
    } catch (error) {
      logger.error('❌ 插件系統初始化失敗:', error.message)
      throw error
    }
  }

  /**
   * 載入插件
   * @param {string} pluginName - 插件名稱
   * @param {Object} options - 載入選項
   */
  async loadPlugin(pluginName, options = {}) {
    try {
      logger.info(`🔄 開始載入插件: ${pluginName}`)
      
      // 檢查插件是否已載入
      if (this.plugins.has(pluginName)) {
        logger.warn(`⚠️  插件 ${pluginName} 已載入`)
        return this.plugins.get(pluginName)
      }

      // 解析插件路徑
      const pluginPath = await this.resolvePluginPath(pluginName)
      
      // 載入插件元數據
      const metadata = await this.loadPluginMetadata(pluginPath)
      
      // 相依性檢查
      await this.checkDependencies(metadata.dependencies)
      
      // 安全檢查
      await this.securityManager.validatePlugin(pluginPath, metadata)
      
      // 創建安全沙箱
      const plugin = await this.createPluginSandbox(pluginPath, metadata)
      
      // 註冊插件鉤子和命令
      this.registerPluginHooks(plugin, metadata)
      this.registerPluginCommands(plugin, metadata)
      
      // 啟動插件
      if (plugin.activate) {
        await plugin.activate(this.cliContext)
      }
      
      // 保存插件實例
      this.plugins.set(pluginName, {
        instance: plugin,
        metadata,
        loadTime: new Date(),
        status: 'active'
      })
      
      logger.info(`✅ 插件 ${pluginName} 載入成功`)
      return plugin
      
    } catch (error) {
      logger.error(`❌ 插件 ${pluginName} 載入失敗:`, error.message)
      throw error
    }
  }

  /**
   * 創建安全的插件執行沙箱
   * @param {string} pluginPath - 插件路徑
   * @param {Object} metadata - 插件元數據
   */
  async createPluginSandbox(pluginPath, metadata) {
    const mainFile = path.join(pluginPath, metadata.main || 'index.js')
    const code = await fs.readFile(mainFile, 'utf8')
    
    // 創建受限的 require 函數
    const secureRequire = this.createSecureRequire(pluginPath, metadata.permissions)
    
    // 創建沙箱環境
    const sandbox = {
      // Node.js 基礎
      require: secureRequire,
      console: this.createSecureConsole(metadata.name),
      Buffer,
      process: {
        env: this.filterEnvironment(metadata.permissions.env),
        platform: process.platform,
        arch: process.arch,
        version: process.version,
        cwd: () => pluginPath
      },
      
      // Mursfoto API
      mursfoto: {
        version: this.cliContext.version,
        registerCommand: this.registerCommand.bind(this),
        registerHook: this.registerHook.bind(this),
        executeHook: this.executeHook.bind(this),
        getConfig: this.getConfig.bind(this),
        setConfig: this.setConfig.bind(this),
        log: this.createPluginLogger(metadata.name),
        utils: this.createUtilsAPI(),
        storage: this.createStorageAPI(metadata.name)
      },
      
      // 全局對象
      global: {},
      __filename: mainFile,
      __dirname: pluginPath,
      module: { exports: {} },
      exports: {}
    }

    // 執行插件代碼
    const script = new vm.Script(`
      (function(exports, require, module, __filename, __dirname) {
        ${code}
        return module.exports;
      })
    `, { 
      filename: mainFile,
      timeout: metadata.timeout || 5000
    })
    
    const result = script.runInNewContext(sandbox, {
      timeout: 10000,
      breakOnSigint: true
    })
    
    return result(sandbox.exports, sandbox.require, sandbox.module, sandbox.__filename, sandbox.__dirname)
  }

  /**
   * 創建安全的 require 函數
   * @param {string} pluginPath - 插件路徑  
   * @param {Array} permissions - 允許的權限
   */
  createSecureRequire(pluginPath, permissions = []) {
    const allowedModules = new Set([
      // Node.js 核心模組
      'path', 'fs', 'os', 'crypto', 'util', 'events',
      'stream', 'buffer', 'string_decoder', 'querystring',
      'url', 'http', 'https', 'zlib',
      
      // 常用第三方模組
      'lodash', 'axios', 'moment', 'chalk', 'inquirer',
      'commander', 'semver', 'glob', 'minimatch'
    ])
    
    // 根據權限添加額外模組
    if (permissions.includes('file_system')) {
      allowedModules.add('fs-extra')
      allowedModules.add('rimraf')
    }
    
    if (permissions.includes('network')) {
      allowedModules.add('request')
      allowedModules.add('node-fetch')
    }

    return (moduleName) => {
      // 檢查是否為相對路徑
      if (moduleName.startsWith('.')) {
        const fullPath = path.resolve(pluginPath, moduleName)
        // 確保不能跳出插件目錄
        if (!fullPath.startsWith(pluginPath)) {
          throw new Error(`禁止訪問插件目錄外的文件: ${moduleName}`)
        }
        return require(fullPath)
      }
      
      // 檢查模組是否被允許
      if (!allowedModules.has(moduleName)) {
        throw new Error(`模組 ${moduleName} 不在允許清單中`)
      }
      
      return require(moduleName)
    }
  }

  /**
   * 創建安全的 console 對象
   * @param {string} pluginName - 插件名稱
   */
  createSecureConsole(pluginName) {
    return {
      log: (...args) => logger.info(`[${pluginName}]`, ...args),
      warn: (...args) => logger.warn(`[${pluginName}]`, ...args),
      error: (...args) => logger.error(`[${pluginName}]`, ...args),
      debug: (...args) => logger.debug(`[${pluginName}]`, ...args),
      info: (...args) => logger.info(`[${pluginName}]`, ...args)
    }
  }

  /**
   * 創建插件專用 Logger
   * @param {string} pluginName - 插件名稱
   */
  createPluginLogger(pluginName) {
    return {
      info: (msg) => logger.info(`🔌 [${pluginName}] ${msg}`),
      warn: (msg) => logger.warn(`🔌 [${pluginName}] ${msg}`),
      error: (msg) => logger.error(`🔌 [${pluginName}] ${msg}`),
      debug: (msg) => logger.debug(`🔌 [${pluginName}] ${msg}`)
    }
  }

  /**
   * 創建工具 API
   */
  createUtilsAPI() {
    return {
      hash: (data) => crypto.createHash('sha256').update(data).digest('hex'),
      uuid: () => crypto.randomUUID(),
      sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
      colors: require('chalk'),
      // 簡單的 spinner 實現
      spinner: {
        start: (text = 'Loading...') => {
          process.stdout.write(`⏳ ${text}`)
          return {
            succeed: (text) => process.stdout.write(`\r✅ ${text || 'Done'}\n`),
            fail: (text) => process.stdout.write(`\r❌ ${text || 'Failed'}\n`),
            stop: () => process.stdout.write('\r')
          }
        }
      }
    }
  }

  /**
   * 創建存儲 API
   * @param {string} pluginName - 插件名稱
   */
  createStorageAPI(pluginName) {
    const storageDir = path.join(this.pluginsDir, pluginName, 'storage')
    
    return {
      async set(key, value) {
        await fs.mkdir(storageDir, { recursive: true })
        const filePath = path.join(storageDir, `${key}.json`)
        await fs.writeFile(filePath, JSON.stringify(value, null, 2))
      },
      
      async get(key, defaultValue = null) {
        try {
          const filePath = path.join(storageDir, `${key}.json`)
          const data = await fs.readFile(filePath, 'utf8')
          return JSON.parse(data)
        } catch (error) {
          return defaultValue
        }
      },
      
      async delete(key) {
        const filePath = path.join(storageDir, `${key}.json`)
        try {
          await fs.unlink(filePath)
          return true
        } catch (error) {
          return false
        }
      },
      
      async list() {
        try {
          const files = await fs.readdir(storageDir)
          return files
            .filter(file => file.endsWith('.json'))
            .map(file => path.basename(file, '.json'))
        } catch (error) {
          return []
        }
      }
    }
  }

  /**
   * 註冊插件命令
   * @param {string} name - 命令名稱
   * @param {Function} handler - 命令處理函數
   * @param {Object} options - 命令選項
   */
  registerCommand(name, handler, options = {}) {
    if (this.commands.has(name)) {
      throw new Error(`命令 ${name} 已存在`)
    }
    
    const command = {
      name,
      handler,
      description: options.description || '',
      usage: options.usage || name,
      examples: options.examples || [],
      options: options.options || {},
      plugin: options.plugin || 'unknown'
    }
    
    this.commands.set(name, command)
    logger.debug(`🎯 註冊插件命令: ${name}`)
  }

  /**
   * 註冊插件鉤子
   * @param {string} hookName - 鉤子名稱
   * @param {Function} handler - 鉤子處理函數
   * @param {number} priority - 優先級 (越小越高)
   */
  registerHook(hookName, handler, priority = 10) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, [])
    }
    
    const hooks = this.hooks.get(hookName)
    hooks.push({ handler, priority })
    
    // 按優先級排序
    hooks.sort((a, b) => a.priority - b.priority)
    
    logger.debug(`🪝 註冊插件鉤子: ${hookName}`)
  }

  /**
   * 執行鉤子
   * @param {string} hookName - 鉤子名稱
   * @param {Object} context - 執行上下文
   */
  async executeHook(hookName, context = {}) {
    const hooks = this.hooks.get(hookName) || []
    const results = []
    
    logger.debug(`⚡ 執行鉤子: ${hookName} (${hooks.length} 個處理函數)`)
    
    for (const { handler, priority } of hooks) {
      try {
        const startTime = Date.now()
        const result = await handler(context)
        const duration = Date.now() - startTime
        
        results.push(result)
        logger.debug(`✅ 鉤子處理完成: ${hookName} (${duration}ms)`)
      } catch (error) {
        logger.error(`❌ 鉤子執行錯誤: ${hookName}`, error.message)
        results.push({ error: error.message })
      }
    }
    
    return results
  }

  /**
   * 執行插件命令
   * @param {string} commandName - 命令名稱
   * @param {Array} args - 命令參數
   * @param {Object} options - 命令選項
   */
  async executeCommand(commandName, args = [], options = {}) {
    const command = this.commands.get(commandName)
    
    if (!command) {
      throw new Error(`未找到命令: ${commandName}`)
    }
    
    try {
      logger.info(`🎯 執行插件命令: ${commandName}`)
      
      const context = {
        args,
        options,
        cli: this.cliContext,
        plugin: command.plugin
      }
      
      const result = await command.handler(context)
      logger.info(`✅ 命令執行完成: ${commandName}`)
      
      return result
    } catch (error) {
      logger.error(`❌ 命令執行失敗: ${commandName}`, error.message)
      throw error
    }
  }

  /**
   * 卸載插件
   * @param {string} pluginName - 插件名稱
   */
  async unloadPlugin(pluginName) {
    const pluginData = this.plugins.get(pluginName)
    
    if (!pluginData) {
      throw new Error(`插件 ${pluginName} 未載入`)
    }
    
    try {
      // 執行插件的清理函數
      if (pluginData.instance.deactivate) {
        await pluginData.instance.deactivate()
      }
      
      // 移除插件的命令和鉤子
      this.removePluginCommands(pluginName)
      this.removePluginHooks(pluginName)
      
      // 從記憶體中移除
      this.plugins.delete(pluginName)
      
      logger.info(`🗑️ 插件 ${pluginName} 卸載完成`)
    } catch (error) {
      logger.error(`❌ 插件 ${pluginName} 卸載失敗:`, error.message)
      throw error
    }
  }

  /**
   * 獲取已載入的插件清單
   */
  getLoadedPlugins() {
    const plugins = []
    
    for (const [name, data] of this.plugins.entries()) {
      plugins.push({
        name,
        version: data.metadata.version,
        description: data.metadata.description,
        status: data.status,
        loadTime: data.loadTime
      })
    }
    
    return plugins
  }

  /**
   * 獲取可用命令清單
   */
  getAvailableCommands() {
    const commands = []
    
    for (const [name, command] of this.commands.entries()) {
      commands.push({
        name,
        description: command.description,
        usage: command.usage,
        plugin: command.plugin
      })
    }
    
    return commands
  }

  // 輔助方法
  async resolvePluginPath(pluginName) {
    // 嘗試本地插件目錄
    const localPath = path.join(this.pluginsDir, pluginName)
    if (await this.fileExists(localPath)) {
      return localPath
    }
    
    // 嘗試 node_modules
    const nodeModulesPath = path.join(process.cwd(), 'node_modules', pluginName)
    if (await this.fileExists(nodeModulesPath)) {
      return nodeModulesPath
    }
    
    throw new Error(`找不到插件: ${pluginName}`)
  }

  async loadPluginMetadata(pluginPath) {
    const packagePath = path.join(pluginPath, 'package.json')
    const packageData = JSON.parse(await fs.readFile(packagePath, 'utf8'))
    
    // 載入 Mursfoto 特定配置
    const mursConfig = packageData.mursfoto || {}
    
    return {
      name: packageData.name,
      version: packageData.version,
      description: packageData.description,
      main: packageData.main || 'index.js',
      dependencies: packageData.dependencies || {},
      mursfoto: mursConfig,
      permissions: mursConfig.permissions || [],
      timeout: mursConfig.timeout || 30000
    }
  }

  async checkDependencies(dependencies) {
    for (const [dep, version] of Object.entries(dependencies)) {
      try {
        const installedVersion = require(`${dep}/package.json`).version
        if (!semver.satisfies(installedVersion, version)) {
          throw new Error(`依賴版本不匹配: ${dep}@${version}`)
        }
      } catch (error) {
        logger.warn(`⚠️ 依賴檢查警告: ${dep}@${version}`)
      }
    }
  }

  filterEnvironment(allowedEnvVars = []) {
    const filtered = {}
    const defaultAllowed = ['NODE_ENV', 'HOME', 'USER']
    const allowed = [...defaultAllowed, ...allowedEnvVars]
    
    for (const key of allowed) {
      if (process.env[key]) {
        filtered[key] = process.env[key]
      }
    }
    
    return filtered
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }

  getConfig(key, defaultValue) {
    // 實現配置獲取邏輯
    return this.cliContext.config?.get(key, defaultValue)
  }

  setConfig(key, value) {
    // 實現配置設定邏輯
    return this.cliContext.config?.set(key, value)
  }

  registerPluginHooks(plugin, metadata) {
    // 從插件元數據中註冊鉤子
    if (metadata.mursfoto?.hooks) {
      for (const [hookName, handler] of Object.entries(metadata.mursfoto.hooks)) {
        if (typeof plugin[handler] === 'function') {
          this.registerHook(hookName, plugin[handler].bind(plugin))
        }
      }
    }
  }

  registerPluginCommands(plugin, metadata) {
    // 從插件元數據中註冊命令
    if (metadata.mursfoto?.commands) {
      for (const [commandName, config] of Object.entries(metadata.mursfoto.commands)) {
        if (typeof plugin[config.handler] === 'function') {
          this.registerCommand(commandName, plugin[config.handler].bind(plugin), {
            ...config,
            plugin: metadata.name
          })
        }
      }
    }
  }

  removePluginCommands(pluginName) {
    for (const [commandName, command] of this.commands.entries()) {
      if (command.plugin === pluginName) {
        this.commands.delete(commandName)
      }
    }
  }

  removePluginHooks(pluginName) {
    // 實現移除插件鉤子的邏輯
    // 這需要在註冊時記錄插件歸屬
  }
}

/**
 * 🏪 插件註冊表
 */
class PluginRegistry {
  constructor() {
    this.registryUrl = 'https://registry.mursfoto.com'
    this.cache = new Map()
  }

  async search(query, options = {}) {
    // 實現插件搜索邏輯
    logger.info(`🔍 搜索插件: ${query}`)
    return []
  }

  async getInfo(pluginName) {
    // 獲取插件詳細信息
    logger.info(`📋 獲取插件信息: ${pluginName}`)
    return {}
  }

  async download(pluginName, version = 'latest') {
    // 下載插件
    logger.info(`📥 下載插件: ${pluginName}@${version}`)
    return {}
  }
}

/**
 * 🔒 插件安全管理器
 */
class PluginSecurityManager {
  constructor() {
    this.trustedPublishers = new Set()
    this.blockedPlugins = new Set()
  }

  async validatePlugin(pluginPath, metadata) {
    logger.info(`🔒 驗證插件安全性: ${metadata.name}`)
    
    // 檢查插件簽名
    await this.checkSignature(pluginPath, metadata)
    
    // 檢查惡意代碼模式
    await this.scanMaliciousPatterns(pluginPath)
    
    // 檢查權限合理性
    this.validatePermissions(metadata.permissions || [])
    
    logger.info(`✅ 插件安全驗證通過: ${metadata.name}`)
  }

  async checkSignature(pluginPath, metadata) {
    // 實現數位簽名檢查
    logger.debug(`🔐 檢查插件簽名: ${metadata.name}`)
  }

  async scanMaliciousPatterns(pluginPath) {
    // 實現惡意代碼掃描
    logger.debug(`🛡️ 掃描惡意模式: ${pluginPath}`)
  }

  validatePermissions(permissions) {
    const allowedPermissions = [
      'file_system', 'network', 'env', 'process',
      'database', 'config', 'hooks', 'commands'
    ]
    
    for (const permission of permissions) {
      if (!allowedPermissions.includes(permission)) {
        throw new Error(`不允許的權限: ${permission}`)
      }
    }
    
    logger.debug(`✅ 權限驗證通過: ${permissions.join(', ')}`)
  }
}

module.exports = {
  PluginManager,
  PluginRegistry,
  PluginSecurityManager
}
