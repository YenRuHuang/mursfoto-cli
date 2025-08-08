# @mursfoto/cli

🚀 Mursfoto API Gateway 生態系統自動化 CLI 工具

[![npm version](https://badge.fury.io/js/@mursfoto%2Fcli.svg)](https://badge.fury.io/js/@mursfoto%2Fcli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📖 簡介

@mursfoto/cli 是為 Mursfoto API Gateway 生態系統設計的自動化命令行工具，提供項目創建、環境診斷、模板管理等核心功能，大大簡化開發流程。

## ✨ 核心特性

- 🎯 **快速項目創建** - 支持多種項目模板
- 🏥 **環境診斷** - 完整的系統健康檢查
- 🌐 **Gateway 集成** - 自動註冊到 mursfoto-api-gateway
- 📋 **模板管理** - 靈活的項目模板系統
- � **部署支持** - 一鍵部署到 Zeabur
- ⚙️ **配置管理** - 用戶配置系統

## 🚀 快速開始

### 全局安裝

```bash
npm install -g @mursfoto/cli
```

### 創建新項目

```bash
# 使用互動式創建
mursfoto create

# 指定模板和項目名
mursfoto create my-awesome-api --template=minimal

# 使用 npx 直接創建
npx @mursfoto/create-project my-project --template=calculator
```

### 環境檢查

```bash
mursfoto doctor
```

## 📋 可用命令

### `mursfoto create [project-name]`

創建新的 Mursfoto 服務項目

**選項:**
- `-t, --template <template>` - 指定使用的模板
- `--no-install` - 跳過依賴安裝
- `--no-git` - 跳過 Git 初始化
- `--no-gateway` - 跳過 Gateway 註冊

**範例:**
```bash
mursfoto create my-api --template=api-service
mursfoto create calculator-tool --template=calculator --no-gateway
```

### `mursfoto doctor`

執行環境診斷檢查

**檢查項目:**
- ✅ Node.js 版本
- ✅ 系統依賴 (npm, git, curl)
- ✅ Gateway 連接狀態
- ✅ 本地 Gateway 項目狀態

### `mursfoto template <command>`

模板管理命令

**子命令:**
- `list` - 列出所有可用模板
- `info <template>` - 顯示模板詳細資訊

### `mursfoto gateway <command>`

Gateway 管理命令

**子命令:**
- `list` - 列出已註冊的服務
- `register <service>` - 手動註冊服務
- `status` - 檢查 Gateway 狀態

### `mursfoto status`

檢查項目和 Gateway 狀態

### `mursfoto config <command>`

配置管理命令

**子命令:**
- `get [key]` - 獲取配置
- `set <key> <value>` - 設置配置
- `reset` - 重置所有配置

### `mursfoto deploy`

部署項目到 Zeabur

## 📦 項目模板

### Minimal 模板
- **ID**: `minimal`
- **描述**: Express + 基本功能
- **適用於**: 簡單的 API 服務

### Calculator 模板
- **ID**: `calculator`
- **描述**: 基於 tw-life-formula
- **適用於**: 計算工具和數學服務

### Test Tool 模板
- **ID**: `test-tool`
- **描述**: 完整測試配置
- **適用於**: 需要完整測試套件的項目

### API Service 模板
- **ID**: `api-service`
- **描述**: RESTful API 服務
- **適用於**: 完整的後端 API 服務

## 🛠 開發指南

### 本地開發

```bash
# 克隆倉庫
git clone https://github.com/YenRuHuang/mursfoto-cli.git
cd mursfoto-cli

# 安裝依賴
npm install

# 全局鏈接（用於本地測試）
npm link

# 測試命令
mursfoto --help
```

### 項目結構

```
mursfoto-cli/
├── bin/                    # CLI 可執行文件
│   ├── mursfoto.js        # 主要 CLI 入口點
│   └── create-project.js  # 獨立創建項目工具
├── lib/                   # 核心邏輯庫
│   ├── commands/          # 命令實現
│   │   ├── create.js     # 項目創建命令
│   │   ├── doctor.js     # 環境診斷命令
│   │   ├── gateway.js    # Gateway 管理命令
│   │   ├── status.js     # 狀態檢查命令
│   │   ├── template.js   # 模板管理命令
│   │   ├── config.js     # 配置管理命令
│   │   └── deploy.js     # 部署命令
│   └── utils/            # 工具函數
│       ├── helpers.js    # 通用幫助函數
│       ├── templates.js  # 模板處理系統
│       └── gateway.js    # Gateway 集成功能
├── templates/            # 項目模板
│   ├── minimal/         # 最小化模板
│   ├── calculator/      # 計算器模板
│   ├── test-tool/       # 測試工具模板
│   └── api-service/     # API 服務模板
├── docs/                # 技術文檔
├── package.json         # 項目配置
└── README.md           # 項目說明
```

## 🧪 測試

```bash
# 運行測試套件
npm test

# 測試項目創建
npm run test:create

# 測試環境診斷
npm run test:doctor
```

## 📝 配置

CLI 工具支持用戶配置，配置文件位於 `~/.mursfoto-cli.json`

**可配置項目:**
```json
{
  "defaultTemplate": "minimal",
  "gatewayUrl": "https://gateway.mursfoto.com",
  "autoInstall": true,
  "autoGitInit": true,
  "autoGatewayRegister": true
}
```

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

### 開發流程

1. Fork 本倉庫
2. 創建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 📄 許可證

本項目基於 [MIT License](LICENSE) 開源。

## 🔗 相關鏈接

- [Mursfoto API Gateway](https://github.com/YenRuHuang/mursfoto-api-gateway)
- [tw-life-formula](https://github.com/YenRuHuang/tw-life-formula)
- [Gateway 線上服務](https://gateway.mursfoto.com)

## 📞 支持

如果您遇到任何問題或有建議，請：

1. [提交 Issue](https://github.com/YenRuHuang/mursfoto-cli/issues)
2. 查看 [技術文檔](docs/)
3. 運行 `mursfoto doctor` 進行環境診斷

---

Made with ❤️ by [Murs](https://github.com/YenRuHuang)
