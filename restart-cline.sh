#!/bin/bash

echo "🔄 重新配置 Cline IDE..."

# 停止可能運行的 Claude 進程
echo "⏹️ 停止現有的 Claude 進程..."
pkill -f claude 2>/dev/null || true

# 確保 wrapper 腳本有正確權限
echo "🔧 設置 wrapper 腳本權限..."
chmod +x /Users/murs/.local/bin/claude-wrapper-cline

# 切換到專案目錄
echo "📁 切換到專案目錄..."
cd /Users/murs/Documents/mursfoto-cli

# 測試 Claude Code 連接
echo "🧪 測試 Claude Code 連接..."
if /Users/murs/.local/bin/claude-wrapper-cline --version; then
    echo "✅ Claude Code 連接正常"
else
    echo "❌ Claude Code 連接失敗"
    echo "請檢查認證狀態: claude auth status"
fi

echo "🎯 現在請："
echo "1. 關閉 VSCode (Cmd+Q)"  
echo "2. 重新開啟 VSCode"
echo "3. 開啟 mursfoto-cli 專案資料夾"
echo "4. 開啟 Cline IDE (左側面板)"
echo "5. 在 Cline 設置中確認："
echo "   - API Provider: claude-code"
echo "   - CLI Path: /Users/murs/.local/bin/claude-wrapper-cline" 
echo "   - Model: opus"
echo ""
echo "如果仍有問題，請執行: claude auth login"