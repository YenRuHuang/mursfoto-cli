const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')
const ora = require('ora')
const { execSync } = require('child_process')
const Handlebars = require('handlebars')
const simpleGit = require('simple-git')
const { validateProjectName, ensureDirectoryExists } = require('../utils/helpers')
const { getTemplateConfig, processTemplate } = require('../utils/templates')
const { registerServiceToGateway } = require('../utils/gateway')

// 延遲載入 inquirer 並提供回退選項
let inquirer
async function getInquirer() {
  if (!inquirer) {
    try {
      inquirer = require('inquirer')
      return inquirer
    } catch (error) {
      throw new Error('Inquirer 模組載入失敗，請在交互式環境中運行或提供所有必要參數')
    }
  }
  return inquirer
}

// 安全的 prompt 函數
async function safePrompt(questions) {
  try {
    // 檢查是否在交互式環境
    if (!process.stdin.isTTY) {
      throw new Error('非交互式環境')
    }
    
    const inquirerModule = await getInquirer()
    return await inquirerModule.prompt(questions)
  } catch (error) {
    console.log(chalk.yellow('⚠️ 無法使用交互式輸入'))
    throw error
  }
}

/**
 * 創建新項目
 */
async function createProject (projectName, options = {}) {
  const spinner = ora()

  try {
    // 輸入驗證
    if (!projectName) {
      try {
        const { name } = await safePrompt([
          {
            type: 'input',
            name: 'name',
            message: '請輸入項目名稱:',
            validate: (input) => {
              if (!input.trim()) return '項目名稱不能為空'
              if (!validateProjectName(input)) return '項目名稱只能包含字母、數字、連字符和下劃線，且不能以數字開頭'
              return true
            }
          }
        ])
        projectName = name.trim()
      } catch (error) {
        console.log(chalk.red('❌ 無法獲取項目名稱'))
        console.log(chalk.cyan('使用方式: mursfoto create <project-name> --template <template-name>'))
        throw new Error('需要提供項目名稱作為命令行參數')
      }
    }

    // 驗證項目名稱
    if (!validateProjectName(projectName)) {
      throw new Error('項目名稱只能包含字母、數字、連字符和下劃線，且不能以數字開頭')
    }

    // 設置項目路徑
    const projectPath = path.join(options.directory || process.cwd(), projectName)

    // 檢查目錄是否存在
    if (fs.existsSync(projectPath) && !options.force) {
      if (options.overwrite !== undefined) {
        // 使用命令行參數決定
        if (!options.overwrite) {
          console.log(chalk.yellow('👋 目錄已存在，操作已取消'))
          return
        }
      } else {
        // 嘗試交互式確認
        try {
          const { overwrite } = await safePrompt([
            {
              type: 'confirm',
              name: 'overwrite',
              message: `目錄 ${projectName} 已存在，是否覆蓋？`,
              default: false
            }
          ])

          if (!overwrite) {
            console.log(chalk.yellow('👋 操作已取消'))
            return
          }
        } catch (error) {
          // 如果無法交互，默認不覆蓋
          console.log(chalk.yellow('👋 目錄已存在，請使用 --force 強制覆蓋或選擇其他名稱'))
          return
        }
      }
    }

    // 選擇模板 (如果未指定)
    let templateName = options.template
    if (!templateName) {
      const availableTemplates = await getAvailableTemplates()
      
      try {
        const { template } = await safePrompt([
          {
            type: 'list',
            name: 'template',
            message: '請選擇項目模板:',
            choices: availableTemplates.map(t => ({
              name: `${t.emoji} ${t.name} - ${t.description}`,
              value: t.id
            }))
          }
        ])
        templateName = template
      } catch (error) {
        // 如果無法交互，使用默認模板
        console.log(chalk.yellow('⚠️ 無法選擇模板，使用默認的 minimal 模板'))
        console.log(chalk.cyan('下次可以使用: --template <template-name> 指定模板'))
        templateName = 'minimal'
      }
    }

    // 獲取模板配置
    const templateConfig = await getTemplateConfig(templateName)
    if (!templateConfig) {
      throw new Error(`未找到模板: ${templateName}`)
    }

    console.log(chalk.cyan(`\n🎯 創建項目: ${chalk.white.bold(projectName)}`))
    console.log(chalk.gray(`📋 使用模板: ${templateConfig.name}`))
    console.log(chalk.gray(`📍 項目路徑: ${projectPath}\n`))

    // 步驟 1: 創建項目目錄
    spinner.start('📁 創建項目目錄...')
    await ensureDirectoryExists(projectPath, options.force)
    spinner.succeed('📁 項目目錄創建完成')

    // 步驟 2: 處理模板文件
    spinner.start('📋 處理項目模板...')
    const templateData = {
      projectName,
      projectNameKebab: projectName.toLowerCase().replace(/[_\s]+/g, '-'),
      projectNameCamel: projectName.replace(/[-_\s](.)/g, (_, char) => char.toUpperCase()),
      projectNamePascal: projectName.replace(/[-_\s](.)/g, (_, char) => char.toUpperCase()).replace(/^./, char => char.toUpperCase()),
      description: `${projectName} - 基於 Mursfoto API Gateway 的服務`,
      author: process.env.USER || 'Mursfoto Developer',
      year: new Date().getFullYear(),
      timestamp: new Date().toISOString(),
      gatewayUrl: 'https://gateway.mursfoto.com',
      templateName: templateConfig.name
    }

    await processTemplate(templateName, projectPath, templateData)
    spinner.succeed('📋 項目模板處理完成')

    // 步驟 3: 安裝依賴
    if (options.install !== false) {
      spinner.start('📦 安裝項目依賴...')
      try {
        process.chdir(projectPath)
        execSync('npm install', { stdio: 'pipe' })
        spinner.succeed('📦 依賴安裝完成')
      } catch (error) {
        spinner.warn('📦 依賴安裝失敗，請手動執行 npm install')
      }
    }

    // 步驟 4: Git 初始化
    if (options.git !== false) {
      spinner.start('🔧 初始化 Git 倉庫...')
      try {
        const git = simpleGit(projectPath)
        await git.init()
        await git.add('.')
        await git.commit('🎉 Initial commit - Created with @mursfoto/cli')
        spinner.succeed('🔧 Git 倉庫初始化完成')
      } catch (error) {
        spinner.warn('🔧 Git 初始化失敗，請手動初始化')
      }
    }

    // 步驟 5: 註冊到 Gateway (如果需要)
    if (options.gateway !== false) {
      spinner.start('🌐 註冊服務到 API Gateway...')
      try {
        await registerServiceToGateway(projectName, templateConfig)
        spinner.succeed('🌐 服務註冊完成')
      } catch (error) {
        spinner.warn(`🌐 服務註冊失敗: ${error.message}`)
        console.log(chalk.yellow('💡 你可以稍後使用 `mursfoto gateway register` 手動註冊服務'))
      }
    }

    // 完成提示
    console.log(chalk.green('\n🎉 項目創建成功！\n'))

    console.log(chalk.white.bold('📍 下一步操作:'))
    console.log(chalk.gray(`  cd ${projectName}`))
    if (options.install === false) {
      console.log(chalk.gray('  npm install'))
    }
    console.log(chalk.gray('  npm run dev\n'))

    console.log(chalk.white.bold('🌐 可用端點:'))
    console.log(chalk.gray('  本地開發: http://localhost:3001'))
    console.log(chalk.gray(`  Gateway 代理: https://gateway.mursfoto.com/api/${projectName.toLowerCase()}\n`))

    console.log(chalk.white.bold('🛠  常用命令:'))
    console.log(chalk.gray('  mursfoto status    - 檢查項目狀態'))
    console.log(chalk.gray('  mursfoto deploy    - 部署到 Zeabur'))
    console.log(chalk.gray('  mursfoto doctor    - 環境健康檢查\n'))

    if (templateConfig.quickStart) {
      console.log(chalk.cyan.bold('🚀 快速開始指南:'))
      templateConfig.quickStart.forEach(step => {
        console.log(chalk.gray(`  ${step}`))
      })
      console.log('')
    }
  } catch (error) {
    spinner.fail(`創建項目失敗: ${error.message}`)
    throw error
  }
}

/**
 * 獲取可用模板列表
 */
async function getAvailableTemplates () {
  return [
    {
      id: 'minimal',
      name: '最小化模板',
      description: 'Express + 基本功能',
      emoji: '📦'
    },
    {
      id: 'calculator',
      name: '計算器模板',
      description: '基於 tw-life-formula',
      emoji: '🧮'
    },
    {
      id: 'test-tool',
      name: '測試工具模板',
      description: '完整測試配置',
      emoji: '🧪'
    },
    {
      id: 'api-service',
      name: 'API 服務模板',
      description: 'RESTful API 服務',
      emoji: '🌐'
    }
  ]
}

module.exports = {
  createProject,
  getAvailableTemplates
}
