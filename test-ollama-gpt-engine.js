#!/usr/bin/env node

const fs = require('fs');
const https = require('http'); // 使用 http 因為是本地 localhost

console.log('🧪 測試 Ollama GPT 本地引擎');
console.log('=' .repeat(50));

// 載入配置
let config;
try {
  config = JSON.parse(fs.readFileSync('ollama-gpt-config.json', 'utf8'));
  console.log('✅ 配置文件載入成功');
  console.log(`   模型: ${config.model_info.name}`);
  console.log(`   大小: ${config.model_info.size}`);
  console.log(`   參數: ${config.model_info.parameters}`);
} catch (error) {
  console.error('❌ 配置文件載入失敗:', error.message);
  process.exit(1);
}

// 測試函數
async function testOllamaAPI() {
  console.log('\n🔍 測試 API 連接...');
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: config.engine.model,
      prompt: '請用繁體中文回答：你是誰？',
      stream: false
    });

    const options = {
      hostname: 'localhost',
      port: 11434,
      path: '/api/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ API 連接成功');
          console.log(`   回應: ${response.response}`);
          if (response.thinking) {
            console.log(`   思考過程: ${response.thinking}`);
          }
          console.log(`   總耗時: ${(response.total_duration / 1000000000).toFixed(2)}秒`);
          resolve(response);
        } catch (error) {
          console.error('❌ 解析回應失敗:', error.message);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ API 請求失敗:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// 測試健康檢查
async function testHealth() {
  console.log('\n🏥 測試健康狀態...');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 11434,
      path: '/api/version',
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ 健康檢查通過');
          console.log(`   版本: ${response.version}`);
          resolve(response);
        } catch (error) {
          console.error('❌ 健康檢查失敗:', error.message);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ 健康檢查請求失敗:', error.message);
      reject(error);
    });

    req.end();
  });
}

// 測試模型列表
async function testModels() {
  console.log('\n📋 測試模型列表...');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 11434,
      path: '/api/tags',
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ 模型列表獲取成功');
          if (response.models && response.models.length > 0) {
            response.models.forEach((model, index) => {
              console.log(`   ${index + 1}. ${model.name} (${(model.size / 1024 / 1024 / 1024).toFixed(1)}GB)`);
            });
          }
          resolve(response);
        } catch (error) {
          console.error('❌ 模型列表獲取失敗:', error.message);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ 模型列表請求失敗:', error.message);
      reject(error);
    });

    req.end();
  });
}

// 主測試流程
async function runTests() {
  try {
    await testHealth();
    await testModels();
    await testOllamaAPI();
    
    console.log('\n🎉 所有測試通過！');
    console.log('✨ Ollama GPT 本地引擎配置完成');
    console.log('\n📖 使用方式:');
    console.log('   1. 確保 Ollama 服務運行: ollama serve');
    console.log('   2. 載入模型: ollama run gpt-oss:20b');
    console.log('   3. API 端點: http://localhost:11434');
    console.log('   4. 使用配置: ollama-gpt-config.json');
    
  } catch (error) {
    console.error('\n💥 測試失敗:', error.message);
    process.exit(1);
  }
}

// 執行測試
if (require.main === module) {
  runTests();
}

module.exports = {
  testOllamaAPI,
  testHealth,
  testModels,
  config
};
