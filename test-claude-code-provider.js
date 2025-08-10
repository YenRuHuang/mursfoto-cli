#!/usr/bin/env node

/**
 * 🌟 Claude Code Provider 測試腳本
 * 測試 Cline IDE Claude Code provider 整合功能
 */

const chalk = require('chalk')
const ora = require('ora')
const AIModelRouter = require('./lib/services/AIModelRouter')

console.log(chalk.cyan(`
╔══════════════════════════════════════════════════════════════╗
║                  🌟 Claude Code Provider 測試                ║
║              測試 Cline IDE 與 mursfoto-cli 整合             ║
╚══════════════════════════════════════════════════════════════╝
`))

async function testClaudeCodeProvider() {
  const aiRouter = new AIModelRouter()
  
  console.log(chalk.blue('\n📋 開始 Claude Code Provider 測試...\n'))
  
  // 測試 1: 健康檢查
  console.log(chalk.yellow('🏥 測試 1: Cline API 健康檢查'))
  try {
    const isHealthy = await aiRouter.isClineApiHealthy()
    if (isHealthy) {
      console.log(chalk.green('✅ Cline IDE 連線正常'))
    } else {
      console.log(chalk.red('❌ Cline IDE 連線失敗 - 請確認 Cline IDE 已啟動'))
      console.log(chalk.gray('   提示：Cline IDE 應該運行在 http://localhost:3001'))
    }
  } catch (error) {
    console.log(chalk.red(`❌ 健康檢查失敗: ${error.message}`))
  }
  
  console.log('')
  
  // 測試 2: 簡單程式碼生成
  console.log(chalk.yellow('💻 測試 2: 簡單程式碼生成'))
  try {
    const result = await aiRouter.generate(
      '請生成一個簡單的 Node.js Hello World 函數',
      {
        forceClaudeApi: false, // 讓系統自動選擇最佳提供者
        maxTokens: 500
      }
    )
    
    console.log(chalk.green(`✅ 生成成功 (使用: ${result.metadata.method})`))
    console.log(chalk.gray(`   模型: ${result.model}`))
    console.log(chalk.gray(`   回應時間: ${result.metadata.responseTime}ms`))
    console.log(chalk.blue('\n📄 生成結果預覽:'))
    console.log(chalk.white('─'.repeat(50)))
    console.log(result.content.substring(0, 200) + (result.content.length > 200 ? '...' : ''))
    console.log(chalk.white('─'.repeat(50)))
    
  } catch (error) {
    console.log(chalk.red(`❌ 程式碼生成失敗: ${error.message}`))
  }
  
  console.log('')
  
  // 測試 3: 強制使用 Claude Code
  console.log(chalk.yellow('🌟 測試 3: 強制使用 Claude Code Provider'))
  try {
    // 先檢查是否可以使用 Cline API
    if (await aiRouter.isClineApiHealthy()) {
      const result = await aiRouter.generateWithClineApi(
        '請生成一個簡單的 JavaScript 函數來計算兩個數字的和',
        {
          maxTokens: 300
        }
      )
      
      console.log(chalk.green('✅ Claude Code Provider 測試成功'))
      console.log(chalk.gray(`   模型: ${result.model}`))
      console.log(chalk.gray(`   Token 使用: ${result.usage.tokens}`))
      console.log(chalk.gray(`   成本: $${result.usage.cost} (使用 Claude Max 訂閱)`))
      
    } else {
      console.log(chalk.yellow('⚠️  跳過測試 - Cline IDE 不可用'))
    }
    
  } catch (error) {
    console.log(chalk.red(`❌ Claude Code Provider 測試失敗: ${error.message}`))
  }
  
  console.log('')
  
  // 測試 4: 顯示統計信息
  console.log(chalk.yellow('📊 測試 4: AI 路由器統計信息'))
  const stats = aiRouter.getStats()
  
  console.log(chalk.blue('\n🔍 系統狀態:'))
  console.log(`   本地模型: ${getStatusEmoji(stats.healthStatus.localModel)} ${stats.healthStatus.localModel}`)
  console.log(`   Claude API: ${getStatusEmoji(stats.healthStatus.claudeApi)} ${stats.healthStatus.claudeApi}`)
  console.log(`   Cline API: ${getStatusEmoji(stats.healthStatus.clineApi)} ${stats.healthStatus.clineApi}`)
  
  console.log(chalk.blue('\n📈 使用統計:'))
  console.log(`   總請求數: ${stats.totalRequests}`)
  console.log(`   本地模型請求: ${stats.localModelRequests}`)
  console.log(`   Claude API 請求: ${stats.claudeApiRequests}`)
  console.log(`   本地模型成功率: ${stats.localSuccessRate}`)
  console.log(`   Claude API 成功率: ${stats.claudeSuccessRate}`)
  
  if (stats.averageLocalTime > 0) {
    console.log(`   平均本地模型時間: ${stats.averageLocalTime.toFixed(0)}ms`)
  }
  if (stats.averageClaudeTime > 0) {
    console.log(`   平均 Claude 時間: ${stats.averageClaudeTime.toFixed(0)}ms`)
  }
  
  console.log('')
  
  // 測試總結
  console.log(chalk.cyan('\n🎯 測試總結:'))
  
  const clineHealthy = stats.healthStatus.clineApi === 'healthy'
  const claudeApiAvailable = stats.healthStatus.claudeApi !== 'error'
  const localModelAvailable = stats.healthStatus.localModel === 'healthy'
  
  if (clineHealthy) {
    console.log(chalk.green('✅ Claude Code Provider (Cline IDE) 運行正常'))
    console.log(chalk.green('   您可以使用 Claude Max 訂閱進行 AI 程式碼生成'))
  } else {
    console.log(chalk.yellow('⚠️  Claude Code Provider 不可用'))
    console.log(chalk.gray('   請確認 Cline IDE 已啟動並運行在正確端點'))
  }
  
  if (claudeApiAvailable) {
    console.log(chalk.green('✅ Claude API 備援可用'))
  }
  
  if (localModelAvailable) {
    console.log(chalk.green('✅ 本地模型備援可用'))
  }
  
  if (!clineHealthy && !claudeApiAvailable && !localModelAvailable) {
    console.log(chalk.red('❌ 所有 AI 服務都不可用'))
    console.log(chalk.yellow('\n🔧 解決方案:'))
    console.log('   1. 啟動 Cline IDE 並確保 Claude Code provider 可用')
    console.log('   2. 或配置有效的 ANTHROPIC_API_KEY')
    console.log('   3. 或啟動本地 Ollama 服務')
  }
  
  console.log(chalk.cyan('\n🔄 提示: 您可以在 .env 檔案中調整以下設定:'))
  console.log('   CLAUDE_CODE_PROVIDER=enabled  (強制啟用)')
  console.log('   CLINE_API_ENDPOINT=http://localhost:3001  (Cline IDE 端點)')
  console.log('   PREFER_CLAUDE_CODE=true  (優先使用 Claude Code)')
  
  console.log(chalk.green('\n🎉 測試完成!\n'))
}

function getStatusEmoji(status) {
  switch (status) {
    case 'healthy': return '🟢'
    case 'unhealthy': return '🟡'
    case 'error': return '🔴'
    default: return '⚪'
  }
}

// 執行測試
testClaudeCodeProvider().catch(error => {
  console.error(chalk.red('\n💥 測試腳本執行失敗:'), error.message)
  process.exit(1)
})
