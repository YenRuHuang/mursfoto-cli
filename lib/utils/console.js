const chalk = require('chalk')

/**
 * Console 工具類 - 專為 Output Styles 設計
 */
class Console {
  constructor () {
    this.prefix = '🎨 STYLE'
  }

  /**
   * 普通日誌輸出
   */
  log (...args) {
    console.log(...args)
  }

  /**
   * 信息日誌 - 藍色
   */
  info (...args) {
    console.log(chalk.blue(`[${this.prefix}]`), ...args)
  }

  /**
   * 成功日誌 - 綠色
   */
  success (...args) {
    console.log(chalk.green(`[${this.prefix}] ✅`), ...args)
  }

  /**
   * 警告日誌 - 黃色
   */
  warn (...args) {
    console.log(chalk.yellow(`[${this.prefix}] ⚠️`), ...args)
  }

  /**
   * 錯誤日誌 - 紅色
   */
  error (...args) {
    console.error(chalk.red(`[${this.prefix}] ❌`), ...args)
  }

  /**
   * 調試日誌 - 灰色
   */
  debug (...args) {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
      console.log(chalk.gray(`[${this.prefix}] 🔧`), ...args)
    }
  }

  /**
   * 高亮日誌 - 品紅色
   */
  highlight (...args) {
    console.log(chalk.magenta.bold(`[${this.prefix}] ⭐`), ...args)
  }
}

module.exports = { Console }
