# 🚀 @mursfoto/cli

**Mursfoto API Gateway 生態系統自動化工具**

一個強大的 CLI 工具，用於快速創建、部署和管理與 Mursfoto API Gateway 整合的 Web 服務。

[![npm version](https://badge.fury.io/js/@mursfoto/cli.svg)](https://www.npmjs.com/package/@mursfoto/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 功能特點

- 🚀 **快速項目創建** - 多種內建模板，一鍵生成完整項目結構
- 🔗 **Gateway 自動集成** - 自動註冊服務到 Mursfoto API Gateway
- 🏥 **智能環境診斷** - 全面的系統健康檢查和依賴驗證
- 📊 **實時狀態監控** - 服務狀態、Gateway 連接監控
- ⚙️ **配置管理** - 靈活的用戶配置和模板管理
- 🚀 **一鍵部署** - 自動部署到 Zeabur 雲平台

## � 安裝

### 全域安裝
```bash
npm install -g @mursfoto/cli
```

### 使用 npx（推薦）
```bash
npx @mursfoto/create-project my-awesome-project
```

## 🚀 快速開始

### 1. 環境檢查
```bash
# 檢查系統環境和依賴
mursfoto doctor
```

### 2. 創建新項目
```bash
# 互動式創建
mursfoto create

# 指定模板創建
mursfoto create my-project --template=minimal

# 使用 npx 直接創建
npx @mursfoto/create-project my-project --template=calculator
```

### 3. 開發和部署
```bash
cd my-project
npm install
npm run dev                 # 本地開發
mursfoto deploy            # 部署到 Zeabur
```

## 📋 命令參考

### `mursfoto create [name]`
創建新的 Mursfoto 服務項目

**選項:**
- `-t, --template <template>` - 使用指定模板 (minimal, calculator, test-tool, api-service)
- `-d, --directory <dir>` - 指定創建目錄
- `--no-install` - 跳過 npm install
- `--no-git` - 跳過 Git 初始化

**範例:**
```bash
mursfoto create my-calculator --template=calculator
mursfoto create my-api --template=api-service --directory=./services
```

### `mursfoto doctor`
執行系統環境診斷

**檢查項目:**
- Node.js 版本和系統信息
- 必要依賴工具 (npm, git, curl, docker)
- Gateway 服務狀態
- 本地項目配置

**範例:**
```bash
mursfoto doctor
mursfoto doctor --verbose    # 詳細輸出
```

### `mursfoto status`
檢查服務和 Gateway 狀態

**功能:**
- 線上 Gateway 服務檢查
- 本地項目狀態
- Git 倉庫狀態
- 環境變數檢查

### `mursfoto gateway`
管理 Gateway 相關功能

**子命令:**
```bash
mursfoto gateway list           # 列出已註冊服務
mursfoto gateway register <name> # 手動註冊服務
mursfoto gateway status         # Gateway 狀態檢查
```

### `mursfoto template`
管理項目模板

**子命令:**
```bash
mursfoto template list          # 列出可用模板
mursfoto template info <name>   # 查看模板詳情
```

### `mursfoto config`
配置管理

**子命令:**
```bash
mursfoto config get                    # 查看當前配置
mursfoto config set <key> <value>      # 設置配置值
mursfoto config reset                  # 重置為預設配置
```

**可配置項目:**
- `defaultTemplate` - 預設模板
- `gatewayUrl` - Gateway 服務 URL
- `author` - 作者信息

### `mursfoto deploy`
部署服務到雲平台

**功能:**
- 自動部署到 Zeabur
- 環境變數配置
- 部署狀態監控

## 🎨 內建模板

### 1. **Minimal (minimal)**
最基礎的 Express.js 服務模板
- Express.js 框架
- 基本路由配置
- 環境變數支援
- CORS 配置

### 2. **Calculator (calculator)**  
計算器服務模板
- 數學運算 API
- 輸入驗證
- 錯誤處理
- Swagger 文檔

### 3. **Test Tool (test-tool)**
測試工具服務模板
- 多種測試功能
- 性能基準測試
- API 測試工具
- 健康檢查端點

### 4. **API Service (api-service)**
完整的 API 服務模板
- RESTful API 結構
- 資料庫集成
- 認證中間件
- API 文檔自動生成

## � 配置文件

### 專案配置 (.mursfoto.json)
```json
{
  "name": "my-service",
  "template": "minimal",
  "gateway": {
    "enabled": true,
    "route": "/api/my-service",
    "rateLimit": "100/hour"
  },
  "deployment": {
    "platform": "zeabur",
    "environment": "production"
  }
}
```

### 環境變數 (.env)
```bash
# Gateway 設定
MURSFOTO_GATEWAY_URL=https://gateway.mursfoto.com
MURSFOTO_API_TOKEN=your_api_token

# Discord 通知
DISCORD_WEBHOOK_URL=your_discord_webhook

# GitHub 集成
GITHUB_TOKEN=your_github_token
GITHUB_REPO=your_repo
```

## 🔗 Gateway 自動集成

### 自動註冊流程
1. **服務創建** - 自動生成服務配置
2. **路由註冊** - 修改 Gateway 的 `routes/proxy.js`
3. **環境配置** - 更新 `zeabur.json` 環境變數
4. **Git 自動化** - 提交變更並推送到遠程倉庫

### 服務配置範例
```javascript
// 自動生成的 Gateway 配置
{
  name: 'my-calculator',
  route: '/api/my-calculator',
  target: 'https://my-calculator-service.zeabur.app',
  rateLimit: '100/hour',
  cors: true,
  timeout: 30000
}
```

## 🏥 環境診斷

### 系統檢查項目
- **Node.js 版本** - 確保 >= 18.0.0
- **系統資源** - 記憶體、CPU 核心數
- **必要工具** - npm, git, curl, docker
- **Gateway 服務** - 線上服務可用性
- **本地項目** - 配置文件和 Git 狀態

### 診斷輸出範例
```bash
🏥 Mursfoto CLI 環境診斷

✅ Node.js 版本: v24.4.0 (符合要求 >= 18.0.0)
✅ 系統平台: darwin arm64 (36GB 記憶體, 14 CPU 核心)
✅ 依賴工具: npm, git, curl, docker 全部已安裝
✅ Gateway 服務: 線上正常運行 (200ms 響應)
✅ 本地 Gateway 項目: 已找到並配置
✅ Git 狀態: main (0 modified, 0 untracked)

🎉 環境檢查完成！所有項目都正常運行。
```

## 🚀 部署指南

### Zeabur 部署
```bash
# 1. 創建並準備項目
mursfoto create my-service --template=api-service
cd my-service

# 2. 本地測試
npm install
npm run dev

# 3. 部署到 Zeabur
mursfoto deploy

# 4. 檢查部署狀態
mursfoto status
```

### 自動化工作流程
1. **代碼推送** - 自動觸發部署流程
2. **Gateway 更新** - 自動更新路由配置
3. **狀態通知** - Discord 通知部署結果
4. **健康檢查** - 自動驗證服務可用性

## 🛠️ 開發指南

### 本地開發
```bash
# 克隆倉庫
git clone https://github.com/mursfoto/mursfoto-cli.git
cd mursfoto-cli

# 安裝依賴
npm install

# 連結到全域
npm link

# 開發測試
mursfoto doctor
```

### 添加新模板
1. 在 `templates/` 目錄創建新模板
2. 更新 `lib/utils/templates.js`
3. 添加模板配置和說明
4. 測試模板生成功能

### 擴展功能
```javascript
// lib/commands/my-command.js
const { Command } = require('commander');

async function myCommand(options) {
  // 實現你的功能
}

module.exports = { myCommand };
```

## 🧪 測試

### 執行測試
```bash
npm test                  # 執行所有測試
npm run test:unit         # 單元測試
npm run test:integration  # 集成測試
```

### 測試覆蓋率
```bash
npm run test:coverage     # 生成測試覆蓋率報告
```

## 📝 更新日誌

### v1.0.0 (最新)
- 🎉 初始版本發布
- ✨ 完整的 CLI 工具架構
- 🚀 四種內建模板
- 🔗 Gateway 自動集成
- 🏥 智能環境診斷
- 📊 實時狀態監控

## 🤝 貢獻指南

歡迎貢獻代碼！請遵循以下流程：

1. Fork 本倉庫
2. 創建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 創建 Pull Request

## 📄 許可證

本項目採用 MIT 許可證 - 查看 [LICENSE](LICENSE) 文件了解詳情。

## 🆘 支援

### 問題回報
- [GitHub Issues](https://github.com/mursfoto/mursfoto-cli/issues)
- [Discord 社群](https://discord.gg/mursfoto)

### 文檔
- [API 文檔](docs/API.md)
- [開發文檔](docs/DEVELOPMENT.md)
- [Cline 開發指南](docs/CLINE_DEVELOPMENT.md)

### 聯繫方式
- 電子郵件: support@mursfoto.com
- Twitter: [@mursfoto](https://twitter.com/mursfoto)

---

**🎉 由 Mursfoto 團隊用 ❤️ 製作**

> 讓 Web 服務開發變得簡單、快速、可靠！
