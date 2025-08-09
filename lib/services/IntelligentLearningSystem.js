const fs = require('fs-extra');
const path = require('path');
const { EventEmitter } = require('events');

/**
 * 🧠 Mursfoto AutoDev Factory 2.0 - 智能學習和決策系統
 * 
 * 階段 2 核心功能：
 * - 用戶行為模式學習
 * - 智能決策引擎
 * - 個性化工作流程優化
 * - 預測性建議系統
 */
class IntelligentLearningSystem extends EventEmitter {
  constructor() {
    super();
    this.dataPath = path.join(process.cwd(), '.mursfoto', 'learning');
    this.userBehaviorFile = path.join(this.dataPath, 'user-behavior.json');
    this.decisionModelFile = path.join(this.dataPath, 'decision-model.json');
    this.preferencesFile = path.join(this.dataPath, 'user-preferences.json');
    
    // 學習數據結構
    this.userBehavior = {
      commands: {},           // 命令使用頻率和模式
      preferences: {},        // 用戶偏好設置
      workPatterns: {},       // 工作模式分析
      errorPatterns: {},      // 錯誤模式學習
      successPatterns: {},    // 成功模式學習
      timePatterns: {},       // 時間使用模式
      projectTypes: {},       // 專案類型偏好
      deploymentPrefs: {}     // 部署偏好
    };
    
    // 決策模型
    this.decisionModel = {
      templateRecommendations: {},  // 模板推薦權重
      workflowOptimization: {},     // 工作流程優化規則
      errorPrevention: {},          // 錯誤預防策略
      resourceOptimization: {},     // 資源優化建議
      learningConfidence: 0.0       // 學習置信度
    };
    
    // 實時學習緩存
    this.sessionData = {
      currentSession: Date.now(),
      commands: [],
      context: {},
      startTime: Date.now()
    };
    
    this.init();
  }

  /**
   * 初始化學習系統
   */
  async init() {
    try {
      await fs.ensureDir(this.dataPath);
      await this.loadLearningData();
      this.startSessionTracking();
      console.log('🧠 智能學習系統已初始化');
    } catch (error) {
      console.error('學習系統初始化失敗:', error);
    }
  }

  /**
   * 載入學習數據
   */
  async loadLearningData() {
    try {
      // 載入用戶行為數據
      if (await fs.pathExists(this.userBehaviorFile)) {
        const data = await fs.readJson(this.userBehaviorFile);
        this.userBehavior = { ...this.userBehavior, ...data };
      }
      
      // 載入決策模型
      if (await fs.pathExists(this.decisionModelFile)) {
        const data = await fs.readJson(this.decisionModelFile);
        this.decisionModel = { ...this.decisionModel, ...data };
      }
      
      console.log('📚 學習數據載入完成');
    } catch (error) {
      console.error('載入學習數據失敗:', error);
    }
  }

  /**
   * 保存學習數據
   */
  async saveLearningData() {
    try {
      await fs.writeJson(this.userBehaviorFile, this.userBehavior, { spaces: 2 });
      await fs.writeJson(this.decisionModelFile, this.decisionModel, { spaces: 2 });
      
      // 發出學習更新事件
      this.emit('learningUpdated', {
        timestamp: Date.now(),
        confidence: this.decisionModel.learningConfidence
      });
    } catch (error) {
      console.error('保存學習數據失敗:', error);
    }
  }

  /**
   * 開始會話追蹤
   */
  startSessionTracking() {
    // 定期保存會話數據
    this.saveInterval = setInterval(() => {
      this.processSessionData();
    }, 30000); // 每30秒處理一次
    
    // 進程退出時保存數據
    process.on('exit', () => this.endSession());
    process.on('SIGINT', () => this.endSession());
    process.on('SIGTERM', () => this.endSession());
  }

  /**
   * 記錄命令執行
   */
  async recordCommand(commandData) {
    const {
      command,
      args = [],
      success = true,
      duration = 0,
      context = {},
      error = null
    } = commandData;

    // 記錄到當前會話
    this.sessionData.commands.push({
      command,
      args,
      success,
      duration,
      context,
      error,
      timestamp: Date.now()
    });

    // 更新命令統計
    if (!this.userBehavior.commands[command]) {
      this.userBehavior.commands[command] = {
        count: 0,
        totalDuration: 0,
        successRate: 1.0,
        failures: [],
        averageArgs: {},
        contexts: []
      };
    }

    const cmdStats = this.userBehavior.commands[command];
    cmdStats.count++;
    cmdStats.totalDuration += duration;
    
    // 計算成功率
    if (success) {
      cmdStats.successRate = (cmdStats.successRate * (cmdStats.count - 1) + 1) / cmdStats.count;
    } else {
      cmdStats.successRate = (cmdStats.successRate * (cmdStats.count - 1)) / cmdStats.count;
      cmdStats.failures.push({
        error: error ? error.message : 'Unknown error',
        timestamp: Date.now(),
        context
      });
    }

    // 分析參數使用模式
    args.forEach(arg => {
      if (!cmdStats.averageArgs[arg]) cmdStats.averageArgs[arg] = 0;
      cmdStats.averageArgs[arg]++;
    });

    // 記錄上下文
    cmdStats.contexts.push(context);
    if (cmdStats.contexts.length > 100) {
      cmdStats.contexts = cmdStats.contexts.slice(-50); // 保留最近50個
    }

    // 即時學習和決策更新
    await this.updateDecisionModel(command, success, context);
  }

  /**
   * 更新決策模型
   */
  async updateDecisionModel(command, success, context) {
    // 模板推薦權重更新
    if (command.includes('template') || command.includes('create')) {
      const projectType = this.extractProjectType(context);
      if (projectType) {
        if (!this.decisionModel.templateRecommendations[projectType]) {
          this.decisionModel.templateRecommendations[projectType] = {};
        }
        
        const template = context.template || 'default';
        if (!this.decisionModel.templateRecommendations[projectType][template]) {
          this.decisionModel.templateRecommendations[projectType][template] = { weight: 0, successes: 0, total: 0 };
        }
        
        const rec = this.decisionModel.templateRecommendations[projectType][template];
        rec.total++;
        if (success) rec.successes++;
        rec.weight = rec.successes / rec.total;
      }
    }

    // 工作流程優化
    await this.optimizeWorkflow(command, success, context);
    
    // 更新學習置信度
    this.updateLearningConfidence();
  }

  /**
   * 工作流程優化
   */
  async optimizeWorkflow(command, success, context) {
    const workflow = this.detectWorkflowPattern();
    
    if (workflow) {
      if (!this.decisionModel.workflowOptimization[workflow]) {
        this.decisionModel.workflowOptimization[workflow] = {
          steps: [],
          successRate: 0,
          optimizations: []
        };
      }
      
      const workflowData = this.decisionModel.workflowOptimization[workflow];
      workflowData.steps.push({ command, success, timestamp: Date.now() });
      
      // 分析工作流程模式並提供優化建議
      if (workflowData.steps.length >= 3) {
        const optimizations = this.generateWorkflowOptimizations(workflowData.steps);
        workflowData.optimizations = optimizations;
      }
    }
  }

  /**
   * 檢測工作流程模式
   */
  detectWorkflowPattern() {
    const recentCommands = this.sessionData.commands.slice(-5);
    
    if (recentCommands.length < 2) return null;
    
    // 常見工作流程模式
    const patterns = {
      'create-deploy': ['create', 'deploy'],
      'create-test-deploy': ['create', 'test', 'deploy'],
      'github-create-deploy': ['github', 'create', 'deploy'],
      'template-customize-deploy': ['template', 'create', 'deploy']
    };
    
    for (const [patternName, pattern] of Object.entries(patterns)) {
      if (this.matchesPattern(recentCommands, pattern)) {
        return patternName;
      }
    }
    
    return null;
  }

  /**
   * 匹配模式
   */
  matchesPattern(commands, pattern) {
    if (commands.length < pattern.length) return false;
    
    const recentCmds = commands.slice(-pattern.length);
    return pattern.every((patternCmd, index) => {
      return recentCmds[index].command.includes(patternCmd);
    });
  }

  /**
   * 生成工作流程優化建議
   */
  generateWorkflowOptimizations(steps) {
    const optimizations = [];
    
    // 檢測可以合併的步驟
    if (steps.some(s => s.command.includes('create')) && 
        steps.some(s => s.command.includes('deploy'))) {
      optimizations.push({
        type: 'workflow_merge',
        suggestion: '建議使用 `mursfoto smart create --auto-deploy` 來合併創建和部署步驟',
        potentialTimeSaving: '節省 30-60 秒'
      });
    }
    
    // 檢測錯誤模式
    const failures = steps.filter(s => !s.success);
    if (failures.length > 0) {
      optimizations.push({
        type: 'error_prevention',
        suggestion: '檢測到常見錯誤模式，建議先運行 `mursfoto doctor` 進行環境檢查',
        potentialTimeSaving: '避免重複錯誤'
      });
    }
    
    // 檢測重複命令
    const commandCounts = {};
    steps.forEach(s => {
      commandCounts[s.command] = (commandCounts[s.command] || 0) + 1;
    });
    
    Object.entries(commandCounts).forEach(([cmd, count]) => {
      if (count > 2) {
        optimizations.push({
          type: 'command_automation',
          suggestion: `檢測到 ${cmd} 命令重複使用 ${count} 次，建議創建自定義腳本或別名`,
          potentialTimeSaving: '提升重複任務效率'
        });
      }
    });
    
    return optimizations;
  }

  /**
   * 提取專案類型
   */
  extractProjectType(context) {
    if (context.template) return context.template;
    if (context.type) return context.type;
    if (context.framework) return context.framework;
    
    // 從命令參數推斷
    const args = context.args || [];
    if (args.includes('--api')) return 'api';
    if (args.includes('--frontend')) return 'frontend';
    if (args.includes('--fullstack')) return 'fullstack';
    
    return null;
  }

  /**
   * 更新學習置信度
   */
  updateLearningConfidence() {
    const commands = Object.values(this.userBehavior.commands);
    
    if (commands.length === 0) {
      this.decisionModel.learningConfidence = 0.5; // 50% 基礎置信度
      return;
    }
    
    const totalCommands = commands.reduce((sum, cmd) => sum + cmd.count, 0);
    
    // 更寬容的基礎置信度計算
    let confidence = 0.4 + Math.min(totalCommands / 50, 0.3); // 40-70% 基礎置信度
    
    // 計算平均成功率，避免除零錯誤
    const averageSuccessRate = commands.length > 0 
      ? commands.reduce((sum, cmd) => sum + cmd.successRate, 0) / commands.length
      : 0.8; // 預設 80% 成功率
    
    // 成功率加成，但不會讓置信度過低
    const successBonus = Math.max(averageSuccessRate * 0.3, 0.1);
    confidence += successBonus;
    
    // 確保置信度在合理範圍內
    confidence = Math.max(0.3, Math.min(confidence, 0.95));
    
    this.decisionModel.learningConfidence = Math.round(confidence * 100) / 100;
  }

  /**
   * 獲取智能建議
   */
  async getIntelligentSuggestions(context = {}) {
    const suggestions = [];
    
    // 基於使用模式的建議
    const mostUsedCommands = Object.entries(this.userBehavior.commands)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 3);
    
    if (mostUsedCommands.length > 0) {
      suggestions.push({
        type: 'usage_pattern',
        title: '🔥 常用命令快捷方式',
        content: `您最常使用: ${mostUsedCommands.map(([cmd]) => cmd).join(', ')}`,
        action: '建議設置命令別名以提升效率'
      });
    }
    
    // 工作流程優化建議
    const workflowOptimizations = Object.values(this.decisionModel.workflowOptimization)
      .flatMap(w => w.optimizations)
      .slice(0, 2);
    
    suggestions.push(...workflowOptimizations.map(opt => ({
      type: opt.type,
      title: '⚡ 工作流程優化',
      content: opt.suggestion,
      action: opt.potentialTimeSaving
    })));
    
    // 模板推薦
    if (context.projectType) {
      const templateRecs = this.decisionModel.templateRecommendations[context.projectType];
      if (templateRecs) {
        const bestTemplate = Object.entries(templateRecs)
          .sort(([,a], [,b]) => b.weight - a.weight)[0];
        
        if (bestTemplate) {
          suggestions.push({
            type: 'template_recommendation',
            title: '📋 智能模板推薦',
            content: `基於您的使用模式，推薦使用 ${bestTemplate[0]} 模板`,
            action: `成功率: ${Math.round(bestTemplate[1].weight * 100)}%`
          });
        }
      }
    }
    
    return suggestions;
  }

  /**
   * 獲取學習統計
   */
  getLearningStatistics() {
    const commands = Object.values(this.userBehavior.commands);
    const totalCommands = commands.reduce((sum, cmd) => sum + cmd.count, 0);
    
    // 更新學習置信度以確保最新值
    this.updateLearningConfidence();
    
    // 當沒有數據時，顯示合理的默認值
    if (commands.length === 0) {
      return {
        totalCommands: 0,
        uniqueCommands: 0,
        averageSuccessRate: 0, // 沒有數據時顯示 0%
        learningConfidence: 50, // 50% 基礎置信度
        workflowPatterns: 0,
        sessionCommands: 0,
        sessionDuration: Math.round((Date.now() - this.sessionData.startTime) / 60000),
        mostUsedCommands: []
      };
    }
    
    const averageSuccessRate = commands.reduce((sum, cmd) => sum + cmd.successRate, 0) / commands.length;
    
    return {
      totalCommands,
      uniqueCommands: Object.keys(this.userBehavior.commands).length,
      averageSuccessRate: Math.round(averageSuccessRate * 100), // 轉為百分比
      learningConfidence: Math.round(this.decisionModel.learningConfidence * 100), // 轉為百分比
      workflowPatterns: Object.keys(this.decisionModel.workflowOptimization).length,
      sessionCommands: this.sessionData.commands.length,
      sessionDuration: Math.round((Date.now() - this.sessionData.startTime) / 60000), // 轉為分鐘
      mostUsedCommands: Object.entries(this.userBehavior.commands)
        .sort(([,a], [,b]) => b.count - a.count)
        .slice(0, 5)
        .map(([cmd, data]) => ({ command: cmd, count: data.count, successRate: Math.round(data.successRate * 100) }))
    };
  }

  /**
   * 處理會話數據
   */
  async processSessionData() {
    if (this.sessionData.commands.length > 0) {
      // 分析會話模式
      await this.analyzeSessionPatterns();
      
      // 保存學習數據
      await this.saveLearningData();
      
      // 清空會話緩存（保留最近的命令）
      if (this.sessionData.commands.length > 20) {
        this.sessionData.commands = this.sessionData.commands.slice(-10);
      }
    }
  }

  /**
   * 分析會話模式
   */
  async analyzeSessionPatterns() {
    const commands = this.sessionData.commands;
    
    // 時間模式分析
    const timePattern = this.analyzeTimePatterns(commands);
    if (timePattern) {
      this.userBehavior.timePatterns[Date.now()] = timePattern;
    }
    
    // 錯誤模式分析
    const errorPattern = this.analyzeErrorPatterns(commands);
    if (errorPattern) {
      this.userBehavior.errorPatterns[Date.now()] = errorPattern;
    }
  }

  /**
   * 分析時間模式
   */
  analyzeTimePatterns(commands) {
    if (commands.length < 2) return null;
    
    const intervals = [];
    for (let i = 1; i < commands.length; i++) {
      intervals.push(commands[i].timestamp - commands[i-1].timestamp);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    
    return {
      averageInterval: avgInterval,
      commandsPerMinute: commands.length / ((Date.now() - commands[0].timestamp) / 60000),
      peakActivity: this.findPeakActivity(commands)
    };
  }

  /**
   * 尋找高峰活動時段
   */
  findPeakActivity(commands) {
    const hourCounts = {};
    
    commands.forEach(cmd => {
      const hour = new Date(cmd.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const peakHour = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)[0];
    
    return peakHour ? { hour: parseInt(peakHour[0]), count: peakHour[1] } : null;
  }

  /**
   * 分析錯誤模式
   */
  analyzeErrorPatterns(commands) {
    const errors = commands.filter(cmd => !cmd.success);
    if (errors.length === 0) return null;
    
    const errorTypes = {};
    errors.forEach(error => {
      let errorMessage = 'Unknown';
      
      try {
        if (error.error) {
          if (typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error.message) {
            errorMessage = error.error.message;
          } else if (error.error.error) {
            errorMessage = typeof error.error.error === 'string' 
              ? error.error.error 
              : String(error.error.error);
          } else {
            errorMessage = String(error.error);
          }
        }
      } catch (err) {
        errorMessage = 'Unknown';
      }
      
      const type = errorMessage.split(' ')[0] || 'Unknown';
      errorTypes[type] = (errorTypes[type] || 0) + 1;
    });
    
    return {
      totalErrors: errors.length,
      errorRate: errors.length / commands.length,
      commonErrors: Object.entries(errorTypes)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
    };
  }

  /**
   * 結束會話
   */
  async endSession() {
    clearInterval(this.saveInterval);
    await this.processSessionData();
    await this.saveLearningData();
    console.log('🧠 智能學習會話已結束');
  }

  /**
   * 重置學習數據
   */
  async resetLearningData() {
    this.userBehavior = {
      commands: {},
      preferences: {},
      workPatterns: {},
      errorPatterns: {},
      successPatterns: {},
      timePatterns: {},
      projectTypes: {},
      deploymentPrefs: {}
    };
    
    this.decisionModel = {
      templateRecommendations: {},
      workflowOptimization: {},
      errorPrevention: {},
      resourceOptimization: {},
      learningConfidence: 0.0
    };
    
    await this.saveLearningData();
    console.log('🔄 學習數據已重置');
  }

  /**
   * 匯出學習報告
   */
  async exportLearningReport(filePath) {
    const report = {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '2.0',
        type: 'Mursfoto AutoDev Factory Learning Report'
      },
      statistics: this.getLearningStatistics(),
      userBehavior: this.userBehavior,
      decisionModel: this.decisionModel,
      suggestions: await this.getIntelligentSuggestions(),
      insights: this.generateInsights()
    };
    
    await fs.writeJson(filePath, report, { spaces: 2 });
    return report;
  }

  /**
   * 生成洞察報告
   */
  generateInsights() {
    const insights = [];
    
    // 效率洞察
    const totalTime = Object.values(this.userBehavior.commands)
      .reduce((sum, cmd) => sum + cmd.totalDuration, 0);
    
    if (totalTime > 0) {
      insights.push({
        type: 'efficiency',
        title: '⏱️ 時間效率分析',
        content: `總計使用時間: ${Math.round(totalTime / 1000 / 60)} 分鐘`,
        recommendation: '考慮使用自動化腳本來優化重複任務'
      });
    }
    
    // 成功率洞察
    const lowSuccessCommands = Object.entries(this.userBehavior.commands)
      .filter(([, data]) => data.successRate < 0.8 && data.count > 2);
    
    if (lowSuccessCommands.length > 0) {
      insights.push({
        type: 'reliability',
        title: '⚠️ 可靠性提醒',
        content: `${lowSuccessCommands.length} 個命令的成功率低於 80%`,
        recommendation: '建議查看錯誤記憶系統以了解失敗原因'
      });
    }
    
    return insights;
  }
}

module.exports = IntelligentLearningSystem;
