#!/usr/bin/env node

const chalk = require('chalk')
const gradient = require('gradient-string')
const { createProject } = require('../lib/commands/create')

// 解析命令行參數
const args = process.argv.slice(2)
const projectName = args[0]

// 解析選項
const options = {
  template: 'minimal',
  directory: '.',
  force: false,
  install: true,
  git: true,
  gateway: true
}

// 解析命令行選項
for (let i = 1; i < args.length; i++) {
  const arg = args[i]

  if (arg === '--template' || arg === '-t') {
    options.template = args[++i]
  } else if (arg === '--directory' || arg === '-d') {
    options.directory = args[++i]
  } else if (arg === '--force' || arg === '-f') {
    options.force = true
  } else if (arg === '--no-install') {
    options.install = false
  } else if (arg === '--no-git') {
    options.git = false
  } else if (arg === '--no-gateway') {
    options.gateway = false
  } else if (arg === '--help' || arg === '-h') {
    showHelp()
    process.exit(0)
  }
}

function showHelp () {
  const title = '🚀 @mursfoto/create-project'
  console.log(gradient.pastel(title))
  console.log(chalk.cyan('\n快速創建 Mursfoto 服務項目\n'))

  console.log(chalk.white.bold('使用方式:'))
  console.log('  npx @mursfoto/create-project <project-name> [options]\n')

  console.log(chalk.white.bold('參數:'))
  console.log('  project-name              項目名稱\n')

  console.log(chalk.white.bold('選項:'))
  console.log('  -t, --template <template> 使用指定模板 (minimal, calculator, test-tool, api-service)')
  console.log('  -d, --directory <path>    指定創建目錄 (默認: .)')
  console.log('  -f, --force              覆蓋已存在的目錄')
  console.log('  --no-install             跳過依賴安裝')
  console.log('  --no-git                 跳過 Git 初始化')
  console.log('  --no-gateway             跳過 Gateway 註冊')
  console.log('  -h, --help               顯示幫助資訊\n')

  console.log(chalk.white.bold('範例:'))
  console.log('  npx @mursfoto/create-project my-calculator --template=calculator')
  console.log('  npx @mursfoto/create-project my-api --template=api-service --no-gateway\n')

  console.log(chalk.white.bold('可用模板:'))
  console.log('  minimal      📦 最小化模板 (Express + 基本功能)')
  console.log('  calculator   🧮 計算器模板 (基於 tw-life-formula)')
  console.log('  test-tool    🧪 測試工具模板 (完整測試配置)')
  console.log('  api-service  🌐 API 服務模板 (RESTful API)\n')
}

// 主執行函數
async function main () {
  try {
    if (!projectName) {
      console.log(chalk.red('❌ 錯誤: 請提供項目名稱\n'))
      showHelp()
      process.exit(1)
    }

    // 顯示歡迎訊息
    console.log(gradient.pastel('🚀 @mursfoto/create-project'))
    console.log(chalk.cyan(`\n正在創建項目: ${chalk.white.bold(projectName)}`))
    console.log(chalk.gray(`模板: ${options.template}\n`))

    // 執行項目創建
    await createProject(projectName, options)
  } catch (error) {
    console.error(chalk.red('\n❌ 創建項目失敗:'), error.message)
    console.log(chalk.gray('\n💡 請檢查錯誤訊息並重試，或使用 `mursfoto doctor` 檢查環境\n'))
    process.exit(1)
  }
}

// 錯誤處理
process.on('uncaughtException', (error) => {
  console.error(chalk.red('\n❌ 未捕獲的錯誤:'), error.message)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('\n❌ 未處理的 Promise 拒絕:'), reason)
  process.exit(1)
})

// 執行主函數
main()
