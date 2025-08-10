# 🚀 @mursfoto/cli NPM 發布準備指南

## 📋 發布前準備步驟

### 1. 🔐 NPM 帳號設置

#### 首次設置 NPM 帳號
如果你還沒有 NPM 帳號：
```bash
# 前往 https://www.npmjs.com/ 註冊帳號
# 選擇一個唯一的用戶名和 email
```

#### 登入 NPM
```bash
npm login
# 或者使用
npm adduser
```

輸入你的：
- **Username**: 你的 NPM 用戶名
- **Password**: 你的 NPM 密碼  
- **Email**: 註冊時使用的 email
- **OTP**: 雙重認證碼（如果已啟用）

#### 驗證登入狀態
```bash
npm whoami
# 應該顯示你的用戶名
```

### 2. 📦 套件名稱檢查

```bash
npm view @mursfoto/cli
# 如果顯示 npm ERR! 404，表示套件名稱可用
```

### 3. 🏗️ 發布前最後檢查

```bash
# 確保工作區乾淨
git status

# 運行測試
npm test

# 檢查套件內容
npm pack --dry-run
```

### 4. 🚀 執行首次發布

準備就緒後，使用我們的自動化發布系統：

```bash
# 首次發布建議使用 minor 版本（因為這是重大功能完整版本）
npm run release:minor
```

這會自動執行：
1. ✅ 工作區檢查
2. ✅ 測試套件執行  
3. ✅ 項目建構
4. ✅ 版本更新 (3.0.0 → 3.1.0)
5. ✅ 變更日誌生成
6. ✅ Git 提交和標籤
7. ✅ **NPM 發布** 
8. ✅ GitHub 推送
9. ✅ GitHub Release 創建

## 🎯 發布後驗證

### 1. 檢查 NPM 套件頁面
```bash
open https://www.npmjs.com/package/@mursfoto/cli
```

### 2. 測試安裝
```bash
npm install -g @mursfoto/cli@latest
mursfoto --version
```

### 3. 查看統計資料
```bash
npm run stats
```

## 🔧 故障排除

### 常見問題

#### 1. 套件名稱衝突
```bash
# 如果 @mursfoto/cli 已被使用，考慮其他名稱：
# @yourname/mursfoto-cli
# @mursfoto/autodev-cli
# mursfoto-cli-tool
```

#### 2. 權限問題
```bash
# 確保你有發布權限
npm owner ls @mursfoto/cli
```

#### 3. 網路問題
```bash
# 使用官方 registry
npm config set registry https://registry.npmjs.org/
```

## 💡 發布策略建議

### 版本選擇
- **首次發布**: 使用 `npm run release:minor` (3.0.0 → 3.1.0)
- **後續小更新**: 使用 `npm run release:patch`
- **重大功能**: 使用 `npm run release:minor`
- **重大變更**: 使用 `npm run release:major`

### 發布時間
- **最佳時間**: 工作日上午 (UTC+8 09:00-11:00)
- **避免時間**: 週五晚上、節假日

### 發布清單
- [ ] 所有功能測試完成
- [ ] 文檔已更新
- [ ] README.md 包含最新資訊
- [ ] 依賴項已更新
- [ ] Git 倉庫狀態乾淨

## 🎉 發布成功後

1. **更新 README**: 添加 npm badge
2. **社群分享**: Twitter、LinkedIn、技術社群
3. **監控反饋**: GitHub Issues、NPM 下載量
4. **持續改進**: 基於用戶反饋優化

---

**準備好了嗎？讓我們發布這個強大的自動化開發工具！** 🚀
