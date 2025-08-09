#!/usr/bin/env node
/**
 * 🧪 測試 Anthropic API 連接
 */
require('dotenv').config();

async function testAnthropicAPI() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.error('❌ 未找到 ANTHROPIC_API_KEY 環境變數');
    process.exit(1);
  }
  
  console.log('🔑 API Key 找到，開始測試...');
  console.log(`📝 使用模型: claude-sonnet-4-20250514`);
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: '你好！請簡短回應確認 API 連接正常。'
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`❌ API 調用失敗: ${response.status} ${response.statusText}`);
      console.error('錯誤詳情:', errorData);
      process.exit(1);
    }

    const data = await response.json();
    console.log('✅ Anthropic API 連接成功！');
    console.log('🤖 Claude 回應:', data.content[0].text);
    console.log('📊 使用 tokens:', data.usage);
    
  } catch (error) {
    console.error('❌ API 測試失敗:', error.message);
    process.exit(1);
  }
}

testAnthropicAPI();
