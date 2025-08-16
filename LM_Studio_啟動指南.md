# 🚀 LM Studio gpt-oss-20b 啟動指南

## 📋 目錄
1. [GUI 方式啟動（推薦）](#gui-方式啟動推薦)
2. [CLI 方式啟動（進階）](#cli-方式啟動進階)
3. [驗證服務是否運行](#驗證服務是否運行)
4. [故障排除](#故障排除)

---

## 🖥️ GUI 方式啟動（推薦）

### **步驟 1: 開啟 LM Studio**
```bash
# macOS
open -a "LM Studio"

# 或直接從 Applications 資料夾啟動
```

### **步驟 2: 載入 gpt-oss-20b 模型**
1. 點擊左側的 **"Models"** 標籤
2. 在搜尋欄輸入 `unsloth/gpt-oss-20b-GGUF`
3. 下載並等待模型載入完成

### **步驟 3: 啟動 Local Server**
1. 點擊左側的 **"Local Server"** 標籤
2. 選擇 `unsloth/gpt-oss-20b-GGUF` 模型
3. 點擊 **"Start Server"** 按鈕
4. 確認服務運行在 `http://localhost:1234`

---

## ⌨️ CLI 方式啟動（進階）

### **方法 1: 使用 LM Studio CLI**

LM Studio 提供了命令列工具，可以在 Terminal 中使用：

```bash
# 檢查 LM Studio CLI 是否可用
lms --help

# 如果 lms 命令不存在，需要先設定 PATH
echo 'export PATH="/Applications/LM Studio.app/Contents/Resources:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**啟動模型服務：**
```bash
# 啟動 Local Server（背景執行）
lms serve unsloth/gpt-oss-20b-GGUF --port 1234 --host 0.0.0.0

# 或者前景執行（可以看到日誌）
lms serve unsloth/gpt-oss-20b-GGUF --port 1234 --verbose
```

### **方法 2: 使用官方 CLI 工具**

```bash
# 安裝 LM Studio CLI（如果沒有的話）
curl -fsSL https://lmstudio.ai/install.sh | sh

# 啟動模型
lm studio serve unsloth/gpt-oss-20b-GGUF
```

### **方法 3: 直接調用 LM Studio**

```bash
# macOS - 通過 CLI 啟動 LM Studio 並自動載入模型
/Applications/LM\ Studio.app/Contents/MacOS/LM\ Studio --serve --model="unsloth/gpt-oss-20b-GGUF" --port=1234
```

---

## 🔍 驗證服務是否運行

### **快速檢查腳本**

創建一個快速檢查腳本：

```bash
# 創建檢查腳本
cat > check-lm-studio.sh << 'EOF'
#!/bin/bash

echo "🔍 檢查 LM Studio 服務狀態..."

# 檢查端口是否開放
if nc -z localhost 1234 2>/dev/null; then
    echo "✅ Port 1234 已開放"
else
    echo "❌ Port 1234 未開放"
    exit 1
fi

# 檢查 API 端點
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:1234/v1/models)
if [ "$response" = "200" ]; then
    echo "✅ LM Studio API 正常運行"
    echo "📋 可用模型："
    curl -s http://localhost:1234/v1/models | jq -r '.data[].id' 2>/dev/null || echo "   (無法解析 JSON，但 API 可用)"
else
    echo "❌ LM Studio API 無回應 (HTTP: $response)"
    exit 1
fi

echo "🎉 LM Studio 服務運行正常！"
EOF

chmod +x check-lm-studio.sh
```

**執行檢查：**
```bash
./check-lm-studio.sh
```

### **使用 mursfoto-cli 測試**

```bash
# 執行我們的整合測試
cd mursfoto-cli
node test-lm-studio-integration.js
```

### **手動 API 測試**

```bash
# 測試模型列表
curl http://localhost:1234/v1/models

# 測試聊天功能
curl -X POST http://localhost:1234/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "unsloth/gpt-oss-20b-GGUF",
    "messages": [
      {"role": "user", "content": "Hello! Test message in Traditional Chinese: 你好"}
    ],
    "temperature": 0.7,
    "max_tokens": 100
  }'
```

---

## 🛠️ 故障排除

### **問題 1: 找不到 `lms` 命令**

```bash
# 解決方案 1: 找到 LM Studio 安裝路徑
find /Applications -name "*LM Studio*" -type d 2>/dev/null

# 解決方案 2: 創建別名
echo 'alias lms="/Applications/LM\ Studio.app/Contents/Resources/lms"' >> ~/.zshrc
source ~/.zshrc
```

### **問題 2: Port 1234 被佔用**

```bash
# 檢查誰在使用 port 1234
lsof -i :1234

# 殺掉佔用的程序
kill -9 $(lsof -ti:1234)

# 使用不同端口啟動
lms serve unsloth/gpt-oss-20b-GGUF --port 1235
```

### **問題 3: 模型載入失敗**

```bash
# 檢查可用記憶體
vm_stat | grep free

# 檢查 GPU 記憶體（如果有）
system_profiler SPDisplaysDataType | grep VRAM
```

### **問題 4: API 無回應**

```bash
# 檢查 LM Studio 日誌
tail -f ~/Library/Logs/LM\ Studio/main.log

# 重新啟動服務
pkill -f "LM Studio"
open -a "LM Studio"
```

---

## 🚀 自動化啟動腳本

創建一個一鍵啟動腳本：

```bash
# 創建自動啟動腳本
cat > start-lm-studio.sh << 'EOF'
#!/bin/bash

echo "🚀 自動啟動 LM Studio gpt-oss-20b..."

# 檢查是否已經運行
if nc -z localhost 1234 2>/dev/null; then
    echo "✅ LM Studio 已經在運行"
    exit 0
fi

echo "📦 啟動 LM Studio..."

# 方法 1: 嘗試 GUI 方式
if [ -d "/Applications/LM Studio.app" ]; then
    echo "🖥️  使用 GUI 模式啟動..."
    open -a "LM Studio"
    
    # 等待啟動
    echo "⏳ 等待 LM Studio 啟動..."
    for i in {1..30}; do
        if nc -z localhost 1234 2>/dev/null; then
            echo "✅ LM Studio 啟動成功！"
            break
        fi
        sleep 2
        echo "   等待中... ($i/30)"
    done
else
    echo "❌ 找不到 LM Studio 應用程式"
    exit 1
fi

# 最終檢查
if nc -z localhost 1234 2>/dev/null; then
    echo "🎉 LM Studio gpt-oss-20b 服務已就緒！"
    echo "🔗 API 端點: http://localhost:1234"
    echo "🧪 執行測試: cd mursfoto-cli && node test-lm-studio-integration.js"
else
    echo "❌ 服務啟動失敗，請手動檢查"
    exit 1
fi
EOF

chmod +x start-lm-studio.sh
```

**使用自動啟動腳本：**
```bash
./start-lm-studio.sh
```

---

## 📝 **總結**

### **推薦工作流程：**

1. **GUI 方式（最簡單）:**
   ```bash
   open -a "LM Studio"
   # 在 GUI 中: Models → 載入 gpt-oss-20b → Local Server → Start Server
   ```

2. **自動化方式:**
   ```bash
   ./start-lm-studio.sh
   ```

3. **驗證服務:**
   ```bash
   ./check-lm-studio.sh
   ```

4. **測試整合:**
   ```bash
   cd mursfoto-cli
   node test-lm-studio-integration.js
   ```

**🎯 注意：雖然 LM Studio 有 CLI 功能，但 GUI 方式是最穩定和推薦的方法，特別是對於模型載入和管理。**
