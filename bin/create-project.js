#!/usr/bin/env node

const { program } = require('commander')
const chalk = require('chalk')
const createCommand = require('../lib/commands/create')
const pkg = require('../package.json')

// 設定程序信息
program
  .name('@mursfoto/create-project')
  .description('快速創建 Mursfoto 項目的獨立工具')
  .version(pkg.version)
  .argument('<project-name>', '項目名稱')
  .option('-t, --template <template>', '使用指定模板', 'minimal')
  .option('-d, --directory <dir>', '指定創建目錄', '.')
  .option('--no-install', '跳過 npm install')
  .option('--no-git', '跳過 Git 初始化')
  .action(async (projectName, options) => {
    console.log(chalk.cyan('🚀 Mursfoto 項目創建工具'))
    console.log(chalk.gray(`版本: ${pkg.version}\n`))
    
    try {
      await createCommand(projectName, options)
      
      console.log(chalk.green('\n🎉 項目創建成功！'))
      console.log(chalk.yellow('📝 接下來的步驟:'))
      console.log(chalk.white(`  cd ${projectName}`))
      console.log(chalk.white('  npm run dev'))
    } catch (error) {
      console.error(chalk.red('\n❌ 項目創建失敗:'), error.message)
      process.exit(1)
    }
  })

// 錯誤處理
program.on('command:*', () => {
  console.error(chalk.red('❌ 未知命令'))
  program.outputHelp()
  process.exit(1)
})

// 解析命令行參數
program.parse(process.argv)