#!/usr/bin/env node

/**
 * 🧪 Phase 4E 生態系統核心組件測試
 * 驗證四大核心系統是否能正確載入和初始化
 */

const logger = require('./lib/utils/logger')

async function testPhase4ESystems() {
  logger.info('🧪 開始測試 Phase 4E 生態系統核心組件...')
  
  const testResults = {
    pluginManager: false,
    apiGateway: false,
    marketplaceService: false,
    integrationManager: false
  }
  
  const errors = []
  
  // 測試 PluginManager
  try {
    logger.info('🔌 測試 PluginManager...')
    const { PluginManager } = require('./lib/plugin/PluginManager')
    
    const mockContext = { version: '3.0.0' }
    const pluginManager = new PluginManager(mockContext)
    
    // 測試工具 API 創建（這是之前有問題的部分）
    const utilsAPI = pluginManager.createUtilsAPI()
    
    // 驗證 spinner 實現
    if (utilsAPI.spinner && typeof utilsAPI.spinner.start === 'function') {
      logger.info('✅ PluginManager spinner 功能正常')
    }
    
    testResults.pluginManager = true
    logger.info('✅ PluginManager 測試通過')
    
  } catch (error) {
    errors.push(`PluginManager: ${error.message}`)
    logger.error('❌ PluginManager 測試失敗:', error.message)
  }
  
  // 測試 APIGateway
  try {
    logger.info('🌐 測試 APIGateway...')
    const { APIGateway } = require('./lib/api/APIGateway')
    
    const gateway = new APIGateway({
      port: 3001, // 避免衝突
      host: 'localhost'
    })
    
    testResults.apiGateway = true
    logger.info('✅ APIGateway 測試通過')
    
  } catch (error) {
    errors.push(`APIGateway: ${error.message}`)
    logger.error('❌ APIGateway 測試失敗:', error.message)
  }
  
  // 測試 MarketplaceService
  try {
    logger.info('🏪 測試 MarketplaceService...')
    const { MarketplaceService } = require('./lib/marketplace/MarketplaceService')
    
    const marketplace = new MarketplaceService({
      apiUrl: 'https://test.mursfoto.com/api',
      timeout: 5000
    })
    
    testResults.marketplaceService = true
    logger.info('✅ MarketplaceService 測試通過')
    
  } catch (error) {
    errors.push(`MarketplaceService: ${error.message}`)
    logger.error('❌ MarketplaceService 測試失敗:', error.message)
  }
  
  // 測試 IntegrationManager
  try {
    logger.info('🌐 測試 IntegrationManager...')
    const { IntegrationManager } = require('./lib/integrations/IntegrationManager')
    
    const integrationManager = new IntegrationManager()
    
    // 測試獲取可用提供者
    const providers = integrationManager.getAvailableProviders()
    if (providers.length > 0) {
      logger.info(`🔌 發現 ${providers.length} 個內建服務提供者`)
    }
    
    testResults.integrationManager = true
    logger.info('✅ IntegrationManager 測試通過')
    
  } catch (error) {
    errors.push(`IntegrationManager: ${error.message}`)
    logger.error('❌ IntegrationManager 測試失敗:', error.message)
  }
  
  // 生成測試報告
  const passedTests = Object.values(testResults).filter(result => result).length
  const totalTests = Object.keys(testResults).length
  
  logger.info('\n📊 Phase 4E 系統測試結果:')
  logger.info(`✅ 通過: ${passedTests}/${totalTests}`)
  logger.info(`❌ 失敗: ${totalTests - passedTests}/${totalTests}`)
  
  if (errors.length > 0) {
    logger.error('\n❌ 錯誤詳情:')
    errors.forEach(error => logger.error(`  - ${error}`))
  }
  
  if (passedTests === totalTests) {
    logger.info('\n🎉 所有 Phase 4E 核心系統測試通過！')
    logger.info('🏗️ 生態系統架構完整，可以進行後續開發')
  } else {
    logger.error('\n❌ 部分系統測試失敗，需要進一步檢查')
  }
  
  return {
    success: passedTests === totalTests,
    results: testResults,
    errors,
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: totalTests - passedTests
    }
  }
}

// 執行測試
if (require.main === module) {
  testPhase4ESystems()
    .then(result => {
      process.exit(result.success ? 0 : 1)
    })
    .catch(error => {
      logger.error('🔥 測試執行失敗:', error.message)
      process.exit(1)
    })
}

module.exports = { testPhase4ESystems }
