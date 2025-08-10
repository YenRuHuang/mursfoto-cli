const { logger } = require('../utils/helpers')
const chalk = require('chalk')

/**
 * 💰 成本分析服務 - Phase 3
 *
 * 跨雲平台成本分析、預測和優化建議
 *
 * 核心功能:
 * - 多平台成本比較
 * - 成本預測和趋势分析
 * - 優化建議和節省機會識別
 * - 預算警報和監控
 */
class CostAnalyzer {
  constructor () {
    this.pricingData = new Map()
    this.costHistory = []
    this.budgetAlerts = new Map()
    this.optimizationRules = []
    this.initialize()
  }

  /**
   * 初始化成本分析器
   */
  initialize () {
    logger.info('💰 初始化成本分析服務...')

    // 載入定價數據
    this.loadPricingData()

    // 載入優化規則
    this.loadOptimizationRules()

    logger.info('✅ 成本分析服務初始化完成')
  }

  /**
   * 載入各平台定價數據
   */
  loadPricingData () {
    // AWS 定價 (簡化版)
    this.pricingData.set('aws', {
      compute: {
        't3.micro': { vcpu: 2, memory: 1, price: 0.0104 }, // per hour
        't3.small': { vcpu: 2, memory: 2, price: 0.0208 },
        't3.medium': { vcpu: 2, memory: 4, price: 0.0416 },
        't3.large': { vcpu: 2, memory: 8, price: 0.0832 }
      },
      storage: {
        'ebs-gp3': 0.08, // per GB/month
        'ebs-io1': 0.125,
        's3-standard': 0.023
      },
      network: {
        'data-transfer-out': 0.09, // per GB
        cloudfront: 0.085
      },
      services: {
        'lambda-requests': 0.0000002, // per request
        'lambda-duration': 0.0000166667, // per GB-second
        'rds-mysql-t3.micro': 0.017 // per hour
      }
    })

    // Azure 定價
    this.pricingData.set('azure', {
      compute: {
        B1s: { vcpu: 1, memory: 1, price: 0.0104 },
        B2s: { vcpu: 2, memory: 4, price: 0.0416 },
        B4ms: { vcpu: 4, memory: 16, price: 0.166 }
      },
      storage: {
        'premium-ssd': 0.135, // per GB/month
        'standard-ssd': 0.05,
        'blob-hot': 0.0184
      },
      network: {
        'bandwidth-out': 0.087, // per GB
        cdn: 0.081
      },
      services: {
        'functions-execution': 0.000016, // per execution
        'sql-basic': 0.0067 // per hour
      }
    })

    // GCP 定價
    this.pricingData.set('gcp', {
      compute: {
        'e2-micro': { vcpu: 0.25, memory: 1, price: 0.0066 },
        'e2-small': { vcpu: 0.5, memory: 2, price: 0.0133 },
        'e2-medium': { vcpu: 1, memory: 4, price: 0.0266 }
      },
      storage: {
        'ssd-persistent': 0.17, // per GB/month
        'standard-persistent': 0.04,
        'cloud-storage': 0.02
      },
      network: {
        egress: 0.12, // per GB
        'cloud-cdn': 0.08
      },
      services: {
        'cloud-functions': 0.0000004, // per invocation
        'cloud-sql': 0.0150 // per hour
      }
    })

    // DigitalOcean 定價
    this.pricingData.set('digitalocean', {
      compute: {
        'basic-1gb': { vcpu: 1, memory: 1, price: 0.007 },
        'basic-2gb': { vcpu: 1, memory: 2, price: 0.015 },
        'basic-4gb': { vcpu: 2, memory: 4, price: 0.030 }
      },
      storage: {
        'block-storage': 0.10, // per GB/month
        spaces: 0.02
      },
      network: {
        bandwidth: 0.01 // per GB (after free tier)
      },
      services: {
        'app-platform': 0.007, // per hour for basic tier
        'managed-database': 0.021 // per hour
      }
    })

    // Vercel 定價
    this.pricingData.set('vercel', {
      compute: {
        hobby: { price: 0 }, // Free tier
        pro: { price: 20 }, // per month
        enterprise: { price: 400 } // per month
      },
      services: {
        'serverless-function-gb-hours': 0.000018,
        'edge-function-requests': 0.0000005
      },
      bandwidth: {
        hobby: 100, // GB free
        'pro-additional': 0.40 // per GB
      }
    })
  }

  /**
   * 載入成本優化規則
   */
  loadOptimizationRules () {
    this.optimizationRules = [
      {
        id: 'right_sizing',
        name: '資源適配優化',
        description: '根據實際使用率調整資源配置',
        category: 'resource_optimization',
        potential_savings: 0.3, // 30% 潛在節省
        check: (usage) => usage.cpu_utilization < 50 || usage.memory_utilization < 50
      },
      {
        id: 'reserved_instances',
        name: '預留實例',
        description: '對穩定工作負載使用預留實例',
        category: 'pricing_optimization',
        potential_savings: 0.6, // 60% 節省
        check: (usage) => usage.uptime_ratio > 0.7
      },
      {
        id: 'spot_instances',
        name: 'Spot 實例',
        description: '對可中斷工作負載使用 Spot 實例',
        category: 'pricing_optimization',
        potential_savings: 0.9, // 90% 節省
        check: (usage) => usage.fault_tolerant && usage.uptime_requirement < 0.95
      },
      {
        id: 'auto_scaling',
        name: '自動擴縮容',
        description: '根據負載自動調整資源',
        category: 'automation',
        potential_savings: 0.4,
        check: (usage) => usage.load_variation > 0.5
      },
      {
        id: 'storage_optimization',
        name: '存儲優化',
        description: '選擇適當的存儲類型和層級',
        category: 'storage',
        potential_savings: 0.5,
        check: (usage) => usage.storage_access_pattern === 'infrequent'
      }
    ]
  }

  /**
   * 分析專案成本
   */
  async analyzeProjectCosts (projectConfig) {
    try {
      logger.info('📊 分析專案成本...')

      const {
        platforms = ['aws', 'azure', 'gcp'],
        requirements = {},
        duration = 'monthly'
      } = projectConfig

      const costAnalysis = {
        platforms: [],
        comparison: {},
        recommendations: [],
        totalSavingsPotential: 0
      }

      // 分析每個平台的成本
      for (const platformId of platforms) {
        const platformCost = await this.calculatePlatformCost(platformId, requirements, duration)
        costAnalysis.platforms.push(platformCost)
      }

      // 平台比較
      costAnalysis.comparison = this.comparePlatformCosts(costAnalysis.platforms)

      // 生成優化建議
      costAnalysis.recommendations = await this.generateCostOptimizations(projectConfig)

      // 計算總節省潛力
      costAnalysis.totalSavingsPotential = costAnalysis.recommendations.reduce(
        (total, rec) => total + (rec.potential_monthly_savings || 0), 0
      )

      logger.info(`💡 生成了 ${costAnalysis.recommendations.length} 項優化建議`)

      return {
        success: true,
        analysis: costAnalysis,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      logger.error('成本分析失敗:', error.message)
      return { success: false, error: error.message }
    }
  }

  /**
   * 計算特定平台成本
   */
  async calculatePlatformCost (platformId, requirements, duration) {
    const pricing = this.pricingData.get(platformId)
    if (!pricing) {
      throw new Error(`找不到 ${platformId} 的定價數據`)
    }

    const {
      compute_requirements = { vcpu: 2, memory: 4, hours: 730 },
      storage_requirements = { size_gb: 20, type: 'standard' },
      network_requirements = { data_transfer_gb: 100 },
      services = []
    } = requirements

    let totalCost = 0
    const breakdown = {}

    // 計算計算成本
    if (pricing.compute) {
      const computeInstance = this.findBestComputeInstance(
        pricing.compute,
        compute_requirements.vcpu,
        compute_requirements.memory
      )
      const computeCost = computeInstance.price * compute_requirements.hours
      totalCost += computeCost
      breakdown.compute = {
        instance_type: computeInstance.type,
        cost: computeCost,
        specs: { vcpu: computeInstance.vcpu, memory: computeInstance.memory }
      }
    }

    // 計算存儲成本
    if (pricing.storage) {
      const storageType = this.findBestStorageType(pricing.storage, storage_requirements.type)
      const storageCost = storageType.price * storage_requirements.size_gb
      totalCost += storageCost
      breakdown.storage = {
        type: storageType.type,
        size_gb: storage_requirements.size_gb,
        cost: storageCost
      }
    }

    // 計算網路成本
    if (pricing.network && network_requirements.data_transfer_gb > 0) {
      const networkCost = this.calculateNetworkCost(pricing.network, network_requirements)
      totalCost += networkCost
      breakdown.network = {
        data_transfer_gb: network_requirements.data_transfer_gb,
        cost: networkCost
      }
    }

    // 計算服務成本
    if (services.length > 0 && pricing.services) {
      const servicesCost = this.calculateServicesCost(pricing.services, services)
      totalCost += servicesCost
      breakdown.services = servicesCost
    }

    return {
      platform: platformId,
      total_cost: Math.round(totalCost * 100) / 100,
      breakdown,
      currency: 'USD',
      period: duration
    }
  }

  /**
   * 找到最適合的計算實例
   */
  findBestComputeInstance (computePricing, requiredVcpu, requiredMemory) {
    let bestMatch = null
    let bestScore = Infinity

    for (const [type, specs] of Object.entries(computePricing)) {
      if (specs.vcpu >= requiredVcpu && specs.memory >= requiredMemory) {
        // 計算性價比分數 (價格 / 性能)
        const performanceScore = specs.vcpu + specs.memory
        const score = specs.price / performanceScore

        if (score < bestScore) {
          bestScore = score
          bestMatch = { type, ...specs }
        }
      }
    }

    // 如果沒找到符合要求的，選擇最接近的
    if (!bestMatch) {
      let closestMatch = null
      let smallestDiff = Infinity

      for (const [type, specs] of Object.entries(computePricing)) {
        const diff = Math.abs(specs.vcpu - requiredVcpu) + Math.abs(specs.memory - requiredMemory)
        if (diff < smallestDiff) {
          smallestDiff = diff
          closestMatch = { type, ...specs }
        }
      }
      bestMatch = closestMatch
    }

    return bestMatch
  }

  /**
   * 找到最適合的存儲類型
   */
  findBestStorageType (storagePricing, requiredType) {
    // 存儲類型映射
    const typeMapping = {
      standard: ['standard', 'gp2', 'standard-persistent'],
      performance: ['io1', 'premium-ssd', 'ssd-persistent'],
      archive: ['glacier', 'archive', 'coldline']
    }

    const candidates = typeMapping[requiredType] || typeMapping.standard

    for (const candidate of candidates) {
      for (const [storageType, price] of Object.entries(storagePricing)) {
        if (storageType.includes(candidate)) {
          return { type: storageType, price }
        }
      }
    }

    // 回退到第一個可用的存儲類型
    const firstType = Object.keys(storagePricing)[0]
    return { type: firstType, price: storagePricing[firstType] }
  }

  /**
   * 計算網路成本
   */
  calculateNetworkCost (networkPricing, networkRequirements) {
    let cost = 0

    // 數據傳輸成本
    if (networkPricing['data-transfer-out'] || networkPricing.egress || networkPricing['bandwidth-out']) {
      const transferRate = networkPricing['data-transfer-out'] || networkPricing.egress || networkPricing['bandwidth-out']
      cost += transferRate * networkRequirements.data_transfer_gb
    }

    // CDN 成本 (如果使用)
    if (networkRequirements.cdn_usage && networkPricing.cloudfront) {
      cost += networkPricing.cloudfront * networkRequirements.cdn_usage
    }

    return cost
  }

  /**
   * 計算服務成本
   */
  calculateServicesCost (servicePricing, services) {
    let totalCost = 0

    for (const service of services) {
      const { name, usage } = service

      if (servicePricing[name]) {
        totalCost += servicePricing[name] * usage
      }
    }

    return totalCost
  }

  /**
   * 比較平台成本
   */
  comparePlatformCosts (platformCosts) {
    if (platformCosts.length === 0) return {}

    // 排序
    const sortedCosts = [...platformCosts].sort((a, b) => a.total_cost - b.total_cost)

    const cheapest = sortedCosts[0]
    const mostExpensive = sortedCosts[sortedCosts.length - 1]

    const comparison = {
      cheapest: cheapest.platform,
      most_expensive: mostExpensive.platform,
      cost_difference: mostExpensive.total_cost - cheapest.total_cost,
      savings_potential: Math.round(((mostExpensive.total_cost - cheapest.total_cost) / mostExpensive.total_cost) * 100),
      rankings: sortedCosts.map((cost, index) => ({
        rank: index + 1,
        platform: cost.platform,
        cost: cost.total_cost,
        percentage_above_cheapest: index === 0 ? 0 : Math.round(((cost.total_cost - cheapest.total_cost) / cheapest.total_cost) * 100)
      }))
    }

    return comparison
  }

  /**
   * 生成成本優化建議
   */
  async generateCostOptimizations (projectConfig) {
    const recommendations = []

    for (const rule of this.optimizationRules) {
      // 模擬使用數據檢查 (實際應用中會有真實數據)
      const mockUsage = {
        cpu_utilization: Math.random() * 100,
        memory_utilization: Math.random() * 100,
        uptime_ratio: Math.random(),
        fault_tolerant: Math.random() > 0.5,
        uptime_requirement: Math.random(),
        load_variation: Math.random(),
        storage_access_pattern: Math.random() > 0.5 ? 'frequent' : 'infrequent'
      }

      if (rule.check(mockUsage)) {
        const estimatedSavings = await this.estimateSavings(rule, projectConfig)

        recommendations.push({
          id: rule.id,
          name: rule.name,
          description: rule.description,
          category: rule.category,
          priority: this.calculatePriority(estimatedSavings, rule.potential_savings),
          potential_monthly_savings: estimatedSavings,
          implementation_effort: this.getImplementationEffort(rule.id),
          steps: this.getImplementationSteps(rule.id)
        })
      }
    }

    // 按潛在節省金額排序
    recommendations.sort((a, b) => b.potential_monthly_savings - a.potential_monthly_savings)

    return recommendations.slice(0, 5) // 返回前5個建議
  }

  /**
   * 估算節省金額
   */
  async estimateSavings (rule, projectConfig) {
    // 基於專案配置估算當前成本
    const currentCost = projectConfig.estimated_monthly_cost || 100 // 預設值
    return Math.round(currentCost * rule.potential_savings)
  }

  /**
   * 計算建議優先級
   */
  calculatePriority (estimatedSavings, potentialSavingsRatio) {
    if (estimatedSavings > 100 && potentialSavingsRatio > 0.5) return 'high'
    if (estimatedSavings > 50 && potentialSavingsRatio > 0.3) return 'medium'
    return 'low'
  }

  /**
   * 獲取實施難度
   */
  getImplementationEffort (ruleId) {
    const effortMap = {
      right_sizing: 'low',
      reserved_instances: 'medium',
      spot_instances: 'high',
      auto_scaling: 'medium',
      storage_optimization: 'low'
    }
    return effortMap[ruleId] || 'medium'
  }

  /**
   * 獲取實施步驟
   */
  getImplementationSteps (ruleId) {
    const stepsMap = {
      right_sizing: [
        '監控資源使用率 7-14 天',
        '識別使用率過低的資源',
        '選擇合適的資源配置',
        '執行資源調整',
        '監控性能影響'
      ],
      reserved_instances: [
        '分析歷史使用模式',
        '識別穩定運行的實例',
        '計算預留實例 ROI',
        '購買預留實例',
        '設置監控和報告'
      ],
      spot_instances: [
        '識別容錯應用程式',
        '實施優雅關機機制',
        '配置 Spot 實例',
        '測試中斷處理',
        '部署到生產環境'
      ],
      auto_scaling: [
        '設定負載監控指標',
        '定義擴縮容規則',
        '配置自動擴縮容組',
        '測試擴縮容行為',
        '優化指標和閾值'
      ],
      storage_optimization: [
        '分析存儲訪問模式',
        '識別冷熱數據',
        '選擇適當存儲層級',
        '設置自動分層政策',
        '監控成本變化'
      ]
    }
    return stepsMap[ruleId] || ['分析現狀', '制定計劃', '實施變更', '監控結果']
  }

  /**
   * 預測成本趨勢
   */
  async predictCostTrend (historicalData, forecastPeriod = 6) {
    try {
      logger.info('📈 預測成本趨勢...')

      if (historicalData.length < 3) {
        return {
          success: false,
          error: '需要至少3個月的歷史數據'
        }
      }

      // 簡單的線性回歸預測
      const trend = this.calculateTrend(historicalData)
      const forecast = []

      for (let i = 1; i <= forecastPeriod; i++) {
        const predictedCost = trend.slope * (historicalData.length + i) + trend.intercept
        forecast.push({
          month: i,
          predicted_cost: Math.max(0, Math.round(predictedCost)),
          confidence: Math.max(0, 100 - i * 10) // 信心度隨時間遞減
        })
      }

      const totalForecast = forecast.reduce((sum, month) => sum + month.predicted_cost, 0)
      const averageHistorical = historicalData.reduce((sum, data) => sum + data.cost, 0) / historicalData.length

      return {
        success: true,
        historical_average: Math.round(averageHistorical),
        trend_direction: trend.slope > 0 ? 'increasing' : trend.slope < 0 ? 'decreasing' : 'stable',
        monthly_change_rate: Math.round(trend.slope),
        forecast,
        total_forecast_period_cost: totalForecast,
        recommendations: this.getTrendRecommendations(trend, forecast)
      }
    } catch (error) {
      logger.error('成本趨勢預測失敗:', error.message)
      return { success: false, error: error.message }
    }
  }

  /**
   * 計算趨勢線
   */
  calculateTrend (data) {
    const n = data.length
    const sumX = data.reduce((sum, _, i) => sum + i, 0)
    const sumY = data.reduce((sum, item) => sum + item.cost, 0)
    const sumXY = data.reduce((sum, item, i) => sum + i * item.cost, 0)
    const sumXX = data.reduce((sum, _, i) => sum + i * i, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    return { slope, intercept }
  }

  /**
   * 獲取趨勢建議
   */
  getTrendRecommendations (trend, forecast) {
    const recommendations = []

    if (trend.slope > 10) {
      recommendations.push({
        type: 'warning',
        message: '成本增長過快，建議立即檢查資源使用並實施優化措施'
      })
    } else if (trend.slope > 5) {
      recommendations.push({
        type: 'caution',
        message: '成本呈上升趨勢，建議定期檢視和優化'
      })
    } else if (trend.slope < -5) {
      recommendations.push({
        type: 'positive',
        message: '成本優化效果良好，持續監控以保持趨勢'
      })
    }

    // 檢查預測中的異常峰值
    const avgForecast = forecast.reduce((sum, month) => sum + month.predicted_cost, 0) / forecast.length
    const hasSpikes = forecast.some(month => month.predicted_cost > avgForecast * 1.5)

    if (hasSpikes) {
      recommendations.push({
        type: 'alert',
        message: '預測顯示可能出現成本峰值，建議提前準備預算和優化計劃'
      })
    }

    return recommendations
  }

  /**
   * 設置預算警報
   */
  async setBudgetAlert (alertConfig) {
    try {
      const {
        name,
        budget_amount,
        alert_thresholds = [50, 80, 100], // 百分比
        notification_emails = [],
        platforms = ['all']
      } = alertConfig

      const alertId = `alert_${Date.now()}`

      this.budgetAlerts.set(alertId, {
        id: alertId,
        name,
        budget_amount,
        alert_thresholds,
        notification_emails,
        platforms,
        created_at: new Date().toISOString(),
        triggered_alerts: [],
        status: 'active'
      })

      logger.info(`📢 預算警報已設置: ${name} ($${budget_amount})`)

      return {
        success: true,
        alert_id: alertId,
        message: '預算警報設置成功'
      }
    } catch (error) {
      logger.error('設置預算警報失敗:', error.message)
      return { success: false, error: error.message }
    }
  }

  /**
   * 檢查預算警報
   */
  async checkBudgetAlerts (currentCosts) {
    const triggeredAlerts = []

    for (const [alertId, alert] of this.budgetAlerts.entries()) {
      if (alert.status !== 'active') continue

      const relevantCost = this.calculateRelevantCost(currentCosts, alert.platforms)
      const usagePercentage = (relevantCost / alert.budget_amount) * 100

      for (const threshold of alert.alert_thresholds) {
        if (usagePercentage >= threshold &&
            !alert.triggered_alerts.some(t => t.threshold === threshold && t.month === new Date().getMonth())) {
          const alertData = {
            alert_id: alertId,
            alert_name: alert.name,
            threshold,
            current_usage: usagePercentage,
            budget_amount: alert.budget_amount,
            current_cost: relevantCost,
            triggered_at: new Date().toISOString()
          }

          triggeredAlerts.push(alertData)
          alert.triggered_alerts.push({
            threshold,
            month: new Date().getMonth(),
            triggered_at: new Date().toISOString()
          })

          // 這裡可以發送實際通知 (email, webhook 等)
          await this.sendBudgetNotification(alertData, alert.notification_emails)
        }
      }
    }

    return triggeredAlerts
  }

  /**
   * 計算相關成本
   */
  calculateRelevantCost (costs, platforms) {
    if (platforms.includes('all')) {
      return costs.reduce((total, cost) => total + cost.total_cost, 0)
    }

    return costs
      .filter(cost => platforms.includes(cost.platform))
      .reduce((total, cost) => total + cost.total_cost, 0)
  }

  /**
   * 發送預算通知
   */
  async sendBudgetNotification (alertData, emails) {
    // 模擬發送通知
    logger.warn(`🚨 預算警報觸發: ${alertData.alert_name}`)
    logger.warn(`   當前使用率: ${alertData.current_usage.toFixed(1)}%`)
    logger.warn(`   當前成本: $${alertData.current_cost}`)
    logger.warn(`   預算額度: $${alertData.budget_amount}`)

    // 實際實現中會整合 email service 或其他通知服務
    return true
  }

  /**
   * 獲取成本分析統計
   */
  getCostAnalysisStats () {
    return {
      supported_platforms: Array.from(this.pricingData.keys()),
      optimization_rules: this.optimizationRules.length,
      active_budget_alerts: Array.from(this.budgetAlerts.values()).filter(alert => alert.status === 'active').length,
      cost_history_points: this.costHistory.length,
      last_analysis: this.costHistory.length > 0 ? this.costHistory[this.costHistory.length - 1].timestamp : null
    }
  }
}

module.exports = CostAnalyzer
