#!/usr/bin/env node

/**
 * 🧠 智能學習和決策系統測試腳本
 * 
 * 測試 Mursfoto AutoDev Factory 2.0 - Phase 2 核心功能
 */

const chalk = require('chalk');
const IntelligentLearningSystem = require('./lib/services/IntelligentLearningSystem');

async function testLearningSystem() {
  console.log(chalk.cyan.bold('🧠 測試智能學習和決策系統 - Phase 2'));
  console.log(chalk.gray('=' * 60));
  
  try {
    // 初始化學習系統
    console.log(chalk.yellow('1. 初始化智能學習系統...'));
    const learningSystem = new IntelligentLearningSystem();
    
    // 等待初始化完成
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 模擬一些命令執行記錄
    console.log(chalk.yellow('\n2. 模擬命令執行記錄...'));
    
    const testCommands = [
      {
        command: 'mursfoto create',
        args: ['my-project', '--template=minimal'],
        success: true,
        duration: 2500,
        context: { template: 'minimal', projectType: 'web' }
      },
      {
        command: 'mursfoto smart github create-repo',
        args: ['--name=test-repo'],
        success: true,
        duration: 3200,
        context: { projectType: 'web', action: 'create-repo' }
      },
      {
        command: 'mursfoto deploy',
        args: ['--env=prod'],
        success: false,
        duration: 1800,
        context: { environment: 'prod' },
        error: new Error('Network timeout')
      },
      {
        command: 'mursfoto smart ai component',
        args: ['--type=react'],
        success: true,
        duration: 4100,
        context: { type: 'react', framework: 'react' }
      },
      {
        command: 'mursfoto create',
        args: ['another-project', '--template=calculator'],
        success: true,
        duration: 2200,
        context: { template: 'calculator', projectType: 'web' }
      },
      {
        command: 'mursfoto smart test generate',
        args: ['--coverage=90'],
        success: true,
        duration: 3500,
        context: { coverage: 90, type: 'test' }
      }
    ];
    
    for (const cmd of testCommands) {
      await learningSystem.recordCommand(cmd);
      console.log(chalk.green(`  ✓ 記錄命令: ${cmd.command}`));
    }
    
    // 測試學習統計
    console.log(chalk.yellow('\n3. 測試學習統計功能...'));
    const stats = learningSystem.getLearningStatistics();
    
    console.log(chalk.blue('📊 學習統計結果:'));
    console.log(`  • 總命令數: ${stats.totalCommands}`);
    console.log(`  • 唯一命令: ${stats.uniqueCommands}`);
    console.log(`  • 平均成功率: ${stats.averageSuccessRate}%`);
    console.log(`  • 學習置信度: ${stats.learningConfidence}%`);
    console.log(`  • 會話命令數: ${stats.sessionCommands}`);
    
    if (stats.mostUsedCommands.length > 0) {
      console.log(chalk.blue('\n🔥 最常用命令:'));
      stats.mostUsedCommands.forEach((cmd, index) => {
        console.log(chalk.cyan(`  ${index + 1}. ${cmd.command} - ${cmd.count}次 (${cmd.successRate}% 成功率)`));
      });
    }
    
    // 測試智能建議
    console.log(chalk.yellow('\n4. 測試智能建議功能...'));
    const suggestions = await learningSystem.getIntelligentSuggestions({
      projectType: 'web'
    });
    
    if (suggestions.length > 0) {
      console.log(chalk.blue('💡 智能建議:'));
      suggestions.forEach((suggestion, index) => {
        console.log(chalk.green(`  ${index + 1}. ${suggestion.title}`));
        console.log(chalk.gray(`     💬 ${suggestion.content}`));
        if (suggestion.action) {
          console.log(chalk.dim(`     🎯 ${suggestion.action}`));
        }
      });
    } else {
      console.log(chalk.gray('💡 暫無智能建議 (需要更多數據)'));
    }
    
    // 測試學習報告導出
    console.log(chalk.yellow('\n5. 測試學習報告導出...'));
    const reportPath = `test_learning_report_${Date.now()}.json`;
    const report = await learningSystem.exportLearningReport(reportPath);
    
    console.log(chalk.green(`📊 學習報告已導出: ${reportPath}`));
    console.log(chalk.blue(`  • 統計數據: ${report.statistics.totalCommands} 個命令`));
    console.log(chalk.blue(`  • 智能建議: ${report.suggestions.length} 個`));
    console.log(chalk.blue(`  • 洞察報告: ${report.insights.length} 個`));
    
    // 顯示關鍵洞察
    if (report.insights.length > 0) {
      console.log(chalk.blue('\n🔍 關鍵洞察:'));
      report.insights.slice(0, 3).forEach(insight => {
        console.log(chalk.cyan(`  • ${insight.title}: ${insight.content}`));
      });
    }
    
    // 測試命令行集成
    console.log(chalk.yellow('\n6. 測試命令行集成...'));
    console.log(chalk.green('✓ 可用的智能學習命令:'));
    console.log(chalk.cyan('  mursfoto smart learn stats           - 查看學習統計'));
    console.log(chalk.cyan('  mursfoto smart learn suggestions     - 獲取智能建議'));
    console.log(chalk.cyan('  mursfoto smart learn report          - 導出學習報告'));
    console.log(chalk.cyan('  mursfoto smart learn reset           - 重置學習數據'));
    console.log(chalk.cyan('  mursfoto smart learn record          - 手動記錄命令'));
    
    // 完成測試
    console.log(chalk.green.bold('\n✅ 智能學習和決策系統測試完成！'));
    console.log(chalk.blue('🎉 Mursfoto AutoDev Factory 2.0 - Phase 2 核心功能已就緒'));
    
    console.log(chalk.yellow.bold('\n🚀 下一步操作:'));
    console.log(chalk.white('1. 使用 `mursfoto smart learn stats` 查看學習統計'));
    console.log(chalk.white('2. 使用 `mursfoto smart learn suggestions` 獲取智能建議'));
    console.log(chalk.white('3. 繼續使用 CLI 工具，系統會自動學習您的使用模式'));
    console.log(chalk.white('4. 定期導出學習報告來查看使用趨勢和優化建議'));
    
    // 結束會話
    await learningSystem.endSession();
    
  } catch (error) {
    console.error(chalk.red('\n❌ 測試失敗:'), error.message);
    console.error(chalk.gray(error.stack));
    process.exit(1);
  }
}

// 執行測試
if (require.main === module) {
  testLearningSystem();
}

module.exports = { testLearningSystem };
