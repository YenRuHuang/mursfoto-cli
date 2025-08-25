const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

/**
 * 📝 Mursfoto 企業級日誌系統
 * 基於 AI Freelancer Tools 的 logger.js 最佳實踐
 * 
 * 功能特色：
 * ✅ 日誌輪轉與自動清理
 * ✅ 分類日誌 (一般/錯誤/安全/API)
 * ✅ 結構化日誌記錄
 * ✅ 效能追蹤
 * ✅ 安全事件監控
 */
class MursfotoEnterpriseLogger {
  constructor(options = {}) {
    this.serviceName = options.serviceName || process.env.MURSFOTO_SERVICE_NAME || 'mursfoto-service';
    this.logsDir = options.logsDir || path.join(process.cwd(), 'logs');
    this.logLevel = options.logLevel || process.env.LOG_LEVEL || 'info';
    
    // 確保日誌目錄存在
    this.ensureLogsDirectory();
    
    // 初始化各種日誌器
    this.initializeLoggers();
    
    // 追蹤統計
    this.stats = {
      totalRequests: 0,
      errorCount: 0,
      securityEvents: 0,
      lastReset: Date.now()
    };
  }

  /**
   * 🗂️ 確保日誌目錄存在
   */
  ensureLogsDirectory() {
    const fs = require('fs');
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  /**
   * 🔧 初始化所有日誌器
   */
  initializeLoggers() {
    // 自定義日誌格式
    this.logFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS'
      }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ level, message, timestamp, stack, service, requestId, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}] [${service || this.serviceName}]`;
        
        if (requestId) {
          log += ` [${requestId}]`;
        }
        
        log += `: ${message}`;

        if (stack) {
          log += `\n${stack}`;
        }

        if (Object.keys(meta).length > 0) {
          log += `\n📊 Metadata: ${JSON.stringify(meta, null, 2)}`;
        }

        return log;
      })
    );

    // 🗂️ 一般應用日誌 (輪轉)
    this.applicationTransport = new DailyRotateFile({
      filename: path.join(this.logsDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '50m',
      maxFiles: '30d',
      createSymlink: true,
      symlinkName: 'application.log',
      format: this.logFormat
    });

    // 🔥 錯誤日誌 (更長保存期)
    this.errorTransport = new DailyRotateFile({
      filename: path.join(this.logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '90d',  // 錯誤日誌保存3個月
      level: 'error',
      createSymlink: true,
      symlinkName: 'error.log',
      format: this.logFormat
    });

    // 🛡️ 安全事件日誌 (最長保存)
    this.securityTransport = new DailyRotateFile({
      filename: path.join(this.logsDir, 'security-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: '365d',  // 安全日誌保存1年
      createSymlink: true,
      symlinkName: 'security.log',
      format: this.logFormat
    });

    // 🌐 API 請求日誌
    this.apiTransport = new DailyRotateFile({
      filename: path.join(this.logsDir, 'api-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '100m',  // API日誌量大，設置較大文件
      maxFiles: '14d',
      createSymlink: true,
      symlinkName: 'api.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    });

    // 📊 效能監控日誌
    this.performanceTransport = new DailyRotateFile({
      filename: path.join(this.logsDir, 'performance-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '7d',
      createSymlink: true,
      symlinkName: 'performance.log',
      format: winston.format.json()
    });

    // 主要應用日誌器
    this.logger = winston.createLogger({
      level: this.logLevel,
      format: this.logFormat,
      defaultMeta: {
        service: this.serviceName,
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      transports: [
        this.applicationTransport,
        this.errorTransport
      ],
      // 處理未捕獲的異常
      exceptionHandlers: [
        new winston.transports.File({
          filename: path.join(this.logsDir, 'exceptions.log'),
          format: this.logFormat
        })
      ],
      // 處理未捕獲的 Promise 拒絕
      rejectionHandlers: [
        new winston.transports.File({
          filename: path.join(this.logsDir, 'rejections.log'),
          format: this.logFormat
        })
      ]
    });

    // 安全事件專用日誌器
    this.securityLogger = winston.createLogger({
      level: 'info',
      format: this.logFormat,
      defaultMeta: {
        service: `${this.serviceName}-security`,
        type: 'security-event'
      },
      transports: [this.securityTransport]
    });

    // API 專用日誌器
    this.apiLogger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: {
        service: `${this.serviceName}-api`
      },
      transports: [this.apiTransport]
    });

    // 效能專用日誌器
    this.performanceLogger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: {
        service: `${this.serviceName}-performance`
      },
      transports: [this.performanceTransport]
    });

    // 開發環境加入控制台輸出
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ level, message, timestamp, requestId }) => {
            let output = `${timestamp} [${level}]`;
            if (requestId) output += ` [${requestId}]`;
            return `${output}: ${message}`;
          })
        )
      }));
    }
  }

  /**
   * 🌐 API 請求日誌中間件
   */
  apiMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      // 生成或使用現有的請求ID
      const requestId = req.headers['x-request-id'] || 
        req.headers['x-correlation-id'] ||
        this.generateRequestId();
      
      req.requestId = requestId;
      req.startTime = startTime;

      // 記錄請求開始
      const requestLog = {
        requestId,
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        userId: req.user?.id,
        timestamp: new Date().toISOString(),
        headers: this.sanitizeHeaders(req.headers)
      };

      this.apiLogger.info('API_REQUEST', requestLog);
      this.stats.totalRequests++;

      // 記錄響應
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const responseLog = {
          requestId,
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          userId: req.user?.id,
          timestamp: new Date().toISOString()
        };

        if (res.statusCode >= 400) {
          this.stats.errorCount++;
          this.apiLogger.error('API_ERROR', responseLog);
        } else {
          this.apiLogger.info('API_RESPONSE', responseLog);
        }

        // 效能警告
        if (duration > 5000) {  // 超過5秒
          this.logPerformance('SLOW_REQUEST', {
            ...responseLog,
            warningLevel: 'critical'
          });
        } else if (duration > 2000) {  // 超過2秒
          this.logPerformance('SLOW_REQUEST', {
            ...responseLog,
            warningLevel: 'warning'
          });
        }
      });

      next();
    };
  }

  /**
   * 🛡️ 安全事件記錄
   */
  logSecurity(event, details = {}) {
    const logData = {
      event,
      timestamp: new Date().toISOString(),
      ...details
    };

    this.securityLogger.info(event, logData);
    this.stats.securityEvents++;

    // 關鍵安全事件同時記錄到主日誌
    if (this.isCriticalSecurityEvent(event)) {
      this.logger.warn(`SECURITY: ${event}`, logData);
    }
  }

  /**
   * 🔐 認證事件記錄
   */
  logAuth(event, userId, details = {}) {
    this.logSecurity(`AUTH_${event.toUpperCase()}`, {
      userId,
      userAgent: details.userAgent,
      ip: details.ip,
      ...details
    });
  }

  /**
   * 📊 效能事件記錄
   */
  logPerformance(metric, data) {
    this.performanceLogger.info(metric, {
      timestamp: new Date().toISOString(),
      metric,
      ...data
    });
  }

  /**
   * 🔍 資料存取記錄
   */
  logDataAccess(userId, action, resource, details = {}) {
    this.logSecurity('DATA_ACCESS', {
      userId,
      action,  // CREATE, READ, UPDATE, DELETE
      resource,  // users, projects, etc.
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * 🚨 錯誤記錄
   */
  logError(error, context = {}) {
    const errorData = {
      error: error.message,
      stack: error.stack,
      code: error.code,
      ...context
    };

    this.logger.error('APPLICATION_ERROR', errorData);

    // 資料庫錯誤額外記錄
    if (error.code && error.code.startsWith('ER_')) {
      this.logSecurity('DATABASE_ERROR', {
        sqlState: error.sqlState,
        errno: error.errno,
        ...errorData
      });
    }
  }

  /**
   * 📈 取得日誌統計
   */
  getStats() {
    const uptime = Date.now() - this.stats.lastReset;
    return {
      ...this.stats,
      uptime: Math.round(uptime / 1000), // seconds
      requestsPerSecond: Math.round(this.stats.totalRequests / (uptime / 1000) * 100) / 100,
      errorRate: this.stats.totalRequests > 0 ? 
        Math.round((this.stats.errorCount / this.stats.totalRequests) * 10000) / 100 : 0,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 🔄 重置統計
   */
  resetStats() {
    this.stats = {
      totalRequests: 0,
      errorCount: 0,
      securityEvents: 0,
      lastReset: Date.now()
    };
  }

  // ==================== 輔助方法 ====================

  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    // 移除敏感信息
    delete sanitized.authorization;
    delete sanitized.cookie;
    delete sanitized['x-api-key'];
    return sanitized;
  }

  isCriticalSecurityEvent(event) {
    const criticalEvents = [
      'AUTH_FAILED_MULTIPLE',
      'UNAUTHORIZED_ACCESS',
      'PRIVILEGE_ESCALATION',
      'SQL_INJECTION_ATTEMPT',
      'XSS_ATTEMPT',
      'BRUTE_FORCE_DETECTED'
    ];
    return criticalEvents.includes(event);
  }

  // ==================== 公開 API ====================

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  error(message, meta = {}) {
    if (meta instanceof Error) {
      this.logError(meta, { message });
    } else {
      this.logger.error(message, meta);
    }
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }
}

module.exports = MursfotoEnterpriseLogger;