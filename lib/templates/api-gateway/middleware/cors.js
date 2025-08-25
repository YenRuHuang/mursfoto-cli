const cors = require('cors');
const logger = require('../utils/logger');

/**
 * 獲取允許的來源域名
 */
function getAllowedOrigins() {
  const origins = process.env.ALLOWED_ORIGINS;
  
  if (!origins) {
    // 開發環境預設允許的域名
    return process.env.NODE_ENV === 'development' 
      ? ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080']
      : [];
  }
  
  return origins.split(',').map(origin => origin.trim());
}

/**
 * 動態 CORS 配置
 */
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = getAllowedOrigins();
    
    // 允許沒有 origin 的請求（例如移動應用或 Postman）
    if (!origin) {
      return callback(null, true);
    }
    
    // 開發環境允許所有來源
    if (process.env.NODE_ENV === 'development') {
      logger.debug('開發環境 - 允許所有來源', { origin });
      return callback(null, true);
    }
    
    // 檢查來源是否在允許列表中
    if (allowedOrigins.includes(origin)) {
      logger.debug('允許的來源', { origin });
      return callback(null, true);
    }
    
    // 支持萬用字符匹配
    const isWildcardMatch = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        const pattern = allowedOrigin.replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(origin);
      }
      return false;
    });
    
    if (isWildcardMatch) {
      logger.debug('萬用字符匹配允許的來源', { origin });
      return callback(null, true);
    }
    
    // 記錄被拒絕的來源
    logger.warn('CORS 拒絕的來源', { 
      origin, 
      allowedOrigins,
      userAgent: 'N/A' // 在這個階段無法獲取 req 對象
    });
    
    const error = new Error(`來源 '${origin}' 不被 CORS 政策允許`);
    error.status = 403;
    callback(error);
  },
  
  // 允許的 HTTP 方法
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  
  // 允許的請求標頭
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Admin-Key',
    'X-API-Key',
    'X-Client-Version',
    'X-Request-ID',
    'User-Agent'
  ],
  
  // 暴露給前端的回應標頭
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Response-Time',
    'X-API-Source',
    'X-Request-ID'
  ],
  
  // 允許發送 cookies 和認證資訊
  credentials: true,
  
  // 預檢請求的快取時間（秒）
  maxAge: 86400, // 24 小時
  
  // 成功狀態碼
  optionsSuccessStatus: 204 // 對於舊版瀏覽器支持
};

/**
 * CORS 中間件增強版
 */
function createAdvancedCors() {
  return (req, res, next) => {
    // 記錄 CORS 請求
    if (req.method === 'OPTIONS') {
      logger.debug('CORS 預檢請求', {
        origin: req.get('Origin'),
        method: req.get('Access-Control-Request-Method'),
        headers: req.get('Access-Control-Request-Headers'),
        userAgent: req.get('User-Agent')
      });
    }
    
    // 添加自定義安全標頭
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // 根據環境設置不同的 CSP 政策
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'");
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    
    // 應用 CORS 中間件
    cors(corsOptions)(req, res, next);
  };
}

/**
 * 開發環境專用的寬鬆 CORS
 */
const developmentCors = cors({
  origin: true, // 允許所有來源
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['*']
});

/**
 * API 專用的 CORS 配置
 */
const apiCors = cors({
  origin: getAllowedOrigins(),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-API-Key',
    'X-Request-ID'
  ],
  credentials: false, // API 通常不需要 cookies
  maxAge: 3600 // 1 小時快取
});

/**
 * 管理員面板專用的 CORS 配置
 */
const adminCors = cors({
  origin: function (origin, callback) {
    // 管理員面板只允許特定域名
    const adminOrigins = process.env.ADMIN_ORIGINS 
      ? process.env.ADMIN_ORIGINS.split(',').map(o => o.trim())
      : ['http://localhost:3001', 'https://admin.yourapp.com'];
      
    if (!origin || adminOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      logger.warn('管理員 CORS 拒絕的來源', { origin });
      callback(new Error('管理員面板不允許此來源'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Admin-Key'
  ]
});

/**
 * CORS 錯誤處理中間件
 */
function corsErrorHandler(error, req, res, next) {
  if (error && error.message && error.message.includes('CORS')) {
    logger.error('CORS 錯誤', {
      error: error.message,
      origin: req.get('Origin'),
      method: req.method,
      path: req.path,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
    
    return res.status(403).json({
      error: 'CORS 政策違規',
      message: '您的來源域名不被允許存取此資源',
      code: 'CORS_POLICY_VIOLATION'
    });
  }
  
  next(error);
}

/**
 * 取得當前 CORS 配置資訊
 */
function getCorsInfo() {
  return {
    allowedOrigins: getAllowedOrigins(),
    environment: process.env.NODE_ENV,
    methods: corsOptions.methods,
    allowedHeaders: corsOptions.allowedHeaders,
    credentials: corsOptions.credentials,
    maxAge: corsOptions.maxAge
  };
}

module.exports = {
  corsOptions,
  createAdvancedCors,
  developmentCors,
  apiCors,
  adminCors,
  corsErrorHandler,
  getCorsInfo,
  getAllowedOrigins
};
