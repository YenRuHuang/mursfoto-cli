#!/usr/bin/env node

/**
 * 🧪 MCP 整合測試
 * 測試 MCPManager 的基本功能和回退機制
 */

const MCPManager = require('./lib/mcp/MCPManager')
const logger = require('./lib/utils/logger')

async function runMCPTests() {
  logger.info('🧪 開始 MCP 整合測試...')
  
  const mcpManager = new MCPManager()
  
  try {
    // 測試 1: 初始化
    logger.info('📋 測試 1: 初始化 MCP 管理器')
    await mcpManager.initialize()
    
    // 測試 2: 獲取服務統計
    logger.info('📊 測試 2: 獲取服務統計')
    const stats = mcpManager.getStats()
    console.log('MCP 統計:', JSON.stringify(stats, null, 2))
    
    // 測試 3: 檢查服務可用性
    logger.info('🔍 測試 3: 檢查服務可用性')
    const services = mcpManager.getAvailableServices()
    console.log('可用服務:', services)
    
    services.forEach(service => {
      const isAvailable = mcpManager.isServiceAvailable(service)
      console.log(`  ${service}: ${isAvailable ? '✅' : '❌'}`)
    })
    
    // 測試 4: 文件系統操作（回退模式）
    logger.info('📁 測試 4: 文件系統操作 (回退模式)')
    try {
      const testContent = JSON.stringify({
        test: true,
        timestamp: new Date().toISOString(),
        message: 'MCP 文件系統測試'
      }, null, 2)
      
      // 寫入測試文件
      await mcpManager.writeFile('./test-mcp-output.json', testContent)
      logger.success('✅ 文件寫入成功')
      
      // 讀取測試文件
      const readContent = await mcpManager.readFile('./test-mcp-output.json')
      const parsedContent = JSON.parse(readContent)
      
      if (parsedContent.test === true) {
        logger.success('✅ 文件讀取成功，內容正確')
      } else {
        logger.error('❌ 文件內容不正確')
      }
      
      // 列出目錄
      const dirContent = await mcpManager.listDirectory('./')
      logger.info(`📂 目錄內容 (${dirContent.length} 項目):`)
      dirContent.slice(0, 5).forEach(item => {
        console.log(`  - ${item}`)
      })
      if (dirContent.length > 5) {
        console.log(`  ... 還有 ${dirContent.length - 5} 個項目`)
      }
      
    } catch (error) {
      logger.error('❌ 文件系統操作失敗:', error.message)
    }
    
    // 測試 5: 記憶系統（回退模式）
    logger.info('🧠 測試 5: 記憶系統 (回退模式)')
    try {
      // 儲存記憶
      const memory1 = await mcpManager.storeMemory(
        'mursfoto-cli 是一個強大的項目生成工具',
        ['project', 'cli', 'tool'],
        { category: 'description' }
      )
      logger.success('✅ 記憶儲存成功:', memory1.id)
      
      const memory2 = await mcpManager.storeMemory(
        '用戶偏好使用 TypeScript 而不是 JavaScript',
        ['preference', 'language', 'typescript'],
        { category: 'user_preference' }
      )
      logger.success('✅ 記憶儲存成功:', memory2.id)
      
      // 搜尋記憶
      const searchResults = await mcpManager.searchMemories('mursfoto', 5)
      logger.info(`🔍 搜尋結果 (${searchResults.length} 條):`)
      searchResults.forEach((memory, index) => {
        console.log(`  ${index + 1}. ${memory.content.substring(0, 50)}...`)
        console.log(`     實體: [${memory.entities.join(', ')}]`)
      })
      
    } catch (error) {
      logger.error('❌ 記憶系統操作失敗:', error.message)
    }
    
    // 測試 6: 圖像分析 (需要 vision MCP)
    logger.info('🖼️ 測試 6: 圖像分析')
    try {
      // 嘗試桌面截圖
      const screenshot = await mcpManager.captureDesktop('describe')
      logger.success('✅ 桌面截圖成功')
      console.log('截圖結果:', screenshot)
    } catch (error) {
      logger.warn('⚠️ 圖像分析功能需要在 Cline 環境中運行:', error.message)
    }
    
    // 測試 7: 數據庫操作 (會觸發錯誤，展示錯誤處理)
    logger.info('🗄️ 測試 7: 數據庫操作')
    try {
      await mcpManager.queryDatabase('SELECT 1 as test')
    } catch (error) {
      logger.warn('⚠️ 數據庫操作失敗 (預期行為):', error.message)
    }
    
    // 測試 8: 配置更新
    logger.info('⚙️ 測試 8: 配置更新')
    mcpManager.configure({
      fallbackEnabled: true,
      retryCount: 2
    })
    
    const updatedStats = mcpManager.getStats()
    console.log('更新後統計:', JSON.stringify(updatedStats, null, 2))
    
    logger.success('🎉 所有測試完成!')
    
  } catch (error) {
    logger.error('❌ 測試過程中發生錯誤:', error.message)
    console.error(error.stack)
  }
}

// 運行測試
if (require.main === module) {
  runMCPTests().then(() => {
    logger.info('👋 測試結束')
    process.exit(0)
  }).catch(error => {
    logger.error('💥 測試失敗:', error.message)
    process.exit(1)
  })
}

module.exports = { runMCPTests }
