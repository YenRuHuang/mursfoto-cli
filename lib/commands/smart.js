const { Command } = require('commander');
const chalk = require('chalk');
const inquirer = require('inquirer');
const GitHubAutomation = require('../services/GitHubAutomation');
const ErrorMemorySystem = require('../services/ErrorMemorySystem');
const N8nTemplateService = require('../services/N8nTemplateService');
const { logger, showBanner } = require('../utils/helpers');

class SmartCommands {
  constructor() {
    this.github = new GitHubAutomation();
    this.errorMemory = new ErrorMemorySystem();
    this.n8nService = new N8nTemplateService();
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
  async errorMemoryCommand(action, options) {
    try {
      showBanner('智能錯誤記憶系統');
      
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
      
    } catch (error) {
      logger.error('錯誤記憶操作失敗:', error.message);
    }
  }

  /**
   * 顯示錯誤統計
   */
  async showErrorStatistics() {
    try {
      const stats = await this.errorMemory.getErrorStatistics();
      
      if (!stats) {
        logger.info('📊 暫無錯誤統計數據');
        return;
      }

      logger.info('📊 錯誤統計報告');
      logger.info('─'.repeat(50));
      logger.info(`總錯誤數: ${stats.totalErrors}`);
      logger.info(`已解決: ${stats.resolvedErrors} (${Math.round(stats.resolvedErrors/stats.totalErrors*100)}%)`);
      logger.info(`未解決: ${stats.unresolvedErrors} (${Math.round(stats.unresolvedErrors/stats.totalErrors*100)}%)`);
      logger.info(`總解決方案: ${stats.totalSolutions}`);
      logger.info(`成功方案: ${stats.successfulSolutions}`);
      
      logger.info('\n🔝 最常見錯誤:');
      Object.entries(stats.mostCommonErrors)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([error, count]) => {
          logger.info(`  • ${error}: ${count}次`);
        });
      
      logger.info('\n📋 按命令統計:');
      Object.entries(stats.errorsByCommand)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([command, count]) => {
          logger.info(`  • ${command}: ${count}次`);
        });
        
    } catch (error) {
      logger.error('統計顯示失敗:', error.message);
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
}

module.exports = SmartCommands;
