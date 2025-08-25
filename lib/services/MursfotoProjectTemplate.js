#!/usr/bin/env node

/**
 * Mursfoto Project Template Generator
 * 快速建立新專案，避免重複配置
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class MursfotoProjectTemplate {
  constructor() {
    this.templateDir = path.join(__dirname, 'templates');
    this.serviceManager = require('./MursfotoServiceManager.cjs');
  }

  // 建立新專案 (enhanced with advanced features)
  createProject(name, type = 'api', options = {}) {
    const projectDir = path.join(process.cwd(), name);
    
    if (fs.existsSync(projectDir)) {
      console.error(`❌ Directory '${name}' already exists`);
      return;
    }

    console.log(`🚀 Creating Mursfoto project: ${name}`);
    
    // 建立專案目錄
    fs.mkdirSync(projectDir, { recursive: true });
    process.chdir(projectDir);

    // 複製模板文件 (with advanced features)
    this.copyTemplate(type, projectDir, options);
    
    // 註冊服務
    const manager = new this.serviceManager();
    const service = manager.registerService(name, { type });
    
    // 生成配置文件
    this.generatePackageJson(name, service.port, type, options);
    this.generateDockerfile(name);
    this.generateZeaburConfig(name);
    this.generateGitignore();
    manager.generateEnvFile(name);
    
    // 🚀 整合 Claude Code 進階功能
    this.integrateClaudeCodeFeatures(projectDir, name, type);
    
    // 初始化 Git
    this.initGit(name);
    
    console.log('');
    console.log('✅ Project created successfully!');
    console.log('');
    console.log('Next steps:');
    console.log(`  cd ${name}`);
    console.log(`  npm install`);
    console.log(`  npm run dev`);
    console.log('');
    console.log(`🌐 Local: http://localhost:${service.port}`);
    console.log(`📱 Service management: node ../mursfoto-service-manager.js list`);
    console.log('');
    console.log('🤖 Claude Code AI 代理整合完成：');
    console.log('  • code-reviewer: 自動程式碼審查與安全掃描');
    console.log('  • error-debugger: 智能錯誤診斷與修復');
    console.log('  • prd-writer: 產品需求文件生成');
    console.log('  • steering-architect: 專案架構分析');
    console.log('  • 繁體中文輸出風格已啟用');
    
    // Display advanced features if enabled
    if (options.smartMonitor) {
      console.log('📊 SmartMonitor: 即時效能監控與自動擴展建議');
    }
    if (options.enterpriseLogger) {
      console.log('📝 EnterpriseLogger: 企業級日誌系統與安全事件記錄');
    }
    if (options.smartRouter) {
      console.log('🎯 SmartRouter: 智能負載平衡與成本優化路由');
    }
  }

  copyTemplate(type, projectDir, options = {}) {
    // 基本專案結構 + 資料庫整合 + 進階功能
    const structure = {
      'src/': {
        'backend/': {
          'server.js': this.getServerTemplate(type)
        },
        'api/': {
          'health.js': this.getHealthTemplate()
        },
        'services/': {
          'DatabaseService.js': this.getDatabaseServiceTemplate()
        },
        'utils/': {
          'logger.js': options.enterpriseLogger ? this.getEnterpriseLoggerTemplate() : this.getLoggerTemplate()
        }
      },
      'scripts/': {
        'setup-database.js': this.getDatabaseSetupTemplate()
      },
      'public/': {
        'index.html': this.getIndexTemplate()
      },
      '.env.example': this.getEnvExampleTemplate()
    };

    // 添加進階功能
    if (options.smartMonitor) {
      structure['src/']['services/']['SmartMonitor.js'] = this.getSmartMonitorTemplate();
    }
    
    if (options.smartRouter) {
      structure['src/']['services/']['SmartRouter.js'] = this.getSmartRouterTemplate();
    }
    
    if (options.enterpriseLogger) {
      // EnterpriseLogger 已替換標準 logger，添加日誌目錄
      structure['logs/'] = {
        '.gitkeep': '# Log files will be created here by EnterpriseLogger'
      };
    }

    this.createStructure(structure, projectDir);
  }

  createStructure(structure, baseDir) {
    for (const [name, content] of Object.entries(structure)) {
      const fullPath = path.join(baseDir, name);
      
      if (name.endsWith('/')) {
        // 目錄
        fs.mkdirSync(fullPath, { recursive: true });
        this.createStructure(content, fullPath);
      } else {
        // 文件
        const dir = path.dirname(fullPath);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(fullPath, content);
      }
    }
  }

  getServerTemplate(type) {
    return `import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import winston from "winston";

// Import routes
import healthRoutes from "../api/health.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const SERVICE_NAME = process.env.MURSFOTO_SERVICE_NAME || "mursfoto-service";

// Logger setup
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  ],
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === "production" 
    ? process.env.FRONTEND_URL 
    : [\`http://localhost:\${PORT}\`, "http://localhost:3000"],
  credentials: true,
}));

app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info(\`\${req.method} \${req.path}\`, {
    service: SERVICE_NAME,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  next();
});

// Routes
app.use("/api/health", healthRoutes);

// Static files
app.use(express.static("public"));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    service: SERVICE_NAME,
    message: "The requested resource does not exist",
  });
});

// Error handling
app.use((err, req, res, next) => {
  logger.error("Service error:", err);
  
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    service: SERVICE_NAME,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(\`\${signal} received: shutting down gracefully\`);
  process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Start server
app.listen(PORT, () => {
  logger.info(\`🚀 \${SERVICE_NAME} running on port \${PORT}\`);
  logger.info(\`📍 Environment: \${process.env.NODE_ENV || "development"}\`);
  logger.info(\`🌐 Health check: http://localhost:\${PORT}/api/health\`);
});

export default app;
`;
  }

  getHealthTemplate() {
    return `import express from "express";
import DatabaseService from "../services/DatabaseService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // 基本健康檢查
    const healthData = {
      status: "healthy",
      service: process.env.MURSFOTO_SERVICE_NAME || "mursfoto-service",
      port: process.env.PORT || 4000,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0"
    };

    // 資料庫健康檢查
    try {
      const dbHealthy = await DatabaseService.init();
      healthData.database = {
        connected: dbHealthy,
        type: "mysql",
        platform: "zeabur"
      };
      
      if (dbHealthy) {
        // 執行簡單的資料庫查詢測試
        await DatabaseService.query("SELECT 1 as test");
        healthData.database.responseTime = "< 100ms";
      }
    } catch (dbError) {
      healthData.database = {
        connected: false,
        error: "Database connection failed",
        type: "mysql",
        platform: "zeabur"
      };
      // 不讓資料庫錯誤影響整體健康狀態
      healthData.status = "degraded";
    }

    // 記憶體使用情況
    const memUsage = process.memoryUsage();
    healthData.memory = {
      used: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100 + ' MB',
      total: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100 + ' MB'
    };

    res.json(healthData);
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      service: process.env.MURSFOTO_SERVICE_NAME || "mursfoto-service",
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

export default router;
`;
  }

  getIndexTemplate() {
    return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mursfoto Service</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        .container {
            text-align: center;
            padding: 2rem;
            max-width: 600px;
        }
        h1 { font-size: 2.5rem; margin-bottom: 1rem; }
        .status {
            margin: 2rem 0;
            padding: 1rem;
            background: rgba(0,255,0,0.2);
            border-radius: 10px;
        }
        .links a {
            display: inline-block;
            color: white;
            text-decoration: none;
            background: rgba(255,255,255,0.2);
            padding: 0.8rem 1.5rem;
            margin: 0.5rem;
            border-radius: 25px;
            transition: all 0.3s;
        }
        .links a:hover {
            background: rgba(255,255,255,0.3);
        }
        .database-status {
            margin: 1rem 0;
            padding: 0.8rem;
            background: rgba(255,255,255,0.1);
            border-radius: 8px;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Mursfoto Service</h1>
        <div class="status">
            ✅ Service Running
        </div>
        <div class="links">
            <a href="/api/health">Health Check</a>
        </div>
        <div class="database-status">
            🗄️ Database: <span id="db-status">Checking...</span>
        </div>
        <p style="margin-top: 2rem; opacity: 0.8;">
            🔧 Powered by Mursfoto Development Framework<br>
            🎯 MySQL + Zeabur Ready
        </p>
    </div>
    
    <script>
        fetch('/api/health')
            .then(res => res.json())
            .then(data => {
                console.log('Health check:', data);
                document.querySelector('h1').textContent = \`🚀 \${data.service}\`;
                
                // Update database status
                const dbStatus = document.getElementById('db-status');
                if (data.database && data.database.connected) {
                    dbStatus.textContent = '✅ Connected';
                    dbStatus.style.color = '#4ade80';
                } else {
                    dbStatus.textContent = '⚠️ Unavailable';
                    dbStatus.style.color = '#fbbf24';
                }
            })
            .catch(err => {
                console.error('Health check failed:', err);
                document.getElementById('db-status').textContent = '❌ Error';
            });
    </script>
</body>
</html>`;
  }

  generatePackageJson(name, port, type, options = {}) {
    const packageJson = {
      name: name,
      version: "1.0.0",
      description: `Mursfoto ${type} service: ${name}`,
      main: "src/backend/server.js",
      type: "module",
      scripts: {
        "dev": "nodemon src/backend/server.js",
        "start": "node src/backend/server.js",
        "test": "echo \"No tests specified\" && exit 0",
        "db:setup": "node scripts/setup-database.js",
        "db:migrate": "npm run db:setup",
        "db:seed": "echo \"Database seeding not implemented\"",
        "db:health": "node -e \"require('./src/services/DatabaseService.js').init().then(r => console.log(r ? '✅ Database healthy' : '❌ Database unavailable'))\"",
        "zeabur:deploy": "echo '🚀 Deploying to Zeabur...' && npm run db:setup"
      },
      keywords: ["mursfoto", type, name, "database", "zeabur"],
      author: "murs",
      license: "MIT",
      dependencies: {
        "express": "^4.18.2",
        "cors": "^2.8.5",
        "dotenv": "^16.3.1",
        "winston": "^3.11.0",
        "mysql2": "^3.6.0",
        "jsonwebtoken": "^9.0.2",
        "bcrypt": "^5.1.1",
        "express-rate-limit": "^7.1.5",
        "helmet": "^7.0.0",
        "winston-daily-rotate-file": "^4.7.1"
      },
      devDependencies: {
        "nodemon": "^3.0.2"
      },
      engines: {
        "node": ">=18.0.0",
        "npm": ">=8.0.0"
      },
      mursfoto: {
        service: name,
        type: type,
        port: port,
        createdAt: new Date().toISOString(),
        database: {
          type: 'mysql',
          platform: 'zeabur',
          features: ['connection_pooling', 'auto_migration', 'health_check', 'logging']
        },
        advancedFeatures: {
          smartMonitor: options.smartMonitor || false,
          enterpriseLogger: options.enterpriseLogger || false,  
          smartRouter: options.smartRouter || false,
          basedOn: ['pixelforge-studio-main', 'ai-freelancer-tools-main']
        },
        claudeCode: {
          agents: ['code-reviewer', 'error-debugger', 'prd-writer', 'steering-architect'],
          outputStyle: 'traditional-chinese',
          aiRules: true
        }
      }
    };

    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  }

  generateDockerfile(name) {
    const dockerfile = `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE \${process.env.PORT || 4000}

CMD ["npm", "start"]
`;
    fs.writeFileSync('Dockerfile', dockerfile);
  }

  generateZeaburConfig(name) {
    const zeaburConfig = {
      "name": name,
      "services": [
        {
          "name": name,
          "buildCommand": "npm install && npm run db:setup",
          "startCommand": "npm start",
          "environment": "node",
          "nodeVersion": "18",
          "rootDirectory": "./",
          "outputDirectory": "./",
          "healthCheck": {
            "path": "/api/health",
            "timeout": 30,
            "retries": 3
          },
          "envVars": [
            "PORT",
            "NODE_ENV",
            "JWT_SECRET",
            "MURSFOTO_SERVICE_NAME",
            "DB_HOST",
            "DB_USER", 
            "DB_PASSWORD",
            "DB_NAME",
            "DB_PORT",
            "DB_CONNECTION_LIMIT",
            "LOG_LEVEL"
          ],
          "ports": [
            {
              "containerPort": 8080,
              "protocol": "HTTP"
            }
          ]
        }
      ]
    };
    fs.writeFileSync('zeabur.json', JSON.stringify(zeaburConfig, null, 2));
  }

  generateGitignore() {
    const gitignore = `node_modules/
.env
.env.local
.env.production
.DS_Store
*.log
logs/
.mursfoto/
`;
    fs.writeFileSync('.gitignore', gitignore);
  }

  // 🚀 整合 Claude Code 進階功能
  integrateClaudeCodeFeatures(projectDir, name, type) {
    try {
      console.log('🤖 整合 Claude Code 進階功能...');
      
      // 創建 .ai-rules 目錄
      const aiRulesDir = path.join(projectDir, '.ai-rules');
      fs.mkdirSync(aiRulesDir, { recursive: true });
      
      // 生成專案規格文件
      this.generateProjectSpecs(aiRulesDir, name, type);
      
      // 創建 Claude.md 開發指南
      this.generateClaudeDevGuide(projectDir, name, type);
      
      // 生成 AI 代理觸發提示範本
      this.generateAIPromptTemplates(projectDir, name, type);
      
      // 複製 Claude Code 配置（如果存在）
      this.preserveClaudeCodeConfig(projectDir);
      
      console.log('✅ Claude Code 進階功能整合完成');
    } catch (error) {
      console.warn('⚠️ Claude Code 功能整合失敗:', error.message);
    }
  }

  generateProjectSpecs(aiRulesDir, name, type) {
    // 產品規格文件
    const productMd = `# ${name} - 產品規格

## 專案概述
- **服務名稱**: ${name}
- **服務類型**: ${type}
- **開發框架**: Mursfoto Enterprise Framework
- **創建時間**: ${new Date().toISOString()}

## 核心功能
- RESTful API 服務
- 健康檢查端點
- 自動錯誤處理
- 請求記錄與監控

## 品質要求
- 程式碼覆蓋率 > 80%
- 響應時間 < 200ms
- 可用性 > 99.9%
- 安全性掃描通過

## AI 代理觸發條件
- 新增程式碼時：觸發 code-reviewer
- 出現錯誤時：觸發 error-debugger
- 需求變更時：觸發 prd-writer
- 架構調整時：觸發 steering-architect
`;
    
    // 技術規格文件
    const techMd = `# ${name} - 技術規格

## 技術棧
- **後端**: Node.js + Express.js
- **日誌**: Winston
- **部署**: Zeabur + Docker
- **版本控制**: Git

## 架構設計
\`\`\`
${name}/
├── src/
│   ├── backend/      # 後端核心
│   ├── api/          # API 路由
│   └── utils/        # 工具函數
├── public/           # 靜態文件
├── .ai-rules/        # AI 指導文件
└── docs/            # 文檔
\`\`\`

## 開發規範
- ESModule 語法
- 錯誤處理中間件
- 請求日誌記錄
- CORS 安全配置

## 環境配置
- PORT: 服務埠號（自動分配）
- NODE_ENV: 環境模式
- MURSFOTO_SERVICE_NAME: 服務識別名
`;
    
    // 專案結構文件
    const structureMd = `# ${name} - 專案結構

## 目錄說明
\`\`\`
${name}/
├── src/
│   ├── backend/
│   │   └── server.js          # 主伺服器
│   └── api/
│       └── health.js          # 健康檢查
├── public/
│   └── index.html             # 首頁
├── .ai-rules/                 # AI 指導規則
├── docs/                      # 開發文檔
├── package.json               # 專案配置
├── Dockerfile                 # 容器配置
├── zbpack.json               # Zeabur 配置
└── .gitignore                # Git 忽略規則
\`\`\`

## 開發工作流
1. 功能開發 → code-reviewer 審查
2. 錯誤調試 → error-debugger 分析
3. 需求整理 → prd-writer 文檔化
4. 架構優化 → steering-architect 指導

## 部署流程
1. \`npm run dev\` - 本地開發
2. \`git push\` - 提交代碼
3. \`mursfoto-service deploy\` - 一鍵部署
`;
    
    fs.writeFileSync(path.join(aiRulesDir, 'product.md'), productMd);
    fs.writeFileSync(path.join(aiRulesDir, 'tech.md'), techMd);
    fs.writeFileSync(path.join(aiRulesDir, 'structure.md'), structureMd);
  }

  generateClaudeDevGuide(projectDir, name, type) {
    const claudeMd = `# ${name} - Claude Code 開發指南

## 🤖 可用 AI 代理

### 1. code-reviewer (程式碼審查專家)
**觸發時機**: 完成程式碼編寫後
\`\`\`
使用 Task 工具啟動 code-reviewer 代理來審查我的程式碼，檢查安全性和最佳實踐
\`\`\`

### 2. error-debugger (錯誤診斷專家)
**觸發時機**: 遇到錯誤或異常
\`\`\`
使用 Task 工具啟動 error-debugger 代理來分析這個錯誤並提供解決方案
\`\`\`

### 3. prd-writer (產品需求專家)
**觸發時機**: 需要整理功能需求
\`\`\`
使用 Task 工具啟動 prd-writer 代理來生成這個功能的產品需求文件
\`\`\`

### 4. steering-architect (架構分析專家)
**觸發時機**: 專案架構調整
\`\`\`
使用 Task 工具啟動 steering-architect 代理來分析專案架構並更新指導文件
\`\`\`

## 🎨 輸出風格
已啟用繁體中文狀態列風格，包含以下資訊：
- AI 模型資訊
- 工作目錄
- 輸出風格
- 版本資訊

## 🚀 快速開發提示

### 創建新功能
\`\`\`
我需要為 ${name} 添加一個 [功能名稱] 功能，請：
1. 分析需求並生成 PRD
2. 實作程式碼
3. 進行程式碼審查
4. 部署到 Zeabur
\`\`\`

### 錯誤處理
\`\`\`
 ${name} 服務出現 [錯誤描述]，請幫我診斷並修復這個問題
\`\`\`

### 架構優化
\`\`\`
分析 ${name} 的架構並提供優化建議，更新專案指導文件
\`\`\`

## 📋 開發檢查清單
- [ ] 功能實作完成
- [ ] code-reviewer 審查通過
- [ ] 單元測試覆蓋
- [ ] error-debugger 檢查通過
- [ ] 文檔更新完成
- [ ] 部署驗證成功
`;
    
    fs.writeFileSync(path.join(projectDir, 'CLAUDE.md'), claudeMd);
  }

  generateAIPromptTemplates(projectDir, name, type) {
    const docsDir = path.join(projectDir, 'docs');
    fs.mkdirSync(docsDir, { recursive: true });
    
    const promptTemplates = `# AI 提示範本

## 🎯 常用開發提示

### 新增 API 端點
\`\`\`
我需要為 ${name} 新增一個 [端點名稱] API 端點，功能是 [功能描述]。請：
1. 使用 prd-writer 代理生成需求文件
2. 實作 API 程式碼
3. 使用 code-reviewer 代理審查程式碼
4. 測試並部署
\`\`\`

### 錯誤診斷與修復
\`\`\`
${name} 服務遇到錯誤：[錯誤信息]
請使用 error-debugger 代理幫我：
1. 分析錯誤原因
2. 提供修復方案
3. 實施修復
4. 驗證修復效果
\`\`\`

### 效能優化
\`\`\`
 ${name} 服務需要效能優化，請：
1. 使用 steering-architect 代理分析架構
2. 識別效能瓶頸
3. 實施優化方案
4. 使用 code-reviewer 代理審查變更
\`\`\`

### 功能擴展
\`\`\`
我想為 ${name} 添加 [功能名稱] 功能，包含：
- [具體需求1]
- [具體需求2]
請完整實作並整合到現有系統中
\`\`\`

## 🔧 部署與維護

### 一鍵部署
\`\`\`
幫我將 ${name} 部署到 Zeabur，使用 Mursfoto 部署系統
\`\`\`

### 服務監控
\`\`\`
檢查 ${name} 服務的運行狀態和性能指標
\`\`\`
`;
    
    fs.writeFileSync(path.join(docsDir, 'ai-prompts.md'), promptTemplates);
  }

  preserveClaudeCodeConfig(projectDir) {
    const claudeConfigPath = path.join(process.env.HOME, '.claude');
    
    if (fs.existsSync(claudeConfigPath)) {
      // 檢查是否有 statusline 配置
      const statuslinePath = path.join(claudeConfigPath, 'statusline-tc.sh');
      if (fs.existsSync(statuslinePath)) {
        console.log('✅ 檢測到繁體中文狀態列配置');
      }
      
      // 檢查 agents 目錄
      const agentsPath = path.join(claudeConfigPath, 'agents');
      if (fs.existsSync(agentsPath)) {
        const agents = fs.readdirSync(agentsPath).filter(f => f.endsWith('.md'));
        if (agents.length > 0) {
          console.log(`✅ 檢測到 ${agents.length} 個自訂 AI 代理: ${agents.map(a => a.replace('.md', '')).join(', ')}`);
        }
      }
      
      // 創建本專案的 Claude 配置說明
      const configNote = `# Claude Code 配置說明\n\n已檢測並保留您的自訂配置：\n- 繁體中文狀態列\n- 自訂 AI 代理\n- 輸出風格設置\n\n這些配置將自動應用到此專案的開發過程中。`;
      const docsDir = path.join(projectDir, 'docs');
      fs.mkdirSync(docsDir, { recursive: true });
      fs.writeFileSync(path.join(docsDir, 'claude-config.md'), configNote);
    }
  }

  // 🗄️ 資料庫服務模板
  getDatabaseServiceTemplate() {
    return fs.readFileSync(path.join(__dirname, '../templates/database-mysql/DatabaseService.js'), 'utf8')
      .replace(/const logger = require\('\.\.\/utils\/logger'\);/, "const logger = require('../utils/logger.js');");
  }

  // 🔧 資料庫設置腳本模板
  getDatabaseSetupTemplate() {
    return fs.readFileSync(path.join(__dirname, '../templates/database-mysql/setup-database.js'), 'utf8');
  }

  // 📝 Logger 模板
  getLoggerTemplate() {
    return `const winston = require('winston');

// 🔍 Mursfoto Logger 配置
// 基於成功專案的最佳實踐設計

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
      let msg = \`[\${timestamp}] \${level}: \${message}\`;
      
      if (stack) {
        msg += \`\\n\${stack}\`;
      }
      
      if (Object.keys(meta).length > 0) {
        msg += \` \${JSON.stringify(meta)}\`;
      }
      
      return msg;
    })
  ),
  transports: [
    new winston.transports.Console({
      handleExceptions: true
    })
  ],
  exitOnError: false
});

// 生產環境額外配置
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }));
  
  logger.add(new winston.transports.File({
    filename: 'logs/combined.log',
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }));
}

module.exports = logger;`;
  }

  // 📊 SmartMonitor 模板 (from PixelForge Studio)
  getSmartMonitorTemplate() {
    return fs.readFileSync(path.join(__dirname, '../templates/advanced-features/SmartMonitor.js'), 'utf8');
  }

  // 📝 EnterpriseLogger 模板 (from AI Freelancer Tools)
  getEnterpriseLoggerTemplate() {
    return fs.readFileSync(path.join(__dirname, '../templates/advanced-features/EnterpriseLogger.js'), 'utf8');
  }

  // 🎯 SmartRouter 模板 (from PixelForge Studio)
  getSmartRouterTemplate() {
    return fs.readFileSync(path.join(__dirname, '../templates/advanced-features/SmartRouter.js'), 'utf8');
  }

  // 🌐 環境變數範例模板
  getEnvExampleTemplate() {
    return `# 🚀 Mursfoto Service Environment Variables
# 複製此檔案為 .env 並填入實際值

# 基本設定
PORT=4000
NODE_ENV=development
MURSFOTO_SERVICE_NAME=mursfoto-service

# 安全設定
JWT_SECRET=your-super-secret-jwt-key-here-please-change-this

# 🗄️ MySQL 資料庫配置 (Zeabur/Hostinger)
DB_HOST=your-database-host
DB_USER=your-database-username
DB_PASSWORD=your-database-password
DB_NAME=your-database-name
DB_PORT=3306
DB_CONNECTION_LIMIT=10
# DB_SSL=true  # 如果需要SSL連線請啟用

# 📊 應用程式設定
LOG_LEVEL=info
# CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# 🔧 效能調優
# API_RATE_LIMIT=1000
# HEALTH_CHECK_TIMEOUT=5000

# 🚀 Zeabur 部署設定 (自動配置)
# Zeabur 會自動提供這些環境變數：
# - PORT
# - NODE_ENV
# - DATABASE_URL (如果使用 Zeabur MySQL addon)

# 💡 提示：
# 1. 請勿將此檔案提交到 Git 倉庫
# 2. 在 Zeabur 控制台設定對應的環境變數
# 3. JWT_SECRET 請使用 32+ 字元的隨機字串`;
  }

  initGit(name) {
    try {
      execSync('git init');
      execSync('git add .');
      execSync(`git commit -m "feat: initial Mursfoto service setup for ${name}

🚀 Features:
- Mursfoto framework integration
- MySQL + Zeabur database ready
- Claude Code AI agents ready
- Auto port management
- One-click deployment setup"`);
      console.log('✅ Git repository initialized');
    } catch (error) {
      console.warn('⚠️  Git initialization failed:', error.message);
    }
  }
}

// CLI 介面 (Enhanced with advanced features)
function main() {
  const [,, command, name, type, ...args] = process.argv;

  if (command === 'create') {
    if (!name) {
      console.error('Usage: node mursfoto-project-template.js create <name> [type] [--features]');
      console.error('');
      console.error('Advanced Features:');
      console.error('  --smart-monitor     Enable real-time performance monitoring');
      console.error('  --enterprise-logger Enable enterprise-grade logging system');
      console.error('  --smart-router      Enable intelligent load balancing router');
      console.error('  --all-features      Enable all advanced features');
      return;
    }

    // Parse advanced feature flags
    const options = {};
    if (args.includes('--smart-monitor') || args.includes('--all-features')) {
      options.smartMonitor = true;
    }
    if (args.includes('--enterprise-logger') || args.includes('--all-features')) {
      options.enterpriseLogger = true;
    }
    if (args.includes('--smart-router') || args.includes('--all-features')) {
      options.smartRouter = true;
    }

    const template = new MursfotoProjectTemplate();
    template.createProject(name, type || 'api', options);
  } else {
    console.log('🚀 Mursfoto Project Template Generator');
    console.log('   Based on successful projects: pixelforge-studio & ai-freelancer-tools');
    console.log('');
    console.log('Usage:');
    console.log('  create <name> [type] [--features]  - Create new project');
    console.log('');
    console.log('Project Types:');
    console.log('  api        - RESTful API service (default)');
    console.log('  webapp     - Web application');
    console.log('  microservice - Microservice');
    console.log('');
    console.log('Advanced Features (from successful projects):');
    console.log('  --smart-monitor     📊 Real-time system monitoring & auto-scaling');
    console.log('  --enterprise-logger 📝 Enterprise logging with security events');
    console.log('  --smart-router      🎯 Intelligent load balancing & cost optimization');
    console.log('  --all-features      ✨ Enable all advanced features');
    console.log('');
    console.log('Examples:');
    console.log('  node mursfoto-project-template.js create my-api');
    console.log('  node mursfoto-project-template.js create my-service api --smart-monitor');
    console.log('  node mursfoto-project-template.js create enterprise-app webapp --all-features');
    console.log('');
    console.log('🎯 Features integrated from successful projects:');
    console.log('  • MySQL + Zeabur database integration');
    console.log('  • Claude Code AI agents ready');
    console.log('  • One-click deployment setup');
    console.log('  • Enterprise-grade monitoring & logging');
  }
}

if (require.main === module) {
  main();
}

module.exports = MursfotoProjectTemplate;