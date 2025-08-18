const chalk = require('chalk')
const ora = require('ora')

/**
 * 🎨 LM Studio 服務 - 本地 GPU 加速 AI 模型服務
 * 支援 unsloth/gpt-oss-20b-GGUF 等 GGUF 格式模型
 */
class LMStudioService {
  constructor (options = {}) {
    this.apiEndpoint = options.apiEndpoint || 'http://127.0.0.1:1234'
    this.modelName = options.modelName || 'unsloth/gpt-oss-20b-GGUF'
    this.defaultTimeout = options.timeout || 60000 // 60秒超時
    this.maxRetries = options.maxRetries || 2

    // 性能統計
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      totalTokensGenerated: 0
    }

    // 健康狀態
    this.lastHealthCheck = null
    this.isHealthy = false
  }

  /**
   * 🚀 主要生成方法
   * @param {string} prompt - 提示詞
   * @param {Object} options - 生成選項
   * @returns {Object} 生成結果
   */
  async generate (prompt, options = {}) {
    const startTime = Date.now()
    const spinner = ora('🎨 LM Studio GPU 加速處理中...').start()

    this.stats.totalRequests++

    try {
      // 檢查服務健康狀態
      if (!(await this.healthCheck())) {
        throw new Error('LM Studio 服務不可用，請確認模型已載入')
      }

      // 格式化提示詞
      const formattedPrompt = this.formatPrompt(prompt, options)

      // 調用 LM Studio API
      const result = await this.callLMStudioAPI(formattedPrompt, options)

      // 更新統計
      const responseTime = Date.now() - startTime
      this.stats.successfulRequests++
      this.stats.averageResponseTime = this.updateAverageTime(
        this.stats.averageResponseTime,
        this.stats.successfulRequests,
        responseTime
      )
      this.stats.totalTokensGenerated += this.estimateTokens(result.content)

      spinner.succeed(chalk.green(`✅ LM Studio 完成 (${responseTime}ms)`))

      return {
        content: result.content,
        model: this.modelName,
        usage: {
          cost: 0, // 本地模型免費
          tokens: this.estimateTokens(result.content),
          responseTime
        },
        metadata: {
          method: 'lm-studio',
          gpuAccelerated: true,
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      this.stats.failedRequests++
      spinner.fail(chalk.red(`❌ LM Studio 失敗: ${error.message}`))
      throw error
    }
  }

  /**
   * 🔗 調用 LM Studio API
   * @param {string} prompt - 格式化的提示詞
   * @param {Object} options - 選項
   */
  async callLMStudioAPI (prompt, options = {}) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.defaultTimeout)

    try {
      const response = await fetch(`${this.apiEndpoint}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: [
            {
              role: 'system',
              content: options.systemPrompt || '你是一個專業的 AI 助手，專門協助程式開發和技術問題。請使用繁體中文回答。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 4000,
          top_p: options.topP || 0.9,
          frequency_penalty: options.frequencyPenalty || 0,
          presence_penalty: options.presencePenalty || 0,
          stream: false
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`LM Studio API 錯誤 (${response.status}): ${errorText}`)
      }

      const data = await response.json()

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('LM Studio API 回應格式無效')
      }

      return {
        content: data.choices[0].message.content,
        usage: data.usage || {}
      }
    } catch (error) {
      clearTimeout(timeoutId)

      if (error.name === 'AbortError') {
        throw new Error(`LM Studio API 調用超時 (${this.defaultTimeout}ms)`)
      }

      if (error.code === 'ECONNREFUSED') {
        throw new Error('LM Studio 服務未運行，請啟動 LM Studio 並載入模型')
      }

      throw error
    }
  }

  /**
   * 🏥 健康檢查
   */
  async healthCheck () {
    try {
      // 如果最近檢查過且狀態良好，直接返回
      const now = Date.now()
      if (this.lastHealthCheck &&
          (now - this.lastHealthCheck) < 30000 && // 30秒內
          this.isHealthy) {
        return true
      }

      // 執行快速健康檢查
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超時

      const response = await fetch(`${this.apiEndpoint}/v1/models`, {
        method: 'GET',
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        // 檢查是否有可用的模型
        this.isHealthy = data.data && data.data.length > 0
      } else {
        this.isHealthy = false
      }

      this.lastHealthCheck = now
      return this.isHealthy
    } catch (error) {
      this.isHealthy = false
      this.lastHealthCheck = Date.now()
      return false
    }
  }

  /**
   * 📝 格式化提示詞
   * @param {string} prompt - 原始提示詞
   * @param {Object} options - 選項
   */
  formatPrompt (prompt, options = {}) {
    // 針對程式碼生成任務的特殊處理
    if (options.task === 'code-generation') {
      return `請協助生成高品質的程式碼。要求：
1. 使用最佳實踐和設計模式
2. 包含適當的註解和文檔
3. 考慮錯誤處理和邊界情況
4. 確保程式碼的可維護性和可擴展性

任務：${prompt}`
    }

    // 針對架構設計的特殊處理
    if (options.task === 'architecture-design') {
      return `請協助設計系統架構。要求：
1. 考慮可擴展性和性能
2. 遵循微服務和雲原生最佳實踐
3. 包含安全性考量
4. 提供清晰的架構圖描述

需求：${prompt}`
    }

    return prompt
  }

  /**
   * 🔄 重試機制
   * @param {Function} operation - 要重試的操作
   * @param {number} retries - 剩餘重試次數
   */
  async retry(operation, retries = this.maxRetries) {
    try {
      return await operation()
    } catch (error) {
      if (retries > 0) {
        console.warn(chalk.yellow(`⚠️ 重試中... (剩餘 ${retries} 次)`))
        await this.sleep(1000) // 等待 1 秒
        return this.retry(operation, retries - 1)
      }
      throw error
    }
  }

  /**
   * 📊 獲取可用模型列表
   */
  async getAvailableModels() {
    try {
      const response = await fetch(`${this.apiEndpoint}/v1/models`)
      
      if (!response.ok) {
        throw new Error(`無法獲取模型列表: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.warn(chalk.yellow(`⚠️ 無法獲取模型列表: ${error.message}`))
      return []
    }
  }

  /**
   * 🔧 切換模型
   * @param {string} modelName - 模型名稱
   */
  async switchModel(modelName) {
    const models = await this.getAvailableModels()
    const model = models.find(m => m.id === modelName)
    
    if (!model) {
      throw new Error(`模型 ${modelName} 不存在`)
    }
    
    this.modelName = modelName
    this.logger?.info(chalk.green(`✅ 已切換到模型: ${modelName}`))
  }

  /**
   * 📈 估算 token 數量
   * @param {string} text - 文本
   */
  estimateTokens(text) {
    // 中英文混合文本的 token 估算
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
    const otherChars = text.length - chineseChars
    
    // 中文字符：約 1.5 token/字，英文單詞：約 1.3 token/詞
    return Math.ceil(chineseChars * 1.5 + englishWords * 1.3 + otherChars * 0.5)
  }

  /**
   * 📊 更新平均時間
   */
  updateAverageTime(currentAvg, count, newTime) {
    return ((currentAvg * (count - 1)) + newTime) / count
  }

  /**
   * ⏱️ 睡眠函數
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 📊 獲取服務統計
   */
  getStats() {
    const successRate = this.stats.totalRequests > 0 
      ? ((this.stats.successfulRequests / this.stats.totalRequests) * 100).toFixed(1)
      : 0

    return {
      ...this.stats,
      successRate: `${successRate}%`,
      isHealthy: this.isHealthy,
      modelName: this.modelName,
      apiEndpoint: this.apiEndpoint,
      estimatedCostSavings: (this.stats.successfulRequests * 0.02).toFixed(2) // 每次請求節省約 $0.02
    }
  }

  /**
   * 🔄 重置統計
   */
  resetStats() {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      totalTokensGenerated: 0
    }
  }
}

module.exports = LMStudioService
