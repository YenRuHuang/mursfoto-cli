# mursfoto-cli Cline 開發指南

## ✅ 環境已修復完成

### 🔧 已解決的問題：
1. **工作目錄問題** - 已配置正確的工作目錄，確保在專案目錄中運行
2. **API KEY 洩漏** - 已清理所有敏感的 API KEY
3. **Prompt 過長問題** - 已調整 token 限制和 context 大小
4. **Claude Code 整合** - 已正確配置 wrapper 腳本

## 🚀 快速開始

### 方法一：使用啟動腳本（推薦）
```bash
cd /Users/murs/Documents/mursfoto-cli
./start-cline-dev.sh
```

### 方法二：手動開啟
```bash
cd /Users/murs/Documents/mursfoto-cli
code .
# 然後在 VSCode 中開啟 Cline
```

## 📋 Cline 設定（已自動配置）

- **API Provider**: claude-code
- **Model**: opus  
- **CLI Path**: /Users/murs/.local/bin/claude-wrapper-cline
- **Max Requests**: 30（避免過長）
- **Output Tokens**: 8192（降低以避免錯誤）
- **Context Size**: 100000

## 🛡️ 避免常見問題

### 1. Prompt 過長
**解決方案**：
- 分步驟執行任務
- 一次只處理少量檔案
- 使用明確的小任務指令

**範例**：
```
❌ 錯誤：「幫我重構整個專案」
✅ 正確：「幫我重構 src/api/upload.js 的錯誤處理」
```

### 2. 工作目錄錯誤
**解決方案**：
- 始終從 mursfoto-cli 目錄啟動
- 使用提供的啟動腳本
- 確保在正確的專案目錄中工作

### 3. API 連接問題
**解決方案**：
- 確保 Claude Code 已登入：`claude auth status`
- 如需重新登入：`claude auth login`
- 使用 wrapper 腳本而非直接調用 claude

## 📝 最佳實踐

### 任務拆分策略
1. **單一檔案修改**
   ```
   「修改 upload.js 中的錯誤處理邏輯」
   ```

2. **功能開發**
   ```
   「新增圖片壓縮功能到 imageProcessor.js」
   ```

3. **測試撰寫**
   ```
   「為 upload 模組撰寫單元測試」
   ```

### 檔案管理
- 排除大型目錄：node_modules, dist, build
- 一次處理 5-10 個檔案
- 使用相對路徑

## 🔍 故障排除

### 問題：Cline 無回應
```bash
# 重啟 Cline
pkill -f claude-wrapper-cline
./start-cline-dev.sh
```

### 問題：Token 限制錯誤
```bash
# 編輯 wrapper 降低 token
vi /Users/murs/.local/bin/claude-wrapper-cline
# 將 MAX_OUTPUT_TOKENS 改為 4096
```

### 問題：工作目錄錯誤
```bash
# 切換到正確的專案目錄
cd /Users/murs/Documents/mursfoto-cli
./start-cline-dev.sh
```

## 📊 專案結構

```
mursfoto-cli/
├── src/           # 主要源碼
├── tests/         # 測試檔案
├── docs/          # 文件
├── .vscode/       # VSCode 設定
│   └── cline.json # Cline 專屬設定
├── package.json   # 專案配置
└── start-cline-dev.sh # 開發環境啟動腳本
```

## 🎯 開發流程

1. **開始工作**
   ```bash
   cd /Users/murs/Documents/mursfoto-cli
   ./start-cline-dev.sh
   ```

2. **在 Cline 中工作**
   - 使用小而精確的任務
   - 定期儲存進度
   - 避免同時修改太多檔案

3. **結束工作**
   - 確保所有變更已儲存
   - 關閉 VSCode
   - 必要時清理暫存檔

## 💡 提示與技巧

1. **使用 Checkpoint**
   - 在重要變更後建立 checkpoint
   - 方便回滾和追蹤

2. **Context 管理**
   - 定期清理不需要的 context
   - 專注於當前任務相關的檔案

3. **效能優化**
   - 關閉不必要的擴充功能
   - 定期重啟 VSCode
   - 保持專案結構整潔

## 📞 需要協助？

如果遇到問題：
1. 檢查此文件的故障排除部分
2. 重新執行修復腳本
3. 檢查 Claude Code 狀態：`claude auth status`
4. 查看 Cline 日誌輸出

---

最後更新：2025年8月11日
版本：1.0
