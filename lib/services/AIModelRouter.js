const axios = require('axios')
const logger = require('../utils/logger')

/**
 * AI 模型路由器
 * 支援多種 AI 模型 API，包括 Claude、GPT、Gemini 等
 */
class AIModelRouter {
  constructor(options = {}) {
    this.options = {
      defaultModel: 'claude',
      timeout: 30000,
      ...options
    }
    
    // 支援的模型配置
    this.models = {
      claude: {
        baseURL: 'https://api.anthropic.com',
        headers: {
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        keyHeader: 'x-api-key',
        envKey: 'ANTHROPIC_API_KEY'
      },
      openai: {
        baseURL: 'https://api.openai.com',
        headers: {
          'content-type': 'application/json'
        },
        keyHeader: 'authorization',
        envKey: 'OPENAI_API_KEY'
      },
      gemini: {
        baseURL: 'https://generativelanguage.googleapis.com',
        headers: {
          'content-type': 'application/json'
        },
        keyHeader: 'x-goog-api-key',
        envKey: 'GEMINI_API_KEY'
      }
    }
  }

  /**
   * 獲取 API 密鑰
   */
  getApiKey(modelName) {
    const model = this.models[modelName]
    if (!model) {
      throw new Error(`不支援的模型: ${modelName}`)
    }
    
    const apiKey = process.env[model.envKey]
    if (!apiKey) {
      throw new Error(`缺少 ${modelName.toUpperCase()} API 密鑰`)
    }
    
    return apiKey
  }

  /**
   * 準備請求標頭
   */
  prepareHeaders(modelName, customHeaders = {}) {
    const model = this.models[modelName]
    const apiKey = this.getApiKey(modelName)
    
    const headers = {
      ...model.headers,
      ...customHeaders
    }
    
    // 設置 API 密鑰
    if (modelName === 'openai') {
      headers[model.keyHeader] = `Bearer ${apiKey}`
    } else {
      headers[model.keyHeader] = apiKey
    }
    
    return headers
  }

  /**
   * 發送請求到指定模型
   */
  async sendRequest(modelName, endpoint, data, options = {}) {
    try {
      const model = this.models[modelName]
      if (!model) {
        throw new Error(`不支援的模型: ${modelName}`)
      }

      const config = {
        method: 'POST',
        url: `${model.baseURL}${endpoint}`,
        headers: this.prepareHeaders(modelName, options.headers),
        data: data,
        timeout: options.timeout || this.options.timeout
      }

      logger.info(`發送請求到 ${modelName.toUpperCase()} - ${endpoint}`)
      
      const response = await axios(config)
      
      logger.info(`${modelName.toUpperCase()} 請求成功`, {
        status: response.status,
        endpoint: endpoint
      })
      
      return response.data
    } catch (error) {
      logger.error(`${modelName.toUpperCase()} 請求失敗`, {
        error: error.message,
        endpoint: endpoint
      })
      throw error
    }
  }

  /**
   * Claude API 請求
   */
  async sendToClaude(messages, options = {}) {
    const data = {
      model: options.model || 'claude-3-sonnet-20240229',
      max_tokens: options.maxTokens || 4000,
      messages: messages,
      ...options.additionalParams
    }

    return await this.sendRequest('claude', '/v1/messages', data, options)
  }

  /**
   * OpenAI API 請求
   */
  async sendToOpenAI(messages, options = {}) {
    const data = {
      model: options.model || 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: options.maxTokens || 4000,
      ...options.additionalParams
    }

    return await this.sendRequest('openai', '/v1/chat/completions', data, options)
  }

  /**
   * Gemini API 請求
   */
  async sendToGemini(messages, options = {}) {
    const model = options.model || 'gemini-pro'
    const data = {
      contents: messages.map(msg => ({
        parts: [{ text: msg.content }],
        role: msg.role === 'assistant' ? 'model' : 'user'
      })),
      generationConfig: {
        maxOutputTokens: options.maxTokens || 4000,
        ...options.additionalParams
      }
    }

    return await this.sendRequest('gemini', `/v1beta/models/${model}:generateContent`, data, options)
  }

  /**
   * 智慧路由 - 根據配置自動選擇最佳模型
   */
  async smartRoute(messages, options = {}) {
    const preferredModel = options.model || this.options.defaultModel
    
    try {
      switch (preferredModel) {
        case 'claude':
          return await this.sendToClaude(messages, options)
        case 'openai':
          return await this.sendToOpenAI(messages, options)
        case 'gemini':
          return await this.sendToGemini(messages, options)
        default:
          throw new Error(`不支援的模型: ${preferredModel}`)
      }
    } catch (error) {
      // 如果主要模型失敗，嘗試備用模型
      if (options.fallback && preferredModel !== options.fallback) {
        logger.warn(`${preferredModel} 失敗，嘗試備用模型: ${options.fallback}`)
        return await this.smartRoute(messages, { 
          ...options, 
          model: options.fallback, 
          fallback: null 
        })
      }
      throw error
    }
  }

  /**
   * 檢查模型可用性
   */
  async checkModelAvailability(modelName) {
    try {
      this.getApiKey(modelName)
      return { available: true, model: modelName }
    } catch (error) {
      return { available: false, model: modelName, error: error.message }
    }
  }

  /**
   * 獲取所有模型狀態
   */
  async getModelsStatus() {
    const status = {}
    
    for (const modelName of Object.keys(this.models)) {
      status[modelName] = await this.checkModelAvailability(modelName)
    }
    
    return status
  }
}

module.exports = AIModelRouter