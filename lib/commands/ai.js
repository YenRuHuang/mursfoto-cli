#!/usr/bin/env node

/**
 * Mursfoto AI 整合命令
 * 整合 Claude Code、Gemini 2.5 Pro、Amazon Q
 * 專為 mursfoto 專案優化
 */

const chalk = require('chalk')
const inquirer = require('inquirer')
const { execSync } = require('child_process')
const fs = require('fs-extra')
const path = require('path')
const ora = require('ora')

// AI 命令主功能
async function aiCommand(action, options) {
  // 根據不同的動作執行
  switch (action) {
    case 'review':
      await reviewCode(options)
      break
    case 'api':
      await analyzeAPI(options)
      break
    case 'deploy':
      await deploymentAssist(options)
      break
    case 'optimize':
      await optimizeCode(options)
      break
    case 'doc':
      await generateDocs(options)
      break
    case 'test':
      await generateTests(options)
      break
    case 'ask':
      await askAI(options)
      break
    default:
      await interactiveMenu()
  }
}

// 互動式選單
async function interactiveMenu() {
  console.log(chalk.cyan('🤖 Mursfoto AI 助手'))
  console.log(chalk.gray('整合 Claude Code + Gemini 2.5 Pro + Amazon Q\n'))

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: '請選擇 AI 功能：',
      choices: [
        { name: '📋 程式碼審查 (API Gateway / CLI)', value: 'review' },
        { name: '🔌 API 路由分析', value: 'api' },
        { name: '🚀 部署協助 (Zeabur/Docker)', value: 'deploy' },
        { name: '⚡ 性能優化', value: 'optimize' },
        { name: '📚 生成文檔', value: 'doc' },
        { name: '🧪 生成測試', value: 'test' },
        { name: '💬 自由提問', value: 'ask' },
        new inquirer.Separator(),
        { name: '🔧 設定 API Keys', value: 'config' },
        { name: '❌ 退出', value: 'exit' }
      ]
    }
  ])

  if (action === 'exit') {
    console.log(chalk.green('👋 再見！'))
    return
  }

  if (action === 'config') {
    await configureAPIKeys()
    return
  }

  // 執行選擇的功能
  await aiCommand(action, {})
}

// 程式碼審查
async function reviewCode(options) {
  const { file } = options.file ? options : await inquirer.prompt([
    {
      type: 'input',
      name: 'file',
      message: '請輸入要審查的檔案路徑：',
      default: 'server.js',
      validate: (input) => {
        if (!fs.existsSync(input)) {
          return '檔案不存在，請重新輸入'
        }
        return true
      }
    }
  ])

  const spinner = ora('正在進行 AI 程式碼審查...').start()

  try {
    // 檢測檔案類型
    const isAPIGateway = file.includes('gateway') || file.includes('proxy') || file.includes('server')
    const isCLI = file.includes('cli') || file.includes('command')
    
    let context = ''
    if (isAPIGateway) {
      context = '這是 mursfoto-api-gateway 專案的程式碼，請特別注意：安全性、路由配置、中間件、錯誤處理。'
    } else if (isCLI) {
      context = '這是 mursfoto-cli 專案的程式碼，請特別注意：命令結構、使用者體驗、錯誤處理、模板生成。'
    }

    const fileContent = fs.readFileSync(file, 'utf8')
    
    // 使用 Gemini 2.5 Pro 進行審查
    const geminiCommand = `cat "${file}" | gemini-pro "請審查這段 mursfoto 專案的程式碼。${context}
    
重點檢查：
1. 程式碼品質和最佳實踐
2. 安全性問題
3. 性能優化機會
4. mursfoto 專案規範遵循度
5. 可維護性和擴展性

請提供具體的改進建議。"`

    spinner.text = 'Gemini 2.5 Pro 審查中...'
    const geminiResult = execSync(geminiCommand, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 })

    spinner.succeed('AI 審查完成！')
    
    console.log(chalk.green('\n🌟 Gemini 2.5 Pro 審查結果：'))
    console.log(geminiResult)

    // 如果可用，也執行 Amazon Q translate
    try {
      console.log(chalk.yellow('\n📦 Amazon Q 建議的檢查命令：'))
      const qCommand = `echo "為 ${file} 生成程式碼品質檢查命令" | q translate`
      const qResult = execSync(qCommand, { encoding: 'utf8' })
      console.log(qResult)
    } catch (e) {
      // Q 可能不可用
    }

  } catch (error) {
    spinner.fail('審查失敗')
    console.error(chalk.red('錯誤：'), error.message)
  }
}

// API 路由分析
async function analyzeAPI(options) {
  const routesPath = path.join(process.cwd(), 'routes')
  
  if (!fs.existsSync(routesPath)) {
    console.log(chalk.yellow('找不到 routes 資料夾，嘗試分析 server.js...'))
    
    if (fs.existsSync('server.js')) {
      await reviewCode({ file: 'server.js' })
    } else {
      console.log(chalk.red('找不到 API 相關檔案'))
    }
    return
  }

  const spinner = ora('正在分析 API 路由...').start()

  try {
    const routes = fs.readdirSync(routesPath).filter(file => file.endsWith('.js'))
    
    spinner.succeed(`找到 ${routes.length} 個路由檔案`)
    
    for (const route of routes) {
      const filePath = path.join(routesPath, route)
      console.log(chalk.cyan(`\n📌 分析路由: ${route}`))
      
      const command = `cat "${filePath}" | gemini-pro "分析這個 mursfoto API 路由：
1. 路由端點列表
2. 中間件使用
3. 錯誤處理
4. 安全性考量
5. 改進建議

請簡潔列出重點。"`

      const result = execSync(command, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 })
      console.log(result)
    }

  } catch (error) {
    spinner.fail('分析失敗')
    console.error(chalk.red('錯誤：'), error.message)
  }
}

// 部署協助
async function deploymentAssist(options) {
  const { platform } = await inquirer.prompt([
    {
      type: 'list',
      name: 'platform',
      message: '選擇部署平台：',
      choices: [
        { name: '🚀 Zeabur', value: 'zeabur' },
        { name: '🐳 Docker', value: 'docker' },
        { name: '☁️ AWS', value: 'aws' },
        { name: '🌊 DigitalOcean', value: 'digitalocean' },
        { name: '🔧 自訂', value: 'custom' }
      ]
    }
  ])

  const spinner = ora('生成部署建議...').start()

  try {
    let deployCommand = ''
    
    switch (platform) {
      case 'zeabur':
        deployCommand = `gemini-pro "為 mursfoto-api-gateway 專案生成 Zeabur 部署配置：
1. zeabur.json 配置檔
2. 環境變數設定
3. 資料庫連接配置
4. 部署步驟說明
5. 常見問題解決"`
        break
      
      case 'docker':
        deployCommand = `gemini-pro "為 mursfoto 專案生成 Docker 配置：
1. Dockerfile 內容
2. docker-compose.yml
3. 環境變數配置
4. 構建和運行命令
5. 最佳實踐"`
        break
      
      default:
        deployCommand = `gemini-pro "為 mursfoto 專案在 ${platform} 平台的部署提供指導"`
    }

    const result = execSync(deployCommand, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 })
    
    spinner.succeed('部署建議已生成！')
    console.log(result)

    // 詢問是否要生成配置檔案
    const { generateConfig } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'generateConfig',
        message: '是否要生成配置檔案？',
        default: true
      }
    ])

    if (generateConfig) {
      // 根據平台生成相應配置檔案
      console.log(chalk.green('✅ 配置檔案生成功能開發中...'))
    }

  } catch (error) {
    spinner.fail('生成失敗')
    console.error(chalk.red('錯誤：'), error.message)
  }
}

// 性能優化
async function optimizeCode(options) {
  const { file } = options.file ? options : await inquirer.prompt([
    {
      type: 'input',
      name: 'file',
      message: '請輸入要優化的檔案路徑：',
      validate: (input) => {
        if (!fs.existsSync(input)) {
          return '檔案不存在'
        }
        return true
      }
    }
  ])

  const spinner = ora('分析性能瓶頸...').start()

  try {
    const command = `cat "${file}" | gemini-pro "對這個 mursfoto 程式碼進行性能優化分析：
    
1. 識別性能瓶頸
2. 提供優化方案
3. 給出優化後的程式碼範例
4. 預期性能提升
5. 風險評估

專注於 mursfoto 專案常見的性能問題（API 響應、資料庫查詢、中間件效率）。"`

    const result = execSync(command, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 })
    
    spinner.succeed('優化分析完成！')
    console.log(result)

  } catch (error) {
    spinner.fail('優化分析失敗')
    console.error(chalk.red('錯誤：'), error.message)
  }
}

// 生成文檔
async function generateDocs(options) {
  const { type } = await inquirer.prompt([
    {
      type: 'list',
      name: 'type',
      message: '選擇文檔類型：',
      choices: [
        { name: '📖 README.md', value: 'readme' },
        { name: '🔌 API 文檔', value: 'api' },
        { name: '📦 安裝指南', value: 'install' },
        { name: '🚀 部署文檔', value: 'deploy' },
        { name: '🔧 配置說明', value: 'config' }
      ]
    }
  ])

  const spinner = ora('生成文檔中...').start()

  try {
    let docCommand = `gemini-pro "為 mursfoto 專案生成 ${type} 文檔，包含：`
    
    switch (type) {
      case 'readme':
        docCommand += `
1. 專案簡介
2. 功能特點
3. 快速開始
4. 使用範例
5. API 參考
6. 貢獻指南"`
        break
      
      case 'api':
        docCommand += `
1. API 端點列表
2. 請求/響應格式
3. 認證方式
4. 錯誤代碼
5. 使用範例"`
        break
      
      default:
        docCommand += '完整的文檔結構'
    }

    const result = execSync(docCommand, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 })
    
    spinner.succeed('文檔生成完成！')
    console.log(result)

    // 詢問是否保存
    const { save } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'save',
        message: '是否保存文檔到檔案？',
        default: true
      }
    ])

    if (save) {
      const filename = `${type}-${Date.now()}.md`
      fs.writeFileSync(filename, result)
      console.log(chalk.green(`✅ 文檔已保存到: ${filename}`))
    }

  } catch (error) {
    spinner.fail('文檔生成失敗')
    console.error(chalk.red('錯誤：'), error.message)
  }
}

// 生成測試
async function generateTests(options) {
  const { file } = options.file ? options : await inquirer.prompt([
    {
      type: 'input',
      name: 'file',
      message: '請輸入要生成測試的檔案：',
      validate: (input) => {
        if (!fs.existsSync(input)) {
          return '檔案不存在'
        }
        return true
      }
    }
  ])

  const spinner = ora('生成測試程式碼...').start()

  try {
    const command = `cat "${file}" | gemini-pro "為這個 mursfoto 程式碼生成完整的測試：
    
1. 使用 Jest 測試框架
2. 包含單元測試
3. 包含整合測試（如適用）
4. 邊界案例測試
5. 錯誤處理測試

請提供可直接運行的測試程式碼。"`

    const result = execSync(command, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 })
    
    spinner.succeed('測試生成完成！')
    console.log(result)

    // 詢問是否保存
    const { save } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'save',
        message: '是否保存測試檔案？',
        default: true
      }
    ])

    if (save) {
      const testFile = file.replace('.js', '.test.js')
      fs.writeFileSync(testFile, result)
      console.log(chalk.green(`✅ 測試已保存到: ${testFile}`))
    }

  } catch (error) {
    spinner.fail('測試生成失敗')
    console.error(chalk.red('錯誤：'), error.message)
  }
}

// 自由提問
async function askAI(options) {
  const { question } = options.question ? options : await inquirer.prompt([
    {
      type: 'input',
      name: 'question',
      message: '請輸入你的問題：',
      validate: (input) => input.length > 0 || '請輸入問題'
    }
  ])

  const spinner = ora('AI 思考中...').start()

  try {
    const command = `gemini-pro "${question}

請注意這是關於 mursfoto 專案的問題，該專案包含：
- mursfoto-cli: CLI 工具
- mursfoto-api-gateway: API 網關
- 使用 Node.js、Express、MySQL
- 支援 Zeabur 部署"`

    const result = execSync(command, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 })
    
    spinner.succeed('回答完成！')
    console.log(result)

  } catch (error) {
    spinner.fail('回答失敗')
    console.error(chalk.red('錯誤：'), error.message)
  }
}

// 配置 API Keys
async function configureAPIKeys() {
  console.log(chalk.cyan('🔑 配置 AI API Keys'))
  
  const { geminiKey } = await inquirer.prompt([
    {
      type: 'input',
      name: 'geminiKey',
      message: 'Gemini API Key (留空跳過)：',
      default: process.env.GEMINI_API_KEY || ''
    }
  ])

  if (geminiKey) {
    // 更新環境變數
    const envPath = path.join(process.cwd(), '.env')
    let envContent = ''
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8')
    }

    if (envContent.includes('GEMINI_API_KEY=')) {
      envContent = envContent.replace(/GEMINI_API_KEY=.*/, `GEMINI_API_KEY=${geminiKey}`)
    } else {
      envContent += `\nGEMINI_API_KEY=${geminiKey}`
    }

    fs.writeFileSync(envPath, envContent)
    console.log(chalk.green('✅ API Key 已保存到 .env'))
  }

  console.log(chalk.yellow('\n提示：請確保已安裝 gemini-pro 命令'))
  console.log(chalk.gray('如未安裝，請參考之前的安裝步驟'))
}

module.exports = { aiCommand }