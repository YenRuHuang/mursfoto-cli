# 📚 @mursfoto/cli 發布流程使用指南

## 🚀 快速開始

### 前置需求
- Node.js >= 18.0.0
- NPM >= 8.0.0
- Git 已配置並連接到 GitHub
- （可選）GitHub CLI (`gh`) 用於自動創建 Release

### 安裝 GitHub CLI (推薦)
```bash
# macOS
brew install gh

# Windows (使用 Chocolatey)
choco install gh

# 登入 GitHub
gh auth login
```

---

## 📋 發布前檢查清單

在發布新版本前，請確保：

- [ ] 所有功能開發完成
- [ ] 所有測試通過 (`npm test`)
- [ ] 代碼已通過 lint 檢查 (`npm run lint`)
- [ ] 工作區沒有未提交的變更
- [ ] README.md 和文檔已更新
- [ ] 依賴版本已更新至最新穩定版

---

## 🔄 發布流程

### 步驟 1: 生成變更日誌
```bash
npm run changelog
```
這會自動：
- 分析 Git 提交記錄
- 分類變更類型（新功能、修復、文檔等）
- 更新 `CHANGELOG.md`
- 生成 `RELEASE_NOTES.md`

### 步驟 2: 檢查統計資訊
```bash
npm run stats
```
查看：
- NPM 下載統計
- GitHub 倉庫統計
- 趨勢分析和建議

### 步驟 3: 執行發布
根據變更類型選擇對應的發布命令：

#### 🐛 錯誤修復 (Patch 版本)
```bash
npm run release:patch
# 例如: 3.0.0 → 3.0.1
```

#### ✨ 新功能 (Minor 版本)
```bash
npm run release:minor
# 例如: 3.0.0 → 3.1.0
```

#### 🚀 重大變更 (Major 版本)
```bash
npm run release:major
# 例如: 3.0.0 → 4.0.0
```

#### 📦 預設發布 (Patch)
```bash
npm run release
# 預設執行 patch 版本發布
```

---

## 🛠️ 發布流程詳解

當你執行發布命令時，系統會自動執行以下步驟：

### 1. 🔍 發布前檢查
- 檢查 Git 工作區是否乾淨
- 確保沒有未提交的變更

### 2. 🧪 執行測試
- 運行完整測試套件
- 確保所有測試通過

### 3. 🔨 建構項目
- 執行建構流程
- 驗證建構結果

### 4. 📝 更新版本
- 根據指定類型更新版本號
- 修改 `package.json`

### 5. 📋 生成變更日誌
- 自動更新 `CHANGELOG.md`
- 生成 `RELEASE_NOTES.md`

### 6. 💾 提交變更
- 將所有變更添加到 Git
- 創建版本提交和標籤

### 7. 📦 發布到 NPM
- 執行 `npm publish`
- 發布到 NPM 註冊表

### 8. 🔄 推送到 GitHub
- 推送代碼和標籤到 GitHub
- 同步遠程倉庫

### 9. 🚀 創建 GitHub Release
- 使用 GitHub CLI 創建 Release
- 自動添加發布說明

---

## 📊 統計和監控

### 查看發布統計
```bash
npm run stats
```

### 生成的報告文件
- `CHANGELOG.md` - 完整變更歷史
- `RELEASE_NOTES.md` - 當前版本發布說明
- `stats-report-{timestamp}.json` - 統計資料

---

## 🚨 故障排除

### 常見問題

#### 1. Git 工作區不乾淨
**錯誤：** "工作區有未提交的變更"
**解決：** 
```bash
git add .
git commit -m "提交說明"
```

#### 2. 測試失敗
**錯誤：** "測試失敗，發布中止"
**解決：** 
```bash
npm test  # 查看具體錯誤
# 修復測試問題後重新發布
```

#### 3. NPM 發布權限
**錯誤：** "NPM 發布失敗"
**解決：** 
```bash
npm whoami  # 檢查登入狀態
npm login   # 重新登入 NPM
```

#### 4. GitHub CLI 未安裝
**警告：** "GitHub CLI 未安裝"
**解決：** 
```bash
# 安裝 GitHub CLI 或手動創建 Release
gh release create v3.0.1 --title "🚀 Release v3.0.1" --notes-file RELEASE_NOTES.md
```

---

## 🔧 自定義配置

### 修改發布行為
編輯 `scripts/release.js` 來自定義：
- 測試命令
- 建構流程
- 提交訊息格式
- GitHub Release 設定

### 自定義變更日誌
編輯 `scripts/generate-changelog.js` 來調整：
- 提交分類規則
- 輸出格式
- 語言設定

---

## 📈 最佳實踐

### 提交訊息規範
遵循 Conventional Commits 格式：
```bash
feat: 添加新功能
fix: 修復錯誤
docs: 更新文檔
style: 代碼格式調整
refactor: 重構代碼
test: 添加測試
chore: 維護更新
```

### 版本管理策略
- **Patch (0.0.x)**: 錯誤修復、小改動
- **Minor (0.x.0)**: 新功能、向下相容
- **Major (x.0.0)**: 重大變更、不相容更新

### 發布頻率建議
- **開發階段**: 每週發布 patch 版本
- **穩定階段**: 每月發布 minor 版本  
- **重大更新**: 每季度考慮 major 版本

---

## 🔗 相關資源

- [語義化版本規範](https://semver.org/lang/zh-TW/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub CLI 文檔](https://cli.github.com/manual/)
- [NPM 發布指南](https://docs.npmjs.com/cli/v8/commands/npm-publish)

---

## 💡 提示和技巧

1. **發布前預覽**
   ```bash
   npm publish --dry-run  # 預覽發布內容
   ```

2. **檢查套件內容**
   ```bash
   npm pack  # 生成 .tgz 檔案並檢查內容
   ```

3. **回滾版本**
   ```bash
   npm unpublish @mursfoto/cli@3.0.1  # 謹慎使用
   ```

4. **測試安裝**
   ```bash
   npm install -g @mursfoto/cli@latest
   ```

---

## 🎯 結語

通過遵循這個發布流程，你可以確保：
- 穩定可靠的版本發布
- 完整的變更追蹤
- 自動化的品質檢查
- 一致的發布體驗

如有任何問題，請查看 `docs/PHASE4B_COMPLETION_REPORT.md` 或提交 Issue。

**Happy Releasing! 🚀**
