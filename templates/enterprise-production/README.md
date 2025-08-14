# 🏭 {{projectName}} 企業級生產管理系統

> 基於 FUCO Production System 成功經驗構建的企業級生產管理系統模板

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-blue.svg)](https://expressjs.com/)
[![JWT](https://img.shields.io/badge/JWT-Auth-orange.svg)](https://jwt.io/)
[![Zeabur](https://img.shields.io/badge/Deploy-Zeabur-purple.svg)](https://zeabur.com/)

## 🎯 專案特色

### ⚡ **即用性企業解決方案**
- **完整 JWT 認證系統** - 安全的用戶登入和會話管理
- **角色權限控制** - 管理員、主管、操作員、品管四級權限
- **響應式設計 (RWD)** - 完美支援手機、平板、桌面設備
- **Zeabur 一鍵部署** - 內建完整的雲端部署配置

### 🔧 **基於實戰經驗**
本模板基於 **FUCO Production System** 的成功開發經驗：
- ✅ 已解決 JWT + bcrypt 整合問題
- ✅ 已解決 Zeabur 部署配置問題
- ✅ 已解決 RWD 響應式設計問題
- ✅ 已解決生產環境 Node.js 版本相容性

### 🏗️ **完整架構**
```
{{projectNameKebab}}/
├── src/
│   ├── backend/
│   │   ├── server-simple.js      # 主服務器
│   │   └── middleware/
│   │       └── auth.js           # JWT 認證中間件
│   └── frontend/
│       └── login.html            # 登入頁面
├── test/
│   └── test-jwt-auth.js          # 認證系統測試
├── deployment/
├── database/
├── .env.example                  # 環境配置範本
├── zeabur.json                   # 部署配置
└── package.json                  # 專案配置
```

## 🚀 快速開始

### 1. 創建專案
```bash
# 使用 mursfoto-cli 創建
npx @mursfoto/cli create my-production-system --template=enterprise-production

# 或直接使用
cd my-production-system
```

### 2. 安裝依賴
```bash
npm install
```

### 3. 配置環境
```bash
cp .env.example .env
# 編輯 .env 文件設置您的配置
```

### 4. 啟動開發服務器
```bash
npm run dev
```

### 5. 訪問系統
- 🌐 開發環境：http://localhost:8847
- 🔐 管理員登入：admin / admin123

## 📋 預設功能

### 🔐 **認證系統**
- **JWT Token 認證** - 8小時有效期
- **bcrypt 密碼加密** - 安全的密碼存儲
- **自動登入檢查** - 智能會話管理

### 👥 **用戶角色**
| 角色 | 用戶名 | 密碼 | 權限說明 |
|------|--------|------|----------|
| 🔧 管理員 | admin | admin123 | 完整系統管理權限 |
| 👨‍💼 主管 | supervisor | super123 | 生產管理和審核權限 |
| 👷 操作員 | emp001 | password | 生產記錄和基本操作 |
| 🔍 品管 | qc001 | qc123 | 品質檢查和驗證權限 |

### 🛠️ **API 端點**
```javascript
// 認證相關
POST   /api/auth/login              # 用戶登入

// 生產管理
GET    /api/production/work-orders  # 工單列表
POST   /api/production/records      # 提交生產記錄
GET    /api/production/today-stats  # 今日統計

// 系統管理
GET    /api/workstations           # 工作站列表
GET    /health                     # 健康檢查
```

## 🧪 測試系統

### 運行完整測試
```bash
npm test
```

### JWT 認證測試
```bash
npm run test:jwt
```

### bcrypt 加密測試
```bash
npm run test:bcrypt
```

## 🚀 部署到 Zeabur

### 1. 準備部署
```bash
# 確保配置正確
cat zeabur.json

# 測試系統健康
npm test
```

### 2. 推送到 Git
```bash
git init
git add .
git commit -m "🎉 初始化 {{projectName}} 生產管理系統"
git push origin main
```

### 3. 在 Zeabur 上部署
1. 登入 [Zeabur](https://zeabur.com)
2. 連接您的 Git 倉庫
3. 選擇自動部署
4. 系統將自動讀取 `zeabur.json` 配置

### 4. 環境變數設置
在 Zeabur 控制台設置以下環境變數：
```
NODE_ENV=production
JWT_SECRET=your-super-secure-secret-key
PORT=8847
```

## 📱 RWD 響應式支援

本系統完全支援響應式設計：

- **📱 手機** (< 480px): 單欄布局，觸控優化
- **📟 平板** (480px - 768px): 適應性布局
- **💻 桌面** (> 768px): 完整功能布局

### CSS 媒體查詢
```css
/* 手機版本 */
@media (max-width: 480px) {
    .container { padding: 20px 15px; }
}

/* 平板版本 */
@media (min-width: 481px) and (max-width: 768px) {
    .container { padding: 30px 25px; }
}

/* 桌面版本 */
@media (min-width: 769px) {
    .container { padding: 40px 30px; }
}
```

## 🔧 自定義和擴展

### 新增 API 端點
在 `src/backend/server-simple.js` 中新增：
```javascript
app.get('/api/your-endpoint', authenticateToken, (req, res) => {
    // 您的 API 邏輯
});
```

### 新增用戶角色
在 `src/backend/middleware/auth.js` 中擴展：
```javascript
const requireCustomRole = requireRole(['admin', 'custom']);
```

### 新增前端頁面
1. 在 `src/frontend/` 創建新的 HTML 文件
2. 在服務器中新增路由
3. 確保包含 JWT 驗證

## 🛡️ 安全最佳實踐

### 已實現的安全措施
- ✅ **JWT Token 驗證** - 防止未授權訪問
- ✅ **bcrypt 密碼加密** - 安全密碼存儲
- ✅ **CORS 保護** - 跨域請求控制
- ✅ **SQL 注入防護** - 參數化查詢
- ✅ **XSS 防護** - 輸入驗證和轉義

### 建議的額外安全措施
```javascript
// Rate Limiting
const rateLimit = require('express-rate-limit');

// HTTPS 強制
app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
        res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
        next();
    }
});
```

## 📊 效能優化

### 已優化項目
- ⚡ **靜態文件緩存** - Express.static 配置
- ⚡ **JWT Token 有效期** - 8小時平衡安全性和用戶體驗
- ⚡ **bcrypt Rounds** - 10 輪平衡安全性和效能
- ⚡ **響應式 CSS** - 優化載入時間

### 建議的效能改進
```javascript
// 啟用 gzip 壓縮
const compression = require('compression');
app.use(compression());

// 靜態文件緩存
app.use(express.static('public', {
    maxAge: '1d',
    etag: true
}));
```

## 🔄 版本更新

### v1.0.0 (當前版本)
- ✅ 基礎 JWT 認證系統
- ✅ 四級角色權限控制
- ✅ RWD 響應式設計
- ✅ Zeabur 一鍵部署
- ✅ 完整測試套件

### 計劃功能 (v1.1.0)
- 🔄 WebSocket 即時通訊
- 🔄 資料庫整合 (PostgreSQL/MySQL)
- 🔄 檔案上傳功能
- 🔄 Email 通知系統

## 🤝 技術支援

### 常見問題
1. **JWT Token 過期** - 重新登入或調整有效期
2. **bcrypt 相容性** - 確保 Node.js 18+ 版本
3. **Zeabur 502 錯誤** - 檢查 PORT 環境變數
4. **RWD 顯示問題** - 檢查 viewport meta 標籤

### 獲取幫助
- 📧 技術支援：yenru@mursfoto.com
- 📚 文檔：https://docs.mursfoto.com
- 🐛 問題回報：GitHub Issues

## 📄 授權

MIT License - 詳見 [LICENSE](LICENSE) 文件

---

**🎉 由 Mursfoto 團隊基於 FUCO Production System 成功經驗製作**

> 讓企業級生產管理系統開發變得簡單、快速、可靠！
