#!/usr/bin/env node

// 🔑 載入環境變數 - 必須在最開始
require('dotenv').config()

const { program } = require('commander')
const chalk = require('chalk')
const pkg = require('../package.json')
const { wrapCommand } = require('../lib/utils/commandTracker')

// 顯示歡迎頁面
function showWelcome () {
  console.log(chalk.cyan.bold('\n🚀 MURSFOTO CLI'))
  console.log(chalk.cyan('\n🚀 Mursfoto API Gateway 生態系統自動化工具\n'))
  console.log(chalk.gray('快速創建、部署和管理 Mursfoto 服務\n'))
}

// 配置主程式
program
  .name('mursfoto')
  .description('🚀 Mursfoto API Gateway 生態系統自動化工具')
  .version(pkg.version, '-v, --version', '顯示版本號')
  .helpOption('-h, --help', '顯示幫助資訊')

// 創建項目命令
program
  .command('create')
  .alias('c')
  .description('🎯 創建新的 Mursfoto 服務項目')
  .argument('[project-name]', '項目名稱')
  .option('-t, --template <template>', '使用指定模板 (minimal, calculator, test-tool, api-service)', 'minimal')
  .option('-d, --directory <path>', '指定創建目錄', '.')
  .option('-f, --force', '覆蓋已存在的目錄', false)
  .option('--no-install', '跳過依賴安裝', false)
  .option('--no-git', '跳過 Git 初始化', false)
  .option('--no-gateway', '跳過 Gateway 註冊', false)
  .action(wrapCommand('create', async (projectName, options) => {
    const { createProject } = require('../lib/commands/create')
    await createProject(projectName, options)
  }, { command: 'create', template: 'options.template' }))

// 部署命令
program
  .command('deploy')
  .alias('d')
  .description('🚀 部署項目到 Zeabur')
  .option('-e, --env <environment>', '部署環境 (dev, prod)', 'prod')
  .option('--auto-confirm', '自動確認所有操作', false)
  .action(wrapCommand('deploy', async (options) => {
    const { deployProject } = require('../lib/commands/deploy')
    await deployProject(options)
  }, { command: 'deploy', environment: 'options.env' }))

// 狀態檢查命令
program
  .command('status')
  .alias('s')
  .description('📊 檢查項目和 Gateway 狀態')
  .option('-v, --verbose', '顯示詳細資訊', false)
  .action(async (options) => {
    const { checkStatus } = require('../lib/commands/status')
    await checkStatus(options)
  })

// Gateway 管理命令
const gatewayCommand = program
  .command('gateway')
  .alias('g')
  .description('🌐 管理 API Gateway 配置')

gatewayCommand
  .command('register')
  .description('註冊服務到 Gateway')
  .argument('[service-name]', '服務名稱')
  .option('-u, --url <url>', '服務 URL')
  .option('-r, --rate-limit <limit>', '速率限制', '100')
  .action(async (serviceName, options) => {
    const { registerService } = require('../lib/commands/gateway')
    await registerService(serviceName, options)
  })

gatewayCommand
  .command('unregister')
  .description('從 Gateway 取消註冊服務')
  .argument('<service-name>', '服務名稱')
  .action(async (serviceName) => {
    const { unregisterService } = require('../lib/commands/gateway')
    await unregisterService(serviceName)
  })

gatewayCommand
  .command('list')
  .description('列出所有已註冊的服務')
  .action(async () => {
    const { listServices } = require('../lib/commands/gateway')
    await listServices()
  })

// 模板管理命令
const templateCommand = program
  .command('template')
  .alias('t')
  .description('📋 管理項目模板')

templateCommand
  .command('list')
  .description('列出可用模板')
  .action(async () => {
    const { listTemplates } = require('../lib/commands/template')
    await listTemplates()
  })

templateCommand
  .command('info')
  .description('查看模板詳細資訊')
  .argument('<template-name>', '模板名稱')
  .action(async (templateName) => {
    const { templateInfo } = require('../lib/commands/template')
    await templateInfo(templateName)
  })

// 配置命令
const configCommand = program
  .command('config')
  .description('⚙️  管理 CLI 配置')

configCommand
  .command('set')
  .description('設置配置項')
  .argument('<key>', '配置鍵')
  .argument('<value>', '配置值')
  .action(async (key, value) => {
    const { setConfig } = require('../lib/commands/config')
    await setConfig(key, value)
  })

configCommand
  .command('get')
  .description('獲取配置項')
  .argument('[key]', '配置鍵')
  .action(async (key) => {
    const { getConfig } = require('../lib/commands/config')
    await getConfig(key)
  })

configCommand
  .command('reset')
  .description('重置所有配置')
  .action(async () => {
    const { resetConfig } = require('../lib/commands/config')
    await resetConfig()
  })

// 工具命令
program
  .command('doctor')
  .description('🏥 檢查環境和依賴')
  .action(async () => {
    const { runDoctor } = require('../lib/commands/doctor')
    await runDoctor()
  })

// smart 命令 - 🚀 階段 2 智能化功能
const smartCmd = program
  .command('smart')
  .description('🚀 智能化自動開發功能 (階段 2)')

// GitHub 自動化
smartCmd
  .command('github <action>')
  .description('🐙 GitHub API 完全自動化')
  .option('-n, --name <name>', '項目名稱')
  .option('-d, --description <description>', '項目描述')
  .option('-t, --template <template>', '使用模板')
  .option('--no-release', '不創建初始 Release')
  .option('--no-cicd', '不設置 CI/CD')
  .option('--no-monitoring', '不啟用監控')
  .action(wrapCommand('smart github', async (action, options) => {
    const SmartCommands = require('../lib/commands/smart')
    const smart = new SmartCommands()
    await smart.githubAutomate(action, options)
  }, { command: 'smart github', action: 'action' }))

// 錯誤記憶系統
smartCmd
  .command('error <action>')
  .description('🧠 智能錯誤記憶系統')
  .option('-q, --query <query>', '搜尋關鍵字')
  .option('-d, --days <days>', '天數', '30')
  .option('-f, --file <file>', '檔案路徑')
  .action(wrapCommand('smart error', async (action, options) => {
    const SmartCommands = require('../lib/commands/smart')
    const smart = new SmartCommands()
    await smart.errorMemoryCommand(action, options)
  }, { command: 'smart error', action: 'action' }))

// n8n 自動化模板
smartCmd
  .command('n8n <action>')
  .description('🔄 n8n 自動化工作流程模板')
  .option('-n, --name <name>', '項目名稱')
  .option('-q, --query <query>', '搜尋關鍵字')
  .option('-c, --category <category>', '模板類別')
  .action(wrapCommand('smart n8n', async (action, options) => {
    const SmartCommands = require('../lib/commands/smart')
    const smart = new SmartCommands()
    await smart.n8nCommand(action, options)
  }, { command: 'smart n8n', action: 'action' }))

// 🆕 階段 2 新功能

// AI 代碼生成器
smartCmd
  .command('ai <action>')
  .description('🤖 AI 代碼生成器')
  .option('-d, --description <description>', '功能描述')
  .option('-t, --type <type>', '生成類型 (component, api, test, optimize)')
  .option('-f, --file <file>', '目標檔案')
  .option('-l, --language <language>', '程式語言')
  .action(wrapCommand('smart ai', async (action, options) => {
    const SmartCommands = require('../lib/commands/smart')
    const smart = new SmartCommands()
    await smart.aiCodeGenerate(action, options)
  }, { command: 'smart ai', action: 'action' }))

// 智能測試自動化
smartCmd
  .command('test <action>')
  .description('🧪 智能測試自動化')
  .option('-c, --coverage <percent>', '目標覆蓋率', '90')
  .option('-t, --type <type>', '測試類型 (unit, integration, e2e)')
  .option('--generate', '生成測試案例', false)
  .action(wrapCommand('smart test', async (action, options) => {
    const SmartCommands = require('../lib/commands/smart')
    const smart = new SmartCommands()
    await smart.smartTestCommand(action, options)
  }, { command: 'smart test', action: 'action' }))

// 智能部署管道
smartCmd
  .command('deploy <action>')
  .description('🚀 智能部署管道')
  .option('-e, --environment <env>', '部署環境', 'production')
  .option('-s, --strategy <strategy>', '部署策略 (blue-green, rolling)', 'rolling')
  .option('--auto-rollback', '自動回滾', true)
  .action(wrapCommand('smart deploy', async (action, options) => {
    const SmartCommands = require('../lib/commands/smart')
    const smart = new SmartCommands()
    await smart.deploymentCommand(action, options)
  }, { command: 'smart deploy', action: 'action' }))

// 進階模板管理
smartCmd
  .command('template <action>')
  .description('📋 進階模板管理')
  .option('-p, --project-type <type>', '專案類型')
  .option('-f, --features <features>', '所需功能')
  .option('--marketplace', '使用模板市場', false)
  .action(wrapCommand('smart template', async (action, options) => {
    const SmartCommands = require('../lib/commands/smart')
    const smart = new SmartCommands()
    await smart.templateCommand(action, options)
  }, { command: 'smart template', action: 'action' }))

// 效能監控與優化
smartCmd
  .command('optimize <action>')
  .description('📊 效能監控與優化')
  .option('--auto-fix', '自動修復', false)
  .option('-r, --report <format>', '報告格式 (json, html, pdf)', 'html')
  .option('-t, --threshold <value>', '效能門檻')
  .action(wrapCommand('smart optimize', async (action, options) => {
    const SmartCommands = require('../lib/commands/smart')
    const smart = new SmartCommands()
    await smart.optimizeCommand(action, options)
  }, { command: 'smart optimize', action: 'action' }))

// 🧠 Phase 2 - 智能學習和決策系統
smartCmd
  .command('learn [action]')
  .description('🧠 智能學習和決策系統 - Phase 2')
  .option('-f, --file <path>', '報告輸出檔案路徑')
  .option('--project-type <type>', '專案類型（用於建議）')
  .option('--command <cmd>', '手動記錄的命令名稱')
  .option('--success', '標記命令執行成功')
  .option('--duration <ms>', '命令執行時間（毫秒）')
  .action(wrapCommand('smart learn', async (action, options) => {
    const SmartCommands = require('../lib/commands/smart')
    const smart = new SmartCommands()
    await smart.learningCommand(action, options)
  }, { command: 'smart learn', action: 'action' }))

// 🌍 Phase 3 - 多雲平台管理
smartCmd
  .command('cloud <action>')
  .description('🌍 多雲平台管理與部署 - Phase 3')
  .option('-p, --platform <platform>', '雲平台名稱')
  .option('-t, --project-type <type>', '專案類型', 'web')
  .option('-b, --budget <budget>', '預算範圍', 'medium')
  .option('-r, --region <region>', '部署地區', 'global')
  .action(wrapCommand('smart cloud', async (action, options) => {
    const SmartCommands = require('../lib/commands/smart')
    const smart = new SmartCommands()
    await smart.multiCloudCommand(action, options)
  }, { command: 'smart cloud', action: 'action' }))

// 🐳 Phase 3 - 容器優化服務
smartCmd
  .command('container <action>')
  .description('🐳 智能容器優化與管理 - Phase 3')
  .option('-l, --language <lang>', '程式語言', 'nodejs')
  .option('-f, --framework <framework>', '框架名稱')
  .option('-p, --port <port>', '應用端口', '3000')
  .option('--analyze-path <path>', '分析路徑', '.')
  .action(wrapCommand('smart container', async (action, options) => {
    const SmartCommands = require('../lib/commands/smart')
    const smart = new SmartCommands()
    await smart.containerCommand(action, options)
  }, { command: 'smart container', action: 'action' }))

// 💰 Phase 3 - 成本分析服務
smartCmd
  .command('cost <action>')
  .description('💰 智能成本分析與優化 - Phase 3')
  .option('-p, --platforms <platforms...>', '分析平台列表')
  .option('--vcpu <vcpu>', 'vCPU 需求', '2')
  .option('--memory <memory>', '記憶體需求 (GB)', '4')
  .option('--storage <storage>', '存儲需求 (GB)', '20')
  .option('--traffic <traffic>', '月流量 (GB)', '100')
  .option('-f, --file <file>', '報告文件路徑')
  .action(wrapCommand('smart cost', async (action, options) => {
    const SmartCommands = require('../lib/commands/smart')
    const smart = new SmartCommands()
    await smart.costCommand(action, options)
  }, { command: 'smart cost', action: 'action' }))

// 錯誤處理
program.configureHelp({
  sortSubcommands: true,
  subcommandTerm: (cmd) => cmd.name() + ' ' + cmd.usage()
})

// 處理未知命令
program.on('command:*', () => {
  console.error(chalk.red(`\n❌ 未知命令: ${program.args.join(' ')}`))
  console.log(chalk.yellow('💡 使用 `mursfoto --help` 查看可用命令\n'))
  process.exit(1)
})

// 如果沒有參數，顯示歡迎頁面和幫助
if (!process.argv.slice(2).length) {
  showWelcome()
  program.outputHelp()
  process.exit(0)
}

// 執行程式
program.parse(process.argv)

// 處理未捕獲的錯誤
process.on('uncaughtException', (error) => {
  console.error(chalk.red('\n❌ 未捕獲的錯誤:'), error.message)
  console.log(chalk.gray('\n🔧 請使用 `mursfoto doctor` 檢查環境設置\n'))
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('\n❌ 未處理的 Promise 拒絕:'), reason)
  console.log(chalk.gray('\n🔧 請使用 `mursfoto doctor` 檢查環境設置\n'))
  process.exit(1)
})
