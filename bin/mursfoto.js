#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const pkg = require('../package.json');

// 顯示歡迎頁面
function showWelcome() {
  console.log(chalk.cyan.bold('\n🚀 MURSFOTO CLI'));
  console.log(chalk.cyan('\n🚀 Mursfoto API Gateway 生態系統自動化工具\n'));
  console.log(chalk.gray('快速創建、部署和管理 Mursfoto 服務\n'));
}

// 配置主程式
program
  .name('mursfoto')
  .description('🚀 Mursfoto API Gateway 生態系統自動化工具')
  .version(pkg.version, '-v, --version', '顯示版本號')
  .helpOption('-h, --help', '顯示幫助資訊');

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
  .action(async (projectName, options) => {
    const { createProject } = require('../lib/commands/create');
    await createProject(projectName, options);
  });

// 部署命令
program
  .command('deploy')
  .alias('d')
  .description('🚀 部署項目到 Zeabur')
  .option('-e, --env <environment>', '部署環境 (dev, prod)', 'prod')
  .option('--auto-confirm', '自動確認所有操作', false)
  .action(async (options) => {
    const { deployProject } = require('../lib/commands/deploy');
    await deployProject(options);
  });

// 狀態檢查命令
program
  .command('status')
  .alias('s')
  .description('📊 檢查項目和 Gateway 狀態')
  .option('-v, --verbose', '顯示詳細資訊', false)
  .action(async (options) => {
    const { checkStatus } = require('../lib/commands/status');
    await checkStatus(options);
  });

// Gateway 管理命令  
const gatewayCommand = program
  .command('gateway')
  .alias('g')
  .description('🌐 管理 API Gateway 配置');

gatewayCommand
  .command('register')
  .description('註冊服務到 Gateway')
  .argument('[service-name]', '服務名稱')
  .option('-u, --url <url>', '服務 URL')
  .option('-r, --rate-limit <limit>', '速率限制', '100')
  .action(async (serviceName, options) => {
    const { registerService } = require('../lib/commands/gateway');
    await registerService(serviceName, options);
  });

gatewayCommand
  .command('unregister')
  .description('從 Gateway 取消註冊服務')
  .argument('<service-name>', '服務名稱')
  .action(async (serviceName) => {
    const { unregisterService } = require('../lib/commands/gateway');
    await unregisterService(serviceName);
  });

gatewayCommand
  .command('list')
  .description('列出所有已註冊的服務')
  .action(async () => {
    const { listServices } = require('../lib/commands/gateway');
    await listServices();
  });

// 模板管理命令
const templateCommand = program
  .command('template')
  .alias('t')
  .description('📋 管理項目模板');

templateCommand
  .command('list')
  .description('列出可用模板')
  .action(async () => {
    const { listTemplates } = require('../lib/commands/template');
    await listTemplates();
  });

templateCommand
  .command('info')
  .description('查看模板詳細資訊')
  .argument('<template-name>', '模板名稱')
  .action(async (templateName) => {
    const { templateInfo } = require('../lib/commands/template');
    await templateInfo(templateName);
  });

// 配置命令
const configCommand = program
  .command('config')
  .description('⚙️  管理 CLI 配置');

configCommand
  .command('set')
  .description('設置配置項')
  .argument('<key>', '配置鍵')
  .argument('<value>', '配置值')
  .action(async (key, value) => {
    const { setConfig } = require('../lib/commands/config');
    await setConfig(key, value);
  });

configCommand
  .command('get')
  .description('獲取配置項')
  .argument('[key]', '配置鍵')
  .action(async (key) => {
    const { getConfig } = require('../lib/commands/config');
    await getConfig(key);
  });

configCommand
  .command('reset')
  .description('重置所有配置')
  .action(async () => {
    const { resetConfig } = require('../lib/commands/config');
    await resetConfig();
  });

// 工具命令
program
  .command('doctor')
  .description('🏥 檢查環境和依賴')
  .action(async () => {
    const { runDoctor } = require('../lib/commands/doctor');
    await runDoctor();
  });

// smart 命令 - 🚀 階段 1 智能化功能
const smartCmd = program
  .command('smart')
  .description('🚀 智能化自動開發功能 (階段 1)');

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
  .action(async (action, options) => {
    const SmartCommands = require('../lib/commands/smart');
    const smart = new SmartCommands();
    await smart.githubAutomate(action, options);
  });

// 錯誤記憶系統
smartCmd
  .command('memory <action>')
  .description('🧠 智能錯誤記憶系統')
  .option('-q, --query <query>', '搜尋關鍵字')
  .option('-d, --days <days>', '天數', '30')
  .option('-f, --file <file>', '檔案路徑')
  .action(async (action, options) => {
    const SmartCommands = require('../lib/commands/smart');
    const smart = new SmartCommands();
    await smart.errorMemoryCommand(action, options);
  });

// n8n 自動化模板
smartCmd
  .command('n8n <action>')
  .description('🔄 n8n 自動化工作流程模板')
  .option('-n, --name <name>', '項目名稱')
  .option('-q, --query <query>', '搜尋關鍵字')
  .option('-c, --category <category>', '模板類別')
  .action(async (action, options) => {
    const SmartCommands = require('../lib/commands/smart');
    const smart = new SmartCommands();
    await smart.n8nCommand(action, options);
  });

// 錯誤處理
program.configureHelp({
  sortSubcommands: true,
  subcommandTerm: (cmd) => cmd.name() + ' ' + cmd.usage(),
});

// 處理未知命令
program.on('command:*', () => {
  console.error(chalk.red(`\n❌ 未知命令: ${program.args.join(' ')}`));
  console.log(chalk.yellow('💡 使用 `mursfoto --help` 查看可用命令\n'));
  process.exit(1);
});

// 如果沒有參數，顯示歡迎頁面和幫助
if (!process.argv.slice(2).length) {
  showWelcome();
  program.outputHelp();
  process.exit(0);
}

// 執行程式
program.parse(process.argv);

// 處理未捕獲的錯誤
process.on('uncaughtException', (error) => {
  console.error(chalk.red('\n❌ 未捕獲的錯誤:'), error.message);
  console.log(chalk.gray('\n🔧 請使用 `mursfoto doctor` 檢查環境設置\n'));
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('\n❌ 未處理的 Promise 拒絕:'), reason);
  console.log(chalk.gray('\n🔧 請使用 `mursfoto doctor` 檢查環境設置\n'));
  process.exit(1);
});
