#!/bin/bash

# {{projectName}} 企業級生產管理系統 - 快速啟動腳本
# 基於 FUCO Production System 成功經驗

echo "🏭 啟動 {{projectName}} 企業級生產管理系統"
echo "=" | tr -d '\n' && printf '%.0s=' {1..50} && echo

# 檢查 Node.js 版本
echo "🔍 檢查 Node.js 版本..."
if ! command -v node &> /dev/null; then
    echo "❌ 未檢測到 Node.js，請先安裝 Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2)
echo "✅ Node.js 版本: v$NODE_VERSION"

# 檢查 npm 版本
if ! command -v npm &> /dev/null; then
    echo "❌ 未檢測到 npm"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo "✅ npm 版本: $NPM_VERSION"

# 檢查是否存在 node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 安裝依賴項..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依賴項安裝失敗"
        exit 1
    fi
    echo "✅ 依賴項安裝完成"
else
    echo "✅ 依賴項已存在"
fi

# 檢查環境配置
if [ ! -f ".env" ]; then
    echo "⚙️  創建環境配置文件..."
    cp .env.example .env
    echo "✅ 已創建 .env 文件，您可以根據需要修改配置"
else
    echo "✅ 環境配置文件已存在"
fi

# 運行測試（可選）
echo "🧪 運行快速測試..."
npm run test:jwt
if [ $? -ne 0 ]; then
    echo "⚠️  測試失敗，但系統仍可運行"
else
    echo "✅ 系統測試通過"
fi

echo ""
echo "🚀 啟動開發服務器..."
echo "📍 伺服器地址: http://localhost:8847"
echo "🔐 預設登入: admin / admin123"
echo ""
echo "按 Ctrl+C 停止服務器"
echo ""

# 啟動服務器
npm start
