const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')
const logger = require('./logger')

/**
 * 驗證項目名稱
 */
function validateProjectName (name) {
  if (!name || typeof name !== 'string') {
    return false
  }

  // 只允許字母、數字、連字符和下劃線，且不能以數字開頭
  return /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name)
}

/**
 * 確保目錄存在，如果需要則創建
 */
async function ensureDirectoryExists (dirPath, force = false) {
  try {
    if (fs.existsSync(dirPath)) {
      if (force) {
        await fs.remove(dirPath)
        await fs.ensureDir(dirPath)
        return true
      } else {
        // 如果目錄已存在且不強制覆蓋，直接返回成功
        return true
      }
    }

    await fs.ensureDir(dirPath)
    return true
  } catch (error) {
    throw error
  }
}

/**
 * 複製文件並處理模板變數
 */
async function copyFileWithTemplate (sourcePath, targetPath, templateData) {
  try {
    const content = await fs.readFile(sourcePath, 'utf8')
    const processedContent = processTemplateString(content, templateData)

    // 確保目標目錄存在
    await fs.ensureDir(path.dirname(targetPath))

    // 寫入處理後的內容
    await fs.writeFile(targetPath, processedContent, 'utf8')

    // 複製文件權限
    const stats = await fs.stat(sourcePath)
    await fs.chmod(targetPath, stats.mode)

    return true
  } catch (error) {
    console.warn(chalk.yellow(`警告: 無法處理文件 ${sourcePath}: ${error.message}`))
    return false
  }
}

/**
 * 處理模板字符串
 */
function processTemplateString (content, data) {
  const Handlebars = require('handlebars')

  // 註冊助手函數
  Handlebars.registerHelper('camelCase', function (str) {
    return str.replace(/[-_\s](.)/g, (_, char) => char.toUpperCase())
  })

  Handlebars.registerHelper('kebabCase', function (str) {
    return str.toLowerCase().replace(/[_\s]+/g, '-')
  })

  Handlebars.registerHelper('pascalCase', function (str) {
    return str.replace(/[-_\s](.)/g, (_, char) => char.toUpperCase())
      .replace(/^./, char => char.toUpperCase())
  })

  Handlebars.registerHelper('upperCase', function (str) {
    return str.toUpperCase()
  })

  Handlebars.registerHelper('lowerCase', function (str) {
    return str.toLowerCase()
  })

  try {
    const template = Handlebars.compile(content)
    return template(data)
  } catch (error) {
    console.warn(chalk.yellow(`模板處理警告: ${error.message}`))
    return content
  }
}

/**
 * 檢查命令是否可用
 */
function isCommandAvailable (command) {
  const { execSync } = require('child_process')
  try {
    execSync(`which ${command}`, { stdio: 'ignore' })
    return true
  } catch {
    try {
      execSync(`where ${command}`, { stdio: 'ignore' })
      return true
    } catch {
      return false
    }
  }
}

/**
 * 檢查 Node.js 版本
 */
function checkNodeVersion (minVersion = '18.0.0') {
  const semver = require('semver')
  const currentVersion = process.version

  if (!semver.gte(currentVersion, minVersion)) {
    throw new Error(`Node.js 版本過低。當前版本: ${currentVersion}，需要版本: >= ${minVersion}`)
  }

  return true
}

/**
 * 獲取系統資訊
 */
function getSystemInfo () {
  const os = require('os')
  return {
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version,
    npmVersion: getNpmVersion(),
    homeDir: os.homedir(),
    tmpDir: os.tmpdir(),
    cpus: os.cpus().length,
    memory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + 'GB'
  }
}

/**
 * 獲取 npm 版本
 */
function getNpmVersion () {
  const { execSync } = require('child_process')
  try {
    return execSync('npm --version', { encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
}

/**
 * 格式化文件大小
 */
function formatBytes (bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * 生成隨機字符串
 */
function generateRandomString (length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 睡眠函數
 */
function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 安全的 JSON 解析
 */
function safeJsonParse (str, defaultValue = null) {
  try {
    return JSON.parse(str)
  } catch {
    return defaultValue
  }
}

/**
 * 檢查是否為有效的 URL
 */
function isValidUrl (string) {
  try {
    new URL(string)
    return true
  } catch {
    return false
  }
}

/**
 * 清理文件路徑
 */
function cleanPath (filePath) {
  return path.normalize(filePath.replace(/\\/g, '/'))
}

/**
 * 獲取相對路徑
 */
function getRelativePath (from, to) {
  return path.relative(from, to)
}

// 日誌函數的便捷封裝
function logSuccess (message) {
  logger.success(message)
}

function logError (message) {
  logger.error(message)
}

function logInfo (message) {
  logger.info(message)
}

function logWarning (message) {
  logger.warn(message)
}

module.exports = {
  validateProjectName,
  ensureDirectoryExists,
  copyFileWithTemplate,
  processTemplateString,
  isCommandAvailable,
  checkNodeVersion,
  getSystemInfo,
  getNpmVersion,
  formatBytes,
  generateRandomString,
  sleep,
  safeJsonParse,
  isValidUrl,
  cleanPath,
  getRelativePath,
  logger,
  logSuccess,
  logError,
  logInfo,
  logWarning
}
