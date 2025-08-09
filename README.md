# 🚀 @mursfoto/cli

**Mursfoto AutoDev Factory 3.0 - AI 驅動的智能自動化開發工具**

一個革命性的 CLI 工具，結合 AI 智能和自動化技術，用於快速創建、部署和管理與 Mursfoto API Gateway 整合的 Web 服務。

[![npm version](https://badge.fury.io/js/@mursfoto/cli.svg)](https://www.npmjs.com/package/@mursfoto/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/YenRuHuang/mursfoto-cli/workflows/CI/badge.svg)](https://github.com/YenRuHuang/mursfoto-cli/actions)

## 📍 Phase 2 - 智能自動化功能

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

## � Phase 3 - 雲端和容器管理

### 🌍 **多雲平台管理系統**
- **統一多雲抽象層** - 支援 AWS、Azure、GCP、DigitalOcean、Vercel
- **智能平台推薦** - 基於需求的多維度評分算法
- **成本比較分析** - 跨平台成本對比和優化建議
- **一鍵多雲部署** - 統一命令管理多個雲平台

### 🐳 **容器優化服務**
- **智能 Dockerfile 生成** - 自動優化的容器配置
- **Kubernetes YAML 自動生成** - 完整的 K8s 部署配置
- **容器安全掃描** - 多層次安全檢查機制
- **映像優化建議** - 自動化最佳實踐推薦

### 💰 **成本分析服務**  
- **智能成本預測** - 基於歷史數據的成本趨勢分析
- **跨平台成本比較** - 多雲平台成本效益比較
- **預算警報系統** - 自動成本監控和預警
- **成本優化引擎** - AI 驅動的成本節省建議

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

### Phase 3 (雲端容器管理) 🌍
- 🌍 **多雲平台管理** - 統一管理 AWS、Azure、GCP、DO、Vercel
- 🐳 **容器優化服務** - Docker/K8s 配置自動生成和優化  
- 💰 **成本分析引擎** - 智能成本預測和跨平台比較
- 🔒 **安全掃描系統** - 多層次容器安全檢查
- 📊 **效能監控** - 雲端資源使用情況追蹤
- 🎯 **智能推薦** - 基於需求的平台和配置建議

## 📦 安裝

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

### Phase 1: 基礎命令

#### `mursfoto create [name]`
創建新的 Mursfoto 服務項目

**選項:**
- `-t, --template <template>` - 使用指定模板 (minimal, calculator, test-tool, api-service)
- `-d, --directory <dir>` - 指定創建目錄
- `--no-install` - 跳過 npm install
- `--no-git` - 跳過 Git 初始化

#### `mursfoto doctor`
執行系統環境診斷

#### `mursfoto status`
檢查服務和 Gateway 狀態

#### `mursfoto gateway`
管理 Gateway 相關功能

#### `mursfoto template`
管理項目模板

#### `mursfoto config`
配置管理

#### `mursfoto deploy`
部署服務到雲平台

### Phase 2: 智能命令系統

#### `mursfoto smart learn [action]`
🧠 智能學習和決策系統

**子命令:**
```bash
mursfoto smart learn stats           # 查看學習統計
mursfoto smart learn suggestions     # 獲取智能建議
mursfoto smart learn report          # 導出學習報告
mursfoto smart learn reset           # 重置學習數據
mursfoto smart learn record          # 手動記錄命令
```

#### `mursfoto smart ai <action>`
🤖 AI 代碼生成器

**子命令:**
```bash
mursfoto smart ai component       # 生成 React/Vue 組件
mursfoto smart ai api            # 生成 API 端點
mursfoto smart ai test           # 生成測試代碼
mursfoto smart ai optimize      # AI 代碼優化
```

#### `mursfoto smart github <action>`
🐙 GitHub 完全自動化

**子命令:**
```bash
mursfoto smart github create-repo    # 創建新倉庫
mursfoto smart github setup-cicd     # 設置 CI/CD
mursfoto smart github create-release # 創建 Release
mursfoto smart github sync-fork      # 同步 Fork
```

#### `mursfoto smart test <action>`
🧪 智能測試自動化

**子命令:**
```bash
mursfoto smart test generate      # 生成測試案例
mursfoto smart test run          # 執行智能測試
mursfoto smart test coverage     # 分析覆蓋率
mursfoto smart test optimize     # 優化測試效能
```

#### `mursfoto smart deploy <action>`
🚀 智能部署管道

**子命令:**
```bash
mursfoto smart deploy setup      # 設置部署管道
mursfoto smart deploy execute    # 執行智能部署
mursfoto smart deploy rollback   # 自動回滾
mursfoto smart deploy monitor    # 部署監控
```

#### `mursfoto smart error <action>`
🧠 智能錯誤記憶系統

**子命令:**
```bash
mursfoto smart error stats       # 錯誤統計分析
mursfoto smart error search      # 搜索相似錯誤
mursfoto smart error learn       # 學習錯誤解決方案
mursfoto smart error suggest     # 錯誤解決建議
```

#### `mursfoto smart optimize <action>`
📊 效能監控與優化

**子命令:**
```bash
mursfoto smart optimize analyze   # 效能分析
mursfoto smart optimize fix       # 自動優化
mursfoto smart optimize report    # 效能報告
mursfoto smart optimize monitor   # 持續監控
```

#### `mursfoto smart template <action>`
📋 進階模板管理

**子命令:**
```bash
mursfoto smart template create    # AI 生成模板
mursfoto smart template market    # 模板市場
mursfoto smart template optimize  # 優化模板
mursfoto smart template share     # 分享模板
```

#### `mursfoto smart n8n <action>`
🔄 n8n 自動化工作流程模板

**子命令:**
```bash
mursfoto smart n8n create        # 創建工作流程
mursfoto smart n8n import        # 導入模板
mursfoto smart n8n optimize      # 優化工作流程
mursfoto smart n8n deploy        # 部署到 n8n
```

### Phase 3: 雲端和容器管理

#### `mursfoto smart cloud [action]`
🌍 多雲平台管理系統

**子命令:**
```bash
mursfoto smart cloud list        # 列出支援的雲平台
mursfoto smart cloud configure   # 配置雲平台認證
mursfoto smart cloud recommend   # 智能平台推薦
mursfoto smart cloud deploy      # 多雲部署
mursfoto smart cloud compare     # 成本比較分析  
mursfoto smart cloud status      # 多雲狀態概覽
```

**選項:**
- `-p, --platform <platform>` - 指定雲平台 (aws, azure, gcp, digitalocean, vercel)
- `-r, --region <region>` - 指定部署區域
- `-c, --config <file>` - 配置檔案路徑
- `--budget <amount>` - 預算限制

**範例:**
```bash
mursfoto smart cloud list                    # 查看所有平台
mursfoto smart cloud recommend -p aws        # AWS 平台推薦
mursfoto smart cloud deploy -p azure -r eastus # 部署到 Azure 東美區域
mursfoto smart cloud compare --budget=100    # 比較 $100 預算下的選項
```

#### `mursfoto smart container [action]`
� 容器優化服務

**子命令:**
```bash
mursfoto smart container dockerfile  # 生成優化的 Dockerfile
mursfoto smart container k8s         # 生成 Kubernetes YAML
mursfoto smart container analyze     # 容器分析
mursfoto smart container optimize    # 映像優化
mursfoto smart container security    # 安全掃描
mursfoto smart container stats       # 優化統計
```

**選項:**
- `-t, --type <type>` - 容器類型 (docker, kubernetes, helm)
- `-f, --file <file>` - Dockerfile 路徑
- `-i, --image <image>` - 映像名稱
- `--platform <platform>` - 目標平台
- `--optimize` - 自動優化

**範例:**
```bash
mursfoto smart container dockerfile -t node    # 生成 Node.js Dockerfile
mursfoto smart container k8s -f ./Dockerfile   # 基於 Dockerfile 生成 K8s 配置
mursfoto smart container security -i myapp:latest # 掃描映像安全性
mursfoto smart container optimize --platform=linux/amd64 # 優化指定平台
```

#### `mursfoto smart cost [action]`
� 成本分析服務

**子命令:**
```bash
mursfoto smart cost analyze     # 專案成本分析
mursfoto smart cost compare     # 平台成本比較
mursfoto smart cost predict     # 成本趨勢預測
mursfoto smart cost optimize    # 成本優化建議
mursfoto smart cost alert       # 設置預算警報
mursfoto smart cost report      # 生成成本報告
```

**選項:**
- `-p, --platforms <platforms>` - 比較的平台列表
- `-b, --budget <amount>` - 預算限制
- `-t, --timeframe <period>` - 分析時間範圍 (day, week, month)
- `-f, --format <format>` - 報告格式 (json, html, pdf)

**範例:**
```bash
mursfoto smart cost analyze -p aws,azure,gcp         # 分析三大雲平台成本
mursfoto smart cost compare -b 500 -t month          # 比較月預算 $500 的選項
mursfoto smart cost predict -t quarter               # 預測季度成本趨勢
mursfoto smart cost report -f html                   # 生成 HTML 成本報告
```

## 🧪 測試

### 完整功能測試
```bash
# 執行所有功能測試
cd mursfoto-cli
node test-all-features.js

# 測試特定階段
npm test                  # 單元測試
npm run test:integration  # 集成測試
npm run test:coverage     # 測試覆蓋率
```

### 測試覆蓋範圍
- ✅ Phase 1: 基礎 CLI 功能 (8 個命令)
- ✅ Phase 2: 智能自動化功能 (16 個命令)  
- ✅ Phase 3: 雲端容器管理功能 (18 個命令)
- 🎯 總計: 42 個專業級命令

## 📝 更新日誌

### v3.0.0 (最新) - Phase 3: 雲端和容器管理
- 🌍 **多雲平台管理系統** - 統一管理 AWS、Azure、GCP、DigitalOcean、Vercel
- 🐳 **容器優化服務** - 智能 Dockerfile 和 K8s YAML 生成
- 💰 **成本分析引擎** - 跨平台成本比較和智能預測
- 🔒 **安全掃描系統** - 6 項容器安全檢查規則
- 📊 **智能推薦算法** - 多維度平台選擇建議
- 🎯 **18 個新命令** - 完整的雲端管理命令集
- ⚡ **效能優化** - 智能學習系統整合
- 🔑 **完整測試覆蓋** - 42 個命令全面測試通過

### v2.0.0 - Phase 2: AI 智能自動化
- 🧠 **智能學習和決策系統** - 完整的用戶行為學習引擎
- 🤖 **AI 代碼生成器** - Anthropic Claude API 整合
- 🔄 **GitHub 全自動化** - 從創建到發布的完整自動化
- 🧪 **智能測試自動化** - 自動測試生成和覆蓋率優化
- 🚀 **智能部署管道** - Blue-Green、Canary、Rolling 部署策略
- 📊 **效能監控優化** - 自動化效能分析和優化建議
- 🔧 **錯誤記憶系統** - 智能錯誤解決方案推薦
- 🎨 **進階模板管理** - AI 驅動的模板生成和市場

### v1.0.0 - Phase 1: 基礎自動化
- 🎉 初始版本發布
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
- [Phase 2 完成報告](docs/PHASE2_COMPLETION_REPORT.md)
- [Phase 3 完成報告](docs/PHASE3_COMPLETION_REPORT.md) 
- [智能功能測試指南](docs/SMART_FEATURES_TEST_GUIDE.md)
- [API 文檔](docs/API.md)
- [開發文檔](docs/DEVELOPMENT.md)
- [Cline 開發指南](docs/CLINE_DEVELOPMENT.md)

### 聯繫方式
- 電子郵件: support@mursfoto.com
- Twitter: [@mursfoto](https://twitter.com/mursfoto)

---

**🎉 由 Mursfoto 團隊用 ❤️ 製作**

> 讓 Web 服務開發變得簡單、快速、可靠！現在包含完整的雲端和容器管理功能！ 🌍🐳💰

**📊 統計數據:**
- **Phase 1**: 8 個基礎命令
- **Phase 2**: 16 個智能命令  
- **Phase 3**: 18 個雲端命令
- **總計**: 42 個企業級命令 🏆
