const chalk = require('chalk');

/**
 * 智能 Logger 工具類
 */
class Logger {
  constructor() {
    this.prefix = '🚀 MURSFOTO';
  }

  /**
   * 信息日誌 - 藍色
   */
  info(...args) {
    console.log(chalk.blue(`[${this.prefix}]`), ...args);
  }

  /**
   * 成功日誌 - 綠色
   */
  success(...args) {
    console.log(chalk.green(`[${this.prefix}] ✅`), ...args);
  }

  /**
   * 警告日誌 - 黃色
   */
  warn(...args) {
    console.log(chalk.yellow(`[${this.prefix}] ⚠️`), ...args);
  }

  /**
   * 錯誤日誌 - 紅色
   */
  error(...args) {
    console.error(chalk.red(`[${this.prefix}] ❌`), ...args);
  }

  /**
   * 調試日誌 - 灰色
   */
  debug(...args) {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
      console.log(chalk.gray(`[${this.prefix}] 🔧`), ...args);
    }
  }

  /**
   * 高亮日誌 - 品紅色
   */
  highlight(...args) {
    console.log(chalk.magenta.bold(`[${this.prefix}] ⭐`), ...args);
  }

  /**
   * 進度日誌 - 青色
   */
  progress(...args) {
    console.log(chalk.cyan(`[${this.prefix}] ⏳`), ...args);
  }

  /**
   * 系統日誌 - 白色背景黑字
   */
  system(...args) {
    console.log(chalk.bgWhite.black(`[${this.prefix}] 🖥️`), ...args);
  }
}

// 創建單例實例
const logger = new Logger();

module.exports = logger;
