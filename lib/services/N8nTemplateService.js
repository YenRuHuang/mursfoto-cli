const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { logger } = require('../utils/helpers');

class N8nTemplateService {
  constructor() {
    this.baseURL = process.env.N8N_API_URL || 'https://api.n8n.io';
    this.apiKey = process.env.N8N_API_KEY;
    this.templatesDir = path.join(__dirname, '../../templates/n8n');
    
    // API 客戶端配置
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mursfoto-AutoDev-Factory/1.0.0'
      },
      timeout: 30000
    });

    this.initializeTemplateService();
  }

  /**
   * 初始化模板服務
   */
  async initializeTemplateService() {
    try {
      await fs.ensureDir(this.templatesDir);
      
      // 創建模板索引文件
      const indexPath = path.join(this.templatesDir, 'index.json');
      if (!await fs.pathExists(indexPath)) {
        await fs.writeJson(indexPath, {
          templates: [],
          lastUpdated: new Date().toISOString(),
          version: '1.0.0'
        }, { spaces: 2 });
      }
      
    } catch (error) {
      logger.error('n8n 模板服務初始化失敗:', error.message);
    }
  }

  /**
   * 獲取 n8n 社區模板
   */
  async fetchCommunityTemplates(category = null, limit = 50) {
    try {
      logger.info('🔄 獲取 n8n 社区模板...');
      
      const params = {
        limit,
        offset: 0,
        ...(category && { category })
      };

      // n8n 社区模板 API (假設的端點)
      const response = await this.client.get('/templates', { params });
      
      if (response.data && response.data.templates) {
        logger.success(`✅ 獲取到 ${response.data.templates.length} 個模板`);
        return response.data.templates;
      }

      return [];
      
    } catch (error) {
      logger.warn('⚠️  n8n API 不可用，使用本地預設模板');
      return this.getBuiltInTemplates();
    }
  }

  /**
   * 獲取內建模板
   */
  getBuiltInTemplates() {
    return [
      {
        id: 'webhook-discord-notification',
        name: 'Webhook to Discord 通知',
        description: '接收 webhook 請求並發送到 Discord',
        category: 'Communication',
        nodes: [
          {
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            position: [250, 300],
            parameters: {
              httpMethod: 'POST',
              path: 'webhook',
              responseMode: 'onReceived'
            }
          },
          {
            name: 'Transform Data',
            type: 'n8n-nodes-base.set',
            position: [450, 300],
            parameters: {
              values: {
                string: [
                  {
                    name: 'message',
                    value: '🚀 **{{$json["title"]}}**\n\n{{$json["message"]}}'
                  }
                ]
              }
            }
          },
          {
            name: 'Discord',
            type: 'n8n-nodes-base.discord',
            position: [650, 300],
            parameters: {
              resource: 'message',
              operation: 'post',
              webhookUrl: '={{$env["DISCORD_WEBHOOK_URL"]}}',
              text: '={{$json["message"]}}'
            }
          }
        ],
        usage: 'API 通知和狀態更新'
      },
      {
        id: 'github-auto-deploy',
        name: 'GitHub 自動部署',
        description: 'GitHub push 事件觸發自動部署流程',
        category: 'DevOps',
        nodes: [
          {
            name: 'GitHub Trigger',
            type: 'n8n-nodes-base.githubTrigger',
            position: [250, 300],
            parameters: {
              events: ['push'],
              repository: '={{$env["GITHUB_REPO"]}}',
              owner: '={{$env["GITHUB_OWNER"]}}'
            }
          },
          {
            name: 'Check Branch',
            type: 'n8n-nodes-base.if',
            position: [450, 300],
            parameters: {
              conditions: {
                string: [
                  {
                    value1: '={{$json["ref"]}}',
                    operation: 'equal',
                    value2: 'refs/heads/main'
                  }
                ]
              }
            }
          },
          {
            name: 'Deploy to Zeabur',
            type: 'n8n-nodes-base.httpRequest',
            position: [650, 300],
            parameters: {
              method: 'POST',
              url: 'https://api.zeabur.com/deploy',
              headers: {
                'Authorization': 'Bearer {{$env["ZEABUR_TOKEN"]}}'
              },
              body: {
                project: '={{$env["PROJECT_ID"]}}',
                branch: 'main'
              }
            }
          }
        ],
        usage: '自動化部署流程'
      },
      {
        id: 'error-monitoring',
        name: '錯誤監控和通知',
        description: '監控應用錯誤並發送通知',
        category: 'Monitoring',
        nodes: [
          {
            name: 'HTTP Request',
            type: 'n8n-nodes-base.httpRequest',
            position: [250, 300],
            parameters: {
              method: 'POST',
              url: '={{$json["webhook_url"]}}',
              body: {
                error: '={{$json["error"]}}',
                timestamp: '={{$now}}',
                source: 'mursfoto-autodev'
              }
            }
          },
          {
            name: 'Error Analysis',
            type: 'n8n-nodes-base.function',
            position: [450, 300],
            parameters: {
              functionCode: `
const error = items[0].json.error;
const severity = error.stack ? 'high' : 'medium';
const category = error.message.includes('network') ? 'network' : 'application';

return [{
  json: {
    ...items[0].json,
    severity,
    category,
    actionRequired: severity === 'high'
  }
}];`
            }
          },
          {
            name: 'Notification',
            type: 'n8n-nodes-base.discord',
            position: [650, 300],
            parameters: {
              resource: 'message',
              operation: 'post',
              webhookUrl: '={{$env["DISCORD_WEBHOOK_URL"]}}',
              text: '🚨 **錯誤警報** ({{$json["severity"]}})\n\n**類別**: {{$json["category"]}}\n**訊息**: {{$json["error"]["message"]}}'
            }
          }
        ],
        usage: '應用錯誤監控'
      }
    ];
  }

  /**
   * 將 n8n 模板轉換為 Mursfoto 項目模板
   */
  async convertToMursforoTemplate(n8nTemplate, projectName) {
    try {
      logger.info(`🔄 轉換 n8n 模板: ${n8nTemplate.name}`);

      const template = {
        name: projectName,
        description: `${n8nTemplate.description} - 基於 n8n 工作流程`,
        type: 'n8n-integration',
        category: n8nTemplate.category,
        files: {
          'package.json': this.generatePackageJson(projectName, n8nTemplate),
          'server.js': this.generateServerJs(n8nTemplate),
          'workflows/main.json': JSON.stringify(n8nTemplate, null, 2),
          'config/n8n.json': this.generateN8nConfig(n8nTemplate),
          'README.md': this.generateReadme(projectName, n8nTemplate),
          '.env.example': this.generateEnvExample(n8nTemplate),
          'docker-compose.yml': this.generateDockerCompose(projectName)
        }
      };

      // 保存轉換後的模板
      const templatePath = path.join(this.templatesDir, `${projectName}.json`);
      await fs.writeJson(templatePath, template, { spaces: 2 });

      logger.success(`✅ 模板轉換完成: ${templatePath}`);
      return template;
      
    } catch (error) {
      logger.error('模板轉換失敗:', error.message);
      throw error;
    }
  }

  /**
   * 生成 package.json
   */
  generatePackageJson(projectName, n8nTemplate) {
    return JSON.stringify({
      name: projectName,
      version: '1.0.0',
      description: `${n8nTemplate.description} - n8n 整合專案`,
      main: 'server.js',
      scripts: {
        start: 'node server.js',
        dev: 'nodemon server.js',
        'n8n:start': 'n8n start',
        'n8n:webhook': 'n8n webhook',
        'docker:up': 'docker-compose up -d',
        'docker:down': 'docker-compose down'
      },
      keywords: ['n8n', 'automation', 'mursfoto', 'workflow'],
      author: 'murs',
      license: 'MIT',
      dependencies: {
        express: '^4.18.2',
        cors: '^2.8.5',
        dotenv: '^16.3.1',
        axios: '^1.6.0',
        'n8n': '^1.0.0'
      },
      devDependencies: {
        nodemon: '^3.0.1'
      },
      engines: {
        node: '>=18.0.0'
      }
    }, null, 2);
  }

  /**
   * 生成伺服器程式碼
   */
  generateServerJs(n8nTemplate) {
    return `const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// 中間件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// n8n Webhook 路由
app.post('/webhook/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const payload = req.body;
    
    console.log(\`📨 收到 webhook 請求: \${workflowId}\`, payload);
    
    // 轉發到 n8n
    if (process.env.N8N_WEBHOOK_URL) {
      const n8nResponse = await axios.post(
        \`\${process.env.N8N_WEBHOOK_URL}/\${workflowId}\`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mursfoto-AutoDev-Factory'
          }
        }
      );
      
      res.json({
        success: true,
        message: 'Webhook processed successfully',
        n8nResponse: n8nResponse.data
      });
    } else {
      res.json({
        success: true,
        message: 'Webhook received (n8n not configured)',
        data: payload
      });
    }
    
  } catch (error) {
    console.error('❌ Webhook 處理錯誤:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 健康檢查
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    template: '${n8nTemplate.name}',
    category: '${n8nTemplate.category}'
  });
});

// n8n 工作流程狀態
app.get('/workflow/status', async (req, res) => {
  try {
    if (process.env.N8N_API_URL && process.env.N8N_API_KEY) {
      const response = await axios.get(\`\${process.env.N8N_API_URL}/workflows\`, {
        headers: {
          'Authorization': \`Bearer \${process.env.N8N_API_KEY}\`
        }
      });
      
      res.json({
        success: true,
        workflows: response.data
      });
    } else {
      res.json({
        success: false,
        message: 'n8n API 未配置'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 根路由
app.get('/', (req, res) => {
  res.json({
    name: '${n8nTemplate.name}',
    description: '${n8nTemplate.description}',
    category: '${n8nTemplate.category}',
    endpoints: {
      webhook: '/webhook/:workflowId',
      health: '/health',
      workflow: '/workflow/status'
    },
    usage: '${n8nTemplate.usage || 'n8n 自動化工作流程'}'
  });
});

app.listen(port, () => {
  console.log(\`🚀 \${process.env.npm_package_name || 'n8n-service'} 運行於 http://localhost:\${port}\`);
  console.log(\`📋 模板: ${n8nTemplate.name}\`);
  console.log(\`🔗 Webhook: http://localhost:\${port}/webhook/[workflow-id]\`);
});

module.exports = app;
`;
  }

  /**
   * 生成 n8n 配置
   */
  generateN8nConfig(n8nTemplate) {
    return JSON.stringify({
      workflow: {
        id: n8nTemplate.id,
        name: n8nTemplate.name,
        description: n8nTemplate.description,
        category: n8nTemplate.category,
        nodes: n8nTemplate.nodes,
        connections: {},
        settings: {
          timezone: 'Asia/Taipei',
          saveDataErrorExecution: 'all',
          saveDataSuccessExecution: 'all',
          saveManualExecutions: true,
          callerPolicy: 'workflowsFromSameOwner'
        }
      },
      environment: {
        N8N_HOST: '0.0.0.0',
        N8N_PORT: '5678',
        N8N_PROTOCOL: 'http',
        WEBHOOK_URL: 'http://localhost:5678',
        N8N_EDITOR_BASE_URL: 'http://localhost:5678'
      },
      mursfoto: {
        gateway_integration: true,
        auto_deploy: true,
        monitoring: true
      }
    }, null, 2);
  }

  /**
   * 生成 README.md
   */
  generateReadme(projectName, n8nTemplate) {
    return `# ${projectName}

**${n8nTemplate.description}**

這是一個基於 n8n 自動化工作流程的 Mursfoto 專案。

## 🎯 功能特點

- 🔄 **自動化工作流程**: 基於 n8n 的強大自動化能力
- 🌐 **Webhook 支援**: 接收和處理外部 webhook 請求  
- 🔗 **Gateway 集成**: 自動整合到 Mursfoto API Gateway
- 📊 **監控和日誌**: 完整的執行監控和錯誤處理
- 🐳 **Docker 支援**: 包含完整的 Docker 配置

## 📦 快速開始

### 1. 安裝依賴
\`\`\`bash
npm install
\`\`\`

### 2. 環境配置
\`\`\`bash
cp .env.example .env
# 編輯 .env 文件，配置必要的環境變數
\`\`\`

### 3. 啟動服務
\`\`\`bash
# 啟動 Express 服務
npm run dev

# 啟動 n8n (另一個終端)
npm run n8n:start

# 或使用 Docker
npm run docker:up
\`\`\`

## 🔗 API 端點

- **POST /webhook/:workflowId** - 接收 webhook 請求
- **GET /health** - 健康檢查
- **GET /workflow/status** - n8n 工作流程狀態
- **GET /** - 服務信息

## 📋 n8n 工作流程

### 模板類型: ${n8nTemplate.category}
### 使用場景: ${n8nTemplate.usage || 'n8n 自動化'}

該項目包含以下 n8n 節點配置:
${n8nTemplate.nodes.map(node => `- **${node.name}** (${node.type})`).join('\n')}

## 🛠️ 開發指南

### n8n 編輯器
訪問 http://localhost:5678 進入 n8n 編輯器

### Webhook 測試
\`\`\`bash
curl -X POST http://localhost:3001/webhook/test \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello from Mursfoto AutoDev Factory!"}'
\`\`\`

### 工作流程部署
1. 在 n8n 編輯器中設計工作流程
2. 導出工作流程 JSON
3. 更新 \`workflows/main.json\`
4. 重啟服務

## 🐳 Docker 部署

### 使用 Docker Compose
\`\`\`bash
docker-compose up -d
\`\`\`

### 單獨部署
\`\`\`bash
# 構建鏡像
docker build -t ${projectName} .

# 運行容器
docker run -d -p 3001:3001 -p 5678:5678 ${projectName}
\`\`\`

## 📊 監控和調試

### 日誌查看
\`\`\`bash
# Express 服務日誌
npm run dev

# n8n 日誌
docker-compose logs n8n

# 所有服務日誌
docker-compose logs -f
\`\`\`

### 錯誤處理
- 檢查 \`.env\` 配置是否正確
- 確認 n8n 服務正常運行
- 查看 webhook URL 配置
- 驗證 API 密鑰有效性

## 🚀 部署到生產環境

### Zeabur 部署
\`\`\`bash
# 使用 Mursfoto CLI
mursfoto deploy

# 檢查部署狀態  
mursfoto status
\`\`\`

### 環境變數配置
確保生產環境配置了以下變數:
- \`N8N_API_URL\`
- \`N8N_API_KEY\`
- \`DISCORD_WEBHOOK_URL\`
- \`GITHUB_TOKEN\`

## 📖 相關文檔

- [n8n 官方文檔](https://docs.n8n.io/)
- [Mursfoto AutoDev Factory](https://github.com/mursfoto/mursfoto-cli)
- [API Gateway 集成](https://github.com/mursfoto/mursfoto-api-gateway)

---

**🎉 由 Mursfoto AutoDev Factory 自動生成**
`;
  }

  /**
   * 生成環境變數範例
   */
  generateEnvExample(n8nTemplate) {
    const envVars = new Set(['PORT=3001']);
    
    // 根據 n8n 節點類型添加相應的環境變數
    n8nTemplate.nodes.forEach(node => {
      switch (node.type) {
        case 'n8n-nodes-base.discord':
          envVars.add('DISCORD_WEBHOOK_URL=your_discord_webhook_url');
          break;
        case 'n8n-nodes-base.githubTrigger':
          envVars.add('GITHUB_TOKEN=your_github_token');
          envVars.add('GITHUB_REPO=your_repo');
          envVars.add('GITHUB_OWNER=your_username');
          break;
        case 'n8n-nodes-base.httpRequest':
          envVars.add('ZEABUR_TOKEN=your_zeabur_token');
          envVars.add('PROJECT_ID=your_project_id');
          break;
      }
    });

    // n8n 基本配置
    envVars.add('N8N_API_URL=http://localhost:5678');
    envVars.add('N8N_API_KEY=your_n8n_api_key');
    envVars.add('N8N_WEBHOOK_URL=http://localhost:5678/webhook');
    
    // Mursfoto 相關
    envVars.add('MURSFOTO_GATEWAY_URL=https://gateway.mursfoto.com');

    return Array.from(envVars).sort().join('\n');
  }

  /**
   * 生成 Docker Compose 配置
   */
  generateDockerCompose(projectName) {
    return `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
      - N8N_API_URL=http://n8n:5678
    env_file:
      - .env
    depends_on:
      - n8n
    restart: unless-stopped

  n8n:
    image: n8nio/n8n:latest
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=0.0.0.0
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - WEBHOOK_URL=http://localhost:5678
      - N8N_EDITOR_BASE_URL=http://localhost:5678
    volumes:
      - n8n_data:/home/node/.n8n
      - ./workflows:/home/node/.n8n/workflows
    restart: unless-stopped

volumes:
  n8n_data:
    driver: local

networks:
  default:
    name: ${projectName}_network
`;
  }

  /**
   * 創建基於 n8n 模板的項目
   */
  async createN8nProject(projectName, templateId, options = {}) {
    try {
      logger.info(`🚀 創建 n8n 項目: ${projectName}`);

      // 獲取模板
      const templates = await this.fetchCommunityTemplates();
      const template = templates.find(t => t.id === templateId);
      
      if (!template) {
        throw new Error(`找不到模板: ${templateId}`);
      }

      // 轉換模板
      const mursforoTemplate = await this.convertToMursforoTemplate(template, projectName);

      // 創建項目目錄
      const projectPath = path.join(process.cwd(), projectName);
      await fs.ensureDir(projectPath);

      // 生成項目文件
      for (const [filePath, content] of Object.entries(mursforoTemplate.files)) {
        const fullPath = path.join(projectPath, filePath);
        await fs.ensureDir(path.dirname(fullPath));
        await fs.writeFile(fullPath, content);
        logger.info(`📄 創建文件: ${filePath}`);
      }

      // 更新模板索引
      await this.updateTemplateIndex(mursforoTemplate);

      logger.success(`✅ n8n 項目創建成功: ${projectPath}`);
      
      return {
        projectPath,
        template: mursforoTemplate,
        nextSteps: [
          'cd ' + projectName,
          'npm install',
          'cp .env.example .env',
          'npm run dev'
        ]
      };
      
    } catch (error) {
      logger.error('n8n 項目創建失敗:', error.message);
      throw error;
    }
  }

  /**
   * 更新模板索引
   */
  async updateTemplateIndex(template) {
    try {
      const indexPath = path.join(this.templatesDir, 'index.json');
      const index = await fs.readJson(indexPath);
      
      // 移除舊版本的模板
      index.templates = index.templates.filter(t => t.name !== template.name);
      
      // 添加新模板
      index.templates.push({
        name: template.name,
        type: template.type,
        category: template.category,
        description: template.description,
        createdAt: new Date().toISOString()
      });
      
      index.lastUpdated = new Date().toISOString();
      
      await fs.writeJson(indexPath, index, { spaces: 2 });
      
    } catch (error) {
      logger.error('模板索引更新失敗:', error.message);
    }
  }

  /**
   * 列出可用的 n8n 模板
   */
  async listAvailableTemplates() {
    try {
      const templates = await this.fetchCommunityTemplates();
      
      logger.info('📋 可用的 n8n 模板:');
      templates.forEach((template, index) => {
        logger.info(`${index + 1}. ${template.name}`);
        logger.info(`   📋 ${template.description}`);
        logger.info(`   🏷️  類別: ${template.category}`);
        logger.info(`   🆔 ID: ${template.id}`);
        logger.info('');
      });
      
      return templates;
      
    } catch (error) {
      logger.error('模板列表獲取失敗:', error.message);
      return [];
    }
  }

  /**
   * 搜尋 n8n 模板
   */
  async searchTemplates(query, category = null) {
    try {
      const templates = await this.fetchCommunityTemplates(category);
      
      const filtered = templates.filter(template => 
        template.name.toLowerCase().includes(query.toLowerCase()) ||
        template.description.toLowerCase().includes(query.toLowerCase()) ||
        template.category.toLowerCase().includes(query.toLowerCase())
      );
      
      logger.info(`🔍 搜尋結果 "${query}": ${filtered.length} 個模板`);
      return filtered;
      
    } catch (error) {
      logger.error('模板搜尋失敗:', error.message);
      return [];
    }
  }
}

module.exports = N8nTemplateService;
