#!/bin/bash
# UV 便利執行腳本 - 優化的 Python 專案執行方式

set -e  # 遇到錯誤時停止

echo "🚀 UV Python 專案執行器"
echo "========================="

# 檢查 UV 是否已安裝
if ! command -v uv &> /dev/null; then
    echo "❌ UV 未安裝！"
    echo "💡 請執行: curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

# 顯示可用的腳本選項
echo "📋 可用的執行選項："
echo "   1. gpt-transformers    - 主要 GPT Transformers 引擎"
echo "   2. quick-test         - 快速 GPU 測試"
echo "   3. lm-studio-client   - LM Studio 繁體中文客戶端"
echo "   4. custom             - 自定義腳本執行"
echo ""

# 讀取用戶選擇
read -p "請選擇要執行的腳本 (1-4): " choice

case $choice in
    1)
        echo "🔥 啟動 GPT Transformers 引擎..."
        echo "⚡ 使用 UV 加速環境管理..."
        uv run python gpt_oss_transformers.py
        ;;
    2)
        echo "🧪 執行快速 GPU 測試..."
        uv run python quick_test_transformers.py
        ;;
    3)
        echo "💬 啟動 LM Studio 繁體中文客戶端..."
        uv run python lm_studio_繁體中文客戶端.py
        ;;
    4)
        read -p "請輸入 Python 腳本名稱: " script_name
        if [ -f "$script_name" ]; then
            echo "🏃 執行自定義腳本: $script_name"
            uv run python "$script_name"
        else
            echo "❌ 找不到檔案: $script_name"
            exit 1
        fi
        ;;
    *)
        echo "❌ 無效選擇！"
        exit 1
        ;;
esac

echo ""
echo "✅ 執行完成！"
echo "💡 提示：使用 UV 可享受 10-100 倍的套件安裝速度提升"
