const { EventEmitter } = require('events')
const logger = require('../utils/logger')

/**
 * 🌐 Mursfoto CLI 第三方服務整合管理器
 * 統一管理各種第三方服務的整合，提供標準化的接入方式
 */
class IntegrationManager extends EventEmitter {
  constructor() {
    super()
    this.providers = new Map()
    this.connections = new Map()
    this.authManager = new AuthenticationManager()
    this.healthChecker = new ServiceHealthChecker()
    this.retryManager = new RetryManager()
    
    // 初始化內建服務提供者
    this.initializeBuiltInProviders()
  }

  /**
   * 初始化內建服務提供者
   */
  initializeBuiltInProviders() {
    // 雲服務提供者
    this.registerProvider('aws', new AWSProvider())
    this.registerProvider('azure', new AzureProvider())
    this.registerProvider('gcp', new GCPProvider())
    this.registerProvider('alicloud', new AliCloudProvider())
    
    // 代碼倉庫
    this.registerProvider('github', new GitHubProvider())
    this.registerProvider('gitlab', new GitLabProvider())
    this.registerProvider('bitbucket', new BitbucketProvider())
    
    // CI/CD 服務
    this.registerProvider('github-actions', new GitHubActionsProvider())
    this.registerProvider('jenkins', new JenkinsProvider())
    this.registerProvider('gitlab-ci', new GitLabCIProvider())
    
    // 通訊工具
    this.registerProvider('slack', new SlackProvider())
    this.registerProvider('discord', new DiscordProvider())
    this.registerProvider('teams', new TeamsProvider())
    
    // 監控服務
    this.registerProvider('sentry', new SentryProvider())
    this.registerProvider('datadog', new DatadogProvider())
    this.registerProvider('newrelic', new NewRelicProvider())

    logger.info('🔌 內建服務提供者初始化完成')
  }

  /**
   * 註冊服務提供者
   * @param {string} name - 提供者名稱
   * @param {ServiceProvider} provider - 服務提供者實例
   */
  registerProvider(name, provider) {
    if (this.providers.has(name)) {
      logger.warn(`⚠️ 服務提供者 ${name} 已存在，將被覆蓋`)
    }
    
    this.providers.set(name, provider)
    logger.debug(`📡 註冊服務提供者: ${name}`)
    
    // 綁定事件監聽器
    provider.on('connected', () => this.emit('provider:connected', name))
    provider.on('disconnected', () => this.emit('provider:disconnected', name))
    provider.on('error', (error) => this.emit('provider:error', name, error))
  }

  /**
   * 連接服務
   * @param {string} serviceName - 服務名稱
   * @param {Object} config - 連接配置
   */
  async connectService(serviceName, config) {
    const provider = this.providers.get(serviceName)
    if (!provider) {
      throw new Error(`未找到服務提供者: ${serviceName}`)
    }

    try {
      logger.info(`🔗 連接服務: ${serviceName}`)
      
      // 驗證配置
      await provider.validateConfig(config)
      
      // 建立認證
      const authResult = await this.authManager.authenticate(serviceName, config.auth)
      
      // 建立連接
      const connection = await provider.connect(authResult, config)
      
      // 健康檢查
      await this.healthChecker.check(connection)
      
      // 保存連接
      this.connections.set(serviceName, {
        provider,
        connection,
        config,
        connectedAt: new Date(),
        lastHealthCheck: new Date(),
        status: 'connected'
      })
      
      logger.info(`✅ 服務 ${serviceName} 連接成功`)
      this.emit('service:connected', serviceName)
      
      return connection
      
    } catch (error) {
      logger.error(`❌ 服務 ${serviceName} 連接失敗:`, error.message)
      this.emit('service:error', serviceName, error)
      throw error
    }
  }

  /**
   * 斷開服務連接
   * @param {string} serviceName - 服務名稱
   */
  async disconnectService(serviceName) {
    const serviceInfo = this.connections.get(serviceName)
    if (!serviceInfo) {
      throw new Error(`服務 ${serviceName} 未連接`)
    }

    try {
      logger.info(`🔌 斷開服務: ${serviceName}`)
      
      await serviceInfo.connection.disconnect()
      this.connections.delete(serviceName)
      
      logger.info(`✅ 服務 ${serviceName} 斷開成功`)
      this.emit('service:disconnected', serviceName)
      
    } catch (error) {
      logger.error(`❌ 服務 ${serviceName} 斷開失敗:`, error.message)
      throw error
    }
  }

  /**
   * 執行服務操作
   * @param {string} serviceName - 服務名稱
   * @param {string} action - 操作名稱
   * @param {Object} params - 操作參數
   */
  async executeService(serviceName, action, params = {}) {
    const serviceInfo = this.connections.get(serviceName)
    if (!serviceInfo) {
      throw new Error(`服務 ${serviceName} 未連接`)
    }

    try {
      logger.debug(`⚡ 執行服務操作: ${serviceName}.${action}`)
      
      // 檢查連接狀態
      if (serviceInfo.status !== 'connected') {
        await this.reconnectService(serviceName)
      }
      
      // 執行操作（帶重試機制）
      const result = await this.retryManager.execute(
        () => serviceInfo.connection.execute(action, params),
        {
          serviceName,
          action,
          maxRetries: 3
        }
      )
      
      logger.debug(`✅ 服務操作完成: ${serviceName}.${action}`)
      this.emit('service:executed', serviceName, action, result)
      
      return result
      
    } catch (error) {
      logger.error(`❌ 服務操作失敗: ${serviceName}.${action}`, error.message)
      this.emit('service:error', serviceName, error)
      throw error
    }
  }

  /**
   * 重新連接服務
   * @param {string} serviceName - 服務名稱
   */
  async reconnectService(serviceName) {
    const serviceInfo = this.connections.get(serviceName)
    if (!serviceInfo) {
      throw new Error(`服務 ${serviceName} 未連接`)
    }

    logger.info(`🔄 重新連接服務: ${serviceName}`)
    
    try {
      // 斷開現有連接
      await serviceInfo.connection.disconnect().catch(() => {})
      
      // 重新連接
      const connection = await serviceInfo.provider.connect(
        serviceInfo.config.auth,
        serviceInfo.config
      )
      
      // 更新連接信息
      serviceInfo.connection = connection
      serviceInfo.status = 'connected'
      serviceInfo.lastHealthCheck = new Date()
      
      logger.info(`✅ 服務 ${serviceName} 重新連接成功`)
      this.emit('service:reconnected', serviceName)
      
    } catch (error) {
      serviceInfo.status = 'error'
      logger.error(`❌ 服務 ${serviceName} 重新連接失敗:`, error.message)
      throw error
    }
  }

  /**
   * 獲取服務狀態
   * @param {string} serviceName - 服務名稱 (可選)
   */
  getServiceStatus(serviceName = null) {
    if (serviceName) {
      const serviceInfo = this.connections.get(serviceName)
      if (!serviceInfo) {
        return { status: 'disconnected' }
      }
      
      return {
        status: serviceInfo.status,
        connectedAt: serviceInfo.connectedAt,
        lastHealthCheck: serviceInfo.lastHealthCheck,
        provider: serviceInfo.provider.constructor.name
      }
    }
    
    // 返回所有服務狀態
    const statuses = {}
    for (const [name, info] of this.connections.entries()) {
      statuses[name] = {
        status: info.status,
        connectedAt: info.connectedAt,
        lastHealthCheck: info.lastHealthCheck,
        provider: info.provider.constructor.name
      }
    }
    
    return statuses
  }

  /**
   * 獲取可用的服務提供者
   */
  getAvailableProviders() {
    const providers = []
    for (const [name, provider] of this.providers.entries()) {
      providers.push({
        name,
        description: provider.getDescription(),
        capabilities: provider.getCapabilities(),
        requiredAuth: provider.getRequiredAuth(),
        status: this.connections.has(name) ? 'connected' : 'available'
      })
    }
    return providers
  }

  /**
   * 批量操作
   * @param {Array} operations - 操作清單
   */
  async executeBatchOperations(operations) {
    logger.info(`🔄 執行批量操作: ${operations.length} 個操作`)
    
    const results = []
    const errors = []
    
    for (const operation of operations) {
      try {
        const result = await this.executeService(
          operation.service,
          operation.action,
          operation.params
        )
        results.push({ operation, result, status: 'success' })
      } catch (error) {
        errors.push({ operation, error, status: 'error' })
        
        // 如果設置了 stopOnError，則停止後續操作
        if (operation.stopOnError) {
          logger.error('🛑 批量操作因錯誤終止')
          break
        }
      }
    }
    
    logger.info(`✅ 批量操作完成: ${results.length} 成功, ${errors.length} 失敗`)
    
    return {
      results,
      errors,
      summary: {
        total: operations.length,
        success: results.length,
        failed: errors.length,
        successRate: (results.length / operations.length) * 100
      }
    }
  }

  /**
   * 定期健康檢查
   */
  async startHealthMonitoring(interval = 300000) { // 5 分鐘
    logger.info('🏥 啟動服務健康監控')
    
    setInterval(async () => {
      for (const [serviceName, serviceInfo] of this.connections.entries()) {
        try {
          await this.healthChecker.check(serviceInfo.connection)
          serviceInfo.lastHealthCheck = new Date()
          
          if (serviceInfo.status !== 'connected') {
            serviceInfo.status = 'connected'
            this.emit('service:recovered', serviceName)
          }
        } catch (error) {
          serviceInfo.status = 'unhealthy'
          logger.warn(`⚠️ 服務健康檢查失敗: ${serviceName}`)
          this.emit('service:unhealthy', serviceName, error)
          
          // 嘗試重新連接
          try {
            await this.reconnectService(serviceName)
          } catch (reconnectError) {
            logger.error(`❌ 服務重連失敗: ${serviceName}`)
          }
        }
      }
    }, interval)
  }

  /**
   * 導出配置
   */
  exportConfigurations() {
    const configs = {}
    for (const [serviceName, serviceInfo] of this.connections.entries()) {
      configs[serviceName] = {
        provider: serviceInfo.provider.constructor.name,
        connectedAt: serviceInfo.connectedAt,
        // 不導出敏感信息
        configHash: this.hashConfig(serviceInfo.config)
      }
    }
    return configs
  }

  /**
   * 導入配置
   */
  async importConfigurations(configs, credentials) {
    for (const [serviceName, config] of Object.entries(configs)) {
      try {
        if (credentials[serviceName]) {
          await this.connectService(serviceName, {
            ...config,
            auth: credentials[serviceName]
          })
        }
      } catch (error) {
        logger.warn(`⚠️ 導入配置失敗: ${serviceName}`, error.message)
      }
    }
  }

  /**
   * 清理資源
   */
  async cleanup() {
    logger.info('🧹 清理整合管理器資源')
    
    const disconnectPromises = []
    for (const serviceName of this.connections.keys()) {
      disconnectPromises.push(
        this.disconnectService(serviceName).catch(error => {
          logger.warn(`⚠️ 清理服務連接失敗: ${serviceName}`, error.message)
        })
      )
    }
    
    await Promise.all(disconnectPromises)
    
    this.connections.clear()
    this.removeAllListeners()
    
    logger.info('✅ 整合管理器清理完成')
  }

  // 輔助方法
  hashConfig(config) {
    const crypto = require('crypto')
    return crypto.createHash('sha256')
      .update(JSON.stringify(config, (key, value) => {
        // 排除敏感信息
        if (key.includes('password') || key.includes('token') || key.includes('secret')) {
          return '[REDACTED]'
        }
        return value
      }))
      .digest('hex')
      .substring(0, 16)
  }
}

/**
 * 🔐 認證管理器
 */
class AuthenticationManager {
  constructor() {
    this.authStrategies = new Map()
    this.setupDefaultStrategies()
  }

  setupDefaultStrategies() {
    this.authStrategies.set('oauth2', new OAuth2Strategy())
    this.authStrategies.set('apikey', new APIKeyStrategy())
    this.authStrategies.set('basic', new BasicAuthStrategy())
    this.authStrategies.set('jwt', new JWTStrategy())
  }

  async authenticate(serviceName, authConfig) {
    const strategy = this.authStrategies.get(authConfig.type)
    if (!strategy) {
      throw new Error(`不支援的認證類型: ${authConfig.type}`)
    }

    logger.debug(`🔐 執行認證: ${serviceName} (${authConfig.type})`)
    return await strategy.authenticate(authConfig)
  }
}

/**
 * 🏥 服務健康檢查器
 */
class ServiceHealthChecker {
  async check(connection) {
    if (!connection.healthCheck) {
      return true // 如果服務不支援健康檢查，假設健康
    }

    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('健康檢查超時')), 5000)
    })

    try {
      await Promise.race([connection.healthCheck(), timeout])
      return true
    } catch (error) {
      logger.debug('🏥 健康檢查失敗:', error.message)
      throw error
    }
  }
}

/**
 * 🔄 重試管理器
 */
class RetryManager {
  async execute(operation, options = {}) {
    const {
      maxRetries = 3,
      backoffStrategy = 'exponential',
      baseDelay = 1000,
      serviceName,
      action
    } = options

    let lastError
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          logger.debug(`🔄 重試操作: ${serviceName}.${action} (第 ${attempt} 次)`)
        }
        
        return await operation()
      } catch (error) {
        lastError = error
        
        if (attempt < maxRetries) {
          const delay = this.calculateDelay(attempt, backoffStrategy, baseDelay)
          await this.sleep(delay)
        }
      }
    }
    
    throw new Error(`操作重試失敗 (${maxRetries + 1} 次嘗試): ${lastError.message}`)
  }

  calculateDelay(attempt, strategy, baseDelay) {
    switch (strategy) {
      case 'linear':
        return baseDelay * (attempt + 1)
      case 'exponential':
        return baseDelay * Math.pow(2, attempt)
      case 'fixed':
      default:
        return baseDelay
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * 基礎服務提供者類
 */
class ServiceProvider extends EventEmitter {
  constructor(name, description) {
    super()
    this.name = name
    this.description = description
  }

  async connect(auth, config) {
    throw new Error('connect() 方法需要在子類中實現')
  }

  async validateConfig(config) {
    throw new Error('validateConfig() 方法需要在子類中實現')
  }

  getDescription() {
    return this.description
  }

  getCapabilities() {
    return []
  }

  getRequiredAuth() {
    return {}
  }
}

/**
 * 🌩️ AWS 服務提供者
 */
class AWSProvider extends ServiceProvider {
  constructor() {
    super('aws', 'Amazon Web Services 雲服務平台')
  }

  async validateConfig(config) {
    if (!config.region) {
      throw new Error('AWS 配置缺少 region')
    }
  }

  async connect(auth, config) {
    const AWS = require('aws-sdk')
    
    AWS.config.update({
      accessKeyId: auth.accessKeyId,
      secretAccessKey: auth.secretAccessKey,
      region: config.region
    })

    return new AWSConnection(AWS, config)
  }

  getCapabilities() {
    return ['compute', 'storage', 'database', 'networking', 'lambda']
  }

  getRequiredAuth() {
    return {
      type: 'apikey',
      fields: ['accessKeyId', 'secretAccessKey']
    }
  }
}

/**
 * 🐙 GitHub 服務提供者  
 */
class GitHubProvider extends ServiceProvider {
  constructor() {
    super('github', 'GitHub 代碼倉庫和協作平台')
  }

  async validateConfig(config) {
    if (!config.baseURL) {
      config.baseURL = 'https://api.github.com'
    }
  }

  async connect(auth, config) {
    const { Octokit } = require('@octokit/rest')
    
    const octokit = new Octokit({
      auth: auth.token,
      baseUrl: config.baseURL
    })

    return new GitHubConnection(octokit, config)
  }

  getCapabilities() {
    return ['repository', 'issues', 'pulls', 'actions', 'releases']
  }

  getRequiredAuth() {
    return {
      type: 'apikey',
      fields: ['token']
    }
  }
}

// 這裡可以繼續添加更多的服務提供者...

/**
 * AWS 連接類
 */
class AWSConnection {
  constructor(aws, config) {
    this.aws = aws
    this.config = config
  }

  async execute(action, params) {
    switch (action) {
      case 'listInstances':
        return this.listEC2Instances(params)
      case 'deployLambda':
        return this.deployLambdaFunction(params)
      default:
        throw new Error(`不支援的 AWS 操作: ${action}`)
    }
  }

  async listEC2Instances(params) {
    const ec2 = new this.aws.EC2()
    const result = await ec2.describeInstances(params).promise()
    return result.Reservations
  }

  async deployLambdaFunction(params) {
    const lambda = new this.aws.Lambda()
    const result = await lambda.updateFunctionCode(params).promise()
    return result
  }

  async healthCheck() {
    const sts = new this.aws.STS()
    await sts.getCallerIdentity().promise()
  }

  async disconnect() {
    // AWS SDK 不需要顯式斷開連接
  }
}

/**
 * GitHub 連接類
 */
class GitHubConnection {
  constructor(octokit, config) {
    this.octokit = octokit
    this.config = config
  }

  async execute(action, params) {
    switch (action) {
      case 'listRepos':
        return this.listRepositories(params)
      case 'createIssue':
        return this.createIssue(params)
      case 'createRelease':
        return this.createRelease(params)
      default:
        throw new Error(`不支援的 GitHub 操作: ${action}`)
    }
  }

  async listRepositories(params) {
    const { data } = await this.octokit.repos.listForAuthenticatedUser(params)
    return data
  }

  async createIssue(params) {
    const { data } = await this.octokit.issues.create(params)
    return data
  }

  async createRelease(params) {
    const { data } = await this.octokit.repos.createRelease(params)
    return data
  }

  async healthCheck() {
    await this.octokit.users.getAuthenticated()
  }

  async disconnect() {
    // GitHub API 不需要顯式斷開連接
  }
}

// 認證策略實現
class OAuth2Strategy {
  async authenticate(config) {
    // OAuth2 認證邏輯
    return { token: config.accessToken }
  }
}

class APIKeyStrategy {
  async authenticate(config) {
    return config
  }
}

class BasicAuthStrategy {
  async authenticate(config) {
    return {
      username: config.username,
      password: config.password
    }
  }
}

class JWTStrategy {
  async authenticate(config) {
    return { token: config.token }
  }
}

// 為了簡化，其他提供者類別先定義為空實現
class AzureProvider extends ServiceProvider {
  constructor() { super('azure', 'Microsoft Azure 雲服務平台') }
  async connect() { throw new Error('Azure provider 待實現') }
  async validateConfig() {}
}

class GCPProvider extends ServiceProvider {
  constructor() { super('gcp', 'Google Cloud Platform') }
  async connect() { throw new Error('GCP provider 待實現') }
  async validateConfig() {}
}

class AliCloudProvider extends ServiceProvider {
  constructor() { super('alicloud', '阿里雲服務平台') }
  async connect() { throw new Error('AliCloud provider 待實現') }
  async validateConfig() {}
}

class GitLabProvider extends ServiceProvider {
  constructor() { super('gitlab', 'GitLab 代碼倉庫平台') }
  async connect() { throw new Error('GitLab provider 待實現') }
  async validateConfig() {}
}

class BitbucketProvider extends ServiceProvider {
  constructor() { super('bitbucket', 'Bitbucket 代碼倉庫平台') }
  async connect() { throw new Error('Bitbucket provider 待實現') }
  async validateConfig() {}
}

class GitHubActionsProvider extends ServiceProvider {
  constructor() { super('github-actions', 'GitHub Actions CI/CD 平台') }
  async connect() { throw new Error('GitHub Actions provider 待實現') }
  async validateConfig() {}
}

class JenkinsProvider extends ServiceProvider {
  constructor() { super('jenkins', 'Jenkins 自動化伺服器') }
  async connect() { throw new Error('Jenkins provider 待實現') }
  async validateConfig() {}
}

class GitLabCIProvider extends ServiceProvider {
  constructor() { super('gitlab-ci', 'GitLab CI/CD 平台') }
  async connect() { throw new Error('GitLab CI provider 待實現') }
  async validateConfig() {}
}

class SlackProvider extends ServiceProvider {
  constructor() { super('slack', 'Slack 團隊通訊平台') }
  async connect() { throw new Error('Slack provider 待實現') }
  async validateConfig() {}
}

class DiscordProvider extends ServiceProvider {
  constructor() { super('discord', 'Discord 通訊平台') }
  async connect() { throw new Error('Discord provider 待實現') }
  async validateConfig() {}
}

class TeamsProvider extends ServiceProvider {
  constructor() { super('teams', 'Microsoft Teams 通訊平台') }
  async connect() { throw new Error('Teams provider 待實現') }
  async validateConfig() {}
}

class SentryProvider extends ServiceProvider {
  constructor() { super('sentry', 'Sentry 錯誤監控平台') }
  async connect() { throw new Error('Sentry provider 待實現') }
  async validateConfig() {}
}

class DatadogProvider extends ServiceProvider {
  constructor() { super('datadog', 'Datadog 監控和分析平台') }
  async connect() { throw new Error('Datadog provider 待實現') }
  async validateConfig() {}
}

class NewRelicProvider extends ServiceProvider {
  constructor() { super('newrelic', 'New Relic 應用性能監控') }
  async connect() { throw new Error('New Relic provider 待實現') }
  async validateConfig() {}
}

module.exports = {
  IntegrationManager,
  ServiceProvider,
  AuthenticationManager,
  ServiceHealthChecker,
  RetryManager,
  
  // 服務提供者
  AWSProvider,
  GitHubProvider,
  AzureProvider,
  GCPProvider,
  // ... 其他提供者
}
