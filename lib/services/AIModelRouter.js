const chalk = require('chalk')
const ora = require('ora')
const { spawn } = require('child_process')
const LMStudioService = require('./LMStudioService')

/**
 * 🧠 AI 模型路由器 - 混合 AI 架構核心
 * 智能選擇 LM Studio gpt-oss-20b 或 Claude API，確保最佳性能和可靠性
 */
class AIModelRouter {
  constructor () {
    this.claudeApiKey = process.env.ANTHROPIC_API_KEY
    this.claudeCodeProvider = process.env.CLAUDE_CODE_PROVIDER || 'auto' // 'auto', 'enabled', 'disabled'
    this.clineApiEndpoint = process.env.CLINE_API_ENDPOINT || 'http://localhost:3001' // Cline IDE API endpoint
    this.claudeCodeCLIPath = process.env.CLAUDE_CODE_CLI_PATH || '/Users/murs/.local/bin/claude-wrapper-cline' // Claude Code CLI 路徑
    this.defaultTimeout = 30000 // 30秒超時

    // 初始化 LM Studio 服務
    this.lmStudioService = new LMStudioService({
      apiEndpoint: process.env.LM_STUDIO_ENDPOINT || 'http://127.0.0.1:1234',
      modelName: process.env.LM_STUDIO_MODEL || 'unsloth/gpt-oss-20b-GGUF',
      timeout: 60000
    })

    // 性能監控
    this.stats = {
      totalRequests: 0,
      lmStudioRequests: 0,
      localModelRequests: 0,
      claudeApiRequests: 0,
      lmStudioErrors: 0,
      localModelErrors: 0,
      claudeApiErrors: 0,
      averageLMStudioTime: 0,
      averageLocalTime: 0,
      averageClaudeTime: 0
    }

    // 健康狀態
    this.healthStatus = {
      lmStudio: 'unknown',
      localModel: 'unknown',
      claudeApi: 'unknown',
      claudeCode: 'unknown',
      clineApi: 'unknown',
      lastChecked: null
    }

    this.initializeHealthCheck()
  }

  /**
   * 🚀 主要生成方法 - 智能路由
   * @param {string} prompt - 提示詞
   * @param {Object} options - 生成選項
   * @returns {Object} 生成結果
   */
  async generate (prompt, options = {}) {
    const startTime = Date.now()
    this.stats.totalRequests++

    // 任務複雜度評估
    const complexity = this.assessComplexity(prompt, options)
    const forceClaudeApi = options.forceClaudeApi || complexity === 'high'

    let result = null
    let method = 'unknown'

    try {
      // 策略 1: 優先嘗試 LM Studio (你的本地 gpt-oss-20b)
      if (!forceClaudeApi && await this.isLMStudioHealthy()) {
        try {
          result = await this.lmStudioService.generate(prompt, options)
          method = 'lm-studio'
          this.stats.lmStudioRequests++
          this.stats.averageLMStudioTime = this.updateAverageTime(
            this.stats.averageLMStudioTime,
            this.stats.lmStudioRequests,
            Date.now() - startTime
          )
        } catch (error) {
          console.warn(chalk.yellow(`⚠️ LM Studio 失敗，嘗試其他方案: ${error.message}`))
          this.stats.lmStudioErrors++
          this.healthStatus.lmStudio = 'error'
        }
      }

      // 策略 2: 嘗試 Claude Code Provider (Cline IDE)
      if (!result && this.claudeCodeProvider !== 'disabled' && await this.isClineApiHealthy()) {
        try {
          result = await this.generateWithClineApi(prompt, options)
          method = 'cline-claude'
          this.stats.claudeApiRequests++
          this.stats.averageClaudeTime = this.updateAverageTime(
            this.stats.averageClaudeTime,
            this.stats.claudeApiRequests,
            Date.now() - startTime
          )
        } catch (error) {
          console.warn(chalk.yellow(`⚠️ Cline Claude Code 失敗，嘗試其他方案: ${error.message}`))
          this.healthStatus.clineApi = 'error'
        }
      }

      // 策略 3: 嘗試 Ollama 本地模型（如果 LM Studio 和 Claude Code 都不可用）
      if (!result && !forceClaudeApi && await this.isLocalModelHealthy()) {
        try {
          result = await this.generateWithLocalModel(prompt, options)
          method = 'ollama-local'
          this.stats.localModelRequests++
          this.stats.averageLocalTime = this.updateAverageTime(
            this.stats.averageLocalTime,
            this.stats.localModelRequests,
            Date.now() - startTime
          )
        } catch (error) {
          console.warn(chalk.yellow(`⚠️ Ollama 本地模型失敗，切換到 Claude API: ${error.message}`))
          this.stats.localModelErrors++
          this.healthStatus.localModel = 'error'
        }
      }
    } catch (error) {
      console.warn(chalk.yellow(`⚠️ 本地模型失敗，切換到 Claude API: ${error.message}`))
    }

    // 策略 4: 最後備援使用原生 Claude API
    if (!result) {
      if (!this.claudeApiKey) {
        throw new Error('所有 AI 服務都不可用：請配置 LM Studio、Claude Code Provider、本地模型或 Anthropic API Key')
      }

      try {
        result = await this.generateWithClaudeApi(prompt, options)
        method = 'claude-api'
        this.stats.claudeApiRequests++
        this.stats.averageClaudeTime = this.updateAverageTime(
          this.stats.averageClaudeTime,
          this.stats.claudeApiRequests,
          Date.now() - startTime
        )
      } catch (error) {
        this.stats.claudeApiErrors++
        this.healthStatus.claudeApi = 'error'
        throw new Error(`所有 AI 模型都不可用: ${error.message}`)
      }
    }

    return {
      ...result,
      metadata: {
        method,
        complexity,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * 🎨 LM Studio 健康檢查
   */
  async isLMStudioHealthy () {
    try {
      // 如果最近檢查過且狀態良好，直接返回
      const now = Date.now()
      if (this.healthStatus.lastChecked &&
          (now - this.healthStatus.lastChecked) < 60000 && // 1分鐘內
          this.healthStatus.lmStudio === 'healthy') {
        return true
      }

      // 使用 LMStudioService 的健康檢查
      const isHealthy = await this.lmStudioService.healthCheck()
      
      this.healthStatus.lmStudio = isHealthy ? 'healthy' : 'unhealthy'
      this.healthStatus.lastChecked = now

      return isHealthy
    } catch (error) {
      this.healthStatus.lmStudio = 'error'
      this.healthStatus.lastChecked = Date.now()
      return false
    }
  }

  /**
   * 🤖 本地模型生成
   * @param {string} prompt - 提示詞
   * @param {Object} options - 選項
   */
  async generateWithLocalModel (prompt, options = {}) {
    const spinner = ora('🏠 本地 AI 模型處理中...').start()

    try {
      // 使用 harmony 格式包裝提示詞
      const formattedPrompt = this.formatPromptForLocal(prompt, options)

      const result = await this.callOllamaApi(formattedPrompt, options)

      spinner.succeed(chalk.green('✅ 本地 AI 模型完成'))

      return {
        content: result,
        model: this.localModelName,
        usage: {
          cost: 0, // 本地模型免費
          tokens: this.estimateTokens(result)
        }
      }
    } catch (error) {
      spinner.fail(chalk.red('❌ 本地 AI 模型失敗'))
      throw error
    }
  }

  /**
   * ☁️ Claude API 生成
   * @param {string} prompt - 提示詞
   * @param {Object} options - 選項
   */
  async generateWithClaudeApi (prompt, options = {}) {
    const spinner = ora('☁️ Claude API 處理中...').start()

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: options.claudeModel || 'claude-3-sonnet-20241022',
          max_tokens: options.maxTokens || 4000,
          system: options.systemPrompt || 'You are a helpful AI assistant specialized in code generation.',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      })

      if (!response.ok) {
        throw new Error(`Claude API 錯誤: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const content = data.content[0].text

      spinner.succeed(chalk.green('✅ Claude API 完成'))

      return {
        content,
        model: data.model,
        usage: {
          cost: this.calculateClaudeCost(data.usage),
          tokens: data.usage
        }
      }
    } catch (error) {
      spinner.fail(chalk.red('❌ Claude API 失敗'))
      throw error
    }
  }

  /**
   * 🔍 任務複雜度評估
   * @param {string} prompt - 提示詞
   * @param {Object} options - 選項
   */
  assessComplexity (prompt, options = {}) {
    const highComplexityKeywords = [
      'architecture', '架構', 'system design', '系統設計',
      'microservices', '微服務', 'distributed', '分散式',
      'complex algorithm', '複雜演算法', 'optimization', '優化',
      'security analysis', '安全分析', 'performance tuning', '效能調校'
    ]

    const mediumComplexityKeywords = [
      'api design', 'API設計', 'database schema', '資料庫結構',
      'integration', '整合', 'workflow', '工作流程',
      'refactor', '重構', 'testing strategy', '測試策略'
    ]

    const promptLower = prompt.toLowerCase()

    // 強制使用 Claude 的情況
    if (options.forceClaudeApi || options.complexity === 'high') {
      return 'high'
    }

    // 高複雜度檢測
    if (highComplexityKeywords.some(keyword => promptLower.includes(keyword.toLowerCase()))) {
      return 'high'
    }

    // 中等複雜度檢測
    if (mediumComplexityKeywords.some(keyword => promptLower.includes(keyword.toLowerCase())) ||
        prompt.length > 1000) {
      return 'medium'
    }

    return 'low'
  }

  /**
   * 🏥 本地模型健康檢查
   */
  async isLocalModelHealthy () {
    try {
      // 如果最近檢查過且狀態良好，直接返回
      const now = Date.now()
      if (this.healthStatus.lastChecked &&
          (now - this.healthStatus.lastChecked) < 60000 && // 1分鐘內
          this.healthStatus.localModel === 'healthy') {
        return true
      }

      // 執行快速健康檢查
      const testResult = await this.callOllamaApi('Hello', { timeout: 10000 })

      this.healthStatus.localModel = testResult ? 'healthy' : 'unhealthy'
      this.healthStatus.lastChecked = now

      return this.healthStatus.localModel === 'healthy'
    } catch (error) {
      this.healthStatus.localModel = 'error'
      this.healthStatus.lastChecked = Date.now()
      return false
    }
  }

  /**
   * 🔗 Ollama API 調用 (HTTP API)
   * @param {string} prompt - 提示詞
   * @param {Object} options - 選項
   */
  async callOllamaApi (prompt, options = {}) {
    const timeout = options.timeout || this.defaultTimeout

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.localModelName,
          prompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            top_k: 40
          }
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Ollama HTTP API 錯誤: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.response) {
        throw new Error('Ollama 回應格式無效')
      }

      return data.response
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Ollama 調用超時 (${timeout}ms)`)
      }

      if (error.code === 'ECONNREFUSED') {
        throw new Error('Ollama 服務未運行，請啟動 Ollama')
      }

      throw error
    }
  }

  /**
   * 🧹 清理 Ollama 輸出
   * @param {string} rawOutput - 原始輸出
   */
  cleanOllamaOutput (rawOutput) {
    // 移除 ANSI 轉義序列和載入動畫
    return rawOutput
      .replace(/[\u001B\u009B][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')
      .replace(/[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/g, '')
      .replace(/^\s*[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏\s]+/gm, '')
      .replace(/Thinking\.\.\./g, '')
      .replace(/\.\.\.done thinking\./g, '')
      .trim()
  }

  /**
   * 🌟 使用 Cline IDE 的 Claude Code Provider
   * @param {string} prompt - 提示詞
   * @param {Object} options - 選項
   */
  async generateWithClineApi (prompt, options = {}) {
    const spinner = ora('🌟 Cline IDE Claude Code 處理中...').start()

    try {
      // 嘗試透過 Cline IDE 的內建通信機制
      const result = await this.callClineIDE(prompt, options)

      spinner.succeed(chalk.green('✅ Cline IDE Claude Code 完成'))

      return {
        content: result,
        model: 'claude-code-via-cline-ide',
        usage: {
          cost: 0, // 使用 Claude Max 訂閱
          tokens: this.estimateTokens(result)
        }
      }
    } catch (error) {
      spinner.fail(chalk.red('❌ Cline IDE Claude Code 失敗'))
      // 如果 Cline IDE 不可用，不要回退到付費 API
      throw error
    }
  }

  /**
   * 📡 直接調用 Cline IDE
   * @param {string} prompt - 提示詞
   * @param {Object} options - 選項
   */
  async callClineIDE (prompt, options = {}) {
    // 方法 1: 嘗試透過 VSCode Extension API
    try {
      const vscode = require('vscode')
      if (vscode && vscode.extensions) {
        const clineExt = vscode.extensions.getExtension('saoudrizwan.claude-dev')
        if (clineExt && clineExt.isActive) {
          // 如果 Cline extension 可用，透過它調用
          return await this.callThroughClineExtension(prompt, options)
        }
      }
    } catch (error) {
      // VSCode API 不可用，繼續嘗試其他方法
    }

    // 方法 2: 透過檔案系統通信
    return await this.callThroughFileSystem(prompt, options)
  }

  /**
   * 📁 透過檔案系統與 Cline IDE 通信
   * @param {string} prompt - 提示詞
   * @param {Object} options - 選項
   */
  async callThroughFileSystem (prompt, options = {}) {
    const fs = require('fs')
    const path = require('path')
    const { promisify } = require('util')
    const sleep = promisify(setTimeout)

    // 創建臨時通信目錄
    const tempDir = path.join(__dirname, '../../.cline-integration')

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const requestId = Date.now().toString()
    const requestFile = path.join(tempDir, `request-${requestId}.json`)
    const responseFile = path.join(tempDir, `response-${requestId}.json`)

    try {
      // 寫入請求檔案
      const request = {
        id: requestId,
        prompt: prompt,
        options: options,
        timestamp: new Date().toISOString()
      }

      fs.writeFileSync(requestFile, JSON.stringify(request, null, 2))

      // 等待 Cline IDE 處理並生成回應檔案
      let attempts = 0
      const maxAttempts = 60 // 30秒 timeout

      while (attempts < maxAttempts) {
        if (fs.existsSync(responseFile)) {
          const responseData = JSON.parse(fs.readFileSync(responseFile, 'utf8'))

          // 清理臨時檔案
          fs.unlinkSync(requestFile)
          fs.unlinkSync(responseFile)

          if (responseData.error) {
            throw new Error(responseData.error)
          }

          return responseData.content
        }

        await sleep(500) // 等待 500ms
        attempts++
      }

      // 清理未完成的請求檔案
      if (fs.existsSync(requestFile)) {
        fs.unlinkSync(requestFile)
      }

      throw new Error('Cline IDE 回應超時 - 請確保 Cline IDE 已啟動並已認證')
    } catch (error) {
      // 清理檔案
      try {
        if (fs.existsSync(requestFile)) fs.unlinkSync(requestFile)
        if (fs.existsSync(responseFile)) fs.unlinkSync(responseFile)
      } catch (cleanupError) {
        // 忽略清理錯誤
      }

      throw error
    }
  }

  /**
   * 🌐 透過 HTTP API 使用 Cline
   */
  async generateWithClineHttpApi (prompt, options = {}) {
    const response = await fetch(`${this.clineApiEndpoint}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        message: prompt,
        provider: 'claude-code',
        model: options.claudeModel || 'claude-sonnet-4-20250514',
        max_tokens: options.maxTokens || 4000,
        system: options.systemPrompt || 'You are a helpful AI assistant specialized in code generation and development tasks.'
      }),
      timeout: this.defaultTimeout
    })

    if (!response.ok) {
      throw new Error(`Cline HTTP API 錯誤: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return {
      content: data.response || data.content || data.message,
      model: 'claude-code-via-http',
      usage: {
        cost: 0,
        tokens: this.estimateTokens(data.response || data.content || data.message)
      }
    }
  }

  /**
   * 🖥️ 透過 CLI 使用 Claude Code Provider
   */
  async generateWithClaudeCodeCLI (prompt, options = {}) {
    const fs = require('fs')
    const { promisify } = require('util')
    const { exec } = require('child_process')
    const execAsync = promisify(exec)

    // 檢查 Claude Code CLI 是否存在
    if (!fs.existsSync(this.claudeCodeCLIPath)) {
      throw new Error(`Claude Code CLI 不存在: ${this.claudeCodeCLIPath}`)
    }

    // 準備系統提示詞
    const systemPrompt = options.systemPrompt || 'You are a helpful AI assistant specialized in code generation and development tasks.'
    const fullPrompt = `${systemPrompt}\n\nUser: ${prompt}\n\nAssistant:`

    // 執行 Claude Code CLI
    try {
      const { stdout, stderr } = await execAsync(`"${this.claudeCodeCLIPath}" --print "${fullPrompt.replace(/"/g, '\\"')}"`, {
        timeout: this.defaultTimeout,
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      })

      if (stderr) {
        console.warn(chalk.yellow(`Claude Code CLI 警告: ${stderr}`))
      }

      const content = stdout.trim()

      return {
        content,
        model: 'claude-code-via-cli',
        usage: {
          cost: 0, // 使用 Claude Max 訂閱
          tokens: this.estimateTokens(content)
        }
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Claude Code CLI 不可執行: ${this.claudeCodeCLIPath}`)
      }
      throw error
    }
  }

  /**
   * 🏥 Cline API 健康檢查
   */
  async isClineApiHealthy () {
    try {
      // 如果最近檢查過且狀態良好，直接返回
      const now = Date.now()
      if (this.healthStatus.lastChecked &&
          (now - this.healthStatus.lastChecked) < 60000 && // 1分鐘內
          this.healthStatus.clineApi === 'healthy') {
        return true
      }

      // 檢查 HTTP API 或 CLI 是否可用
      const httpHealthy = await this.isClineHttpApiHealthy()
      const cliHealthy = await this.isClaudeCodeCLIHealthy()

      this.healthStatus.clineApi = (httpHealthy || cliHealthy) ? 'healthy' : 'unhealthy'
      this.healthStatus.lastChecked = now

      return this.healthStatus.clineApi === 'healthy'
    } catch (error) {
      this.healthStatus.clineApi = 'error'
      this.healthStatus.lastChecked = Date.now()
      return false
    }
  }

  /**
   * 🌐 檢查 Cline HTTP API
   */
  async isClineHttpApiHealthy () {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5秒超時

      const response = await fetch(`${this.clineApiEndpoint}/api/health`, {
        method: 'GET',
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      return response.ok
    } catch (error) {
      return false
    }
  }

  /**
   * 🖥️ 檢查 Claude Code CLI
   */
  async isClaudeCodeCLIHealthy () {
    try {
      const fs = require('fs')

      // 檢查檔案是否存在且可執行
      if (!fs.existsSync(this.claudeCodeCLIPath)) {
        return false
      }

      const stats = fs.statSync(this.claudeCodeCLIPath)
      return stats.isFile() && !!(stats.mode & 0o111) // 檢查執行權限
    } catch (error) {
      return false
    }
  }

  /**
   * 📝 格式化本地模型提示詞
   * @param {string} prompt - 提示詞
   * @param {Object} options - 選項
   */
  formatPromptForLocal (prompt, options = {}) {
    const systemPrompt = options.systemPrompt ||
      'You are a helpful AI assistant specialized in code generation and development tasks.'

    // 簡化版 harmony 格式
    return `${systemPrompt}\n\nUser: ${prompt}\n\nAssistant:`
  }

  /**
   * 🧮 計算 Claude 成本（估算）
   * @param {Object} usage - 使用統計
   */
  calculateClaudeCost (usage) {
    if (!usage) return 0

    // Claude-3 Sonnet 價格 (估算)
    const inputCostPer1M = 3.0 // $3.00 per 1M input tokens
    const outputCostPer1M = 15.0 // $15.00 per 1M output tokens

    const inputCost = (usage.input_tokens || 0) / 1000000 * inputCostPer1M
    const outputCost = (usage.output_tokens || 0) / 1000000 * outputCostPer1M

    return inputCost + outputCost
  }

  /**
   * 📊 估算 token 數量
   * @param {string} text - 文本
   */
  estimateTokens (text) {
    // 簡單估算：1 token ≈ 4 字符
    return Math.ceil(text.length / 4)
  }

  /**
   * 📈 更新平均時間
   */
  updateAverageTime (currentAvg, count, newTime) {
    return ((currentAvg * (count - 1)) + newTime) / count
  }

  /**
   * 🔧 初始化健康檢查
   */
  async initializeHealthCheck () {
    // 啟動時檢查一次
    await this.isLocalModelHealthy()

    // 每 5 分鐘檢查一次
    setInterval(async () => {
      await this.isLocalModelHealthy()
    }, 300000)
  }

  /**
   * 📊 獲取統計信息
   */
  getStats () {
    const localSuccessRate = this.stats.localModelRequests > 0
      ? ((this.stats.localModelRequests - this.stats.localModelErrors) / this.stats.localModelRequests * 100).toFixed(1)
      : 0

    const claudeSuccessRate = this.stats.claudeApiRequests > 0
      ? ((this.stats.claudeApiRequests - this.stats.claudeApiErrors) / this.stats.claudeApiRequests * 100).toFixed(1)
      : 0

    return {
      ...this.stats,
      healthStatus: this.healthStatus,
      localSuccessRate: `${localSuccessRate}%`,
      claudeSuccessRate: `${claudeSuccessRate}%`,
      totalCostSavings: this.estimateCostSavings()
    }
  }

  /**
   * 💰 估算成本節省
   */
  estimateCostSavings () {
    // 假設每個本地請求平均節省 $0.01
    const avgSavingsPerLocalRequest = 0.01
    return (this.stats.localModelRequests * avgSavingsPerLocalRequest).toFixed(2)
  }

  /**
   * 🎯 強制使用特定模型
   * @param {string} prompt - 提示詞
   * @param {string} model - 模型類型 ('local' | 'claude')
   * @param {Object} options - 選項
   */
  async forceGenerate (prompt, model, options = {}) {
    if (model === 'local') {
      return await this.generateWithLocalModel(prompt, options)
    } else if (model === 'claude') {
      return await this.generateWithClaudeApi(prompt, options)
    } else {
      throw new Error(`不支援的模型類型: ${model}`)
    }
  }

  /**
   * 🔄 重置統計信息
   */
  resetStats () {
    this.stats = {
      totalRequests: 0,
      localModelRequests: 0,
      claudeApiRequests: 0,
      localModelErrors: 0,
      claudeApiErrors: 0,
      averageLocalTime: 0,
      averageClaudeTime: 0
    }
  }
}

module.exports = AIModelRouter
