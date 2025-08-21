# 🚀 Mursfoto CLI 實際應用工作流程

## 📋 完整開發流程

### 🎯 **階段 1: 需求分析與項目啟動**

#### 1.1 客戶需求收集 Prompt 模板
```
## 專案需求分析

### 客戶資訊
- **公司名稱**: [客戶公司名]
- **行業類型**: [例: 電商、教育、醫療]
- **公司規模**: [例: 50人中小企業]
- **預算範圍**: [例: 10-50萬]
- **完成時程**: [例: 2個月]

### 功能需求
1. **核心功能**:
   - [主要功能描述]
   - [次要功能描述]
   
2. **用戶角色**:
   - [管理員]: 權限和功能
   - [一般用戶]: 權限和功能
   
3. **技術需求**:
   - 資料庫整合需求
   - 第三方API整合
   - 效能要求
   - 安全性需求

### 請幫我制定:
1. 技術架構建議
2. 開發時程規劃
3. 風險評估
4. 資料庫設計
5. API 設計規劃
```

#### 1.2 選擇合適的模板

```bash
# 根據項目複雜度選擇模板:

# 簡單工具/原型 -> minimal
mursfoto create simple-tool --template minimal

# 企業級應用 -> enterprise-production  
mursfoto create enterprise-app --template enterprise-production

# 工作流自動化 -> n8n
mursfoto create workflow-app --template n8n
```

### 🛠️ **階段 2: 開發實施**

#### 2.1 項目結構規劃 Prompt
```
基於我剛創建的項目 [項目名稱]，請幫我:

## 目標
設計一個 [項目描述，例: 員工考勤管理系統]

## 現有結構
- 使用了 [模板名稱] 模板
- 已有基礎的 Express.js 框架
- 包含 JWT 認證機制

## 需要新增的功能模組
1. **資料庫層**:
   - 設計 users, attendance_records 表
   - 建立 database/models/ 目錄
   
2. **API 層**:
   - /api/auth (登入/登出)
   - /api/attendance (打卡記錄)
   - /api/reports (報表查詢)
   
3. **前端界面**:
   - 登入頁面
   - 打卡界面  
   - 管理後台
   - 報表頁面

請幫我:
1. 設計完整的資料夾結構
2. 建立所需的檔案
3. 寫出每個 API 端點的程式碼
4. 設計前端頁面布局
```

#### 2.2 資料庫設計 Prompt
```
請為我的 [項目名稱] 設計完整的資料庫架構:

## 功能需求回顧
- 用戶登入系統
- 考勤打卡記錄
- 報表查詢功能
- 管理員權限控制

## 請設計:
1. **資料表結構** (包含所有欄位、類型、索引)
2. **資料表關聯圖**
3. **SQL 建立腳本**
4. **Node.js 資料庫連接設定**
5. **Sequelize/Mongoose 模型定義**

## 技術棧
- 資料庫: PostgreSQL (或 MySQL)
- ORM: Sequelize
- 後端: Node.js + Express
```

#### 2.3 API 開發 Prompt 
```
基於之前設計的資料庫結構，請幫我開發完整的 API:

## 需要的 API 端點

### 認證相關
- POST /api/auth/login
- POST /api/auth/logout  
- GET /api/auth/profile

### 考勤管理
- POST /api/attendance/checkin
- POST /api/attendance/checkout
- GET /api/attendance/records/:userId
- GET /api/attendance/today

### 報表功能
- GET /api/reports/monthly/:userId
- GET /api/reports/export/excel
- GET /api/reports/dashboard

## 每個端點請提供:
1. 完整的路由處理函數
2. 輸入驗證 (使用 joi 或類似)
3. 錯誤處理
4. JWT 權限驗證
5. 回應格式統一
6. API 文檔註解
```

### 🎨 **階段 3: 前端開發**

#### 3.1 前端界面開發 Prompt
```
請為考勤系統開發完整的前端界面:

## 頁面需求
1. **登入頁面** (login.html)
2. **員工打卡頁面** (dashboard.html) 
3. **管理員後台** (admin.html)
4. **報表查看頁面** (reports.html)

## 設計要求
- 響應式設計 (手機友善)
- 現代化 UI (使用 Bootstrap 5 或 Tailwind)
- 良好的用戶體驗
- 表單驗證
- 載入狀態提示

## 功能需求
- AJAX 調用後端 API
- JWT token 管理
- 錯誤處理和提示
- 資料表格展示
- 圖表展示 (使用 Chart.js)

請提供:
1. 完整的 HTML 結構
2. CSS 樣式設計
3. JavaScript 功能實現
4. API 串接程式碼
```

### 🧪 **階段 4: 測試與優化**

#### 4.1 測試開發 Prompt
```
請為我的考勤系統建立完整的測試:

## 測試類型
1. **單元測試** (API 端點測試)
2. **整合測試** (資料庫操作測試)
3. **端對端測試** (前端功能測試)

## 測試場景
- 用戶註冊/登入流程
- 打卡功能正確性
- 報表資料準確性
- 權限控制驗證
- 錯誤情況處理

## 使用工具
- Jest (單元測試)
- Supertest (API 測試)
- Puppeteer (E2E 測試)

請提供:
1. 測試檔案結構
2. 完整的測試程式碼
3. 測試資料準備
4. CI/CD 設定
```

### 🚀 **階段 5: 部署與交付**

#### 5.1 部署準備 Prompt
```
請幫我準備考勤系統的部署配置:

## 部署環境
- 客戶內網伺服器
- Ubuntu 20.04
- 需要 Docker 容器化

## 部署需求
1. **Docker 配置**
   - Dockerfile
   - docker-compose.yml
   - 環境變數設定

2. **資料庫部署**
   - PostgreSQL 容器
   - 初始化腳本
   - 備份策略

3. **反向代理**
   - Nginx 配置
   - SSL 憑證設定

4. **監控與日誌**
   - PM2 程序管理
   - 日誌輪轉
   - 健康檢查

請提供:
1. 完整的部署腳本
2. 環境配置文件
3. 部署步驟說明
4. 常見問題解決
```

## 🎯 **實際應用技巧**

### **1. Prompt 優化技巧**

#### ✅ **好的 Prompt 範例**:
```
## 具體任務
請為我的考勤系統創建用戶登入 API

## 明確需求
- 使用 JWT 驗證
- 密碼需要 bcrypt 加密
- 支援用戶名或 email 登入
- 登入失敗 3 次鎖定帳戶
- 回傳格式: { success, token, user, message }

## 技術限制
- 使用 Express.js
- 資料庫是 PostgreSQL
- 已有 User 模型定義

## 期望輸出
1. 完整的路由處理函數
2. 輸入驗證邏輯
3. 錯誤處理機制
4. 測試案例
```

#### ❌ **不好的 Prompt**:
```
幫我寫一個登入功能
```

### **2. 工具整合策略**

```bash
# 階段性使用不同工具
# 1. 項目啟動
mursfoto create project-name --template enterprise-production

# 2. 開發階段 - 使用 AI 輔助
# [在 Claude Code 中進行詳細開發]

# 3. 測試階段
mursfoto doctor  # 檢查環境
npm test        # 執行測試

# 4. 部署階段
mursfoto gui    # 啟動監控面板
```

### **3. 客戶溝通技巧**

#### 需求確認階段:
```
## 客戶溝通 Checklist
□ 功能需求是否明確
□ 技術需求是否可行
□ 時程安排是否合理
□ 預算是否足夠
□ 維護需求是否清楚

## 進度回報模板
週報格式:
- ✅ 已完成: [具體功能]
- 🚧 進行中: [當前工作]
- 📋 下週計劃: [下週目標]
- ⚠️ 風險提醒: [潛在問題]
```

## 💡 **成功秘訣**

1. **詳細的需求文檔** - 避免後期需求變更
2. **階段性交付** - 讓客戶及早看到進度
3. **完整的測試** - 確保品質
4. **良好的文檔** - 便於維護
5. **定期溝通** - 建立客戶信任

這樣的工作流程可以大大提升開發效率，並且確保專案品質！