#!/usr/bin/env node

const { program } = require('commander')
const chalk = require('chalk')
const figlet = require('figlet')
const pkg = require('../package.json')

// 引入命令
const { createProject } = require('../lib/commands/create')
const { aiCommand } = require('../lib/commands/ai')

// 顯示歡迎信息
function showWelcome() {
  console.log(
    chalk.cyan(
      figlet.textSync('Mursfoto CLI', { horizontalLayout: 'full' })
    )
  )
  console.log(chalk.yellow(`🚀 Mursfoto AutoDev Factory ${pkg.version}`))
  console.log(chalk.gray('Claude Code AI 代理深度整合 + 統一架構的智慧自動化開發工具\n'))
}

// 設定程序信息
program
  .name('mursfoto')
  .description(pkg.description)
  .version(pkg.version, '-v, --version', '顯示版本信息')
  .helpOption('-h, --help', '顯示幫助信息')

// create 命令
program
  .command('create [name]')
  .description('創建新的 Mursfoto 服務項目')
  .option('-t, --template <template>', '使用指定模板 (minimal, enterprise-production, n8n)')
  .option('-d, --directory <dir>', '指定創建目錄')
  .option('-f, --force', '強制覆蓋已存在的目錄')
  .option('--no-install', '跳過 npm install')
  .option('--no-git', '跳過 Git 初始化')
  .option('--overwrite', '覆蓋已存在的目錄（非交互式）')
  .option('--no-overwrite', '不覆蓋已存在的目錄（非交互式）')
  .action(async (name, options) => {
    showWelcome()
    try {
      await createProject(name, options)
    } catch (error) {
      console.error(chalk.red('❌ 創建項目失敗:'), error.message)
      
      // 提供建議
      if (error.message.includes('項目名稱作為命令行參數')) {
        console.log(chalk.cyan('\n💡 建議使用方式:'))
        console.log(chalk.cyan('  mursfoto create my-project --template minimal'))
        console.log(chalk.cyan('  mursfoto create my-app --template enterprise-production'))
      }
      
      process.exit(1)
    }
  })

// AI 命令 - 整合 Claude Code + Gemini 2.5 Pro + Amazon Q
program
  .command('ai [action]')
  .description('🤖 AI 助手 - 程式碼審查、優化、文檔生成等')
  .option('-f, --file <file>', '指定檔案路徑')
  .option('-o, --output <output>', '輸出檔案')
  .option('-q, --question <question>', '直接提問')
  .action(async (action, options) => {
    showWelcome()
    try {
      await aiCommand(action, options)
    } catch (error) {
      console.error(chalk.red('❌ AI 命令執行失敗:'), error.message)
      process.exit(1)
    }
  })

// doctor 命令
program
  .command('doctor')
  .description('檢查系統環境和依賴')
  .action(async () => {
    showWelcome()
    console.log(chalk.blue('🏥 系統診斷中...'))
    
    // 基本環境檢查
    const checks = [
      { name: 'Node.js', check: () => process.version, required: '>=18.0.0' },
      { name: 'NPM', check: () => require('child_process').execSync('npm --version', { encoding: 'utf8' }).trim(), required: '>=8.0.0' },
      { name: 'Git', check: () => require('child_process').execSync('git --version', { encoding: 'utf8' }).trim(), required: 'any' }
    ]
    
    for (const item of checks) {
      try {
        const version = item.check()
        console.log(chalk.green('✅'), item.name, chalk.gray(version))
      } catch (error) {
        console.log(chalk.red('❌'), item.name, chalk.red('未安裝或無法訪問'))
      }
    }
    
    console.log(chalk.green('\n🎉 環境診斷完成'))
  })

// GUI 命令
program
  .command('gui')
  .description('啟動圖形使用者介面')
  .option('-p, --port <port>', '指定端口', '3000')
  .action(async (options) => {
    showWelcome()
    console.log(chalk.blue('🌐 正在啟動 GUI 服務器...'))
    
    try {
      const GUIServer = require('../lib/services/GUIServer')
      const server = new GUIServer({ port: options.port })
      await server.start()
      console.log(chalk.green(`✅ GUI 服務器已啟動: http://localhost:${options.port}`))
    } catch (error) {
      console.error(chalk.red('❌ GUI 啟動失敗:'), error.message)
      process.exit(1)
    }
  })

// 狀態檢查命令
program
  .command('status')
  .description('檢查服務狀態')
  .action(async () => {
    showWelcome()
    console.log(chalk.blue('📊 檢查服務狀態...'))
    
    // 檢查統一服務狀態
    const services = ['ai-unified', 'deployment-unified', 'development-unified', 'system-unified']
    
    for (const service of services) {
      try {
        const ServiceClass = require(`../lib/services/${service}`)
        console.log(chalk.green('✅'), `${service} 服務可用`)
      } catch (error) {
        console.log(chalk.red('❌'), `${service} 服務不可用`)
      }
    }
    
    console.log(chalk.green('\n🎉 狀態檢查完成'))
  })

// 錯誤處理
program.on('command:*', () => {
  console.error(chalk.red('❌ 未知命令:'), program.args.join(' '))
  console.log(chalk.yellow('💡 使用'), chalk.cyan('mursfoto --help'), chalk.yellow('查看可用命令'))
  process.exit(1)
})

// 如果沒有參數，顯示幫助
if (!process.argv.slice(2).length) {
  showWelcome()
  program.outputHelp()
}

// 解析命令行參數
program.parse(process.argv)