#!/usr/bin/env node

const logger = require('./lib/utils/logger')

/**
 * 🧪 真實 MCP 服務測試
 * 直接測試 Cline 環境中可用的 MCP 服務
 */
async function testRealMCPServices() {
  logger.info('🚀 開始測試真實 MCP 服務...')

  // 要測試的 MCP 服務器列表
  const testServices = [
    { server: 'vision', tool: 'screenshot_desktop', args: { analysis_type: 'describe' } },
    { server: '@modelcontextprotocol/server-filesystem', tool: 'list_directory', args: { path: '.' } },
    { server: '@notionhq/notion-mcp-server', tool: 'search', args: { query: 'test' } },
    { server: '@sentry/mcp-server', tool: 'get_projects', args: {} },
    { server: '@supabase/mcp-server-supabase', tool: 'list_tables', args: {} },
    { server: '@agent-infra/mcp-server-browser', tool: 'get_page_title', args: { url: 'https://example.com' } }
  ]

  const results = {
    working: [],
    failed: []
  }

  for (const service of testServices) {
    try {
      logger.info(`🔍 測試 ${service.server}.${service.tool}`)
      
      // 模擬 use_mcp_tool 調用（在真實環境中會被 Cline 提供）
      if (typeof use_mcp_tool !== 'undefined') {
        const result = await use_mcp_tool(service.server, service.tool, service.args)
        logger.success(`✅ ${service.server} - 成功`)
        results.working.push(service.server)
      } else {
        throw new Error('use_mcp_tool 不可用')
      }
      
    } catch (error) {
      logger.warn(`❌ ${service.server} - 失敗: ${error.message}`)
      results.failed.push({
        server: service.server,
        error: error.message
      })
    }
  }

  logger.info('\n📊 測試結果總結:')
  logger.info(`✅ 可用服務 (${results.working.length}):`)
  results.working.forEach(server => {
    logger.info(`  - ${server}`)
  })

  logger.info(`❌ 不可用服務 (${results.failed.length}):`)
  results.failed.forEach(item => {
    logger.info(`  - ${item.server}: ${item.error}`)
  })

  return results
}

// 執行測試
if (require.main === module) {
  testRealMCPServices()
    .then(results => {
      logger.success('🎉 測試完成!')
      process.exit(0)
    })
    .catch(error => {
      logger.error('💥 測試失敗:', error)
      process.exit(1)
    })
}

module.exports = { testRealMCPServices }
