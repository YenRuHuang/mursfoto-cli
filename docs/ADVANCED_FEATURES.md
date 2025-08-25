# Mursfoto 進階功能整合指南

基於成功專案 `pixelforge-studio-main` 和 `ai-freelancer-tools-main` 的最佳實踐。

## 🎯 可用進階功能

### 1. SmartMonitor - 智能效能監控
**來源**: PixelForge Studio 的 SystemMonitor
**功能**:
- 即時 CPU、記憶體、磁碟使用率監控
- 自動效能分析與警報
- 智能擴展建議
- 系統健康狀態報告

**使用方式**:
```bash
node mursfoto-project-template.js create my-project api --smart-monitor
```

**程式碼範例**:
```javascript
import SmartMonitor from '../services/SmartMonitor.js';

const monitor = new SmartMonitor();
monitor.startMonitoring();

// 取得健康報告
const report = monitor.getHealthReport();
console.log('系統狀態:', report.status);

// 取得擴展建議
const scaling = monitor.getScalingRecommendations();
if (scaling.recommendations.length > 0) {
  console.log('建議擴展:', scaling.recommendations);
}
```

### 2. EnterpriseLogger - 企業級日誌系統
**來源**: AI Freelancer Tools 的 logger.js
**功能**:
- 多層級日誌輪轉 (一般/錯誤/安全/API)
- 安全事件專用記錄
- 自動清理過期日誌
- API 請求追蹤中間件

**使用方式**:
```bash
node mursfoto-project-template.js create my-project api --enterprise-logger
```

**程式碼範例**:
```javascript
import MursfotoEnterpriseLogger from '../utils/logger.js';

const logger = new MursfotoEnterpriseLogger({
  serviceName: 'my-project',
  logLevel: 'info'
});

// 一般日誌
logger.info('服務啟動成功');

// 安全事件記錄
logger.logAuth('LOGIN_SUCCESS', userId, {
  ip: req.ip,
  userAgent: req.get('User-Agent')
});

// 資料存取記錄  
logger.logDataAccess(userId, 'CREATE', 'users', {
  action: 'user_registration'
});

// API 中間件
app.use(logger.apiMiddleware());
```

### 3. SmartRouter - 智能負載平衡路由
**來源**: PixelForge Studio 的 SmartRouter
**功能**:
- 動態負載平衡
- 成本感知路由選擇
- 用戶等級配額管理
- 自動故障轉移
- 效能監控整合

**使用方式**:
```bash
node mursfoto-project-template.js create my-project api --smart-router
```

**程式碼範例**:
```javascript
import MursfotoSmartRouter from '../services/SmartRouter.js';

const router = new MursfotoSmartRouter({
  serviceName: 'my-project-router'
});

// 路由請求
app.use('/api/*', async (req, res, next) => {
  const userTier = getUserTier(req.user);
  const result = await router.route(req, userTier);
  
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(result.error.code).json(result.error);
  }
});

// 取得路由統計
app.get('/admin/routing-stats', (req, res) => {
  res.json(router.getRoutingStats());
});
```

## ✨ 全功能整合

啟用所有進階功能：
```bash
node mursfoto-project-template.js create enterprise-app api --all-features
```

## 📁 專案結構

啟用進階功能後的專案結構：
```
my-project/
├── src/
│   ├── backend/
│   │   └── server.js
│   ├── api/
│   │   └── health.js
│   ├── services/
│   │   ├── DatabaseService.js
│   │   ├── SmartMonitor.js      # --smart-monitor
│   │   └── SmartRouter.js       # --smart-router
│   └── utils/
│       └── logger.js            # EnterpriseLogger if --enterprise-logger
├── logs/                        # --enterprise-logger 專用
│   └── .gitkeep
├── scripts/
│   └── setup-database.js
├── .ai-rules/                   # Claude Code AI 指導
│   ├── product.md
│   ├── tech.md
│   └── structure.md
├── docs/
│   ├── ai-prompts.md
│   └── claude-config.md
├── package.json                 # 包含所有相關依賴
└── CLAUDE.md                    # AI 開發指南
```

## 🔧 環境配置

進階功能需要額外的環境變數：

```env
# SmartMonitor 配置
MONITOR_CPU_THRESHOLD=80
MONITOR_MEMORY_THRESHOLD=85
MONITOR_INTERVAL=5000

# EnterpriseLogger 配置  
LOG_LEVEL=info
LOG_RETENTION_DAYS=30
SECURITY_LOG_RETENTION_DAYS=90

# SmartRouter 配置
PRIMARY_SERVICE_URL=http://localhost:3000
SECONDARY_SERVICE_URL=http://localhost:3001
EXTERNAL_API_URL=https://api.external-service.com
ROUTING_CPU_THRESHOLD=80
```

## 🚀 部署注意事項

1. **SmartMonitor**: 在生產環境中需要適當的系統權限來讀取硬體資訊
2. **EnterpriseLogger**: 確保有足夠的磁碟空間存儲日誌文件
3. **SmartRouter**: 需要配置所有目標服務的 URL 和健康檢查端點

## 📊 監控與維護

使用 Claude Code AI 代理進行維護：
```
使用 steering-architect 代理分析專案架構並提供優化建議
使用 code-reviewer 代理審查進階功能的程式碼品質
使用 error-debugger 代理診斷系統效能問題
```

## 🎯 最佳實踐

1. **漸進式啟用**: 建議先從基本功能開始，再逐步啟用進階功能
2. **監控優先**: 在生產環境中務必啟用 SmartMonitor
3. **日誌分析**: 定期分析 EnterpriseLogger 的安全日誌
4. **負載測試**: 使用 SmartRouter 前先進行完整的負載測試

---

💡 這些進階功能都是從成功的生產專案中提取的最佳實踐，經過實戰驗證。