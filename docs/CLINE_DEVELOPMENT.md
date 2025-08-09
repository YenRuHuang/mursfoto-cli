# 🤖 使用 Cline + Claude 開發 Mursfoto CLI Phase 2 指南

**Mursfoto AutoDev Factory 2.0 - AI 驅動智能開發工具協作指南**

## 🎯 開發環境特點

### ✅ 優勢
- **智能代碼生成**: Claude 可以生成高質量的代碼
- **自動化測試**: 可以自動執行測試和驗證
- **實時調試**: 即時執行命令並查看結果
- **文檔生成**: 自動生成完整的技術文檔
- **Vision 支持**: 可以分析截圖和 UI 界面

### ⚠️ 限制和注意事項
- **Context Window**: 長時間對話需要管理 token 使用量
- **工具序列化**: 每次只能使用一個工具，需要逐步執行
- **工作目錄限制**: 只能在指定目錄下操作
- **互動式命令**: 需要特殊處理持續運行的服務

## 🛠️ 最佳開發實踐

### 1. **項目初始化檢查**
```bash
# 每次開始開發前執行
mursfoto doctor                    # 環境診斷
mursfoto status                    # 檢查當前狀態
git status                         # 確認 Git 狀態
```

### 2. **模組化開發策略**
- 將大功能拆分為小模組
- 每個模組獨立測試和驗證
- 使用 `new_task` 工具管理複雜任務

### 3. **自動化測試流程**
```bash
# 測試新功能的標準流程
cd /tmp
mursfoto create test-project --template=minimal
cd test-project
npm install
npm run dev                        # 在背景測試運行
```

### 4. **錯誤處理和調試**
- 利用 Discord 通知系統實時監控
- 使用 vision MCP 截圖分析 UI 問題
- 檢查日誌文件了解詳細錯誤信息

## 🔍 Context Window 管理

### 當前使用情況監控
```javascript
// 在開發過程中注意 environment_details 中的：
// Context Window Usage: X / 200K tokens used (X%)
```

### 何時使用 new_task
- Context 使用超過 80% 時
- 開始新的大型功能開發時
- 需要切換到不同的開發主題時

### 任務切換最佳實踐
```markdown
1. 總結當前完成的工作
2. 列出剩餘的待辦任務
3. 記錄重要的技術決策
4. 使用 new_task 創建新對話
5. 在新對話中重新加載必要的 context
```

## 🚀 特殊工具和功能

### Vision MCP 使用
```bash
# 截圖分析當前桌面
screenshot_desktop --analysis_type=ui_elements

# 分析特定圖片
analyze_image --image_path=/path/to/screenshot.png --analysis_type=describe
```

### 自動化部署
```bash
# 完整的部署流程
mursfoto create my-service --template=api-service
cd my-service
mursfoto deploy                    # 自動部署到 Zeabur
```

### 智能錯誤診斷
```bash
# 出現問題時的診斷流程
mursfoto doctor                    # 系統環境檢查
mursfoto gateway list              # Gateway 狀態檢查  
mursfoto status                    # 服務狀態檢查
```

## 📊 性能優化建議

### 1. **命令組合使用**
```bash
# 好的做法：組合命令
cd ../mursfoto-cli && npm install && npm test

# 避免：分別執行多個命令
cd ../mursfoto-cli
npm install  
npm test
```

### 2. **批量文件操作**
- 使用 `write_to_file` 創建新文件
- 使用 `replace_in_file` 進行精確修改
- 避免頻繁的小幅度文件修改

### 3. **智能測試策略**
- 創建測試項目在 `/tmp` 目錄
- 使用完後清理測試文件
- 利用 Docker 容器隔離測試環境

## 🎯 開發工作流程範例

```bash
# 1. 環境準備
mursfoto doctor

# 2. 功能開發
# 使用 Cline 進行代碼編寫和測試

# 3. 集成測試
mursfoto create integration-test --template=minimal
cd integration-test && npm install && npm test

# 4. 部署驗證
mursfoto deploy

# 5. 狀態確認
mursfoto status
```

## 💡 進階技巧

### 使用 MCP 服務器
- Vision 服務器：分析 UI 和截圖
- 未來可擴展：添加更多 MCP 服務器

### 智能代碼生成
- 讓 Claude 根據需求自動生成完整模組
- 利用 template 系統快速創建標準化項目
- 自動生成測試代碼和文檔

### 實時監控和通知
- Discord 通知系統提供即時反饋
- Sentry 錯誤監控確保生產環境穩定
- 日誌系統記錄詳細的操作歷史

---

**🎉 結論**：Cline + Claude 是一個強大的開發組合，合理利用其特點並遵循最佳實踐，可以大大提高開發效率和代碼質量！
