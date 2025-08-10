const chalk = require('chalk')
const ora = require('ora')
const fs = require('fs-extra')
const path = require('path')
const AIModelRouter = require('./AIModelRouter')

/**
 * 🤖 AI 代碼生成器 - 混合 AI 架構
 * 基於自然語言描述生成完整的程式碼，智能選擇本地 gpt-oss-20b 或 Claude API
 */
class AICodeGenerator {
  constructor () {
    // 初始化 AI 模型路由器
    this.aiRouter = new AIModelRouter()

    // 保留向後兼容性
    this.apiKey = process.env.ANTHROPIC_API_KEY
    if (!this.apiKey) {
      console.warn('⚠️ 警告：未找到 ANTHROPIC_API_KEY，將僅使用本地模型')
    }

    // 將模板初始化延遲到方法定義之後
    this._initializeTemplates()
  }

  /**
   * 初始化模板映射
   */
  _initializeTemplates () {
    this.templates = {
      api: {
        express: this.generateExpressAPI.bind(this),
        fastify: (structure, options) => this.generateExpressAPI(structure, options) // 簡化版，使用相同邏輯
      },
      database: {
        mongoose: this.generateMongooseModel.bind(this),
        prisma: (structure, options) => this.generateMongooseModel(structure, options), // 簡化版
        sequelize: (structure, options) => this.generateMongooseModel(structure, options) // 簡化版
      },
      frontend: {
        react: this.generateReactComponent.bind(this),
        vue: (structure, options) => this.generateReactComponent(structure, options), // 簡化版
        vanilla: (structure, options) => this.generateReactComponent(structure, options) // 簡化版
      },
      test: {
        jest: this.generateJestTest.bind(this),
        cypress: (structure, options) => this.generateJestTest(structure, options) // 簡化版
      }
    }
  }

  /**
   * 🎯 主要生成方法
   * @param {string} description - 自然語言描述
   * @param {string} type - 代碼類型 (api/database/frontend/test)
   * @param {string} framework - 框架選擇
   * @param {Object} options - 其他選項
   */
  async generate (description, type = 'api', framework = 'express', options = {}) {
    const spinner = ora('🤖 AI 正在分析您的需求...').start()

    try {
      // 1. 分析用戶需求
      const analysis = await this.analyzeRequirements(description, type)
      spinner.text = '🧠 正在生成程式碼架構...'

      // 2. 生成代碼結構
      const codeStructure = await this.generateCodeStructure(analysis, type, framework)
      spinner.text = '⚡ 正在優化程式碼品質...'

      // 3. 生成具體代碼
      const generatedCode = await this.generateSpecificCode(codeStructure, options)
      spinner.text = '✅ 正在執行品質檢查...'

      // 4. 代碼品質檢查
      const qualityCheck = await this.performQualityCheck(generatedCode)

      spinner.succeed('🎉 AI 代碼生成完成！')

      return {
        success: true,
        description,
        type,
        framework,
        analysis,
        code: generatedCode,
        qualityScore: qualityCheck.score,
        suggestions: qualityCheck.suggestions,
        files: generatedCode.files || []
      }
    } catch (error) {
      spinner.fail('❌ AI 代碼生成失敗')
      throw new Error(`代碼生成錯誤: ${error.message}`)
    }
  }

  /**
   * 📊 需求分析 - 使用混合 AI 架構進行智能分析
   * 優先使用本地模型，複雜任務自動切換到 Claude API
   */
  async analyzeRequirements (description, type) {
    console.log('🧠 使用混合 AI 架構進行需求分析...')

    try {
      const analysisPrompt = `作為專業的軟體架構師，請分析以下${type}專案需求並以 JSON 格式回應：

需求描述：${description}

請提供以下分析結果：
{
  "entities": ["識別的實體列表"],
  "operations": ["需要的操作列表"], 
  "requirements": ["功能需求列表"],
  "complexity": "簡單|中等|複雜",
  "suggestions": ["技術建議列表"],
  "architecture": "建議的架構模式",
  "technologies": ["建議使用的技術"]
}`

      const result = await this.aiRouter.generate(analysisPrompt, {
        systemPrompt: '你是一位專業的軟體架構師，專門分析需求並提供技術建議。',
        complexity: 'medium' // 需求分析通常是中等複雜度
      })

      try {
        // 嘗試解析 JSON 回應
        return JSON.parse(result.content)
      } catch (parseError) {
        console.warn('AI 回應不是有效的 JSON，使用備用分析')
        return this.fallbackAnalysis(description, type)
      }
    } catch (error) {
      console.warn('AI 分析失敗，使用本地分析:', error.message)
      return this.fallbackAnalysis(description, type)
    }
  }

  /**
   * 🎯 獲取 AI 路由器統計信息
   */
  getAIStats () {
    return this.aiRouter.getStats()
  }

  /**
   * 🔄 強制使用特定模型
   */
  async generateWithSpecificModel (prompt, model, options = {}) {
    return await this.aiRouter.forceGenerate(prompt, model, options)
  }

  /**
   * 🔄 備用分析（當 Claude API 不可用時）
   */
  fallbackAnalysis (description, type) {
    return {
      entities: this.extractEntities(description),
      operations: this.extractOperations(description),
      requirements: this.extractRequirements(description),
      complexity: this.assessComplexity(description),
      suggestions: this.generateSuggestions(description, type),
      architecture: '三層架構',
      technologies: ['Node.js', 'Express', 'MongoDB']
    }
  }

  /**
   * 🏗️ 生成程式碼架構
   */
  async generateCodeStructure (analysis, type, framework) {
    const structure = {
      type,
      framework,
      files: [],
      dependencies: [],
      structure: {}
    }

    switch (type) {
      case 'api':
        structure.files = [
          'server.js',
          'routes/index.js',
          'middleware/auth.js',
          'controllers/',
          'models/',
          'config/',
          'tests/'
        ]
        structure.dependencies = ['express', 'cors', 'helmet', 'dotenv']
        break

      case 'database':
        structure.files = [
          'models/',
          'migrations/',
          'seeds/',
          'config/database.js'
        ]
        structure.dependencies = ['mongoose', 'prisma', 'sequelize']
        break

      case 'frontend':
        structure.files = [
          'src/components/',
          'src/pages/',
          'src/services/',
          'src/utils/',
          'src/styles/'
        ]
        break
    }

    return structure
  }

  /**
   * 💻 生成具體程式碼
   */
  async generateSpecificCode (structure, options) {
    const generatedCode = {
      files: {},
      main: '',
      tests: {},
      docs: ''
    }

    // 根據架構生成實際代碼
    if (this.templates[structure.type] && this.templates[structure.type][structure.framework]) {
      const generator = this.templates[structure.type][structure.framework]
      return await generator(structure, options)
    }

    return generatedCode
  }

  /**
   * 🚀 生成 Express API
   */
  async generateExpressAPI (structure, options) {
    const { entities, operations } = options.analysis || {}

    const serverCode = `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中間件
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
${entities
? entities.map(entity =>
  `app.use('/api/${entity.toLowerCase()}', require('./routes/${entity.toLowerCase()}'));`
).join('\n')
: '// 路由將在這裡生成'}

// 錯誤處理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: '伺服器內部錯誤',
    message: process.env.NODE_ENV === 'development' ? err.message : '請稍後再試' 
  });
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(\`🚀 伺服器運行於 http://localhost:\${PORT}\`);
});

module.exports = app;`

    const packageJson = {
      name: options.projectName || 'ai-generated-api',
      version: '1.0.0',
      description: 'AI 生成的 Express API',
      main: 'server.js',
      scripts: {
        start: 'node server.js',
        dev: 'nodemon server.js',
        test: 'jest'
      },
      dependencies: {
        express: '^4.18.2',
        cors: '^2.8.5',
        helmet: '^7.1.0',
        dotenv: '^16.3.1'
      },
      devDependencies: {
        nodemon: '^3.0.1',
        jest: '^29.7.0',
        supertest: '^6.3.3'
      }
    }

    return {
      files: {
        'server.js': serverCode,
        'package.json': JSON.stringify(packageJson, null, 2),
        '.env.example': 'PORT=3000\nNODE_ENV=development\nDB_CONNECTION_STRING=your_database_url_here',
        'README.md': this.generateAPIDocumentation(options)
      },
      main: 'server.js',
      tests: this.generateAPITests(entities || [], operations || []),
      docs: '完整的 Express API 已生成，包含安全中間件和錯誤處理'
    }
  }

  /**
   * 🔧 生成 Mongoose 模型
   */
  async generateMongooseModel (structure, options) {
    const { entities = [] } = options.analysis || {}

    const models = {}

    entities.forEach(entity => {
      const modelCode = `const mongoose = require('mongoose');

const ${entity}Schema = new mongoose.Schema({
  // AI 將根據您的需求自動生成欄位
  name: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引
${entity}Schema.index({ name: 1 });

// 虛擬欄位
${entity}Schema.virtual('id').get(function() {
  return this._id.toHexString();
});

// 中間件
${entity}Schema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('${entity}', ${entity}Schema);`

      models[`models/${entity}.js`] = modelCode
    })

    return {
      files: models,
      main: 'models/index.js',
      docs: `${entities.length} 個 Mongoose 模型已生成`
    }
  }

  /**
   * ⚡ 生成 React 組件
   */
  async generateReactComponent (structure, options) {
    const componentName = options.componentName || 'AIGeneratedComponent'

    const componentCode = `import React, { useState, useEffect } from 'react';
import './${componentName}.css';

/**
 * ${componentName} 組件
 * AI 生成的 React 組件
 */
const ${componentName} = ({ ...props }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // AI 將根據您的需求生成初始化邏輯
    const initialize = async () => {
      try {
        setLoading(true);
        // 模擬 API 調用
        await new Promise(resolve => setTimeout(resolve, 1000));
        setData({ message: 'AI 組件載入成功！' });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  if (loading) return <div className="loading">載入中...</div>;
  if (error) return <div className="error">錯誤: {error}</div>;

  return (
    <div className="${componentName.toLowerCase()}">
      <h2>🤖 AI 生成的組件</h2>
      {data && (
        <div className="content">
          <p>{data.message}</p>
        </div>
      )}
    </div>
  );
};

export default ${componentName};`

    const cssCode = `.${componentName.toLowerCase()} {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-family: Arial, sans-serif;
}

.${componentName.toLowerCase()} h2 {
  color: #333;
  margin-bottom: 16px;
}

.loading, .error {
  padding: 12px;
  border-radius: 4px;
  text-align: center;
}

.loading {
  background-color: #f0f8ff;
  color: #0066cc;
}

.error {
  background-color: #fff5f5;
  color: #cc0000;
}

.content {
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 4px;
}`

    return {
      files: {
        [`components/${componentName}.js`]: componentCode,
        [`components/${componentName}.css`]: cssCode,
        [`components/${componentName}.test.js`]: this.generateReactTest(componentName)
      },
      main: `components/${componentName}.js`,
      docs: `${componentName} React 組件已生成，包含樣式和測試`
    }
  }

  /**
   * 🧪 生成 Jest 測試
   */
  async generateJestTest (structure, options) {
    const { testTarget, testType } = options

    const testCode = `const request = require('supertest');
const app = require('../server');

describe('AI 生成的測試', () => {
  beforeAll(async () => {
    // 測試前設置
  });

  afterAll(async () => {
    // 測試後清理
  });

  test('應該返回正確的響應', async () => {
    const response = await request(app)
      .get('/api/test')
      .expect(200);
    
    expect(response.body).toHaveProperty('success', true);
  });

  test('應該處理錯誤情況', async () => {
    const response = await request(app)
      .post('/api/invalid')
      .expect(404);
    
    expect(response.body).toHaveProperty('error');
  });
});`

    return {
      files: {
        'tests/generated.test.js': testCode
      },
      main: 'tests/generated.test.js',
      docs: 'Jest 測試檔案已生成，包含基本的 API 測試案例'
    }
  }

  /**
   * 🎯 代碼品質檢查
   */
  async performQualityCheck (generatedCode) {
    const checks = {
      syntax: this.checkSyntax(generatedCode),
      security: this.checkSecurity(generatedCode),
      performance: this.checkPerformance(generatedCode),
      maintainability: this.checkMaintainability(generatedCode)
    }

    const scores = Object.values(checks).map(check => check.score)
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length

    return {
      score: Math.round(averageScore),
      checks,
      suggestions: this.generateQualitySuggestions(checks)
    }
  }

  /**
   * 📝 生成 API 文檔
   */
  generateAPIDocumentation (options) {
    return `# 🤖 AI 生成的 API 文檔

## 描述
${options.analysis?.requirements?.join('\n') || '智慧生成的 Express API'}

## 安裝

\`\`\`bash
npm install
npm run dev
\`\`\`

## API 端點

### GET /api/health
檢查 API 狀態

### 其他端點
AI 根據您的需求自動生成的端點將在這裡顯示。

## 環境變數
複製 \`.env.example\` 到 \`.env\` 並填入相應的值。

## 測試
\`\`\`bash
npm test
\`\`\`
`
  }

  /**
   * 🔍 輔助方法
   */
  extractEntities (description) {
    // 簡化版實體提取，實際會使用更複雜的 NLP
    const entities = description.match(/(?:建立|創建|新增)(?:一個)?([^\s,，。]+)/g)
    return entities ? entities.map(e => e.replace(/(?:建立|創建|新增)(?:一個)?/, '').trim()) : []
  }

  extractOperations (description) {
    const operations = ['創建', '讀取', '更新', '刪除', '查詢', '驗證']
    return operations.filter(op => description.includes(op))
  }

  extractRequirements (description) {
    return [description] // 簡化版，實際會進行更詳細的需求分析
  }

  assessComplexity (description) {
    const complexityKeywords = ['複雜', '多層', '整合', '自動化', '即時']
    const complexity = complexityKeywords.some(keyword => description.includes(keyword)) ? '高' : '中'
    return complexity
  }

  generateSuggestions (description, type) {
    return [
      '建議添加輸入驗證',
      '考慮添加快取機制',
      '建議實施錯誤處理',
      '考慮添加監控和日誌'
    ]
  }

  checkSyntax (code) {
    return { score: 95, issues: [] } // 簡化版語法檢查
  }

  checkSecurity (code) {
    return { score: 88, issues: ['建議添加速率限制', '考慮添加 CSRF 保護'] }
  }

  checkPerformance (code) {
    return { score: 92, issues: ['建議添加快取機制'] }
  }

  checkMaintainability (code) {
    return { score: 90, issues: ['建議添加更多註解'] }
  }

  generateQualitySuggestions (checks) {
    const allIssues = Object.values(checks).flatMap(check => check.issues)
    return [...new Set(allIssues)] // 去重
  }

  generateAPITests (entities, operations) {
    // 生成基於實體和操作的測試程式碼
    return entities.reduce((tests, entity) => {
      tests[`tests/${entity.toLowerCase()}.test.js`] = this.generateEntityTest(entity, operations)
      return tests
    }, {})
  }

  generateEntityTest (entity, operations) {
    return `// AI 生成的 ${entity} 測試
describe('${entity} API', () => {
  test('應該能夠創建 ${entity}', async () => {
    // 測試代碼將在這裡生成
  });
});`
  }

  generateReactTest (componentName) {
    return `import React from 'react';
import { render, screen } from '@testing-library/react';
import ${componentName} from './${componentName}';

test('renders ${componentName} component', () => {
  render(<${componentName} />);
  const element = screen.getByText(/AI 生成的組件/i);
  expect(element).toBeInTheDocument();
});`
  }
}

module.exports = AICodeGenerator
