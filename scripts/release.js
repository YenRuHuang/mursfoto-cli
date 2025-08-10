#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

// 獲取版本類型參數
const versionType = process.argv[2] || 'patch'
const validVersionTypes = ['patch', 'minor', 'major']

if (!validVersionTypes.includes(versionType)) {
  console.error(chalk.red('❌ 無效的版本類型。請使用: patch, minor, major'))
  process.exit(1)
}

// 顏色和圖示配置
const colors = {
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,
  title: chalk.bold.cyan
}

const icons = {
  rocket: '🚀',
  check: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  package: '📦',
  git: '🔄',
  test: '🧪',
  build: '🔨'
}

/**
 * 執行命令並處理錯誤
 */
function execCommand (command, errorMessage) {
  try {
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' })
    return result
  } catch (error) {
    console.error(colors.error(`${icons.error} ${errorMessage}`))
    console.error(colors.error(error.message))
    process.exit(1)
  }
}

/**
 * 檢查工作區狀態
 */
function checkWorkingDirectory () {
  console.log(colors.info(`${icons.info} 檢查工作區狀態...`))

  const status = execCommand('git status --porcelain', '檢查 Git 狀態失敗')

  if (status.trim()) {
    console.error(colors.error(`${icons.error} 工作區有未提交的變更，請先提交所有變更：`))
    console.log(status)
    process.exit(1)
  }

  console.log(colors.success(`${icons.check} 工作區狀態正常`))
}

/**
 * 運行測試
 */
function runTests () {
  console.log(colors.info(`${icons.test} 運行測試套件...`))

  execCommand('npm test', '測試失敗，發布中止')

  console.log(colors.success(`${icons.check} 所有測試通過`))
}

/**
 * 運行建構
 */
function runBuild () {
  console.log(colors.info(`${icons.build} 運行建構流程...`))

  execCommand('npm run build', '建構失敗，發布中止')

  console.log(colors.success(`${icons.check} 建構完成`))
}

/**
 * 更新版本號
 */
function updateVersion () {
  console.log(colors.info(`${icons.package} 更新版本號 (${versionType})...`))

  const newVersion = execCommand(`npm version ${versionType} --no-git-tag-version`, '版本更新失敗').trim()

  console.log(colors.success(`${icons.check} 版本已更新至 ${newVersion}`))
  return newVersion
}

/**
 * 生成變更日誌
 */
function generateChangelog () {
  console.log(colors.info(`${icons.info} 生成變更日誌...`))

  try {
    execSync('node scripts/generate-changelog.js', { stdio: 'inherit' })
    console.log(colors.success(`${icons.check} 變更日誌已生成`))
  } catch (error) {
    console.log(colors.warning(`${icons.warning} 變更日誌生成失敗，繼續發布流程`))
  }
}

/**
 * 提交變更
 */
function commitChanges (version) {
  console.log(colors.info(`${icons.git} 提交變更到 Git...`))

  execCommand('git add -A', 'Git add 失敗')
  execCommand(`git commit -m "🚀 Release ${version}"`, 'Git commit 失敗')
  execCommand(`git tag -a ${version} -m "Release ${version}"`, 'Git tag 失敗')

  console.log(colors.success(`${icons.check} 變更已提交並標記`))
}

/**
 * 發布到 NPM
 */
function publishToNpm () {
  console.log(colors.info(`${icons.package} 發布到 NPM...`))

  execCommand('npm publish', 'NPM 發布失敗')

  console.log(colors.success(`${icons.check} 成功發布到 NPM`))
}

/**
 * 推送到 GitHub
 */
function pushToGitHub () {
  console.log(colors.info(`${icons.git} 推送到 GitHub...`))

  execCommand('git push origin main --tags', 'GitHub 推送失敗')

  console.log(colors.success(`${icons.check} 已推送到 GitHub`))
}

/**
 * 創建 GitHub Release
 */
function createGitHubRelease (version) {
  console.log(colors.info(`${icons.rocket} 創建 GitHub Release...`))

  try {
    // 檢查是否安裝了 GitHub CLI
    const ghVersion = execCommand('gh --version', 'GitHub CLI 未安裝')
    console.log(colors.info(`${icons.info} 使用 GitHub CLI: ${ghVersion.split('\n')[0]}`))

    // 檢查是否有 RELEASE_NOTES.md
    const notesFile = fs.existsSync('RELEASE_NOTES.md') ? 'RELEASE_NOTES.md' : 'CHANGELOG.md'

    // 創建 GitHub Release
    const releaseCommand = `gh release create ${version} --title "🚀 Release ${version}" --notes-file ${notesFile}`
    execCommand(releaseCommand, 'GitHub Release 創建失敗')

    console.log(colors.success(`${icons.check} GitHub Release 已創建`))
    console.log(colors.info(`${icons.info} Release URL: https://github.com/mursfoto/cli/releases/tag/${version}`))
  } catch (error) {
    console.log(colors.warning(`${icons.warning} GitHub Release 自動創建失敗，請手動創建：`))
    console.log(colors.info(`   gh release create ${version} --title "🚀 Release ${version}" --notes-file CHANGELOG.md`))
    console.log(colors.info('   或訪問: https://github.com/mursfoto/cli/releases/new'))
  }
}

/**
 * 主要發布流程
 */
async function main () {
  console.log(colors.title(`\n${icons.rocket} @mursfoto/cli 自動化發布流程\n`))
  console.log(colors.info(`發布類型: ${versionType}`))
  console.log(colors.info(`時間: ${new Date().toLocaleString('zh-TW')}\n`))

  try {
    // 1. 檢查工作區
    checkWorkingDirectory()

    // 2. 運行測試
    runTests()

    // 3. 運行建構
    runBuild()

    // 4. 更新版本
    const newVersion = updateVersion()

    // 5. 生成變更日誌
    generateChangelog()

    // 6. 提交變更
    commitChanges(newVersion)

    // 7. 發布到 NPM
    publishToNpm()

    // 8. 推送到 GitHub
    pushToGitHub()

    // 9. 創建 GitHub Release
    createGitHubRelease(newVersion)

    console.log(colors.title(`\n${icons.rocket} 發布完成！`))
    console.log(colors.success(`${icons.check} 版本 ${newVersion} 已成功發布`))
    console.log(colors.info(`${icons.info} NPM: https://www.npmjs.com/package/@mursfoto/cli`))
    console.log(colors.info(`${icons.info} GitHub: https://github.com/mursfoto/cli/releases/tag/${newVersion}\n`))
  } catch (error) {
    console.error(colors.error(`\n${icons.error} 發布失敗：${error.message}\n`))
    process.exit(1)
  }
}

// 執行主程序
main()
