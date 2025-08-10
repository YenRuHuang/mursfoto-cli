const fs = require('fs-extra')
const path = require('path')
const os = require('os')
const chalk = require('chalk')
const inquirer = require('inquirer')

/**
 * CLI 配置文件路徑
 */
const CONFIG_DIR = path.join(os.homedir(), '.mursfoto')
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json')

/**
 * 默認配置
 */
const DEFAULT_CONFIG = {
  gatewayUrl: 'https://gateway.mursfoto.com',
  gatewayPath: '../mursfoto-api-gateway',
  defaultTemplate: 'minimal',
  autoCommit: true,
  autoPush: false,
  verbose: false,
  checkUpdates: true
}

/**
 * 獲取配置
 */
async function getConfig (key) {
  try {
    const config = await loadConfig()

    if (key) {
      if (config.hasOwnProperty(key)) {
        console.log(chalk.cyan(`${key}: ${chalk.white(config[key])}`))
      } else {
        console.log(chalk.red(`❌ 配置項 "${key}" 不存在`))
        console.log(chalk.gray('💡 使用 `mursfoto config get` 查看所有配置'))
      }
    } else {
      console.log(chalk.cyan('\n⚙️ 當前配置:\n'))

      Object.entries(config).forEach(([key, value]) => {
        const displayValue = typeof value === 'boolean'
          ? (value ? chalk.green('true') : chalk.red('false'))
          : chalk.white(value)
        console.log(`  ${chalk.cyan(key)}: ${displayValue}`)
      })

      console.log(chalk.gray('\n💡 使用 `mursfoto config set <key> <value>` 修改配置'))
    }

    console.log('')
  } catch (error) {
    console.error(chalk.red(`❌ 獲取配置失敗: ${error.message}`))
    process.exit(1)
  }
}

/**
 * 設置配置
 */
async function setConfig (key, value) {
  try {
    if (!key || value === undefined) {
      console.log(chalk.red('❌ 請提供配置鍵和值'))
      console.log(chalk.gray('使用方式: mursfoto config set <key> <value>'))
      return
    }

    const config = await loadConfig()

    // 驗證配置鍵
    if (!DEFAULT_CONFIG.hasOwnProperty(key)) {
      console.log(chalk.red(`❌ 無效的配置項: ${key}`))
      console.log(chalk.gray('可用配置項:'))
      Object.keys(DEFAULT_CONFIG).forEach(k => {
        console.log(chalk.gray(`  ${k}`))
      })
      return
    }

    // 類型轉換
    const oldValue = config[key]
    let newValue = value

    if (typeof DEFAULT_CONFIG[key] === 'boolean') {
      if (value.toLowerCase() === 'true') {
        newValue = true
      } else if (value.toLowerCase() === 'false') {
        newValue = false
      } else {
        console.log(chalk.red('❌ 布林值配置只能設置為 \'true\' 或 \'false\''))
        return
      }
    } else if (typeof DEFAULT_CONFIG[key] === 'number') {
      newValue = parseInt(value)
      if (isNaN(newValue)) {
        console.log(chalk.red('❌ 數字配置只能設置為有效數字'))
        return
      }
    }

    config[key] = newValue
    await saveConfig(config)

    const displayOldValue = typeof oldValue === 'boolean'
      ? (oldValue ? chalk.green('true') : chalk.red('false'))
      : chalk.gray(oldValue)
    const displayNewValue = typeof newValue === 'boolean'
      ? (newValue ? chalk.green('true') : chalk.red('false'))
      : chalk.white(newValue)

    console.log(chalk.green('✅ 配置已更新'))
    console.log(`  ${chalk.cyan(key)}: ${displayOldValue} → ${displayNewValue}\n`)
  } catch (error) {
    console.error(chalk.red(`❌ 設置配置失敗: ${error.message}`))
    process.exit(1)
  }
}

/**
 * 重置配置
 */
async function resetConfig () {
  try {
    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: '確定要重置所有配置到默認值？',
        default: false
      }
    ])

    if (!confirmed) {
      console.log(chalk.yellow('👋 操作已取消'))
      return
    }

    await saveConfig(DEFAULT_CONFIG)

    console.log(chalk.green('✅ 配置已重置為默認值'))
    console.log(chalk.gray('💡 使用 `mursfoto config get` 查看當前配置\n'))
  } catch (error) {
    console.error(chalk.red(`❌ 重置配置失敗: ${error.message}`))
    process.exit(1)
  }
}

/**
 * 加載配置
 */
async function loadConfig () {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      await saveConfig(DEFAULT_CONFIG)
      return DEFAULT_CONFIG
    }

    const config = await fs.readJson(CONFIG_FILE)

    // 合併新的默認配置項
    const mergedConfig = { ...DEFAULT_CONFIG, ...config }

    // 如果配置有新增項目，保存更新後的配置
    if (Object.keys(mergedConfig).length !== Object.keys(config).length) {
      await saveConfig(mergedConfig)
    }

    return mergedConfig
  } catch (error) {
    console.warn(chalk.yellow('⚠️ 配置文件損壞，使用默認配置'))
    await saveConfig(DEFAULT_CONFIG)
    return DEFAULT_CONFIG
  }
}

/**
 * 保存配置
 */
async function saveConfig (config) {
  try {
    await fs.ensureDir(CONFIG_DIR)
    await fs.writeJson(CONFIG_FILE, config, { spaces: 2 })
  } catch (error) {
    throw new Error(`無法保存配置文件: ${error.message}`)
  }
}

/**
 * 獲取配置值（供其他模塊使用）
 */
async function getConfigValue (key, defaultValue = null) {
  try {
    const config = await loadConfig()
    return config[key] !== undefined ? config[key] : defaultValue
  } catch (error) {
    return defaultValue
  }
}

module.exports = {
  getConfig,
  setConfig,
  resetConfig,
  loadConfig,
  getConfigValue
}
