#!/bin/bash

# 🔍 LM Studio 服務檢查腳本
# 快速檢查 LM Studio gpt-oss-20b 服務狀態

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# 配置
LM_STUDIO_PORT=1234
API_ENDPOINT="http://localhost:${LM_STUDIO_PORT}"
MODEL_NAME="unsloth/gpt-oss-20b-GGUF"

# emoji 函數
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_step() { echo -e "${CYAN}🔄 $1${NC}"; }

# 主函數
main() {
    echo -e "${BOLD}${CYAN}"
    echo "🔍 LM Studio 服務狀態檢查"
    echo "========================="
    echo -e "${NC}"
    
    local overall_status=0
    
    # 檢查端口
    check_port || overall_status=1
    
    # 檢查 API
    check_api || overall_status=1
    
    # 檢查模型
    check_model || overall_status=1
    
    # 測試聊天功能
    test_chat || overall_status=1
    
    # 顯示結果
    show_results $overall_status
    
    return $overall_status
}

# 檢查端口
check_port() {
    log_step "檢查端口 $LM_STUDIO_PORT..."
    
    if nc -z localhost $LM_STUDIO_PORT 2>/dev/null; then
        log_success "端口 $LM_STUDIO_PORT 已開放"
        return 0
    else
        log_error "端口 $LM_STUDIO_PORT 未開放"
        log_info "請確認 LM Studio Local Server 已啟動"
        return 1
    fi
}

# 檢查 API
check_api() {
    log_step "檢查 API 回應..."
    
    local response_code
    response_code=$(curl -s -o /dev/null -w "%{http_code}" -m 10 "${API_ENDPOINT}/v1/models" 2>/dev/null)
    
    if [ "$response_code" = "200" ]; then
        log_success "API 正常回應 (HTTP: $response_code)"
        return 0
    else
        log_error "API 無法正常回應 (HTTP: $response_code)"
        return 1
    fi
}

# 檢查模型
check_model() {
    log_step "檢查可用模型..."
    
    local models_response
    models_response=$(curl -s -m 10 "${API_ENDPOINT}/v1/models" 2>/dev/null)
    
    if [ $? -ne 0 ]; then
        log_error "無法獲取模型列表"
        return 1
    fi
    
    # 顯示可用模型
    log_info "可用模型列表："
    echo "$models_response" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    models = data.get('data', [])
    if not models:
        print('  • 無可用模型')
        sys.exit(1)
    
    target_found = False
    for model in models:
        model_id = model.get('id', 'Unknown')
        if '$MODEL_NAME' in model_id:
            print(f'  ✅ {model_id}')
            target_found = True
        else:
            print(f'  • {model_id}')
    
    if not target_found:
        print(f'  ⚠️  未找到目標模型: $MODEL_NAME')
        sys.exit(1)
        
except Exception as e:
    print(f'  ❌ 無法解析模型列表: {e}')
    sys.exit(1)
" 2>/dev/null
    
    local result=$?
    if [ $result -eq 0 ]; then
        log_success "模型檢查完成"
        return 0
    else
        log_warn "模型檢查發現問題"
        return 1
    fi
}

# 測試聊天功能
test_chat() {
    log_step "測試聊天功能..."
    
    local test_message="Hello! 你好！Test message for gpt-oss-20b."
    local chat_response
    
    # 構建請求
    local request_data=$(cat << EOF
{
    "model": "$MODEL_NAME",
    "messages": [
        {"role": "user", "content": "$test_message"}
    ],
    "temperature": 0.1,
    "max_tokens": 50
}
EOF
)
    
    # 發送請求
    chat_response=$(curl -s -m 30 -X POST "${API_ENDPOINT}/v1/chat/completions" \
        -H "Content-Type: application/json" \
        -d "$request_data" 2>/dev/null)
    
    if [ $? -ne 0 ]; then
        log_error "聊天 API 請求失敗"
        return 1
    fi
    
    # 解析回應
    local chat_content
    chat_content=$(echo "$chat_response" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'choices' in data and len(data['choices']) > 0:
        content = data['choices'][0]['message']['content']
        print(content.strip())
    else:
        print('ERROR: No valid response')
        sys.exit(1)
except Exception as e:
    print(f'ERROR: {e}')
    sys.exit(1)
" 2>/dev/null)
    
    if [[ "$chat_content" == ERROR* ]]; then
        log_error "聊天功能測試失敗: $chat_content"
        log_info "原始回應: $chat_response"
        return 1
    else
        log_success "聊天功能正常"
        log_info "測試回應: $(echo "$chat_content" | head -c 100)..."
        return 0
    fi
}

# 顯示結果
show_results() {
    local status=$1
    
    echo ""
    echo -e "${BOLD}🎯 檢查結果：${NC}"
    
    if [ $status -eq 0 ]; then
        echo -e "${GREEN}${BOLD}🎉 所有檢查通過！${NC}"
        echo -e "${GREEN}✨ LM Studio gpt-oss-20b 服務正常運行${NC}"
        echo ""
        echo -e "${CYAN}📝 你現在可以：${NC}"
        echo "• 執行整合測試: node test-lm-studio-integration.js"
        echo "• 使用 mursfoto-cli AI 功能"
        echo "• 開始你的本地 AI 開發之旅！"
    else
        echo -e "${RED}${BOLD}⚠️  發現問題，需要修正${NC}"
        echo ""
        echo -e "${YELLOW}📝 建議的解決步驟：${NC}"
        echo "1. 確認 LM Studio 應用程式已啟動"
        echo "2. 在 LM Studio 中載入 gpt-oss-20b 模型"
        echo "3. 在 Local Server 頁面啟動服務"
        echo "4. 重新執行此檢查腳本"
        echo ""
        echo "或執行自動啟動腳本: ./start-lm-studio.sh"
    fi
    
    echo ""
}

# 快速模式（僅檢查是否運行）
quick_check() {
    if nc -z localhost $LM_STUDIO_PORT 2>/dev/null; then
        echo "✅ 運行中"
        return 0
    else
        echo "❌ 未運行"
        return 1
    fi
}

# 處理命令列參數
case "${1:-}" in
    --quick|-q)
        quick_check
        ;;
    --help|-h)
        echo "用法: $0 [選項]"
        echo ""
        echo "選項:"
        echo "  --quick, -q    快速檢查（僅檢查是否運行）"
        echo "  --help, -h     顯示此幫助信息"
        echo ""
        echo "無參數時執行完整檢查"
        ;;
    *)
        main "$@"
        ;;
esac
