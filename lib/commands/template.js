const chalk = require('chalk')
const { getAvailableTemplates } = require('./create')
const { getTemplateConfig } = require('../utils/templates')

/**
 * 列出可用模板
 */
async function listTemplates () {
  console.log(chalk.cyan('\n📋 可用項目模板\n'))

  try {
    const templates = await getAvailableTemplates()

    templates.forEach((template, index) => {
      console.log(`${template.emoji} ${chalk.cyan.bold(template.name)}`)
      console.log(chalk.gray(`   描述: ${template.description}`))
      console.log(chalk.gray(`   ID: ${template.id}`))

      if (index < templates.length - 1) {
        console.log('')
      }
    })

    console.log(chalk.gray('\n💡 使用 `mursfoto create --template=<template-id>` 創建項目'))
    console.log(chalk.gray('🔍 使用 `mursfoto template info <template-name>` 查看詳細資訊\n'))
  } catch (error) {
    console.error(chalk.red(`❌ 獲取模板列表失敗: ${error.message}`))
    process.exit(1)
  }
}

/**
 * 顯示模板詳細資訊
 */
async function templateInfo (templateName) {
  try {
    const config = await getTemplateConfig(templateName)

    if (!config) {
      console.log(chalk.red(`❌ 未找到模板: ${templateName}\n`))
      console.log(chalk.gray('💡 使用 `mursfoto template list` 查看可用模板'))
      return
    }

    console.log(chalk.cyan(`\n📋 模板資訊: ${chalk.white.bold(config.name)}\n`))

    console.log(chalk.white.bold('基本資訊:'))
    console.log(`  名稱: ${config.name}`)
    console.log(`  描述: ${config.description}`)
    console.log(`  版本: ${config.version}`)
    console.log(`  端口: ${config.port || 3001}`)

    if (config.dependencies) {
      console.log(chalk.white.bold('\n📦 主要依賴:'))
      Object.entries(config.dependencies).forEach(([name, version]) => {
        console.log(`  ${chalk.cyan(name)}: ${version}`)
      })
    }

    if (config.devDependencies) {
      console.log(chalk.white.bold('\n🔧 開發依賴:'))
      Object.entries(config.devDependencies).forEach(([name, version]) => {
        console.log(`  ${chalk.gray(name)}: ${version}`)
      })
    }

    if (config.scripts) {
      console.log(chalk.white.bold('\n📜 可用腳本:'))
      Object.entries(config.scripts).forEach(([name, command]) => {
        console.log(`  ${chalk.green(name)}: ${chalk.gray(command)}`)
      })
    }

    if (config.quickStart && config.quickStart.length > 0) {
      console.log(chalk.white.bold('\n🚀 快速開始:'))
      config.quickStart.forEach((step, index) => {
        console.log(`  ${index + 1}. ${step}`)
      })
    }

    console.log(chalk.gray(`\n💡 使用命令創建項目: mursfoto create my-project --template=${templateName}\n`))
  } catch (error) {
    console.error(chalk.red(`❌ 獲取模板資訊失敗: ${error.message}`))
    process.exit(1)
  }
}

module.exports = {
  listTemplates,
  templateInfo
}
