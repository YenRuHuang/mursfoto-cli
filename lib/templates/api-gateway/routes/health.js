const express = require('express');
const axios = require('axios');
const logger = require('../utils/logger');

const router = express.Router();

// 系統啟動時間
const startTime = Date.now();

// 健康檢查狀態快取
let healthCache = {
  lastCheck: 0,
  results: {},
  cacheDuration: 30000 // 30 秒快取
};

/**
 * 檢查外部 API 服務健康狀態
 */
async function checkExternalAPIs() {
  const apis = {
    claude: {
      url: 'https://api.anthropic.com/v1/messages',
      method: 'POST',
      headers: {
        'anthropic-version': '2023-06-01'
      },
      timeout: 5000
    },
    gemini: {
      url: 'https://generativelanguage.googleapis.com/v1beta/models',
      method: 'GET',
      timeout: 5000
    },
    stripe: {
      url: 'https://api.stripe.com/v1/account',
      method: 'GET',
      timeout: 5000
    }
  };

  const results = {};

  for (const [apiName, config] of Object.entries(apis)) {
    try {
      const startTime = Date.now();
      
      // 準備請求配置
      const requestConfig = {
        method: config.method,
        url: config.url,
        timeout: config.timeout,
        validateStatus: () => true, // 接受所有狀態碼
      };

      // 添加必要的標頭
      if (config.headers) {
        requestConfig.headers = { ...config.headers };
      }

      // 添加 API 密鑰（如果有配置）
      const apiKey = getApiKey(apiName);
      if (apiKey) {
        if (apiName === 'claude') {
          requestConfig.headers = requestConfig.headers || {};
          requestConfig.headers['x-api-key'] = apiKey;
        } else if (apiName === 'gemini') {
          requestConfig.params = { key: apiKey };
        } else if (apiName === 'stripe') {
          requestConfig.headers = requestConfig.headers || {};
          requestConfig.headers['Authorization'] = `Bearer ${apiKey}`;
        }
      }

      const response = await axios(requestConfig);
      const responseTime = Date.now() - startTime;

      results[apiName] = {
        status: 'healthy',
        responseTime: responseTime,
        statusCode: response.status,
        available: response.status < 500
      };

    } catch (error) {
      results[apiName] = {
        status: 'unhealthy',
        error: error.message,
        responseTime: error.response ? Date.now() - startTime : null,
        statusCode: error.response?.status || null,
        available: false
      };
    }
  }

  return results;
}

/**
 * 獲取 API 密鑰
 */
function getApiKey(apiName) {
  const keyMap = {
    claude: process.env.ANTHROPIC_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    stripe: process.env.STRIPE_SECRET_KEY
  };
  
  return keyMap[apiName];
}

/**
 * 檢查系統資源使用情況
 */
function getSystemStats() {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  return {
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
      heapUsagePercentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    uptime: process.uptime(),
    version: process.version,
    platform: process.platform,
    arch: process.arch
  };
}

/**
 * 基本健康檢查端點
 */
router.get('/', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };
  
  res.status(200).json(health);
});

/**
 * 詳細的健康檢查端點
 */
router.get('/detailed', async (req, res) => {
  try {
    const now = Date.now();
    
    // 檢查快取是否仍然有效
    let externalAPIs = {};
    if (now - healthCache.lastCheck > healthCache.cacheDuration) {
      if (process.env.EXTERNAL_API_HEALTH_CHECK !== 'false') {
        externalAPIs = await checkExternalAPIs();
      }
      healthCache.results = externalAPIs;
      healthCache.lastCheck = now;
    } else {
      externalAPIs = healthCache.results;
    }
    
    const systemStats = getSystemStats();
    
    // 判斷整體健康狀態
    const hasUnhealthyAPIs = Object.values(externalAPIs).some(api => !api.available);
    const hasMemoryIssue = systemStats.memory.heapUsagePercentage > 90;
    
    let overallStatus = 'healthy';
    if (hasUnhealthyAPIs || hasMemoryIssue) {
      overallStatus = 'degraded';
    }
    
    const health = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      system: systemStats,
      externalAPIs: externalAPIs,
      features: {
        rateLimiting: true,
        cors: true,
        logging: true,
        errorTracking: !!process.env.SENTRY_DSN,
        securityMonitoring: true,
        tokenManagement: true,
        apiProxy: true
      }
    };
    
    const statusCode = overallStatus === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
    
  } catch (error) {
    logger.error('詳細健康檢查失敗', { error: error.message });
    
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: '健康檢查服務暫時不可用',
      message: error.message
    });
  }
});

/**
 * 就緒檢查端點（Kubernetes/Docker）
 */
router.get('/ready', async (req, res) => {
  try {
    // 檢查服務是否準備好接受請求
    const checks = [];
    
    // 檢查必要的環境變數
    const requiredVars = ['JWT_SECRET', 'ADMIN_API_KEY'];
    const missingVars = requiredVars.filter(v => !process.env[v]);
    
    if (missingVars.length > 0) {
      checks.push({
        name: 'environment',
        status: 'fail',
        message: `缺少必要環境變數: ${missingVars.join(', ')}`
      });
    } else {
      checks.push({
        name: 'environment',
        status: 'pass',
        message: '所有必要環境變數已配置'
      });
    }
    
    const allPassed = checks.every(check => check.status === 'pass');
    const status = allPassed ? 'ready' : 'not_ready';
    const statusCode = allPassed ? 200 : 503;
    
    res.status(statusCode).json({
      status: status,
      timestamp: new Date().toISOString(),
      checks: checks
    });
    
  } catch (error) {
    logger.error('就緒檢查失敗', { error: error.message });
    
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

module.exports = router;
