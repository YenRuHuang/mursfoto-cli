const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const path = require('path')
const chalk = require('chalk')
const AIModelRouter = require('./AIModelRouter')
const LMStudioService = require('./LMStudioService')

/**
 * 🖥️ mursfoto-cli GUI 服務器
 * 提供 Web 介面來監控 AI 服務狀態和配置
 */
class GUIServer {
  constructor(options = {}) {
    this.port = options.port || 12580
    this.host = options.host || 'localhost'
    
    // 初始化服務
    this.app = express()
    this.server = http.createServer(this.app)
    this.io = socketIo(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    })
    
    // AI 服務
    this.aiRouter = new AIModelRouter()
    this.lmStudioService = new LMStudioService({
      apiEndpoint: process.env.LM_STUDIO_ENDPOINT || 'http://127.0.0.1:1234',
      modelName: process.env.LM_STUDIO_MODEL || 'unsloth/gpt-oss-20b-GGUF'
    })
    
    // 狀態快取
    this.systemStatus = {
      lastUpdated: null,
      services: {},
      stats: {},
      config: {},
      logs: []
    }
    
    // 設置路由和中介軟體
    this.setupMiddleware()
    this.setupRoutes()
    this.setupSocketHandlers()
    
    // 定期更新狀態
    this.startStatusUpdater()
  }
  
  /**
   * 🔧 設置中介軟體
   */
  setupMiddleware() {
    // 靜態檔案服務
    this.app.use(express.static(path.join(__dirname, '../gui')))
    this.app.use(express.json())
    
    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*')
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
      next()
    })
  }
  
  /**
   * 🛤️ 設置路由
   */
  setupRoutes() {
    // 主頁
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../gui/index.html'))
    })
    
    // API 路由
    this.app.get('/api/status', async (req, res) => {
      try {
        const status = await this.getSystemStatus()
        res.json(status)
      } catch (error) {
        res.status(500).json({ error: error.message })
      }
    })
    
    this.app.get('/api/services', async (req, res) => {
      try {
        const services = await this.getServicesStatus()
        res.json(services)
      } catch (error) {
        res.status(500).json({ error: error.message })
      }
    })
    
    this.app.get('/api/stats', async (req, res) => {
      try {
        const stats = this.aiRouter.getStats()
        res.json(stats)
      } catch (error) {
        res.status(500).json({ error: error.message })
      }
    })
    
    this.app.get('/api/config', (req, res) => {
      try {
        const config = this.getConfiguration()
        res.json(config)
      } catch (error) {
        res.status(500).json({ error: error.message })
      }
    })
    
    // 測試 AI 服務
    this.app.post('/api/test/:service', async (req, res) => {
      try {
        const { service } = req.params
        const { prompt } = req.body
        
        const result = await this.testService(service, prompt || 'Hello, 測試訊息')
        res.json(result)
      } catch (error) {
        res.status(500).json({ error: error.message })
      }
    })
    
    // 重置統計
    this.app.post('/api/stats/reset', (req, res) => {
      try {
        this.aiRouter.resetStats()
        res.json({ success: true, message: '統計資料已重置' })
      } catch (error) {
        res.status(500).json({ error: error.message })
      }
    })
  }
  
  /**
   * 🔌 設置 Socket.IO 處理器
   */
  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      this.logger?.info(chalk.blue('🔗 GUI 客戶端已連接'))
      
      // 發送初始狀態
      socket.emit('system-status', this.systemStatus)
      
      // 處理客戶端請求
      socket.on('request-status', async () => {
        const status = await this.getSystemStatus()
        socket.emit('system-status', status)
      })
      
      socket.on('test-service', async (data) => {
        try {
          const result = await this.testService(data.service, data.prompt)
          socket.emit('test-result', result)
        } catch (error) {
          socket.emit('test-error', { error: error.message })
        }
      })
      
      socket.on('disconnect', () => {
        this.logger?.info(chalk.yellow('🔌 GUI 客戶端已斷線'))
      })
    })
  }
  
  /**
   * ⏰ 開始狀態更新器
   */
  startStatusUpdater() {
    // 每 5 秒更新一次狀態
    setInterval(async () => {
      try {
        const status = await this.getSystemStatus()
        this.systemStatus = status
        this.io.emit('system-status', status)
      } catch (error) {
        console.error(chalk.red('❌ 狀態更新失敗:'), error.message)
      }
    }, 5000)
    
    // 每 30 秒更新一次統計資料
    setInterval(() => {
      try {
        const stats = this.aiRouter.getStats()
        this.io.emit('stats-update', stats)
      } catch (error) {
        console.error(chalk.red('❌ 統計更新失敗:'), error.message)
      }
    }, 30000)
  }
  
  /**
   * 📊 取得系統狀態
   */
  async getSystemStatus() {
    const services = await this.getServicesStatus()
    const stats = this.aiRouter.getStats()
    const config = this.getConfiguration()
    
    return {
      lastUpdated: new Date().toISOString(),
      services,
      stats,
      config,
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        platform: process.platform,
        nodeVersion: process.version,
        pid: process.pid
      }
    }
  }
  
  /**
   * 🔧 取得服務狀態
   */
  async getServicesStatus() {
    const services = {}
    
    try {
      // LM Studio 狀態
      services.lmStudio = {
        name: 'LM Studio',
        healthy: await this.aiRouter.isLMStudioHealthy(),
        endpoint: process.env.LM_STUDIO_ENDPOINT || 'http://127.0.0.1:1234',
        model: process.env.LM_STUDIO_MODEL || 'unsloth/gpt-oss-20b-GGUF',
        lastChecked: new Date().toISOString()
      }
      
      // 本地模型 (Ollama) 狀態
      services.ollama = {
        name: 'Ollama',
        healthy: await this.aiRouter.isLocalModelHealthy(),
        endpoint: 'http://localhost:11434',
        model: 'gpt-oss:20b',
        lastChecked: new Date().toISOString()
      }
      
      // Claude API 狀態
      services.claudeApi = {
        name: 'Claude API',
        healthy: !!process.env.ANTHROPIC_API_KEY,
        endpoint: 'https://api.anthropic.com',
        model: 'claude-3-sonnet-20241022',
        configured: !!process.env.ANTHROPIC_API_KEY,
        lastChecked: new Date().toISOString()
      }
      
      // Cline API 狀態
      services.clineApi = {
        name: 'Cline Claude Code',
        healthy: await this.aiRouter.isClineApiHealthy(),
        endpoint: process.env.CLINE_API_ENDPOINT || 'http://localhost:3001',
        provider: process.env.CLAUDE_CODE_PROVIDER || 'auto',
        lastChecked: new Date().toISOString()
      }
      
    } catch (error) {
      console.error('取得服務狀態時出錯:', error.message)
    }
    
    return services
  }
  
  /**
   * ⚙️ 取得配置資訊
   */
  getConfiguration() {
    return {
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'development',
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? '已配置' : '未配置',
        LM_STUDIO_ENDPOINT: process.env.LM_STUDIO_ENDPOINT || 'http://127.0.0.1:1234',
        LM_STUDIO_MODEL: process.env.LM_STUDIO_MODEL || 'unsloth/gpt-oss-20b-GGUF',
        CLAUDE_CODE_PROVIDER: process.env.CLAUDE_CODE_PROVIDER || 'auto',
        CLINE_API_ENDPOINT: process.env.CLINE_API_ENDPOINT || 'http://localhost:3001'
      },
      aiRouter: {
        defaultTimeout: this.aiRouter.defaultTimeout,
        localModelName: this.aiRouter.localModelName
      },
      gui: {
        port: this.port,
        host: this.host
      }
    }
  }
  
  /**
   * 🧪 測試服務
   */
  async testService(service, prompt) {
    const startTime = Date.now()
    
    try {
      let result
      
      switch (service) {
        case 'lmstudio':
          result = await this.lmStudioService.generate(prompt)
          break
        case 'ollama':
          result = await this.aiRouter.generateWithLocalModel(prompt)
          break
        case 'claude':
          result = await this.aiRouter.generateWithClaudeApi(prompt)
          break
        case 'cline':
          result = await this.aiRouter.generateWithClineApi(prompt)
          break
        case 'auto':
          result = await this.aiRouter.generate(prompt)
          break
        default:
          throw new Error(`不支援的服務: ${service}`)
      }
      
      return {
        success: true,
        service,
        prompt,
        result: result.content,
        responseTime: Date.now() - startTime,
        method: result.metadata?.method || service,
        model: result.model || 'unknown',
        timestamp: new Date().toISOString()
      }
      
    } catch (error) {
      return {
        success: false,
        service,
        prompt,
        error: error.message,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    }
  }
  
  /**
   * 🚀 啟動服務器
   */
  async start() {
    return new Promise((resolve, reject) => {
      this.server.listen(this.port, this.host, (err) => {
        if (err) {
          reject(err)
        } else {
          this.logger?.info(chalk.green(`\n🖥️  mursfoto-cli GUI 服務器已啟動`))
          this.logger?.info(chalk.cyan(`🌐 訪問: http://${this.host}:${this.port}`))
          this.logger?.info(chalk.yellow(`📊 即時監控所有 AI 服務狀態`))
          resolve()
        }
      })
    })
  }
  
  /**
   * 🛑 停止服務器
   */
  async stop() {
    return new Promise((resolve) => {
      this.server.close(() => {
        this.logger?.info(chalk.yellow('🛑 GUI 服務器已停止'))
        resolve()
      })
    })
  }
}

module.exports = GUIServer
