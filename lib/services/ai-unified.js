#!/usr/bin/env node

const path = require('path');
const chalk = require('chalk');

/**
 * 🔧 AI統合服務 - 實際功能整合版
 * AI模型、代碼生成、智能學習統一管理
 * 
 * 整合的原始服務:
 * - LMStudioService.js - 本地GPU AI服務
 * - AICodeGenerator.js - AI代碼生成器  
 * - AIModelRouter.js - AI模型路由器
 * - IntelligentLearningSystem.js - 智能學習系統
 */

class AiUnified {
  constructor(options = {}) {
    this.options = {
      debug: false,
      autoInit: true,
      serviceBasePath: path.join(__dirname, '../mursfoto-cli/lib/services'),
      quickMode: process.env.MURSFOTO_QUICK_MODE === 'true',
      ...options
    };
    
    // 原始服務實例
    this.services = {
      lmStudio: null,
      codeGenerator: null, 
      modelRouter: null,
      learningSystem: null
    };
    
    // 統計信息
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      serviceUsage: {},
      startTime: Date.now()
    };
    
    if (this.options.autoInit) {
      this.initialize();
    }
  }

  async initialize() {
    this.logger?.info(chalk.blue('🚀 初始化 AI統合服務...'));
    
    try {
      // 載入原始服務
      await this.loadOriginalServices();
      
      // 初始化統計追蹤
      this.initializeStats();
      
      this.logger?.info(chalk.green('✅ AI統合服務 初始化完成'));
      if (this.options.debug) {
        this.logger?.info(chalk.gray('📊 已載入服務:'), Object.keys(this.services).filter(k => this.services[k]));
      }
      return true;
    } catch (error) {
      console.error(chalk.red('❌ AI統合服務 初始化失敗:'), error.message);
      return false;
    }
  }

  async loadOriginalServices() {
    try {
      // 載入 LM Studio 服務
      try {
        const LMStudioService = require(path.join(this.options.serviceBasePath, 'LMStudioService'));
        this.services.lmStudio = new LMStudioService({
          apiEndpoint: process.env.LM_STUDIO_ENDPOINT || 'http://127.0.0.1:1234',
          modelName: process.env.LM_STUDIO_MODEL || 'unsloth/gpt-oss-20b-GGUF',
          timeout: 60000
        });
        
        if (this.options.debug) {
          this.logger?.info(chalk.green('📦 LMStudioService 載入成功'));
        }
      } catch (error) {
        console.warn(chalk.yellow('⚠️ LMStudioService 載入失敗:'), error.message);
      }

      // 載入 AI 代碼生成器
      try {
        const AICodeGenerator = require(path.join(this.options.serviceBasePath, 'AICodeGenerator'));
        this.services.codeGenerator = new AICodeGenerator();
        
        if (this.options.debug) {
          this.logger?.info(chalk.green('📦 AICodeGenerator 載入成功'));
        }
      } catch (error) {
        console.warn(chalk.yellow('⚠️ AICodeGenerator 載入失敗:'), error.message);
      }

      // 載入 AI 模型路由器
      try {
        const AIModelRouter = require(path.join(this.options.serviceBasePath, 'AIModelRouter'));
        this.services.modelRouter = new AIModelRouter();
        
        if (this.options.debug) {
          this.logger?.info(chalk.green('📦 AIModelRouter 載入成功'));
        }
      } catch (error) {
        console.warn(chalk.yellow('⚠️ AIModelRouter 載入失敗:'), error.message);
      }

      // 載入智能學習系統
      try {
        const IntelligentLearningSystem = require(path.join(this.options.serviceBasePath, 'IntelligentLearningSystem'));
        this.services.learningSystem = new IntelligentLearningSystem();
        
        if (this.options.debug) {
          this.logger?.info(chalk.green('📦 IntelligentLearningSystem 載入成功'));
        }
      } catch (error) {
        console.warn(chalk.yellow('⚠️ IntelligentLearningSystem 載入失敗:'), error.message);
      }

    } catch (error) {
      throw new Error(`載入原始服務失敗: ${error.message}`);
    }
  }

  initializeStats() {
    // 初始化服務使用統計
    Object.keys(this.services).forEach(serviceName => {
      if (this.services[serviceName]) {
        this.stats.serviceUsage[serviceName] = {
          requests: 0,
          successes: 0,
          failures: 0,
          averageTime: 0
        };
      }
    });
  }

  // 🎯 AI生成 - 統一介面
  async generate(prompt, options = {}) {
    const startTime = Date.now();
    this.stats.totalRequests++;
    
    try {
      // 使用 AI 模型路由器進行智能路由
      if (this.services.modelRouter) {
        const result = await this.services.modelRouter.generate(prompt, options);
        
        // 記錄到學習系統
        if (this.services.learningSystem) {
          await this.services.learningSystem.recordCommand({
            command: 'ai.generate',
            args: [prompt],
            success: true,
            duration: Date.now() - startTime,
            context: { options, result: result.metadata }
          });
        }
        
        this.updateStats('modelRouter', true, Date.now() - startTime);
        this.stats.successfulRequests++;
        
        return {
          success: true,
          content: result.content,
          metadata: {
            ...result.metadata,
            unified: true,
            responseTime: Date.now() - startTime
          }
        };
      }
      
      // 如果模型路由器不可用，嘗試直接使用 LM Studio
      if (this.services.lmStudio) {
        const result = await this.services.lmStudio.generate(prompt, options);
        
        this.updateStats('lmStudio', true, Date.now() - startTime);
        this.stats.successfulRequests++;
        
        return {
          success: true,
          content: result.content,
          metadata: {
            method: 'lm-studio-direct',
            unified: true,
            responseTime: Date.now() - startTime
          }
        };
      }
      
      throw new Error('沒有可用的 AI 服務');
      
    } catch (error) {
      this.stats.failedRequests++;
      
      // 記錄失敗到學習系統
      if (this.services.learningSystem) {
        await this.services.learningSystem.recordCommand({
          command: 'ai.generate',
          args: [prompt],
          success: false,
          duration: Date.now() - startTime,
          context: { options },
          error: error
        });
      }
      
      throw error;
    }
  }

  // 🤖 代碼生成 - 統一介面
  async generateCode(description, type = 'api', framework = 'express', options = {}) {
    const startTime = Date.now();
    this.stats.totalRequests++;
    
    try {
      if (!this.services.codeGenerator) {
        throw new Error('AI代碼生成器服務不可用');
      }
      
      const result = await this.services.codeGenerator.generate(description, type, framework, options);
      
      // 記錄到學習系統
      if (this.services.learningSystem) {
        await this.services.learningSystem.recordCommand({
          command: 'ai.generateCode',
          args: [description, type, framework],
          success: true,
          duration: Date.now() - startTime,
          context: { options, qualityScore: result.qualityScore }
        });
      }
      
      this.updateStats('codeGenerator', true, Date.now() - startTime);
      this.stats.successfulRequests++;
      
      return {
        success: true,
        ...result,
        metadata: {
          unified: true,
          responseTime: Date.now() - startTime
        }
      };
      
    } catch (error) {
      this.stats.failedRequests++;
      
      // 記錄失敗到學習系統
      if (this.services.learningSystem) {
        await this.services.learningSystem.recordCommand({
          command: 'ai.generateCode',
          args: [description, type, framework],
          success: false,
          duration: Date.now() - startTime,
          context: { options },
          error: error
        });
      }
      
      throw error;
    }
  }

  // 🧠 獲取智能建議
  async getIntelligentSuggestions(context = {}) {
    try {
      if (!this.services.learningSystem) {
        return [];
      }
      
      return await this.services.learningSystem.getIntelligentSuggestions(context);
    } catch (error) {
      console.warn(chalk.yellow('⚠️ 獲取智能建議失敗:'), error.message);
      return [];
    }
  }

  // 📊 獲取學習統計
  getLearningStatistics() {
    try {
      if (!this.services.learningSystem) {
        return {
          totalCommands: 0,
          uniqueCommands: 0,
          averageSuccessRate: 0,
          learningConfidence: 0
        };
      }
      
      return this.services.learningSystem.getLearningStatistics();
    } catch (error) {
      console.warn(chalk.yellow('⚠️ 獲取學習統計失敗:'), error.message);
      return {
        totalCommands: 0,
        uniqueCommands: 0,
        averageSuccessRate: 0,
        learningConfidence: 0
      };
    }
  }

  // 🎯 強制使用特定模型
  async forceGenerate(prompt, model, options = {}) {
    const startTime = Date.now();
    this.stats.totalRequests++;
    
    try {
      if (model === 'lm-studio' && this.services.lmStudio) {
        const result = await this.services.lmStudio.generate(prompt, options);
        this.updateStats('lmStudio', true, Date.now() - startTime);
        this.stats.successfulRequests++;
        return result;
      }
      
      if (this.services.modelRouter) {
        const result = await this.services.modelRouter.forceGenerate(prompt, model, options);
        this.updateStats('modelRouter', true, Date.now() - startTime);
        this.stats.successfulRequests++;
        return result;
      }
      
      throw new Error(`模型 ${model} 不可用`);
      
    } catch (error) {
      this.stats.failedRequests++;
      throw error;
    }
  }

  // 健康檢查
  async healthCheck() {
    const results = {
      unified: {
        status: 'healthy',
        uptime: Date.now() - this.stats.startTime,
        totalRequests: this.stats.totalRequests,
        successRate: this.stats.totalRequests > 0 
          ? (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(1) + '%'
          : '0%'
      }
    };
    
    // 檢查 LM Studio 服務
    if (this.services.lmStudio) {
      try {
        const isHealthy = await this.services.lmStudio.healthCheck();
        results.lmStudio = {
          status: isHealthy ? 'healthy' : 'unhealthy',
          lastCheck: new Date().toISOString()
        };
      } catch (error) {
        results.lmStudio = {
          status: 'error',
          error: error.message,
          lastCheck: new Date().toISOString()
        };
      }
    }
    
    // 檢查模型路由器
    if (this.services.modelRouter) {
      try {
        const routerStats = this.services.modelRouter.getStats();
        results.modelRouter = {
          status: 'healthy',
          stats: routerStats,
          lastCheck: new Date().toISOString()
        };
      } catch (error) {
        results.modelRouter = {
          status: 'error',
          error: error.message,
          lastCheck: new Date().toISOString()
        };
      }
    }
    
    // 檢查其他服務
    ['codeGenerator', 'learningSystem'].forEach(serviceName => {
      if (this.services[serviceName]) {
        results[serviceName] = {
          status: 'healthy',
          lastCheck: new Date().toISOString()
        };
      }
    });
    
    return results;
  }

  // 更新統計信息
  updateStats(serviceName, success, responseTime) {
    if (this.stats.serviceUsage[serviceName]) {
      const stats = this.stats.serviceUsage[serviceName];
      stats.requests++;
      
      if (success) {
        stats.successes++;
      } else {
        stats.failures++;
      }
      
      // 更新平均響應時間
      stats.averageTime = ((stats.averageTime * (stats.requests - 1)) + responseTime) / stats.requests;
    }
    
    // 更新全域平均響應時間
    this.stats.averageResponseTime = ((this.stats.averageResponseTime * (this.stats.totalRequests - 1)) + responseTime) / this.stats.totalRequests;
  }

  // 獲取服務資訊
  getServiceInfo() {
    const availableServices = Object.keys(this.services).filter(k => this.services[k]);
    
    return {
      name: 'AI統合服務',
      description: 'AI模型、代碼生成、智能學習統一管理',
      priority: 1,
      availableServices,
      totalServices: availableServices.length,
      status: 'active',
      stats: {
        uptime: Date.now() - this.stats.startTime,
        totalRequests: this.stats.totalRequests,
        successRate: this.stats.totalRequests > 0 
          ? (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(1) + '%'
          : '0%',
        averageResponseTime: Math.round(this.stats.averageResponseTime) + 'ms'
      }
    };
  }

  // 🔄 重置統計
  resetStats() {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      serviceUsage: {},
      startTime: Date.now()
    };
    this.initializeStats();
  }

  // 🎯 執行特定服務方法
  async executeServiceMethod(serviceName, methodName, ...args) {
    const startTime = Date.now();
    
    if (!this.services[serviceName]) {
      throw new Error(`服務 ${serviceName} 不可用`);
    }
    
    const service = this.services[serviceName];
    
    if (typeof service[methodName] !== 'function') {
      throw new Error(`方法 ${methodName} 在服務 ${serviceName} 中不存在`);
    }
    
    try {
      const result = await service[methodName](...args);
      this.updateStats(serviceName, true, Date.now() - startTime);
      return result;
    } catch (error) {
      this.updateStats(serviceName, false, Date.now() - startTime);
      throw error;
    }
  }
}

module.exports = AiUnified;

// 如果直接執行此檔案
if (require.main === module) {
  const service = new AiUnified({
    debug: true
  });
  
  this.logger?.info('🔧 AI統合服務 測試模式');
  this.logger?.info(service.getServiceInfo());
}
