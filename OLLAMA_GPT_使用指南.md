# 🤖 Ollama GPT 本地引擎使用指南

## 🎉 配置完成狀態

### ✅ **配置驗證結果**
- **健康檢查:** ✅ 通過（版本 0.11.2）
- **模型狀態:** ✅ gpt-oss:20b (12.8GB) 已就緒
- **API 連接:** ✅ http://localhost:11434 正常運作
- **中文支持:** ✅ 繁體中文回應完美
- **回應時間:** 57.24 秒（首次載入）

## 📁 **配置文件說明**

### `ollama-gpt-config.json` - 引擎配置
```json
{
  "name": "Ollama GPT Local Engine",
  "engine": {
    "provider": "ollama",
    "baseURL": "http://localhost:11434",
    "model": "gpt-oss:20b"
  },
  "settings": {
    "temperature": 0.7,
    "max_tokens": 4096,
    "top_p": 0.9,
    "stream": false
  }
}
```

### `test-ollama-gpt-engine.js` - 測試腳本
- 健康檢查測試
- 模型列表驗證
- API 連接測試
- 中文回應測試

## 🚀 **使用方式**

### 1. **啟動 Ollama 服務**
```bash
# 背景運行 Ollama 服務
ollama serve

# 或者直接運行模型（會自動啟動服務）
ollama run gpt-oss:20b
```

### 2. **API 調用方式**

#### **使用 curl 測試**
```bash
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-oss:20b",
    "prompt": "請用中文回答：什麼是人工智能？",
    "stream": false
  }'
```

#### **使用 Node.js**
```javascript
const http = require('http');

const postData = JSON.stringify({
  model: 'gpt-oss:20b',
  prompt: '請幫我寫一個 Hello World 程式',
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

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const response = JSON.parse(data);
    console.log('回應:', response.response);
  });
});

req.write(postData);
req.end();
```

#### **使用 Python**
```python
import requests
import json

url = "http://localhost:11434/api/generate"
data = {
    "model": "gpt-oss:20b",
    "prompt": "請用中文解釋機器學習",
    "stream": False
}

response = requests.post(url, json=data)
result = response.json()
print("回應:", result["response"])
```

### 3. **運行測試腳本**
```bash
# 執行完整測試
node test-ollama-gpt-engine.js

# 輸出範例
🧪 測試 Ollama GPT 本地引擎
==================================================
✅ 配置文件載入成功
✅ 健康檢查通過
✅ 模型列表獲取成功
✅ API 連接成功
🎉 所有測試通過！
```

## 🔧 **進階設定**

### **支援的 API 端點**
- `/api/generate` - 文本生成
- `/api/chat` - 對話模式  
- `/api/tags` - 模型列表
- `/api/version` - 版本資訊
- `/api/show` - 模型詳情

### **參數調整**
```json
{
  "temperature": 0.7,    // 創造力 (0.0-2.0)
  "max_tokens": 4096,    // 最大輸出長度
  "top_p": 0.9,         // 核採樣
  "top_k": 40,          // Top-K 採樣
  "repeat_penalty": 1.1  // 重複懲罰
}
```

### **串流回應**
```javascript
// 啟用串流模式
const data = {
  model: 'gpt-oss:20b',
  prompt: '請詳細解釋...',
  stream: true  // 啟用串流
};
```

## 📊 **性能優化**

### **系統需求**
- **記憶體:** 至少 16GB RAM（推薦 32GB）
- **GPU:** 支援 CUDA/ROCm（可選，顯著加速）
- **存儲:** 至少 15GB 可用空間
- **CPU:** 多核處理器（推薦 8+ 核心）

### **加速設定**
```bash
# 使用 GPU 加速（如果有 NVIDIA GPU）
export OLLAMA_GPU_ENABLED=true

# 調整並發設定
export OLLAMA_NUM_PARALLEL=4
export OLLAMA_MAX_QUEUE=512
```

## 🛠️ **故障排除**

### **常見問題**

#### 1. **連接失敗**
```bash
# 檢查服務狀態
curl http://localhost:11434/api/version

# 重新啟動服務
ollama serve
```

#### 2. **模型未載入**
```bash
# 確認模型存在
ollama list

# 手動載入模型
ollama run gpt-oss:20b
```

#### 3. **記憶體不足**
```bash
# 檢查系統資源
htop
free -h

# 清理其他進程或重啟系統
```

#### 4. **回應緩慢**
- 首次載入需要較長時間（正常）
- 後續請求會更快
- 考慮使用 GPU 加速

## 🔄 **整合應用**

### **與 Cline 整合**
```json
// 在 settings.json 中配置
{
  "cline.api.provider": "ollama",
  "cline.api.baseUrl": "http://localhost:11434",
  "cline.api.model": "gpt-oss:20b"
}
```

### **與其他工具整合**
- **VS Code Extensions:** 配置本地 AI 助手
- **Jupyter Notebooks:** 作為代碼生成助手
- **命令行工具:** 創建自定義 CLI 助手
- **Web 應用:** 作為後端 AI 服務

## 🎯 **實際應用場景**

### **開發助手**
- 代碼生成和補全
- Bug 修復建議
- 文檔撰寫
- 代碼重構建議

### **內容創作**
- 技術文章撰寫
- API 文檔生成
- 使用者手冊編寫
- 多語言翻譯

### **學習和研究**
- 程式概念解釋
- 最佳實踐推薦
- 技術問題解答
- 學習路徑規劃

## 🔒 **隱私和安全**

### **本地運行優勢**
- ✅ **完全離線:** 無需網際網路連接
- ✅ **數據隱私:** 所有處理在本地進行
- ✅ **無限使用:** 沒有 API 調用限制
- ✅ **自主控制:** 完全掌控模型和數據

### **安全建議**
- 定期更新 Ollama 版本
- 監控系統資源使用
- 備份重要模型和配置
- 注意防火牆設定（本地服務）

---

## 🎉 **配置完成總結**

🎯 **您的 Ollama GPT 本地引擎已經完全配置好並可以使用！**

### **配置檔案位置:**
- `ollama-gpt-config.json` - 主要配置
- `test-ollama-gpt-engine.js` - 測試腳本
- `OLLAMA_GPT_使用指南.md` - 本指南

### **快速開始:**
```bash
# 1. 啟動服務（如果未運行）
ollama serve

# 2. 測試配置
node test-ollama-gpt-engine.js

# 3. 開始使用
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-oss:20b", "prompt": "Hello!", "stream": false}'
```

**🚀 享受您的本地 AI 助手！**
