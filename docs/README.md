# 📚 Mursfoto CLI 文檔

歡迎來到 Mursfoto CLI 的完整文檔中心！這裡包含了所有您需要的指南和參考資料。

## 📖 **快速開始**

### 🎯 基礎使用
- [開發指南](DEVELOPMENT.md) - 本地開發和貢獻指南
- [API 參考](API.md) - 完整的 API 文檔

### 🔧 整合指南
- [Claude Code 整合](CLAUDE_CODE_INTEGRATION.md) - 與 Claude Code CLI 的整合設定
- [Cline 開發指南](CLINE_DEVELOPMENT.md) - 使用 Cline IDE 進行開發
- [MCP 實踐指南](MCP_PRACTICAL_IMPLEMENTATION.md) - Model Context Protocol 整合實務

## 📋 **專業指南**

### 🚀 部署和發布
- [發布指南](RELEASE_GUIDE.md) - 版本發布和管理流程
- [NPM 發布指南](NPM_PUBLISH_GUIDE.md) - 套件發布到 NPM 的詳細步驟

### 🔌 服務整合
- [推薦 MCP 服務器](RECOMMENDED_MCP_SERVERS.md) - 精選的 MCP 服務器清單和配置

## 🏗️ **架構概覽**

Mursfoto CLI 採用統一架構設計，主要組件包括：

```
mursfoto-cli/
├── bin/                    # CLI 入口點
├── lib/
│   ├── commands/          # CLI 命令實現
│   ├── services/          # 統一服務架構
│   │   ├── ai-unified.js      # AI 統合服務
│   │   ├── deployment-unified.js # 部署統合服務
│   │   ├── development-unified.js # 開發統合服務
│   │   └── system-unified.js     # 系統統合服務
│   ├── modules/           # 模組化系統
│   ├── gui/               # 圖形使用者介面
│   └── utils/             # 工具函數
├── templates/             # 專案模板
├── test/                  # 測試套件
└── docs/                  # 文檔目錄（您目前的位置）
```

## 🎯 **主要功能**

### Version 4.0 統一架構
- **75% 性能提升** - 從 16+ 分散服務重構為 4 個統一服務
- **模組化系統** - 企業級模組管理
- **完整測試** - 單元測試、整合測試、E2E 測試
- **CI/CD 工作流程** - GitHub Actions 自動化

### AI 和自動化
- **Claude Code 整合** - 6 個專業 AI 人格角色
- **Ollama GPT 本地引擎** - 完全離線的 AI 支援
- **MCP 生態系統** - 10+ 服務整合

### 開發工具
- **專案模板** - minimal、enterprise-production 等
- **自動化部署** - Zeabur 雲平台整合
- **GUI 介面** - 網頁版管理介面

## 🆘 **需要幫助？**

1. **快速問題** - 查看對應的指南文檔
2. **深入問題** - 閱讀 [開發指南](DEVELOPMENT.md)
3. **提出問題** - 在 [GitHub Issues](https://github.com/YenRuHuang/mursfoto-cli/issues) 回報
4. **貢獻代碼** - 參考 [開發指南](DEVELOPMENT.md) 中的貢獻流程

## 📝 **文檔維護**

這些文檔會隨著 Mursfoto CLI 的發展持續更新。如果您發現任何過時或錯誤的信息，請透過 GitHub Issues 告知我們。

---

**🎉 感謝使用 Mursfoto CLI！**

讓 Web 服務開發變得簡單、快速、可靠！🚀