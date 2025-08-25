const Sentry = require('@sentry/node');
const logger = require('../utils/logger');

/**
 * 初始化 Sentry 錯誤追蹤
 */
function initializeSentry() {
  const dsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';
  
  if (!dsn) {
    logger.warn('⚠️  SENTRY_DSN 未設定，Sentry 錯誤追蹤將被停用');
    return false;
  }

  try {
    // 動態加載 ProfilingIntegration (僅在需要時)
    const integrations = [];
    
    if (environment === 'production') {
      try {
        const profilingModule = require('@sentry/profiling-node');
        const ProfilingIntegration = profilingModule.ProfilingIntegration || profilingModule.nodeProfilingIntegration;
        
        if (ProfilingIntegration) {
          integrations.push(new ProfilingIntegration());
          logger.info('Sentry Profiling 已啟用');
        }
      } catch (error) {
        logger.warn('Sentry Profiling 模組載入失敗，將不啟用性能分析', error.message);
      }
    }

    Sentry.init({
      dsn,
      environment,
      
      // 性能監控 - Sentry v8+ 自動包含必要的集成
      integrations,

      // 設定取樣率
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // 生產環境 10%，開發環境 100%
      profilesSampleRate: environment === 'production' ? 0.1 : 1.0,

      // 過濾敏感資料
      beforeSend(event) {
        return filterSensitiveData(event);
      },

      // 過濾 breadcrumbs
      beforeBreadcrumb(breadcrumb) {
        // 不記錄 health check 請求
        if (breadcrumb.message && breadcrumb.message.includes('/health')) {
          return null;
        }
        return breadcrumb;
      },

      // 忽略特定錯誤
      ignoreErrors: [
        'Non-Error promise rejection captured',
        'Network Error',
        'ChunkLoadError',
        'Loading chunk',
        'ResizeObserver loop limit exceeded'
      ],

      // 設定發布版本
      release: process.env.npm_package_version || '1.0.0',

      // 設定標籤
      initialScope: {
        tags: {
          component: 'api-gateway',
          service: 'mursfoto-api-gateway'
        }
      }
    });

    logger.info('🔍 Sentry 錯誤追蹤初始化成功');
    return true;

  } catch (error) {
    logger.error('Sentry 初始化失敗:', error);
    return false;
  }
}

/**
 * 過濾敏感資料
 */
function filterSensitiveData(event) {
  // 過濾 URL 中的敏感參數
  if (event.request && event.request.url) {
    event.request.url = sanitizeUrl(event.request.url);
  }

  // 過濾請求頭中的敏感資訊
  if (event.request && event.request.headers) {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    
    for (const header of sensitiveHeaders) {
      if (event.request.headers[header]) {
        event.request.headers[header] = '[Filtered]';
      }
    }
  }

  // 過濾請求體中的敏感資料
  if (event.request && event.request.data) {
    event.request.data = sanitizeData(event.request.data);
  }

  // 過濾額外資料
  if (event.extra) {
    event.extra = sanitizeData(event.extra);
  }

  return event;
}

/**
 * 清理 URL 中的敏感參數
 */
function sanitizeUrl(url) {
  try {
    const urlObj = new URL(url);
    const sensitiveParams = ['token', 'api_key', 'auth', 'password', 'secret'];
    
    for (const param of sensitiveParams) {
      if (urlObj.searchParams.has(param)) {
        urlObj.searchParams.set(param, '[Filtered]');
      }
    }
    
    return urlObj.toString();
  } catch {
    return url; // 如果不是有效 URL，直接返回原值
  }
}

/**
 * 清理物件中的敏感資料
 */
function sanitizeData(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveKeys = [
    'password', 'token', 'secret', 'key', 'auth', 'authorization',
    'api_key', 'apiKey', 'access_token', 'refresh_token', 'jwt',
    'private_key', 'publicKey', 'privateKey'
  ];

  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  function sanitizeObject(obj) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const lowerKey = key.toLowerCase();
        
        // 檢查是否為敏感鍵
        if (sensitiveKeys.some(sensitiveKey => lowerKey.includes(sensitiveKey))) {
          obj[key] = '[Filtered]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          // 遞迴處理巢狀物件
          obj[key] = sanitizeObject(obj[key]);
        }
      }
    }
    return obj;
  }

  return sanitizeObject(sanitized);
}

/**
 * Express 錯誤處理中間件
 */
function sentryErrorHandler() {
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // 只記錄服務器錯誤 (5xx) 和特定的客戶端錯誤
      const status = error.status || error.statusCode || 500;
      
      // 不記錄常見的客戶端錯誤
      if (status === 404 || status === 401 || status === 403) {
        return false;
      }
      
      return status >= 500 || status === 429; // 記錄服務器錯誤和頻率限制錯誤
    }
  });
}

/**
 * 手動捕獲錯誤
 */
function captureError(error, context = {}) {
  Sentry.withScope((scope) => {
    // 添加上下文資訊
    if (context.user) {
      scope.setUser(sanitizeData(context.user));
    }

    if (context.tags) {
      for (const [key, value] of Object.entries(context.tags)) {
        scope.setTag(key, value);
      }
    }

    if (context.extra) {
      scope.setContext('extra', sanitizeData(context.extra));
    }

    if (context.level) {
      scope.setLevel(context.level);
    }

    // 捕獲錯誤
    Sentry.captureException(error);
  });

  // 同時記錄到本地日誌
  logger.error('Sentry 錯誤捕獲:', {
    message: error.message,
    stack: error.stack,
    context: sanitizeData(context)
  });
}

/**
 * 捕獲訊息
 */
function captureMessage(message, level = 'info', context = {}) {
  Sentry.withScope((scope) => {
    if (context.tags) {
      for (const [key, value] of Object.entries(context.tags)) {
        scope.setTag(key, value);
      }
    }

    if (context.extra) {
      scope.setContext('extra', sanitizeData(context.extra));
    }

    scope.setLevel(level);
    Sentry.captureMessage(message);
  });
}

/**
 * 設定用戶上下文
 */
function setUser(user) {
  Sentry.setUser(sanitizeData(user));
}

/**
 * 添加 breadcrumb
 */
function addBreadcrumb(breadcrumb) {
  Sentry.addBreadcrumb({
    ...breadcrumb,
    data: sanitizeData(breadcrumb.data || {})
  });
}

/**
 * 性能監控 - 創建交易
 */
function startTransaction(name, op) {
  return Sentry.startTransaction({ name, op });
}

/**
 * API Gateway 特定的錯誤追蹤中間件
 */
function apiGatewayTracking() {
  return (req, res, next) => {
    // 設定交易名稱
    const transactionName = `${req.method} ${req.route?.path || req.path}`;
    const transaction = Sentry.startTransaction({
      op: 'http.server',
      name: transactionName,
      tags: {
        method: req.method,
        url: sanitizeUrl(req.originalUrl)
      }
    });

    // 設定用戶資訊 (如果存在 token 資訊)
    if (req.tokenInfo) {
      Sentry.setUser({
        id: req.tokenInfo.id,
        ip_address: req.ip
      });
    }

    // 添加請求資訊到 scope
    Sentry.configureScope((scope) => {
      scope.setTag('api_gateway', true);
      scope.setContext('request', {
        method: req.method,
        url: sanitizeUrl(req.originalUrl),
        headers: sanitizeData(req.headers),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    });

    // 監聽回應完成
    res.on('finish', () => {
      transaction.setTag('status_code', res.statusCode);
      transaction.setStatus(
        res.statusCode >= 400 ? 'internal_error' : 'ok'
      );
      transaction.finish();
    });

    next();
  };
}

/**
 * 安全事件追蹤
 */
function trackSecurityEvent(eventType, details) {
  captureMessage(`Security Event: ${eventType}`, 'warning', {
    tags: {
      security_event: true,
      event_type: eventType
    },
    extra: {
      details: sanitizeData(details),
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * 健康檢查 - 檢查 Sentry 連接狀態
 */
async function healthCheck() {
  try {
    // 發送測試事件來檢查連接
    const eventId = Sentry.captureMessage('Health Check', 'debug');
    
    return {
      status: 'connected',
      dsn: process.env.SENTRY_DSN ? 'configured' : 'not_configured',
      environment: Sentry.getCurrentHub().getClient()?.getOptions()?.environment,
      lastEventId: eventId
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

/**
 * 關閉 Sentry (清理資源)
 */
async function closeSentry() {
  try {
    await Sentry.close(2000); // 等待 2 秒讓事件發送完成
    logger.info('🔍 Sentry 已正常關閉');
  } catch (error) {
    logger.error('Sentry 關閉失敗:', error);
  }
}

module.exports = {
  initializeSentry,
  sentryErrorHandler,
  captureError,
  captureMessage,
  setUser,
  addBreadcrumb,
  startTransaction,
  apiGatewayTracking,
  trackSecurityEvent,
  healthCheck,
  closeSentry,
  
  // 導出 Sentry 原生方法 (進階用法)
  Sentry
};
