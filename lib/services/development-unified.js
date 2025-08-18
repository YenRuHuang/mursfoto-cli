#!/usr/bin/env node

/**
 * 🔧 開發統合服務
 * 測試、模板、GitHub自動化統一管理
 * 
 * 整合的原始服務:
 * - GitHubAutomation.js (GitHub 自動化管理)
 * - SmartTestAutomation.js (AI 智能測試自動化)  
 * - AdvancedTemplateManager.js (高級模板管理)
 * - N8nTemplateService.js (n8n 工作流模板服務)
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// 動態載入 chalk (ESM 相容性)
let chalk = null;
async function loadChalk() {
  const chalkModule = await import('chalk');
  return chalkModule.default;
}

class DevelopmentUnified {
  constructor(options = {}) {
    this.options = {
      debug: false,
      autoInit: true,
      basePath: path.join(__dirname, '../mursfoto-cli'),
      enableGitHub: true,
      enableTesting: true,
      enableTemplates: true,
      enableN8n: true,
      ...options
    };
    
    // 整合服務實例
    this.services = {};
    this.stats = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      startTime: Date.now()
    };
    
    // 載入環境變數
    this.loadEnvironment();
    
    if (this.options.autoInit) {
      this.initialize();
    }
  }

  loadEnvironment() {
    // 載入 mursfoto-cli .env 文件
    const envPath = path.join(this.options.basePath, '.env');
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      if (this.options.debug) {
        this.logger?.info(`📁 載入環境變數: ${envPath}`);
      }
    }
  }

  async initialize() {
    if (!chalk) chalk = await loadChalk();
    this.logger?.info(chalk.cyan('🚀 初始化 開發統合服務...'));
    
    try {
      // 載入原始服務
      await this.loadOriginalServices();
      
      // 檢查環境配置
      await this.checkEnvironmentConfigurations();
      
      this.logger?.info(chalk.green('✅ 開發統合服務 初始化完成'));
      return true;
    } catch (error) {
      console.error(chalk.red('❌ 開發統合服務 初始化失敗:'), error.message);
      return false;
    }
  }

  async loadOriginalServices() {
    const serviceMappings = {
      GitHubAutomation: {
        path: path.join(this.options.basePath, 'lib/services/GitHubAutomation.js'),
        enabled: this.options.enableGitHub,
        description: 'GitHub 庫管理自動化'
      },
      SmartTestAutomation: {
        path: path.join(this.options.basePath, 'lib/services/SmartTestAutomation.js'),
        enabled: this.options.enableTesting,
        description: 'AI 智能測試自動化'
      },
      AdvancedTemplateManager: {
        path: path.join(this.options.basePath, 'lib/services/AdvancedTemplateManager.js'),
        enabled: this.options.enableTemplates,
        description: '高級模板管理'
      },
      N8nTemplateService: {
        path: path.join(this.options.basePath, 'lib/services/N8nTemplateService.js'),
        enabled: this.options.enableN8n,
        description: 'n8n 工作流模板服務'
      }
    };

    for (const [serviceName, config] of Object.entries(serviceMappings)) {
      if (!config.enabled) {
        if (this.options.debug) {
          this.logger?.info(chalk.yellow(`⏭️  跳過已停用的服務: ${serviceName}`));
        }
        continue;
      }

      try {
        if (fs.existsSync(config.path)) {
          const ServiceClass = require(config.path);
          this.services[serviceName] = new ServiceClass({
            debug: this.options.debug
          });
          
          if (this.options.debug) {
            this.logger?.info(chalk.blue(`📦 載入開發服務: ${serviceName} - ${config.description}`));
          }
        } else {
          console.warn(chalk.yellow(`⚠️  服務文件不存在: ${config.path}`));
        }
      } catch (error) {
        console.warn(chalk.yellow(`⚠️  載入服務失敗: ${serviceName}`), error.message);
      }
    }
  }

  async checkEnvironmentConfigurations() {
    if (!chalk) chalk = await loadChalk();
    
    const configs = {
      'GitHub Token': process.env.GITHUB_TOKEN,
      'Claude API Key': process.env.CLAUDE_API_KEY,
      'OpenAI API Key': process.env.OPENAI_API_KEY,
      'N8n API Key': process.env.N8N_API_KEY
    };

    let configuredCount = 0;
    for (const [name, value] of Object.entries(configs)) {
      if (value) {
        this.logger?.info(chalk.green(`✅ ${name} 環境變數已配置`));
        configuredCount++;
      } else {
        this.logger?.info(chalk.gray(`ℹ️  ${name} 環境變數未配置`));
      }
    }

    if (configuredCount > 0) {
      this.logger?.info(chalk.cyan(`🔧 已配置 ${configuredCount}/4 個開發環境變數`));
    }
  }

  // GitHub 自動化功能
  async createRepository(repositoryConfig) {
    if (!chalk) chalk = await loadChalk();
    
    this.stats.totalOperations++;
    const startTime = Date.now();
    
    try {
      this.logger?.info(chalk.cyan('📁 建立 GitHub 儲存庫...'));
      
      if (this.services.GitHubAutomation) {
        const result = await this.services.GitHubAutomation.createRepository(repositoryConfig);
        this.stats.successfulOperations++;
        
        this.logger?.info(chalk.green(`✅ GitHub 儲存庫建立成功: ${repositoryConfig.name}`));
        return result;
      } else {
        throw new Error('GitHubAutomation 服務未載入');
      }
    } catch (error) {
      this.stats.failedOperations++;
      console.error(chalk.red('❌ GitHub 儲存庫建立失敗:'), error.message);
      throw error;
    }
  }

  async setupGitHubAutomation(repositoryName, options = {}) {
    if (!chalk) chalk = await loadChalk();
    
    this.stats.totalOperations++;
    
    try {
      this.logger?.info(chalk.cyan(`🔧 設定 GitHub 自動化: ${repositoryName}`));
      
      if (this.services.GitHubAutomation) {
        const results = {};
        
        // 設定分支保護
        if (options.branchProtection !== false) {
          results.branchProtection = await this.services.GitHubAutomation.setupBranchProtection(repositoryName);
        }
        
        // 建立標籤
        if (options.createLabels !== false) {
          results.labels = await this.services.GitHubAutomation.createLabels(repositoryName);
        }
        
        // 設定 Webhooks
        if (options.webhooks) {
          results.webhooks = await this.services.GitHubAutomation.setupWebhooks(repositoryName, options.webhooks);
        }
        
        this.stats.successfulOperations++;
        this.logger?.info(chalk.green(`✅ GitHub 自動化設定完成: ${repositoryName}`));
        return results;
      } else {
        throw new Error('GitHubAutomation 服務未載入');
      }
    } catch (error) {
      this.stats.failedOperations++;
      console.error(chalk.red('❌ GitHub 自動化設定失敗:'), error.message);
      throw error;
    }
  }

  // 智能測試自動化
  async generateTests(projectPath, testConfig = {}) {
    if (!chalk) chalk = await loadChalk();
    
    this.stats.totalOperations++;
    
    try {
      this.logger?.info(chalk.cyan('🧪 產生智能測試...'));
      
      if (this.services.SmartTestAutomation) {
        const result = await this.services.SmartTestAutomation.generateTests(projectPath, testConfig);
        this.stats.successfulOperations++;
        
        this.logger?.info(chalk.green(`✅ 智能測試產生完成`));
        return result;
      } else {
        throw new Error('SmartTestAutomation 服務未載入');
      }
    } catch (error) {
      this.stats.failedOperations++;
      console.error(chalk.red('❌ 智能測試產生失敗:'), error.message);
      throw error;
    }
  }

  async runTestSuite(projectPath, testType = 'all') {
    if (!chalk) chalk = await loadChalk();
    
    this.stats.totalOperations++;
    
    try {
      this.logger?.info(chalk.cyan(`� 執行測試套件 (${testType})...`));
      
      if (this.services.SmartTestAutomation) {
        const result = await this.services.SmartTestAutomation.runTests(projectPath, { type: testType });
        this.stats.successfulOperations++;
        
        this.logger?.info(chalk.green(`✅ 測試套件執行完成`));
        return result;
      } else {
        throw new Error('SmartTestAutomation 服務未載入');
      }
    } catch (error) {
      this.stats.failedOperations++;
      console.error(chalk.red('❌ 測試套件執行失敗:'), error.message);
      throw error;
    }
  }

  // 模板管理功能
  async recommendTemplates(projectType) {
    if (!chalk) chalk = await loadChalk();
    
    this.stats.totalOperations++;
    
    try {
      this.logger?.info(chalk.cyan(`📋 推薦模板 (${projectType})...`));
      
      if (this.services.AdvancedTemplateManager) {
        const result = await this.services.AdvancedTemplateManager.recommendTemplates(projectType);
        this.stats.successfulOperations++;
        
        this.logger?.info(chalk.green(`✅ 模板推薦完成`));
        return result;
      } else {
        throw new Error('AdvancedTemplateManager 服務未載入');
      }
    } catch (error) {
      this.stats.failedOperations++;
      console.error(chalk.red('❌ 模板推薦失敗:'), error.message);
      throw error;
    }
  }

  async createCustomTemplate(templateConfig) {
    if (!chalk) chalk = await loadChalk();
    
    this.stats.totalOperations++;
    
    try {
      this.logger?.info(chalk.cyan('🏗️  建立自訂模板...'));
      
      if (this.services.AdvancedTemplateManager) {
        const result = await this.services.AdvancedTemplateManager.createCustomTemplate(templateConfig);
        this.stats.successfulOperations++;
        
        this.logger?.info(chalk.green(`✅ 自訂模板建立完成: ${templateConfig.name}`));
        return result;
      } else {
        throw new Error('AdvancedTemplateManager 服務未載入');
      }
    } catch (error) {
      this.stats.failedOperations++;
      console.error(chalk.red('❌ 自訂模板建立失敗:'), error.message);
      throw error;
    }
  }

  // N8n 工作流功能
  async createN8nProject(workflowConfig) {
    if (!chalk) chalk = await loadChalk();
    
    this.stats.totalOperations++;
    
    try {
      this.logger?.info(chalk.cyan('🔄 建立 N8n 工作流專案...'));
      
      if (this.services.N8nTemplateService) {
        const result = await this.services.N8nTemplateService.createN8nProject(workflowConfig);
        this.stats.successfulOperations++;
        
        this.logger?.info(chalk.green(`✅ N8n 工作流專案建立完成`));
        return result;
      } else {
        throw new Error('N8nTemplateService 服務未載入');
      }
    } catch (error) {
      this.stats.failedOperations++;
      console.error(chalk.red('❌ N8n 工作流專案建立失敗:'), error.message);
      throw error;
    }
  }

  async convertN8nWorkflow(workflowData, projectConfig) {
    if (!chalk) chalk = await loadChalk();
    
    this.stats.totalOperations++;
    
    try {
      this.logger?.info(chalk.cyan('🔀 轉換 N8n 工作流...'));
      
      if (this.services.N8nTemplateService) {
        const result = await this.services.N8nTemplateService.convertToMursforoTemplate(workflowData, projectConfig);
        this.stats.successfulOperations++;
        
        this.logger?.info(chalk.green(`✅ N8n 工作流轉換完成`));
        return result;
      } else {
        throw new Error('N8nTemplateService 服務未載入');
      }
    } catch (error) {
      this.stats.failedOperations++;
      console.error(chalk.red('❌ N8n 工作流轉換失敗:'), error.message);
      throw error;
    }
  }

  // 統合開發工作流程
  async setupFullDevelopmentWorkflow(projectConfig) {
    if (!chalk) chalk = await loadChalk();
    
    const startTime = Date.now();
    
    try {
      this.logger?.info(chalk.cyan('🚀 設定完整開發工作流程...'));
      
      const results = {
        github: null,
        tests: null,
        templates: null,
        workflows: null
      };
      
      // 1. 建立 GitHub 儲存庫
      if (projectConfig.github && this.services.GitHubAutomation) {
        results.github = await this.createRepository(projectConfig.github);
        await this.setupGitHubAutomation(projectConfig.github.name, projectConfig.github.automation);
      }
      
      // 2. 推薦並套用模板
      if (projectConfig.projectType && this.services.AdvancedTemplateManager) {
        const recommendations = await this.recommendTemplates(projectConfig.projectType);
        results.templates = recommendations;
        
        if (recommendations.suggested.length > 0) {
          const selectedTemplate = recommendations.suggested[0];
          await this.services.AdvancedTemplateManager.applyTemplate(selectedTemplate.id, projectConfig.targetPath);
        }
      }
      
      // 3. 產生測試
      if (projectConfig.testing && this.services.SmartTestAutomation) {
        results.tests = await this.generateTests(projectConfig.targetPath, projectConfig.testing);
      }
      
      // 4. 設定 N8n 工作流
      if (projectConfig.workflows && this.services.N8nTemplateService) {
        results.workflows = await this.createN8nProject(projectConfig.workflows);
      }
      
      const endTime = Date.now();
      this.logger?.info(chalk.green(`✅ 完整開發工作流程設定完成 (${endTime - startTime}ms)`));
      
      return results;
    } catch (error) {
      console.error(chalk.red('❌ 開發工作流程設定失敗:'), error.message);
      throw error;
    }
  }

  // 健康檢查
  async healthCheck() {
    const results = {};
    
    for (const [serviceName, service] of Object.entries(this.services)) {
      try {
        if (service && typeof service.healthCheck === 'function') {
          results[serviceName] = await service.healthCheck();
        } else {
          results[serviceName] = {
            status: 'healthy',
            message: '服務載入正常',
            lastCheck: new Date().toISOString()
          };
        }
      } catch (error) {
        results[serviceName] = {
          status: 'unhealthy',
          error: error.message,
          lastCheck: new Date().toISOString()
        };
      }
    }
    
    return results;
  }

  // 獲取統計資訊
  getStats() {
    const uptime = Date.now() - this.stats.startTime;
    const successRate = this.stats.totalOperations > 0 
      ? ((this.stats.successfulOperations / this.stats.totalOperations) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      uptime,
      successRate: `${successRate}%`,
      loadedServices: Object.keys(this.services).length
    };
  }

  // 獲取服務資訊
  getServiceInfo() {
    return {
      name: '開發統合服務',
      description: '測試、模板、GitHub自動化統一管理',
      version: '1.0.0',
      priority: 3,
      loadedServices: Object.keys(this.services),
      capabilities: [
        'GitHub 儲存庫自動化',
        'AI 智能測試產生',
        '高級模板管理',
        'N8n 工作流整合',
        '完整開發流程自動化'
      ],
      status: 'active',
      stats: this.getStats()
    };
  }
}

module.exports = DevelopmentUnified;

// 如果直接執行此檔案
if (require.main === module) {
  (async () => {
    const service = new DevelopmentUnified({
      debug: true
    });
    
    if (!chalk) chalk = await loadChalk();
    
    this.logger?.info(chalk.cyan('🔧 開發統合服務 測試模式'));
    this.logger?.info(JSON.stringify(service.getServiceInfo(), null, 2));
    
    // 執行健康檢查
    const healthResults = await service.healthCheck();
    this.logger?.info(chalk.blue('\n📊 健康檢查結果:'));
    this.logger?.info(JSON.stringify(healthResults, null, 2));
  })();
}
