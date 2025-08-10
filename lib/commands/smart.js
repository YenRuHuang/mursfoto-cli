const { Command } = require('commander');
const chalk = require('chalk');
const inquirer = require('inquirer');
const GitHubAutomation = require('../services/GitHubAutomation');
const ErrorMemorySystem = require('../services/ErrorMemorySystem');
const AICodeGenerator = require('../services/AICodeGenerator');
const SmartTestAutomation = require('../services/SmartTestAutomation');
const SmartDeploymentPipeline = require('../services/SmartDeploymentPipeline');
const N8nTemplateService = require('../services/N8nTemplateService');
const AdvancedTemplateManager = require('../services/AdvancedTemplateManager');
const PerformanceOptimizer = require('../services/PerformanceOptimizer');
const IntelligentLearningSystem = require('../services/IntelligentLearningSystem');

// Phase 3 新增服務
const MultiCloudManager = require('../services/MultiCloudManager');
const ContainerOptimizer = require('../services/ContainerOptimizer');
const CostAnalyzer = require('../services/CostAnalyzer');
const { validateProjectName } = require('../utils/helpers');

// 簡單的日誌工具
const logger = {
  info: (msg) => console.log(chalk.blue('ℹ'), msg),
  success: (msg) => console.log(chalk.green('✓'), msg),
  error: (msg) => console.log(chalk.red('✗'), msg),
  warn: (msg) => console.log(chalk.yellow('⚠'), msg)
};

// 顯示橫幅
function showBanner(title) {
  console.log(chalk.cyan.bold(`\n🚀 ${title}`));
  console.log(chalk.gray('─'.repeat(50)));
}

class SmartCommands {
  constructor() {
    this.github = new GitHubAutomation();
    this.errorMemory = new ErrorMemorySystem();
    this.n8nService = new N8nTemplateService();
    this.aiCodeGen = new AICodeGenerator();
    this.smartTest = new SmartTestAutomation();
    this.deployment = new SmartDeploymentPipeline();
    this.templateManager = new AdvancedTemplateManager();
    this.performanceOptimizer = new PerformanceOptimizer();
    this.learningSystem = null;  // 延遲初始化
    this.learningSystemInitialized = false;
    
    // Phase 3 新服務實例
    this.multiCloudManager = new MultiCloudManager();
    this.containerOptimizer = new ContainerOptimizer();
    this.costAnalyzer = new CostAnalyzer();
  }

  /**
   * 延遲初始化學習系統
   */
  initLearningSystemIfNeeded() {
    if (!this.learningSystem && process.env.MURSFOTO_QUICK_MODE !== 'true') {
      this.learningSystem = new IntelligentLearningSystem();
    }
  }

  /**
   * GitHub 自動化命令
   */
  async githubAutomate(action, options) {
    try {
      showBanner('GitHub 自動化');
      
      switch (action) {
        case 'create-repo':
          await this.createRepositoryInteractive(options);
          break;
          
        case 'auto-setup':
          await this.autoSetupProject(options);
          break;
          
        case 'create-pr':
          await this.createPullRequestInteractive(options);
          break;
          
        case 'create-release':
          await this.createReleaseInteractive(options);
          break;
          
        default:
          logger.info('📋 可用的 GitHub 自動化操作:');
          logger.info('  • create-repo - 創建新倉庫');
          logger.info('  • auto-setup - 自動化項目設置');
          logger.info('  • create-pr - 創建 Pull Request');
          logger.info('  • create-release - 創建 Release');
      }
      
    } catch (error) {
      await this.errorMemory.recordError({
        command: `mursfoto smart github ${action}`,
        error,
        context: { action, options }
      });
      logger.error('GitHub 自動化操作失敗:', error.message);
    }
  }

  /**
   * 互動式創建倉庫
   */
  async createRepositoryInteractive(options) {
    try {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: '📝 倉庫名稱:',
          default: options.name,
          validate: (input) => input.trim() !== '' || '請輸入倉庫名稱'
        },
        {
          type: 'input',
          name: 'description',
          message: '📋 倉庫描述:',
          default: options.description
        },
        {
          type: 'confirm',
          name: 'private',
          message: '🔒 是否為私有倉庫?',
          default: false
        },
        {
          type: 'list',
          name: 'template',
          message: '📋 選擇模板:',
          choices: [
            { name: '無模板', value: null },
            { name: '最小化模板', value: 'minimal' },
            { name: '計算器模板', value: 'calculator' },
            { name: 'API 服務模板', value: 'api-service' }
          ]
        }
      ]);

      logger.info('🔄 創建 GitHub 倉庫...');
      const repo = await this.github.createRepository(answers);
      
      logger.success(`✅ 倉庫創建成功: ${repo.html_url}`);
      
      // 詢問是否進行完整的自動化設置
      const setupAnswer = await inquirer.prompt([{
        type: 'confirm',
        name: 'autoSetup',
        message: '🚀 是否進行完整的自動化項目設置?',
        default: true
      }]);
      
      if (setupAnswer.autoSetup) {
        await this.github.automateProjectSetup(answers.name, answers.template, {
          createInitialRelease: true
        });
      }
      
    } catch (error) {
      logger.error('倉庫創建失敗:', error.message);
      throw error;
    }
  }

  /**
   * 自動化項目設置
   */
  async autoSetupProject(options) {
    try {
      const projectName = options.name || await this.promptForProjectName();
      const template = options.template || await this.promptForTemplate();
      
      logger.info(`🚀 開始自動化項目設置: ${projectName}`);
      
      const repo = await this.github.automateProjectSetup(projectName, template, {
        createInitialRelease: options.release !== false,
        setupCiCd: options.cicd !== false,
        enableMonitoring: options.monitoring !== false
      });
      
      logger.success('🎉 自動化項目設置完成!');
      logger.info(`📍 倉庫地址: ${repo.html_url}`);
      
    } catch (error) {
      logger.error('自動化設置失敗:', error.message);
      throw error;
    }
  }

  /**
   * 錯誤記憶系統命令
   */
  async errorMemoryCommand(action, options = {}) {
    showBanner('智能錯誤記憶系統');
    
    // 確保 options 是對象
    if (!options || typeof options !== 'object') {
      options = {};
    }
    
    try {      
      switch (action) {
        case 'stats':
          await this.showErrorStatistics();
          break;
          
        case 'search':
          await this.searchErrors(options.query);
          break;
          
        case 'clean':
          await this.cleanupErrors(options.days);
          break;
          
        case 'export':
          await this.exportErrorMemory(options.file);
          break;
          
        default:
          logger.info('📋 可用的錯誤記憶操作:');
          logger.info('  • stats - 查看錯誤統計');
          logger.info('  • search <query> - 搜尋錯誤');
          logger.info('  • clean [days] - 清理舊錯誤');
          logger.info('  • export [file] - 導出錯誤記憶');
      }
      
    } catch (err) {
      // 強化的安全錯誤處理
      const safeErrorInfo = this.createSafeErrorInfo(err, action, options);
      
      // stats 操作直接顯示錯誤，不嘗試記錄
      if (action === 'stats') {
        logger.error('錯誤統計顯示失敗:', safeErrorInfo.message);
        return;
      }
      
      // 其他操作嘗試記錄錯誤
      logger.error('錯誤記憶操作失敗:', safeErrorInfo.message);
      
      // 安全地嘗試記錄錯誤
      this.safeRecordError(safeErrorInfo);
    }
  }

  /**
   * 顯示錯誤統計
   */
  async showErrorStatistics() {
    try {
      // 防禦性檢查 errorMemory 是否存在
      if (!this.errorMemory || typeof this.errorMemory.getErrorStatistics !== 'function') {
        logger.error('錯誤記憶系統未正確初始化');
        return;
      }

      const stats = await this.errorMemory.getErrorStatistics();
      
      if (!stats || typeof stats !== 'object') {
        logger.info('📊 暫無錯誤統計數據');
        return;
      }

      logger.info('📊 錯誤統計報告');
      logger.info('─'.repeat(50));
      
      // 安全顯示統計數據
      const totalErrors = stats.totalErrors || 0;
      const resolvedErrors = stats.resolvedErrors || 0;
      const unresolvedErrors = stats.unresolvedErrors || 0;
      const totalSolutions = stats.totalSolutions || 0;
      const successfulSolutions = stats.successfulSolutions || 0;
      
      logger.info(`總錯誤數: ${totalErrors}`);
      
      if (totalErrors > 0) {
        const resolvedPercentage = Math.round((resolvedErrors / totalErrors) * 100);
        const unresolvedPercentage = Math.round((unresolvedErrors / totalErrors) * 100);
        logger.info(`已解決: ${resolvedErrors} (${resolvedPercentage}%)`);
        logger.info(`未解決: ${unresolvedErrors} (${unresolvedPercentage}%)`);
      } else {
        logger.info('已解決: 0 (0%)');
        logger.info('未解決: 0 (0%)');
      }
      
      logger.info(`總解決方案: ${totalSolutions}`);
      logger.info(`成功方案: ${successfulSolutions}`);
      
      // 安全顯示最常見錯誤
      if (stats.mostCommonErrors && typeof stats.mostCommonErrors === 'object') {
        logger.info('\n🔝 最常見錯誤:');
        try {
          Object.entries(stats.mostCommonErrors)
            .sort(([,a], [,b]) => (b || 0) - (a || 0))
            .slice(0, 5)
            .forEach(([error, count]) => {
              logger.info(`  • ${error || 'Unknown'}: ${count || 0}次`);
            });
        } catch (sortError) {
          logger.info('  • 無法顯示最常見錯誤');
        }
      } else {
        logger.info('\n🔝 最常見錯誤: 暫無數據');
      }
      
      // 安全顯示按命令統計
      if (stats.errorsByCommand && typeof stats.errorsByCommand === 'object') {
        logger.info('\n📋 按命令統計:');
        try {
          Object.entries(stats.errorsByCommand)
            .sort(([,a], [,b]) => (b || 0) - (a || 0))
            .slice(0, 5)
            .forEach(([command, count]) => {
              logger.info(`  • ${command || 'Unknown'}: ${count || 0}次`);
            });
        } catch (sortError) {
          logger.info('  • 無法顯示命令統計');
        }
      } else {
        logger.info('\n📋 按命令統計: 暫無數據');
      }
        
    } catch (error) {
      const safeErrorMessage = error?.message || 'Unknown error in showErrorStatistics';
      logger.error('統計顯示失敗:', safeErrorMessage);
      
      // 提供基本的錯誤信息
      logger.info('\n📊 錯誤統計系統遇到問題');
      logger.info('🔧 建議嘗試重新初始化錯誤記憶系統');
    }
  }

  /**
   * n8n 模板命令
   */
  async n8nCommand(action, options) {
    try {
      showBanner('n8n 自動化模板');
      
      switch (action) {
        case 'list':
          await this.n8nService.listAvailableTemplates();
          break;
          
        case 'search':
          const results = await this.n8nService.searchTemplates(options.query, options.category);
          this.displayN8nTemplates(results);
          break;
          
        case 'create':
          await this.createN8nProjectInteractive(options);
          break;
          
        default:
          logger.info('📋 可用的 n8n 操作:');
          logger.info('  • list - 列出所有模板');
          logger.info('  • search <query> - 搜尋模板');  
          logger.info('  • create - 創建 n8n 項目');
      }
      
    } catch (error) {
      await this.errorMemory.recordError({
        command: `mursfoto smart n8n ${action}`,
        error,
        context: { action, options }
      });
      logger.error('n8n 操作失敗:', error.message);
    }
  }

  /**
   * AI 代碼生成命令
   */
  async aiCodeGenerate(action, options) {
    try {
      showBanner('AI 代碼生成器');
      
      switch (action) {
        case 'component':
          await this.generateComponentInteractive(options);
          break;
          
        case 'api':
          await this.generateApiInteractive(options);
          break;
          
        case 'test':
          await this.generateTestInteractive(options);
          break;
          
        case 'optimize':
          await this.optimizeCodeInteractive(options);
          break;
          
        default:
          logger.info('📋 可用的 AI 代碼生成操作:');
          logger.info('  • component - 生成組件代碼');
          logger.info('  • api - 生成 API 端點');
          logger.info('  • test - 生成測試案例');
          logger.info('  • optimize - 代碼優化建議');
      }
      
    } catch (error) {
      // 確保錯誤對象有效
      const safeError = error || new Error('Unknown error in AI code generation');
      
      await this.errorMemory.recordError({
        command: `mursfoto smart ai ${action}`,
        error: safeError,
        context: { action, options }
      });
      logger.error('AI 代碼生成失敗:', safeError.message || 'Unknown error');
    }
  }

  /**
   * 智能測試自動化命令
   */
  async smartTestCommand(action, options) {
    try {
      showBanner('智能測試自動化');
      
      switch (action) {
        case 'generate':
          await this.generateTestsInteractive(options);
          break;
          
        case 'run':
          await this.runSmartTests(options);
          break;
          
        case 'coverage':
          await this.analyzeCoverage(options);
          break;
          
        case 'performance':
          await this.runPerformanceTests(options);
          break;
          
        default:
          logger.info('📋 可用的智能測試操作:');
          logger.info('  • generate - 生成測試案例');
          logger.info('  • run - 運行智能測試');
          logger.info('  • coverage - 分析測試覆蓋率');
          logger.info('  • performance - 效能測試');
      }
      
    } catch (error) {
      await this.errorMemory.recordError({
        command: `mursfoto smart test ${action}`,
        error,
        context: { action, options }
      });
      logger.error('智能測試操作失敗:', error.message);
    }
  }

  /**
   * 智能部署管道命令
   */
  async deploymentCommand(action, options) {
    showBanner('智能部署管道');
    
    try {
      switch (action) {
        case 'setup':
          await this.setupDeploymentPipeline(options);
          break;
          
        case 'deploy':
          await this.smartDeploy(options);
          break;
          
        case 'rollback':
          await this.smartRollback(options);
          break;
          
        case 'monitor':
          await this.monitorDeployment(options);
          break;
          
        default:
          logger.info('📋 可用的智能部署操作:');
          logger.info('  • setup - 設置部署管道');
          logger.info('  • deploy - 智能部署');
          logger.info('  • rollback - 智能回滾');
          logger.info('  • monitor - 部署監控');
      }
      
    } catch (error) {
      // 安全的錯誤處理
      const errorMessage = error && error.message ? error.message : 'Unknown error in deploymentCommand';
      logger.error('智能部署操作失敗:', errorMessage);
      
      // 靜默嘗試記錄錯誤，不影響主流程
      setTimeout(async () => {
        try {
          if (this.errorMemory && typeof this.errorMemory.recordError === 'function') {
            await this.errorMemory.recordError({
              command: `mursfoto smart deploy ${action}`,
              error: error || new Error(errorMessage),
              context: { action, options }
            });
          }
        } catch (recordError) {
          // 完全忽略記錄錯誤的失敗
        }
      }, 0);
    }
  }

  /**
   * 進階模板管理命令
   */
  async templateCommand(action, options) {
    try {
      showBanner('進階模板管理');
      
      switch (action) {
        case 'recommend':
          await this.recommendTemplate(options);
          break;
          
        case 'create':
          await this.createCustomTemplate(options);
          break;
          
        case 'share':
          await this.shareTemplate(options);
          break;
          
        case 'marketplace':
          await this.browseTemplateMarketplace(options);
          break;
          
        default:
          logger.info('📋 可用的進階模板操作:');
          logger.info('  • recommend - 智能模板推薦');
          logger.info('  • create - 創建自定義模板');
          logger.info('  • share - 分享模板');
          logger.info('  • marketplace - 模板市場');
      }
      
    } catch (error) {
      await this.errorMemory.recordError({
        command: `mursfoto smart template ${action}`,
        error,
        context: { action, options }
      });
      logger.error('進階模板操作失敗:', error.message);
    }
  }

  /**
   * 效能優化命令
   */
  async optimizeCommand(action, options) {
    try {
      showBanner('效能監控與優化');
      
      switch (action) {
        case 'analyze':
          await this.analyzePerformance(options);
          break;
          
        case 'optimize':
          await this.optimizePerformance(options);
          break;
          
        case 'monitor':
          await this.setupMonitoring(options);
          break;
          
        case 'report':
          await this.generatePerformanceReport(options);
          break;
          
        default:
          logger.info('📋 可用的效能優化操作:');
          logger.info('  • analyze - 效能分析');
          logger.info('  • optimize - 自動優化');
          logger.info('  • monitor - 設置監控');
          logger.info('  • report - 效能報告');
      }
      
    } catch (error) {
      await this.errorMemory.recordError({
        command: `mursfoto smart optimize ${action}`,
        error,
        context: { action, options }
      });
      logger.error('效能優化操作失敗:', error.message);
    }
  }

  /**
   * 智能學習系統命令 - Phase 2 新功能
   */
  async learningCommand(action, options = {}) {
    try {
      showBanner('🧠 智能學習和決策系統 - Phase 2');
      
      switch (action) {
        case 'stats':
          await this.showLearningStatistics();
          break;
          
        case 'suggestions':
          await this.showIntelligentSuggestions(options);
          break;
          
        case 'report':
          await this.exportLearningReport(options.file);
          break;
          
        case 'reset':
          await this.resetLearningSystem();
          break;
          
        case 'record':
          await this.recordCommandManually(options);
          break;
          
        default:
          logger.info('📋 可用的智能學習操作:');
          logger.info('  • stats - 查看學習統計');
          logger.info('  • suggestions - 獲取智能建議');
          logger.info('  • report [file] - 導出學習報告');
          logger.info('  • reset - 重置學習數據');
          logger.info('  • record - 手動記錄命令');
      }
      
    } catch (error) {
      await this.errorMemory.recordError({
        command: `mursfoto smart learn ${action}`,
        error,
        context: { action, options }
      });
      logger.error('智能學習操作失敗:', error.message);
    }
  }

  /**
   * 顯示學習統計
   */
  async showLearningStatistics() {
    try {
      // 在快速模式下跳過學習系統初始化
      if (process.env.MURSFOTO_QUICK_MODE === 'true') {
        logger.info('📊 快速模式 - 跳過學習統計');
        return;
      }
      
      this.initLearningSystemIfNeeded();
      if (!this.learningSystem) {
        logger.info('📊 學習系統未初始化，無統計數據');
        return;
      }
      
      const stats = this.learningSystem.getLearningStatistics();
      
      logger.info('📊 智能學習系統統計');
      logger.info('─'.repeat(50));
      logger.info(`總命令數: ${stats.totalCommands}`);
      logger.info(`唯一命令: ${stats.uniqueCommands}`);
      logger.info(`平均成功率: ${stats.averageSuccessRate}%`);
      logger.info(`學習置信度: ${stats.learningConfidence}%`);
      logger.info(`工作流程模式: ${stats.workflowPatterns}`);
      logger.info(`本次會話命令: ${stats.sessionCommands}`);
      logger.info(`會話時長: ${stats.sessionDuration} 分鐘`);
      
      if (stats.mostUsedCommands.length > 0) {
        logger.info('\n🔥 最常用命令:');
        stats.mostUsedCommands.forEach((cmd, index) => {
          logger.info(`  ${index + 1}. ${chalk.cyan(cmd.command)} - ${cmd.count}次 (${cmd.successRate}% 成功率)`);
        });
      }
      
    } catch (error) {
      logger.error('學習統計顯示失敗:', error.message);
    }
  }

  /**
   * 確保學習系統已初始化
   */
  async ensureLearningSystemInitialized() {
    if (!this.learningSystemInitialized) {
      // 強制等待學習系統初始化完成
      await this.learningSystem.init();
      this.learningSystemInitialized = true;
    }
  }

  /**
   * 顯示智能建議
   */
  async showIntelligentSuggestions(options) {
    try {
      // 確保學習系統已完全初始化
      await this.ensureLearningSystemInitialized();
      
      const context = {
        projectType: options.projectType,
        ...options
      };
      
      const suggestions = await this.learningSystem.getIntelligentSuggestions(context);
      
      if (suggestions.length === 0) {
        logger.info('💡 暫無智能建議，請繼續使用 CLI 工具以收集更多數據');
        return;
      }
      
      logger.info('💡 智能建議和優化');
      logger.info('─'.repeat(50));
      
      suggestions.forEach((suggestion, index) => {
        logger.info(`${index + 1}. ${suggestion.title}`);
        logger.info(`   💬 ${suggestion.content}`);
        if (suggestion.action) {
          logger.info(`   🎯 ${chalk.dim(suggestion.action)}`);
        }
        logger.info('');
      });
      
    } catch (error) {
      logger.error('智能建議獲取失敗:', error.message);
    }
  }

  /**
   * 導出學習報告
   */
  async exportLearningReport(filePath) {
    try {
      const reportPath = filePath || `mursfoto_learning_report_${Date.now()}.json`;
      const report = await this.learningSystem.exportLearningReport(reportPath);
      
      logger.success(`📊 學習報告已導出: ${reportPath}`);
      logger.info(`📈 包含統計數據: ${report.statistics.totalCommands} 個命令`);
      logger.info(`🎯 智能建議: ${report.suggestions.length} 個`);
      logger.info(`💡 洞察報告: ${report.insights.length} 個`);
      
      // 顯示報告摘要
      if (report.insights.length > 0) {
        logger.info('\n🔍 關鍵洞察:');
        report.insights.slice(0, 3).forEach(insight => {
          logger.info(`  • ${insight.title}: ${insight.content}`);
        });
      }
      
    } catch (error) {
      logger.error('學習報告導出失敗:', error.message);
    }
  }

  /**
   * 重置學習系統
   */
  async resetLearningSystem() {
    try {
      const confirm = await inquirer.prompt([{
        type: 'confirm',
        name: 'reset',
        message: '⚠️  確定要重置所有學習數據？此操作不可逆！',
        default: false
      }]);
      
      if (confirm.reset) {
        await this.learningSystem.resetLearningData();
        logger.success('🔄 學習系統已重置，將重新開始學習您的使用模式');
      } else {
        logger.info('❌ 重置操作已取消');
      }
      
    } catch (error) {
      logger.error('學習系統重置失敗:', error.message);
    }
  }

  /**
   * 手動記錄命令
   */
  async recordCommandManually(options) {
    try {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'command',
          message: '📝 命令名稱:',
          validate: input => input.trim() !== '' || '請輸入命令名稱'
        },
        {
          type: 'confirm',
          name: 'success',
          message: '✅ 命令執行成功?',
          default: true
        },
        {
          type: 'number',
          name: 'duration',
          message: '⏱️ 執行時間 (毫秒):',
          default: 0
        }
      ]);
      
      await this.learningSystem.recordCommand({
        command: answers.command,
        success: answers.success,
        duration: answers.duration,
        context: options
      });
      
      logger.success('📚 命令已記錄到學習系統');
      
    } catch (error) {
      logger.error('手動記錄命令失敗:', error.message);
    }
  }

  // AI 組件生成實現
  async generateComponentInteractive(options) {
    try {
      let config = {};
      
      // 如果沒有提供選項，進行互動式詢問
      if (!options.description) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'description',
            message: '📝 描述要生成的組件:',
            validate: input => input.trim() !== '' || '請描述組件功能'
          },
          {
            type: 'list',
            name: 'type',
            message: '🎯 組件類型:',
            choices: ['component', 'api', 'test', 'optimize'],
            default: 'component'
          },
          {
            type: 'list',
            name: 'language',
            message: '💻 程式語言:',
            choices: ['javascript', 'typescript', 'python', 'java'],
            default: 'javascript'
          },
          {
            type: 'list',
            name: 'framework',
            message: '🚀 框架:',
            choices: (answers) => {
              const frameworks = {
                javascript: ['react', 'vue', 'vanilla'],
                typescript: ['react', 'vue', 'angular'],
                python: ['fastapi', 'django', 'flask'],
                java: ['spring', 'none']
              };
              return frameworks[answers.language] || ['none'];
            },
            default: 'react'
          }
        ]);
        config = { ...options, ...answers };
      } else {
        config = options;
      }
      
      logger.info('🤖 正在使用 AI 生成組件...');
      
      // 使用 AICodeGenerator 進行生成
      const result = await this.aiCodeGen.generateComponent({
        description: config.description,
        type: config.type || 'component',
        language: config.language || 'javascript',
        framework: config.framework || 'react',
        file: config.file
      });
      
      if (result.success) {
        logger.success('✅ 組件生成成功!');
        logger.info('📋 生成結果:');
        logger.info(`   📁 文件: ${result.filename}`);
        logger.info(`   📊 行數: ${result.linesOfCode}`);
        logger.info(`   🤖 使用模型: ${result.model}`);
        
        if (result.suggestions && result.suggestions.length > 0) {
          logger.info('💡 優化建議:');
          result.suggestions.forEach((suggestion, index) => {
            logger.info(`   ${index + 1}. ${suggestion}`);
          });
        }
        
        // 詢問是否保存
        const saveAnswer = await inquirer.prompt([{
          type: 'confirm',
          name: 'save',
          message: '💾 是否保存生成的組件?',
          default: true
        }]);
        
        if (saveAnswer.save) {
          const fs = require('fs').promises;
          const path = require('path');
          const filename = result.filename || `generated-component.${config.language === 'typescript' ? 'tsx' : 'jsx'}`;
          
          await fs.writeFile(filename, result.code);
          logger.success(`📁 組件已保存到: ${filename}`);
        }
        
        // 顯示生成的代碼片段（前10行）
        const codeLines = result.code.split('\n');
        if (codeLines.length > 0) {
          logger.info('\n📝 生成代碼預覽:');
          logger.info('─'.repeat(50));
          codeLines.slice(0, Math.min(10, codeLines.length)).forEach((line, index) => {
            logger.info(`${(index + 1).toString().padStart(2, ' ')}  ${line}`);
          });
          if (codeLines.length > 10) {
            logger.info('...');
            logger.info(`   (共 ${codeLines.length} 行)`);
          }
        }
        
      } else {
        logger.error('❌ 組件生成失敗:', result.error || '未知錯誤');
        
        // 提供備用方案
        logger.info('💡 建議檢查:');
        logger.info('   • AI 模型是否正常運行');
        logger.info('   • 網路連接是否正常');
        logger.info('   • 描述是否足夠清楚');
      }
      
    } catch (error) {
      logger.error('AI 組件生成失敗:', error.message);
      
      // 提供手動模板作為備用方案
      const fallbackAnswer = await inquirer.prompt([{
        type: 'confirm',
        name: 'useFallback',
        message: '🔄 是否使用基礎模板作為備用方案?',
        default: true
      }]);
      
      if (fallbackAnswer.useFallback) {
        await this.generateBasicTemplate(config);
      }
    }
  }

  async generateApiInteractive(options) {
    try {
      let config = {};
      
      if (!options.description) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'description',
            message: '📝 描述要生成的 API:',
            validate: input => input.trim() !== '' || '請描述 API 功能'
          },
          {
            type: 'list',
            name: 'method',
            message: '🔗 HTTP 方法:',
            choices: ['GET', 'POST', 'PUT', 'DELETE'],
            default: 'GET'
          },
          {
            type: 'input',
            name: 'endpoint',
            message: '🎯 API 端點路徑:',
            default: '/api/data'
          },
          {
            type: 'list',
            name: 'framework',
            message: '🚀 後端框架:',
            choices: ['express', 'fastapi', 'spring', 'django'],
            default: 'express'
          }
        ]);
        config = { ...options, ...answers };
      } else {
        config = options;
      }
      
      logger.info('🤖 正在生成 API 端點...');
      
      const result = await this.aiCodeGen.generateApi({
        description: config.description,
        method: config.method || 'GET',
        endpoint: config.endpoint || '/api/data',
        framework: config.framework || 'express'
      });
      
      if (result.success) {
        logger.success('✅ API 端點生成成功!');
        logger.info(`📋 生成了 ${config.method} ${config.endpoint} 端點`);
        
        // 顯示生成的代碼
        logger.info('\n📝 生成的 API 代碼:');
        logger.info('─'.repeat(50));
        console.log(result.code);
        
      } else {
        // 備用 API 模板
        await this.generateBasicApiTemplate(config);
      }
      
    } catch (error) {
      logger.error('API 生成失敗:', error.message);
      await this.generateBasicApiTemplate(config);
    }
  }

  async generateTestsInteractive(options) {
    try {
      let config = {};
      
      if (!options.file) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'file',
            message: '📁 要測試的文件路徑:',
            validate: input => input.trim() !== '' || '請指定要測試的文件'
          },
          {
            type: 'list',
            name: 'testType',
            message: '🧪 測試類型:',
            choices: ['unit', 'integration', 'e2e'],
            default: 'unit'
          },
          {
            type: 'list',
            name: 'framework',
            message: '🛠️  測試框架:',
            choices: ['jest', 'mocha', 'pytest', 'junit'],
            default: 'jest'
          }
        ]);
        config = { ...options, ...answers };
      } else {
        config = options;
      }
      
      logger.info('🤖 正在分析代碼並生成測試...');
      
      const result = await this.smartTest.generateTests({
        filePath: config.file,
        testType: config.testType || 'unit',
        framework: config.framework || 'jest'
      });
      
      if (result.success) {
        logger.success('✅ 測試案例生成成功!');
        logger.info(`📋 生成了 ${result.testCount} 個測試案例`);
        logger.info(`📁 測試文件: ${result.testFile}`);
        
      } else {
        await this.generateBasicTestTemplate(config);
      }
      
    } catch (error) {
      logger.error('測試生成失敗:', error.message);
      await this.generateBasicTestTemplate(config);
    }
  }

  async smartDeploy(options) {
    try {
      showBanner('智能部署系統');
      
      let config = {};
      
      if (!options.platform) {
        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'platform',
            message: '🌍 選擇部署平台:',
            choices: ['vercel', 'netlify', 'aws', 'azure', 'gcp'],
            default: 'vercel'
          },
          {
            type: 'list',
            name: 'strategy',
            message: '🚀 部署策略:',
            choices: ['blue-green', 'rolling', 'canary'],
            default: 'rolling'
          },
          {
            type: 'confirm',
            name: 'autoRollback',
            message: '🔄 啟用自動回滾?',
            default: true
          }
        ]);
        config = { ...options, ...answers };
      } else {
        config = options;
      }
      
      logger.info(`🚀 開始部署到 ${config.platform}...`);
      
      const result = await this.deployment.deploy({
        platform: config.platform,
        strategy: config.strategy || 'rolling',
        autoRollback: config.autoRollback !== false
      });
      
      if (result.success) {
        logger.success('✅ 部署成功!');
        logger.info(`🌐 部署 URL: ${result.url}`);
        logger.info(`📊 部署 ID: ${result.deploymentId}`);
        
      } else {
        logger.error(`❌ 部署失敗: ${result.error}`);
        
        if (config.autoRollback && result.canRollback) {
          const rollbackAnswer = await inquirer.prompt([{
            type: 'confirm',
            name: 'rollback',
            message: '🔄 是否執行回滾?',
            default: true
          }]);
          
          if (rollbackAnswer.rollback) {
            await this.deployment.rollback(result.previousDeploymentId);
          }
        }
      }
      
    } catch (error) {
      logger.error('智能部署失敗:', error.message);
    }
  }

  async recommendTemplate(options) {
    try {
      let projectInfo = {};
      
      if (!options.projectType) {
        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'projectType',
            message: '📋 專案類型:',
            choices: ['web', 'api', 'mobile', 'desktop', 'cli'],
            default: 'web'
          },
          {
            type: 'checkbox',
            name: 'features',
            message: '⚙️ 需要的功能:',
            choices: ['authentication', 'database', 'api', 'testing', 'deployment'],
            default: ['api']
          },
          {
            type: 'list',
            name: 'team_size',
            message: '👥 團隊規模:',
            choices: ['solo', 'small', 'medium', 'large'],
            default: 'small'
          }
        ]);
        projectInfo = { ...options, ...answers };
      } else {
        projectInfo = options;
      }
      
      logger.info('🤖 分析專案需求並推薦模板...');
      
      const result = await this.templateManager.recommendTemplate(projectInfo);
      
      if (result.success && result.recommendations.length > 0) {
        logger.success('✅ 找到適合的模板推薦!');
        logger.info('📋 推薦的模板:');
        logger.info('─'.repeat(50));
        
        result.recommendations.forEach((template, index) => {
          logger.info(`${index + 1}. ${chalk.cyan(template.name)} (匹配度: ${template.score}%)`);
          logger.info(`   📝 ${template.description}`);
          logger.info(`   🛠️  技術棧: ${template.techStack.join(', ')}`);
          logger.info(`   💡 適合原因: ${template.reason}`);
          logger.info('');
        });
        
        // 詢問是否使用推薦的模板
        const useTemplate = await inquirer.prompt([{
          type: 'list',
          name: 'selected',
          message: '🎯 選擇要使用的模板:',
          choices: [
            ...result.recommendations.map((t, i) => ({ name: t.name, value: i })),
            { name: '取消', value: -1 }
          ]
        }]);
        
        if (useTemplate.selected >= 0) {
          const selectedTemplate = result.recommendations[useTemplate.selected];
          logger.info(`🚀 正在應用模板: ${selectedTemplate.name}...`);
          // 這裡可以實際應用模板
        }
        
      } else {
        logger.info('💡 基於您的需求，建議使用以下基礎模板:');
        this.showBasicTemplateRecommendations(projectInfo);
      }
      
    } catch (error) {
      logger.error('模板推薦失敗:', error.message);
      this.showBasicTemplateRecommendations(options);
    }
  }

  async analyzePerformance(options) {
    try {
      let config = {};
      
      if (!options.target) {
        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'target',
            message: '🎯 分析目標:',
            choices: ['current-project', 'url', 'file'],
            default: 'current-project'
          },
          {
            type: 'input',
            name: 'path',
            message: '📍 目標路徑或 URL:',
            when: (answers) => answers.target !== 'current-project',
            validate: input => input.trim() !== '' || '請輸入有效的路徑或 URL'
          },
          {
            type: 'checkbox',
            name: 'metrics',
            message: '📊 要分析的指標:',
            choices: ['loading-speed', 'bundle-size', 'memory-usage', 'cpu-usage'],
            default: ['loading-speed', 'bundle-size']
          }
        ]);
        config = { ...options, ...answers };
      } else {
        config = options;
      }
      
      logger.info('📊 正在進行效能分析...');
      
      const result = await this.performanceOptimizer.analyzePerformance({
        target: config.target || 'current-project',
        path: config.path,
        metrics: config.metrics || ['loading-speed', 'bundle-size']
      });
      
      if (result.success) {
        logger.success('✅ 效能分析完成!');
        logger.info('📋 分析結果:');
        logger.info('─'.repeat(50));
        
        if (result.metrics.loadingSpeed) {
          logger.info(`⚡ 載入速度: ${result.metrics.loadingSpeed}ms`);
        }
        if (result.metrics.bundleSize) {
          logger.info(`📦 Bundle 大小: ${result.metrics.bundleSize}KB`);
        }
        if (result.metrics.memoryUsage) {
          logger.info(`🧠 記憶體使用: ${result.metrics.memoryUsage}MB`);
        }
        
        if (result.recommendations && result.recommendations.length > 0) {
          logger.info('\n💡 優化建議:');
          result.recommendations.forEach((rec, index) => {
            logger.info(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
            logger.info(`   📝 ${rec.description}`);
            if (rec.potentialImprovement) {
              logger.info(`   📈 預期改善: ${rec.potentialImprovement}`);
            }
            logger.info('');
          });
        }
        
      } else {
        logger.error(`❌ 效能分析失敗: ${result.error}`);
        this.showBasicPerformanceTips();
      }
      
    } catch (error) {
      logger.error('效能分析失敗:', error.message);
      this.showBasicPerformanceTips();
    }
  }

  /**
   * 互動式創建 n8n 項目
   */
  async createN8nProjectInteractive(options) {
    try {
      // 獲取可用模板
      const templates = await this.n8nService.fetchCommunityTemplates();
      
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: '📝 項目名稱:',
          default: options.name,
          validate: (input) => input.trim() !== '' || '請輸入項目名稱'
        },
        {
          type: 'list',
          name: 'template',
          message: '📋 選擇 n8n 模板:',
          choices: templates.map(t => ({
            name: `${t.name} - ${t.description}`,
            value: t.id
          }))
        },
        {
          type: 'confirm',
          name: 'createRepo',
          message: '🐙 是否同時創建 GitHub 倉庫?',
          default: true
        }
      ]);

      // 創建 n8n 項目
      const result = await this.n8nService.createN8nProject(
        answers.projectName, 
        answers.template
      );
      
      logger.success(`✅ n8n 項目創建成功: ${result.projectPath}`);
      
      // 可選：創建 GitHub 倉庫
      if (answers.createRepo) {
        logger.info('🔄 創建 GitHub 倉庫...');
        try {
          await this.github.createRepository({
            name: answers.projectName,
            description: `${result.template.description} - n8n 自動化項目`,
            template: null // n8n 項目有自己的結構
          });
        } catch (error) {
          logger.warn('⚠️  GitHub 倉庫創建失敗，但本地項目已創建');
        }
      }
      
      // 顯示下一步操作
      logger.info('\n🚀 下一步操作:');
      result.nextSteps.forEach((step, index) => {
        logger.info(`${index + 1}. ${step}`);
      });
      
    } catch (error) {
      logger.error('n8n 項目創建失敗:', error.message);
      throw error;
    }
  }

  /**
   * 顯示 n8n 模板
   */
  displayN8nTemplates(templates) {
    if (templates.length === 0) {
      logger.info('🔍 未找到匹配的模板');
      return;
    }

    logger.info(`🔍 找到 ${templates.length} 個模板:`);
    templates.forEach((template, index) => {
      logger.info(`${index + 1}. ${chalk.cyan(template.name)}`);
      logger.info(`   📋 ${template.description}`);
      logger.info(`   🏷️  類別: ${template.category}`);
      logger.info(`   🆔 ID: ${chalk.dim(template.id)}`);
      logger.info('');
    });
  }

  /**
   * 清理錯誤記錄
   */
  async cleanupErrors(days = 30) {
    try {
      const cleanedCount = await this.errorMemory.cleanupOldErrors(days);
      logger.success(`🧹 清理了 ${cleanedCount} 個舊錯誤記錄 (${days} 天前)`);
      
    } catch (error) {
      logger.error('錯誤記錄清理失敗:', error.message);
    }
  }

  /**
   * 導出錯誤記憶
   */
  async exportErrorMemory(filePath) {
    try {
      const exportPath = filePath || `error_memory_export_${Date.now()}.json`;
      const data = await this.errorMemory.exportMemory(exportPath);
      
      logger.success(`📤 錯誤記憶已導出: ${exportPath}`);
      logger.info(`📊 包含 ${data.errors.length} 個錯誤和 ${data.solutions.length} 個解決方案`);
      
    } catch (error) {
      logger.error('錯誤記憶導出失敗:', error.message);
    }
  }

  /**
   * 多雲平台管理命令 - Phase 3
   */
  async multiCloudCommand(action, options = {}) {
    try {
      showBanner('🌍 多雲平台管理 - Phase 3');
      
      switch (action) {
        case 'list':
          await this.listCloudPlatforms();
          break;
          
        case 'configure':
          await this.configureCloudPlatform(options);
          break;
          
        case 'recommend':
          await this.recommendCloudPlatform(options);
          break;
          
        case 'deploy':
          await this.deployToCloud(options);
          break;
          
        case 'compare':
          await this.compareCloudCosts(options);
          break;
          
        case 'status':
          await this.showMultiCloudStatus();
          break;
          
        default:
          logger.info('📋 可用的多雲平台操作:');
          logger.info('  • list - 列出支援的雲平台');
          logger.info('  • configure - 配置雲平台');
          logger.info('  • recommend - 智能平台推薦');
          logger.info('  • deploy - 部署到指定平台');
          logger.info('  • compare - 成本比較');
          logger.info('  • status - 多雲狀態概覽');
      }
      
    } catch (error) {
      await this.errorMemory.recordError({
        command: `mursfoto smart cloud ${action}`,
        error,
        context: { action, options }
      });
      logger.error('多雲平台操作失敗:', error.message);
    }
  }

  /**
   * 容器優化命令 - Phase 3
   */
  async containerCommand(action, options = {}) {
    try {
      showBanner('🐳 容器優化服務 - Phase 3');
      
      switch (action) {
        case 'dockerfile':
          await this.generateDockerfileInteractive(options);
          break;
          
        case 'k8s':
          await this.generateKubernetesInteractive(options);
          break;
          
        case 'analyze':
          await this.analyzeContainerOptimization(options);
          break;
          
        case 'optimize':
          await this.optimizeContainerImages(options);
          break;
          
        case 'security':
          await this.scanContainerSecurity(options);
          break;
          
        case 'stats':
          await this.showContainerStats();
          break;
          
        default:
          logger.info('📋 可用的容器優化操作:');
          logger.info('  • dockerfile - 生成優化的 Dockerfile');
          logger.info('  • k8s - 生成 Kubernetes YAML');
          logger.info('  • analyze - 容器分析');
          logger.info('  • optimize - 映像優化');
          logger.info('  • security - 安全掃描');
          logger.info('  • stats - 優化統計');
      }
      
    } catch (error) {
      await this.errorMemory.recordError({
        command: `mursfoto smart container ${action}`,
        error,
        context: { action, options }
      });
      logger.error('容器優化操作失敗:', error.message);
    }
  }

  /**
   * 成本分析命令 - Phase 3
   */
  async costCommand(action, options = {}) {
    try {
      showBanner('💰 成本分析服務 - Phase 3');
      
      switch (action) {
        case 'analyze':
          await this.analyzeCostsInteractive(options);
          break;
          
        case 'compare':
          await this.comparePlatformCostsInteractive(options);
          break;
          
        case 'predict':
          await this.predictCostTrends(options);
          break;
          
        case 'optimize':
          await this.getCostOptimizations(options);
          break;
          
        case 'alert':
          await this.setBudgetAlertInteractive(options);
          break;
          
        case 'report':
          await this.generateCostReport(options);
          break;
          
        default:
          logger.info('📋 可用的成本分析操作:');
          logger.info('  • analyze - 分析專案成本');
          logger.info('  • compare - 平台成本比較');
          logger.info('  • predict - 成本趨勢預測');
          logger.info('  • optimize - 成本優化建議');
          logger.info('  • alert - 設置預算警報');
          logger.info('  • report - 生成成本報告');
      }
      
    } catch (error) {
      await this.errorMemory.recordError({
        command: `mursfoto smart cost ${action}`,
        error,
        context: { action, options }
      });
      logger.error('成本分析操作失敗:', error.message);
    }
  }

  // Phase 3 實現方法

  /**
   * 列出支援的雲平台
   */
  async listCloudPlatforms() {
    const platforms = this.multiCloudManager.getSupportedPlatforms();
    
    logger.info('🌍 支援的雲平台:');
    logger.info('─'.repeat(50));
    
    platforms.forEach((platform, index) => {
      // 使用 configured 而不是 initialized
      const status = platform.configured ? '✅ 已配置' : '⚙️  未配置';
      const successRate = platform.successRate > 0 ? ` (${platform.successRate}% 成功率)` : '';
      
      logger.info(`${index + 1}. ${chalk.cyan(platform.name)} ${status}${successRate}`);
      logger.info(`   🛠️  服務: ${platform.services.join(', ')}`);
      logger.info('');
    });
  }

  /**
   * 配置雲平台
   */
  async configureCloudPlatform(options) {
    const platforms = this.multiCloudManager.getSupportedPlatforms();
    
    if (options.platform) {
      await this.configureSinglePlatform(options.platform);
      return;
    }
    
    const answer = await inquirer.prompt([{
      type: 'list',
      name: 'platform',
      message: '🌍 選擇要配置的雲平台:',
      choices: platforms.map(p => ({
        name: `${p.name} ${p.initialized ? '(已配置)' : ''}`,
        value: p.id
      }))
    }]);
    
    await this.configureSinglePlatform(answer.platform);
  }

  /**
   * 配置單個平台
   */
  async configureSinglePlatform(platformId) {
    // 這裡應該根據不同平台要求不同的配置
    const configQuestions = this.getPlatformConfigQuestions(platformId);
    
    if (configQuestions.length === 0) {
      logger.info(`💡 ${platformId} 平台無需額外配置`);
      return;
    }
    
    const config = await inquirer.prompt(configQuestions);
    
    logger.info(`🔧 配置 ${platformId} 平台...`);
    const result = await this.multiCloudManager.configurePlatform(platformId, config);
    
    if (result.success) {
      logger.success(`✅ ${result.platform} 配置成功`);
    } else {
      logger.error(`❌ 配置失敗: ${result.error}`);
    }
  }

  /**
   * 獲取平台配置問題
   */
  getPlatformConfigQuestions(platformId) {
    const questions = {
      aws: [
        { type: 'input', name: 'accessKeyId', message: 'AWS Access Key ID:' },
        { type: 'password', name: 'secretAccessKey', message: 'AWS Secret Access Key:' },
        { type: 'input', name: 'region', message: 'AWS Region:', default: 'us-west-2' }
      ],
      azure: [
        { type: 'input', name: 'subscriptionId', message: 'Azure Subscription ID:' },
        { type: 'input', name: 'clientId', message: 'Azure Client ID:' },
        { type: 'password', name: 'clientSecret', message: 'Azure Client Secret:' },
        { type: 'input', name: 'tenantId', message: 'Azure Tenant ID:' }
      ],
      gcp: [
        { type: 'input', name: 'projectId', message: 'GCP Project ID:' },
        { type: 'input', name: 'keyFilename', message: 'Service Account Key File Path:' }
      ],
      digitalocean: [
        { type: 'password', name: 'token', message: 'DigitalOcean API Token:' }
      ],
      vercel: [
        { type: 'password', name: 'token', message: 'Vercel API Token:' }
      ]
    };
    
    return questions[platformId] || [];
  }

  /**
   * 智能平台推薦
   */
  async recommendCloudPlatform(options) {
    const requirements = await inquirer.prompt([
      {
        type: 'list',
        name: 'projectType',
        message: '📋 專案類型:',
        choices: ['web', 'api', 'mobile', 'data', 'ai']
      },
      {
        type: 'list',
        name: 'expectedTraffic',
        message: '📊 預期流量:',
        choices: ['low', 'medium', 'high']
      },
      {
        type: 'list',
        name: 'budget',
        message: '💰 預算範圍:',
        choices: ['low', 'medium', 'high']
      },
      {
        type: 'input',
        name: 'region',
        message: '🌍 主要地區:',
        default: 'global'
      }
    ]);
    
    logger.info('🤖 分析最佳平台推薦...');
    const result = await this.multiCloudManager.recommendPlatform(requirements);
    
    if (result.success) {
      logger.info('💡 智能平台推薦:');
      logger.info('─'.repeat(50));
      
      result.recommendations.forEach((rec, index) => {
        logger.info(`${index + 1}. ${chalk.cyan(rec.name)} (評分: ${rec.score}/100)`);
        logger.info(`   💰 預估成本: $${rec.estimatedCost.monthly}/月`);
        logger.info(`   💡 推薦理由:`);
        rec.reasons.forEach(reason => {
          logger.info(`      • ${reason}`);
        });
        logger.info('');
      });
    } else {
      logger.error(`推薦分析失敗: ${result.error}`);
    }
  }

  /**
   * 生成 Dockerfile
   */
  async generateDockerfileInteractive(options) {
    const config = await inquirer.prompt([
      {
        type: 'list',
        name: 'language',
        message: '💻 選擇程式語言:',
        choices: ['nodejs', 'python', 'java', 'go']
      },
      {
        type: 'list',
        name: 'framework',
        message: '🚀 選擇框架:',
        choices: (answers) => {
          const frameworks = {
            nodejs: ['express', 'react', 'nextjs'],
            python: ['fastapi', 'django', 'flask'],
            java: ['spring', 'quarkus'],
            go: ['gin', 'fiber']
          };
          return frameworks[answers.language] || ['none'];
        }
      },
      {
        type: 'number',
        name: 'port',
        message: '🚪 應用端口:',
        default: 3000
      }
    ]);
    
    logger.info('📝 生成優化的 Dockerfile...');
    const result = await this.containerOptimizer.generateDockerfile(config);
    
    if (result.success) {
      logger.success('✅ Dockerfile 生成成功');
      logger.info('📊 分析結果:');
      logger.info(`   🎯 優化評分: ${result.analysis.score}/100`);
      logger.info(`   📏 預估大小: ${result.analysis.estimatedSize}MB`);
      
      if (result.recommendations.length > 0) {
        logger.info('💡 優化建議:');
        result.recommendations.forEach(rec => {
          logger.info(`   • [${rec.priority.toUpperCase()}] ${rec.description}`);
        });
      }
      
      // 詢問是否保存到文件
      const saveAnswer = await inquirer.prompt([{
        type: 'confirm',
        name: 'save',
        message: '💾 是否保存 Dockerfile?',
        default: true
      }]);
      
      if (saveAnswer.save) {
        const fs = require('fs').promises;
        await fs.writeFile('./Dockerfile', result.dockerfile);
        logger.success('📁 Dockerfile 已保存到當前目錄');
      }
    } else {
      logger.error(`Dockerfile 生成失敗: ${result.error}`);
    }
  }

  /**
   * 分析專案成本
   */
  async analyzeCostsInteractive(options) {
    const config = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'platforms',
        message: '🌍 選擇要分析的平台:',
        choices: ['aws', 'azure', 'gcp', 'digitalocean', 'vercel'],
        default: ['aws', 'azure', 'gcp']
      },
      {
        type: 'number',
        name: 'vcpu',
        message: '💻 所需 vCPU:',
        default: 2
      },
      {
        type: 'number',
        name: 'memory',
        message: '🧠 所需記憶體 (GB):',
        default: 4
      },
      {
        type: 'number',
        name: 'storage',
        message: '💾 所需存儲 (GB):',
        default: 20
      },
      {
        type: 'number',
        name: 'traffic',
        message: '🌐 月流量 (GB):',
        default: 100
      }
    ]);
    
    const projectConfig = {
      platforms: config.platforms,
      requirements: {
        compute_requirements: { vcpu: config.vcpu, memory: config.memory, hours: 730 },
        storage_requirements: { size_gb: config.storage, type: 'standard' },
        network_requirements: { data_transfer_gb: config.traffic }
      }
    };
    
    logger.info('💰 分析專案成本...');
    const result = await this.costAnalyzer.analyzeProjectCosts(projectConfig);
    
    if (result.success) {
      const analysis = result.analysis;
      
      logger.info('📊 成本分析報告:');
      logger.info('─'.repeat(50));
      
      // 顯示各平台成本
      analysis.platforms.forEach(platform => {
        logger.info(`🌍 ${platform.platform.toUpperCase()}: $${platform.total_cost}/月`);
        logger.info(`   💻 計算: $${platform.breakdown.compute?.cost || 0}`);
        logger.info(`   💾 存儲: $${platform.breakdown.storage?.cost || 0}`);
        logger.info(`   🌐 網路: $${platform.breakdown.network?.cost || 0}`);
        logger.info('');
      });
      
      // 顯示比較結果
      if (analysis.comparison.cheapest) {
        logger.info('🏆 成本比較:');
        logger.info(`   🥇 最便宜: ${analysis.comparison.cheapest}`);
        logger.info(`   💸 最昂貴: ${analysis.comparison.most_expensive}`);
        logger.info(`   💰 可節省: ${analysis.comparison.savings_potential}%`);
        logger.info('');
      }
      
      // 顯示優化建議
      if (analysis.recommendations.length > 0) {
        logger.info('💡 成本優化建議:');
        analysis.recommendations.forEach((rec, index) => {
          logger.info(`${index + 1}. ${rec.name} (節省 $${rec.potential_monthly_savings}/月)`);
          logger.info(`   📋 ${rec.description}`);
          logger.info(`   🎯 優先級: ${rec.priority.toUpperCase()}`);
          logger.info('');
        });
      }
      
      logger.info(`💡 總節省潛力: $${analysis.totalSavingsPotential}/月`);
      
    } else {
      logger.error(`成本分析失敗: ${result.error}`);
    }
  }

  /**
   * 多雲狀態概覽
   */
  async showMultiCloudStatus() {
    const status = this.multiCloudManager.getMultiCloudStatus();
    
    logger.info('📊 多雲平台狀態概覽:');
    logger.info('─'.repeat(50));
    logger.info(`總平台數: ${status.totalPlatforms}`);
    logger.info(`已配置: ${status.configuredPlatforms}`);
    logger.info(`平均成功率: ${status.averageSuccessRate}%`);
    logger.info(`最後活動: ${status.lastActivity ? new Date(status.lastActivity).toLocaleString() : '無'}`);
    logger.info('');
    
    logger.info('🌍 平台詳情:');
    status.platforms.forEach(platform => {
      const statusIcon = platform.initialized ? '✅' : '⚙️';
      logger.info(`${statusIcon} ${platform.name}:`);
      logger.info(`   📊 成功率: ${platform.successRate}%`);
      logger.info(`   🛠️  服務數: ${platform.servicesCount}`);
      logger.info(`   ⏰ 最後使用: ${platform.lastUsed ? new Date(platform.lastUsed).toLocaleString() : '從未使用'}`);
      logger.info('');
    });
  }

  /**
   * 容器統計
   */
  async showContainerStats() {
    const stats = this.containerOptimizer.getOptimizationStats();
    
    logger.info('📊 容器優化統計:');
    logger.info('─'.repeat(50));
    logger.info(`優化規則: ${stats.totalRules}`);
    logger.info(`安全檢查: ${stats.securityChecks}`);
    logger.info(`支援平台: ${stats.supportedPlatforms.join(', ')}`);
    logger.info(`最後更新: ${new Date(stats.lastUpdate).toLocaleString()}`);
  }

  /**
   * 創建安全的錯誤信息對象
   */
  createSafeErrorInfo(err, action, options) {
    try {
      return {
        command: `mursfoto smart error ${action || 'unknown'}`,
        error: err,
        context: { 
          action: action || 'unknown', 
          options: options || {},
          timestamp: new Date().toISOString()
        },
        message: err?.message || String(err) || 'Unknown error occurred'
      };
    } catch (createError) {
      return {
        command: 'mursfoto smart error unknown',
        error: new Error('Error info creation failed'),
        context: { action: 'unknown', options: {} },
        message: 'Failed to create error information'
      };
    }
  }

  /**
   * 安全地記錄錯誤，不影響主流程
   */
  safeRecordError(errorInfo) {
    setTimeout(async () => {
      try {
        if (this.errorMemory && typeof this.errorMemory.recordError === 'function') {
          await this.errorMemory.recordError(errorInfo);
        }
      } catch (recordError) {
        // 完全忽略記錄錯誤的失敗，避免無限循環
      }
    }, 0);
  }

  /**
   * 輔助函數
   */
  async promptForProjectName() {
    const answer = await inquirer.prompt([{
      type: 'input',
      name: 'name',
      message: '📝 項目名稱:',
      validate: (input) => input.trim() !== '' || '請輸入項目名稱'
    }]);
    return answer.name;
  }

  async promptForTemplate() {
    const answer = await inquirer.prompt([{
      type: 'list',
      name: 'template',
      message: '📋 選擇模板:',
      choices: [
        { name: '最小化模板', value: 'minimal' },
        { name: '計算器模板', value: 'calculator' },
        { name: 'API 服務模板', value: 'api-service' }
      ]
    }]);
    return answer.template;
  }

  /**
   * 生成基礎模板作為備用方案
   */
  async generateBasicTemplate(config) {
    try {
      const templates = {
        react: {
          javascript: `import React from 'react';

const ${this.toPascalCase(config.description || 'Component')} = () => {
  return (
    <div className="${this.toKebabCase(config.description || 'component')}">
      <h2>${config.description || 'Generated Component'}</h2>
      <p>This is a basic ${config.description || 'component'} template.</p>
    </div>
  );
};

export default ${this.toPascalCase(config.description || 'Component')};`,
          typescript: `import React from 'react';

interface ${this.toPascalCase(config.description || 'Component')}Props {
  // Add your props here
}

const ${this.toPascalCase(config.description || 'Component')}: React.FC<${this.toPascalCase(config.description || 'Component')}Props> = () => {
  return (
    <div className="${this.toKebabCase(config.description || 'component')}">
      <h2>${config.description || 'Generated Component'}</h2>
      <p>This is a basic ${config.description || 'component'} template.</p>
    </div>
  );
};

export default ${this.toPascalCase(config.description || 'Component')};`
        }
      };
      
      const framework = config.framework || 'react';
      const language = config.language || 'javascript';
      const template = templates[framework]?.[language] || templates.react.javascript;
      
      const filename = `${this.toKebabCase(config.description || 'component')}.${language === 'typescript' ? 'tsx' : 'jsx'}`;
      
      const fs = require('fs').promises;
      await fs.writeFile(filename, template);
      
      logger.success(`✅ 基礎模板已生成: ${filename}`);
      logger.info('📝 您可以基於此模板進行客製化修改');
      
    } catch (error) {
      logger.error('基礎模板生成失敗:', error.message);
    }
  }

  // 輔助工具方法
  toPascalCase(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return word.toUpperCase();
    }).replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
  }

  toKebabCase(str) {
    return str.replace(/[^a-zA-Z0-9]/g, ' ')
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase();
  }

  toCamelCase(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
  }

  // 備用方案方法
  async generateBasicApiTemplate(config) {
    const templates = {
      express: `// Express API endpoint
const express = require('express');
const router = express.Router();

// ${config.description}
router.${config.method.toLowerCase()}('${config.endpoint}', async (req, res) => {
  try {
    // TODO: Implement ${config.description}
    res.json({
      message: 'API endpoint for ${config.description}',
      method: '${config.method}',
      endpoint: '${config.endpoint}'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;`,
      fastapi: `# FastAPI endpoint
from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.${config.method.toLowerCase()}("${config.endpoint}")
async def ${this.toCamelCase(config.description)}():
    """${config.description}"""
    try:
        # TODO: Implement ${config.description}
        return {
            "message": "API endpoint for ${config.description}",
            "method": "${config.method}",
            "endpoint": "${config.endpoint}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))`
    };

    const template = templates[config.framework] || templates.express;
    const filename = `${this.toKebabCase(config.description)}-api.${config.framework === 'fastapi' ? 'py' : 'js'}`;
    
    try {
      const fs = require('fs').promises;
      await fs.writeFile(filename, template);
      logger.success(`✅ 基礎 API 模板已生成: ${filename}`);
    } catch (error) {
      logger.error('基礎 API 模板生成失敗:', error.message);
    }
  }

  async generateBasicTestTemplate(config) {
    const templates = {
      jest: `// Jest test for ${config.file}
const { ${this.toPascalCase(config.file)} } = require('./${config.file}');

describe('${this.toPascalCase(config.file)}', () => {
  test('should work correctly', () => {
    // TODO: Add test cases
    expect(true).toBe(true);
  });

  test('should handle edge cases', () => {
    // TODO: Add edge case tests
    expect(true).toBe(true);
  });
});`
    };

    const template = templates[config.framework] || templates.jest;
    const filename = `${this.toKebabCase(config.file)}.test.js`;
    
    try {
      const fs = require('fs').promises;
      await fs.writeFile(filename, template);
      logger.success(`✅ 基礎測試模板已生成: ${filename}`);
    } catch (error) {
      logger.error('基礎測試模板生成失敗:', error.message);
    }
  }

  showBasicTemplateRecommendations(projectInfo) {
    logger.info('💡 基礎模板推薦:');
    logger.info('─'.repeat(30));
    
    const recommendations = {
      web: [
        '🌐 React + TypeScript',
        '🌐 Vue.js + JavaScript',
        '🌐 Next.js 全棧應用'
      ],
      api: [
        '🚀 Express.js REST API',
        '🚀 FastAPI Python API',
        '🚀 Spring Boot Java API'
      ],
      mobile: [
        '📱 React Native',
        '📱 Flutter',
        '📱 Ionic'
      ]
    };

    const typeRecs = recommendations[projectInfo.projectType] || recommendations.web;
    typeRecs.forEach((rec, index) => {
      logger.info(`${index + 1}. ${rec}`);
    });
  }

  showBasicPerformanceTips() {
    logger.info('💡 基礎效能優化建議:');
    logger.info('─'.repeat(30));
    logger.info('1. 🗜️  壓縮靜態資源');
    logger.info('2. 🔄 啟用快取機制');
    logger.info('3. 📦 優化 Bundle 大小');
    logger.info('4. 🖼️  壓縮圖片');
    logger.info('5. 🚀 使用 CDN');
  }
}

module.exports = SmartCommands;
