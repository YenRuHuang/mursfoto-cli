/**
 * 🖥️ mursfoto-cli GUI 應用程式
 * 處理前端邏輯、WebSocket 連接和使用者互動
 */

class MursfotoGUI {
    /**
     * 📊 數據視覺化增強功能
     */
    
    // 創建圓形進度條
    createCircularProgress(percentage, label) {
        const size = 60;
        const strokeWidth = 4;
        const radius = (size - strokeWidth) / 2;
        const circumference = radius * 2 * Math.PI;
        const strokeDasharray = circumference;
        const strokeDashoffset = circumference - (percentage / 100) * circumference;
        
        return `
            <div class="circular-progress" title="${label}: ${percentage}%">
                <svg width="${size}" height="${size}" class="circular-chart">
                    <circle
                        cx="${size/2}"
                        cy="${size/2}"
                        r="${radius}"
                        stroke="rgba(255,255,255,0.1)"
                        stroke-width="${strokeWidth}"
                        fill="none"
                    />
                    <circle
                        cx="${size/2}"
                        cy="${size/2}"
                        r="${radius}"
                        stroke="var(--primary-color)"
                        stroke-width="${strokeWidth}"
                        fill="none"
                        stroke-dasharray="${strokeDasharray}"
                        stroke-dashoffset="${strokeDashoffset}"
                        stroke-linecap="round"
                        transform="rotate(-90 ${size/2} ${size/2})"
                        class="progress-ring"
                    />
                </svg>
                <div class="percentage">${percentage}%</div>
            </div>
        `;
    }
    
    // 創建迷你趨勢圖
    createMiniChart(data, label) {
        const width = 80;
        const height = 30;
        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = max - min || 1;
        
        const points = data.map((value, index) => {
            const x = (index / (data.length - 1)) * width;
            const y = height - ((value - min) / range) * height;
            return `${x},${y}`;
        }).join(' ');
        
        const trend = data[data.length - 1] > data[0] ? 'up' : 'down';
        const trendIcon = trend === 'up' ? '↗️' : '↘️';
        
        return `
            <div class="mini-chart" title="${label} 趨勢: ${trend}">
                <svg width="${width}" height="${height}" class="trend-chart">
                    <polyline
                        points="${points}"
                        stroke="var(--primary-color)"
                        stroke-width="2"
                        fill="none"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:var(--primary-color);stop-opacity:0.3" />
                        <stop offset="100%" style="stop-color:var(--primary-color);stop-opacity:0" />
                    </linearGradient>
                    <polygon
                        points="${points} ${width},${height} 0,${height}"
                        fill="url(#chartGradient)"
                    />
                </svg>
                <span class="trend-indicator">${trendIcon}</span>
            </div>
        `;
    }
    
    // 創建狀態指示燈
    createStatusIndicator(status, label) {
        const statusConfig = {
            online: { color: '#10b981', icon: '🟢', text: '線上' },
            offline: { color: '#ef4444', icon: '🔴', text: '離線' },
            warning: { color: '#f59e0b', icon: '🟡', text: '警告' },
            loading: { color: '#6b7280', icon: '⚪', text: '載入中' }
        };
        
        const config = statusConfig[status] || statusConfig.offline;
        
        return `
            <div class="status-indicator-enhanced" title="${label}: ${config.text}">
                <div class="status-dot" style="background-color: ${config.color}"></div>
                <span class="status-text">${config.icon} ${config.text}</span>
                <div class="status-pulse" style="background-color: ${config.color}"></div>
            </div>
        `;
    }

  constructor() {
    this.socket = null
    this.connected = false
    this.lastStatus = null
    
    // DOM 元素
    this.elements = {
      connectionStatus: document.getElementById('connection-status'),
      servicesGrid: document.getElementById('services-grid'),
      statsGrid: document.getElementById('stats-grid'),
      environmentTab: document.getElementById('environment-tab'),
      aiRouterTab: document.getElementById('ai-router-tab'),
      guiTab: document.getElementById('gui-tab'),
      testButton: document.getElementById('test-button'),
      serviceSelect: document.getElementById('service-select'),
      testPrompt: document.getElementById('test-prompt'),
      testResults: document.getElementById('test-results'),
      systemInfo: document.getElementById('system-info'),
      loadingOverlay: document.getElementById('loading-overlay'),
      toastContainer: document.getElementById('toast-container')
    }
    
    this.init()
  }
  
  /**
   * 🚀 初始化應用程式
   */
  async init() {
    try {
      this.logger?.info('🖥️ 初始化 mursfoto-cli GUI...')
      
      // 設置事件監聽器
      this.setupEventListeners()
      
      // 連接 WebSocket
      await this.connectSocket()
      
      // 初始載入完成
      this.hideLoading()
      
      this.logger?.info('✅ GUI 初始化完成')
      
    } catch (error) {
      console.error('❌ GUI 初始化失敗:', error)
      this.showToast('GUI 初始化失敗: ' + error.message, 'error')
      this.hideLoading()
    }
  }
  
  /**
   * 🔌 連接 WebSocket
   */
  async connectSocket() {
    try {
      this.socket = io()
      
      this.socket.on('connect', () => {
        this.logger?.info('🔗 WebSocket 連接成功')
        this.connected = true
        this.updateConnectionStatus('已連接', 'connected')
        this.showToast('已連接到服務器', 'success')
      })
      
      this.socket.on('disconnect', () => {
        this.logger?.info('🔌 WebSocket 連接斷開')
        this.connected = false
        this.updateConnectionStatus('連接中斷', 'disconnected')
        this.showToast('與服務器的連接已中斷', 'warning')
      })
      
      this.socket.on('system-status', (status) => {
        this.handleStatusUpdate(status)
      })
      
      this.socket.on('stats-update', (stats) => {
        this.updateStats(stats)
      })
      
      this.socket.on('test-result', (result) => {
        this.displayTestResult(result)
      })
      
      this.socket.on('test-error', (error) => {
        this.displayTestError(error)
      })
      
    } catch (error) {
      console.error('❌ WebSocket 連接失敗:', error)
      this.updateConnectionStatus('連接失敗', 'disconnected')
      throw error
    }
  }
  
  /**
   * 📡 設置事件監聽器
   */
  setupEventListeners() {
    // 頁籤切換
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab)
      })
    })
    
    // 測試按鈕
    this.elements.testButton.addEventListener('click', () => {
      this.runServiceTest()
    })
    
    // Enter 鍵測試
    this.elements.testPrompt.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.runServiceTest()
      }
    })
    
    // 定期請求狀態更新
    setInterval(() => {
      if (this.connected && this.socket) {
        this.socket.emit('request-status')
      }
    }, 10000) // 每 10 秒
  }
  
  /**
   * 🔄 處理狀態更新
   */
  handleStatusUpdate(status) {
    this.logger?.info('📊 收到狀態更新:', status)
    this.lastStatus = status
    
    this.updateServices(status.services)
    this.updateStats(status.stats)
    this.updateConfiguration(status.config)
    this.updateSystemInfo(status.system)
  }
  
  /**
   * 🔧 更新服務狀態
   */
  updateServices(services) {
    const grid = this.elements.servicesGrid
    grid.innerHTML = ''
    
    Object.entries(services).forEach(([key, service]) => {
      const card = this.createServiceCard(service)
      grid.appendChild(card)
    })
  }
  
  /**
   * 🏗️ 創建服務卡片
   */
  createServiceCard(service) {
    const card = document.createElement('div')
    card.className = `service-card ${service.healthy ? 'healthy' : 'unhealthy'}`
    
    const statusText = service.healthy ? '✅ 正常' : '❌ 異常'
    const statusClass = service.healthy ? 'healthy' : 'unhealthy'
    
    card.innerHTML = `
      <div class="service-header">
        <div class="service-name">${service.name}</div>
        <div class="service-status ${statusClass}">
          ${statusText}
        </div>
      </div>
      <div class="service-details">
        <div class="service-detail">
          <strong>端點:</strong>
          <span>${service.endpoint}</span>
        </div>
        <div class="service-detail">
          <strong>模型:</strong>
          <span>${service.model}</span>
        </div>
        <div class="service-detail">
          <strong>檢查時間:</strong>
          <span>${this.formatDateTime(service.lastChecked)}</span>
        </div>
      </div>
    `
    
    return card
  }
  
  /**
   * 📊 更新統計資料
   */
  updateStats(stats) {
    const grid = this.elements.statsGrid
    grid.innerHTML = ''
    
    const statsConfig = [
      { key: 'totalRequests', label: '總請求數', value: stats.totalRequests || 0 },
      { key: 'successfulRequests', label: '成功請求', value: stats.successfulRequests || 0 },
      { key: 'failedRequests', label: '失敗請求', value: stats.failedRequests || 0 },
      { key: 'averageResponseTime', label: '平均響應時間', value: `${stats.averageResponseTime || 0}ms` },
      { key: 'lmStudioRequests', label: 'LM Studio', value: stats.methodCounts?.lmstudio || 0 },
      { key: 'ollamaRequests', label: 'Ollama', value: stats.methodCounts?.ollama || 0 },
      { key: 'claudeRequests', label: 'Claude', value: stats.methodCounts?.claude || 0 },
      { key: 'clineRequests', label: 'Cline', value: stats.methodCounts?.cline || 0 }
    ]
    
    statsConfig.forEach(stat => {
      const card = document.createElement('div')
      card.className = 'stat-card'
      card.innerHTML = `
        <div class="stat-value">${stat.value}</div>
        <div class="stat-label">${stat.label}</div>
      `
      grid.appendChild(card)
    })
  }
  
  /**
   * ⚙️ 更新配置資訊
   */
  updateConfiguration(config) {
    // 環境變數頁籤
    this.updateConfigTab(this.elements.environmentTab, config.environment)
    
    // AI 路由器頁籤
    this.updateConfigTab(this.elements.aiRouterTab, config.aiRouter)
    
    // GUI 設定頁籤
    this.updateConfigTab(this.elements.guiTab, config.gui)
  }
  
  /**
   * 📋 更新配置頁籤
   */
  updateConfigTab(element, configData) {
    const grid = document.createElement('div')
    grid.className = 'config-grid'
    
    Object.entries(configData).forEach(([key, value]) => {
      const item = document.createElement('div')
      item.className = 'config-item'
      item.innerHTML = `
        <span class="config-key">${key}</span>
        <span class="config-value">${value}</span>
      `
      grid.appendChild(item)
    })
    
    element.innerHTML = ''
    element.appendChild(grid)
  }
  
  /**
   * 💻 更新系統資訊
   */
  updateSystemInfo(system) {
    const container = this.elements.systemInfo
    container.innerHTML = ''
    
    const systemStats = [
      { label: '運行時間', value: this.formatUptime(system.uptime) },
      { label: '記憶體使用', value: this.formatMemory(system.memory.heapUsed) },
      { label: '平台', value: system.platform },
      { label: 'Node 版本', value: system.nodeVersion },
      { label: '進程 ID', value: system.pid }
    ]
    
    systemStats.forEach(stat => {
      const item = document.createElement('div')
      item.className = 'system-info-item'
      item.innerHTML = `
        <strong>${stat.label}:</strong>
        <span>${stat.value}</span>
      `
      container.appendChild(item)
    })
  }
  
  /**
   * 🧪 執行服務測試
   */
  async runServiceTest() {
    const service = this.elements.serviceSelect.value
    const prompt = this.elements.testPrompt.value.trim()
    
    if (!prompt) {
      this.showToast('請輸入測試訊息', 'warning')
      return
    }
    
    if (!this.connected) {
      this.showToast('未連接到服務器', 'error')
      return
    }
    
    // 禁用按鈕並顯示載入狀態
    this.elements.testButton.disabled = true
    this.elements.testButton.innerHTML = '🔄 測試中...'
    
    try {
      // 透過 Socket.IO 發送測試請求
      this.socket.emit('test-service', { service, prompt })
      
    } catch (error) {
      console.error('❌ 測試請求失敗:', error)
      this.showToast('測試請求失敗: ' + error.message, 'error')
      this.resetTestButton()
    }
  }
  
  /**
   * 📋 顯示測試結果
   */
  displayTestResult(result) {
    this.resetTestButton()
    
    const resultDiv = document.createElement('div')
    resultDiv.className = `test-result ${result.success ? 'success' : 'error'}`
    
    const timestamp = new Date(result.timestamp).toLocaleString('zh-TW')
    const responseTime = result.responseTime
    
    resultDiv.innerHTML = `
      <div class="test-result-header">
        <span><strong>服務:</strong> ${result.service} | <strong>方法:</strong> ${result.method || 'unknown'}</span>
        <span><strong>時間:</strong> ${responseTime}ms | ${timestamp}</span>
      </div>
      <div class="test-result-content">
        <strong>提示:</strong> ${result.prompt}
        
        <strong>回應:</strong>
        ${result.success ? result.result : `錯誤: ${result.error}`}
      </div>
    `
    
    this.elements.testResults.insertBefore(resultDiv, this.elements.testResults.firstChild)
    
    // 限制最多顯示 10 個結果
    const results = this.elements.testResults.children
    while (results.length > 10) {
      this.elements.testResults.removeChild(results[results.length - 1])
    }
    
    this.showToast(
      result.success ? `測試成功 (${responseTime}ms)` : `測試失敗: ${result.error}`,
      result.success ? 'success' : 'error'
    )
  }
  
  /**
   * ❌ 顯示測試錯誤
   */
  displayTestError(error) {
    this.resetTestButton()
    this.showToast('測試錯誤: ' + error.error, 'error')
  }
  
  /**
   * 🔄 重置測試按鈕
   */
  resetTestButton() {
    this.elements.testButton.disabled = false
    this.elements.testButton.innerHTML = '🚀 測試'
  }
  
  /**
   * 📑 切換頁籤
   */
  switchTab(tabName) {
    // 更新按鈕狀態
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active')
    })
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active')
    
    // 更新內容顯示
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active')
    })
    document.getElementById(`${tabName}-tab`).classList.add('active')
  }
  
  /**
   * 🔗 更新連接狀態
   */
  updateConnectionStatus(text, status) {
    const statusElement = this.elements.connectionStatus
    const span = statusElement.querySelector('span')
    
    span.textContent = text
    statusElement.className = `status-indicator ${status}`
  }
  
  /**
   * 🍞 顯示 Toast 通知
   */
  showToast(message, type = 'info') {
    const toast = document.createElement('div')
    toast.className = `toast ${type}`
    
    const iconMap = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    }
    
    toast.innerHTML = `
      <span>${iconMap[type] || 'ℹ️'}</span>
      <span>${message}</span>
    `
    
    this.elements.toastContainer.appendChild(toast)
    
    // 自動移除
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    }, 5000)
  }
  
  /**
   * 🕐 格式化時間
   */
  formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }
  
  /**
   * ⏰ 格式化運行時間
   */
  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }
  
  /**
   * 💾 格式化記憶體使用量
   */
  formatMemory(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 B'
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }
  
  /**
   * 🔒 隱藏載入畫面
   */
  hideLoading() {
    this.elements.loadingOverlay.classList.add('hidden')
  }
}

// 當 DOM 載入完成時初始化應用程式
document.addEventListener('DOMContentLoaded', () => {
  window.mursfotoGUI = new MursfotoGUI()
})
