const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const logger = require('../utils/logger');

const router = express.Router();

// API 代理配置
const API_CONFIGS = {
  'tw-life-formula': {
    baseURL: process.env.TW_LIFE_FORMULA_URL || 'http://localhost:3001',
    headers: {
      'content-type': 'application/json',
    },
    rateLimits: {
      windowMs: 1 * 60 * 1000, // 1 分鐘
      max: 200 // 每分鐘 200 次請求（內部服務）
    },
    healthCheck: '/health'
  },
  claude: {
    baseURL: 'https://api.anthropic.com',
    headers: {
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    keyHeader: 'x-api-key',
    envKey: 'ANTHROPIC_API_KEY',
    rateLimits: {
      windowMs: 1 * 60 * 1000, // 1 分鐘
      max: 50 // 每分鐘 50 次請求
    }
  },
  gemini: {
    baseURL: 'https://generativelanguage.googleapis.com',
    headers: {
      'content-type': 'application/json',
    },
    keyHeader: 'x-goog-api-key',
    envKey: 'GEMINI_API_KEY',
    rateLimits: {
      windowMs: 1 * 60 * 1000, // 1 分鐘
      max: 60 // 每分鐘 60 次請求
    }
  },
  stripe: {
    baseURL: 'https://api.stripe.com',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    keyHeader: 'authorization',
    envKey: 'STRIPE_SECRET_KEY',
    rateLimits: {
      windowMs: 1 * 60 * 1000, // 1 分鐘
      max: 100 // 每分鐘 100 次請求
    }
  }
};

// 為每個 API 創建速率限制器
const rateLimiters = {};
Object.keys(API_CONFIGS).forEach(apiName => {
  const config = API_CONFIGS[apiName];
  rateLimiters[apiName] = rateLimit({
    ...config.rateLimits,
    message: {
      error: `${apiName.toUpperCase()} API 請求過於頻繁`,
      retryAfter: Math.ceil(config.rateLimits.windowMs / 1000) + '秒'
    }
  });
});

// 請求重試配置
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 秒
  retryCondition: (error) => {
    // 重試條件：網路錯誤或 5xx 狀態碼
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  }
};

/**
 * 延遲函數
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 重試包裝器
 */
async function withRetry(asyncFn, config = RETRY_CONFIG) {
  let lastError;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await asyncFn();
    } catch (error) {
      lastError = error;
      
      if (attempt === config.maxRetries || !config.retryCondition(error)) {
        throw error;
      }
      
      const delayTime = config.retryDelay * Math.pow(2, attempt); // 指數退避
      logger.warn(`代理請求失敗，${delayTime}ms 後進行第 ${attempt + 1} 次重試`, {
        error: error.message,
        attempt: attempt + 1,
        maxRetries: config.maxRetries
      });
      
      await delay(delayTime);
    }
  }
  
  throw lastError;
}

/**
 * 獲取 API 密鑰
 */
function getApiKey(apiName) {
  const config = API_CONFIGS[apiName];
  const apiKey = process.env[config.envKey];
  
  if (!apiKey) {
    throw new Error(`缺少 ${apiName.toUpperCase()} API 密鑰`);
  }
  
  return apiKey;
}

/**
 * 準備請求標頭
 */
function prepareHeaders(apiName, originalHeaders) {
  const config = API_CONFIGS[apiName];
  
  // 合併基本標頭
  const headers = {
    ...config.headers,
    ...originalHeaders
  };
  
  // 移除敏感標頭
  delete headers['host'];
  delete headers['connection'];
  delete headers['content-length'];
  
  // 只有外部 API 才需要設置密鑰
  if (config.envKey) {
    const apiKey = getApiKey(apiName);
    
    // 設置 API 密鑰
    if (apiName === 'stripe') {
      headers[config.keyHeader] = `Bearer ${apiKey}`;
    } else {
      headers[config.keyHeader] = apiKey;
    }
  }
  
  return headers;
}

/**
 * 轉換請求路徑
 */
function transformPath(apiName, originalPath) {
  // 移除 API 名稱前綴
  const cleanPath = originalPath.replace(`/api/${apiName}`, '');
  
  switch (apiName) {
    case 'claude':
      return cleanPath.startsWith('/v1') ? cleanPath : `/v1${cleanPath}`;
    case 'gemini':
      return cleanPath.startsWith('/v1beta') ? cleanPath : `/v1beta${cleanPath}`;
    case 'stripe':
      return cleanPath.startsWith('/v1') ? cleanPath : `/v1${cleanPath}`;
    default:
      return cleanPath;
  }
}

/**
 * 過濾回應數據（移除敏感信息）
 */
function filterResponseData(data, apiName) {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  // 創建深拷貝
  const filtered = JSON.parse(JSON.stringify(data));
  
  // 移除可能包含敏感信息的欄位
  const sensitiveFields = ['api_key', 'secret', 'token', 'password', 'private_key'];
  
  function removeSensitiveFields(obj) {
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          obj[key] = '[FILTERED]';
        } else if (typeof obj[key] === 'object') {
          removeSensitiveFields(obj[key]);
        }
      }
    }
  }
  
  removeSensitiveFields(filtered);
  return filtered;
}

// 通用代理中間件
async function proxyRequest(req, res, apiName) {
  const startTime = Date.now();
  
  try {
    const config = API_CONFIGS[apiName];
    const targetPath = transformPath(apiName, req.path);
    const targetURL = `${config.baseURL}${targetPath}`;
    
    // 準備請求配置
    const requestConfig = {
      method: req.method,
      url: targetURL,
      headers: prepareHeaders(apiName, req.headers),
      timeout: 30000, // 30 秒超時
    };
    
    // 添加請求體（如果有）
    if (['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase())) {
      requestConfig.data = req.body;
    }
    
    // 添加查詢參數
    if (Object.keys(req.query).length > 0) {
      requestConfig.params = req.query;
    }
    
    logger.info(`代理請求到 ${apiName.toUpperCase()} API`, {
      method: req.method,
      path: targetPath,
      query: req.query,
      ip: req.ip
    });
    
    // 執行帶重試的請求
    const response = await withRetry(async () => {
      return await axios(requestConfig);
    });
    
    const duration = Date.now() - startTime;
    
    // 記錄成功的請求
    logger.info(`${apiName.toUpperCase()} API 請求成功`, {
      status: response.status,
      duration: `${duration}ms`,
      dataSize: JSON.stringify(response.data).length
    });
    
    // 過濾並返回回應
    const filteredData = filterResponseData(response.data, apiName);
    
    // 設置回應標頭
    res.set({
      'Content-Type': response.headers['content-type'] || 'application/json',
      'X-API-Source': apiName.toUpperCase(),
      'X-Response-Time': `${duration}ms`
    });
    
    res.status(response.status).json(filteredData);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error(`${apiName.toUpperCase()} API 請求失敗`, {
      error: error.message,
      status: error.response?.status,
      duration: `${duration}ms`,
      ip: req.ip
    });
    
    // 處理不同類型的錯誤
    if (error.response) {
      // API 返回錯誤回應
      const filteredError = filterResponseData(error.response.data, apiName);
      res.status(error.response.status).json({
        error: filteredError,
        source: apiName.toUpperCase(),
        duration: `${duration}ms`
      });
    } else if (error.request) {
      // 網路錯誤
      res.status(503).json({
        error: `${apiName.toUpperCase()} API 服務暫時不可用`,
        code: 'SERVICE_UNAVAILABLE',
        duration: `${duration}ms`
      });
    } else {
      // 其他錯誤
      res.status(500).json({
        error: '代理請求處理失敗',
        code: 'PROXY_ERROR',
        duration: `${duration}ms`
      });
    }
  }
}

// tw-life-formula 代理路由
router.use('/tw-life-formula', rateLimiters['tw-life-formula']);
router.all('/tw-life-formula/*', async (req, res) => {
  await proxyRequest(req, res, 'tw-life-formula');
});

// Claude API 代理路由
router.use('/claude', rateLimiters.claude);
router.all('/claude/*', async (req, res) => {
  await proxyRequest(req, res, 'claude');
});

// Gemini API 代理路由  
router.use('/gemini', rateLimiters.gemini);
router.all('/gemini/*', async (req, res) => {
  await proxyRequest(req, res, 'gemini');
});

// Stripe API 代理路由
router.use('/stripe', rateLimiters.stripe);
router.all('/stripe/*', async (req, res) => {
  await proxyRequest(req, res, 'stripe');
});

// API 狀態檢查
router.get('/status', async (req, res) => {
  const status = {};
  
  for (const apiName of Object.keys(API_CONFIGS)) {
    const config = API_CONFIGS[apiName];
    
    if (config.envKey) {
      // 外部 API，需要檢查密鑰
      try {
        const apiKey = getApiKey(apiName);
        status[apiName] = {
          configured: true,
          hasKey: !!apiKey,
          keyLength: apiKey ? apiKey.length : 0,
          type: 'external'
        };
      } catch (error) {
        status[apiName] = {
          configured: false,
          hasKey: false,
          error: error.message,
          type: 'external'
        };
      }
    } else {
      // 內部服務，檢查 baseURL
      status[apiName] = {
        configured: true,
        baseURL: config.baseURL,
        type: 'internal',
        healthCheck: config.healthCheck || '/health'
      };
    }
  }
  
  res.json({
    timestamp: new Date().toISOString(),
    apis: status
  });
});

// 支援的 API 列表
router.get('/', (req, res) => {
  res.json({
    message: 'Mursfoto API Gateway - 代理服務',
    supportedAPIs: Object.keys(API_CONFIGS),
    endpoints: {
      'tw-life-formula': '/api/tw-life-formula/*',
      claude: '/api/claude/*',
      gemini: '/api/gemini/*',
      stripe: '/api/stripe/*',
      status: '/api/status'
    },
    rateLimits: Object.keys(API_CONFIGS).reduce((acc, apiName) => {
      acc[apiName] = API_CONFIGS[apiName].rateLimits;
      return acc;
    }, {})
  });
});

module.exports = router;
