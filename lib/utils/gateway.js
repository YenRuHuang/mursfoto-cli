const axios = require('axios')
const logger = require('./logger')

/**
 * Mursfoto API Gateway 整合工具
 * 用於註冊和管理服務到 API Gateway
 */

class GatewayManager {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || process.env.MURSFOTO_GATEWAY_URL || 'https://gateway.mursfoto.com'
    this.token = options.token || process.env.MURSFOTO_API_TOKEN
    this.timeout = options.timeout || 10000
  }

  /**
   * 註冊服務到 API Gateway
   */
  async registerService(serviceConfig) {
    try {
      logger.info(`🌐 嘗試註冊服務: ${serviceConfig.name}`)
      
      // 基本驗證
      if (!serviceConfig.name || !serviceConfig.url) {
        throw new Error('服務名稱和 URL 是必需的')
      }

      // 準備註冊數據（基於你的 API_CONFIGS 格式）
      const registrationData = {
        serviceName: serviceConfig.name,
        baseURL: serviceConfig.url,
        headers: {
          'content-type': 'application/json',
          ...serviceConfig.headers
        },
        rateLimits: serviceConfig.rateLimits || {
          windowMs: 1 * 60 * 1000, // 1 分鐘
          max: 100 // 每分鐘 100 次請求
        },
        healthCheck: serviceConfig.healthCheck || '/health',
        type: serviceConfig.type || 'service',
        environment: serviceConfig.environment || 'development'
      }

      // 如果有 token，嘗試註冊到 Gateway
      if (this.token) {
        const response = await axios.post(`${this.baseUrl}/api/services/register`, registrationData, {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          },
          timeout: this.timeout
        })

        logger.info(`✅ 服務註冊成功: ${serviceConfig.name}`)
        return response.data
      } else {
        logger.warn(`⚠️ 未找到 Gateway Token，跳過自動註冊`)
        logger.info(`💡 你可以手動添加以下配置到 Gateway:`)
        console.log(JSON.stringify(registrationData, null, 2))
        return { 
          success: true, 
          message: '本地創建成功，Gateway 註冊跳過',
          config: registrationData 
        }
      }

    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        logger.warn(`⚠️ Gateway 連線失敗，可能是本地開發環境`)
        logger.info(`💡 項目已本地創建，可稍後手動註冊到 Gateway`)
        return { success: true, message: 'Gateway 不可用，本地創建成功' }
      }
      
      logger.error(`❌ 服務註冊失敗: ${error.message}`)
      throw error
    }
  }

  /**
   * 檢查服務狀態
   */
  async checkServiceStatus(serviceName) {
    try {
      const response = await axios.get(`${this.baseUrl}/api/services/${serviceName}/status`, {
        headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {},
        timeout: this.timeout
      })
      return response.data
    } catch (error) {
      logger.error(`❌ 檢查服務狀態失敗: ${error.message}`)
      return { status: 'unknown', error: error.message }
    }
  }

  /**
   * 列出所有已註冊的服務
   */
  async listServices() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/services`, {
        headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {},
        timeout: this.timeout
      })
      return response.data
    } catch (error) {
      logger.error(`❌ 獲取服務列表失敗: ${error.message}`)
      return []
    }
  }
}

// 創建默認實例
const defaultGateway = new GatewayManager()

/**
 * 註冊服務到 Gateway（向後兼容的函數）
 */
async function registerServiceToGateway(projectName, projectConfig = {}) {
  const serviceConfig = {
    name: projectName,
    url: projectConfig.url || `http://localhost:${projectConfig.port || 3001}`,
    type: projectConfig.type || 'service',
    environment: projectConfig.environment || 'development',
    headers: projectConfig.headers,
    rateLimits: projectConfig.rateLimits,
    healthCheck: projectConfig.healthCheck || '/health'
  }

  return await defaultGateway.registerService(serviceConfig)
}

module.exports = {
  GatewayManager,
  registerServiceToGateway,
  defaultGateway
}
