const { Command } = require('commander')
const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const { Console } = require('../utils/console')

class StyleCommand {
  constructor () {
    this.console = new Console()
    this.stylesDir = path.join(__dirname, '../../.claude/output-styles')
    this.configFile = path.join(__dirname, '../../.claude/current-style.json')
  }

  register (program) {
    const styleCmd = new Command('style')
      .description('管理 AI 輸出風格')
      .option('-l, --list', '列出所有可用風格')
      .option('-c, --current', '顯示當前風格')
      .option('-s, --set <style>', '設定風格')
      .option('-i, --info <style>', '顯示風格詳細資訊')
      .option('-r, --reset', '重置為預設風格')
      .action(async (options) => {
        await this.execute(options)
      })

    program.addCommand(styleCmd)
  }

  async execute (options) {
    try {
      if (options.list) {
        await this.listStyles()
      } else if (options.current) {
        await this.showCurrentStyle()
      } else if (options.set) {
        await this.setStyle(options.set)
      } else if (options.info) {
        await this.showStyleInfo(options.info)
      } else if (options.reset) {
        await this.resetStyle()
      } else {
        await this.showHelp()
      }
    } catch (error) {
      this.console.error('風格管理失敗:', error.message)
      process.exit(1)
    }
  }

  async listStyles () {
    this.console.info('🎨 可用的 AI 輸出風格:')

    if (!fs.existsSync(this.stylesDir)) {
      this.console.warn('未找到風格目錄')
      return
    }

    const files = fs.readdirSync(this.stylesDir).filter(file => file.endsWith('.md'))

    if (files.length === 0) {
      this.console.warn('未找到任何風格檔案')
      return
    }

    for (const file of files) {
      const filePath = path.join(this.stylesDir, file)
      const content = fs.readFileSync(filePath, 'utf8')
      const metadata = this.parseStyleMetadata(content)
      const styleName = path.basename(file, '.md')

      this.console.success(`📝 ${styleName}`)
      this.console.log(`   名稱: ${metadata.name || '未知'}`)
      this.console.log(`   描述: ${metadata.description || '無描述'}`)
      this.console.log(`   版本: ${metadata.version || '1.0.0'}`)
      this.console.log('')
    }

    const current = this.getCurrentStyle()
    if (current) {
      this.console.info(`✨ 當前風格: ${current}`)
    }
  }

  async showCurrentStyle () {
    const current = this.getCurrentStyle()

    if (!current) {
      this.console.info('📋 當前使用預設風格')
      return
    }

    this.console.info(`✨ 當前風格: ${current}`)

    const stylePath = path.join(this.stylesDir, `${current}.md`)
    if (fs.existsSync(stylePath)) {
      const content = fs.readFileSync(stylePath, 'utf8')
      const metadata = this.parseStyleMetadata(content)

      this.console.log('')
      this.console.log(`📝 名稱: ${metadata.name}`)
      this.console.log(`📄 描述: ${metadata.description}`)
      this.console.log(`👤 作者: ${metadata.author}`)
      this.console.log(`🔖 版本: ${metadata.version}`)
    }
  }

  async setStyle (styleName) {
    const stylePath = path.join(this.stylesDir, `${styleName}.md`)

    if (!fs.existsSync(stylePath)) {
      this.console.error(`風格 "${styleName}" 不存在`)
      this.console.info('使用 --list 查看可用風格')
      return
    }

    // 保存當前風格設定
    const config = {
      style: styleName,
      setAt: new Date().toISOString(),
      version: '1.0.0'
    }

    // 確保目錄存在
    const configDir = path.dirname(this.configFile)
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true })
    }

    fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2))

    this.console.success(`✨ 已設定風格為: ${styleName}`)

    // 顯示風格資訊
    const content = fs.readFileSync(stylePath, 'utf8')
    const metadata = this.parseStyleMetadata(content)

    this.console.log('')
    this.console.log(`📝 ${metadata.name}`)
    this.console.log(`📄 ${metadata.description}`)
    this.console.log('')
    this.console.info('風格已啟用，接下來的 AI 回應將使用此風格')
  }

  async showStyleInfo (styleName) {
    const stylePath = path.join(this.stylesDir, `${styleName}.md`)

    if (!fs.existsSync(stylePath)) {
      this.console.error(`風格 "${styleName}" 不存在`)
      return
    }

    const content = fs.readFileSync(stylePath, 'utf8')
    const metadata = this.parseStyleMetadata(content)

    this.console.info(`📝 風格資訊: ${styleName}`)
    this.console.log('')
    this.console.log(`名稱: ${metadata.name}`)
    this.console.log(`描述: ${metadata.description}`)
    this.console.log(`作者: ${metadata.author}`)
    this.console.log(`版本: ${metadata.version}`)
    this.console.log('')

    // 顯示風格內容預覽（前幾行）
    const lines = content.split('\n')
    const contentStart = lines.findIndex(line => line.trim() === '---', 1) + 1
    const preview = lines.slice(contentStart, contentStart + 10).join('\n')

    this.console.log('📄 內容預覽:')
    this.console.log('─'.repeat(50))
    this.console.log(preview)
    if (lines.length > contentStart + 10) {
      this.console.log('...(更多內容)')
    }
    this.console.log('─'.repeat(50))
  }

  async resetStyle () {
    if (fs.existsSync(this.configFile)) {
      fs.unlinkSync(this.configFile)
      this.console.success('✨ 已重置為預設風格')
    } else {
      this.console.info('📋 目前已是預設風格')
    }
  }

  getCurrentStyle () {
    if (!fs.existsSync(this.configFile)) {
      return null
    }

    try {
      const config = JSON.parse(fs.readFileSync(this.configFile, 'utf8'))
      return config.style
    } catch (error) {
      return null
    }
  }

  parseStyleMetadata (content) {
    const lines = content.split('\n')
    let yamlContent = ''
    let inYaml = false

    for (const line of lines) {
      if (line.trim() === '---') {
        if (inYaml) {
          break
        }
        inYaml = true
        continue
      }

      if (inYaml) {
        yamlContent += line + '\n'
      }
    }

    try {
      return yaml.load(yamlContent) || {}
    } catch (error) {
      return {}
    }
  }

  async showHelp () {
    this.console.info('🎨 AI 輸出風格管理')
    this.console.log('')
    this.console.log('使用方式:')
    this.console.log('  mursfoto style --list                 # 列出所有風格')
    this.console.log('  mursfoto style --current              # 顯示當前風格')
    this.console.log('  mursfoto style --set <style>          # 設定風格')
    this.console.log('  mursfoto style --info <style>         # 顯示風格詳情')
    this.console.log('  mursfoto style --reset                # 重置為預設')
    this.console.log('')
    this.console.log('可用風格:')

    if (fs.existsSync(this.stylesDir)) {
      const files = fs.readdirSync(this.stylesDir).filter(file => file.endsWith('.md'))
      files.forEach(file => {
        const styleName = path.basename(file, '.md')
        this.console.log(`  - ${styleName}`)
      })
    }
  }
}

module.exports = StyleCommand
