#!/usr/bin/env node

/**
 * 🚀 Ollama GPT 本地引擎使用範例
 * 這個檔案展示了如何使用您配置好的 Ollama GPT 引擎
 */

const http = require('http');
const readline = require('readline');

// 配置
const OLLAMA_CONFIG = {
  host: 'localhost',
  port: 11434,
  model: 'gpt-oss:20b'
};

console.log('🤖 歡迎使用 Ollama GPT 本地引擎！');
console.log('模型：', OLLAMA_CONFIG.model);
console.log('端點：', `http://${OLLAMA_CONFIG.host}:${OLLAMA_CONFIG.port}`);
console.log('-'.repeat(50));

/**
 * 1. 簡單的 API 調用函數
 */
async function askOllama(prompt, temperature = 0.7) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: OLLAMA_CONFIG.model,
      prompt: prompt,
      stream: false,
      options: {
        temperature: temperature,
        top_p: 0.9,
        top_k: 40
      }
    });

    const options = {
      hostname: OLLAMA_CONFIG.host,
      port: OLLAMA_CONFIG.port,
      path: '/api/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            response: response.response,
            thinking: response.thinking || null,
            duration: response.total_duration ? (response.total_duration / 1000000000).toFixed(2) : 'unknown'
          });
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => reject(error));
    req.write(postData);
    req.end();
  });
}

/**
 * 2. 互動式聊天模式
 */
async function startChatMode() {
  console.log('\n💬 進入聊天模式（輸入 "exit" 退出）');
  console.log('🔥 提示：您可以用中文或英文與 AI 對話');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const chat = () => {
    rl.question('\n您: ', async (input) => {
      if (input.toLowerCase() === 'exit') {
        console.log('👋 再見！');
        rl.close();
        return;
      }

      if (input.trim() === '') {
        chat();
        return;
      }

      console.log('🤖 AI 思考中...');
      
      try {
        const result = await askOllama(input);
        console.log(`\n🤖 AI: ${result.response}`);
        if (result.thinking) {
          console.log(`💭 思考過程: ${result.thinking.substring(0, 100)}...`);
        }
        console.log(`⏱️  用時: ${result.duration}秒`);
      } catch (error) {
        console.error('❌ 錯誤:', error.message);
      }

      chat();
    });
  };

  chat();
}

/**
 * 3. 批量處理範例
 */
async function batchProcessing() {
  console.log('\n📝 批量處理範例');
  
  const tasks = [
    '請用一句話解釋什麼是機器學習',
    '寫一個簡單的 Hello World JavaScript 函數',
    '推薦三本程式設計入門書籍',
    '解釋什麼是 API',
    '用繁體中文寫一個感謝的句子'
  ];

  for (let i = 0; i < tasks.length; i++) {
    console.log(`\n[${i + 1}/${tasks.length}] 處理: ${tasks[i]}`);
    
    try {
      const result = await askOllama(tasks[i]);
      console.log(`✅ 回答: ${result.response}`);
      console.log(`⏱️ 用時: ${result.duration}秒`);
    } catch (error) {
      console.error(`❌ 錯誤: ${error.message}`);
    }
  }
}

/**
 * 4. 程式碼生成範例
 */
async function codeGeneration() {
  console.log('\n💻 程式碼生成範例');

  const codePrompts = [
    '寫一個 Python 函數來計算費波那契數列',
    '創建一個簡單的 HTML 表單',
    '寫一個 JavaScript 函數來驗證 email 格式'
  ];

  for (const prompt of codePrompts) {
    console.log(`\n📝 請求: ${prompt}`);
    
    try {
      const result = await askOllama(prompt, 0.3); // 較低溫度，更精確
      console.log('📄 生成的程式碼:');
      console.log('-'.repeat(30));
      console.log(result.response);
      console.log('-'.repeat(30));
      console.log(`⏱️ 用時: ${result.duration}秒`);
    } catch (error) {
      console.error(`❌ 錯誤: ${error.message}`);
    }
  }
}

/**
 * 5. 翻譯服務範例
 */
async function translationService() {
  console.log('\n🌍 翻譯服務範例');

  const translations = [
    { text: 'Hello, how are you?', from: 'English', to: 'Traditional Chinese' },
    { text: '今天天氣很好', from: 'Traditional Chinese', to: 'English' },
    { text: 'Machine learning is fascinating', from: 'English', to: 'Traditional Chinese' }
  ];

  for (const item of translations) {
    const prompt = `請將以下${item.from}翻譯成${item.to}：「${item.text}」`;
    console.log(`\n📝 ${item.from} → ${item.to}: ${item.text}`);
    
    try {
      const result = await askOllama(prompt);
      console.log(`✅ 翻譯結果: ${result.response}`);
      console.log(`⏱️ 用時: ${result.duration}秒`);
    } catch (error) {
      console.error(`❌ 錯誤: ${error.message}`);
    }
  }
}

/**
 * 主選單
 */
function showMenu() {
  console.log('\n🎯 請選擇使用模式：');
  console.log('1. 💬 互動式聊天');
  console.log('2. 📝 批量處理範例');
  console.log('3. 💻 程式碼生成範例');
  console.log('4. 🌍 翻譯服務範例');
  console.log('5. 🧪 測試 API 連接');
  console.log('0. 退出');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('\n請輸入選項 (0-5): ', async (choice) => {
    rl.close();

    switch (choice) {
      case '1':
        await startChatMode();
        break;
      case '2':
        await batchProcessing();
        showMenu();
        break;
      case '3':
        await codeGeneration();
        showMenu();
        break;
      case '4':
        await translationService();
        showMenu();
        break;
      case '5':
        console.log('\n🧪 測試 API 連接...');
        try {
          const result = await askOllama('你好，請回應確認API正常工作');
          console.log(`✅ API 正常: ${result.response}`);
          console.log(`⏱️ 用時: ${result.duration}秒`);
        } catch (error) {
          console.error(`❌ API 錯誤: ${error.message}`);
        }
        showMenu();
        break;
      case '0':
        console.log('👋 感謝使用！');
        process.exit(0);
        break;
      default:
        console.log('❌ 無效選項，請重新選擇');
        showMenu();
    }
  });
}

// 啟動應用
if (require.main === module) {
  showMenu();
}

module.exports = { askOllama };
