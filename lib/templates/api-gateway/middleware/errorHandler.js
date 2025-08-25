const logger = require('../utils/logger');
const { captureError } = require('../security/SentryIntegration');

/**
 * 統一錯誤處理中間件
 */
function errorHandler(err, req, res, next) {
  // 如果響應已經發送，交給 Express 默認處理
  if (res.headersSent) {
    return next(err);
  }

  // 獲取錯誤資訊
  const errorInfo = parseError(err);
  
  // 記錄錯誤
  logError(err, req, errorInfo);
  
  // 向 Sentry 報告錯誤 (除非是預期的業務錯誤)
  if (errorInfo.statusCode >= 500) {
    captureError(err, {
      tags: {
        error_type: errorInfo.type,
        status_code: errorInfo.statusCode,
        endpoint: req.originalUrl
      },
      extra: {
        request: {
          method: req.method,
          url: req.originalUrl,
          headers: sanitizeHeaders(req.headers),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        },
        tokenInfo: req.tokenInfo ? {
          id: req.tokenInfo.id,
          decoded: req.tokenInfo.decoded
        } : null
      }
    });
  }

  // 回傳錯誤響應
  res.status(errorInfo.statusCode).json({
    error: {
      type: errorInfo.type,
      message: errorInfo.message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: errorInfo.details
      }),
      timestamp: new Date().toISOString(),
      requestId: req.id || generateRequestId()
    }
  });
}

/**
 * 解析錯誤資訊
 */
function parseError(err) {
  // JWT 錯誤
  if (err.name === 'JsonWebTokenError') {
    return {
      type: 'authentication_error',
      message: 'Invalid access token',
      statusCode: 401,
      details: null
    };
  }

  if (err.name === 'TokenExpiredError') {
    return {
      type: 'authentication_error',
      message: 'Access token has expired',
      statusCode: 401,
      details: { expiredAt: err.expiredAt }
    };
  }

  // 驗證錯誤
  if (err.name === 'ValidationError') {
    return {
      type: 'validation_error',
      message: 'Request validation failed',
      statusCode: 400,
      details: extractValidationDetails(err)
    };
  }

  // 頻率限制錯誤
  if (err.type === 'RateLimitError') {
    return {
      type: 'rate_limit_error',
      message: 'Too many requests',
      statusCode: 429,
      details: {
        retryAfter: err.retryAfter,
        limit: err.limit,
        current: err.current
      }
    };
  }

  // API 代理錯誤
  if (err.name === 'ProxyError') {
    return {
      type: 'proxy_error',
      message: 'External API request failed',
      statusCode: err.statusCode || 502,
      details: {
        target: err.target,
        originalError: err.originalError?.message
      }
    };
  }

  // 網路錯誤
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    return {
      type: 'network_error',
      message: 'Service temporarily unavailable',
      statusCode: 503,
      details: {
        code: err.code,
        hostname: err.hostname,
        port: err.port
      }
    };
  }

  // 超時錯誤
  if (err.code === 'ETIMEDOUT' || err.timeout) {
    return {
      type: 'timeout_error',
      message: 'Request timeout',
      statusCode: 504,
      details: {
        timeout: err.timeout
      }
    };
  }

  // 權限錯誤
  if (err.name === 'UnauthorizedError' || err.status === 403) {
    return {
      type: 'authorization_error',
      message: 'Insufficient permissions',
      statusCode: 403,
      details: null
    };
  }

  // 資源不存在
  if (err.status === 404) {
    return {
      type: 'not_found_error',
      message: 'Resource not found',
      statusCode: 404,
      details: null
    };
  }

  // 請求實體過大
  if (err.type === 'entity.too.large') {
    return {
      type: 'payload_too_large',
      message: 'Request payload too large',
      statusCode: 413,
      details: {
        limit: err.limit,
        length: err.length
      }
    };
  }

  // 語法錯誤 (JSON 解析等)
  if (err.type === 'entity.parse.failed' || err.name === 'SyntaxError') {
    return {
      type: 'syntax_error',
      message: 'Invalid request format',
      statusCode: 400,
      details: null
    };
  }

  // 自定義業務錯誤
  if (err.isOperational || err.statusCode) {
    return {
      type: err.type || 'business_error',
      message: err.message || 'Business logic error',
      statusCode: err.statusCode || 400,
      details: err.details || null
    };
  }

  // 預設為內部服務器錯誤
  return {
    type: 'internal_error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message || 'Unknown error occurred',
    statusCode: 500,
    details: process.env.NODE_ENV === 'development' ? {
      name: err.name,
      message: err.message,
      stack: err.stack?.split('\n').slice(0, 10) // 限制堆疊追蹤長度
    } : null
  };
}

/**
 * 提取驗證錯誤詳細資訊
 */
function extractValidationDetails(err) {
  if (err.details && Array.isArray(err.details)) {
    // Joi 驗證錯誤
    return err.details.map(detail => ({
      field: detail.path?.join('.'),
      message: detail.message,
      type: detail.type
    }));
  }

  if (err.errors && typeof err.errors === 'object') {
    // Mongoose 驗證錯誤
    return Object.keys(err.errors).map(field => ({
      field,
      message: err.errors[field].message,
      type: err.errors[field].kind
    }));
  }

  return null;
}

/**
 * 記錄錯誤日誌
 */
function logError(err, req, errorInfo) {
  const logContext = {
    error: {
      type: errorInfo.type,
      message: err.message,
      stack: err.stack,
      statusCode: errorInfo.statusCode
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      tokenId: req.tokenInfo?.id
    },
    timestamp: new Date().toISOString()
  };

  // 根據錯誤嚴重程度選擇日誌等級
  if (errorInfo.statusCode >= 500) {
    logger.error('服務器錯誤:', logContext);
  } else if (errorInfo.statusCode >= 400) {
    logger.warn('客戶端錯誤:', logContext);
  } else {
    logger.info('請求處理錯誤:', logContext);
  }
}

/**
 * 清理請求頭中的敏感資訊
 */
function sanitizeHeaders(headers) {
  const sensitiveHeaders = [
    'authorization', 'cookie', 'x-api-key', 'x-auth-token'
  ];

  const sanitized = { ...headers };
  
  for (const header of sensitiveHeaders) {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * 生成請求 ID
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 自定義錯誤類別
 */
class ApiError extends Error {
  constructor(message, statusCode = 500, type = 'api_error', details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.type = type;
    this.details = details;
    this.isOperational = true; // 標記為業務錯誤
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends ApiError {
  constructor(message, details = null) {
    super(message, 400, 'validation_error', details);
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends ApiError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'authentication_error');
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends ApiError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'authorization_error');
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'not_found_error');
    this.name = 'NotFoundError';
  }
}

class ProxyError extends ApiError {
  constructor(message, target, originalError = null, statusCode = 502) {
    super(message, statusCode, 'proxy_error', { target, originalError });
    this.name = 'ProxyError';
    this.target = target;
    this.originalError = originalError;
  }
}

/**
 * 404 錯誤處理中間件
 */
function notFoundHandler(req, res, next) {
  const error = new NotFoundError(`Cannot ${req.method} ${req.originalUrl}`);
  next(error);
}

/**
 * 非同步錯誤捕獲包裝器
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    const result = fn(req, res, next);
    
    if (result && typeof result.catch === 'function') {
      result.catch(next);
    }
  };
}

/**
 * 全域未捕獲錯誤處理
 */
function setupGlobalErrorHandlers() {
  // 未捕獲的異常
  process.on('uncaughtException', (err) => {
    logger.error('未捕獲的異常:', err);
    
    captureError(err, {
      tags: { error_type: 'uncaught_exception' }
    });
    
    // 優雅關閉
    process.exit(1);
  });

  // 未處理的 Promise 拒絕
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('未處理的 Promise 拒絕:', { reason, promise });
    
    captureError(new Error(reason), {
      tags: { error_type: 'unhandled_rejection' },
      extra: { promise: promise.toString() }
    });
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  setupGlobalErrorHandlers,
  
  // 自定義錯誤類別
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ProxyError
};
