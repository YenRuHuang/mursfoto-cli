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
    this.serviceManager = require('./mursfoto-service-manager.js');
  }

  // 建立新專案
  createProject(name, type = 'api') {
    const projectDir = path.join(process.cwd(), name);
    
    if (fs.existsSync(projectDir)) {
      console.error(`❌ Directory '${name}' already exists`);
      return;
    }

    console.log(`🚀 Creating Mursfoto project: ${name}`);
    
    // 建立專案目錄
    fs.mkdirSync(projectDir, { recursive: true });
    process.chdir(projectDir);

    // 複製模板文件
    this.copyTemplate(type, projectDir);
    
    // 註冊服務
    const manager = new this.serviceManager();
    const service = manager.registerService(name, { type });
    
    // 生成配置文件
    this.generatePackageJson(name, service.port, type);
    this.generateDockerfile(name);
    this.generateZeaburConfig(name);
    this.generateGitignore();
    manager.generateEnvFile(name);
    
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
  }

  copyTemplate(type, projectDir) {
    // 基本專案結構
    const structure = {
      'src/': {
        'backend/': {
          'server.js': this.getServerTemplate(type)
        },
        'api/': {
          'health.js': this.getHealthTemplate()
        }
      },
      'public/': {
        'index.html': this.getIndexTemplate()
      }
    };

    this.createStructure(structure, projectDir);
  }

  createStructure(structure, baseDir) {
    for (const [name, content] of Object.entries(structure)) {
      const fullPath = path.join(baseDir, name);
      
      if (name.endsWith('/')) {
        // 目錄
        fs.mkdirSync(fullPath, { recursive: true });
        this.createStructure(content, baseDir);
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

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    status: "healthy",
    service: process.env.MURSFOTO_SERVICE_NAME || "mursfoto-service",
    port: process.env.PORT || 4000,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development"
  });
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
        <p style="margin-top: 2rem; opacity: 0.8;">
            Powered by Mursfoto Development Framework
        </p>
    </div>
    
    <script>
        fetch('/api/health')
            .then(res => res.json())
            .then(data => {
                console.log('Health check:', data);
                document.querySelector('h1').textContent = \`🚀 \${data.service}\`;
            })
            .catch(err => console.error('Health check failed:', err));
    </script>
</body>
</html>`;
  }

  generatePackageJson(name, port, type) {
    const packageJson = {
      name: name,
      version: "1.0.0",
      description: \`Mursfoto \${type} service: \${name}\`,
      main: "src/backend/server.js",
      type: "module",
      scripts: {
        "dev": "nodemon src/backend/server.js",
        "start": "node src/backend/server.js",
        "test": "echo \\"No tests specified\\" && exit 0"
      },
      keywords: ["mursfoto", type, name],
      author: "murs",
      license: "MIT",
      dependencies: {
        "express": "^4.18.2",
        "cors": "^2.8.5",
        "dotenv": "^16.3.1",
        "winston": "^3.11.0"
      },
      devDependencies: {
        "nodemon": "^3.0.2"
      },
      engines: {
        "node": ">=18.0.0"
      },
      mursfoto: {
        service: name,
        type: type,
        port: port,
        createdAt: new Date().toISOString()
      }
    };

    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  }

  generateDockerfile(name) {
    const dockerfile = \`FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE \${process.env.PORT || 4000}

CMD ["npm", "start"]
\`;
    fs.writeFileSync('Dockerfile', dockerfile);
  }

  generateZeaburConfig(name) {
    const zeaburConfig = {
      "build_command": "npm install",
      "start_command": "npm start",
      "install_command": "npm install",
      "node_version": "18"
    };
    fs.writeFileSync('zbpack.json', JSON.stringify(zeaburConfig, null, 2));
  }

  generateGitignore() {
    const gitignore = \`node_modules/
.env
.env.local
.env.production
.DS_Store
*.log
logs/
.mursfoto/
\`;
    fs.writeFileSync('.gitignore', gitignore);
  }

  initGit(name) {
    try {
      execSync('git init');
      execSync('git add .');
      execSync(\`git commit -m "feat: initial Mursfoto service setup for \${name}"\`);
      console.log('✅ Git repository initialized');
    } catch (error) {
      console.warn('⚠️  Git initialization failed:', error.message);
    }
  }
}

// CLI 介面
function main() {
  const [,, command, name, type] = process.argv;

  if (command === 'create') {
    if (!name) {
      console.error('Usage: node mursfoto-project-template.js create <name> [type]');
      return;
    }
    const template = new MursfotoProjectTemplate();
    template.createProject(name, type || 'api');
  } else {
    console.log('Mursfoto Project Template Generator');
    console.log('');
    console.log('Usage:');
    console.log('  create <name> [type]  - Create new project');
    console.log('');
    console.log('Example:');
    console.log('  node mursfoto-project-template.js create my-api api');
  }
}

if (require.main === module) {
  main();
}

module.exports = MursfotoProjectTemplate;