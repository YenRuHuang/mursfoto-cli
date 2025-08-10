#!/bin/bash

echo "🔧 修復 mursfoto-cli 中的 Claude Code 認證問題..."

# 1. 清除過期的環境變數
echo "🧹 清除過期的認證資訊..."
unset CLAUDE_CODE_OAUTH_TOKEN
unset ANTHROPIC_API_KEY
unset CLAUDE_API_KEY

# 2. 清理 shell 配置檔案中的過期 token
echo "📝 清理 shell 配置檔案..."
for file in ~/.bashrc ~/.zshrc ~/.bash_profile ~/.zprofile ~/.profile; do
    if [ -f "$file" ]; then
        # 備份原始檔案
        cp "$file" "$file.bak.$(date +%s)" 2>/dev/null
        
        # 移除過期的 token
        grep -v "CLAUDE_CODE_OAUTH_TOKEN" "$file" > "$file.tmp" 2>/dev/null && mv "$file.tmp" "$file"
        grep -v "sk-ant-oat01" "$file" > "$file.tmp" 2>/dev/null && mv "$file.tmp" "$file"
        
        echo "  ✓ 已清理 $file"
    fi
done

# 3. 清理可能的快取
echo "🗂️ 清理認證快取..."
rm -rf ~/.claude/.anthropic/claude-code/cache 2>/dev/null

# 4. 重新設定環境
echo "⚙️ 重新設定環境..."
export CLAUDE_CODE_CONFIG_DIR="$HOME/.claude"

echo ""
echo "✅ 認證清理完成！"
echo ""
echo "🎯 下一步："
echo "  請執行以下命令重新認證："
echo "  claude auth login"
echo ""
echo "💡 或者使用直接的 Anthropic API："
echo "  1. 在 Cline 設定中將 API Provider 改為 'anthropic'"
echo "  2. 使用您的 Anthropic API Key"