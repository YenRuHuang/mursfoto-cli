#!/bin/bash

echo "🔄 更新 Claude Code OAuth Token..."

# 新的 Token
NEW_TOKEN="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"

# 更新環境變數
export CLAUDE_CODE_OAUTH_TOKEN="$NEW_TOKEN"

# 更新 wrapper 腳本
cat > /Users/murs/.local/bin/claude-wrapper-cline << EOF
#!/bin/bash
# Claude Code Wrapper for Cline - Updated Token
export CLAUDE_CODE_CONFIG_DIR="\$HOME/.claude"
export CLAUDE_CODE_MAX_OUTPUT_TOKENS=8192
export CLAUDE_CODE_MAX_CONTEXT_SIZE=100000
export CLAUDE_CODE_OAUTH_TOKEN="$NEW_TOKEN"

# 確保在正確的工作目錄
cd /Users/murs/Documents/mursfoto-cli

# 執行 Claude
exec /Users/murs/.local/bin/claude "\$@"
EOF

chmod +x /Users/murs/.local/bin/claude-wrapper-cline

echo "✅ Token 已更新！"
echo "🎯 現在請："
echo "1. 重新載入 VSCode (Cmd+Shift+P → Developer: Reload Window)"
echo "2. 在 Cline IDE 中測試訊息"