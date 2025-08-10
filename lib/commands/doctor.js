const chalk = require('chalk')
const ora = require('ora')
const boxen = require('boxen')
const { checkNodeVersion, getSystemInfo, isCommandAvailable } = require('../utils/helpers')
const { checkGatewayStatus, checkLocalGatewayStatus } = require('../utils/gateway')

/**
 * 環境診斷
 */
async function runDoctor () {
  console.log(chalk.cyan('\n🏥 Mursfoto CLI 環境診斷\n'))

  const results = {
    system: [],
    dependencies: [],
    gateway: [],
    recommendations: []
  }

  // 系統檢查
  await checkSystem(results)

  // 依賴檢查
  await checkDependencies(results)

  // Gateway 檢查
  await checkGateway(results)

  // 顯示結果
  displayResults(results)
}

/**
 * 系統環境檢查
 */
async function checkSystem (results) {
  const spinner = ora('🔍 檢查系統環境...').start()

  try {
    // Node.js 版本檢查
    try {
      checkNodeVersion('18.0.0')
      results.system.push({
        name: 'Node.js 版本',
        status: 'success',
        value: process.version,
        message: '✅ 版本符合要求 (>= 18.0.0)'
      })
    } catch (error) {
      results.system.push({
        name: 'Node.js 版本',
        status: 'error',
        value: process.version,
        message: `❌ ${error.message}`
      })
      results.recommendations.push('請升級 Node.js 到 18.0.0 或更高版本')
    }

    // 系統資訊
    const systemInfo = getSystemInfo()
    results.system.push({
      name: '系統平台',
      status: 'info',
      value: `${systemInfo.platform} ${systemInfo.arch}`,
      message: '📋 系統資訊'
    })

    results.system.push({
      name: '記憶體',
      status: 'info',
      value: systemInfo.memory,
      message: '💾 系統記憶體'
    })

    results.system.push({
      name: 'CPU 核心',
      status: 'info',
      value: systemInfo.cpus,
      message: '⚡ CPU 核心數'
    })

    spinner.succeed('🔍 系統環境檢查完成')
  } catch (error) {
    spinner.fail(`🔍 系統檢查失敗: ${error.message}`)
  }
}

/**
 * 依賴檢查
 */
async function checkDependencies (results) {
  const spinner = ora('📦 檢查依賴工具...').start()

  const tools = [
    { name: 'npm', required: true, description: 'Node 套件管理器' },
    { name: 'git', required: true, description: 'Git 版本控制' },
    { name: 'curl', required: false, description: 'HTTP 客戶端工具' },
    { name: 'docker', required: false, description: 'Docker 容器平台' }
  ]

  for (const tool of tools) {
    const available = isCommandAvailable(tool.name)

    results.dependencies.push({
      name: tool.name,
      status: available ? 'success' : (tool.required ? 'error' : 'warning'),
      value: available ? '已安裝' : '未安裝',
      message: available
        ? `✅ ${tool.description}`
        : `${tool.required ? '❌' : '⚠️'} ${tool.description}`
    })

    if (!available && tool.required) {
      results.recommendations.push(`請安裝 ${tool.name}: ${tool.description}`)
    }
  }

  spinner.succeed('📦 依賴檢查完成')
}

/**
 * Gateway 檢查
 */
async function checkGateway (results) {
  const spinner = ora('🌐 檢查 Gateway 連接...').start()

  try {
    // 檢查線上 Gateway
    const gatewayStatus = await checkGatewayStatus()
    results.gateway.push({
      name: 'Gateway 服務',
      status: gatewayStatus.online ? 'success' : 'error',
      value: gatewayStatus.online ? '線上' : '離線',
      message: gatewayStatus.online
        ? '✅ Gateway 服務正常運行'
        : `❌ 無法連接 Gateway: ${gatewayStatus.error}`
    })

    // 檢查本地 Gateway 項目
    const localStatus = await checkLocalGatewayStatus()
    results.gateway.push({
      name: '本地 Gateway 項目',
      status: localStatus.exists ? 'success' : 'warning',
      value: localStatus.exists ? '已找到' : '未找到',
      message: localStatus.exists
        ? `✅ 項目位置: ${localStatus.path}`
        : `⚠️ 未找到本地 Gateway 項目: ${localStatus.path}`
    })

    if (localStatus.exists && localStatus.package) {
      results.gateway.push({
        name: 'Gateway 版本',
        status: 'info',
        value: localStatus.package.version || 'unknown',
        message: `📋 ${localStatus.package.name}`
      })
    }

    if (localStatus.exists && localStatus.git) {
      results.gateway.push({
        name: 'Git 狀態',
        status: localStatus.git.modified > 0 ? 'warning' : 'success',
        value: `${localStatus.git.branch} (${localStatus.git.modified} modified)`,
        message: localStatus.git.modified > 0
          ? '⚠️ 有未提交的變更'
          : '✅ Git 狀態正常'
      })
    }

    if (!localStatus.exists) {
      results.recommendations.push('請確保 mursfoto-api-gateway 項目位於正確位置 (../mursfoto-api-gateway)')
    }

    spinner.succeed('🌐 Gateway 檢查完成')
  } catch (error) {
    spinner.fail(`🌐 Gateway 檢查失敗: ${error.message}`)
    results.gateway.push({
      name: 'Gateway 檢查',
      status: 'error',
      value: '失敗',
      message: `❌ ${error.message}`
    })
  }
}

/**
 * 顯示診斷結果
 */
function displayResults (results) {
  console.log('\n')

  // 系統環境
  console.log(chalk.white.bold('🖥  系統環境'))
  displaySection(results.system)

  // 依賴工具
  console.log(chalk.white.bold('📦 依賴工具'))
  displaySection(results.dependencies)

  // Gateway 狀態
  console.log(chalk.white.bold('🌐 Gateway 狀態'))
  displaySection(results.gateway)

  // 建議
  if (results.recommendations.length > 0) {
    console.log(chalk.white.bold('💡 建議'))
    results.recommendations.forEach((rec, index) => {
      console.log(chalk.yellow(`  ${index + 1}. ${rec}`))
    })
    console.log('')
  }

  // 整體狀態評估
  const hasErrors = [
    ...results.system,
    ...results.dependencies,
    ...results.gateway
  ].some(item => item.status === 'error')

  const statusMessage = hasErrors
    ? '❌ 發現問題需要修復'
    : '✅ 環境檢查通過'

  console.log(boxen(statusMessage, {
    padding: 1,
    borderColor: hasErrors ? 'red' : 'green',
    borderStyle: 'round',
    align: 'center'
  }))

  console.log('')
}

/**
 * 顯示檢查結果區段
 */
function displaySection (items) {
  items.forEach(item => {
    const statusIcon = getStatusIcon(item.status)
    const valueColor = getStatusColor(item.status)

    console.log(`  ${statusIcon} ${chalk.white(item.name)}: ${chalk[valueColor](item.value)}`)
    if (item.message) {
      console.log(`    ${chalk.gray(item.message)}`)
    }
  })
  console.log('')
}

/**
 * 獲取狀態圖示
 */
function getStatusIcon (status) {
  switch (status) {
    case 'success': return '✅'
    case 'error': return '❌'
    case 'warning': return '⚠️'
    case 'info': return 'ℹ️'
    default: return '•'
  }
}

/**
 * 獲取狀態顏色
 */
function getStatusColor (status) {
  switch (status) {
    case 'success': return 'green'
    case 'error': return 'red'
    case 'warning': return 'yellow'
    case 'info': return 'cyan'
    default: return 'gray'
  }
}

module.exports = {
  runDoctor
}
