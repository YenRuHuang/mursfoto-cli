const express = require('express');
const rateLimit = require('express-rate-limit');
const TokenManager = require('../security/TokenManager');
const SecurityMonitor = require('../security/SecurityMonitor');
const logger = require('../utils/logger');

const router = express.Router();

// Token 管理 API 的速率限制
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 50, // 每 15 分鐘最多 50 次請求
  message: {
    error: 'Token 管理 API 請求過於頻繁',
    retryAfter: '15分鐘'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Token 生成的嚴格速率限制
const tokenCreateRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 小時
  max: 10, // 每小時最多 10 個新 token
  message: {
    error: 'Token 生成請求過於頻繁，請稍後再試',
    retryAfter: '1小時'
  }
});

// 應用速率限制到所有 auth 路由
router.use(authRateLimit);

// 初始化管理器（如果尚未初始化）
let tokenManager = null;
let securityMonitor = null;

async function initializeManagers() {
  if (!tokenManager) {
    tokenManager = new TokenManager();
    await tokenManager.initialize();
  }
  if (!securityMonitor) {
    securityMonitor = new SecurityMonitor();
    await securityMonitor.initialize();
  }
}

// 管理員驗證中間件（簡單的 API key 驗證）
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
    securityMonitor?.reportSuspiciousActivity('unauthorized_admin_access', {
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
 * POST /auth/tokens - 生成新的 API Token
 */
router.post('/tokens', tokenCreateRateLimit, requireAdmin, async (req, res) => {
  try {
    await initializeManagers();
    
    const { name, description, expiresIn, permissions } = req.body;
    
    // 驗證必要參數
    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        error: 'Token 名稱是必需的',
        code: 'INVALID_NAME'
      });
    }
    
    // 驗證權限格式
    if (permissions && (!Array.isArray(permissions) || !permissions.every(p => typeof p === 'string'))) {
      return res.status(400).json({
        error: '權限必須是字串陣列',
        code: 'INVALID_PERMISSIONS'
      });
    }
    
    // 生成 Token
    const tokenData = await tokenManager.generateToken({
      name: name.trim(),
      description: description?.trim(),
      expiresIn: expiresIn || '30d', // 預設 30 天
      permissions: permissions || ['api:read', 'api:write'],
      createdBy: req.ip,
      metadata: {
        userAgent: req.get('User-Agent'),
        createdAt: new Date().toISOString()
      }
    });
    
    // 記錄 Token 生成事件
    logger.info('新的 API Token 已生成', {
      tokenId: tokenData.id,
      name: tokenData.name,
      expiresAt: tokenData.expiresAt,
      createdBy: req.ip
    });
    
    // 發送安全告警
    await securityMonitor.sendAlert('info', 'New API Token Created', {
      'Token ID': tokenData.id,
      'Token Name': tokenData.name,
      'Created By': req.ip,
      'Expires At': tokenData.expiresAt
    });
    
    res.status(201).json({
      success: true,
      token: tokenData,
      message: 'Token 已成功生成'
    });
    
  } catch (error) {
    logger.error('Token 生成失敗', {
      error: error.message,
      ip: req.ip,
      body: req.body
    });
    
    res.status(500).json({
      error: 'Token 生成失敗',
      code: 'TOKEN_GENERATION_FAILED',
      message: error.message
    });
  }
});

/**
 * GET /auth/tokens - 列出所有 Token（不包含實際 token 值）
 */
router.get('/tokens', requireAdmin, async (req, res) => {
  try {
    await initializeManagers();
    
    const { page = 1, limit = 20, status } = req.query;
    
    const tokens = await tokenManager.listTokens({
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100), // 最多 100 個
      status: status // 'active', 'expired', 'revoked'
    });
    
    // 移除敏感資料
    const safeTokens = tokens.data.map(token => ({
      id: token.id,
      name: token.name,
      description: token.description,
      status: token.status,
      permissions: token.permissions,
      createdAt: token.createdAt,
      expiresAt: token.expiresAt,
      lastUsedAt: token.lastUsedAt,
      usageCount: token.usageCount,
      createdBy: token.createdBy
    }));
    
    res.json({
      success: true,
      data: safeTokens,
      pagination: {
        page: tokens.page,
        limit: tokens.limit,
        total: tokens.total,
        pages: tokens.pages
      }
    });
    
  } catch (error) {
    logger.error('Token 列表獲取失敗', {
      error: error.message,
      ip: req.ip
    });
    
    res.status(500).json({
      error: 'Token 列表獲取失敗',
      code: 'TOKEN_LIST_FAILED'
    });
  }
});

/**
 * GET /auth/tokens/:id/stats - 獲取特定 Token 的統計資料
 */
router.get('/tokens/:id/stats', requireAdmin, async (req, res) => {
  try {
    await initializeManagers();
    
    const { id } = req.params;
    const { timeRange = '7d' } = req.query;
    
    const stats = await tokenManager.getTokenStats(id, timeRange);
    
    if (!stats) {
      return res.status(404).json({
        error: '找不到指定的 Token',
        code: 'TOKEN_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      stats: stats
    });
    
  } catch (error) {
    logger.error('Token 統計獲取失敗', {
      error: error.message,
      tokenId: req.params.id,
      ip: req.ip
    });
    
    res.status(500).json({
      error: 'Token 統計獲取失敗',
      code: 'TOKEN_STATS_FAILED'
    });
  }
});

/**
 * PUT /auth/tokens/:id - 更新 Token 資訊（不包含實際 token 值）
 */
router.put('/tokens/:id', requireAdmin, async (req, res) => {
  try {
    await initializeManagers();
    
    const { id } = req.params;
    const { name, description, permissions } = req.body;
    
    const updatedToken = await tokenManager.updateToken(id, {
      name: name?.trim(),
      description: description?.trim(),
      permissions: permissions,
      updatedBy: req.ip,
      updatedAt: new Date().toISOString()
    });
    
    if (!updatedToken) {
      return res.status(404).json({
        error: '找不到指定的 Token',
        code: 'TOKEN_NOT_FOUND'
      });
    }
    
    logger.info('Token 資訊已更新', {
      tokenId: id,
      updatedBy: req.ip
    });
    
    res.json({
      success: true,
      token: {
        id: updatedToken.id,
        name: updatedToken.name,
        description: updatedToken.description,
        permissions: updatedToken.permissions,
        updatedAt: updatedToken.updatedAt
      },
      message: 'Token 資訊已成功更新'
    });
    
  } catch (error) {
    logger.error('Token 更新失敗', {
      error: error.message,
      tokenId: req.params.id,
      ip: req.ip
    });
    
    res.status(500).json({
      error: 'Token 更新失敗',
      code: 'TOKEN_UPDATE_FAILED'
    });
  }
});

/**
 * DELETE /auth/tokens/:id - 撤銷指定的 Token
 */
router.delete('/tokens/:id', requireAdmin, async (req, res) => {
  try {
    await initializeManagers();
    
    const { id } = req.params;
    
    const success = await tokenManager.revokeToken(id, {
      revokedBy: req.ip,
      revokedAt: new Date().toISOString(),
      reason: 'manual_revocation'
    });
    
    if (!success) {
      return res.status(404).json({
        error: '找不到指定的 Token 或已被撤銷',
        code: 'TOKEN_NOT_FOUND_OR_REVOKED'
      });
    }
    
    logger.info('Token 已撤銷', {
      tokenId: id,
      revokedBy: req.ip
    });
    
    // 發送安全告警
    await securityMonitor.sendAlert('warning', 'API Token Revoked', {
      'Token ID': id,
      'Revoked By': req.ip,
      'Reason': 'Manual revocation'
    });
    
    res.json({
      success: true,
      message: 'Token 已成功撤銷'
    });
    
  } catch (error) {
    logger.error('Token 撤銷失敗', {
      error: error.message,
      tokenId: req.params.id,
      ip: req.ip
    });
    
    res.status(500).json({
      error: 'Token 撤銷失敗',
      code: 'TOKEN_REVOCATION_FAILED'
    });
  }
});

/**
 * POST /auth/tokens/:id/refresh - 刷新 Token 的過期時間
 */
router.post('/tokens/:id/refresh', requireAdmin, async (req, res) => {
  try {
    await initializeManagers();
    
    const { id } = req.params;
    const { expiresIn = '30d' } = req.body;
    
    const refreshedToken = await tokenManager.refreshToken(id, {
      expiresIn: expiresIn,
      refreshedBy: req.ip,
      refreshedAt: new Date().toISOString()
    });
    
    if (!refreshedToken) {
      return res.status(404).json({
        error: '找不到指定的 Token 或已被撤銷',
        code: 'TOKEN_NOT_FOUND_OR_REVOKED'
      });
    }
    
    logger.info('Token 已刷新', {
      tokenId: id,
      newExpiresAt: refreshedToken.expiresAt,
      refreshedBy: req.ip
    });
    
    res.json({
      success: true,
      token: {
        id: refreshedToken.id,
        expiresAt: refreshedToken.expiresAt,
        refreshedAt: refreshedToken.refreshedAt
      },
      message: 'Token 有效期已成功延長'
    });
    
  } catch (error) {
    logger.error('Token 刷新失敗', {
      error: error.message,
      tokenId: req.params.id,
      ip: req.ip
    });
    
    res.status(500).json({
      error: 'Token 刷新失敗',
      code: 'TOKEN_REFRESH_FAILED'
    });
  }
});

/**
 * GET /auth/validate - 驗證當前 Token（供客戶端檢查用）
 */
router.get('/validate', async (req, res) => {
  try {
    await initializeManagers();
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        valid: false,
        error: '缺少 Token',
        code: 'TOKEN_MISSING'
      });
    }
    
    const validation = await tokenManager.validateTokenDetailed(token);
    
    res.json({
      valid: validation.valid,
      token: validation.valid ? {
        id: validation.payload.tokenId,
        name: validation.payload.name,
        permissions: validation.payload.permissions,
        expiresAt: validation.payload.exp ? new Date(validation.payload.exp * 1000).toISOString() : null,
        remainingTime: validation.payload.exp ? Math.max(0, validation.payload.exp - Math.floor(Date.now() / 1000)) : null
      } : null,
      error: validation.valid ? null : validation.error
    });
    
  } catch (error) {
    logger.error('Token 驗證失敗', {
      error: error.message,
      ip: req.ip
    });
    
    res.status(500).json({
      valid: false,
      error: 'Token 驗證服務錯誤',
      code: 'VALIDATION_SERVICE_ERROR'
    });
  }
});

/**
 * GET /auth/stats - 獲取整體 Token 統計
 */
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    await initializeManagers();
    
    const stats = await tokenManager.getOverallStats();
    
    res.json({
      success: true,
      stats: stats
    });
    
  } catch (error) {
    logger.error('整體統計獲取失敗', {
      error: error.message,
      ip: req.ip
    });
    
    res.status(500).json({
      error: '整體統計獲取失敗',
      code: 'OVERALL_STATS_FAILED'
    });
  }
});

module.exports = router;
