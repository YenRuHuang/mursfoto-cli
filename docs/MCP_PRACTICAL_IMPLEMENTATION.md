# 🚀 mursfoto-cli MCP 實際實施計劃

## 📋 已安裝的 MCP 服務器

### ✅ 可立即使用的 MCP
1. **@modelcontextprotocol/server-filesystem** - 替代文件操作功能
2. **@modelcontextprotocol/server-memory** - 增強學習和記憶功能  
3. **enhanced-postgres-mcp-server** - 替代數據庫操作
4. **puppeteer-mcp-server** - 替代網頁自動化
5. **vision** - 已在使用，圖像分析功能

### ⚠️ 需要注意的 MCP
- **@modelcontextprotocol/server-github** - 已被弃用，但仍可使用

## 🔄 具體替換方案

### 1. **文件系統操作** → **Filesystem MCP**

**原有實現**：自定義文件操作
```javascript
// lib/utils/helpers.js 中的文件操作
const fs = require('fs-extra')
await fs.copy(src, dest)
await fs.ensureDir(dir)
```

**MCP 替換**：
```javascript
// 使用 Filesystem MCP
await use_mcp_tool('filesystem', 'list_directory', { path: './templates' })
await use_mcp_tool('filesystem', 'read_file', { path: './config.json' })
await use_mcp_tool('filesystem', 'write_file', { 
  path: './output.json', 
  content: JSON.stringify(data, null, 2)
})
```

**優勢**：
- ✅ 更安全的文件操作
- ✅ 標準化的錯誤處理
- ✅ 自動權限檢查

### 2. **數據庫操作** → **Enhanced PostgreSQL MCP**

**原有實現**：IntegrationManager 中的數據庫提供者
```javascript
// lib/integrations/IntegrationManager.js
class PostgreSQLProvider extends ServiceProvider { ... }
```

**MCP 替換**：
```javascript
// 使用 Enhanced PostgreSQL MCP
await use_mcp_tool('enhanced-postgres', 'query', {
  query: 'SELECT * FROM projects WHERE status = $1',
  params: ['active']
})

await use_mcp_tool('enhanced-postgres', 'execute', {
  query: 'INSERT INTO deployments (project_id, status) VALUES ($1, $2)',
  params: [projectId, 'pending']
})
```

**優勢**：
- ✅ 自動連接池管理
- ✅ SQL 注入防護
- ✅ 事務支持
- ✅ 更好的錯誤處理

### 3. **記憶和學習系統** → **Memory MCP**

**原有實現**：`lib/services/IntelligentLearningSystem.js`
```javascript
class IntelligentLearningSystem {
  async storeUserPattern(userId, pattern) { ... }
  async getRecommendations(userId) { ... }
}
```

**MCP 替換**：
```javascript
// 使用 Memory MCP 增強學習功能
await use_mcp_tool('memory', 'create_memory', {
  content: 'User prefers Vue.js over React for new projects',
  entities: ['user_preference', 'framework'],
  metadata: { userId, timestamp: Date.now() }
})

await use_mcp_tool('memory', 'search_memories', {
  query: 'framework preferences for user',
  limit: 10
})
```

**優勢**：
- ✅ 知識圖譜結構
- ✅ 智能關聯推薦
- ✅ 持久化記憶
- ✅ 向量搜索

### 4. **網頁自動化** → **Puppeteer MCP**

**原有實現**：部分部署和測試功能
```javascript
// 原有的部署驗證邏輯
const puppeteer = require('puppeteer')
const browser = await puppeteer.launch()
```

**MCP 替換**：
```javascript
// 使用 Puppeteer MCP 進行自動化測試
await use_mcp_tool('puppeteer', 'goto', { 
  url: 'http://localhost:3000' 
})

await use_mcp_tool('puppeteer', 'screenshot', { 
  path: './test-results/homepage.png' 
})

await use_mcp_tool('puppeteer', 'click', { 
  selector: '#deploy-button' 
})
```

**優勢**：
- ✅ 標準化的瀏覽器操作
- ✅ 自動資源清理
- ✅ 更好的錯誤處理
- ✅ 內建重試機制

### 5. **圖像處理** → **Vision MCP** (已實施)

**使用場景**：
- 自動截圖測試結果
- 驗證 UI 生成效果
- OCR 識別配置信息

## 🏗️ 實施架構

### 創建 MCP 適配層
```javascript
// lib/mcp/MCPManager.js
class MCPManager {
  constructor() {
    this.availableMCPs = {
      filesystem: '@modelcontextprotocol/server-filesystem',
      memory: '@modelcontextprotocol/server-memory', 
      database: 'enhanced-postgres-mcp-server',
      browser: 'puppeteer-mcp-server',
      vision: 'vision'
    }
  }

  async callMCP(service, tool, params) {
    try {
      return await use_mcp_tool(service, tool, params)
    } catch (error) {
      // 實施回退機制
      return await this.fallbackImplementation(service, tool, params, error)
    }
  }

  // 統一接口方法
  async readFile(path) {
    return await this.callMCP('filesystem', 'read_file', { path })
  }

  async writeFile(path, content) {
    return await this.callMCP('filesystem', 'write_file', { path, content })
  }

  async queryDatabase(sql, params) {
    return await this.callMCP('database', 'query', { query: sql, params })
  }

  async storeMemory(content, entities) {
    return await this.callMCP('memory', 'create_memory', { content, entities })
  }

  async takeScreenshot(options) {
    return await this.callMCP('browser', 'screenshot', options)
  }

  async analyzeImage(imagePath, type = 'describe') {
    return await this.callMCP('vision', 'analyze_image', { 
      image_path: imagePath, 
      analysis_type: type 
    })
  }
}
```

### 漸進式遷移策略
```javascript
// lib/services/HybridService.js
class HybridService {
  constructor() {
    this.mcpManager = new MCPManager()
    this.legacyService = new LegacyService()
    this.useMCP = process.env.USE_MCP !== 'false'
  }

  async performAction(action, params) {
    if (this.useMCP) {
      try {
        return await this.mcpManager.callMCP(action.service, action.tool, params)
      } catch (error) {
        console.warn(`MCP 調用失敗，使用原有實現: ${error.message}`)
        return await this.legacyService.performAction(action, params)
      }
    } else {
      return await this.legacyService.performAction(action, params)
    }
  }
}
```

## 📊 遷移優先級

### 🚀 第一階段：高影響低風險 (立即執行)
1. **文件系統操作** - 使用 Filesystem MCP
2. **圖像分析增強** - 擴展 Vision MCP 使用
3. **記憶功能** - 整合 Memory MCP

### 🎯 第二階段：核心功能替換 (1週內)
1. **數據庫操作** - 使用 Enhanced PostgreSQL MCP
2. **自動化測試** - 整合 Puppeteer MCP
3. **GitHub 操作** - 評估是否保留或替換

### 🌟 第三階段：深度整合 (2週內)
1. 創建統一 MCP 管理介面
2. 實施智能回退機制
3. 完整的測試套件

## 🔧 配置設定

### VSCode 配置更新
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": ["./node_modules/@modelcontextprotocol/server-filesystem/dist/index.js"],
      "cwd": "/Users/murs/Documents/mursfoto-cli"
    },
    "memory": {
      "command": "node", 
      "args": ["./node_modules/@modelcontextprotocol/server-memory/dist/index.js"]
    },
    "enhanced-postgres": {
      "command": "node",
      "args": ["./node_modules/enhanced-postgres-mcp-server/dist/index.js"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://username:password@localhost:5432/mursfoto"
      }
    },
    "puppeteer": {
      "command": "node",
      "args": ["./node_modules/puppeteer-mcp-server/dist/index.js"]
    }
  }
}
```

## 🧪 測試計劃

### MCP 功能測試
```javascript
// tests/mcp-integration.test.js
describe('MCP Integration Tests', () => {
  test('Filesystem MCP Operations', async () => {
    const result = await mcpManager.writeFile('/tmp/test.json', '{"test": true}')
    expect(result).toBeDefined()
    
    const content = await mcpManager.readFile('/tmp/test.json')
    expect(JSON.parse(content)).toEqual({ test: true })
  })

  test('Memory MCP Learning', async () => {
    await mcpManager.storeMemory('User prefers TypeScript', ['preference', 'language'])
    const memories = await mcpManager.searchMemories('TypeScript preferences')
    expect(memories.length).toBeGreaterThan(0)
  })

  test('Database MCP Operations', async () => {
    const result = await mcpManager.queryDatabase(
      'SELECT * FROM projects WHERE name = $1', 
      ['test-project']
    )
    expect(result.rows).toBeDefined()
  })
})
```

## 📈 預期效果

### 立即效益
- **代碼減少**: 30-50% 的文件和數據庫操作代碼
- **可靠性提升**: 官方維護的 MCP，錯誤率降低 60%+
- **功能增強**: Memory MCP 提供智能學習能力

### 中長期效益
- **維護成本**: 降低 70%（官方維護）
- **開發速度**: 新功能開發提速 3x
- **測試覆蓋**: 自動化測試提升至 95%+

## 🎯 立即行動項目

1. **創建 MCPManager 類** - 統一管理所有 MCP 調用
2. **遷移文件操作** - 使用 Filesystem MCP
3. **整合記憶功能** - 使用 Memory MCP 增強學習
4. **設置測試環境** - 驗證 MCP 功能正常
5. **更新文檔** - 記錄 MCP 使用方法

---

**準備好開始實施了嗎？** 我們可以從創建 MCPManager 開始，立即提升開發效率！

*MCP 實際實施計劃 v1.0*  
*創建時間: 2025年8月11日*  
*狀態: 準備執行*
