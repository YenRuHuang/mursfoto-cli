const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');
const logger = require('../utils/logger');

// Redis 客戶端（可選，如果沒有 Redis 則使用記憶體存儲）
let redisClient = null;

// 初始化 Redis 連接（如果配置了 Redis）
function initializeRedis() {
  try {
    // 只有明確設定了 REDIS_HOST 才嘗試連接
    if (process.env.REDIS_HOST && process.env.REDIS_HOST !== '') {
      redisClient = new Redis({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB) || 0,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        enableOfflineQueue: false,
        reconnectOnError: null, // 不自動重連
        retryStrategy: (times) => {
          if (times > 3) {
            logger.warn('Redis 連接失敗超過 3 次，停止重試');
            return null; // 停止重試
          }
          return Math.min(times * 100, 3000);
        }
      });

      redisClient.on('connect', () => {
        logger.info('Redis 連接成功 - 速率限制將使用 Redis 存儲');
      });

      redisClient.on('error', (err) => {
        // 只記錄一次錯誤，不重複記錄
        if (redisClient) {
          logger.warn('Redis 不可用，使用記憶體存儲進行速率限制');
          redisClient.disconnect();
          redisClient = null;
        }
      });

      return redisClient;
    } else {
      logger.info('未配置 Redis，速率限制將使用記憶體存儲');
    }
  } catch (error) {
    logger.error('Redis 初始化失敗，使用記憶體存儲', { error: error.message });
  }
  
  return null;
}

// 創建 Redis Store（如果可用）
function createStore() {
  if (redisClient) {
    return new RedisStore({
      client: redisClient,
      prefix: 'rl:gateway:'
    });
  }
  return undefined; // 使用預設的記憶體存儲
}

/**
 * 創建速率限制器
 * @param {Object} options - 速率限制配置
 * @returns {Function} Express 中間件
 */
function createRateLimiter(options = {}) {
  const defaults = {
    windowMs: 15 * 60 * 1000, // 15 分鐘
    max: 100, // 預設限制每 IP 每 15 分鐘 100 次請求
    message: {
      error: '請求過於頻繁，請稍後再試',
      retryAfter: Math.ceil(options.windowMs / 1000) + '秒'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: createStore(),
    keyGenerator: (req) => {
      // 使用 IP 地址作為 key，也可以加上用戶 ID 等
      return req.ip || req.connection.remoteAddress;
    },
    skip: (req) => {
      // 跳過健康檢查端點
      return req.path === '/health' || req.path === '/';
    },
    handler: (req, res) => {
      logger.warn('速率限制觸發', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method
      });
      
      res.status(429).json({
        error: '請求過於頻繁，請稍後再試',
        retryAfter: Math.ceil((options.windowMs || 900000) / 1000) + '秒'
      });
    }
  };

  const config = { ...defaults, ...options };
  
  return rateLimit(config);
}

/**
 * 全域速率限制器
 */
const globalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: parseInt(process.env.GLOBAL_RATE_LIMIT) || 1000,
  message: {
    error: '全域請求限制已達到，請稍後再試',
    retryAfter: '15分鐘'
  }
});

/**
 * 嚴格速率限制器（用於敏感操作）
 */
const strictRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 小時
  max: 10,
  message: {
    error: '敏感操作請求過於頻繁',
    retryAfter: '1小時'
  }
});

/**
 * API 調用速率限制器
 */
const apiRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 分鐘
  max: 60,
  message: {
    error: 'API 調用過於頻繁',
    retryAfter: '1分鐘'
  }
});

/**
 * 管理員 API 速率限制器
 */
const adminRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 100,
  message: {
    error: '管理員 API 請求過於頻繁',
    retryAfter: '15分鐘'
  }
});

/**
 * 進階速率限制器 - 基於用戶類型的動態限制
 */
function createAdvancedRateLimiter(options = {}) {
  return async (req, res, next) => {
    try {
      // 檢查用戶類型和等級
      const userType = req.user?.type || 'guest';
      const isPremium = req.user?.isPremium || false;
      
      // 根據用戶類型調整限制
      let limits = {
        guest: { windowMs: 15 * 60 * 1000, max: 50 },
        user: { windowMs: 15 * 60 * 1000, max: 200 },
        premium: { windowMs: 15 * 60 * 1000, max: 500 },
        admin: { windowMs: 15 * 60 * 1000, max: 1000 }
      };

      const userLimits = limits[userType] || limits.guest;
      
      // 高級用戶額外加成
      if (isPremium) {
        userLimits.max = Math.floor(userLimits.max * 1.5);
      }

      // 創建動態限制器
      const dynamicLimiter = createRateLimiter({
        ...userLimits,
        ...options,
        keyGenerator: (req) => {
          // 組合 IP 和用戶 ID 作為 key
          const userId = req.user?.id || 'anonymous';
          return `${req.ip}:${userId}`;
        }
      });

      return dynamicLimiter(req, res, next);
    } catch (error) {
      logger.error('進階速率限制器錯誤', { error: error.message });
      // 出錯時使用基本限制器
      return apiRateLimiter(req, res, next);
    }
  };
}

/**
 * IP 白名單中間件
 */
function createWhitelistMiddleware(whitelist = []) {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // 檢查是否在白名單中
    const isWhitelisted = whitelist.some(ip => {
      if (ip.includes('/')) {
        // CIDR 表示法支持（簡化版）
        return clientIP.startsWith(ip.split('/')[0]);
      }
      return ip === clientIP;
    });

    if (isWhitelisted) {
      logger.info('IP 在白名單中，跳過速率限制', { ip: clientIP });
      return next();
    }

    next();
  };
}

/**
 * 可疑活動檢測中間件
 */
function createSuspiciousActivityDetector() {
  const suspiciousPatterns = new Map();
  
  return (req, res, next) => {
    const clientIP = req.ip;
    const userAgent = req.get('User-Agent');
    const path = req.path;
    
    // 檢測可疑模式
    const key = `${clientIP}:${userAgent}`;
    const now = Date.now();
    
    if (!suspiciousPatterns.has(key)) {
      suspiciousPatterns.set(key, {
        requests: [],
        lastCleanup: now
      });
    }
    
    const pattern = suspiciousPatterns.get(key);
    pattern.requests.push({ path, timestamp: now });
    
    // 清理舊記錄（超過 5 分鐘）
    if (now - pattern.lastCleanup > 5 * 60 * 1000) {
      pattern.requests = pattern.requests.filter(r => now - r.timestamp < 5 * 60 * 1000);
      pattern.lastCleanup = now;
    }
    
    // 檢測異常行為
    const recentRequests = pattern.requests.filter(r => now - r.timestamp < 1 * 60 * 1000);
    
    if (recentRequests.length > 100) {
      logger.warn('檢測到可疑活動 - 過於頻繁的請求', {
        ip: clientIP,
        userAgent,
        requestCount: recentRequests.length
      });
      
      // 觸發安全監控
      if (req.securityMonitor) {
        req.securityMonitor.reportSuspiciousActivity('excessive_requests', {
          ip: clientIP,
          userAgent,
          requestCount: recentRequests.length,
          paths: recentRequests.map(r => r.path)
        });
      }
    }
    
    next();
  };
}

// 初始化 Redis（如果配置了）
initializeRedis();

module.exports = {
  createRateLimiter,
  globalRateLimiter,
  strictRateLimiter,
  apiRateLimiter,
  adminRateLimiter,
  createAdvancedRateLimiter,
  createWhitelistMiddleware,
  createSuspiciousActivityDetector,
  initializeRedis,
  redisClient
};
