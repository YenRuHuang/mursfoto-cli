const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')
const { copyFileWithTemplate } = require('./helpers')

/**
 * 獲取模板配置
 */
async function getTemplateConfig (templateName) {
  const templatesDir = path.join(__dirname, '../templates')
  const templateDir = path.join(templatesDir, templateName)

  if (!fs.existsSync(templateDir)) {
    return null
  }

  const configPath = path.join(templateDir, 'template.config.js')

  if (fs.existsSync(configPath)) {
    try {
      delete require.cache[require.resolve(configPath)]
      return require(configPath)
    } catch (error) {
      console.warn(chalk.yellow(`警告: 無法載入模板配置 ${configPath}: ${error.message}`))
    }
  }

  // 返回默認配置
  return getDefaultTemplateConfig(templateName)
}

/**
 * 獲取默認模板配置
 */
function getDefaultTemplateConfig (templateName) {
  const configs = {
    minimal: {
      name: '最小化模板',
      description: 'Express + 基本功能的最小化項目模板',
      version: '1.0.0',
      dependencies: {
        express: '^4.18.2',
        dotenv: '^16.3.1',
        helmet: '^7.0.0',
        cors: '^2.8.5'
      },
      devDependencies: {
        nodemon: '^3.0.1'
      },
      scripts: {
        start: 'node server.js',
        dev: 'nodemon server.js',
        test: 'echo "No tests specified"'
      },
      port: 3001,
      quickStart: [
        '1. cd {{projectName}}',
        '2. npm run dev',
        '3. 打開瀏覽器訪問 http://localhost:3001'
      ]
    },
    calculator: {
      name: '計算器模板',
      description: '基於 tw-life-formula 的計算器項目模板',
      version: '1.0.0',
      dependencies: {
        express: '^4.18.2',
        dotenv: '^16.3.1',
        helmet: '^7.0.0',
        cors: '^2.8.5',
        'express-rate-limit': '^7.1.5',
        joi: '^17.11.0'
      },
      devDependencies: {
        nodemon: '^3.0.1',
        jest: '^29.6.2'
      },
      scripts: {
        start: 'node server.js',
        dev: 'nodemon server.js',
        test: 'jest',
        'test:watch': 'jest --watch'
      },
      port: 3001,
      quickStart: [
        '1. cd {{projectName}}',
        '2. npm run dev',
        '3. 添加你的計算邏輯到 routes/calculator.js',
        '4. 測試 API: GET /api/calculate'
      ]
    },
    'test-tool': {
      name: '測試工具模板',
      description: '包含完整測試配置的項目模板',
      version: '1.0.0',
      dependencies: {
        express: '^4.18.2',
        dotenv: '^16.3.1',
        helmet: '^7.0.0',
        cors: '^2.8.5'
      },
      devDependencies: {
        nodemon: '^3.0.1',
        jest: '^29.6.2',
        supertest: '^6.3.3',
        eslint: '^8.52.0'
      },
      scripts: {
        start: 'node server.js',
        dev: 'nodemon server.js',
        test: 'jest',
        'test:watch': 'jest --watch',
        'test:coverage': 'jest --coverage',
        lint: 'eslint .',
        'lint:fix': 'eslint . --fix'
      },
      port: 3001,
      quickStart: [
        '1. cd {{projectName}}',
        '2. npm run dev',
        '3. 運行測試: npm test',
        '4. 檢查代碼質量: npm run lint'
      ]
    },
    'api-service': {
      name: 'API 服務模板',
      description: 'RESTful API 服務項目模板',
      version: '1.0.0',
      dependencies: {
        express: '^4.18.2',
        dotenv: '^16.3.1',
        helmet: '^7.0.0',
        cors: '^2.8.5',
        'express-rate-limit': '^7.1.5',
        'express-validator': '^7.0.1',
        joi: '^17.11.0',
        winston: '^3.11.0'
      },
      devDependencies: {
        nodemon: '^3.0.1',
        jest: '^29.6.2',
        supertest: '^6.3.3'
      },
      scripts: {
        start: 'node server.js',
        dev: 'nodemon server.js',
        test: 'jest',
        'test:watch': 'jest --watch'
      },
      port: 3001,
      quickStart: [
        '1. cd {{projectName}}',
        '2. npm run dev',
        '3. API 文檔: http://localhost:3001/api/docs',
        '4. 健康檢查: http://localhost:3001/health'
      ]
    }
  }

  return configs[templateName] || configs.minimal
}

/**
 * 處理項目模板
 */
async function processTemplate (templateName, targetDir, templateData) {
  const templatesDir = path.join(__dirname, '../templates')
  const templateDir = path.join(templatesDir, templateName)

  // 如果模板目錄不存在，使用默認模板
  if (!fs.existsSync(templateDir)) {
    await createDefaultTemplate(templateName, targetDir, templateData)
    return
  }

  // 複製模板文件
  await copyTemplateFiles(templateDir, targetDir, templateData)
}

/**
 * 複製模板文件
 */
async function copyTemplateFiles (sourceDir, targetDir, templateData) {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true })

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name)
    let targetPath = path.join(targetDir, entry.name)

    // 跳過配置文件
    if (entry.name === 'template.config.js') {
      continue
    }

    // 處理文件名模板
    if (entry.name.includes('{{')) {
      const processedName = processFileName(entry.name, templateData)
      targetPath = path.join(targetDir, processedName)
    }

    if (entry.isDirectory()) {
      await fs.ensureDir(targetPath)
      await copyTemplateFiles(sourcePath, targetPath, templateData)
    } else {
      await copyFileWithTemplate(sourcePath, targetPath, templateData)
    }
  }
}

/**
 * 處理文件名模板
 */
function processFileName (fileName, templateData) {
  const Handlebars = require('handlebars')
  const template = Handlebars.compile(fileName)
  return template(templateData)
}

/**
 * 創建默認模板
 */
async function createDefaultTemplate (templateName, targetDir, templateData) {
  const config = getDefaultTemplateConfig(templateName)

  // 創建 package.json
  const packageJson = {
    name: templateData.projectNameKebab,
    version: config.version,
    description: templateData.description,
    main: 'server.js',
    scripts: config.scripts,
    keywords: [
      templateData.projectNameKebab,
      'mursfoto',
      'api-gateway',
      'service'
    ],
    author: templateData.author,
    license: 'MIT',
    dependencies: config.dependencies,
    devDependencies: config.devDependencies
  }

  await fs.writeFile(
    path.join(targetDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  )

  // 創建基本文件
  await createBasicFiles(templateName, targetDir, templateData, config)
}

/**
 * 創建基本文件
 */
async function createBasicFiles (templateName, targetDir, templateData, config) {
  // server.js
  const serverContent = generateServerContent(templateName, templateData, config)
  await fs.writeFile(path.join(targetDir, 'server.js'), serverContent)

  // .env.example
  const envContent = generateEnvContent(templateData, config)
  await fs.writeFile(path.join(targetDir, '.env.example'), envContent)

  // README.md
  const readmeContent = generateReadmeContent(templateData, config)
  await fs.writeFile(path.join(targetDir, 'README.md'), readmeContent)

  // .gitignore
  const gitignoreContent = generateGitignoreContent()
  await fs.writeFile(path.join(targetDir, '.gitignore'), gitignoreContent)

  // zeabur.json
  const zeaburContent = generateZeaburConfig(templateData, config)
  await fs.writeFile(path.join(targetDir, 'zeabur.json'), zeaburContent)

  // Dockerfile
  const dockerfileContent = generateDockerfileContent()
  await fs.writeFile(path.join(targetDir, 'Dockerfile'), dockerfileContent)

  // 創建目錄結構
  await fs.ensureDir(path.join(targetDir, 'routes'))
  await fs.ensureDir(path.join(targetDir, 'middleware'))
  await fs.ensureDir(path.join(targetDir, 'utils'))

  // 根據模板創建特定文件
  if (templateName === 'calculator') {
    await createCalculatorFiles(targetDir, templateData)
  } else if (templateName === 'test-tool') {
    await createTestToolFiles(targetDir, templateData)
  } else if (templateName === 'api-service') {
    await createApiServiceFiles(targetDir, templateData)
  }
}

/**
 * 生成服務器內容
 */
function generateServerContent (templateName, templateData, config) {
  return `const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || ${config.port};

// 中間件
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 靜態文件
app.use(express.static('public'));

// 健康檢查
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: '${templateData.projectName}',
    timestamp: new Date().toISOString(),
    version: '${config.version}'
  });
});

// API 路由
app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to ${templateData.projectName} API',
    version: '${config.version}',
    endpoints: {
      health: '/health',
      api: '/api'
    }
  });
});

// 404 處理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: '請求的資源不存在'
  });
});

// 錯誤處理
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: '伺服器內部錯誤'
  });
});

app.listen(PORT, () => {
  this.logger?.info(\`🚀 ${templateData.projectName} 運行在 http://localhost:\${PORT}\`);
  this.logger?.info(\`🌐 Gateway 代理: https://gateway.mursfoto.com/api/${templateData.projectNameKebab}\`);
});

module.exports = app;
`
}

/**
 * 生成環境配置內容
 */
function generateEnvContent (templateData, config) {
  return `# ${templateData.projectName} 環境配置
NODE_ENV=development
PORT=${config.port}

# 應用配置
APP_NAME=${templateData.projectName}
APP_VERSION=${config.version}

# Gateway 配置
GATEWAY_URL=https://gateway.mursfoto.com
`
}

/**
 * 生成 README 內容
 */
function generateReadmeContent (templateData, config) {
  return `# ${templateData.projectName}

${templateData.description}

## 🚀 快速開始

\`\`\`bash
# 安裝依賴
npm install

# 開發模式
npm run dev

# 生產模式
npm start
\`\`\`

## 📋 可用腳本

${Object.entries(config.scripts).map(([script, command]) =>
  `- \`npm run ${script}\` - ${command}`
).join('\n')}

## 🌐 API 端點

- **本地開發**: http://localhost:${config.port}
- **Gateway 代理**: https://gateway.mursfoto.com/api/${templateData.projectNameKebab}

## 🛠 開發

### 健康檢查
\`\`\`bash
curl http://localhost:${config.port}/health
\`\`\`

### API 資訊
\`\`\`bash
curl http://localhost:${config.port}/api
\`\`\`

## 📦 部署

使用 Mursfoto CLI 部署到 Zeabur:

\`\`\`bash
mursfoto deploy
\`\`\`

或手動部署到 Zeabur 平台。

## 🤝 貢獻

歡迎提交 Pull Request 和 Issue！

## 📄 授權

MIT License
`
}

/**
 * 生成 .gitignore 內容
 */
function generateGitignoreContent () {
  return `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Editor directories and files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Logs
logs
*.log

# Runtime directories
tmp/
temp/
`
}

/**
 * 生成 Zeabur 配置
 */
function generateZeaburConfig (templateData, config) {
  return JSON.stringify({
    name: templateData.projectNameKebab,
    services: [
      {
        name: `${templateData.projectNameKebab}-api`,
        buildCommand: 'npm install',
        startCommand: 'npm start',
        environment: 'node',
        rootDirectory: './',
        outputDirectory: './',
        envVars: [
          'PORT',
          'NODE_ENV'
        ],
        ports: [
          {
            containerPort: config.port,
            protocol: 'HTTP'
          }
        ]
      }
    ]
  }, null, 2)
}

/**
 * 生成 Dockerfile 內容
 */
function generateDockerfileContent () {
  return `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
`
}

/**
 * 創建計算器模板文件
 */
async function createCalculatorFiles (targetDir, templateData) {
  const calculatorRoute = `const express = require('express');
const router = express.Router();

// 計算器 API
router.get('/calculate', (req, res) => {
  const { operation, a, b } = req.query;
  
  if (!operation || !a || !b) {
    return res.status(400).json({
      error: 'Missing parameters',
      message: '請提供 operation, a, b 參數'
    });
  }
  
  const numA = parseFloat(a);
  const numB = parseFloat(b);
  
  if (isNaN(numA) || isNaN(numB)) {
    return res.status(400).json({
      error: 'Invalid numbers',
      message: '參數必須是數字'
    });
  }
  
  let result;
  switch (operation) {
    case 'add':
      result = numA + numB;
      break;
    case 'subtract':
      result = numA - numB;
      break;
    case 'multiply':
      result = numA * numB;
      break;
    case 'divide':
      if (numB === 0) {
        return res.status(400).json({
          error: 'Division by zero',
          message: '不能除以零'
        });
      }
      result = numA / numB;
      break;
    default:
      return res.status(400).json({
        error: 'Invalid operation',
        message: '支持的操作: add, subtract, multiply, divide'
      });
  }
  
  res.json({
    operation,
    a: numA,
    b: numB,
    result,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
`

  await fs.writeFile(path.join(targetDir, 'routes', 'calculator.js'), calculatorRoute)
}

/**
 * 創建測試工具文件
 */
async function createTestToolFiles (targetDir, templateData) {
  // Jest 配置
  const jestConfig = {
    testEnvironment: 'node',
    collectCoverageFrom: [
      '**/*.js',
      '!node_modules/**',
      '!coverage/**'
    ]
  }

  await fs.writeFile(
    path.join(targetDir, 'jest.config.js'),
    `module.exports = ${JSON.stringify(jestConfig, null, 2)};`
  )

  // ESLint 配置
  const eslintConfig = {
    env: {
      node: true,
      es2021: true,
      jest: true
    },
    extends: ['standard'],
    parserOptions: {
      ecmaVersion: 12,
      sourceType: 'module'
    }
  }

  await fs.writeFile(
    path.join(targetDir, '.eslintrc.json'),
    JSON.stringify(eslintConfig, null, 2)
  )
}

/**
 * 創建 API 服務文件
 */
async function createApiServiceFiles (targetDir, templateData) {
  const apiRoute = `const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// API 文檔
router.get('/docs', (req, res) => {
  res.json({
    title: '${templateData.projectName} API',
    version: '1.0.0',
    endpoints: {
      'GET /api': '獲取 API 資訊',
      'GET /api/docs': '獲取 API 文檔',
      'POST /api/data': '創建資料',
      'GET /api/data': '獲取資料列表'
    }
  });
});

// 創建資料
router.post('/data',
  body('name').notEmpty().withMessage('名稱不能為空'),
  body('value').isNumeric().withMessage('值必須是數字'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array()
      });
    }
    
    const { name, value } = req.body;
    
    // 這裡應該連接到資料庫
    const data = {
      id: Date.now(),
      name,
      value: parseFloat(value),
      createdAt: new Date().toISOString()
    };
    
    res.status(201).json({
      success: true,
      data
    });
  }
);

// 獲取資料列表
router.get('/data', (req, res) => {
  // 這裡應該從資料庫獲取資料
  const data = [
    {
      id: 1,
      name: '範例資料',
      value: 42,
      createdAt: new Date().toISOString()
    }
  ];
  
  res.json({
    success: true,
    data,
    count: data.length
  });
});

module.exports = router;
`

  await fs.writeFile(path.join(targetDir, 'routes', 'api.js'), apiRoute)
}

module.exports = {
  getTemplateConfig,
  getDefaultTemplateConfig,
  processTemplate,
  copyTemplateFiles,
  processFileName
}
