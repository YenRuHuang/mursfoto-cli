#!/usr/bin/env node

const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// 載入環境變數
const envPath = path.join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// 使用動態 import 來載入 ESM 模塊
async function loadChalk() {
  const chalkModule = await import('chalk');
  return chalkModule.default;
}

let chalk;

/**
 * 🔧 部署統合服務
 * 多雲部署、容器化、管道自動化統一管理
 * 
 * 整合的原始服務:
 * - ContainerOptimizer.js - 容器優化和 Docker/K8s 管理
 * - ZeaburDeployService.js - Zeabur 自動化部署
 * - SmartDeploymentPipeline.js - 智能部署管道
 * - MultiCloudManager.js - 多雲平台管理
 */

class DeploymentUnified {
  constructor(options = {}) {
    this.options = {
      debug: false,
      autoInit: true,
      serviceBasePath: path.join(__dirname, '.'),
      ...options
    };
    
    // 整合服務實例
    this.services = {};
    
    // 支援的雲平台 - 移除中國服務，優先 Zeabur
    this.supportedPlatforms = [
      'zeabur',      // 優先：您的付費會員平台
      'vercel',      // 前端專精
      'aws',         // 企業級
      'azure',       // Microsoft 生態
      'gcp'          // Google 雲端
      // 已移除：alibaba, tencent (中國服務，資安考量)
    ];
    
    // 配置狀態追蹤
    this.configuredPlatforms = new Set();
    this.platformConfigs = new Map();
    
    // 統計追蹤
    this.statistics = {
      totalDeployments: 0,
      successfulDeployments: 0,
      failedDeployments: 0,
      averageDeployTime: 0,
      platformUsage: new Map(),
      containerOptimizations: 0,
      lastActivity: null
    };
    
    if (this.options.autoInit) {
      this.initialize();
    }
  }

  async initialize() {
    // 首先載入 chalk
    if (!chalk) {
      chalk = await loadChalk();
    }
    
    this.logger?.info(chalk.cyan('🚀 初始化 部署統合服務...'));
    
    try {
      // 載入原始服務功能
      await this.loadOriginalServices();
      
      // 檢查並配置環境變數
      await this.checkEnvironmentConfigurations();
      
      this.logger?.info(chalk.green('✅ 部署統合服務 初始化完成'));
      this.logger?.info(chalk.gray(`   整合了 ${Object.keys(this.services).length} 個部署相關服務`));
      this.logger?.info(chalk.gray(`   配置了 ${this.configuredPlatforms.size} 個雲平台`));
      
      return true;
    } catch (error) {
      console.error(chalk.red('❌ 部署統合服務 初始化失敗:'), error.message);
      if (this.options.debug) {
        console.error(error.stack);
      }
      return false;
    }
  }

  /**
   * 載入原始服務的真實功能
   */
  async loadOriginalServices() {
    try {
      // 載入容器優化服務
      const ContainerOptimizer = require(path.join(this.options.serviceBasePath, 'ContainerOptimizer'));
      this.services.containerOptimizer = new ContainerOptimizer();
      
      // 載入 Zeabur 部署服務
      const ZeaburDeployService = require(path.join(this.options.serviceBasePath, 'ZeaburDeployService'));
      this.services.zeaburDeploy = new ZeaburDeployService();
      
      // 載入智能部署管道
      const SmartDeploymentPipeline = require(path.join(this.options.serviceBasePath, 'SmartDeploymentPipeline'));
      this.services.deploymentPipeline = new SmartDeploymentPipeline();
      
      // 載入多雲平台管理器
      const MultiCloudManager = require(path.join(this.options.serviceBasePath, 'MultiCloudManager'));
      this.services.multiCloudManager = new MultiCloudManager();
      
      if (this.options.debug) {
        if (!chalk) chalk = await loadChalk();
        this.logger?.info(chalk.blue('📦 原始服務載入完成:'));
        Object.keys(this.services).forEach(key => {
          this.logger?.info(chalk.gray(`   - ${key}`));
        });
      }
      
    } catch (error) {
      throw new Error(`載入原始服務失敗: ${error.message}`);
    }
  }

  /**
   * � 檢查並配置環境變數
   */
  async checkEnvironmentConfigurations() {
    if (!chalk) chalk = await loadChalk();
    
    this.logger?.info(chalk.blue('🔧 檢查雲平台配置...'));
    
    // 檢查 Zeabur 配置（優先）
    if (process.env.ZEABUR_API_TOKEN) {
      this.configuredPlatforms.add('zeabur');
      this.platformConfigs.set('zeabur', {
        apiToken: process.env.ZEABUR_API_TOKEN,
        priority: 1,
        status: '✅ 已配置 (付費會員)'
      });
      this.logger?.info(chalk.green('   ✅ Zeabur 配置成功 (您的付費會員平台)'));
    } else {
      this.logger?.info(chalk.yellow('   ⚠️  Zeabur API Token 未配置'));
    }
    
    // 檢查其他平台配置
    const platformChecks = {
      vercel: 'VERCEL_TOKEN',
      aws: 'AWS_ACCESS_KEY_ID',
      azure: 'AZURE_SUBSCRIPTION_ID',
      gcp: 'GCP_PROJECT_ID'
    };
    
    for (const [platform, envVar] of Object.entries(platformChecks)) {
      if (process.env[envVar]) {
        this.configuredPlatforms.add(platform);
        this.platformConfigs.set(platform, {
          configured: true,
          status: '✅ 已配置'
        });
        this.logger?.info(chalk.green(`   ✅ ${platform.toUpperCase()} 配置成功`));
      } else {
        this.logger?.info(chalk.gray(`   ⚙️  ${platform.toUpperCase()} 未配置`));
      }
    }
    
    // 配置 MultiCloudManager 來移除中國服務
    if (this.services.multiCloudManager) {
      await this.configureSecureCloudPlatforms();
    }
    
    this.logger?.info(chalk.blue(`🌍 安全雲平台配置完成 (共 ${this.supportedPlatforms.length} 個平台)`));
  }

  /**
   * 🛡️ 配置安全的雲平台（移除中國服務）
   */
  async configureSecureCloudPlatforms() {
    // 這裡我們重新配置 MultiCloudManager 來只使用安全的非中國雲服務
    if (this.services.multiCloudManager && this.services.multiCloudManager.supportedPlatforms) {
      // 移除中國相關的平台
      const chinesePlatforms = ['alibaba', 'aliyun', 'tencent', 'baidu', 'huawei'];
      
      for (const platform of chinesePlatforms) {
        if (this.services.multiCloudManager.supportedPlatforms.has(platform)) {
          this.services.multiCloudManager.supportedPlatforms.delete(platform);
          if (this.options.debug) {
            this.logger?.info(chalk.red(`   🚫 已移除 ${platform} (資安考量)`));
          }
        }
      }
      
      // 設定 Zeabur 為優先平台
      if (this.services.multiCloudManager.supportedPlatforms.has('zeabur')) {
        const zeaburConfig = this.services.multiCloudManager.supportedPlatforms.get('zeabur');
        zeaburConfig.priority = 1;
        zeaburConfig.configured = this.configuredPlatforms.has('zeabur');
        zeaburConfig.successRate = 95; // 高成功率
      }
    }
  }

  /**
   * �🚀 統一部署接口 - 智能選擇最佳部署策略
   */
  async deploy(projectPath, deploymentConfig = {}) {
    const startTime = Date.now();
    
    try {
      if (!chalk) chalk = await loadChalk();
      this.logger?.info(chalk.cyan('🚀 開始智能部署流程...'));
      
      // 1. 分析專案需求
      const analysis = await this.analyzeProjectRequirements(projectPath);
      
      // 2. 推薦最佳部署平台和策略
      const recommendation = await this.recommendDeploymentStrategy(analysis, deploymentConfig);
      
      // 3. 執行部署
      const result = await this.executeDeployment(projectPath, recommendation, deploymentConfig);
      
      // 4. 更新統計
      this.updateStatistics(result, Date.now() - startTime);
      
      return {
        success: true,
        analysis,
        recommendation,
        result,
        duration: Date.now() - startTime
      };
      
    } catch (error) {
      this.statistics.failedDeployments++;
      console.error(chalk.red('❌ 部署失敗:'), error.message);
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * 🔍 分析專案部署需求
   */
  async analyzeProjectRequirements(projectPath) {
    if (!this.services.deploymentPipeline) {
      throw new Error('SmartDeploymentPipeline 服務未載入');
    }
    
    if (!chalk) chalk = await loadChalk();
    this.logger?.info(chalk.blue('🔍 分析專案部署需求...'));
    return await this.services.deploymentPipeline.analyzeDeploymentRequirements(projectPath);
  }

  /**
   * 💡 推薦部署策略
   */
  async recommendDeploymentStrategy(analysis, config) {
    if (!chalk) chalk = await loadChalk();
    this.logger?.info(chalk.blue('💡 生成部署策略建議...'));
    
    // 使用智能部署管道生成策略
    const pipelineStrategy = await this.services.deploymentPipeline.generateDeploymentStrategy(analysis, config);
    
    // 使用多雲管理器推薦平台
    const platformRecommendation = await this.services.multiCloudManager.recommendPlatform({
      projectType: analysis.projectType,
      expectedTraffic: config.expectedTraffic || 'medium',
      budget: config.budget || 'medium',
      region: config.region || 'global',
      services: config.services || []
    });
    
    return {
      pipeline: pipelineStrategy,
      platform: platformRecommendation,
      containerOptimization: analysis.buildRequirements?.docker ? 'recommended' : 'optional'
    };
  }

  /**
   * ⚙️ 執行部署
   */
  async executeDeployment(projectPath, recommendation, config) {
    if (!chalk) chalk = await loadChalk();
    this.logger?.info(chalk.blue('⚙️ 執行部署流程...'));
    
    let result = {};
    
    // 如果需要容器優化，先進行容器優化
    if (recommendation.containerOptimization === 'recommended') {
      result.containerOptimization = await this.optimizeContainer(projectPath, config);
    }
    
    // 根據推薦的平台執行部署
    const topPlatform = recommendation.platform.recommendations?.[0];
    
    if (topPlatform?.platformId === 'zeabur') {
      result.deployment = await this.services.zeaburDeploy.deploy(projectPath, config);
    } else if (topPlatform?.platformId && this.services.multiCloudManager) {
      result.deployment = await this.services.multiCloudManager.deployToPlatform(
        topPlatform.platformId, 
        { ...config, projectPath }
      );
    } else {
      // 使用智能部署管道作為後備
      result.deployment = await this.services.deploymentPipeline.deploy(projectPath, config);
    }
    
    return result;
  }

  /**
   * 🐳 容器優化
   */
  async optimizeContainer(projectPath, config) {
    if (!this.services.containerOptimizer) {
      throw new Error('ContainerOptimizer 服務未載入');
    }
    
    if (!chalk) chalk = await loadChalk();
    this.logger?.info(chalk.blue('🐳 執行容器優化...'));
    
    const result = {};
    
    // 生成優化的 Dockerfile
    result.dockerfile = await this.services.containerOptimizer.generateDockerfile({
      projectType: config.projectType || 'web',
      language: config.language || 'nodejs',
      framework: config.framework,
      port: config.port || 3000,
      buildCommand: config.buildCommand,
      startCommand: config.startCommand
    });
    
    // 如果需要 Kubernetes 配置
    if (config.kubernetes) {
      result.kubernetes = await this.services.containerOptimizer.generateKubernetesYAML({
        appName: config.appName || 'app',
        image: config.image || 'app:latest',
        port: config.port || 3000,
        replicas: config.replicas || 3,
        resources: config.resources || {}
      });
    }
    
    this.statistics.containerOptimizations++;
    return result;
  }

  /**
   * 🔄 執行回滾
   */
  async rollback(deploymentId, reason = '手動回滾') {
    if (!chalk) chalk = await loadChalk();
    this.logger?.info(chalk.yellow('🔄 執行部署回滾...'));
    
    try {
      // 使用智能部署管道的回滾功能
      const result = await this.services.deploymentPipeline.rollback(deploymentId, reason);
      
      this.logger?.info(chalk.green('✅ 回滾完成'));
      return result;
      
    } catch (error) {
      console.error(chalk.red('❌ 回滾失敗:'), error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 🌍 多雲平台管理
   */
  async getMultiCloudStatus() {
    if (!this.services.multiCloudManager) {
      return { error: 'MultiCloudManager 服務未載入' };
    }
    
    const status = this.services.multiCloudManager.getMultiCloudStatus();
    
    // 更新配置狀態
    status.configuredPlatforms = this.configuredPlatforms.size;
    status.supportedPlatforms = this.supportedPlatforms.length;
    status.zeaburStatus = this.configuredPlatforms.has('zeabur') ? '✅ 已配置 (付費會員)' : '❌ 未配置';
    
    return status;
  }

  /**
   * 💰 成本比較
   */
  async comparePlatformCosts(requirements) {
    if (!this.services.multiCloudManager) {
      return { error: 'MultiCloudManager 服務未載入' };
    }
    
    return await this.services.multiCloudManager.comparePlatformCosts(requirements);
  }

  /**
   * 🐳 取得容器優化統計
   */
  getContainerOptimizationStats() {
    if (!this.services.containerOptimizer) {
      return { error: 'ContainerOptimizer 服務未載入' };
    }
    
    return this.services.containerOptimizer.getOptimizationStats();
  }

  /**
   * 📊 更新統計數據
   */
  updateStatistics(result, duration) {
    this.statistics.totalDeployments++;
    
    if (result.deployment?.success) {
      this.statistics.successfulDeployments++;
    } else {
      this.statistics.failedDeployments++;
    }
    
    // 更新平均部署時間
    const totalSuccessful = this.statistics.successfulDeployments;
    if (totalSuccessful > 0) {
      this.statistics.averageDeployTime = 
        (this.statistics.averageDeployTime * (totalSuccessful - 1) + duration) / totalSuccessful;
    }
    
    this.statistics.lastActivity = new Date().toISOString();
  }

  /**
   * 🏥 健康檢查
   */
  async healthCheck() {
    const results = {
      overall: 'healthy',
      services: {},
      timestamp: new Date().toISOString()
    };
    
    let healthyCount = 0;
    const totalServices = Object.keys(this.services).length;
    
    for (const [serviceName, service] of Object.entries(this.services)) {
      try {
        // 檢查服務是否有健康檢查方法
        if (typeof service.healthCheck === 'function') {
          const serviceHealth = await service.healthCheck();
          results.services[serviceName] = {
            status: 'healthy',
            details: serviceHealth,
            lastCheck: new Date().toISOString()
          };
        } else {
          // 簡單檢查服務是否存在
          results.services[serviceName] = {
            status: service ? 'healthy' : 'unhealthy',
            details: '服務已載入',
            lastCheck: new Date().toISOString()
          };
        }
        
        if (results.services[serviceName].status === 'healthy') {
          healthyCount++;
        }
        
      } catch (error) {
        results.services[serviceName] = {
          status: 'unhealthy',
          error: error.message,
          lastCheck: new Date().toISOString()
        };
      }
    }
    
    // 設定整體健康狀態
    if (healthyCount === totalServices) {
      results.overall = 'healthy';
    } else if (healthyCount > totalServices / 2) {
      results.overall = 'degraded';
    } else {
      results.overall = 'unhealthy';
    }
    
    return results;
  }

  /**
   * 📊 獲取統計資訊
   */
  getStatistics() {
    const successRate = this.statistics.totalDeployments > 0 
      ? (this.statistics.successfulDeployments / this.statistics.totalDeployments * 100).toFixed(1)
      : 0;
    
    return {
      ...this.statistics,
      successRate: `${successRate}%`,
      averageDeployTime: `${Math.round(this.statistics.averageDeployTime / 1000)}s`,
      servicesLoaded: Object.keys(this.services).length,
      totalPlatforms: this.supportedPlatforms.length,
      configuredPlatforms: this.configuredPlatforms.size,
      zeaburConfigured: this.configuredPlatforms.has('zeabur'),
      primaryPlatform: this.configuredPlatforms.has('zeabur') ? 'Zeabur (付費會員)' : '無'
    };
  }

  /**
   * ℹ️ 獲取服務資訊
   */
  getServiceInfo() {
    return {
      name: '部署統合服務 (安全雲端版)',
      description: '多雲部署、容器化、管道自動化統一管理 - 移除中國服務，優先 Zeabur',
      version: '1.1.0',
      priority: 2,
      integratedServices: [
        '🐳 ContainerOptimizer - 容器優化和 Docker/K8s 管理',
        '🚀 ZeaburDeployService - Zeabur 自動化部署 (您的付費會員平台)',
        '⚙️ SmartDeploymentPipeline - 智能部署管道',
        '🌍 MultiCloudManager - 安全多雲平台管理 (已移除中國服務)'
      ],
      supportedPlatforms: this.supportedPlatforms,
      configuredPlatforms: Array.from(this.configuredPlatforms),
      capabilities: [
        '智能部署策略生成',
        '安全多雲平台支援 (無中國服務)',
        'Zeabur 優先部署',
        '容器化優化',
        '自動回滾機制',
        '成本比較分析',
        '健康監控'
      ],
      security: {
        chineseServicesRemoved: true,
        zeaburPriority: true,
        secureCloudOnly: true
      },
      statistics: this.getStatistics(),
      status: 'active'
    };
  }
}

module.exports = DeploymentUnified;

// 如果直接執行此檔案
if (require.main === module) {
  (async () => {
    chalk = await loadChalk();
    
    const service = new DeploymentUnified({
      debug: true
    });
    
    this.logger?.info(chalk.yellow('🔧 部署統合服務 測試模式'));
    this.logger?.info(service.getServiceInfo());
  })();
}
