const express = require('express');
const rateLimit = require('express-rate-limit');
const SecurityMonitor = require('../security/SecurityMonitor');
const logger = require('../utils/logger');

const router = express.Router();

// 安全 API 的速率限制
const securityRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 30, // 每 15 分鐘最多 30 次請求
  message: {
    error: '安全監控 API 請求過於頻繁',
    retryAfter: '15分鐘'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 應用速率限制到所有 security 路由
router.use(securityRateLimit);

// 初始化安全監控器
let securityMonitor = null;

async function initializeSecurityMonitor() {
  if (!securityMonitor) {
    securityMonitor = new SecurityMonitor();
    await securityMonitor.initialize();
  }
}

// 管理員驗證中間件
function requireAdmin(req, res, next) {
  const adminKey = req.headers['x-admin-key'];
  const expectedKey = process.env.ADMIN_API_KEY;
  
  if (!expectedKey) {
    return res.status(500).json({
      error: '管理員 API 密鑰未配置',
      code: 'ADMIN_KEY_NOT_CONFIGURED'
    });
  }
  
  if (!adminKey || adminKey !== expectedKey) {
    // 記錄未授權的管理員存取嘗試
    securityMonitor?.reportSuspiciousActivity('unauthorized_security_access', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      providedKey: adminKey ? 'PROVIDED' : 'MISSING'
    });
    
    return res.status(401).json({
      error: '需要有效的管理員 API 密鑰',
      code: 'ADMIN_KEY_REQUIRED'
    });
  }
  
  next();
}

/**
 * GET /security/stats - 獲取安全統計資料
 */
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    await initializeSecurityMonitor();
    
    const { timeRange = '24h' } = req.query;
    
    const stats = await securityMonitor.getSecurityStats(timeRange);
    
    res.json({
      success: true,
      timeRange: timeRange,
      stats: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('安全統計獲取失敗', {
      error: error.message,
      ip: req.ip
    });
    
    res.status(500).json({
      error: '安全統計獲取失敗',
      code: 'SECURITY_STATS_FAILED'
    });
  }
});

/**
 * GET /security/alerts - 獲取安全告警列表
 */
router.get('/alerts', requireAdmin, async (req, res) => {
  try {
    await initializeSecurityMonitor();
    
    const { 
      page = 1, 
      limit = 50, 
      level, // 'info', 'warning', 'error'
      since 
    } = req.query;
    
    const alerts = await securityMonitor.getAlerts({
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 200), // 最多 200 個
      level: level,
      since: since // ISO 8601 格式的時間戳
    });
    
    res.json({
      success: true,
      data: alerts.data,
      pagination: {
        page: alerts.page,
        limit: alerts.limit,
        total: alerts.total,
        pages: alerts.pages
      }
    });
    
  } catch (error) {
    logger.error('安全告警列表獲取失敗', {
      error: error.message,
      ip: req.ip
    });
    
    res.status(500).json({
      error: '安全告警列表獲取失敗',
      code: 'SECURITY_ALERTS_FAILED'
    });
  }
});

/**
 * GET /security/suspicious-activities - 獲取可疑活動記錄
 */
router.get('/suspicious-activities', requireAdmin, async (req, res) => {
  try {
    await initializeSecurityMonitor();
    
    const { 
      page = 1, 
      limit = 100, 
      type, // 活動類型過濾
      ip,   // IP 地址過濾
      since 
    } = req.query;
    
    const activities = await securityMonitor.getSuspiciousActivities({
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 200),
      type: type,
      ip: ip,
      since: since
    });
    
    res.json({
      success: true,
      data: activities.data,
      pagination: {
        page: activities.page,
        limit: activities.limit,
        total: activities.total,
        pages: activities.pages
      }
    });
    
  } catch (error) {
    logger.error('可疑活動記錄獲取失敗', {
      error: error.message,
      ip: req.ip
    });
    
    res.status(500).json({
      error: '可疑活動記錄獲取失敗',
      code: 'SUSPICIOUS_ACTIVITIES_FAILED'
    });
  }
});

/**
 * POST /security/block-ip - 手動阻止 IP 地址
 */
router.post('/block-ip', requireAdmin, async (req, res) => {
  try {
    await initializeSecurityMonitor();
    
    const { ip, reason, duration = '24h' } = req.body;
    
    // 驗證 IP 地址格式
    if (!ip || typeof ip !== 'string') {
      return res.status(400).json({
        error: 'IP 地址是必需的',
        code: 'INVALID_IP'
      });
    }
    
    // 簡單的 IP 格式驗證
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(ip)) {
      return res.status(400).json({
        error: 'IP 地址格式無效',
        code: 'INVALID_IP_FORMAT'
      });
    }
    
    // 防止阻止自己的 IP
    if (ip === req.ip) {
      return res.status(400).json({
        error: '無法阻止自己的 IP 地址',
        code: 'CANNOT_BLOCK_SELF'
      });
    }
    
    const result = await securityMonitor.blockIP(ip, {
      reason: reason || 'Manual block',
      duration: duration,
      blockedBy: req.ip,
      blockedAt: new Date().toISOString()
    });
    
    if (result.success) {
      logger.warn('IP 地址已被手動阻止', {
        blockedIP: ip,
        reason: reason,
        duration: duration,
        blockedBy: req.ip
      });
      
      // 發送安全告警
      await securityMonitor.sendAlert('warning', 'IP Address Manually Blocked', {
        'Blocked IP': ip,
        'Reason': reason || 'Manual block',
        'Duration': duration,
        'Blocked By': req.ip
      });
      
      res.json({
        success: true,
        message: 'IP 地址已成功阻止',
        blockedUntil: result.blockedUntil
      });
    } else {
      res.status(409).json({
        error: result.error || 'IP 阻止操作失敗',
        code: 'IP_BLOCK_FAILED'
      });
    }
    
  } catch (error) {
    logger.error('IP 阻止操作失敗', {
      error: error.message,
      ip: req.body.ip,
      adminIP: req.ip
    });
    
    res.status(500).json({
      error: 'IP 阻止操作失敗',
      code: 'IP_BLOCK_OPERATION_FAILED'
    });
  }
});

/**
 * DELETE /security/block-ip/:ip - 解除 IP 地址阻止
 */
router.delete('/block-ip/:ip', requireAdmin, async (req, res) => {
  try {
    await initializeSecurityMonitor();
    
    const { ip } = req.params;
    
    const result = await securityMonitor.unblockIP(ip, {
      unblockedBy: req.ip,
      unblockedAt: new Date().toISOString(),
      reason: 'Manual unblock'
    });
    
    if (result.success) {
      logger.info('IP 地址阻止已解除', {
        unblockedIP: ip,
        unblockedBy: req.ip
      });
      
      // 發送安全告警
      await securityMonitor.sendAlert('info', 'IP Address Unblocked', {
        'Unblocked IP': ip,
        'Unblocked By': req.ip,
        'Reason': 'Manual unblock'
      });
      
      res.json({
        success: true,
        message: 'IP 地址阻止已成功解除'
      });
    } else {
      res.status(404).json({
        error: result.error || 'IP 地址未被阻止或解除阻止失敗',
        code: 'IP_UNBLOCK_FAILED'
      });
    }
    
  } catch (error) {
    logger.error('IP 解除阻止操作失敗', {
      error: error.message,
      ip: req.params.ip,
      adminIP: req.ip
    });
    
    res.status(500).json({
      error: 'IP 解除阻止操作失敗',
      code: 'IP_UNBLOCK_OPERATION_FAILED'
    });
  }
});

/**
 * GET /security/blocked-ips - 獲取被阻止的 IP 列表
 */
router.get('/blocked-ips', requireAdmin, async (req, res) => {
  try {
    await initializeSecurityMonitor();
    
    const { page = 1, limit = 50, active = 'true' } = req.query;
    
    const blockedIPs = await securityMonitor.getBlockedIPs({
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 200),
      activeOnly: active === 'true' // 只顯示仍在阻止狀態的 IP
    });
    
    res.json({
      success: true,
      data: blockedIPs.data,
      pagination: {
        page: blockedIPs.page,
        limit: blockedIPs.limit,
        total: blockedIPs.total,
        pages: blockedIPs.pages
      }
    });
    
  } catch (error) {
    logger.error('被阻止 IP 列表獲取失敗', {
      error: error.message,
      ip: req.ip
    });
    
    res.status(500).json({
      error: '被阻止 IP 列表獲取失敗',
      code: 'BLOCKED_IPS_LIST_FAILED'
    });
  }
});

/**
 * POST /security/test-alert - 測試告警系統（僅供測試用）
 */
router.post('/test-alert', requireAdmin, async (req, res) => {
  try {
    await initializeSecurityMonitor();
    
    const { level = 'info', title = 'Test Alert', details } = req.body;
    
    // 驗證告警級別
    if (!['info', 'warning', 'error'].includes(level)) {
      return res.status(400).json({
        error: '告警級別必須是 info, warning, 或 error',
        code: 'INVALID_ALERT_LEVEL'
      });
    }
    
    await securityMonitor.sendAlert(level, title, {
      'Test Details': details || 'This is a test alert',
      'Triggered By': req.ip,
      'Timestamp': new Date().toISOString()
    });
    
    logger.info('測試告警已發送', {
      level: level,
      title: title,
      triggeredBy: req.ip
    });
    
    res.json({
      success: true,
      message: '測試告警已成功發送'
    });
    
  } catch (error) {
    logger.error('測試告警發送失敗', {
      error: error.message,
      ip: req.ip
    });
    
    res.status(500).json({
      error: '測試告警發送失敗',
      code: 'TEST_ALERT_FAILED'
    });
  }
});

/**
 * GET /security/system-status - 獲取安全系統狀態
 */
router.get('/system-status', requireAdmin, async (req, res) => {
  try {
    await initializeSecurityMonitor();
    
    const status = {
      monitoring: {
        active: securityMonitor.isActive(),
        startTime: securityMonitor.getStartTime(),
        uptime: securityMonitor.getUptime()
      },
      alerts: {
        discordWebhook: !!process.env.DISCORD_WEBHOOK_URL,
        sentryIntegration: !!process.env.SENTRY_DSN
      },
      rateLimiting: {
        globalLimitConfigured: !!process.env.GLOBAL_RATE_LIMIT,
        apiSpecificLimits: true
      },
      ipBlocking: {
        enabled: true,
        autoBlockEnabled: securityMonitor.isAutoBlockEnabled()
      }
    };
    
    res.json({
      success: true,
      status: status,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('安全系統狀態獲取失敗', {
      error: error.message,
      ip: req.ip
    });
    
    res.status(500).json({
      error: '安全系統狀態獲取失敗',
      code: 'SYSTEM_STATUS_FAILED'
    });
  }
});

/**
 * GET /security - 安全模組概覽
 */
router.get('/', requireAdmin, async (req, res) => {
  res.json({
    message: 'Mursfoto API Gateway - 安全監控模組',
    endpoints: {
      stats: 'GET /security/stats',
      alerts: 'GET /security/alerts',
      suspiciousActivities: 'GET /security/suspicious-activities',
      blockIP: 'POST /security/block-ip',
      unblockIP: 'DELETE /security/block-ip/:ip',
      blockedIPs: 'GET /security/blocked-ips',
      testAlert: 'POST /security/test-alert',
      systemStatus: 'GET /security/system-status'
    },
    authentication: {
      required: true,
      method: 'X-Admin-Key header'
    },
    rateLimits: {
      windowMs: '15 minutes',
      maxRequests: 30
    }
  });
});

module.exports = router;
