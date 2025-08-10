#!/usr/bin/env node

const chalk = require('chalk');
const AIModelRouter = require('./lib/services/AIModelRouter');
const AICodeGenerator = require('./lib/services/AICodeGenerator');

/**
 * 🧪 混合 AI 架構測試腳本
 * 測試本地 gpt-oss-20b 和 Claude API 的智能路由功能
 */

async function testHybridAI() {
  console.log(chalk.blue('🚀 開始混合 AI 架構測試\n'));

  const router = new AIModelRouter();
  const codeGen = new AICodeGenerator();

  // 測試用例
  const testCases = [
    {
      name: '簡單代碼生成（應使用本地模型）',
      prompt: 'Create a JavaScript function to calculate factorial of a number',
      expectedModel: 'local',
      complexity: 'low'
    },
    {
      name: '中等複雜度任務',
      prompt: 'Design a REST API for a blog system with user authentication and post management',
      expectedModel: 'local',
      complexity: 'medium'
    },
    {
      name: '高複雜度系統設計（應使用 Claude API）',
      prompt: 'Design a distributed microservices architecture for an e-commerce platform with high availability and scalability requirements',
      expectedModel: 'claude',
      complexity: 'high'
    }
  ];

  let passedTests = 0;
  let totalTests = testCases.length;

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(chalk.cyan(`\n📋 測試 ${i + 1}/${totalTests}: ${testCase.name}`));
    
    try {
      const startTime = Date.now();
      
      const result = await router.generate(testCase.prompt, {
        complexity: testCase.complexity
      });
      
      const responseTime = Date.now() - startTime;
      
      // 驗證結果
      const success = result && result.content && result.metadata;
      if (success) {
        console.log(chalk.green(`✅ 成功`));
        console.log(`   模型: ${result.metadata.method}`);
        console.log(`   複雜度: ${result.metadata.complexity}`);
        console.log(`   響應時間: ${responseTime}ms`);
        console.log(`   內容長度: ${result.content.length} 字符`);
        console.log(`   成本: $${result.usage?.cost || 0}`);
        passedTests++;
      } else {
        console.log(chalk.red(`❌ 失敗 - 無效的回應格式`));
      }
      
    } catch (error) {
      console.log(chalk.red(`❌ 失敗 - ${error.message}`));
    }
  }

  // 測試統計信息
  console.log(chalk.blue('\n📊 統計信息測試'));
  try {
    const stats = router.getStats();
    console.log(chalk.green('✅ 統計信息獲取成功'));
    console.log('   總請求數:', stats.totalRequests);
    console.log('   本地模型請求:', stats.localModelRequests);
    console.log('   Claude API 請求:', stats.claudeApiRequests);
    console.log('   本地模型成功率:', stats.localSuccessRate);
    console.log('   Claude API 成功率:', stats.claudeSuccessRate);
    console.log('   估算節省成本: $' + stats.totalCostSavings);
    passedTests++;
    totalTests++;
  } catch (error) {
    console.log(chalk.red(`❌ 統計信息失敗 - ${error.message}`));
    totalTests++;
  }

  // 測試 AICodeGenerator 集成
  console.log(chalk.blue('\n🤖 AICodeGenerator 集成測試'));
  try {
    const analysis = await codeGen.analyzeRequirements('Create a simple todo app', 'frontend');
    
    if (analysis && analysis.entities && analysis.operations) {
      console.log(chalk.green('✅ 需求分析成功'));
      console.log('   識別實體:', analysis.entities.length);
      console.log('   操作數量:', analysis.operations.length);
      console.log('   建議架構:', analysis.architecture);
      passedTests++;
    } else {
      console.log(chalk.red('❌ 需求分析失敗 - 無效回應'));
    }
    totalTests++;
  } catch (error) {
    console.log(chalk.red(`❌ 需求分析失敗 - ${error.message}`));
    totalTests++;
  }

  // 測試結果摘要
  console.log(chalk.blue('\n🎯 測試結果摘要'));
  console.log(`通過測試: ${passedTests}/${totalTests}`);
  console.log(`成功率: ${(passedTests/totalTests*100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log(chalk.green('\n🎉 所有測試通過！混合 AI 架構運作正常'));
  } else {
    console.log(chalk.yellow(`\n⚠️ ${totalTests - passedTests} 個測試失敗，請檢查配置`));
  }

  // 健康狀態報告
  console.log(chalk.blue('\n🏥 AI 模型健康狀態'));
  const healthStatus = router.getStats().healthStatus;
  console.log(`本地模型狀態: ${getHealthStatusEmoji(healthStatus.localModel)} ${healthStatus.localModel}`);
  console.log(`Claude API 狀態: ${getHealthStatusEmoji(healthStatus.claudeApi)} ${healthStatus.claudeApi}`);
  console.log(`最後檢查時間: ${healthStatus.lastChecked ? new Date(healthStatus.lastChecked).toLocaleString() : '未檢查'}`);

  return passedTests === totalTests;
}

function getHealthStatusEmoji(status) {
  switch (status) {
    case 'healthy': return '🟢';
    case 'unhealthy': return '🟡';
    case 'error': return '🔴';
    default: return '⚪';
  }
}

// 執行測試
if (require.main === module) {
  testHybridAI()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error(chalk.red('測試執行失敗:'), error);
      process.exit(1);
    });
}

module.exports = { testHybridAI };
