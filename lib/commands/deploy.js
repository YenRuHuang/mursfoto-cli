const chalk = require('chalk')
const ora = require('ora')
const path = require('path')
const fs = require('fs-extra')
const { execSync } = require('child_process')
const { getGatewayPath, verifyGatewayIntegration } = require('../utils/gateway')
const { logSuccess, logError, logInfo, logWarning } = require('../utils/helpers')

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
  console.log(chalk.cyan.bold('\n🚀 部署到 Zeabur\n'))

  const spinner = ora('準備 Zeabur 部署...').start()

  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    const packageJson = await fs.readJson(packageJsonPath)
    const projectName = packageJson.name

    // 檢查 zeabur.json 配置
    const zeaburConfigPath = path.join(process.cwd(), 'zeabur.json')
    let zeaburConfig = {}

    if (fs.existsSync(zeaburConfigPath)) {
      zeaburConfig = await fs.readJson(zeaburConfigPath)
      logSuccess('找到 zeabur.json 配置文件')
    } else {
      // 創建基本的 zeabur.json
      zeaburConfig = {
        name: projectName,
        plan: 'hobby',
        env: {}
      }

      await fs.writeJson(zeaburConfigPath, zeaburConfig, { spaces: 2 })
      logSuccess('創建 zeabur.json 配置文件')
    }

    spinner.text = '檢查 Git 狀態...'

    // 檢查 Git 狀態
    try {
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' })
      if (gitStatus.trim()) {
        logWarning('檢測到未提交的變更')
        console.log(chalk.yellow('\n未提交的文件：'))
        console.log(gitStatus)
      }
    } catch (error) {
      logWarning('無法檢查 Git 狀態')
    }

    spinner.succeed('Zeabur 部署準備完成')

    console.log(chalk.cyan('\n📋 Zeabur 部署指南：'))
    console.log(chalk.white('─'.repeat(50)))
    console.log('1. 確保代碼已推送到 GitHub：')
    console.log(chalk.gray('   git add . && git commit -m "準備部署" && git push'))
    console.log('\n2. 訪問 Zeabur Dashboard：')
    console.log(chalk.blue('   https://dash.zeabur.com'))
    console.log('\n3. 創建新項目並連接 GitHub 倉庫')
    console.log('\n4. 配置環境變數（如需要）')
    console.log('\n5. 部署完成後將自動在以下地址可用：')
    console.log(chalk.green(`   https://gateway.mursfoto.com/api/${projectName}`))
    console.log(chalk.white('─'.repeat(50)))

    logSuccess('Zeabur 部署指南顯示完成！')
  } catch (error) {
    spinner.fail('Zeabur 部署準備失敗')
    logError(`錯誤: ${error.message}`)
    process.exit(1)
  }
}

module.exports = {
  deployProject,
  deployToZeabur
}
