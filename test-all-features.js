#!/usr/bin/env node

/**
 * @mursfoto/cli 完整功能測試腳本
 * 測試所有 Phase 1, 2, 3 功能
 */

const { execSync } = require('child_process');
const chalk = require('chalk');

// 測試結果統計
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failedCommands = [];

// 日誌函數
const log = {
  info: (msg) => console.log(chalk.blue('ℹ'), msg),
  success: (msg) => console.log(chalk.green('✅'), msg),
  error: (msg) => console.log(chalk.red('❌'), msg),
  warn: (msg) => console.log(chalk.yellow('⚠️'), msg),
  title: (msg) => {
    console.log(chalk.cyan.bold(`\n🚀 ${msg}`));
    console.log(chalk.gray('─'.repeat(60)));
  }
};

// 執行命令並捕獲結果
function runTest(description, command, expectedInOutput = null) {
  totalTests++;
  log.info(`測試: ${description}`);
  log.info(`命令: ${chalk.dim(command)}`);
  
  try {
    const result = execSync(command, { 
      encoding: 'utf-8', 
      timeout: 15000,
      stdio: 'pipe',
      env: { 
        ...process.env, 
        MURSFOTO_QUICK_MODE: 'true',
        NODE_ENV: 'test'
      }
    });
    
    // 檢查預期輸出
    if (expectedInOutput && !result.includes(expectedInOutput)) {
      throw new Error(`輸出中未找到預期內容: ${expectedInOutput}`);
    }
    
    log.success(`✅ ${description} - 通過`);
    passedTests++;
    return true;
    
  } catch (error) {
    log.error(`❌ ${description} - 失敗`);
    console.log(chalk.gray(`   錯誤: ${error.message.split('\n')[0]}`));
    failedTests++;
    failedCommands.push({ description, command, error: error.message });
    return false;
  }
}

// 主測試函數
async function runAllTests() {
  console.log(chalk.cyan.bold('\n🧪 @mursfoto/cli 完整功能測試'));
  console.log(chalk.gray('測試所有 Phase 1, 2, 3 功能\n'));
  
  // Phase 1: 基礎功能測試
  log.title('Phase 1: 基礎 CLI 功能測試');
  
  runTest('顯示幫助信息', 'node bin/mursfoto.js --help');
  runTest('顯示版本號', 'node bin/mursfoto.js --version');
  runTest('檢查環境', 'node bin/mursfoto.js doctor');
  runTest('列出模板', 'node bin/mursfoto.js template list');
  runTest('查看狀態', 'node bin/mursfoto.js status');
  runTest('列出 Gateway 服務', 'node bin/mursfoto.js gateway list');
  runTest('查看配置', 'node bin/mursfoto.js config get');
  
  // Phase 2: 智能功能測試  
  log.title('Phase 2: 智能自動化功能測試');
  
  // 智能學習系統
  runTest('學習系統統計', 'node bin/mursfoto.js smart learn stats');
  runTest('智能建議', 'node bin/mursfoto.js smart learn suggestions');
  
  // 錯誤記憶系統
  runTest('錯誤統計', 'node bin/mursfoto.js smart error stats');
  
  // GitHub 自動化
  runTest('GitHub 自動化幫助', 'node bin/mursfoto.js smart github --help');
  
  // AI 代碼生成
  runTest('AI 代碼生成幫助', 'node bin/mursfoto.js smart ai --help');
  
  // 智能測試
  runTest('智能測試幫助', 'node bin/mursfoto.js smart test --help');
  
  // 智能部署
  runTest('智能部署幫助', 'node bin/mursfoto.js smart deploy --help');
  
  // 進階模板
  runTest('進階模板幫助', 'node bin/mursfoto.js smart template --help');
  
  // 效能優化
  runTest('效能優化幫助', 'node bin/mursfoto.js smart optimize --help');
  
  // n8n 自動化
  runTest('n8n 自動化幫助', 'node bin/mursfoto.js smart n8n --help');
  
  // Phase 3: 雲端和容器管理測試
  log.title('Phase 3: 雲端和容器管理功能測試');
  
  // 多雲平台管理
  runTest('多雲平台列表', 'node bin/mursfoto.js smart cloud list', 'Amazon Web Services');
  runTest('多雲狀態', 'node bin/mursfoto.js smart cloud status');
  runTest('多雲平台幫助', 'node bin/mursfoto.js smart cloud --help');
  
  // 容器優化
  runTest('容器優化統計', 'node bin/mursfoto.js smart container stats', '優化規則');
  runTest('容器優化幫助', 'node bin/mursfoto.js smart container --help');
  
  // 成本分析  
  runTest('成本分析幫助', 'node bin/mursfoto.js smart cost --help');
  
  // 完整 smart 命令測試
  log.title('完整 Smart 命令系統測試');
  
  runTest('Smart 命令幫助', 'node bin/mursfoto.js smart --help');
  
  // 顯示測試結果總結
  console.log(chalk.cyan.bold('\n📊 測試結果總結'));
  console.log(chalk.gray('─'.repeat(60)));
  
  const passRate = Math.round((passedTests / totalTests) * 100);
  
  console.log(`總測試數: ${totalTests}`);
  console.log(chalk.green(`✅ 通過: ${passedTests}`));
  console.log(chalk.red(`❌ 失敗: ${failedTests}`));
  console.log(`🎯 通過率: ${passRate}%`);
  
  if (failedTests > 0) {
    console.log(chalk.red.bold('\n❌ 失敗的測試:'));
    failedCommands.forEach((cmd, index) => {
      console.log(`${index + 1}. ${cmd.description}`);
      console.log(`   命令: ${chalk.dim(cmd.command)}`);
      console.log(`   錯誤: ${chalk.gray(cmd.error.split('\n')[0])}`);
    });
  }
  
  if (passRate >= 90) {
    log.success('🎉 測試通過率優秀！');
  } else if (passRate >= 70) {
    log.warn('⚠️ 測試通過率良好，但有改善空間');
  } else {
    log.error('❌ 測試通過率需要改善');
  }
  
  console.log(chalk.cyan.bold('\n✨ 功能測試完成！'));
  
  // 測試報告保存
  const reportPath = `./test-report-${Date.now()}.json`;
  const report = {
    timestamp: new Date().toISOString(),
    totalTests,
    passedTests,
    failedTests,
    passRate,
    failedCommands
  };
  
  require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log.info(`測試報告已保存: ${reportPath}`);
  
  process.exit(failedTests > 0 ? 1 : 0);
}

// 運行測試
runAllTests().catch(error => {
  log.error('測試運行失敗:', error.message);
  process.exit(1);
});
