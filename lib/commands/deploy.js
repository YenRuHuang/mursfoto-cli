const chalk = require('chalk')
const ora = require('ora')
const path = require('path')
const fs = require('fs-extra')
const { execSync } = require('child_process')
const { getGatewayPath, verifyGatewayIntegration } = require('../utils/gateway')
const { logSuccess, logError, logInfo, logWarning } = require('../utils/helpers')
const ZeaburDeployService = require('../services/ZeaburDeployService')

async function deployProject (options = {}) {
  console.log(chalk.cyan.bold('\n🚀 Mursfoto 服務部署工具\n'))

  const spinner = ora('檢查部署環境...').start()

  try {
    // 檢查當前目錄是否為有效的 Mursfoto 項目
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    if (!fs.existsSync(packageJsonPath)) {
      spinner.fail('當前目錄不是有效的 Node.js 項目')
      logError('未找到 package.json 文件')
      process.exit(1)
    }

    const packageJson = await fs.readJson(packageJsonPath)
    const projectName = packageJson.name

    if (!projectName) {
      spinner.fail('項目缺少名稱')
      logError('package.json 中未定義 name 字段')
      process.exit(1)
    }

    spinner.text = '檢查 Gateway 連接...'

    // 驗證 Gateway 集成
    const gatewayPath = getGatewayPath()
    const isIntegrated = await verifyGatewayIntegration(projectName, gatewayPath)

    if (!isIntegrated) {
      spinner.fail('服務未在 Gateway 中註冊')
      logWarning(`服務 ${projectName} 尚未註冊到 Mursfoto API Gateway`)
      logInfo('請先使用以下命令註冊服務：')
      console.log(chalk.yellow(`  mursfoto gateway register ${projectName}`))
      process.exit(1)
    }

    spinner.text = '構建項目...'

    // 運行構建命令（如果存在）
    if (packageJson.scripts && packageJson.scripts.build) {
      try {
        execSync('npm run build', {
          stdio: options.verbose ? 'inherit' : 'pipe',
          cwd: process.cwd()
        })
        logSuccess('項目構建完成')
      } catch (error) {
        spinner.fail('構建失敗')
        logError(`構建錯誤: ${error.message}`)
        if (options.verbose) {
          console.log(error.stdout?.toString())
          console.log(error.stderr?.toString())
        }
        process.exit(1)
      }
    }

    spinner.text = '檢查部署配置...'

    // 檢查 Dockerfile
    const dockerfilePath = path.join(process.cwd(), 'Dockerfile')
    if (!fs.existsSync(dockerfilePath)) {
      spinner.warn('未找到 Dockerfile')
      logWarning('建議添加 Dockerfile 以支持容器化部署')
    } else {
      logSuccess('找到 Dockerfile')
    }

    // 檢查環境變數配置
    const envExamplePath = path.join(process.cwd(), '.env.example')
    const envPath = path.join(process.cwd(), '.env')

    if (fs.existsSync(envExamplePath)) {
      logSuccess('找到環境變數範例文件')
    }

    if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
      logWarning('未找到 .env 文件，建議複製 .env.example 並配置')
    }

    spinner.text = '準備部署資訊...'

    // 生成部署資訊
    const deployInfo = {
      projectName,
      version: packageJson.version || '1.0.0',
      description: packageJson.description || '',
      deployTime: new Date().toISOString(),
      gatewayUrl: `https://gateway.mursfoto.com/api/${projectName}`,
      hasDockerfile: fs.existsSync(dockerfilePath),
      hasEnvExample: fs.existsSync(envExamplePath),
      hasEnv: fs.existsSync(envPath),
      scripts: Object.keys(packageJson.scripts || {})
    }

    spinner.succeed('部署檢查完成')

    // 顯示部署資訊
    console.log(chalk.cyan('\n📊 部署資訊：'))
    console.log(chalk.white('─'.repeat(50)))
    console.log(`${chalk.blue('項目名稱:')} ${deployInfo.projectName}`)
    console.log(`${chalk.blue('版本:')} ${deployInfo.version}`)
    console.log(`${chalk.blue('描述:')} ${deployInfo.description}`)
    console.log(`${chalk.blue('Gateway URL:')} ${chalk.green(deployInfo.gatewayUrl)}`)
    console.log(`${chalk.blue('容器化支持:')} ${deployInfo.hasDockerfile ? chalk.green('✓') : chalk.red('✗')}`)
    console.log(`${chalk.blue('環境配置:')} ${deployInfo.hasEnv ? chalk.green('✓') : chalk.yellow('△')}`)
    console.log(chalk.white('─'.repeat(50)))

    // 部署建議
    console.log(chalk.cyan('\n💡 部署建議：'))

    if (options.platform === 'zeabur' || !options.platform) {
      console.log(chalk.white('📦 Zeabur 部署：'))
      console.log('  1. 確保代碼已推送到 GitHub')
      console.log('  2. 在 Zeabur 中連接你的 GitHub 倉庫')
      console.log('  3. 配置環境變數（如果需要）')
      console.log(`  4. 部署完成後，服務將在 ${chalk.green(deployInfo.gatewayUrl)} 可用`)
    }

    if (options.platform === 'docker' || !options.platform) {
      console.log(chalk.white('\n🐳 Docker 部署：'))
      if (deployInfo.hasDockerfile) {
        console.log('  1. docker build -t ' + projectName + ' .')
        console.log('  2. docker run -p 3000:3000 ' + projectName)
      } else {
        console.log('  需要先創建 Dockerfile')
      }
    }

    // 後續步驟
    console.log(chalk.cyan('\n🔄 後續步驟：'))
    console.log('  • 測試本地服務: npm run dev')
    console.log('  • 檢查 Gateway 狀態: mursfoto status')
    console.log('  • 查看服務列表: mursfoto gateway list')

    logSuccess('部署檢查完成！')
  } catch (error) {
    spinner.fail('部署檢查失敗')
    logError(`錯誤: ${error.message}`)
    if (options.verbose) {
      console.error(error)
    }
    process.exit(1)
  }
}

async function deployToZeabur (options = {}) {
  console.log(chalk.cyan.bold('\n🚀 真正的 Zeabur 自動部署\n'))

  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    const packageJson = await fs.readJson(packageJsonPath)
    const projectName = packageJson.name

    // 讀取現有的 zeabur.json 配置（如果存在）
    const zeaburConfigPath = path.join(process.cwd(), 'zeabur.json')
    let envVars = {}

    if (fs.existsSync(zeaburConfigPath)) {
      const zeaburConfig = await fs.readJson(zeaburConfigPath)
      envVars = zeaburConfig.env || {}
      logSuccess('找到 zeabur.json 配置文件')
    }

    // 讀取 .env 文件（如果存在）
    const envPath = path.join(process.cwd(), '.env')
    if (fs.existsSync(envPath)) {
      const envContent = await fs.readFile(envPath, 'utf8')
      const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'))
      
      envLines.forEach(line => {
        const [key, ...valueParts] = line.split('=')
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim()
        }
      })
      logInfo('已讀取 .env 文件中的環境變數')
    }

    // 創建 Zeabur 部署服務
    const zeaburService = new ZeaburDeployService()

    // 執行真正的自動部署
    const result = await zeaburService.deploy(process.cwd(), {
      projectName: options.projectName || projectName,
      description: packageJson.description,
      envVars: envVars,
      buildCommand: packageJson.scripts?.build ? 'npm run build' : undefined,
      startCommand: packageJson.scripts?.start ? 'npm start' : 'node src/backend/server-simple.js',
      plan: options.plan || 'hobby',
      ...options
    })

    // 顯示部署結果
    console.log(chalk.cyan('\n🎉 部署成功！'))
    console.log(chalk.white('─'.repeat(60)))
    console.log(`${chalk.blue('項目 ID:')} ${result.projectId}`)
    console.log(`${chalk.blue('服務 ID:')} ${result.serviceId}`)
    console.log(`${chalk.blue('部署 ID:')} ${result.deploymentId}`)
    console.log(`${chalk.blue('服務 URL:')} ${chalk.green(result.url)}`)
    console.log(`${chalk.blue('控制面板:')} ${chalk.blue(result.dashboardUrl)}`)
    console.log(chalk.white('─'.repeat(60)))

    // 自動打開瀏覽器（可選）
    if (options.open !== false) {
      console.log(chalk.gray('\n正在開啟瀏覽器...'))
      try {
        execSync(`open "${result.url}"`, { stdio: 'ignore' })
      } catch (error) {
        console.log(chalk.gray(`請手動訪問: ${result.url}`))
      }
    }

    logSuccess('🚀 Zeabur 真正自動部署完成！')
    return result
  } catch (error) {
    logError(`❌ Zeabur 自動部署失敗: ${error.message}`)
    
    // 如果是 API Token 問題，提供幫助
    if (error.message.includes('ZEABUR_API_TOKEN')) {
      console.log(chalk.yellow('\n💡 解決方案：'))
      console.log('1. 訪問 https://dash.zeabur.com/account/developer')
      console.log('2. 創建新的 API Token')
      console.log('3. 將 Token 添加到 .env 文件：')
      console.log(chalk.gray('   ZEABUR_API_TOKEN=your_token_here'))
    }
    
    process.exit(1)
  }
}

module.exports = {
  deployProject,
  deployToZeabur
}
