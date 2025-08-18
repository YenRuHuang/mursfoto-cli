# 🚀 Mursfoto CLI

> **Mursfoto AutoDev Factory 4.0** - 統一架構 + AI 驅動的智慧自動化開發工具

[![npm version](https://badge.fury.io/js/%40mursfoto%2Fcli.svg)](https://www.npmjs.com/package/@mursfoto/cli)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/tests-32%2F32%20passing-brightgreen.svg)](#testing)

## ✨ 特色功能

- 🎯 **智慧項目創建** - 支援多種模板，一鍵生成完整項目
- 🤖 **AI 驅動開發** - 整合 Claude、GPT、Gemini 等多種 AI 模型
- 🌐 **API Gateway 整合** - 自動註冊服務到私有 Gateway
- 🔧 **統一服務架構** - 4 大統一服務取代 16+ 分散服務
- 📊 **即時監控 GUI** - Web 介面系統監控
- 🚀 **一鍵部署** - 支援 Zeabur 等雲端平台
- 🧪 **完整測試** - 32 個測試確保代碼品質

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
| `doctor` | 系統環境檢查 | `mursfoto doctor` |
| `status` | 檢查服務狀態 | `mursfoto status` |
| `gui [options]` | 啟動 Web GUI | `mursfoto gui --port 3000` |
| `--version` | 顯示版本 | `mursfoto --version` |
| `--help` | 顯示幫助 | `mursfoto --help` |

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

## 📊 狀態

- **版本**: 4.0.0
- **狀態**: 生產就緒 ✅
- **測試覆蓋**: 100% ✅
- **文檔**: 完整 ✅
- **維護**: 積極維護 ✅

---

**Made with ❤️ by Mursfoto Team**

🔗 **相關連結**
- [GitHub](https://github.com/YenRuHuang/mursfoto-cli)
- [NPM](https://www.npmjs.com/package/@mursfoto/cli)
- [文檔](./docs/)