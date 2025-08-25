const axios = require('axios');
const logger = require('../utils/logger');

class SecurityMonitor {
  constructor() {
    this.isActiveFlag = false;
    this.alerts = [];
    this.requestStats = new Map();
    this.suspiciousPatterns = new Map();
    this.blockedIPs = new Set();
    
    // 配置
    this.config = {
      discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
      maxAlertsPerHour: parseInt(process.env.MAX_ALERTS_PER_HOUR) || 10,
      suspiciousThreshold: parseInt(process.env.SUSPICIOUS_THRESHOLD) || 50,
      autoBlockEnabled: process.env.AUTO_BLOCK_ENABLED === 'true',
      alertCooldown: parseInt(process.env.ALERT_COOLDOWN) || 300000, // 5 分鐘
      monitoringEnabled: process.env.SECURITY_MONITORING !== 'false'
    };

    // 可疑活動模式
    this.patterns = {
      // SQL 注入嘗試
      sqlInjection: [
        /(\%27)|(\')|(--)|(\%23)|(#)/i,
        /((\%3D)|(=))[^\n]*((\%27)|(\')|(--)|(\%3B)|(;))/i,
        /\w*((\%27)|('))*((\%6F)|o|(\%4F))*((\%72)|r|(\%52))/i,
        /((\%27)|('))union/i
      ],
      
      // XSS 嘗試
      xss: [
        /(\%3C)|</i,
        /(\%3E)|>/i,
        /(\%3C)|((\%6C)|l|(\%4C))script((\%3E)|>)/i,
        /(\%3C)|((\%69)|i|(\%49))frame/i
      ],
      
      // 路徑遍歷
      pathTraversal: [
        /\.\.\//i,
        /\.\.%2f/i,
        /\.\.%5c/i,
        /%2e%2e%2f/i,
        /%252e%252e%252f/i
      ],

      // 命令注入
      commandInjection: [
        /;|\||&/,
        /`.*`/,
        /\$\(.*\)/
      ]
    };

    // 告警歷史 (用於避免重複告警)
    this.alertHistory = new Map();
    
    this.initializeMonitoring();
  }

  /**
   * 初始化安全監控
   */
  async initialize() {
    try {
      this.isActiveFlag = this.config.monitoringEnabled;
      
      if (this.isActiveFlag) {
        // 啟動清理任務
        this.startCleanupTasks();
        
        // 發送啟動通知
        await this.sendAlert('info', 'Security Monitor Started', {
          'Status': 'Active',
          'Auto Block': this.config.autoBlockEnabled ? 'Enabled' : 'Disabled',
          'Discord Alerts': this.config.discordWebhookUrl ? 'Enabled' : 'Disabled'
        });
        
        logger.info('🛡️  SecurityMonitor 初始化成功');
      } else {
        logger.warn('⚠️  安全監控已停用');
      }
      
      return true;
    } catch (error) {
      logger.error('SecurityMonitor 初始化失敗:', error);
      throw error;
    }
  }

  /**
   * 檢查是否正在監控
   */
  isActive() {
    return this.isActiveFlag;
  }

  /**
   * 記錄請求日誌
   */
  logRequest(req, res, duration) {
    if (!this.isActiveFlag) return;

    const clientIP = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // 記錄請求統計
    if (!this.requestStats.has(clientIP)) {
      this.requestStats.set(clientIP, {
        requests: [],
        blocked: false,
        firstSeen: now
      });
    }

    const ipStats = this.requestStats.get(clientIP);
    ipStats.requests.push({
      timestamp: now,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer')
    });

    // 保持最近 1 小時的請求記錄
    const oneHourAgo = now - (60 * 60 * 1000);
    ipStats.requests = ipStats.requests.filter(r => r.timestamp > oneHourAgo);

    // 分析可疑活動
    this.analyzeRequestPattern(req, res, clientIP);
  }

  /**
   * 分析請求模式
   */
  analyzeRequestPattern(req, res, clientIP) {
    const ipStats = this.requestStats.get(clientIP);
    const recentRequests = ipStats.requests.filter(r => 
      r.timestamp > Date.now() - (10 * 60 * 1000) // 最近 10 分鐘
    );

    // 檢查請求頻率
    if (recentRequests.length > 100) {
      this.reportSuspiciousActivity('high_frequency_requests', {
        ip: clientIP,
        requestCount: recentRequests.length,
        timeWindow: '10 minutes'
      });
    }

    // 檢查錯誤率
    const errorRequests = recentRequests.filter(r => r.statusCode >= 400);
    if (errorRequests.length > 20) {
      this.reportSuspiciousActivity('high_error_rate', {
        ip: clientIP,
        errorCount: errorRequests.length,
        totalRequests: recentRequests.length,
        errorRate: `${Math.round((errorRequests.length / recentRequests.length) * 100)}%`
      });
    }

    // 檢查攻擊模式
    this.checkAttackPatterns(req, clientIP);
  }

  /**
   * 檢查攻擊模式
   */
  checkAttackPatterns(req, clientIP) {
    const url = req.originalUrl || req.url;
    const userAgent = req.get('User-Agent') || '';
    
    // 檢查各種攻擊模式
    for (const [patternType, patterns] of Object.entries(this.patterns)) {
      for (const pattern of patterns) {
        if (pattern.test(url) || pattern.test(userAgent)) {
          this.reportSuspiciousActivity(`${patternType}_attempt`, {
            ip: clientIP,
            url,
            userAgent,
            pattern: pattern.toString()
          });
          
          // 自動阻止嚴重攻擊
          if (['sqlInjection', 'commandInjection'].includes(patternType)) {
            this.autoBlockIP(clientIP, `${patternType} detected`);
          }
          break;
        }
      }
    }

    // 檢查敏感路徑訪問
    const sensitivePaths = [
      '/admin', '/.env', '/config', '/database', '/backup',
      '/wp-admin', '/phpmyadmin', '/.git', '/node_modules'
    ];

    if (sensitivePaths.some(path => url.includes(path))) {
      this.reportSuspiciousActivity('sensitive_path_access', {
        ip: clientIP,
        path: url,
        userAgent
      });
    }

    // 檢查可疑 User-Agent
    const suspiciousUA = [
      'sqlmap', 'nmap', 'nikto', 'dirb', 'gobuster', 'masscan'
    ];

    if (suspiciousUA.some(ua => userAgent.toLowerCase().includes(ua))) {
      this.reportSuspiciousActivity('suspicious_user_agent', {
        ip: clientIP,
        userAgent,
        url
      });
    }
  }

  /**
   * 報告可疑活動
   */
  async reportSuspiciousActivity(activityType, details) {
    if (!this.isActiveFlag) return;

    const alert = {
      id: this.generateAlertId(),
      type: activityType,
      severity: this.getSeverityLevel(activityType),
      timestamp: new Date(),
      details,
      resolved: false
    };

    this.alerts.push(alert);
    
    // 記錄到日誌
    logger.warn(`🚨 可疑活動檢測: ${activityType}`, details);

    // 更新可疑模式統計
    if (!this.suspiciousPatterns.has(activityType)) {
      this.suspiciousPatterns.set(activityType, { count: 0, ips: new Set() });
    }
    
    const pattern = this.suspiciousPatterns.get(activityType);
    pattern.count++;
    if (details.ip) {
      pattern.ips.add(details.ip);
    }

    // 發送告警
    if (this.shouldSendAlert(activityType, details.ip)) {
      await this.sendAlert('warning', `Security Alert: ${activityType}`, {
        'Type': activityType,
        'Severity': alert.severity,
        'IP Address': details.ip || 'Unknown',
        'Details': JSON.stringify(details, null, 2),
        'Time': alert.timestamp.toISOString()
      });
    }

    // 如果是高風險活動，考慮自動阻止
    if (['sqlInjection', 'commandInjection', 'brute_force'].includes(activityType)) {
      this.autoBlockIP(details.ip, activityType);
    }
  }

  /**
   * 自動阻止 IP
   */
  autoBlockIP(ip, reason) {
    if (!this.config.autoBlockEnabled || !ip) return;

    if (!this.blockedIPs.has(ip)) {
      this.blockedIPs.add(ip);
      
      logger.warn(`🚫 自動阻止 IP: ${ip} (原因: ${reason})`);
      
      // 發送阻止通知
      this.sendAlert('error', `IP Address Blocked`, {
        'IP': ip,
        'Reason': reason,
        'Auto Block': 'Yes',
        'Time': new Date().toISOString()
      });

      // 30 分鐘後自動解除阻止
      setTimeout(() => {
        this.blockedIPs.delete(ip);
        logger.info(`✅ IP 自動解除阻止: ${ip}`);
      }, 30 * 60 * 1000);
    }
  }

  /**
   * 檢查 IP 是否被阻止
   */
  isIPBlocked(ip) {
    return this.blockedIPs.has(ip);
  }

  /**
   * 獲取嚴重程度
   */
  getSeverityLevel(activityType) {
    const highSeverity = ['sqlInjection', 'commandInjection', 'brute_force'];
    const mediumSeverity = ['xss', 'pathTraversal', 'high_frequency_requests'];
    
    if (highSeverity.includes(activityType)) return 'high';
    if (mediumSeverity.includes(activityType)) return 'medium';
    return 'low';
  }

  /**
   * 檢查是否應該發送告警
   */
  shouldSendAlert(activityType, ip) {
    const alertKey = `${activityType}:${ip}`;
    const now = Date.now();
    
    // 檢查告警冷卻時間
    if (this.alertHistory.has(alertKey)) {
      const lastAlert = this.alertHistory.get(alertKey);
      if (now - lastAlert < this.config.alertCooldown) {
        return false; // 在冷卻時間內
      }
    }

    // 檢查每小時告警限制
    const oneHourAgo = now - (60 * 60 * 1000);
    const recentAlerts = this.alerts.filter(alert => 
      alert.timestamp.getTime() > oneHourAgo
    );

    if (recentAlerts.length >= this.config.maxAlertsPerHour) {
      return false;
    }

    // 記錄本次告警
    this.alertHistory.set(alertKey, now);
    return true;
  }

  /**
   * 發送告警到 Discord
   */
  async sendAlert(level, title, fields) {
    if (!this.config.discordWebhookUrl) {
      logger.debug('Discord webhook 未配置，跳過告警發送');
      return;
    }

    try {
      const colors = {
        info: 0x3498db,    // 藍色
        warning: 0xf39c12, // 橙色
        error: 0xe74c3c    // 紅色
      };

      const embed = {
        title: `🛡️ ${title}`,
        color: colors[level] || colors.info,
        timestamp: new Date().toISOString(),
        fields: Object.entries(fields).map(([name, value]) => ({
          name,
          value: String(value),
          inline: true
        })),
        footer: {
          text: 'Mursfoto API Gateway Security Monitor'
        }
      };

      await axios.post(this.config.discordWebhookUrl, {
        embeds: [embed]
      });

      logger.debug(`Discord 告警已發送: ${title}`);
    } catch (error) {
      logger.error('發送 Discord 告警失敗:', error.message);
    }
  }

  /**
   * 獲取安全統計資料
   */
  getSecurityStats() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    const recentAlerts = this.alerts.filter(alert => 
      alert.timestamp.getTime() > oneDayAgo
    );

    const hourlyAlerts = recentAlerts.filter(alert => 
      alert.timestamp.getTime() > oneHourAgo
    );

    // 統計各類活動
    const activityStats = {};
    for (const [type, data] of this.suspiciousPatterns.entries()) {
      activityStats[type] = {
        count: data.count,
        uniqueIPs: data.ips.size
      };
    }

    return {
      monitoring: {
        active: this.isActiveFlag,
        autoBlock: this.config.autoBlockEnabled
      },
      alerts: {
        total: this.alerts.length,
        last24h: recentAlerts.length,
        lastHour: hourlyAlerts.length
      },
      blockedIPs: {
        current: this.blockedIPs.size,
        list: Array.from(this.blockedIPs)
      },
      activities: activityStats,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 生成告警 ID
   */
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 啟動清理任務
   */
  startCleanupTasks() {
    // 每小時清理一次舊資料
    setInterval(() => {
      this.cleanupOldData();
    }, 60 * 60 * 1000);

    // 每 5 分鐘清理告警歷史
    setInterval(() => {
      this.cleanupAlertHistory();
    }, 5 * 60 * 1000);
  }

  /**
   * 清理舊資料
   */
  cleanupOldData() {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    let cleanedRequests = 0;
    let cleanedAlerts = 0;

    // 清理舊的請求統計
    for (const [ip, stats] of this.requestStats.entries()) {
      const validRequests = stats.requests.filter(r => r.timestamp > oneDayAgo);
      if (validRequests.length !== stats.requests.length) {
        stats.requests = validRequests;
        cleanedRequests += (stats.requests.length - validRequests.length);
      }

      // 如果沒有最近的請求，刪除整個 IP 記錄
      if (validRequests.length === 0) {
        this.requestStats.delete(ip);
      }
    }

    // 清理舊的告警記錄 (保留最近 7 天)
    const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const validAlerts = this.alerts.filter(alert => 
      alert.timestamp.getTime() > weekAgo
    );
    
    cleanedAlerts = this.alerts.length - validAlerts.length;
    this.alerts = validAlerts;

    if (cleanedRequests > 0 || cleanedAlerts > 0) {
      logger.info(`🧹 安全資料清理: ${cleanedRequests} requests, ${cleanedAlerts} alerts`);
    }
  }

  /**
   * 清理告警歷史
   */
  cleanupAlertHistory() {
    const now = Date.now();
    const cooldownExpired = now - this.config.alertCooldown;

    for (const [key, timestamp] of this.alertHistory.entries()) {
      if (timestamp < cooldownExpired) {
        this.alertHistory.delete(key);
      }
    }
  }

  /**
   * 初始化監控 (私有方法)
   */
  initializeMonitoring() {
    // 這裡可以添加額外的初始化邏輯
    logger.debug('SecurityMonitor 監控系統準備就緒');
  }
}

module.exports = SecurityMonitor;
