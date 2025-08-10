const chalk = require('chalk')
const ora = require('ora')
const { spawn } = require('child_process')

/**
 * 🧠 AI 模型路由器 - 混合 AI 架構核心
 * 智能選擇本地 gpt-oss-20b 或 Claude API，確保最佳性能和可靠性
 */
class AIModelRouter {
  constructor () {
    this.claudeApiKey = process.env.ANTHROPIC_API_KEY
    this.localModelName = 'gpt-oss:20b'
    this.defaultTimeout = 30000 // 30秒超時

    // 性能監控
    this.stats = {
      totalRequests: 0,
      localModelRequests: 0,
      claudeApiRequests: 0,
      localModelErrors: 0,
      claudeApiErrors: 0,
      averageLocalTime: 0,
      averageClaudeTime: 0
    }

    // 健康狀態
    this.healthStatus = {
      localModel: 'unknown',
      claudeApi: 'unknown',
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
      // 策略 1: 優先嘗試本地模型（除非強制使用 Claude 或高複雜度任務）
      if (!forceClaudeApi && await this.isLocalModelHealthy()) {
        result = await this.generateWithLocalModel(prompt, options)
        method = 'local'
        this.stats.localModelRequests++
        this.stats.averageLocalTime = this.updateAverageTime(
          this.stats.averageLocalTime,
          this.stats.localModelRequests,
          Date.now() - startTime
        )
      }
    } catch (error) {
      console.warn(chalk.yellow(`⚠️ 本地模型失敗，切換到 Claude API: ${error.message}`))
      this.stats.localModelErrors++
      this.healthStatus.localModel = 'error'
    }

    // 策略 2: 備援使用 Claude API
    if (!result) {
      if (!this.claudeApiKey) {
        throw new Error('本地模型不可用且未配置 Claude API Key')
      }

      try {
        result = await this.generateWithClaudeApi(prompt, options)
        method = 'claude'
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
      .replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')
      .replace(/[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/g, '')
      .replace(/^\s*[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏\s]+/gm, '')
      .replace(/Thinking\.\.\./g, '')
      .replace(/\.\.\.done thinking\./g, '')
      .trim()
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
