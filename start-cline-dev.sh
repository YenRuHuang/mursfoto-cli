#!/bin/bash
# mursfoto-cli Cline 開發環境啟動腳本

echo "🚀 啟動 mursfoto-cli Cline 開發環境..."

# 確保在正確目錄
cd /Users/murs/Documents/mursfoto-cli

# 設定環境變數
export CLAUDE_CODE_CONFIG_DIR="$HOME/.claude"
export CLAUDE_CODE_MAX_OUTPUT_TOKENS=8192
export CLINE_WORKING_DIR="/Users/murs/Documents/mursfoto-cli"

# 開啟 VSCode
code .

echo "✅ 開發環境已啟動！"
echo "📝 提示："
echo "  1. 在 Cline 中選擇 'claude-code' 作為 API Provider"
echo "  2. 使用 opus 模型以獲得最佳體驗"
echo "  3. 如遇到 prompt 過長，可以分步驟執行任務"
