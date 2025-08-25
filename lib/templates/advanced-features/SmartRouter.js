/**
 * 🧠 Mursfoto 智能路由系統
 * 基於 PixelForge Studio 的 SmartRouter 最佳實踐
 * 
 * 功能特色：
 * ✅ 動態負載平衡
 * ✅ 成本感知路由
 * ✅ 用戶等級管理
 * ✅ 自動故障轉移
 * ✅ 效能監控整合
 */
class MursfotoSmartRouter {
  constructor(options = {}) {
    this.serviceName = options.serviceName || 'mursfoto-smart-router';
    this.logger = options.logger || console;
    
    // 路由目標配置
    this.routeTargets = {
      primary: {
        name: 'Primary Service',
        url: process.env.PRIMARY_SERVICE_URL || 'http://localhost:3000',
        maxLoad: 100,
        currentLoad: 0,
        responseTime: 0,
        errorRate: 0,
        cost: 0.001,  // 成本/請求
        isHealthy: true
      },
      secondary: {
        name: 'Secondary Service', 
        url: process.env.SECONDARY_SERVICE_URL || 'http://localhost:3001',
        maxLoad: 50,
        currentLoad: 0,
        responseTime: 0,
        errorRate: 0,
        cost: 0.002,
        isHealthy: true
      },
      external: {
        name: 'External API',
        url: process.env.EXTERNAL_API_URL,
        maxLoad: 1000,
        currentLoad: 0,
        responseTime: 0,
        errorRate: 0,
        cost: 0.05,  // 外部API成本較高
        isHealthy: true
      }
    };

    // 負載平衡閾值
    this.loadThresholds = {
      cpu: options.cpuThreshold || 80,
      memory: options.memoryThreshold || 85,
      responseTime: options.responseTimeThreshold || 2000,
      errorRate: options.errorRateThreshold || 0.05
    };

    // 用戶等級配置
    this.userTiers = {
      free: {
        maxConcurrentRequests: 5,
        maxRequestsPerHour: 100,
        allowPremiumRoutes: false,
        priority: 1,
        quotaCost: 0.001
      },
      basic: {
        maxConcurrentRequests: 10,
        maxRequestsPerHour: 1000,
        allowPremiumRoutes: false,
        priority: 2,
        quotaCost: 0.002
      },
      premium: {
        maxConcurrentRequests: 50,
        maxRequestsPerHour: 10000,
        allowPremiumRoutes: true,
        priority: 3,
        quotaCost: 0.005
      },
      enterprise: {
        maxConcurrentRequests: 200,
        maxRequestsPerHour: 100000,
        allowPremiumRoutes: true,
        priority: 4,
        quotaCost: 0.01
      }
    };

    // 路由統計
    this.routingStats = {
      totalRequests: 0,
      routedToPrimary: 0,
      routedToSecondary: 0,
      routedToExternal: 0,
      totalCost: 0,
      avgResponseTime: 0,
      lastReset: Date.now()
    };

    // 用戶會話追蹤
    this.userSessions = new Map();
    
    // 健康檢查間隔
    this.healthCheckInterval = null;
    this.startHealthChecks();
  }

  /**
   * 🎯 智能路由決策
   */
  async route(request, userTier = 'free') {
    const startTime = Date.now();
    this.routingStats.totalRequests++;

    try {
      // 檢查用戶配額
      const quotaCheck = this.checkUserQuota(request.userId, userTier);
      if (!quotaCheck.allowed) {
        return this.createErrorResponse(429, 'Quota exceeded', quotaCheck);
      }

      // 分析請求特性
      const requestProfile = this.analyzeRequest(request);
      
      // 選擇最佳路由
      const selectedTarget = this.selectOptimalRoute(requestProfile, userTier);
      
      if (!selectedTarget) {
        return this.createErrorResponse(503, 'No healthy routes available');
      }

      // 執行路由
      const response = await this.executeRoute(selectedTarget, request, startTime);
      
      // 更新統計和負載信息
      this.updateRouteStats(selectedTarget.name, response, startTime);
      this.updateUserSession(request.userId, userTier);
      
      return response;

    } catch (error) {
      this.logger.error('路由執行失敗:', error);
      return this.createErrorResponse(500, 'Internal routing error', { error: error.message });
    }
  }

  /**
   * 📊 分析請求特性
   */
  analyzeRequest(request) {
    return {
      size: this.estimateRequestSize(request),
      complexity: this.estimateComplexity(request),
      priority: request.priority || 'normal',
      requiresGPU: request.requiresGPU || false,
      expectedDuration: request.expectedDuration || 1000,
      cacheability: request.cacheable !== false
    };
  }

  /**
   * 🎯 選擇最佳路由
   */
  selectOptimalRoute(requestProfile, userTier) {
    const userConfig = this.userTiers[userTier];
    const availableTargets = this.getAvailableTargets(userConfig);
    
    if (availableTargets.length === 0) {
      return null;
    }

    // 計算每個目標的評分
    const scores = availableTargets.map(target => ({
      target,
      score: this.calculateRouteScore(target, requestProfile, userConfig)
    }));

    // 按評分排序，選擇最佳
    scores.sort((a, b) => b.score - a.score);
    
    const selected = scores[0].target;
    this.logger.debug(`路由選擇: ${selected.name} (評分: ${scores[0].score.toFixed(2)})`);
    
    return selected;
  }

  /**
   * 🧮 計算路由評分
   */
  calculateRouteScore(target, requestProfile, userConfig) {
    let score = 100; // 基礎分數

    // 負載因素 (負載越低分數越高)
    const loadFactor = target.currentLoad / target.maxLoad;
    score -= loadFactor * 30;

    // 響應時間因素
    const responseTimeFactor = Math.min(target.responseTime / 1000, 5); // 最多扣5分
    score -= responseTimeFactor * 10;

    // 錯誤率因素
    score -= target.errorRate * 100; // 錯誤率直接扣分

    // 成本因素 (根據用戶等級調整權重)
    const costWeight = userConfig.priority > 2 ? 0.5 : 2; // 高級用戶對成本不太敏感
    score -= target.cost * 1000 * costWeight;

    // 健康狀態
    if (!target.isHealthy) {
      score -= 50;
    }

    // 特殊需求匹配
    if (requestProfile.requiresGPU && target.name === 'Primary Service') {
      score += 20; // 假設主服務有GPU
    }

    // 優先級加成
    if (requestProfile.priority === 'high' && userConfig.priority > 2) {
      score += 10;
    }

    return Math.max(0, score);
  }

  /**
   * 🔄 執行路由
   */
  async executeRoute(target, request, startTime) {
    target.currentLoad++;

    try {
      // 這裡應該實現實際的HTTP請求轉發
      // 以下為模擬實現
      const response = await this.forwardRequest(target.url, request);
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        data: response.data,
        metadata: {
          routedTo: target.name,
          duration: `${duration}ms`,
          cost: target.cost,
          requestId: request.requestId
        }
      };

    } catch (error) {
      // 故障轉移邏輯
      return this.handleRouteFailure(target, request, error, startTime);
      
    } finally {
      target.currentLoad = Math.max(0, target.currentLoad - 1);
    }
  }

  /**
   * 🔄 故障轉移處理
   */
  async handleRouteFailure(failedTarget, request, error, startTime) {
    this.logger.warn(`路由失敗 ${failedTarget.name}:`, error.message);
    
    // 標記目標不健康
    failedTarget.isHealthy = false;
    failedTarget.errorRate += 0.01;

    // 嘗試故障轉移
    const userTier = this.getUserTier(request.userId);
    const alternativeTarget = this.selectOptimalRoute(
      this.analyzeRequest(request), 
      userTier
    );

    if (alternativeTarget && alternativeTarget !== failedTarget) {
      this.logger.info(`故障轉移: ${failedTarget.name} → ${alternativeTarget.name}`);
      return this.executeRoute(alternativeTarget, request, startTime);
    }

    return this.createErrorResponse(503, 'All routes failed', {
      originalError: error.message,
      failedTarget: failedTarget.name
    });
  }

  /**
   * 👤 檢查用戶配額
   */
  checkUserQuota(userId, userTier) {
    if (!userId) {
      return { allowed: true, remaining: Infinity };
    }

    const userConfig = this.userTiers[userTier];
    const now = Date.now();
    const hourStart = new Date(now).setMinutes(0, 0, 0);
    
    let userSession = this.userSessions.get(userId);
    if (!userSession || userSession.hourStart !== hourStart) {
      userSession = {
        hourStart,
        requestCount: 0,
        concurrentRequests: 0,
        totalCost: 0
      };
      this.userSessions.set(userId, userSession);
    }

    const allowed = userSession.requestCount < userConfig.maxRequestsPerHour &&
                   userSession.concurrentRequests < userConfig.maxConcurrentRequests;

    return {
      allowed,
      remaining: userConfig.maxRequestsPerHour - userSession.requestCount,
      userTier,
      resetTime: new Date(hourStart + 3600000).toISOString()
    };
  }

  /**
   * 💓 健康檢查
   */
  startHealthChecks() {
    this.healthCheckInterval = setInterval(async () => {
      for (const [name, target] of Object.entries(this.routeTargets)) {
        try {
          const startTime = Date.now();
          await this.pingTarget(target);
          const responseTime = Date.now() - startTime;
          
          target.responseTime = responseTime;
          target.isHealthy = responseTime < this.loadThresholds.responseTime;
          target.errorRate = Math.max(0, target.errorRate - 0.001); // 逐漸恢復
          
        } catch (error) {
          target.isHealthy = false;
          target.errorRate = Math.min(1, target.errorRate + 0.01);
          this.logger.warn(`健康檢查失敗 ${name}:`, error.message);
        }
      }
    }, 30000); // 每30秒檢查一次
  }

  /**
   * 📊 取得路由統計
   */
  getRoutingStats() {
    const uptime = Date.now() - this.routingStats.lastReset;
    
    return {
      ...this.routingStats,
      uptime: Math.round(uptime / 1000),
      requestsPerSecond: Math.round(this.routingStats.totalRequests / (uptime / 1000) * 100) / 100,
      averageCostPerRequest: this.routingStats.totalRequests > 0 ? 
        this.routingStats.totalCost / this.routingStats.totalRequests : 0,
      routeHealth: Object.entries(this.routeTargets).map(([name, target]) => ({
        name,
        isHealthy: target.isHealthy,
        currentLoad: target.currentLoad,
        responseTime: target.responseTime,
        errorRate: Math.round(target.errorRate * 10000) / 100
      })),
      timestamp: new Date().toISOString()
    };
  }

  // ==================== 輔助方法 ====================

  getAvailableTargets(userConfig) {
    return Object.values(this.routeTargets).filter(target => {
      if (!target.isHealthy) return false;
      if (target.currentLoad >= target.maxLoad) return false;
      
      // 檢查用戶權限
      if (target.name === 'External API' && !userConfig.allowPremiumRoutes) {
        return false;
      }
      
      return true;
    });
  }

  updateRouteStats(targetName, response, startTime) {
    const duration = Date.now() - startTime;
    
    if (targetName.includes('Primary')) {
      this.routingStats.routedToPrimary++;
    } else if (targetName.includes('Secondary')) {
      this.routingStats.routedToSecondary++;
    } else {
      this.routingStats.routedToExternal++;
    }

    this.routingStats.totalCost += response.metadata?.cost || 0;
    
    // 更新平均響應時間
    const totalTime = this.routingStats.avgResponseTime * (this.routingStats.totalRequests - 1) + duration;
    this.routingStats.avgResponseTime = Math.round(totalTime / this.routingStats.totalRequests);
  }

  updateUserSession(userId, userTier) {
    if (!userId) return;
    
    const session = this.userSessions.get(userId);
    if (session) {
      session.requestCount++;
      session.totalCost += this.userTiers[userTier].quotaCost;
    }
  }

  getUserTier(userId) {
    // 這裡應該從資料庫查詢用戶等級
    // 暫時返回預設值
    return 'free';
  }

  estimateRequestSize(request) {
    return JSON.stringify(request).length;
  }

  estimateComplexity(request) {
    // 基於請求類型估算複雜度
    const complexityFactors = {
      'image-generation': 5,
      'text-processing': 2,
      'data-query': 1
    };
    return complexityFactors[request.type] || 1;
  }

  createErrorResponse(statusCode, message, details = {}) {
    return {
      success: false,
      error: {
        code: statusCode,
        message,
        ...details
      },
      timestamp: new Date().toISOString()
    };
  }

  async forwardRequest(targetUrl, request) {
    // 實際的HTTP請求轉發邏輯
    // 這裡為示例實現
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: { message: 'Request processed successfully' }
        });
      }, Math.random() * 1000);
    });
  }

  async pingTarget(target) {
    // 實際的健康檢查邏輯
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 模擬健康檢查成功/失敗
        Math.random() > 0.1 ? resolve() : reject(new Error('Health check failed'));
      }, 100);
    });
  }

  /**
   * 🔚 停止路由器
   */
  stop() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.logger.info('Smart Router stopped');
  }
}

module.exports = MursfotoSmartRouter;