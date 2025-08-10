const logger = require('../utils/logger')

/**
 * 🔌 MCP (Model Context Protocol) 管理器
 * 統一管理所有 MCP 服務調用，提供標準化接口和回退機制
 */
class MCPManager {
  constructor () {
    this.availableMCPs = {
      filesystem: '@modelcontextprotocol/server-filesystem',
      memory: '@modelcontextprotocol/server-memory',
      database: 'enhanced-postgres-mcp-server',
      browser: 'puppeteer-mcp-server',
      vision: 'vision',
      github: '@modelcontextprotocol/server-github', // 已弃用但仍可用
      // 新安装的第三方 MCP 服务器
      notion: '@notionhq/notion-mcp-server',
      sentry: '@sentry/mcp-server',
      supabase: '@supabase/mcp-server-supabase',
      browserAgent: '@agent-infra/mcp-server-browser'
    }

    this.fallbackEnabled = process.env.MCP_FALLBACK !== 'false'
    this.retryCount = 3
    this.initialized = false
  }

  /**
   * 初始化 MCP 管理器
   */
  async initialize () {
    if (this.initialized) return

    logger.info('🔌 初始化 MCP 管理器...')

    // 檢查可用的 MCP 服務
    await this.checkAvailableServices()

    this.initialized = true
    logger.success('✅ MCP 管理器初始化完成')
  }

  /**
   * 檢查可用的 MCP 服務
   */
  async checkAvailableServices () {
    const availableServices = []

    for (const [serviceName, packageName] of Object.entries(this.availableMCPs)) {
      try {
        // 這裡可以添加實際的服務可用性檢查
        availableServices.push(serviceName)
        logger.debug(`✅ MCP 服務可用: ${serviceName} (${packageName})`)
      } catch (error) {
        logger.warn(`⚠️ MCP 服務不可用: ${serviceName}`)
      }
    }

    logger.info(`🔌 可用 MCP 服務: ${availableServices.join(', ')}`)
  }

  /**
   * 統一的 MCP 調用接口
   * @param {string} service - 服務名稱
   * @param {string} tool - 工具名稱
   * @param {Object} params - 參數
   * @returns {Promise<any>} 調用結果
   */
  async callMCP (service, tool, params = {}) {
    if (!this.initialized) {
      await this.initialize()
    }

    // 檢查是否在 Cline 環境中
    const isInClineEnvironment = typeof global !== 'undefined' && global.use_mcp_tool

    if (!isInClineEnvironment) {
      // 非 Cline 環境，直接使用回退實現（無錯誤日誌）
      logger.debug(`🔄 使用回退實現: ${service}.${tool}`)
      return await this.fallbackImplementation(service, tool, params, null)
    }

    // Cline 環境中的正常 MCP 調用流程
    logger.debug(`🔄 MCP 調用: ${service}.${tool}`)

    let lastError

    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        if (attempt > 1) {
          logger.debug(`🔄 MCP 重試 ${attempt}/${this.retryCount}: ${service}.${tool}`)
        }

        const result = await this.executeMCPCall(service, tool, params)
        logger.debug(`✅ MCP 調用成功: ${service}.${tool}`)
        return result
      } catch (error) {
        lastError = error
        logger.warn(`❌ MCP 調用失敗 (嘗試 ${attempt}): ${service}.${tool} - ${error.message}`)

        if (attempt < this.retryCount) {
          await this.sleep(1000 * attempt)
        }
      }
    }

    // 如果啟用回退機制，嘗試使用原有實現
    if (this.fallbackEnabled) {
      logger.warn(`🔄 MCP 調用失敗，嘗試回退機制: ${service}.${tool}`)
      return await this.fallbackImplementation(service, tool, params, lastError)
    }

    throw new Error(`MCP 調用最終失敗: ${service}.${tool} - ${lastError.message}`)
  }

  /**
   * 執行實際的 MCP 調用（需要與 Cline 整合）
   * @private
   */
  async executeMCPCall (service, tool, params) {
    // 在 Cline 環境中才會調用這個方法
    // eslint-disable-next-line camelcase
    return await global.use_mcp_tool(service, tool, params)
  }

  /**
   * 回退實現
   * @private
   */
  async fallbackImplementation (service, tool, params, originalError) {
    logger.info(`🔄 執行回退實現: ${service}.${tool}`)

    switch (service) {
      case 'filesystem':
        return await this.fallbackFileSystem(tool, params)
      case 'memory':
        return await this.fallbackMemory(tool, params)
      case 'database':
        return await this.fallbackDatabase(tool, params)
      case 'browser':
        return await this.fallbackBrowser(tool, params)
      case 'vision':
        return await this.fallbackVision(tool, params)
      case 'github':
        return await this.fallbackGitHub(tool, params)
      case 'notion':
        return await this.fallbackNotion(tool, params)
      case 'sentry':
        return await this.fallbackSentry(tool, params)
      case 'supabase':
        return await this.fallbackSupabase(tool, params)
      case 'browserAgent':
        return await this.fallbackBrowserAgent(tool, params)
      default:
        throw new Error(`無回退實現: ${service}.${tool}`)
    }
  }

  // ==================== 文件系統操作 ====================

  /**
   * 讀取文件
   * @param {string} path - 文件路徑
   * @returns {Promise<string>} 文件內容
   */
  async readFile (path) {
    return await this.callMCP('filesystem', 'read_file', { path })
  }

  /**
   * 寫入文件
   * @param {string} path - 文件路徑
   * @param {string} content - 文件內容
   */
  async writeFile (path, content) {
    return await this.callMCP('filesystem', 'write_file', { path, content })
  }

  /**
   * 列出目錄
   * @param {string} path - 目錄路徑
   */
  async listDirectory (path) {
    return await this.callMCP('filesystem', 'list_directory', { path })
  }

  /**
   * 創建目錄
   * @param {string} path - 目錄路徑
   */
  async createDirectory (path) {
    return await this.callMCP('filesystem', 'create_directory', { path })
  }

  /**
   * 文件系統操作回退實現
   * @private
   */
  async fallbackFileSystem (tool, params) {
    const fs = require('fs-extra')
    const path = require('path')

    switch (tool) {
      case 'read_file':
        return await fs.readFile(params.path, 'utf8')
      case 'write_file':
        await fs.ensureDir(path.dirname(params.path))
        return await fs.writeFile(params.path, params.content, 'utf8')
      case 'list_directory':
        return await fs.readdir(params.path)
      case 'create_directory':
        return await fs.ensureDir(params.path)
      default:
        throw new Error(`不支援的文件系統操作: ${tool}`)
    }
  }

  // ==================== 記憶系統 ====================

  /**
   * 儲存記憶
   * @param {string} content - 記憶內容
   * @param {Array} entities - 實體標籤
   * @param {Object} metadata - 元數據
   */
  async storeMemory (content, entities = [], metadata = {}) {
    return await this.callMCP('memory', 'create_memory', {
      content,
      entities,
      metadata: { ...metadata, timestamp: Date.now() }
    })
  }

  /**
   * 搜尋記憶
   * @param {string} query - 搜尋查詢
   * @param {number} limit - 結果限制
   */
  async searchMemories (query, limit = 10) {
    return await this.callMCP('memory', 'search_memories', { query, limit })
  }

  /**
   * 記憶系統回退實現
   * @private
   */
  async fallbackMemory (tool, params) {
    // 簡單的內存存儲作為回退
    if (!this.memoryStore) {
      this.memoryStore = []
    }

    switch (tool) {
      case 'create_memory': {
        const memory = {
          id: Date.now().toString(),
          content: params.content,
          entities: params.entities || [],
          metadata: params.metadata || {},
          createdAt: new Date()
        }
        this.memoryStore.push(memory)
        return memory
      }
      case 'search_memories':
        return this.memoryStore
          .filter(m => m.content.toLowerCase().includes(params.query.toLowerCase()))
          .slice(0, params.limit || 10)

      default:
        throw new Error(`不支援的記憶操作: ${tool}`)
    }
  }

  // ==================== 數據庫操作 ====================

  /**
   * 執行數據庫查詢
   * @param {string} query - SQL 查詢
   * @param {Array} params - 查詢參數
   */
  async queryDatabase (query, params = []) {
    return await this.callMCP('database', 'query', { query, params })
  }

  /**
   * 執行數據庫操作（插入、更新、刪除）
   * @param {string} query - SQL 操作
   * @param {Array} params - 操作參數
   */
  async executeDatabase (query, params = []) {
    return await this.callMCP('database', 'execute', { query, params })
  }

  /**
   * 數據庫操作回退實現
   * @private
   */
  async fallbackDatabase (tool, params) {
    logger.warn('⚠️ 數據庫 MCP 不可用，使用內存存儲')

    // 這裡可以整合現有的數據庫連接邏輯
    // 或者使用 SQLite 作為回退
    throw new Error('數據庫回退實現待完成')
  }

  // ==================== 瀏覽器自動化 ====================

  /**
   * 訪問網頁
   * @param {string} url - 網頁地址
   */
  async navigateTo (url) {
    return await this.callMCP('browser', 'goto', { url })
  }

  /**
   * 截圖
   * @param {Object} options - 截圖選項
   */
  async takeScreenshot (options = {}) {
    return await this.callMCP('browser', 'screenshot', options)
  }

  /**
   * 點擊元素
   * @param {string} selector - CSS 選擇器
   */
  async clickElement (selector) {
    return await this.callMCP('browser', 'click', { selector })
  }

  /**
   * 瀏覽器操作回退實現
   * @private
   */
  async fallbackBrowser (tool, params) {
    // 使用原有的 Puppeteer 邏輯
    // const puppeteer = require('puppeteer')

    // 這裡需要整合原有的瀏覽器自動化邏輯
    throw new Error('瀏覽器回退實現待完成')
  }

  // ==================== 圖像分析 ====================

  /**
   * 分析圖像
   * @param {string} imagePath - 圖片路徑
   * @param {string} analysisType - 分析類型（ocr, describe, ui_elements）
   */
  async analyzeImage (imagePath, analysisType = 'describe') {
    return await this.callMCP('vision', 'analyze_image', {
      image_path: imagePath,
      analysis_type: analysisType
    })
  }

  /**
   * 桌面截圖
   * @param {string} analysisType - 分析類型
   * @param {string} savePath - 保存路徑（可選）
   */
  async captureDesktop (analysisType = 'describe', savePath = null) {
    return await this.callMCP('vision', 'screenshot_desktop', {
      analysis_type: analysisType,
      save_path: savePath
    })
  }

  /**
   * 視覺分析回退實現
   * @private
   */
  async fallbackVision (tool, params) {
    throw new Error('視覺分析需要專門的 MCP 服務')
  }

  // ==================== GitHub 操作 ====================

  /**
   * 創建倉庫
   * @param {Object} options - 倉庫選項
   */
  async createRepository (options) {
    return await this.callMCP('github', 'create_repository', options)
  }

  /**
   * 創建 Issue
   * @param {Object} issueData - Issue 數據
   */
  async createIssue (issueData) {
    return await this.callMCP('github', 'create_issue', issueData)
  }

  /**
   * GitHub 操作回退實現
   * @private
   */
  async fallbackGitHub (tool, params) {
    // 使用原有的 GitHubAutomation 類
    const GitHubAutomation = require('../services/GitHubAutomation')
    const github = new GitHubAutomation()

    switch (tool) {
      case 'create_repository':
        return await github.createRepository(params)
      case 'create_issue':
        return await github.createIssue(params)
      default:
        throw new Error(`不支援的 GitHub 操作: ${tool}`)
    }
  }

  // ==================== 輔助方法 ====================

  /**
   * 延遲執行
   * @private
   */
  async sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 獲取可用服務列表
   */
  getAvailableServices () {
    return Object.keys(this.availableMCPs)
  }

  /**
   * 檢查服務是否可用
   * @param {string} serviceName - 服務名稱
   */
  isServiceAvailable (serviceName) {
    return Object.prototype.hasOwnProperty.call(this.availableMCPs, serviceName)
  }

  /**
   * 獲取服務統計信息
   */
  getStats () {
    return {
      availableServices: this.getAvailableServices().length,
      fallbackEnabled: this.fallbackEnabled,
      retryCount: this.retryCount,
      initialized: this.initialized
    }
  }

  /**
   * 設置配置
   * @param {Object} config - 配置選項
   */
  configure (config = {}) {
    if (config.fallbackEnabled !== undefined) {
      this.fallbackEnabled = config.fallbackEnabled
    }
    if (config.retryCount !== undefined) {
      this.retryCount = config.retryCount
    }

    logger.info('🔧 MCP 管理器配置已更新', config)
  }

  // ==================== 新增第三方服務回退方法 ====================

  async fallbackNotion (tool, params) {
    logger.warn('⚠️ Notion MCP 需要在 Cline 環境中運行')
    throw new Error('Notion 操作需要 MCP 服務')
  }

  async fallbackSentry (tool, params) {
    logger.warn('⚠️ Sentry MCP 需要在 Cline 環境中運行')
    throw new Error('Sentry 操作需要 MCP 服務')
  }

  async fallbackSupabase (tool, params) {
    logger.warn('⚠️ Supabase MCP 需要在 Cline 環境中運行')
    throw new Error('Supabase 操作需要 MCP 服務')
  }

  async fallbackBrowserAgent (tool, params) {
    logger.warn('⚠️ Browser Agent MCP 需要在 Cline 環境中運行')
    throw new Error('Browser Agent 操作需要 MCP 服務')
  }
}

module.exports = MCPManager
