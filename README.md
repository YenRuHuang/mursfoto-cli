# 🚀 @mursfoto/cli

**Mursfoto AutoDev Factory 2.0 - AI 驅動的智能自動化開發工具**

一個革命性的 CLI 工具，結合 AI 智能和自動化技術，用於快速創建、部署和管理與 Mursfoto API Gateway 整合的 Web 服務。

[![npm version](https://badge.fury.io/js/@mursfoto/cli.svg)](https://www.npmjs.com/package/@mursfoto/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/YenRuHuang/mursfoto-cli/workflows/CI/badge.svg)](https://github.com/YenRuHuang/mursfoto-cli/actions)

## � Phase 2 - 智能自動化功能

### 🧠 **智能學習和決策系統**
- **用戶行為學習引擎** - 自動分析開發習慣和命令使用模式
- **智能建議系統** - 基於使用歷史提供個人化建議
- **工作流程優化** - 自動識別並建議效率提升方案
- **錯誤模式記憶** - 學習錯誤解決方案，避免重複問題

### 🤖 **AI 驅動的代碼生成**
- **自然語言轉代碼** - 使用 Anthropic Claude API 進行智能代碼生成
- **上下文感知生成** - 根據項目結構生成相符的代碼
- **多框架支援** - 支援 React、Vue、Express、FastAPI 等
- **品質自動檢查** - 生成代碼的語法、安全性、效能檢查

### 🔄 **完全自動化工作流程**
- **GitHub 全生命周期自動化** - 從創建倉庫到 Release 發布
- **零停機智能部署** - Blue-Green、Canary、Rolling 等部署策略
- **智能測試生成** - 自動生成單元測試、整合測試
- **CI/CD 管道自動設置** - 一鍵配置完整的 DevOps 流程

## �🎯 核心功能特點

### Phase 1 (基礎自動化)
- 🚀 **快速項目創建** - 多種內建模板，一鍵生成完整項目結構
- 🔗 **Gateway 自動集成** - 自動註冊服務到 Mursfoto API Gateway
- 🏥 **智能環境診斷** - 全面的系統健康檢查和依賴驗證
- 📊 **實時狀態監控** - 服務狀態、Gateway 連接監控
- ⚙️ **配置管理** - 靈活的用戶配置和模板管理
- 🚀 **一鍵部署** - 自動部署到 Zeabur 雲平台

### Phase 2 (智能自動化) ✨
- 🧠 **智能學習系統** - 個人化的開發助手和建議引擎
- 🤖 **AI 代碼生成器** - Claude API 驅動的智能代碼生成
- 🔄 **GitHub 自動化** - 完整的 GitHub 操作自動化
- 🧪 **智能測試自動化** - 自動測試生成和覆蓋率優化
- 🚀 **智能部署管道** - 零停機部署和自動回滾
- 📊 **效能監控優化** - 自動化效能分析和優化建議
- 🔧 **錯誤記憶系統** - 智能錯誤解決方案推薦
- 🎨 **進階模板管理** - AI 驅動的模板生成和市場

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

## 🚀 Phase 2 - 智能命令系統

### `mursfoto smart`
Phase 2 智能自動化功能套件

### `mursfoto smart learn [action]`
🧠 智能學習和決策系統

**子命令:**
```bash
mursfoto smart learn stats           # 查看學習統計
mursfoto smart learn suggestions     # 獲取智能建議
mursfoto smart learn report          # 導出學習報告
mursfoto smart learn reset           # 重置學習數據
mursfoto smart learn record          # 手動記錄命令
```

**選項:**
- `-f, --file <path>` - 報告輸出檔案路徑
- `--project-type <type>` - 專案類型（用於建議）
- `--command <cmd>` - 手動記錄的命令名稱
- `--success` - 標記命令執行成功
- `--duration <ms>` - 命令執行時間（毫秒）

**範例:**
```bash
mursfoto smart learn stats                    # 查看使用統計
mursfoto smart learn suggestions              # 獲取個人化建議
mursfoto smart learn report -f my-report.json # 導出詳細報告
mursfoto smart learn record --command="mursfoto create" --success --duration=5000
```

### `mursfoto smart ai <action>`
🤖 AI 代碼生成器

**子命令:**
```bash
mursfoto smart ai component       # 生成 React/Vue 組件
mursfoto smart ai api            # 生成 API 端點
mursfoto smart ai test           # 生成測試代碼
mursfoto smart ai optimize      # AI 代碼優化
```

**選項:**
- `-d, --description <description>` - 功能描述
- `-t, --type <type>` - 生成類型 (component, api, test, optimize)
- `-f, --file <file>` - 目標檔案
- `-l, --language <language>` - 程式語言

**範例:**
```bash
mursfoto smart ai component -d "用戶登入表單" -t component
mursfoto smart ai api -d "創建使用者 API" -t api
mursfoto smart ai test -f "./src/components/Login.js"
```

### `mursfoto smart github <action>`
🐙 GitHub 完全自動化

**子命令:**
```bash
mursfoto smart github create-repo    # 創建新倉庫
mursfoto smart github setup-cicd     # 設置 CI/CD
mursfoto smart github create-release # 創建 Release
mursfoto smart github sync-fork      # 同步 Fork
```

**選項:**
- `-n, --name <name>` - 項目名稱
- `-d, --description <description>` - 項目描述
- `-t, --template <template>` - 使用模板
- `--no-release` - 不創建初始 Release
- `--no-cicd` - 不設置 CI/CD
- `--no-monitoring` - 不啟用監控

**範例:**
```bash
mursfoto smart github create-repo -n "my-awesome-api" -d "新的 API 服務"
mursfoto smart github setup-cicd --template=node
mursfoto smart github create-release --version=v1.0.0
```

### `mursfoto smart test <action>`
🧪 智能測試自動化

**子命令:**
```bash
mursfoto smart test generate      # 生成測試案例
mursfoto smart test run          # 執行智能測試
mursfoto smart test coverage     # 分析覆蓋率
mursfoto smart test optimize     # 優化測試效能
```

**選項:**
- `-c, --coverage <percent>` - 目標覆蓋率 (預設: 90)
- `-t, --type <type>` - 測試類型 (unit, integration, e2e)
- `--generate` - 生成測試案例

**範例:**
```bash
mursfoto smart test generate -t unit -c 95
mursfoto smart test coverage --generate
mursfoto smart test run -t integration
```

### `mursfoto smart deploy <action>`
🚀 智能部署管道

**子命令:**
```bash
mursfoto smart deploy setup      # 設置部署管道
mursfoto smart deploy execute    # 執行智能部署
mursfoto smart deploy rollback   # 自動回滾
mursfoto smart deploy monitor    # 部署監控
```

**選項:**
- `-e, --environment <env>` - 部署環境 (預設: production)
- `-s, --strategy <strategy>` - 部署策略 (blue-green, rolling)
- `--auto-rollback` - 自動回滾 (預設: true)

**範例:**
```bash
mursfoto smart deploy setup -e production -s blue-green
mursfoto smart deploy execute --auto-rollback
mursfoto smart deploy monitor -e staging
```

### `mursfoto smart error <action>`
🧠 智能錯誤記憶系統

**子命令:**
```bash
mursfoto smart error stats       # 錯誤統計分析
mursfoto smart error search      # 搜索相似錯誤
mursfoto smart error learn       # 學習錯誤解決方案
mursfoto smart error suggest     # 錯誤解決建議
```

**選項:**
- `-q, --query <query>` - 搜尋關鍵字
- `-d, --days <days>` - 天數 (預設: 30)
- `-f, --file <file>` - 檔案路徑

**範例:**
```bash
mursfoto smart error stats -d 7
mursfoto smart error search -q "connection timeout"
mursfoto smart error suggest -f "./error.log"
```

### `mursfoto smart optimize <action>`
📊 效能監控與優化

**子命令:**
```bash
mursfoto smart optimize analyze   # 效能分析
mursfoto smart optimize fix       # 自動優化
mursfoto smart optimize report    # 效能報告
mursfoto smart optimize monitor   # 持續監控
```

**選項:**
- `--auto-fix` - 自動修復 (預設: false)
- `-r, --report <format>` - 報告格式 (json, html, pdf)
- `-t, --threshold <value>` - 效能門檻

**範例:**
```bash
mursfoto smart optimize analyze --auto-fix
mursfoto smart optimize report -r html
mursfoto smart optimize monitor -t 500ms
```

### `mursfoto smart template <action>`
📋 進階模板管理

**子命令:**
```bash
mursfoto smart template create    # AI 生成模板
mursfoto smart template market    # 模板市場
mursfoto smart template optimize  # 優化模板
mursfoto smart template share     # 分享模板
```

**選項:**
- `-p, --project-type <type>` - 專案類型
- `-f, --features <features>` - 所需功能
- `--marketplace` - 使用模板市場

**範例:**
```bash
mursfoto smart template create -p "api-service" -f "auth,database"
mursfoto smart template market --search="react component"
mursfoto smart template share --name="my-custom-template"
```

### `mursfoto smart n8n <action>`
🔄 n8n 自動化工作流程模板

**子命令:**
```bash
mursfoto smart n8n create        # 創建工作流程
mursfoto smart n8n import        # 導入模板
mursfoto smart n8n optimize      # 優化工作流程
mursfoto smart n8n deploy        # 部署到 n8n
```

**選項:**
- `-n, --name <name>` - 項目名稱
- `-q, --query <query>` - 搜尋關鍵字
- `-c, --category <category>` - 模板類別

**範例:**
```bash
mursfoto smart n8n create -n "webhook-processor"
mursfoto smart n8n import -q "slack notification"
mursfoto smart n8n deploy --name="auto-backup-workflow"
```

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

### v2.0.0 (最新) - Phase 2: AI 智能自動化
- 🧠 **智能學習和決策系統** - 完整的用戶行為學習引擎
- 🤖 **AI 代碼生成器** - Anthropic Claude API 整合
- 🔄 **GitHub 全自動化** - 從創建到發布的完整自動化
- 🧪 **智能測試自動化** - 自動測試生成和覆蓋率優化
- 🚀 **智能部署管道** - Blue-Green、Canary、Rolling 部署策略
- 📊 **效能監控優化** - 自動化效能分析和優化建議
- 🔧 **錯誤記憶系統** - 智能錯誤解決方案推薦
- � **進階模板管理** - AI 驅動的模板生成和市場
- ⚡ **完整 bug 修復** - 修復所有 Phase 1 已知問題
- 🔑 **環境變數優化** - 自動載入和驗證機制

### v1.0.0 - Phase 1: 基礎自動化
- �🎉 初始版本發布
- ✨ 完整的 CLI 工具架構
- 🚀 四種內建模板 (minimal, calculator, test-tool, api-service)
- 🔗 Gateway 自動集成
- 🏥 智能環境診斷
- 📊 實時狀態監控
- ⚙️ 配置管理系統
- 🚀 Zeabur 一鍵部署

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
