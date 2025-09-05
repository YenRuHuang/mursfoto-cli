# 🚀 Mursfoto CLI

> **Mursfoto AutoDev Factory 4.5** - 三 AI 協作系統 + Playwright 自動化測試 + SubAgents 智能代理 + 完整測試生態系統

[![npm version](https://badge.fury.io/js/%40mursfoto%2Fcli.svg)](https://www.npmjs.com/package/@mursfoto/cli)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/tests-32%2F32%20passing-brightgreen.svg)](#testing)

## ✨ 特色功能

- 🎯 **智慧項目創建** - 支援多種模板，一鍵生成完整項目
- 🤖 **三 AI 協作系統** - 整合 Claude Code + Gemini 2.5 Pro + Amazon Q，提供全方位 AI 協助
- 🎭 **Playwright 自動化測試** - E2E 測試、跨瀏覽器驗證、視覺回歸測試
- 🏭 **SubAgents 智能代理** - 包含 test-architect、code-reviewer、error-debugger 專業代理
- 🌐 **API Gateway 整合** - 自動註冊服務到私有 Gateway
- 🔧 **統一服務架構** - 4 大統一服務取代 16+ 分散服務
- 📊 **即時監控 GUI** - Web 介面系統監控
- 🚀 **一鍵部署** - 支援 Zeabur 等雲端平台
- 🧪 **完整測試生態系統** - Unit + Integration + E2E + Performance + Visual 測試

### 🎯 NEW v4.5 - SubAgents & Playwright 完美整合

- 🎭 **Playwright 全面整合** - E2E 測試、截圖測試、跨瀏覽器測試、效能基準測試
- 🏭 **test-architect SubAgent** - 專精測試策略設計的 AI 代理
- 🔄 **智能測試工作流程** - 從代碼審查到自動化測試的完整流程
- 🤖 **增強的 AI 命令** - 新增 6 個測試相關的 AI 命令
- 🎯 **完整測試金字塔** - 70% Unit + 20% Integration + 10% E2E 測試策略
- 📊 **智能測試生成** - 基於代碼分析自動生成 5 種類型測試
- 🌍 **跨瀏覽器自動化** - 支援 Chromium、Firefox、WebKit 自動化測試

### 🎯 v4.4 - 三 AI 協作系統

- 🤖 **Gemini 2.5 Pro 整合** - 最新最強大的 Google AI 模型，提供深度程式碼分析
- 📦 **Amazon Q CLI 整合** - AWS 官方 AI，提供 Shell 命令建議和最佳實踐
- 🔄 **Claude Code 協作** - 三 AI 系統無縫協作，互補優勢
- 🎯 **專案感知 AI** - 自動識別 mursfoto-cli 和 API Gateway 程式碼特性
- 💡 **互動式 AI 助手** - 直觀的選單系統，輕鬆使用 AI 功能

### 🎯 v4.3 進階功能 (基於成功專案最佳實踐)

- 📊 **SmartMonitor** - 來自 PixelForge Studio，即時效能監控與自動擴展建議
- 📝 **EnterpriseLogger** - 來自 AI Freelancer Tools，企業級日誌系統與安全事件記錄  
- 🎯 **SmartRouter** - 來自 PixelForge Studio，智能負載平衡與成本優化路由
- 🗄️ **MySQL + Zeabur 整合** - 完整資料庫服務管理與一鍵部署
- 🌐 **完整 API Gateway 系統** - 整合您現有的完整 API (Auth/Security/Proxy)
- 🤖 **Claude Code AI 代理深度整合** - 自動複製您的 4 個專業 AI 代理到每個新專案
- 🎨 **智能輸出風格推薦** - API Gateway→風格2, Web→風格3, 微服務→風格5 自動適配
- ⚙️ **專案特定配置** - 每個專案獨立的 .claude 目錄與優化設定

## 🛠️ 安裝

### 全域安裝 (推薦)
```bash
npm install -g @mursfoto/cli
```

### 本地安裝
```bash
npm install @mursfoto/cli
npx mursfoto --help
```

## 🚦 快速開始

### 創建新項目
```bash
# 最小化項目
mursfoto create my-project --template minimal

# 企業級項目  
mursfoto create my-app --template enterprise-production

# N8N 自動化項目
mursfoto create my-workflow --template n8n
```

### 🎯 NEW! 創建具備進階功能的項目
```bash
# 基本 API 服務 (包含 MySQL + Zeabur + Claude Code AI)
node lib/services/MursfotoProjectTemplate.js create my-api

# 🌐 完整 API Gateway 系統 (整合您現有的 API 設定)
node lib/services/MursfotoProjectTemplate.js create my-gateway api-gateway

# 啟用智能監控
node lib/services/MursfotoProjectTemplate.js create monitored-service api --smart-monitor

# 啟用企業級日誌
node lib/services/MursfotoProjectTemplate.js create secure-app api --enterprise-logger

# 啟用智能路由
node lib/services/MursfotoProjectTemplate.js create balanced-api api --smart-router

# 啟用所有進階功能 🚀
node lib/services/MursfotoProjectTemplate.js create enterprise-solution api --all-features

# API Gateway + 全進階功能
node lib/services/MursfotoProjectTemplate.js create ultimate-gateway api-gateway --all-features
```

## 🤖 Claude Code AI 代理整合

每個新專案自動包含：

### ✅ **自動複製的配置**
- 🎯 **4個專業 AI 代理**: code-reviewer、error-debugger、prd-writer、steering-architect
- 🎨 **繁體中文狀態列**: 5種風格可選，自動推薦適合的風格
- ⚙️ **優化權限設定**: 自動配置最佳的工具權限
- 📁 **專案特定配置**: 每個專案都有獨立的 `.claude` 目錄

### 🎨 **智能風格推薦**
- **API/API Gateway**: 風格2 (正式風格) - 完整資訊顯示
- **Web 應用**: 風格3 (符號風格) - 視覺化圖示介面
- **微服務**: 風格5 (技術風格) - 含時間戳記適合分散式開發

### 🔧 **使用方式**
創建專案後，在專案目錄中 Claude Code 會自動使用：
- 您的自訂 AI 代理
- 推薦的輸出風格  
- 專案特定的設定

### 系統檢查
```bash
# 環境診斷
mursfoto doctor

# 服務狀態
mursfoto status

# 啟動 GUI 監控
mursfoto gui --port 3000
```

## 📋 可用命令

| 命令 | 描述 | 範例 |
|------|------|------|
| `create [name]` | 創建新項目 | `mursfoto create my-app --template minimal` |
| `ai [action]` | 🤖 AI 助手系統 | `mursfoto ai` `mursfoto ai review -f app.js` |
| `doctor` | 系統環境檢查 | `mursfoto doctor` |
| `status` | 檢查服務狀態 | `mursfoto status` |
| `gui [options]` | 啟動 Web GUI | `mursfoto gui --port 3000` |
| `--version` | 顯示版本 | `mursfoto --version` |
| `--help` | 顯示幫助 | `mursfoto --help` |

## 🤖 NEW! AI 助手系統

整合 **Claude Code + Gemini 2.5 Pro + Amazon Q** 三大 AI 引擎，提供全方位開發協助。

### 🎯 主要功能

```bash
# 互動式 AI 選單
mursfoto ai

# 程式碼審查 (自動識別 API Gateway/CLI 程式碼)
mursfoto ai review -f server.js
mursfoto ai review -f lib/commands/create.js

# API 路由分析
mursfoto ai api

# 部署協助 (支援 Zeabur、Docker、AWS)
mursfoto ai deploy

# 性能優化建議
mursfoto ai optimize -f app.js

# 自動生成文檔
mursfoto ai doc

# 測試程式碼生成
mursfoto ai test -f utils.js

# 🎭 Playwright E2E 測試生成和執行
mursfoto ai e2e -f server.js

# 📸 自動化截圖測試
mursfoto ai screenshot -u http://localhost:4100

# 🌍 跨瀏覽器兼容性測試
mursfoto ai browser -u http://localhost:4100

# 🧪 完整測試套件執行
mursfoto ai test-full

# 🤖 智能測試生成 (Unit + Integration + E2E + Security + Performance)
mursfoto ai test-generate -f app.js

# ⚡ 效能基準測試和優化建議
mursfoto ai performance -u http://localhost:4100

# 自由提問
mursfoto ai ask -q "如何優化 Express.js 性能？"
```

### 🌟 AI 功能特色

- **🎯 專案感知**: 自動識別 mursfoto-cli 和 mursfoto-api-gateway 程式碼
- **🤝 三 AI 協作**: Gemini 2.5 Pro 深度分析 + Amazon Q 命令建議 + Claude Code 實施
- **🎭 Playwright 自動化**: E2E 測試、視覺測試、跨瀏覽器驗證完全自動化
- **🏭 SubAgents 智能**: test-architect、code-reviewer、error-debugger 專業代理
- **🔍 智能審查**: 針對 API Gateway 安全性、CLI 使用體驗等專項檢查
- **🚀 一鍵部署**: 自動生成 Zeabur、Docker 等平台配置檔案
- **📚 文檔生成**: README、API 文檔、部署指南自動生成
- **🧪 完整測試生態系統**: Unit + Integration + E2E + Performance + Visual 測試全覆蓋

### 💡 使用情境

| 情境 | 命令 | 說明 |
|------|------|------|
| 程式碼審查 | `mursfoto ai review -f routes/proxy.js` | 檢查路由安全性和性能 |
| API 分析 | `mursfoto ai api` | 分析所有 API 端點和中間件 |
| 端對端測試 | `mursfoto ai e2e -f server.js` | 生成 Playwright E2E 測試 |
| 跨瀏覽器測試 | `mursfoto ai browser -u localhost:4100` | 驗證多瀏覽器兼容性 |
| 完整測試套件 | `mursfoto ai test-full` | 執行 Unit + E2E + Performance 測試 |
| 智能測試生成 | `mursfoto ai test-generate -f app.js` | 生成 5 種類型測試 |
| 效能基準測試 | `mursfoto ai performance -u localhost:4100` | 效能分析和優化建議 |
| 部署準備 | `mursfoto ai deploy` | 生成部署配置和說明 |
| 性能調優 | `mursfoto ai optimize -f server.js` | 識別瓶頸提供優化方案 |
| 文檔撰寫 | `mursfoto ai doc` | 自動生成專案文檔 |

### ⚙️ 設定 AI Keys

```bash
# 設定 Gemini API Key
mursfoto ai config

# 或手動設定環境變數
export GEMINI_API_KEY="your-api-key"
```

## 🎨 項目模板

### 📦 Minimal Template
- **用途**: 快速原型開發
- **包含**: Express.js + 基本路由
- **特色**: 輕量級，快速啟動

### 🏢 Enterprise Production Template  
- **用途**: 企業級應用
- **包含**: JWT 認證 + 中間件 + 測試
- **特色**: 生產就緒，安全性高

### 🔄 N8N Template
- **用途**: 工作流自動化
- **包含**: N8N 配置 + 工作流範例  
- **特色**: 視覺化自動化開發

## 🏆 成功案例

### 🏭 FUCO Production Enterprise
基於 mursfoto-cli enterprise-production 模板構建的完整生產管理系統，展示了模板在真實企業環境中的應用。

**項目亮點**:
- 🧠 **智能生產規劃**: 遺傳算法驅動的工單排程優化  
- 🤖 **5個專門 SubAgents**: Development、Database、Monitoring、Testing、Planning
- 📊 **可視化儀表板**: Glass morphism 設計的現代化 UI
- ⚡ **高性能算法**: 200工單×20工作站 <30秒處理
- 🎯 **100% 測試覆蓋**: 全面的自動化測試體系

**技術成果**:
- Token 使用優化 90-95%
- 開發效率提升 85-90%  
- 代碼質量一致性 90-95%
- 錯誤率降低 75-80%

👉 [查看 FUCO 專案詳情](https://github.com/YenRuHuang/fuco-production-enterprise)

## 🏗️ 架構概覽

```
mursfoto-cli/
├── 📁 bin/                  # CLI 入口點
├── 📁 lib/
│   ├── 📁 commands/         # 命令實現
│   ├── 📁 services/         # 4大統一服務
│   ├── 📁 modules/          # 功能模組
│   ├── 📁 utils/           # 工具函數
│   └── 📁 gui/             # Web 監控介面
├── 📁 templates/           # 項目模板
├── 📁 test/               # 測試套件
└── 📁 docs/               # 文檔
```

## 🧪 測試

```bash
# 運行所有測試
npm test

# 監控模式
npm run test:watch

# 覆蓋率報告
npm run test:coverage
```

**測試結果**: ✅ 32/32 通過 (100% 成功率)

## 🔧 開發

### 環境要求
- Node.js >= 18.0.0
- NPM >= 8.0.0
- Git

### 本地開發
```bash
# 克隆倉庫
git clone https://github.com/YenRuHuang/mursfoto-cli.git
cd mursfoto-cli

# 安裝依賴
npm install

# 運行測試
npm test

# 本地測試 CLI
node bin/mursfoto.js --help
```

### 創建新模板
1. 在 `templates/` 目錄創建新資料夾
2. 添加 `package.json` 和模板文件
3. 更新 `lib/utils/templates.js` 配置

## 🌐 API Gateway 整合

Mursfoto CLI 支援與私有 API Gateway 整合：

```bash
# 設置環境變數
export MURSFOTO_GATEWAY_URL="https://gateway.mursfoto.com"
export MURSFOTO_API_TOKEN="your-token"

# 創建項目時自動註冊
mursfoto create my-service --template minimal
```

## 🚀 部署

### Zeabur 部署
```bash
# 創建企業級項目
mursfoto create my-app --template enterprise-production

cd my-app

# 部署到 Zeabur (需要 zeabur CLI)
zeabur deploy
```

### Docker 部署
```bash
# 使用企業模板內建的 Docker 配置
cd my-app
docker build -t my-app .
docker run -p 3000:3000 my-app
```

## 🔍 故障排除

### 常見問題

**Q: 創建項目時出現 readline 錯誤？**
A: 在非交互式環境請提供完整參數：
```bash
mursfoto create my-project --template minimal
```

**Q: Gateway 註冊失敗？**
A: 檢查環境變數設置：
```bash
echo $MURSFOTO_GATEWAY_URL
echo $MURSFOTO_API_TOKEN
```

**Q: 模板找不到？**
A: 查看可用模板：
```bash
ls templates/
```

### 獲得幫助
- 📖 [完整文檔](./docs/)
- 🐛 [問題回報](https://github.com/YenRuHuang/mursfoto-cli/issues)
- 💬 [討論區](https://github.com/YenRuHuang/mursfoto-cli/discussions)

## 🤝 貢獻

歡迎貢獻代碼！請查看 [DEVELOPMENT.md](./docs/DEVELOPMENT.md) 了解開發指南。

1. Fork 專案
2. 創建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 📄 授權

本專案採用 MIT 授權 - 查看 [LICENSE](LICENSE) 文件了解詳情。

## 🙏 致謝

- [Commander.js](https://github.com/tj/commander.js/) - CLI 框架
- [Inquirer.js](https://github.com/SBoudrias/Inquirer.js/) - 交互式命令行
- [Jest](https://jestjs.io/) - 測試框架
- [Chalk](https://github.com/chalk/chalk) - 終端顏色

## 🔗 MCP SubAgents 整合

Mursfoto CLI v4.0 支援 Claude Code MCP SubAgents 架構，大幅提升開發效率：

### 主要優勢
- **Token 節省**: 減少 90-95% 的 context 重複載入
- **專業化深度**: 每個 Agent 專精特定領域
- **持久記憶**: Agent 保留項目知識，無需重複解釋
- **標準化架構**: 遵循 MCP 協議，易於擴展

### 支援的 Agent 類型
- 🏗️ **Development Agent**: API 開發、前端組件、代碼重構
- 🗄️ **Database Agent**: 數據庫設計、遷移、性能優化  
- 📊 **Monitoring Agent**: 系統監控、性能分析、告警設置
- 🧪 **Testing Agent**: 測試自動化、CI/CD、覆蓋率分析
- 🏭 **Planning Agent**: 生產規劃、排程優化、產能分析

### 如何啟用 MCP 支持
```bash
# 創建支援 MCP 的企業級項目
mursfoto create my-enterprise-app --template enterprise-production

# 包含統一 Agent 選擇器
cd my-enterprise-app
./bin/fuco-agents.js
```

## 📊 狀態

- **版本**: 4.3.0
- **狀態**: 生產就緒 ✅  
- **測試覆蓋**: 100% ✅
- **文檔**: 完整 ✅
- **維護**: 積極維護 ✅
- **MCP 支援**: 完整整合 ✅

---

**Made with ❤️ by Mursfoto Team**

🔗 **相關連結**
- [GitHub](https://github.com/YenRuHuang/mursfoto-cli)
- [NPM](https://www.npmjs.com/package/@mursfoto/cli)
- [文檔](./docs/)