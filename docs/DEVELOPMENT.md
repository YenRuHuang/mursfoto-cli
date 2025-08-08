# 開發指南

## 項目設置

### 環境要求

- Node.js >= 18.0.0
- npm >= 8.0.0
- Git >= 2.30.0

### 本地開發設置

```bash
# 克隆倉庫
git clone https://github.com/YenRuHuang/mursfoto-cli.git
cd mursfoto-cli

# 安裝依賴
npm install

# 全局鏈接用於本地測試
npm link

# 驗證安裝
mursfoto --version
```

## 項目架構

### 目錄結構

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
├── tests/               # 測試文件
├── package.json         # 項目配置
└── README.md           # 項目說明
```

### 核心組件

#### 1. 命令系統 (Commands)

每個命令都是獨立的模組，位於 `lib/commands/` 目錄下。

**基本結構：**
```javascript
// lib/commands/example.js
const { helpers } = require('../utils');

async function exampleCommand(options = {}) {
  try {
    // 命令邏輯實現
    console.log('執行命令...');
    
    return { success: true };
  } catch (error) {
    helpers.logError('命令執行失敗', error);
    throw error;
  }
}

module.exports = {
  exampleCommand
};
```

#### 2. 工具函數 (Utils)

通用功能放在 `lib/utils/` 目錄下。

**helpers.js** - 通用幫助函數
- 文件操作
- 日誌輸出
- 錯誤處理
- 系統檢查

**templates.js** - 模板處理系統
- 模板加載和解析
- Handlebars 渲染
- 文件生成

**gateway.js** - Gateway 集成
- 服務註冊
- Gateway 配置更新
- Git 自動化

#### 3. 模板系統 (Templates)

每個模板都是一個完整的項目結構，支持 Handlebars 語法。

**模板變量：**
- `{{projectName}}` - 項目名稱 (PascalCase)
- `{{projectNameKebab}}` - 項目名稱 (kebab-case)
- `{{projectNameCamel}}` - 項目名稱 (camelCase)
- `{{port}}` - 服務端口
- `{{description}}` - 項目描述

## 開發流程

### 添加新命令

1. **創建命令文件**
   ```bash
   touch lib/commands/new-command.js
   ```

2. **實現命令邏輯**
   ```javascript
   // lib/commands/new-command.js
   async function newCommand(options = {}) {
     // 實現命令邏輯
   }
   
   module.exports = { newCommand };
   ```

3. **註冊命令到 CLI**
   ```javascript
   // bin/mursfoto.js
   program
     .command('new-command')
     .description('新命令描述')
     .action(async (options) => {
       const { newCommand } = require('../lib/commands/new-command');
       await newCommand(options);
     });
   ```

### 添加新模板

1. **創建模板目錄**
   ```bash
   mkdir templates/new-template
   ```

2. **添加模板文件**
   ```bash
   # 必要文件
   touch templates/new-template/package.json
   touch templates/new-template/server.js
   touch templates/new-template/README.md
   touch templates/new-template/.env.example
   ```

3. **配置模板**
   ```javascript
   // lib/utils/templates.js
   const templates = {
     // ... 現有模板
     'new-template': {
       name: '新模板',
       description: '模板描述',
       icon: '🆕',
       port: 3001,
       dependencies: ['express', 'cors']
     }
   };
   ```

## 測試

### 單元測試

```bash
# 運行所有測試
npm test

# 運行特定測試
npm test -- --testNamePattern="create command"

# 測試覆蓋率
npm run test:coverage
```

### 集成測試

```bash
# 測試項目創建
npm run test:create

# 測試環境診斷
npm run test:doctor

# 測試完整流程
npm run test:e2e
```

### 手動測試

```bash
# 測試基本功能
mursfoto --help
mursfoto doctor
mursfoto template list

# 測試項目創建
mursfoto create test-project --template=minimal --no-git --no-gateway
cd test-project
npm install
npm run dev
```

## 發布流程

### 版本管理

使用 [Semantic Versioning](https://semver.org/)：
- `MAJOR.MINOR.PATCH`
- `1.0.0` - 主要版本
- `1.1.0` - 次要版本  
- `1.1.1` - 修補版本

### 發布步驟

1. **更新版本**
   ```bash
   npm version patch  # 或 minor, major
   ```

2. **更新 CHANGELOG**
   ```bash
   # 手動更新 CHANGELOG.md
   ```

3. **測試發布**
   ```bash
   npm run test:all
   npm run build:check
   ```

4. **發布到 npm**
   ```bash
   npm publish
   ```

5. **創建 Git 標籤**
   ```bash
   git push origin main --tags
   ```

## 代碼風格

### ESLint 配置

```json
{
  "extends": ["eslint:recommended"],
  "env": {
    "node": true,
    "es2020": true
  },
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module"
  },
  "rules": {
    "no-console": "off",
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  }
}
```

### 代碼規範

1. **函數命名**
   - 使用 camelCase
   - 動詞開頭：`createProject`, `checkStatus`

2. **錯誤處理**
   ```javascript
   try {
     await someAsyncOperation();
   } catch (error) {
     helpers.logError('操作失敗', error);
     throw error;
   }
   ```

3. **日誌輸出**
   ```javascript
   const chalk = require('chalk');
   
   console.log(chalk.green('✅ 成功'));
   console.log(chalk.yellow('⚠️ 警告'));
   console.log(chalk.red('❌ 錯誤'));
   ```

## 調試

### 啟用調試模式

```bash
export MURSFOTO_CLI_DEBUG=true
mursfoto create test-project --template=minimal
```

### 常見問題

1. **模板未找到**
   - 檢查 `templates/` 目錄
   - 確認模板配置正確

2. **Gateway 連接失敗**
   - 檢查網絡連接
   - 驗證 Gateway URL

3. **依賴安裝失敗**
   - 清理 npm 緩存: `npm cache clean --force`
   - 重新安裝: `rm -rf node_modules && npm install`

## 貢獻指南

### 提交代碼

1. Fork 倉庫
2. 創建功能分支
3. 提交變更
4. 創建 Pull Request

### 提交信息格式

```
type(scope): description

- feat: 新功能
- fix: 修復
- docs: 文檔更新
- style: 代碼風格
- refactor: 重構
- test: 測試
- chore: 構建工具或輔助工具變更
```

範例：
```
feat(create): 添加 API 服務模板

- 新增 api-service 模板
- 包含完整的 RESTful API 結構
- 支持 JWT 認證和數據庫集成
```

## 性能優化

### CLI 啟動時間

- 延遲加載模組
- 減少不必要的依賴
- 使用 `require()` 而非 `import`

### 模板處理

- 模板文件緩存
- 並行文件處理
- 增量更新策略

## 安全考量

### 輸入驗證

```javascript
const validator = require('validator');

function validateProjectName(name) {
  if (!name || typeof name !== 'string') {
    throw new Error('項目名稱無效');
  }
  
  if (!validator.isAlphanumeric(name.replace(/-/g, ''))) {
    throw new Error('項目名稱只能包含字母、數字和連字符');
  }
  
  return true;
}
```

### 敏感信息處理

- 不在日誌中記錄敏感信息
- 環境變數安全處理
- 配置文件權限控制

---

如有問題，請查看 [API 文檔](API.md) 或提交 [Issue](https://github.com/YenRuHuang/mursfoto-cli/issues)。
