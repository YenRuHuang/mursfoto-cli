const chalk = require('chalk')
const ora = require('ora')
const path = require('path')
const fs = require('fs-extra')
const { execSync } = require('child_process')
const { logSuccess, logError, logInfo, logWarning } = require('../utils/helpers')

/**
 * UV 配置設置命令
 */
class SetupCommand {
  constructor () {
    this.uvConfigFiles = {
      pyproject: 'pyproject.toml',
      pythonVersion: '.python-version',
      runScript: 'run_with_uv.sh'
    }
  }

  /**
   * 執行 UV 配置設置
   */
  async execute (action, options = {}) {
    switch (action) {
      case 'uv':
        await this.setupUV(options)
        break
      case 'check':
        await this.checkUVEnvironment(options)
        break
      case 'remove':
        await this.removeUVConfig(options)
        break
      default:
        await this.showHelp()
    }
  }

  /**
   * 設置 UV 配置
   */
  async setupUV (options = {}) {
    console.log(chalk.cyan.bold('\n🚀 UV Python 開發環境配置器\n'))
    const targetPath = options.path || process.cwd()
    const spinner = ora('檢查目標目錄...').start()

    try {
      // 檢查目標目錄
      if (!fs.existsSync(targetPath)) {
        spinner.fail('目標目錄不存在')
        logError(`路徑不存在: ${targetPath}`)
        return
      }

      spinner.text = '檢查現有 UV 配置...'

      // 檢查是否已有 UV 配置
      const existingFiles = this.checkExistingConfig(targetPath)
      
      if (existingFiles.length > 0 && !options.force) {
        spinner.warn('發現現有 UV 配置')
        logWarning('以下文件已存在:')
        existingFiles.forEach(file => console.log(`  • ${file}`))
        logInfo('使用 --force 參數覆蓋現有配置')
        return
      }

      spinner.text = '複製 UV 配置文件...'

      // 複製配置文件
      await this.copyUVConfig(targetPath, options)

      spinner.text = '設置執行權限...'

      // 設置執行權限
      const runScriptPath = path.join(targetPath, this.uvConfigFiles.runScript)
      if (fs.existsSync(runScriptPath)) {
        fs.chmodSync(runScriptPath, '755')
      }

      spinner.text = '創建 README 文件...'

      // 創建 README 如果不存在
      await this.ensureReadme(targetPath, options)

      spinner.text = '測試 UV 環境...'

      // 測試 UV 環境
      const uvTestResult = await this.testUVEnvironment(targetPath, options)

      if (uvTestResult.success) {
        spinner.succeed('UV 配置設置完成')
        // 顯示成功信息
        console.log(chalk.cyan('\n✅ UV 配置成功部署！'))
        console.log(chalk.white('─'.repeat(50)))
        console.log(`${chalk.blue('目標路徑:')} ${targetPath}`)
        console.log(`${chalk.blue('Python 版本:')} ${uvTestResult.pythonVersion}`)
        console.log(`${chalk.blue('套件數量:')} ${uvTestResult.packageCount}`)
        console.log(`${chalk.blue('安裝時間:')} ${uvTestResult.installTime}`)
        console.log(chalk.white('─'.repeat(50)))

        // 使用指南
        console.log(chalk.cyan('\n🚀 使用指南：'))
        console.log('  • 執行腳本: ./run_with_uv.sh')
        console.log('  • 直接運行: uv run python your_script.py')
        console.log('  • 安裝依賴: uv sync')
        console.log('  • 添加套件: uv add package_name')

        logSuccess('UV 環境配置完成！')
      } else {
        spinner.fail('UV 環境測試失敗')
        logError(`測試錯誤: ${uvTestResult.error}`)
      }

    } catch (error) {
      spinner.fail('UV 配置設置失敗')
      logError(`設置錯誤: ${error.message}`)
      if (options.verbose) {
        console.error(error)
      }
    }
  }

  /**
   * 檢查現有配置
   */
  checkExistingConfig (targetPath) {
    const existingFiles = []
    Object.values(this.uvConfigFiles).forEach(filename => {
      const filePath = path.join(targetPath, filename)
      if (fs.existsSync(filePath)) {
        existingFiles.push(filename)
      }
    })

    return existingFiles
  }

  /**
   * 複製 UV 配置文件
   */
  async copyUVConfig (targetPath, options = {}) {
    const sourceBasePath = path.join(__dirname, '../../../') // 指向 Cline 目錄

    // 複製 pyproject.toml
    const pyprojectSource = path.join(sourceBasePath, this.uvConfigFiles.pyproject)
    const pyprojectTarget = path.join(targetPath, this.uvConfigFiles.pyproject)
    if (fs.existsSync(pyprojectSource)) {
      await fs.copy(pyprojectSource, pyprojectTarget)
      logSuccess('pyproject.toml 已複製')
    } else {
      // 創建默認的 pyproject.toml
      await this.createDefaultPyproject(pyprojectTarget, options)
      logSuccess('已創建默認 pyproject.toml')
    }

    // 複製 .python-version
    const pythonVersionSource = path.join(sourceBasePath, this.uvConfigFiles.pythonVersion)
    const pythonVersionTarget = path.join(targetPath, this.uvConfigFiles.pythonVersion)
    if (fs.existsSync(pythonVersionSource)) {
      await fs.copy(pythonVersionSource, pythonVersionTarget)
      logSuccess('.python-version 已複製')
    } else {
      // 創建默認版本文件
      await fs.writeFile(pythonVersionTarget, '3.11.13\n')
      logSuccess('已創建 .python-version')
    }

    // 複製執行腳本
    const runScriptSource = path.join(sourceBasePath, this.uvConfigFiles.runScript)
    const runScriptTarget = path.join(targetPath, this.uvConfigFiles.runScript)
    if (fs.existsSync(runScriptSource)) {
      await fs.copy(runScriptSource, runScriptTarget)
      logSuccess('run_with_uv.sh 已複製')
    } else {
      // 創建默認執行腳本
      await this.createDefaultRunScript(runScriptTarget, options)
      logSuccess('已創建 run_with_uv.sh')
    }
  }

  /**
   * 創建默認 pyproject.toml
   */
  async createDefaultPyproject (targetPath, options = {}) {
    const projectName = options.projectName || path.basename(path.dirname(targetPath)) || 'python-ml-project'
    const defaultConfig = `[project]
name = "${projectName}"
version = "0.1.0"
description = "Python ML project managed with UV"
dependencies = [
    "torch>=2.0.0",
    "transformers>=4.30.0",
    "psutil",
    "accelerate",
    "numpy",
    "requests",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
include = ["*.py"]
exclude = ["test_*.py"]

[tool.hatch.build.targets.wheel.sources]
"." = "."

[project.scripts]
gpt-transformers = "gpt_oss_transformers:main"
quick-test = "quick_test_transformers:main"
`

    await fs.writeFile(targetPath, defaultConfig)
  }

  /**
   * 創建默認執行腳本
   */
  async createDefaultRunScript (targetPath, options = {}) {
    const defaultScript = `#!/bin/bash

echo "🚀 UV Python 專案執行器"
echo "========================="
echo "📋 可用的執行選項："
echo "   1. main              - 主要程序"
echo "   2. quick-test        - 快速測試"
echo "   3. custom            - 自定義腳本執行"
echo ""

read -p "請選擇要執行的腳本 (1-3): " choice

case $choice in
    1)
        echo "🚀 執行主要程序..."
        uv run python main.py
        ;;
    2)
        echo "🧪 執行快速測試..."
        uv run python -c "print('✅ UV 環境運行正常！')"
        ;;
    3)
        read -p "請輸入要執行的 Python 腳本名稱: " script_name
        echo "🔧 執行自定義腳本: $script_name"
        uv run python "$script_name"
        ;;
    *)
        echo "❌ 無效選擇"
        exit 1
        ;;
esac

echo ""
echo "✅ 執行完成！"
echo "💡 提示：使用 UV 可享受 10-100 倍的套件安裝速度提升"
`

    await fs.writeFile(targetPath, defaultScript)
  }

  /**
   * 確保 README 文件存在
   */
  async ensureReadme (targetPath, options = {}) {
    const readmePath = path.join(targetPath, 'README.md')
    if (!fs.existsSync(readmePath)) {
      const projectName = options.projectName || path.basename(targetPath) || 'Python ML Project'
      const readmeContent = `# ${projectName}

這是一個使用 UV 管理的 Python 專案。

## 特色功能
- 快速套件管理 (UV)
- GPU 加速支援 (CUDA/MPS)
- Transformers 和 PyTorch 整合
- 自動化環境管理

## 快速開始

\`\`\`bash
# 安裝依賴
uv sync

# 執行腳本
./run_with_uv.sh

# 或直接執行
uv run python your_script.py
\`\`\`

## 可用腳本
- main: 主要程序
- quick-test: 快速測試
- custom: 自定義腳本執行

## UV 優勢
- 10-100 倍更快的套件安裝速度
- 自動虛擬環境管理
- 依賴版本鎖定
- 並行安裝支援
`

      await fs.writeFile(readmePath, readmeContent)
      logSuccess('已創建 README.md')
    }
  }

  /**
   * 測試 UV 環境
   */
  async testUVEnvironment (targetPath, options = {}) {
    try {
      const startTime = Date.now()
      // 執行 UV 命令測試
      const result = execSync('uv run python --version', {
        cwd: targetPath,
        encoding: 'utf8',
        stdio: 'pipe'
      })

      const endTime = Date.now()
      const installTime = `${endTime - startTime}ms`

      // 解析結果
      const pythonVersion = result.trim()
      // 獲取套件數量
      let packageCount = 'Unknown'
      try {
        const lockPath = path.join(targetPath, 'uv.lock')
        if (fs.existsSync(lockPath)) {
          const lockContent = await fs.readFile(lockPath, 'utf8')
          const matches = lockContent.match(/\[\[package\]\]/g)
          packageCount = matches ? matches.length : 'Unknown'
        }
      } catch (error) {
        // 忽略套件計數錯誤
      }

      return {
        success: true,
        pythonVersion,
        packageCount,
        installTime
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 檢查 UV 環境狀態
   */
  async checkUVEnvironment (options = {}) {
    console.log(chalk.cyan.bold('\n🔍 UV 環境檢查\n'))
    const targetPath = options.path || process.cwd()
    const spinner = ora('檢查 UV 配置...').start()

    try {
      // 檢查配置文件
      const configStatus = {}
      Object.entries(this.uvConfigFiles).forEach(([key, filename]) => {
        const filePath = path.join(targetPath, filename)
        configStatus[key] = {
          exists: fs.existsSync(filePath),
          path: filePath
        }
      })

      spinner.succeed('UV 配置檢查完成')

      // 顯示檢查結果
      console.log(chalk.cyan('📊 配置文件狀態：'))
      console.log(chalk.white('─'.repeat(50)))
      Object.entries(configStatus).forEach(([key, status]) => {
        const icon = status.exists ? chalk.green('✓') : chalk.red('✗')
        const filename = this.uvConfigFiles[key]
        console.log(`${icon} ${filename}`)
      })

      // 測試 UV 環境
      console.log(chalk.cyan('\n🧪 UV 環境測試：'))
      const testResult = await this.testUVEnvironment(targetPath, options)
      if (testResult.success) {
        console.log(chalk.green('✅ UV 環境運行正常'))
        console.log(`   Python 版本: ${testResult.pythonVersion}`)
        console.log(`   套件數量: ${testResult.packageCount}`)
      } else {
        console.log(chalk.red('❌ UV 環境測試失敗'))
        console.log(`   錯誤: ${testResult.error}`)
      }

      console.log(chalk.white('─'.repeat(50)))

      logSuccess('UV 環境檢查完成')
    } catch (error) {
      spinner.fail('UV 環境檢查失敗')
      logError(`檢查錯誤: ${error.message}`)
    }
  }

  /**
   * 移除 UV 配置
   */
  async removeUVConfig (options = {}) {
    console.log(chalk.cyan.bold('\n🗑️  移除 UV 配置\n'))
    const targetPath = options.path || process.cwd()
    const spinner = ora('移除 UV 配置文件...').start()

    try {
      let removedCount = 0

      Object.values(this.uvConfigFiles).forEach(filename => {
        const filePath = path.join(targetPath, filename)
        if (fs.existsSync(filePath)) {
          fs.removeSync(filePath)
          removedCount++
          logInfo(`已移除: ${filename}`)
        }
      })

      // 移除 uv.lock 和 .venv
      const additionalFiles = ['uv.lock', '.venv']
      additionalFiles.forEach(filename => {
        const filePath = path.join(targetPath, filename)
        if (fs.existsSync(filePath)) {
          fs.removeSync(filePath)
          removedCount++
          logInfo(`已移除: ${filename}`)
        }
      })

      spinner.succeed(`UV 配置移除完成 (${removedCount} 個文件)`)
      logSuccess('UV 配置已完全移除')
    } catch (error) {
      spinner.fail('UV 配置移除失敗')
      logError(`移除錯誤: ${error.message}`)
    }
  }

  /**
   * 顯示幫助信息
   */
  async showHelp () {
    console.log(chalk.cyan.bold('\n🚀 UV 配置管理器\n'))
    console.log(chalk.white('可用命令：'))
    console.log('  • setup uv [options]     - 設置 UV 配置')
    console.log('  • setup check [options]  - 檢查 UV 環境')
    console.log('  • setup remove [options] - 移除 UV 配置')
    console.log('')
    console.log(chalk.white('選項：'))
    console.log('  --path <path>      - 指定目標路徑')
    console.log('  --force            - 強制覆蓋現有配置')
    console.log('  --project-name     - 指定專案名稱')
    console.log('  --verbose          - 顯示詳細輸出')
    console.log('')
    console.log(chalk.yellow('範例：'))
    console.log('  mursfoto setup uv --path ../my-project')
    console.log('  mursfoto setup check')
    console.log('  mursfoto setup remove --path ../old-project')
  }
}

module.exports = SetupCommand
