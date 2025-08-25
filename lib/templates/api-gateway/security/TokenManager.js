const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const db = require('../services/DatabaseService');

class TokenManager {
  constructor() {
    this.secretKey = process.env.JWT_SECRET || this.generateSecretKey();
    
    // Token 配置
    this.config = {
      expiresIn: process.env.TOKEN_EXPIRES_IN || '30d',
      issuer: 'mursfoto-api-gateway',
      algorithm: 'HS256',
      maxRequestsPerHour: parseInt(process.env.MAX_REQUESTS_PER_HOUR) || 1000,
      maxRequestsPerDay: parseInt(process.env.MAX_REQUESTS_PER_DAY) || 10000
    };
    
    // 內部服務白名單（不需要 token 驗證）
    this.internalServicePaths = [
      '/api/tw-life-formula',
      '/api/status',
      '/api/'
    ];
  }

  /**
   * 生成安全的密鑰
   */
  generateSecretKey() {
    const key = crypto.randomBytes(64).toString('hex');
    logger.warn('⚠️  使用自動生成的 JWT Secret，建議在 .env 中設定 JWT_SECRET');
    return key;
  }

  /**
   * 初始化 Token 管理器
   */
  async initialize() {
    try {
      // 嘗試初始化資料庫
      this.databaseAvailable = await db.init();
      
      if (this.databaseAvailable) {
        await this.startCleanupInterval();
        logger.info('🔑 TokenManager 初始化成功 (資料庫模式)');
      } else {
        logger.warn('🔑 TokenManager 初始化 (無資料庫模式 - 功能受限)');
      }
      
      return true;
    } catch (error) {
      logger.error('TokenManager 初始化失敗:', error);
      // 不拋出錯誤，讓應用繼續啟動
      this.databaseAvailable = false;
      logger.warn('🔑 TokenManager 將以無資料庫模式運行');
      return false;
    }
  }

  /**
   * 生成新的 API Token（透過 API 呼叫）
   */
  async createToken(tokenData) {
    try {
      const tokenId = uuidv4();
      const now = Date.now();
      
      const tokenPayload = {
        jti: tokenId,
        iat: Math.floor(now / 1000),
        iss: this.config.issuer,
        sub: tokenData.name || 'api-access',
        type: 'api-access'
      };

      const token = jwt.sign(tokenPayload, this.secretKey, {
        expiresIn: this.config.expiresIn,
        algorithm: this.config.algorithm
      });

      // 計算過期時間
      const expiresAt = tokenData.expiresAt || 
        new Date(now + this.parseExpirationTime(this.config.expiresIn));

      // 生成 token hash 用於資料庫存儲
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // 存儲到資料庫
      const dbTokenData = {
        id: tokenId,
        name: tokenData.name,
        description: tokenData.description,
        tokenHash,
        expiresAt,
        createdBy: tokenData.createdBy || 'system'
      };

      const createdToken = await db.createToken(dbTokenData);

      logger.info(`🔑 新 Token 已生成並存儲: ${tokenId.substring(0, 8)}...`);
      
      return {
        id: tokenId,
        token,
        name: tokenData.name,
        description: tokenData.description,
        expiresAt,
        createdAt: createdToken.created_at
      };
    } catch (error) {
      logger.error('Token 生成失敗:', error);
      throw new Error('無法生成訪問 Token');
    }
  }

  /**
   * 檢查是否為內部服務請求
   */
  isInternalServiceRequest(req) {
    const path = req.path;
    return this.internalServicePaths.some(allowedPath => {
      if (allowedPath.endsWith('/')) {
        return path.startsWith(allowedPath) || path === allowedPath.slice(0, -1);
      }
      return path.startsWith(allowedPath + '/') || path === allowedPath;
    });
  }

  /**
   * 驗證 Token 中間件
   */
  validateToken = async (req, res, next) => {
    const startTime = Date.now();
    
    try {
      // 檢查是否為內部服務請求
      if (this.isInternalServiceRequest(req)) {
        logger.info(`🔓 內部服務請求跳過 Token 驗證: ${req.method} ${req.path}`);
        req.tokenInfo = { internalService: true, path: req.path };
        return next();
      }
      
      // 如果沒有資料庫，跳過大部分檢查
      if (!this.databaseAvailable) {
        logger.warn('🔑 無資料庫模式 - 跳過 Token 驗證');
        req.tokenInfo = { noDatabase: true };
        return next();
      }

      // 檢查 IP 是否被阻止
      const clientIP = req.ip || req.connection.remoteAddress;
      if (await db.isIpBlocked(clientIP)) {
        logger.warn(`🚫 被阻止的 IP 嘗試存取: ${clientIP}`);
        return this.sendUnauthorized(res, 'ip_blocked', 'Your IP has been blocked');
      }

      // 從 Header 或 Query 中獲取 token
      const token = this.extractToken(req);
      
      if (!token) {
        return this.sendUnauthorized(res, 'missing_token', 'Access token is required');
      }

      // 驗證 JWT
      const decoded = jwt.verify(token, this.secretKey);
      const tokenId = decoded.jti;

      // 生成 token hash 來查詢資料庫
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      
      // 從資料庫檢查 token 是否存在且有效
      const tokenInfo = await db.getTokenByHash(tokenHash);
      if (!tokenInfo) {
        await this.reportSuspiciousActivity(req, { id: tokenId }, 'invalid_token');
        return this.sendUnauthorized(res, 'invalid_token', 'Token is invalid or revoked');
      }

      // 檢查 token 是否過期
      if (tokenInfo.expires_at && new Date() > new Date(tokenInfo.expires_at)) {
        return this.sendUnauthorized(res, 'token_expired', 'Access token has expired');
      }

      // 檢查使用頻率限制
      if (!await this.checkRateLimit(tokenId, clientIP)) {
        await this.reportSuspiciousActivity(req, tokenInfo, 'rate_limit_exceeded');
        return this.sendUnauthorized(res, 'rate_limited', 'Too many requests');
      }

      // 更新 token 使用統計
      await db.updateTokenUsage(tokenId);

      // 記錄 API 使用日誌
      const responseTime = Date.now() - startTime;
      await this.logApiUsage(req, tokenInfo, responseTime);

      // 將 token 資訊添加到請求中
      req.tokenInfo = {
        id: tokenId,
        decoded,
        tokenData: tokenInfo
      };

      next();
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error.name === 'TokenExpiredError') {
        return this.sendUnauthorized(res, 'token_expired', 'Access token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        await this.logApiUsage(req, null, responseTime, 'invalid_token');
        return this.sendUnauthorized(res, 'invalid_token', 'Invalid access token');
      } else {
        logger.error('Token 驗證錯誤:', error);
        await this.logApiUsage(req, null, responseTime, error.message);
        return res.status(500).json({
          error: 'internal_error',
          message: 'Token validation failed'
        });
      }
    }
  };

  /**
   * 從請求中提取 token
   */
  extractToken(req) {
    // 從 Authorization header 中提取
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // 從 Query parameter 中提取
    if (req.query.token) {
      return req.query.token;
    }

    // 從 X-API-Key header 中提取
    if (req.headers['x-api-key']) {
      return req.headers['x-api-key'];
    }

    return null;
  }

  /**
   * 檢查請求頻率限制（使用資料庫記錄）
   */
  async checkRateLimit(tokenId, clientIP) {
    try {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - (60 * 60 * 1000));
      const dayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

      // 查詢最近的使用記錄
      const hourlyCount = await db.query(`
        SELECT COUNT(*) as count 
        FROM api_usage_logs 
        WHERE token_id = ? AND created_at > ?
      `, [tokenId, hourAgo]);

      const dailyCount = await db.query(`
        SELECT COUNT(*) as count 
        FROM api_usage_logs 
        WHERE token_id = ? AND created_at > ?
      `, [tokenId, dayAgo]);

      const hourlyUsage = hourlyCount[0].count;
      const dailyUsage = dailyCount[0].count;

      // 檢查限制
      if (hourlyUsage >= this.config.maxRequestsPerHour) {
        logger.warn(`🚨 Token ${tokenId} 超過小時限制: ${hourlyUsage}/${this.config.maxRequestsPerHour}`);
        return false;
      }

      if (dailyUsage >= this.config.maxRequestsPerDay) {
        logger.warn(`🚨 Token ${tokenId} 超過日限制: ${dailyUsage}/${this.config.maxRequestsPerDay}`);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('檢查速率限制失敗:', error);
      // 發生錯誤時採用保守策略，允許請求但記錄錯誤
      return true;
    }
  }

  /**
   * 記錄 API 使用日誌
   */
  async logApiUsage(req, tokenInfo, responseTimeMs, errorMessage = null) {
    try {
      const logData = {
        tokenId: tokenInfo?.id || null,
        endpoint: `${req.method} ${req.path}`,
        method: req.method,
        statusCode: res?.statusCode || (errorMessage ? 401 : 200),
        responseTimeMs: Math.round(responseTimeMs),
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')?.substring(0, 500),
        requestSize: req.get('content-length') ? parseInt(req.get('content-length')) : 0,
        responseSize: 0, // 將在響應結束時更新
        errorMessage: errorMessage?.substring(0, 500)
      };

      await db.logApiUsage(logData);
    } catch (error) {
      logger.error('記錄 API 使用失敗:', error);
    }
  }

  /**
   * 撤銷 Token
   */
  async revokeToken(tokenId, reason = 'manual_revoke') {
    try {
      await db.deactivateToken(tokenId);
      logger.info(`🔒 Token 已撤銷: ${tokenId} (原因: ${reason})`);
      return true;
    } catch (error) {
      logger.error('撤銷 Token 失敗:', error);
      throw error;
    }
  }

  /**
   * 獲取所有 Tokens
   */
  async getAllTokens() {
    try {
      return await db.getAllTokens();
    } catch (error) {
      logger.error('獲取 Token 列表失敗:', error);
      throw error;
    }
  }

  /**
   * 獲取 Token 統計資料
   */
  async getTokenStats(tokenId, days = 30) {
    try {
      const tokenInfo = await db.getTokenById(tokenId);
      if (!tokenInfo) {
        return null;
      }

      const stats = await db.getTokenStats(tokenId, days);
      
      return {
        id: tokenId,
        name: tokenInfo.name,
        description: tokenInfo.description,
        status: tokenInfo.is_active ? 'active' : 'inactive',
        createdAt: tokenInfo.created_at,
        lastUsed: tokenInfo.last_used_at,
        totalUsage: tokenInfo.usage_count,
        expiresAt: tokenInfo.expires_at,
        dailyStats: stats,
        limits: {
          hourly: this.config.maxRequestsPerHour,
          daily: this.config.maxRequestsPerDay
        }
      };
    } catch (error) {
      logger.error('獲取 Token 統計失敗:', error);
      throw error;
    }
  }

  /**
   * 回報可疑活動
   */
  async reportSuspiciousActivity(req, tokenInfo, activityType) {
    try {
      const clientIP = req.ip || req.connection.remoteAddress;
      
      const alertData = {
        alertType: activityType,
        severity: this.getSeverityLevel(activityType),
        message: this.getSuspiciousActivityMessage(activityType),
        details: {
          ip: clientIP,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
          timestamp: new Date()
        },
        ipAddress: clientIP,
        tokenId: tokenInfo?.id,
        endpoint: `${req.method} ${req.path}`
      };

      await db.createSecurityAlert(alertData);
      logger.warn('🚨 檢測到可疑活動:', alertData);

      // 如果是嚴重的可疑活動，考慮自動阻止 IP
      if (['rate_limit_exceeded', 'multiple_invalid_tokens'].includes(activityType)) {
        await this.considerAutoBlock(clientIP, activityType);
      }

      // SecurityMonitor 整合將在 server.js 中處理
      // 避免循環依賴問題
    } catch (error) {
      logger.error('報告可疑活動失敗:', error);
    }
  }

  /**
   * 獲取活動嚴重程度
   */
  getSeverityLevel(activityType) {
    const severityMap = {
      'invalid_token': 'medium',
      'token_expired': 'low',
      'rate_limit_exceeded': 'high',
      'ip_mismatch': 'high',
      'multiple_invalid_tokens': 'critical'
    };
    return severityMap[activityType] || 'medium';
  }

  /**
   * 獲取可疑活動訊息
   */
  getSuspiciousActivityMessage(activityType) {
    const messageMap = {
      'invalid_token': '使用無效的 API Token',
      'token_expired': '使用已過期的 API Token',
      'rate_limit_exceeded': '超過 API 使用頻率限制',
      'ip_mismatch': 'Token 從非授權 IP 使用',
      'multiple_invalid_tokens': '多次嘗試使用無效 Token'
    };
    return messageMap[activityType] || '未知的可疑活動';
  }

  /**
   * 考慮自動阻止 IP
   */
  async considerAutoBlock(ipAddress, activityType) {
    try {
      // 檢查最近的告警次數
      const recentAlerts = await db.query(`
        SELECT COUNT(*) as count 
        FROM security_alerts 
        WHERE ip_address = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
        AND severity IN ('high', 'critical')
      `, [ipAddress]);

      const alertCount = recentAlerts[0].count;
      
      // 如果一小時內有 5 次以上高嚴重性告警，自動阻止 IP
      if (alertCount >= 5) {
        const expiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000)); // 24小時
        await db.blockIp(ipAddress, `自動阻止: ${activityType}`, 'system', expiresAt);
        
        logger.warn(`🚫 自動阻止可疑 IP: ${ipAddress} (告警次數: ${alertCount})`);
        
        // 緊急告警將透過 SecurityMonitor 在 server.js 中統一處理
        // 避免循環依賴問題
      }
    } catch (error) {
      logger.error('自動阻止 IP 評估失敗:', error);
    }
  }

  /**
   * 發送未授權響應
   */
  sendUnauthorized(res, errorCode, message) {
    return res.status(401).json({
      error: errorCode,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 解析過期時間
   */
  parseExpirationTime(expiresIn) {
    const match = expiresIn.match(/^(\d+)([smhdw])$/);
    if (!match) return 30 * 24 * 60 * 60 * 1000; // 默認 30 天

    const [, value, unit] = match;
    const num = parseInt(value);

    switch (unit) {
      case 's': return num * 1000;
      case 'm': return num * 60 * 1000;
      case 'h': return num * 60 * 60 * 1000;
      case 'd': return num * 24 * 60 * 60 * 1000;
      case 'w': return num * 7 * 24 * 60 * 60 * 1000;
      default: return 30 * 24 * 60 * 60 * 1000;
    }
  }

  /**
   * 啟動清理間隔
   */
  async startCleanupInterval() {
    // 每小時清理一次過期數據
    setInterval(async () => {
      await this.cleanupExpiredData();
    }, 60 * 60 * 1000);
    
    // 立即執行一次清理
    await this.cleanupExpiredData();
  }

  /**
   * 清理過期數據
   */
  async cleanupExpiredData() {
    try {
      // 清理過期的使用記錄（保留 30 天）
      const result1 = await db.query(`
        DELETE FROM api_usage_logs 
        WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
      `);

      // 清理過期的阻止 IP 記錄
      const result2 = await db.query(`
        UPDATE blocked_ips 
        SET is_active = false 
        WHERE expires_at IS NOT NULL AND expires_at < NOW() AND is_active = true
      `);

      // 清理已解決的舊安全告警（保留 7 天）
      const result3 = await db.query(`
        DELETE FROM security_alerts 
        WHERE resolved = true AND resolved_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
      `);

      const cleaned = {
        usageLogs: result1.affectedRows || 0,
        blockedIps: result2.affectedRows || 0,
        securityAlerts: result3.affectedRows || 0
      };

      if (cleaned.usageLogs > 0 || cleaned.blockedIps > 0 || cleaned.securityAlerts > 0) {
        logger.info('🧹 資料清理完成:', cleaned);
      }
    } catch (error) {
      logger.error('資料清理失敗:', error);
    }
  }
}

module.exports = TokenManager;
