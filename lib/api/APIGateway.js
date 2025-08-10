const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const morgan = require('morgan')
const jwt = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid')
const { logger } = require('../utils/logger')

/**
 * 🌐 Mursfoto CLI API Gateway
 * 統一的 API 網關，提供 REST 和 GraphQL 接口
 */
class APIGateway {
  constructor(config = {}) {
    this.config = {
      port: config.port || 3000,
      host: config.host || 'localhost',
      cors: config.cors || {},
      rateLimit: config.rateLimit || {},
      auth: config.auth || {},
      ...config
    }
    
    this.app = express()
    this.routes = new Map()
    this.middleware = []
    this.services = new Map()
    this.metrics = new APIMetrics()
    
    this.setupMiddleware()
    this.setupRoutes()
  }

  /**
   * 設定中間件
   */
  setupMiddleware() {
    // 安全標頭
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"]
        }
      }
    }))

    // CORS 支援
    this.app.use(cors({
      origin: this.config.cors.origins || ['http://localhost:3000'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    }))

    // 請求日誌
    this.app.use(morgan('combined', {
      stream: {
        write: (message) => logger.info(message.trim())
      }
    }))

    // JSON 解析
    this.app.use(express.json({ 
      limit: this.config.jsonLimit || '10mb',
      verify: (req, res, buf) => {
        req.rawBody = buf
      }
    }))
    
    this.app.use(express.urlencoded({ extended: true }))

    // API 限流
    const limiter = rateLimit({
      windowMs: this.config.rateLimit.windowMs || 15 * 60 * 1000, // 15 分鐘
      max: this.config.rateLimit.max || 1000, // 每個 IP 1000 次請求
      message: {
        error: 'API 請求頻率過高，請稍後再試',
        code: 'RATE_LIMIT_EXCEEDED'
      },
      standardHeaders: true,
      legacyHeaders: false
    })
    
    this.app.use('/api', limiter)

    // 請求 ID 和指標收集
    this.app.use((req, res, next) => {
      req.id = uuidv4()
      req.startTime = Date.now()
      
      res.setHeader('X-Request-ID', req.id)
      
      // 收集指標
      this.metrics.recordRequest(req)
      
      const originalSend = res.send
      res.send = function(data) {
        this.metrics.recordResponse(req, res)
        return originalSend.call(this, data)
      }.bind(this)
      
      next()
    })

    // 全域錯誤處理
    this.app.use(this.errorHandler.bind(this))
  }

  /**
   * 設定路由
   */
  setupRoutes() {
    // 健康檢查
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime()
      })
    })

    // API 信息
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'Mursfoto CLI API Gateway',
        version: '1.0.0',
        description: 'Mursfoto 開發工具統一 API 網關',
        endpoints: Array.from(this.routes.keys()),
        documentation: '/docs'
      })
    })

    // 設定具體業務路由
    this.setupProjectAPI()
    this.setupDeploymentAPI()
    this.setupPluginAPI()
    this.setupAnalyticsAPI()
    this.setupUserAPI()
    
    // API 文檔
    this.app.get('/docs', this.generateDocs.bind(this))

    // 404 處理
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `端點 ${req.originalUrl} 不存在`,
        code: 'ENDPOINT_NOT_FOUND'
      })
    })
  }

  /**
   * 認證中間件
   */
  async authMiddleware(req, res, next) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '')
      
      if (!token) {
        return res.status(401).json({
          error: '未提供認證令牌',
          code: 'MISSING_AUTH_TOKEN'
        })
      }

      // 驗證 JWT 令牌
      const decoded = jwt.verify(token, this.config.auth.secret || 'default-secret')
      
      // 獲取用戶資訊
      const user = await this.getUserById(decoded.userId)
      if (!user) {
        return res.status(401).json({
          error: '用戶不存在',
          code: 'USER_NOT_FOUND'
        })
      }

      req.user = user
      next()
    } catch (error) {
      logger.error('認證失敗:', error.message)
      res.status(401).json({
        error: '認證失敗',
        code: 'AUTH_FAILED',
        details: error.message
      })
    }
  }

  /**
   * 項目管理 API
   */
  setupProjectAPI() {
    const router = express.Router()
    
    // 獲取項目清單
    router.get('/', this.authMiddleware.bind(this), async (req, res) => {
      try {
        const projects = await this.getProjects(req.user.id, req.query)
        res.json({
          success: true,
          data: projects,
          total: projects.length
        })
      } catch (error) {
        this.handleError(res, error, 'GET_PROJECTS_FAILED')
      }
    })

    // 創建項目
    router.post('/', this.authMiddleware.bind(this), async (req, res) => {
      try {
        const project = await this.createProject(req.body, req.user.id)
        res.status(201).json({
          success: true,
          data: project,
          message: '項目創建成功'
        })
      } catch (error) {
        this.handleError(res, error, 'CREATE_PROJECT_FAILED')
      }
    })

    // 獲取項目詳情
    router.get('/:id', this.authMiddleware.bind(this), async (req, res) => {
      try {
        const project = await this.getProjectById(req.params.id, req.user.id)
        if (!project) {
          return res.status(404).json({
            error: '項目不存在',
            code: 'PROJECT_NOT_FOUND'
          })
        }
        res.json({
          success: true,
          data: project
        })
      } catch (error) {
        this.handleError(res, error, 'GET_PROJECT_FAILED')
      }
    })

    // 更新項目
    router.put('/:id', this.authMiddleware.bind(this), async (req, res) => {
      try {
        const project = await this.updateProject(req.params.id, req.body, req.user.id)
        res.json({
          success: true,
          data: project,
          message: '項目更新成功'
        })
      } catch (error) {
        this.handleError(res, error, 'UPDATE_PROJECT_FAILED')
      }
    })

    // 刪除項目
    router.delete('/:id', this.authMiddleware.bind(this), async (req, res) => {
      try {
        await this.deleteProject(req.params.id, req.user.id)
        res.json({
          success: true,
          message: '項目刪除成功'
        })
      } catch (error) {
        this.handleError(res, error, 'DELETE_PROJECT_FAILED')
      }
    })

    this.app.use('/api/projects', router)
    this.routes.set('GET /api/projects', '獲取項目清單')
    this.routes.set('POST /api/projects', '創建新項目')
    this.routes.set('GET /api/projects/:id', '獲取項目詳情')
    this.routes.set('PUT /api/projects/:id', '更新項目')
    this.routes.set('DELETE /api/projects/:id', '刪除項目')
  }

  /**
   * 部署管理 API
   */
  setupDeploymentAPI() {
    const router = express.Router()

    // 創建部署
    router.post('/', this.authMiddleware.bind(this), async (req, res) => {
      try {
        const deployment = await this.createDeployment(req.body, req.user.id)
        res.status(201).json({
          success: true,
          data: deployment,
          message: '部署創建成功'
        })
      } catch (error) {
        this.handleError(res, error, 'CREATE_DEPLOYMENT_FAILED')
      }
    })

    // 獲取部署清單
    router.get('/', this.authMiddleware.bind(this), async (req, res) => {
      try {
        const deployments = await this.getDeployments(req.user.id, req.query)
        res.json({
          success: true,
          data: deployments,
          total: deployments.length
        })
      } catch (error) {
        this.handleError(res, error, 'GET_DEPLOYMENTS_FAILED')
      }
    })

    // 獲取部署狀態
    router.get('/:id/status', this.authMiddleware.bind(this), async (req, res) => {
      try {
        const status = await this.getDeploymentStatus(req.params.id, req.user.id)
        res.json({
          success: true,
          data: status
        })
      } catch (error) {
        this.handleError(res, error, 'GET_DEPLOYMENT_STATUS_FAILED')
      }
    })

    // 獲取部署日誌
    router.get('/:id/logs', this.authMiddleware.bind(this), async (req, res) => {
      try {
        const logs = await this.getDeploymentLogs(req.params.id, req.user.id)
        res.json({
          success: true,
          data: logs
        })
      } catch (error) {
        this.handleError(res, error, 'GET_DEPLOYMENT_LOGS_FAILED')
      }
    })

    // 停止部署
    router.post('/:id/stop', this.authMiddleware.bind(this), async (req, res) => {
      try {
        await this.stopDeployment(req.params.id, req.user.id)
        res.json({
          success: true,
          message: '部署停止成功'
        })
      } catch (error) {
        this.handleError(res, error, 'STOP_DEPLOYMENT_FAILED')
      }
    })

    this.app.use('/api/deployments', router)
    this.routes.set('POST /api/deployments', '創建部署')
    this.routes.set('GET /api/deployments', '獲取部署清單')
    this.routes.set('GET /api/deployments/:id/status', '獲取部署狀態')
    this.routes.set('GET /api/deployments/:id/logs', '獲取部署日誌')
    this.routes.set('POST /api/deployments/:id/stop', '停止部署')
  }

  /**
   * 插件管理 API
   */
  setupPluginAPI() {
    const router = express.Router()

    // 搜索插件
    router.get('/search', async (req, res) => {
      try {
        const plugins = await this.searchPlugins(req.query)
        res.json({
          success: true,
          data: plugins,
          total: plugins.length
        })
      } catch (error) {
        this.handleError(res, error, 'SEARCH_PLUGINS_FAILED')
      }
    })

    // 獲取插件詳情
    router.get('/:name', async (req, res) => {
      try {
        const plugin = await this.getPluginInfo(req.params.name)
        res.json({
          success: true,
          data: plugin
        })
      } catch (error) {
        this.handleError(res, error, 'GET_PLUGIN_FAILED')
      }
    })

    // 安裝插件
    router.post('/:name/install', this.authMiddleware.bind(this), async (req, res) => {
      try {
        const result = await this.installPlugin(req.params.name, req.user.id)
        res.json({
          success: true,
          data: result,
          message: '插件安裝成功'
        })
      } catch (error) {
        this.handleError(res, error, 'INSTALL_PLUGIN_FAILED')
      }
    })

    // 卸載插件
    router.post('/:name/uninstall', this.authMiddleware.bind(this), async (req, res) => {
      try {
        await this.uninstallPlugin(req.params.name, req.user.id)
        res.json({
          success: true,
          message: '插件卸載成功'
        })
      } catch (error) {
        this.handleError(res, error, 'UNINSTALL_PLUGIN_FAILED')
      }
    })

    // 獲取已安裝插件
    router.get('/installed', this.authMiddleware.bind(this), async (req, res) => {
      try {
        const plugins = await this.getInstalledPlugins(req.user.id)
        res.json({
          success: true,
          data: plugins
        })
      } catch (error) {
        this.handleError(res, error, 'GET_INSTALLED_PLUGINS_FAILED')
      }
    })

    this.app.use('/api/plugins', router)
    this.routes.set('GET /api/plugins/search', '搜索插件')
    this.routes.set('GET /api/plugins/:name', '獲取插件詳情')
    this.routes.set('POST /api/plugins/:name/install', '安裝插件')
    this.routes.set('POST /api/plugins/:name/uninstall', '卸載插件')
    this.routes.set('GET /api/plugins/installed', '獲取已安裝插件')
  }

  /**
   * 分析統計 API
   */
  setupAnalyticsAPI() {
    const router = express.Router()

    // 獲取使用統計
    router.get('/usage', this.authMiddleware.bind(this), async (req, res) => {
      try {
        const stats = await this.getUsageStats(req.user.id, req.query)
        res.json({
          success: true,
          data: stats
        })
      } catch (error) {
        this.handleError(res, error, 'GET_USAGE_STATS_FAILED')
      }
    })

    // 獲取系統指標
    router.get('/metrics', async (req, res) => {
      try {
        const metrics = this.metrics.getMetrics()
        res.json({
          success: true,
          data: metrics
        })
      } catch (error) {
        this.handleError(res, error, 'GET_METRICS_FAILED')
      }
    })

    this.app.use('/api/analytics', router)
    this.routes.set('GET /api/analytics/usage', '獲取使用統計')
    this.routes.set('GET /api/analytics/metrics', '獲取系統指標')
  }

  /**
   * 用戶管理 API
   */
  setupUserAPI() {
    const router = express.Router()

    // 用戶註冊
    router.post('/register', async (req, res) => {
      try {
        const user = await this.createUser(req.body)
        const token = this.generateToken(user)
        
        res.status(201).json({
          success: true,
          data: {
            user,
            token
          },
          message: '用戶註冊成功'
        })
      } catch (error) {
        this.handleError(res, error, 'REGISTER_FAILED')
      }
    })

    // 用戶登入
    router.post('/login', async (req, res) => {
      try {
        const user = await this.authenticateUser(req.body)
        const token = this.generateToken(user)
        
        res.json({
          success: true,
          data: {
            user,
            token
          },
          message: '登入成功'
        })
      } catch (error) {
        this.handleError(res, error, 'LOGIN_FAILED')
      }
    })

    // 獲取用戶資訊
    router.get('/profile', this.authMiddleware.bind(this), async (req, res) => {
      try {
        res.json({
          success: true,
          data: req.user
        })
      } catch (error) {
        this.handleError(res, error, 'GET_PROFILE_FAILED')
      }
    })

    this.app.use('/api/users', router)
    this.routes.set('POST /api/users/register', '用戶註冊')
    this.routes.set('POST /api/users/login', '用戶登入')
    this.routes.set('GET /api/users/profile', '獲取用戶資訊')
  }

  /**
   * 錯誤處理
   */
  errorHandler(err, req, res, next) {
    logger.error('API Gateway 錯誤:', err)

    const errorResponse = {
      error: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR',
      requestId: req.id,
      timestamp: new Date().toISOString()
    }

    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = err.stack
    }

    const statusCode = err.statusCode || 500
    res.status(statusCode).json(errorResponse)
  }

  /**
   * 統一錯誤處理
   */
  handleError(res, error, code) {
    logger.error(`API 錯誤 [${code}]:`, error.message)
    
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({
      error: error.message,
      code,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * 生成 API 文檔
   */
  generateDocs(req, res) {
    const docs = {
      title: 'Mursfoto CLI API Gateway',
      version: '1.0.0',
      description: 'Mursfoto 開發工具統一 API 網關文檔',
      baseUrl: `http://${this.config.host}:${this.config.port}/api`,
      endpoints: {}
    }

    for (const [route, description] of this.routes.entries()) {
      const [method, path] = route.split(' ')
      docs.endpoints[route] = {
        method,
        path,
        description
      }
    }

    res.json(docs)
  }

  /**
   * 生成認證令牌
   */
  generateToken(user) {
    return jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role || 'user'
      },
      this.config.auth.secret || 'default-secret',
      { 
        expiresIn: this.config.auth.expiresIn || '24h'
      }
    )
  }

  /**
   * 啟動服務器
   */
  async start() {
    try {
      return new Promise((resolve, reject) => {
        const server = this.app.listen(this.config.port, this.config.host, () => {
          logger.info(`🚀 API Gateway 啟動成功!`)
          logger.info(`📍 服務地址: http://${this.config.host}:${this.config.port}`)
          logger.info(`📚 API 文檔: http://${this.config.host}:${this.config.port}/docs`)
          logger.info(`🏥 健康檢查: http://${this.config.host}:${this.config.port}/health`)
          resolve(server)
        })
        
        server.on('error', reject)
      })
    } catch (error) {
      logger.error('❌ API Gateway 啟動失敗:', error.message)
      throw error
    }
  }

  // 業務邏輯方法（這些需要具體實現）
  async getProjects(userId, query) {
    // 實現獲取項目邏輯
    return []
  }

  async createProject(data, userId) {
    // 實現創建項目邏輯
    return {}
  }

  async getProjectById(id, userId) {
    // 實現獲取項目詳情邏輯
    return {}
  }

  async updateProject(id, data, userId) {
    // 實現更新項目邏輯
    return {}
  }

  async deleteProject(id, userId) {
    // 實現刪除項目邏輯
  }

  async createDeployment(data, userId) {
    // 實現創建部署邏輯
    return {}
  }

  async getDeployments(userId, query) {
    // 實現獲取部署清單邏輯
    return []
  }

  async getDeploymentStatus(id, userId) {
    // 實現獲取部署狀態邏輯
    return {}
  }

  async getDeploymentLogs(id, userId) {
    // 實現獲取部署日誌邏輯
    return []
  }

  async stopDeployment(id, userId) {
    // 實現停止部署邏輯
  }

  async searchPlugins(query) {
    // 實現搜索插件邏輯
    return []
  }

  async getPluginInfo(name) {
    // 實現獲取插件詳情邏輯
    return {}
  }

  async installPlugin(name, userId) {
    // 實現安裝插件邏輯
    return {}
  }

  async uninstallPlugin(name, userId) {
    // 實現卸載插件邏輯
  }

  async getInstalledPlugins(userId) {
    // 實現獲取已安裝插件邏輯
    return []
  }

  async getUsageStats(userId, query) {
    // 實現獲取使用統計邏輯
    return {}
  }

  async createUser(data) {
    // 實現創建用戶邏輯
    return {}
  }

  async authenticateUser(credentials) {
    // 實現用戶認證邏輯
    return {}
  }

  async getUserById(id) {
    // 實現獲取用戶邏輯
    return {}
  }
}

/**
 * 📊 API 指標收集器
 */
class APIMetrics {
  constructor() {
    this.requests = []
    this.responses = []
    this.startTime = Date.now()
  }

  recordRequest(req) {
    this.requests.push({
      id: req.id,
      method: req.method,
      url: req.url,
      timestamp: Date.now(),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    })
  }

  recordResponse(req, res) {
    this.responses.push({
      id: req.id,
      statusCode: res.statusCode,
      responseTime: Date.now() - req.startTime,
      timestamp: Date.now()
    })
  }

  getMetrics() {
    const now = Date.now()
    const uptime = now - this.startTime

    return {
      uptime,
      totalRequests: this.requests.length,
      totalResponses: this.responses.length,
      averageResponseTime: this.getAverageResponseTime(),
      errorRate: this.getErrorRate(),
      requestsPerMinute: this.getRequestsPerMinute(),
      statusCodes: this.getStatusCodeStats(),
      popularEndpoints: this.getPopularEndpoints()
    }
  }

  getAverageResponseTime() {
    if (this.responses.length === 0) return 0
    
    const total = this.responses.reduce((sum, res) => sum + res.responseTime, 0)
    return Math.round(total / this.responses.length)
  }

  getErrorRate() {
    if (this.responses.length === 0) return 0
    
    const errors = this.responses.filter(res => res.statusCode >= 400).length
    return Math.round((errors / this.responses.length) * 100 * 100) / 100
  }

  getRequestsPerMinute() {
    const oneMinuteAgo = Date.now() - 60 * 1000
    const recentRequests = this.requests.filter(req => req.timestamp > oneMinuteAgo)
    return recentRequests.length
  }

  getStatusCodeStats() {
    const stats = {}
    
    for (const res of this.responses) {
      const code = res.statusCode
      stats[code] = (stats[code] || 0) + 1
    }
    
    return stats
  }

  getPopularEndpoints() {
    const stats = {}
    
    for (const req of this.requests) {
      const endpoint = `${req.method} ${req.url.split('?')[0]}`
      stats[endpoint] = (stats[endpoint] || 0) + 1
    }
    
    return Object.entries(stats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .reduce((obj, [endpoint, count]) => {
        obj[endpoint] = count
        return obj
      }, {})
  }
}

module.exports = {
  APIGateway,
  APIMetrics
}
