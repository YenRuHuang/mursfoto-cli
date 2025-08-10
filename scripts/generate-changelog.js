#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

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
  changelog: '📝',
  feature: '✨',
  fix: '🐛',
  docs: '📚',
  style: '💄',
  refactor: '♻️',
  test: '🧪',
  chore: '🔧'
}

/**
 * 執行 Git 命令
 */
function execGitCommand (command) {
  try {
    return execSync(command, { encoding: 'utf8' }).trim()
  } catch (error) {
    console.error(colors.error(`${icons.error} Git 命令執行失敗: ${command}`))
    return ''
  }
}

/**
 * 獲取當前版本
 */
function getCurrentVersion () {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    return packageJson.version
  } catch (error) {
    return '0.0.0'
  }
}

/**
 * 獲取上一個版本標籤
 */
function getPreviousVersionTag () {
  const tags = execGitCommand('git tag --list --sort=-version:refname')
  const tagList = tags.split('\n').filter(tag => tag.match(/^v?\d+\.\d+\.\d+$/))

  // 返回最新的版本標籤（如果存在）
  return tagList.length > 1 ? tagList[1] : null
}

/**
 * 獲取 Git 提交記錄
 */
function getCommitsSinceLastVersion () {
  const previousTag = getPreviousVersionTag()
  const command = previousTag
    ? `git log ${previousTag}..HEAD --oneline --no-merges`
    : 'git log --oneline --no-merges'

  const commits = execGitCommand(command)
  return commits ? commits.split('\n') : []
}

/**
 * 分析提交類型
 */
function categorizeCommit (commit) {
  const message = commit.toLowerCase()

  // 根據 conventional commits 和 emoji 分類
  if (message.includes('feat') || message.includes('✨') || message.includes('🚀')) {
    return { type: 'features', icon: icons.feature, label: '新功能' }
  }
  if (message.includes('fix') || message.includes('🐛') || message.includes('🔧')) {
    return { type: 'fixes', icon: icons.fix, label: '錯誤修復' }
  }
  if (message.includes('docs') || message.includes('📚') || message.includes('📝')) {
    return { type: 'docs', icon: icons.docs, label: '文檔更新' }
  }
  if (message.includes('style') || message.includes('💄') || message.includes('🎨')) {
    return { type: 'style', icon: icons.style, label: '樣式調整' }
  }
  if (message.includes('refactor') || message.includes('♻️')) {
    return { type: 'refactor', icon: icons.refactor, label: '重構優化' }
  }
  if (message.includes('test') || message.includes('🧪') || message.includes('✅')) {
    return { type: 'tests', icon: icons.test, label: '測試相關' }
  }
  if (message.includes('chore') || message.includes('🔧') || message.includes('⚙️')) {
    return { type: 'chore', icon: icons.chore, label: '維護更新' }
  }

  // 預設歸類為改進
  return { type: 'improvements', icon: '⚡', label: '功能改進' }
}

/**
 * 生成變更日誌內容
 */
function generateChangelogContent () {
  const currentVersion = getCurrentVersion()
  const currentDate = new Date().toLocaleDateString('zh-TW')
  const commits = getCommitsSinceLastVersion()

  if (commits.length === 0) {
    console.log(colors.warning(`${icons.warning} 沒有找到新的提交記錄`))
    return null
  }

  // 分類提交
  const categorizedCommits = {
    features: [],
    fixes: [],
    improvements: [],
    docs: [],
    style: [],
    refactor: [],
    tests: [],
    chore: []
  }

  commits.forEach(commit => {
    if (commit.trim()) {
      const category = categorizeCommit(commit)
      const cleanCommit = commit.replace(/^[a-f0-9]+ /, '') // 移除 hash
      categorizedCommits[category.type].push({
        message: cleanCommit,
        icon: category.icon
      })
    }
  })

  // 生成變更日誌內容
  let changelogContent = `## [${currentVersion}] - ${currentDate}\n\n`

  // 按類別輸出
  const categories = [
    { key: 'features', label: '🆕 新功能' },
    { key: 'improvements', label: '⚡ 功能改進' },
    { key: 'fixes', label: '🐛 錯誤修復' },
    { key: 'refactor', label: '♻️ 重構優化' },
    { key: 'style', label: '💄 樣式調整' },
    { key: 'docs', label: '📚 文檔更新' },
    { key: 'tests', label: '🧪 測試相關' },
    { key: 'chore', label: '🔧 維護更新' }
  ]

  categories.forEach(category => {
    const commits = categorizedCommits[category.key]
    if (commits.length > 0) {
      changelogContent += `### ${category.label}\n\n`
      commits.forEach(commit => {
        changelogContent += `- ${commit.icon} ${commit.message}\n`
      })
      changelogContent += '\n'
    }
  })

  // 添加統計信息
  const totalCommits = commits.length
  const contributors = execGitCommand('git shortlog -sn --since="1 month ago"').split('\n').length

  changelogContent += '### 📊 本版本統計\n\n'
  changelogContent += `- 總計 ${totalCommits} 個提交\n`
  changelogContent += `- 活躍貢獻者 ${contributors} 位\n`
  changelogContent += `- 發布日期: ${currentDate}\n\n`

  return changelogContent
}

/**
 * 更新 CHANGELOG.md 檔案
 */
function updateChangelogFile (newContent) {
  const changelogPath = 'CHANGELOG.md'
  let existingContent = ''

  // 讀取現有的 CHANGELOG.md（如果存在）
  if (fs.existsSync(changelogPath)) {
    existingContent = fs.readFileSync(changelogPath, 'utf8')
  }

  // 創建新的 CHANGELOG.md 內容
  const header = '# 📝 @mursfoto/cli 更新日誌\n\n本文件記錄了 @mursfoto/cli 的所有重要變更。\n\n格式基於 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.0.0/)，\n版本號遵循 [語義化版本](https://semver.org/lang/zh-TW/)。\n\n'

  let fullContent
  if (existingContent) {
    // 如果已有 CHANGELOG.md，插入新版本到現有內容之前
    const contentWithoutHeader = existingContent.replace(/^#.*?\n\n.*?\n\n/s, '')
    fullContent = header + newContent + contentWithoutHeader
  } else {
    // 創建新的 CHANGELOG.md
    fullContent = header + newContent
  }

  // 寫入檔案
  fs.writeFileSync(changelogPath, fullContent, 'utf8')
  console.log(colors.success(`${icons.check} CHANGELOG.md 已更新`))
}

/**
 * 生成發布說明（用於 GitHub Release）
 */
function generateReleaseNotes () {
  const changelogContent = generateChangelogContent()
  if (!changelogContent) return

  const releaseNotesPath = 'RELEASE_NOTES.md'
  const releaseNotes = `# 🚀 @mursfoto/cli 發布說明\n\n${changelogContent}`

  fs.writeFileSync(releaseNotesPath, releaseNotes, 'utf8')
  console.log(colors.success(`${icons.check} RELEASE_NOTES.md 已生成`))
}

/**
 * 主要執行函數
 */
function main () {
  console.log(colors.title(`\n${icons.changelog} @mursfoto/cli 變更日誌生成器\n`))

  try {
    // 檢查是否在 Git 倉庫中
    const isGitRepo = execGitCommand('git rev-parse --git-dir')
    if (!isGitRepo) {
      console.error(colors.error(`${icons.error} 不在 Git 倉庫中，無法生成變更日誌`))
      process.exit(1)
    }

    // 生成變更日誌內容
    console.log(colors.info(`${icons.info} 分析 Git 提交記錄...`))
    const changelogContent = generateChangelogContent()

    if (!changelogContent) {
      console.log(colors.warning(`${icons.warning} 沒有新的變更需要記錄`))
      return
    }

    // 更新 CHANGELOG.md
    console.log(colors.info(`${icons.info} 更新 CHANGELOG.md...`))
    updateChangelogFile(changelogContent)

    // 生成發布說明
    console.log(colors.info(`${icons.info} 生成發布說明...`))
    generateReleaseNotes()

    console.log(colors.title(`\n${icons.rocket} 變更日誌生成完成！\n`))
    console.log(colors.info(`${icons.info} 檔案已更新:`))
    console.log(colors.success('  ✅ CHANGELOG.md'))
    console.log(colors.success('  ✅ RELEASE_NOTES.md\n'))
  } catch (error) {
    console.error(colors.error(`\n${icons.error} 變更日誌生成失敗：${error.message}\n`))
    process.exit(1)
  }
}

// 執行主程序
if (require.main === module) {
  main()
}

module.exports = {
  generateChangelogContent,
  updateChangelogFile,
  generateReleaseNotes,
  main
}
