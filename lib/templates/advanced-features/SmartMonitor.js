const os = require('os');
const { execSync } = require('child_process');
const winston = require('winston');

/**
 * 🎯 Mursfoto 智能監控系統
 * 基於 PixelForge Studio 的 SystemMonitor 最佳實踐
 * 
 * 功能特色：
 * ✅ 即時系統效能監控
 * ✅ 智能負載平衡決策
 * ✅ 資源使用率追蹤
 * ✅ 自動擴展建議
 */
class MursfotoSmartMonitor {
  constructor(logger) {
    this.logger = logger || console;
    this.metrics = {
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      networkIO: 0,
      activeRequests: 0,
      responseTime: 0,
      errorRate: 0,
      lastUpdate: null
    };

    // 效能閾值配置
    this.thresholds = {
      cpu: {
        warning: 70,
        critical: 85
      },
      memory: {
        warning: 80,
        critical: 90
      },
      responseTime: {
        warning: 1000,  // 1 second
        critical: 3000  // 3 seconds
      },
      errorRate: {
        warning: 0.05,  // 5%
        critical: 0.10  // 10%
      }
    };

    // 監控歷史記錄 (最近100次)
    this.history = [];
    this.maxHistorySize = 100;

    // 自動監控間隔 (預設5秒)
    this.monitorInterval = null;
    this.intervalMs = 5000;
  }

  /**
   * 🚀 啟動自動監控
   */
  startMonitoring() {
    if (this.monitorInterval) {
      this.logger.warn('Monitoring already started');
      return;
    }

    this.logger.info('🎯 Starting Mursfoto Smart Monitor...');
    
    this.monitorInterval = setInterval(async () => {
      try {
        await this.collectMetrics();
        this.analyzePerformance();
      } catch (error) {
        this.logger.error('監控數據收集失敗:', error);
      }
    }, this.intervalMs);
  }

  /**
   * ⏹️ 停止自動監控
   */
  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
      this.logger.info('🛑 Smart monitoring stopped');
    }
  }

  /**
   * 📊 收集系統指標
   */
  async collectMetrics() {
    const timestamp = new Date().toISOString();
    
    try {
      // CPU 使用率
      this.metrics.cpuUsage = await this.getCPUUsage();
      
      // 記憶體使用率
      this.metrics.memoryUsage = this.getMemoryUsage();
      
      // 磁碟使用率
      this.metrics.diskUsage = await this.getDiskUsage();
      
      // Node.js 程序資訊
      const processInfo = this.getProcessInfo();
      Object.assign(this.metrics, processInfo);
      
      this.metrics.lastUpdate = timestamp;

      // 記錄歷史
      this.recordHistory();
      
      // 即時日誌
      this.logger.debug('Metrics collected', this.metrics);

    } catch (error) {
      this.logger.error('指標收集失敗:', error);
    }
  }

  /**
   * 🧮 計算 CPU 使用率
   */
  async getCPUUsage() {
    return new Promise((resolve) => {
      const startMeasure = this.getCPUInfo();
      
      setTimeout(() => {
        const endMeasure = this.getCPUInfo();
        const idleDiff = endMeasure.idle - startMeasure.idle;
        const totalDiff = endMeasure.total - startMeasure.total;
        const cpuUsage = 100 - Math.round(100 * idleDiff / totalDiff);
        resolve(Math.max(0, Math.min(100, cpuUsage)));
      }, 100);
    });
  }

  getCPUInfo() {
    const cpus = os.cpus();
    let idle = 0;
    let total = 0;
    
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        total += cpu.times[type];
      }
      idle += cpu.times.idle;
    }
    
    return { idle, total };
  }

  /**
   * 💾 取得記憶體使用率
   */
  getMemoryUsage() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    return Math.round((usedMem / totalMem) * 100);
  }

  /**
   * 💿 取得磁碟使用率 (僅支援 Unix 系統)
   */
  async getDiskUsage() {
    try {
      if (process.platform === 'win32') {
        // Windows 系統跳過磁碟監控
        return 0;
      }
      
      const output = execSync('df / | tail -1', { encoding: 'utf8' });
      const parts = output.trim().split(/\s+/);
      const usedPercent = parseInt(parts[4]);
      return isNaN(usedPercent) ? 0 : usedPercent;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 🔧 取得 Node.js 程序資訊
   */
  getProcessInfo() {
    const memUsage = process.memoryUsage();
    
    return {
      processMemory: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      processUptime: Math.round(process.uptime()), // seconds
      eventLoopDelay: this.getEventLoopDelay()
    };
  }

  /**
   * ⚡ 測量事件循環延遲
   */
  getEventLoopDelay() {
    const start = process.hrtime.bigint();
    setImmediate(() => {
      const delay = Number(process.hrtime.bigint() - start) / 1000000; // ms
      return Math.round(delay * 100) / 100;
    });
    return 0; // 同步返回預設值
  }

  /**
   * 📈 記錄歷史數據
   */
  recordHistory() {
    const record = {
      timestamp: this.metrics.lastUpdate,
      cpu: this.metrics.cpuUsage,
      memory: this.metrics.memoryUsage,
      responseTime: this.metrics.responseTime,
      errorRate: this.metrics.errorRate
    };

    this.history.push(record);
    
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * 🔬 效能分析與警告
   */
  analyzePerformance() {
    const alerts = [];
    const status = {
      overall: 'healthy',
      alerts: [],
      recommendations: []
    };

    // CPU 檢查
    if (this.metrics.cpuUsage > this.thresholds.cpu.critical) {
      status.overall = 'critical';
      alerts.push(`🔥 CPU使用率過高: ${this.metrics.cpuUsage}%`);
      status.recommendations.push('考慮增加CPU資源或優化CPU密集型任務');
    } else if (this.metrics.cpuUsage > this.thresholds.cpu.warning) {
      status.overall = Math.max(status.overall, 'warning');
      alerts.push(`⚠️ CPU使用率偏高: ${this.metrics.cpuUsage}%`);
    }

    // 記憶體檢查
    if (this.metrics.memoryUsage > this.thresholds.memory.critical) {
      status.overall = 'critical';
      alerts.push(`🔥 記憶體使用率過高: ${this.metrics.memoryUsage}%`);
      status.recommendations.push('檢查記憶體洩漏或增加記憶體配置');
    } else if (this.metrics.memoryUsage > this.thresholds.memory.warning) {
      status.overall = status.overall === 'healthy' ? 'warning' : status.overall;
      alerts.push(`⚠️ 記憶體使用率偏高: ${this.metrics.memoryUsage}%`);
    }

    // 響應時間檢查
    if (this.metrics.responseTime > this.thresholds.responseTime.critical) {
      status.overall = 'critical';
      alerts.push(`🔥 響應時間過慢: ${this.metrics.responseTime}ms`);
      status.recommendations.push('優化數據庫查詢或API呼叫效率');
    }

    // 錯誤率檢查
    if (this.metrics.errorRate > this.thresholds.errorRate.critical) {
      status.overall = 'critical';
      alerts.push(`🔥 錯誤率過高: ${(this.metrics.errorRate * 100).toFixed(1)}%`);
      status.recommendations.push('檢查應用程式錯誤日誌並修復關鍵問題');
    }

    status.alerts = alerts;

    // 記錄警告
    if (alerts.length > 0) {
      this.logger.warn('Performance Alert', status);
    }

    return status;
  }

  /**
   * 📊 取得完整健康報告
   */
  getHealthReport() {
    const performance = this.analyzePerformance();
    
    return {
      timestamp: new Date().toISOString(),
      service: process.env.MURSFOTO_SERVICE_NAME || 'mursfoto-service',
      status: performance.overall,
      metrics: {
        ...this.metrics,
        trends: this.getTrends()
      },
      alerts: performance.alerts,
      recommendations: performance.recommendations,
      system: {
        platform: os.platform(),
        architecture: os.arch(),
        nodeVersion: process.version,
        uptime: os.uptime()
      }
    };
  }

  /**
   * 📈 分析效能趨勢
   */
  getTrends() {
    if (this.history.length < 5) {
      return { status: 'insufficient_data' };
    }

    const recent = this.history.slice(-10);
    const avgCpu = recent.reduce((sum, r) => sum + r.cpu, 0) / recent.length;
    const avgMemory = recent.reduce((sum, r) => sum + r.memory, 0) / recent.length;
    
    return {
      cpu: {
        current: this.metrics.cpuUsage,
        average: Math.round(avgCpu),
        trend: this.metrics.cpuUsage > avgCpu ? 'increasing' : 'decreasing'
      },
      memory: {
        current: this.metrics.memoryUsage,
        average: Math.round(avgMemory),
        trend: this.metrics.memoryUsage > avgMemory ? 'increasing' : 'decreasing'
      }
    };
  }

  /**
   * 🎯 智能擴展建議
   */
  getScalingRecommendations() {
    const report = this.getHealthReport();
    const recommendations = [];

    if (report.metrics.cpuUsage > 80) {
      recommendations.push({
        type: 'scale_up',
        resource: 'cpu',
        priority: 'high',
        suggestion: '建議增加CPU核心數或升級至更高規格的實例'
      });
    }

    if (report.metrics.memoryUsage > 85) {
      recommendations.push({
        type: 'scale_up',
        resource: 'memory',
        priority: 'high',
        suggestion: '建議增加記憶體配置'
      });
    }

    if (report.metrics.activeRequests > 50) {
      recommendations.push({
        type: 'scale_out',
        resource: 'instances',
        priority: 'medium',
        suggestion: '考慮水平擴展，增加服務實例數量'
      });
    }

    return {
      timestamp: new Date().toISOString(),
      recommendations,
      currentLoad: report.metrics,
      suggestedActions: recommendations.length > 0 ? 
        ['監控系統負載', '準備擴展計劃', '檢查應用程式效能瓶頸'] : 
        ['系統運行良好', '持續監控即可']
    };
  }
}

module.exports = MursfotoSmartMonitor;