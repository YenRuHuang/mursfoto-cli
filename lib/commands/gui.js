const chalk = require('chalk')
const GUIServer = require('../services/GUIServer')

/**
 * 🖥️ GUI 監控中心命令
 * 啟動 Web 介面來監控 AI 服務狀態
 */
class GUICommand {
  constructor () {
    this.server = null
  }

  /**
   * 🚀 執行 GUI 命令
   */
  async execute (options = {}) {
    try {
      console.log(chalk.blue('🖥️ 啟動 mursfoto-cli GUI 監控中心...'))

      const port = options.port || process.env.GUI_PORT || 12580
      const host = options.host || process.env.GUI_HOST || 'localhost'

      // 創建並啟動 GUI 服務器
      this.server = new GUIServer({ port, host })
      await this.server.start()

      console.log(chalk.green('\\n✅ GUI 監控中心已啟動'))
      console.log(chalk.cyan(`🌐 請訪問: http://${host}:${port}`))
      console.log(chalk.yellow('📊 即時監控所有 AI 服務狀態'))
      console.log(chalk.gray('💡 按 Ctrl+C 停止服務'))

      // 優雅關閉處理
      this.setupGracefulShutdown()

      // 保持進程運行
      return new Promise((resolve) => {
        // 進程將持續運行直到收到停止信號
        process.on('SIGINT', resolve)
        process.on('SIGTERM', resolve)
      })
    } catch (error) {
      console.error(chalk.red('❌ GUI 啟動失敗:'), error.message)
      throw error
    }
  }

  /**
   * 🛑 設置優雅關閉
   */
  setupGracefulShutdown () {
    const shutdown = async (signal) => {
      console.log(chalk.yellow(`\\n📡 收到 ${signal} 信號，正在關閉 GUI...`))

      if (this.server) {
        try {
          await this.server.stop()
          console.log(chalk.green('✅ GUI 已安全關閉'))
        } catch (error) {
          console.error(chalk.red('❌ GUI 關閉時出錯:'), error.message)
        }
      }

      process.exit(0)
    }

    process.on('SIGINT', () => shutdown('SIGINT'))
    process.on('SIGTERM', () => shutdown('SIGTERM'))

    // 處理未捕獲的異常
    process.on('uncaughtException', (error) => {
      console.error(chalk.red('❌ 未捕獲的異常:'), error)
      shutdown('uncaughtException')
    })

    process.on('unhandledRejection', (reason, promise) => {
      console.error(chalk.red('❌ 未處理的 Promise 拒絕:'), reason)
      shutdown('unhandledRejection')
    })
  }

  /**
   * 📋 取得命令說明
   */
  getDescription () {
    return '🖥️ 啟動 GUI 監控中心'
  }

  /**
   * 📋 取得使用範例
   */
  getExamples () {
    return [
      'mursfoto gui                    # 使用預設設定啟動 GUI',
      'mursfoto gui --port 8080       # 指定埠號',
      'mursfoto gui --host 0.0.0.0    # 允許外部連接'
    ]
  }
}

module.exports = GUICommand
