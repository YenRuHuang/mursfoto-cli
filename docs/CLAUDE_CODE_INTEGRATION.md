# 🌟 Claude Code Provider 整合指南

本指南說明如何在 mursfoto-cli 中使用 Cline IDE 的 Claude Code provider，充分利用您的 Claude Max 訂閱。

## 🎯 功能概述

mursfoto-cli 現在支援三種 AI provider 的智慧路由：

1. **🌟 Claude Code Provider (Cline IDE)** - 主要選擇，使用 Claude Max 訂閱
2. **🏠 本地模型 (Ollama)** - 免費備援選項
3. **☁️ Claude API** - 最終備援選項

## ⚙️ 配置設定

### 環境變數配置

在 `.env` 檔案中添加以下配置：

```bash
# Claude Code Provider 配置 (Cline IDE 整合)
CLAUDE_CODE_PROVIDER=auto          # 'auto', 'enabled', 'disabled'
CLINE_API_ENDPOINT=http://localhost:3001  # Cline IDE API 端點
PREFER_CLAUDE_CODE=true            # 優先使用 Claude Code Provider
```

### 配置選項說明

- `CLAUDE_CODE_PROVIDER`:
  - `auto`: 自動檢測並使用（推薦）
  - `enabled`: 強制啟用
  - `disabled`: 完全禁用

- `CLINE_API_ENDPOINT`: Cline IDE 的 API 端點，通常是 `http://localhost:3001`

- `PREFER_CLAUDE_CODE`: 是否優先使用 Claude Code provider

## 🚀 使用方式

### 1. 確保 Cline IDE 正在運行

確保您的 Cline IDE 已啟動並配置了 Claude Code provider。

### 2. 測試整合

運行測試腳本來驗證整合：

```bash
node test-claude-code-provider.js
```

### 3. 在代碼中使用

```javascript
const AIModelRouter = require('./lib/services/AIModelRouter')

const aiRouter = new AIModelRouter()

// 自動選擇最佳 AI provider
const result = await aiRouter.generate('請生成一個 Express.js API')

// 強制使用 Claude Code Provider
const result2 = await aiRouter.generateWithClineApi('生成 React 組件')
```

## 🏗️ 智慧路由策略

系統按以下優先順序選擇 AI provider：

1. **首選：Claude Code Provider**
   - 條件：`CLAUDE_CODE_PROVIDER !== 'disabled'` 且 Cline IDE 健康
   - 優勢：使用 Claude Max 訂閱，無額外費用
   - 模型：Claude-3.5-Sonnet-20241022

2. **備援：本地模型**
   - 條件：Claude Code 不可用且非高複雜度任務
   - 優勢：完全免費，隱私性佳
   - 模型：gpt-oss:20b (透過 Ollama)

3. **最終備援：Claude API**
   - 條件：其他選項都不可用
   - 優勢：高可靠性
   - 模型：Claude-3-Sonnet-20241022

## 🔍 健康監控

系統會自動監控所有 AI provider 的健康狀態：

```javascript
const stats = aiRouter.getStats()
console.log(stats.healthStatus)
// {
//   localModel: 'healthy',
//   claudeApi: 'healthy', 
//   clineApi: 'healthy',
//   lastChecked: 1234567890123
// }
```

## 🛠️ 故障排除

### Cline IDE 連線問題

如果看到 "Cline IDE 連線失敗" 錯誤：

1. 確認 Cline IDE 已啟動
2. 檢查端點設定：`CLINE_API_ENDPOINT=http://localhost:3001`
3. 確認 Claude Code provider 已在 Cline IDE 中配置

### API 調用失敗

如果 Claude Code Provider 調用失敗：

1. 檢查 Claude Max 訂閱狀態
2. 確認 Cline IDE 中的 Claude Code provider 配置
3. 查看 Cline IDE 的錯誤日誌

### 回退機制

如果 Claude Code Provider 不可用，系統會自動回退到：

1. 本地模型 (如果可用)
2. Claude API (如果配置了 `ANTHROPIC_API_KEY`)

## 📊 效能優勢

使用 Claude Code Provider 的優勢：

- **💰 成本效益**: 使用 Claude Max 訂閱，無額外 API 費用
- **🚀 高性能**: 直接整合，減少網路延遲
- **🔄 智慧路由**: 自動選擇最佳 provider
- **🛡️ 容錯性**: 多層備援機制

## 🔧 進階配置

### 自定義 Cline API 端點

如果 Cline IDE 運行在不同的端口或主機：

```bash
CLINE_API_ENDPOINT=http://192.168.1.100:3001
```

### 禁用 Claude Code Provider

如果想暫時禁用 Claude Code Provider：

```bash
CLAUDE_CODE_PROVIDER=disabled
```

### 強制使用特定 Provider

在代碼中強制使用特定的 AI provider：

```javascript
// 強制使用 Claude Code
const result = await aiRouter.forceGenerate(prompt, 'claude', options)

// 強制使用本地模型
const result = await aiRouter.forceGenerate(prompt, 'local', options)
```

## 🧪 測試命令

```bash
# 完整測試套件
node test-claude-code-provider.js

# 測試特定功能
node -e "
const AIModelRouter = require('./lib/services/AIModelRouter');
const router = new AIModelRouter();
router.isClineApiHealthy().then(console.log);
"
```

## 📈 監控和統計

查看使用統計：

```javascript
const stats = aiRouter.getStats()
console.log(`
總請求: ${stats.totalRequests}
Claude Code 請求: ${stats.claudeApiRequests} 
成功率: ${stats.claudeSuccessRate}
平均響應時間: ${stats.averageClaudeTime}ms
預估節省成本: $${stats.totalCostSavings}
`)
```

## 🎉 完成！

現在您的 mursfoto-cli 已完全整合 Claude Code provider，可以充分利用您的 Claude Max 訂閱進行 AI 程式碼生成！

---

**提示**: 如果您遇到任何問題，請運行測試腳本來診斷問題，或查看 Cline IDE 的日誌以獲取更多資訊。
