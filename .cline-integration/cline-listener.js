/**
 * 🔗 Cline IDE 監聽器
 * 在 Cline IDE 中執行此腳本來處理 mursfoto-cli 的請求
 * 
 * 使用方式：在 Cline 聊天中貼上並執行此代碼
 */

const fs = require('fs');
const path = require('path');

console.log('🌟 啟動 Cline IDE 監聽器...');
console.log('📡 監聽來自 mursfoto-cli 的請求');

// 監聽目錄
const integrationDir = path.join(__dirname);

// 確保目錄存在
if (!fs.existsSync(integrationDir)) {
  fs.mkdirSync(integrationDir, { recursive: true });
  console.log(`📁 創建監聽目錄: ${integrationDir}`);
}

// 請求處理函數
async function processRequest(requestFile, responseFile, requestData) {
  console.log(`📨 收到請求 ID: ${requestData.id}`);
  console.log(`💬 提示詞: ${requestData.prompt.substring(0, 100)}...`);
  
  try {
    // 這裡我們假設 Cline IDE 可以處理 Claude Code 請求
    // 實際上您需要將這個提示詞發送給 Claude Code Provider
    
    console.log('🤖 正在處理請求...');
    
    // 請在這裡替換為實際的 Claude Code 調用
    // 例如：直接在 Cline 聊天中發送提示詞，然後將回應複製回來
    
    const response = {
      id: requestData.id,
      content: `這是來自 Cline IDE Claude Code Provider 的模擬回應。\n\n請求: ${requestData.prompt}\n\n實際使用時，請在 Cline 中手動發送提示詞並將回應內容放在這裡。`,
      timestamp: new Date().toISOString(),
      model: 'claude-code-via-cline'
    };
    
    // 寫入回應檔案
    fs.writeFileSync(responseFile, JSON.stringify(response, null, 2));
    
    console.log(`✅ 已回應請求 ID: ${requestData.id}`);
    
  } catch (error) {
    console.error(`❌ 處理請求失敗: ${error.message}`);
    
    // 寫入錯誤回應
    const errorResponse = {
      id: requestData.id,
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(responseFile, JSON.stringify(errorResponse, null, 2));
  }
}

// 監聽器主循環
function startListening() {
  console.log('🔄 開始監聽循環...');
  
  setInterval(() => {
    try {
      const files = fs.readdirSync(integrationDir);
      
      for (const file of files) {
        if (file.startsWith('request-') && file.endsWith('.json')) {
          const requestFile = path.join(integrationDir, file);
          const requestId = file.replace('request-', '').replace('.json', '');
          const responseFile = path.join(integrationDir, `response-${requestId}.json`);
          
          // 檢查是否已經處理過
          if (!fs.existsSync(responseFile)) {
            try {
              const requestData = JSON.parse(fs.readFileSync(requestFile, 'utf8'));
              
              // 非同步處理請求
              processRequest(requestFile, responseFile, requestData);
              
            } catch (parseError) {
              console.error(`❌ 解析請求檔案失敗: ${parseError.message}`);
            }
          }
        }
      }
    } catch (error) {
      console.error(`❌ 監聽錯誤: ${error.message}`);
    }
  }, 1000); // 每秒檢查一次
}

// 顯示使用說明
console.log(`
📋 使用說明:

1. 確保此腳本在 Cline IDE 中運行
2. 當 mursfoto-cli 發送請求時，您會看到相關訊息
3. 手動在 Cline 中發送提示詞給 Claude Code
4. 將 Claude 的回應複製並更新到回應檔案中

💡 提示: 
- 監聽目錄: ${integrationDir}
- 請求檔案格式: request-[timestamp].json
- 回應檔案格式: response-[timestamp].json

🚀 準備就緒！開始監聽...
`);

// 開始監聽
startListening();
