/**
 * @mursfoto/core - MursPhoto CLI 核心包
 * 提供插件系統、命令註冊和核心功能
 */

import { PluginManager } from './lib/PluginManager.js'
import { CommandRegistry } from './lib/CommandRegistry.js'
import { CoreUtils } from './lib/utils/index.js'

/**
 * MursPhoto CLI 核心類別
 * 負責管理插件系統和命令註冊
 */
export class MursPhotoCore {
  constructor (options = {}) {
    this.pluginManager = new PluginManager(options.pluginConfig)
    this.commandRegistry = new CommandRegistry(options.commandConfig)
    this.utils = CoreUtils

    // 配置選項
    this.config = {
      autoLoadPlugins: options.autoLoadPlugins ?? true,
      verbose: options.verbose ?? false,
      ...options
    }
  }

  /**
   * 初始化核心系統
   */
  async initialize () {
    try {
      if (this.config.verbose) {
        console.log('🚀 正在初始化 MursPhoto CLI 核心系統...')
      }

      // 初始化命令註冊器
      await this.commandRegistry.initialize()

      // 自動載入插件
      if (this.config.autoLoadPlugins) {
        await this.pluginManager.autoLoadPlugins()
      }

      if (this.config.verbose) {
        console.log('✅ MursPhoto CLI 核心系統初始化完成')
      }

      return true
    } catch (error) {
      console.error('❌ 核心系統初始化失敗:', error.message)
      throw error
    }
  }

  /**
   * 載入插件
   */
  async loadPlugin (pluginName, options = {}) {
    return await this.pluginManager.loadPlugin(pluginName, options)
  }

  /**
   * 註冊命令
   */
  registerCommand (command, handler, options = {}) {
    return this.commandRegistry.register(command, handler, options)
  }

  /**
   * 執行命令
   */
  async executeCommand (commandName, args = [], options = {}) {
    return await this.commandRegistry.execute(commandName, args, options)
  }

  /**
   * 取得已載入的插件列表
   */
  getLoadedPlugins () {
    return this.pluginManager.getLoadedPlugins()
  }

  /**
   * 取得已註冊的命令列表
   */
  getRegisteredCommands () {
    return this.commandRegistry.getRegisteredCommands()
  }

  /**
   * 取得系統狀態
   */
  getStatus () {
    return {
      coreVersion: '1.0.0',
      loadedPlugins: this.getLoadedPlugins().length,
      registeredCommands: this.getRegisteredCommands().length,
      config: this.config
    }
  }
}

// 預設匯出
export default MursPhotoCore

// 便利函式
export const createCore = (options = {}) => new MursPhotoCore(options)

// 重新匯出核心組件
export { PluginManager } from './lib/PluginManager.js'
export { CommandRegistry } from './lib/CommandRegistry.js'
export { CoreUtils } from './lib/utils/index.js'
