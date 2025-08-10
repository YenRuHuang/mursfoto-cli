const axios = require('axios')
const fs = require('fs').promises
const path = require('path')
const crypto = require('crypto')
const semver = require('semver')
const { logger } = require('../utils/logger')

/**
 * 🏪 Mursfoto 市場平台服務
 * 處理插件、模板、服務的發布、搜尋、安裝和管理
 */
class MarketplaceService {
  constructor(config = {}) {
    this.config = {
      apiUrl: config.apiUrl || 'https://marketplace.mursfoto.com/api',
      registryUrl: config.registryUrl || 'https://registry.mursfoto.com',
      cdn: config.cdn || 'https://cdn.mursfoto.com',
      timeout: config.timeout || 30000,
      ...config
    }
    
    this.client = axios.create({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': `mursfoto-cli/${process.env.npm_package_version || '1.0.0'}`
      }
    })
    
    this.cache = new MarketplaceCache()
    this.analytics = new MarketplaceAnalytics()
    
    // 設定請求攔截器
    this.setupInterceptors()
  }

  /**
   * 設定 HTTP 攔截器
   */
  setupInterceptors() {
    // 請求攔截器
    this.client.interceptors.request.use(
      (config) => {
        // 添加認證 token
        const token = this.getAuthToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        
        // 記錄請求
        this.analytics.recordRequest(config)
        
        logger.debug(`🌐 API 請求: ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        logger.error('❌ 請求攔截器錯誤:', error.message)
        return Promise.reject(error)
      }
    )

    // 響應攔截器
    this.client.interceptors.response.use(
      (response) => {
        // 記錄響應
        this.analytics.recordResponse(response)
        
        logger.debug(`✅ API 響應: ${response.status} ${response.config.url}`)
        return response
      },
      (error) => {
        // 記錄錯誤
        this.analytics.recordError(error)
        
        logger.error(`❌ API 錯誤: ${error.response?.status} ${error.config?.url}`)
        
        // 處理常見錯誤
        if (error.response?.status === 401) {
          logger.warn('🔒 認證失效，請重新登入')
        }
        
        return Promise.reject(error)
      }
    )
  }

  /**
   * 🔍 搜尋市場內容
   * @param {string} query - 搜尋關鍵字
   * @param {Object} filters - 過濾條件
   */
  async search(query, filters = {}) {
    try {
      logger.info(`🔍 搜尋市場內容: ${query}`)
      
      // 檢查快取
      const cacheKey = this.generateCacheKey('search', { query, filters })
      const cached = await this.cache.get(cacheKey)
      if (cached) {
        logger.debug('📦 使用快取結果')
        return cached
      }

      const params = {
        q: query,
        category: filters.category || 'all',
        type: filters.type || 'all', // plugin, template, service
        tag: filters.tag,
        author: filters.author,
        license: filters.license,
        minRating: filters.minRating,
        maxPrice: filters.maxPrice,
        sort: filters.sort || 'relevance', // relevance, downloads, rating, updated
        limit: filters.limit || 20,
        offset: filters.offset || 0
      }

      const response = await this.client.get('/search', { params })
      const results = this.processSearchResults(response.data)
      
      // 快取結果
      await this.cache.set(cacheKey, results, 300) // 5 分鐘快取
      
      logger.info(`✅ 搜尋完成: 找到 ${results.items.length} 個結果`)
      return results
      
    } catch (error) {
      logger.error(`❌ 搜尋失敗:`, error.message)
      throw error
    }
  }

  /**
   * 📋 獲取詳細資訊
   * @param {string} itemId - 項目 ID
   * @param {string} type - 項目類型 (plugin, template, service)
   */
  async getDetails(itemId, type = 'plugin') {
    try {
      logger.info(`📋 獲取 ${type} 詳情: ${itemId}`)
      
      // 檢查快取
      const cacheKey = this.generateCacheKey('details', { itemId, type })
      const cached = await this.cache.get(cacheKey)
      if (cached) {
        return cached
      }

      const response = await this.client.get(`/${type}s/${itemId}`)
      const details = this.processItemDetails(response.data)
      
      // 快取結果
      await this.cache.set(cacheKey, details, 600) // 10 分鐘快取
      
      logger.info(`✅ 獲取詳情成功: ${details.name}`)
      return details
      
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error(`找不到 ${type}: ${itemId}`)
      }
      logger.error(`❌ 獲取詳情失敗:`, error.message)
      throw error
    }
  }

  /**
   * 📥 安裝項目
   * @param {string} itemId - 項目 ID  
   * @param {string} type - 項目類型
   * @param {Object} options - 安裝選項
   */
  async install(itemId, type = 'plugin', options = {}) {
    try {
      logger.info(`📥 開始安裝 ${type}: ${itemId}`)
      
      // 獲取項目詳情
      const details = await this.getDetails(itemId, type)
      
      // 檢查相容性
      await this.checkCompatibility(details)
      
      // 檢查依賴
      await this.checkDependencies(details.dependencies || {})
      
      // 下載項目
      const downloadUrl = await this.getDownloadUrl(itemId, type, details.version)
      const localPath = await this.downloadItem(downloadUrl, itemId, type)
      
      // 驗證完整性
      await this.verifyIntegrity(localPath, details.checksum)
      
      // 安全掃描
      await this.performSecurityScan(localPath, details)
      
      // 安裝項目
      const installResult = await this.performInstallation(localPath, details, options)
      
      // 記錄安裝
      await this.recordInstallation(itemId, type, details.version)
      
      logger.info(`🎉 ${type} ${itemId} 安裝成功`)
      
      return {
        success: true,
        item: details,
        installPath: installResult.installPath,
        message: `${details.name} 安裝完成`
      }
      
    } catch (error) {
      logger.error(`❌ 安裝 ${type} ${itemId} 失敗:`, error.message)
      throw error
    }
  }

  /**
   * 🗑️ 卸載項目
   * @param {string} itemId - 項目 ID
   * @param {string} type - 項目類型
   */
  async uninstall(itemId, type = 'plugin') {
    try {
      logger.info(`🗑️ 卸載 ${type}: ${itemId}`)
      
      // 獲取安裝信息
      const installInfo = await this.getInstallInfo(itemId, type)
      if (!installInfo) {
        throw new Error(`${type} ${itemId} 未安裝`)
      }
      
      // 檢查依賴
      const dependents = await this.findDependents(itemId, type)
      if (dependents.length > 0) {
        const dependentNames = dependents.map(d => d.name).join(', ')
        throw new Error(`無法卸載 ${itemId}，以下項目依賴它: ${dependentNames}`)
      }
      
      // 執行卸載
      await this.performUninstallation(installInfo)
      
      // 清理記錄
      await this.removeInstallRecord(itemId, type)
      
      logger.info(`✅ ${type} ${itemId} 卸載成功`)
      
      return {
        success: true,
        message: `${itemId} 卸載完成`
      }
      
    } catch (error) {
      logger.error(`❌ 卸載 ${type} ${itemId} 失敗:`, error.message)
      throw error
    }
  }

  /**
   * 📤 發布項目
   * @param {string} packagePath - 包路徑
   * @param {Object} metadata - 元數據
   */
  async publish(packagePath, metadata) {
    try {
      logger.info(`📤 發布項目: ${metadata.name}`)
      
      // 驗證包結構
      await this.validatePackageStructure(packagePath, metadata)
      
      // 生成校驗碼
      const checksum = await this.generateChecksum(packagePath)
      
      // 打包項目
      const packageBuffer = await this.createPackage(packagePath)
      
      // 上傳到 CDN
      const downloadUrl = await this.uploadToCDN(packageBuffer, metadata.name, metadata.version)
      
      // 創建發布請求
      const publishData = {
        ...metadata,
        checksum,
        downloadUrl,
        packageSize: packageBuffer.length,
        publishedAt: new Date().toISOString()
      }
      
      const response = await this.client.post('/publish', publishData)
      
      logger.info(`🎉 項目 ${metadata.name} 發布成功`)
      
      return {
        success: true,
        item: response.data,
        message: `${metadata.name} 發布完成`
      }
      
    } catch (error) {
      logger.error(`❌ 發布項目失敗:`, error.message)
      throw error
    }
  }

  /**
   * ⭐ 評分和評論
   * @param {string} itemId - 項目 ID
   * @param {number} rating - 評分 (1-5)
   * @param {string} review - 評論內容
   */
  async rateAndReview(itemId, rating, review = '') {
    try {
      logger.info(`⭐ 評分項目: ${itemId} (${rating}/5)`)
      
      if (rating < 1 || rating > 5) {
        throw new Error('評分必須在 1-5 之間')
      }
      
      const reviewData = {
        itemId,
        rating,
        review: review.trim(),
        timestamp: new Date().toISOString()
      }
      
      const response = await this.client.post(`/items/${itemId}/reviews`, reviewData)
      
      logger.info(`✅ 評分提交成功`)
      
      return {
        success: true,
        review: response.data,
        message: '評分和評論提交成功'
      }
      
    } catch (error) {
      logger.error(`❌ 提交評分失敗:`, error.message)
      throw error
    }
  }

  /**
   * 📊 獲取統計數據
   * @param {string} itemId - 項目 ID (可選，不提供則獲取整體統計)
   */
  async getStatistics(itemId = null) {
    try {
      const endpoint = itemId ? `/items/${itemId}/stats` : '/stats'
      const response = await this.client.get(endpoint)
      
      return response.data
    } catch (error) {
      logger.error('❌ 獲取統計數據失敗:', error.message)
      throw error
    }
  }

  /**
   * 📋 獲取已安裝項目清單
   */
  async getInstalled() {
    try {
      const installationsPath = path.join(process.cwd(), '.mursfoto', 'installations.json')
      
      try {
        const data = await fs.readFile(installationsPath, 'utf8')
        return JSON.parse(data)
      } catch (error) {
        // 文件不存在，返回空清單
        return {
          plugins: {},
          templates: {},
          services: {},
          lastUpdated: new Date().toISOString()
        }
      }
    } catch (error) {
      logger.error('❌ 獲取已安裝項目清單失敗:', error.message)
      throw error
    }
  }

  /**
   * 🔄 更新項目
   * @param {string} itemId - 項目 ID
   * @param {string} type - 項目類型
   * @param {string} targetVersion - 目標版本 (可選)
   */
  async update(itemId, type = 'plugin', targetVersion = 'latest') {
    try {
      logger.info(`🔄 更新 ${type}: ${itemId} -> ${targetVersion}`)
      
      // 獲取當前安裝信息
      const currentInfo = await this.getInstallInfo(itemId, type)
      if (!currentInfo) {
        throw new Error(`${type} ${itemId} 未安裝`)
      }
      
      // 獲取最新信息
      const latestDetails = await this.getDetails(itemId, type)
      
      // 檢查是否需要更新
      if (targetVersion === 'latest') {
        targetVersion = latestDetails.version
      }
      
      if (semver.gte(currentInfo.version, targetVersion)) {
        logger.info(`✅ ${itemId} 已是最新版本: ${currentInfo.version}`)
        return {
          success: true,
          message: '已是最新版本',
          currentVersion: currentInfo.version
        }
      }
      
      // 執行更新 (先卸載再安裝)
      await this.uninstall(itemId, type)
      const installResult = await this.install(itemId, type)
      
      logger.info(`🎉 ${itemId} 更新完成: ${currentInfo.version} -> ${targetVersion}`)
      
      return {
        success: true,
        message: '更新完成',
        oldVersion: currentInfo.version,
        newVersion: targetVersion
      }
      
    } catch (error) {
      logger.error(`❌ 更新 ${type} ${itemId} 失敗:`, error.message)
      throw error
    }
  }

  // 內部輔助方法

  generateCacheKey(operation, params) {
    const str = `${operation}:${JSON.stringify(params)}`
    return crypto.createHash('md5').update(str).digest('hex')
  }

  processSearchResults(data) {
    return {
      query: data.query,
      total: data.total,
      items: data.items.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        version: item.version,
        description: item.description,
        author: item.author,
        rating: item.rating,
        downloads: item.downloads,
        license: item.license,
        tags: item.tags,
        updatedAt: item.updatedAt
      }))
    }
  }

  processItemDetails(data) {
    return {
      id: data.id,
      name: data.name,
      type: data.type,
      version: data.version,
      description: data.description,
      longDescription: data.longDescription,
      author: data.author,
      maintainers: data.maintainers,
      homepage: data.homepage,
      repository: data.repository,
      license: data.license,
      keywords: data.keywords,
      rating: data.rating,
      downloads: data.downloads,
      dependencies: data.dependencies,
      mursfotoVersion: data.mursfotoVersion,
      checksum: data.checksum,
      publishedAt: data.publishedAt,
      updatedAt: data.updatedAt
    }
  }

  async checkCompatibility(details) {
    const currentVersion = process.env.npm_package_version || '1.0.0'
    const requiredVersion = details.mursfotoVersion || '*'
    
    if (requiredVersion !== '*' && !semver.satisfies(currentVersion, requiredVersion)) {
      throw new Error(
        `版本不相容: 需要 mursfoto-cli ${requiredVersion}，當前版本 ${currentVersion}`
      )
    }
  }

  async checkDependencies(dependencies) {
    for (const [dep, version] of Object.entries(dependencies)) {
      try {
        const installedVersion = require(`${dep}/package.json`).version
        if (!semver.satisfies(installedVersion, version)) {
          logger.warn(`⚠️ 依賴版本警告: ${dep}@${version}`)
        }
      } catch (error) {
        logger.warn(`⚠️ 依賴缺失: ${dep}@${version}`)
      }
    }
  }

  async getDownloadUrl(itemId, type, version) {
    const response = await this.client.get(`/${type}s/${itemId}/download`, {
      params: { version }
    })
    return response.data.url
  }

  async downloadItem(url, itemId, type) {
    logger.info(`📥 下載 ${type}: ${itemId}`)
    
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 60000 // 1 分鐘
    })
    
    const downloadDir = path.join(process.cwd(), '.mursfoto', 'downloads')
    await fs.mkdir(downloadDir, { recursive: true })
    
    const fileName = `${itemId}-${Date.now()}.tar.gz`
    const filePath = path.join(downloadDir, fileName)
    
    await fs.writeFile(filePath, response.data)
    
    logger.info(`✅ 下載完成: ${filePath}`)
    return filePath
  }

  async verifyIntegrity(filePath, expectedChecksum) {
    const fileBuffer = await fs.readFile(filePath)
    const actualChecksum = crypto.createHash('sha256').update(fileBuffer).digest('hex')
    
    if (actualChecksum !== expectedChecksum) {
      throw new Error('文件完整性檢查失敗')
    }
    
    logger.debug('✅ 文件完整性檢查通過')
  }

  async performSecurityScan(filePath, details) {
    // 實施安全掃描邏輯
    logger.debug(`🔒 執行安全掃描: ${details.name}`)
    
    // TODO: 實現病毒掃描、惡意代碼檢測等
  }

  async performInstallation(packagePath, details, options) {
    // 實施安裝邏輯
    const installDir = path.join(process.cwd(), '.mursfoto', details.type + 's', details.name)
    
    // 解壓和安裝
    // TODO: 實現解壓和文件複製邏輯
    
    return {
      installPath: installDir
    }
  }

  async recordInstallation(itemId, type, version) {
    const installationsPath = path.join(process.cwd(), '.mursfoto', 'installations.json')
    
    let installations = await this.getInstalled()
    
    if (!installations[type + 's']) {
      installations[type + 's'] = {}
    }
    
    installations[type + 's'][itemId] = {
      version,
      installedAt: new Date().toISOString()
    }
    
    installations.lastUpdated = new Date().toISOString()
    
    await fs.writeFile(installationsPath, JSON.stringify(installations, null, 2))
  }

  async getInstallInfo(itemId, type) {
    const installations = await this.getInstalled()
    return installations[type + 's']?.[itemId] || null
  }

  async findDependents(itemId, type) {
    // 找到依賴此項目的其他項目
    // TODO: 實現依賴查找邏輯
    return []
  }

  async performUninstallation(installInfo) {
    // 實施卸載邏輯
    // TODO: 實現文件刪除等清理邏輯
  }

  async removeInstallRecord(itemId, type) {
    const installationsPath = path.join(process.cwd(), '.mursfoto', 'installations.json')
    
    let installations = await this.getInstalled()
    
    if (installations[type + 's']?.[itemId]) {
      delete installations[type + 's'][itemId]
      installations.lastUpdated = new Date().toISOString()
      
      await fs.writeFile(installationsPath, JSON.stringify(installations, null, 2))
    }
  }

  getAuthToken() {
    // 從配置或環境變數獲取認證 token
    return process.env.MURSFOTO_TOKEN || null
  }

  async validatePackageStructure(packagePath, metadata) {
    // 驗證包結構的完整性
    logger.debug(`🔍 驗證包結構: ${metadata.name}`)
    
    // TODO: 實現包結構驗證邏輯
  }

  async generateChecksum(packagePath) {
    const fileBuffer = await fs.readFile(packagePath)
    return crypto.createHash('sha256').update(fileBuffer).digest('hex')
  }

  async createPackage(packagePath) {
    // 創建壓縮包
    // TODO: 實現打包邏輯
    return Buffer.from('package-content')
  }

  async uploadToCDN(packageBuffer, name, version) {
    // 上傳到 CDN
    // TODO: 實現 CDN 上傳邏輯
    return `${this.config.cdn}/${name}/${version}/package.tar.gz`
  }
}

/**
 * 📦 市場平台快取
 */
class MarketplaceCache {
  constructor() {
    this.cache = new Map()
    this.ttl = new Map()
  }

  async get(key) {
    if (this.ttl.has(key) && Date.now() > this.ttl.get(key)) {
      this.cache.delete(key)
      this.ttl.delete(key)
      return null
    }
    
    return this.cache.get(key) || null
  }

  async set(key, value, ttlSeconds = 300) {
    this.cache.set(key, value)
    this.ttl.set(key, Date.now() + ttlSeconds * 1000)
  }

  clear() {
    this.cache.clear()
    this.ttl.clear()
  }
}

/**
 * 📊 市場平台分析
 */
class MarketplaceAnalytics {
  constructor() {
    this.requests = []
    this.responses = []
    this.errors = []
  }

  recordRequest(config) {
    this.requests.push({
      method: config.method,
      url: config.url,
      timestamp: Date.now()
    })
  }

  recordResponse(response) {
    this.responses.push({
      status: response.status,
      url: response.config.url,
      responseTime: response.config.metadata?.endTime - response.config.metadata?.startTime,
      timestamp: Date.now()
    })
  }

  recordError(error) {
    this.errors.push({
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      timestamp: Date.now()
    })
  }

  getStatistics() {
    return {
      totalRequests: this.requests.length,
      totalResponses: this.responses.length,
      totalErrors: this.errors.length,
      errorRate: this.requests.length > 0 ? (this.errors.length / this.requests.length * 100) : 0
    }
  }
}

module.exports = {
  MarketplaceService,
  MarketplaceCache,
  MarketplaceAnalytics
}
