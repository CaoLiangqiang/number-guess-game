#!/bin/bash
# 代码同步脚本
# 用法: ./scripts/sync.sh [push|pull|status|help]

set -e

# 配置
SERVER_USER="ubuntu"
SERVER_IP="111.229.83.216"
SSH_KEY="$HOME/.ssh/tecentcloud.pem"
PROJECT_PATH="/home/ubuntu/number-guess-game"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}📦 $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 推送代码到远程仓库
push_code() {
    print_info "推送代码到 GitHub..."
    git push origin main
    print_success "GitHub 推送完成"

    print_info "推送代码到 Gitee..."
    git push gitee main
    print_success "Gitee 推送完成"
}

# 服务器从 Gitee 拉取代码
pull_server() {
    print_info "服务器从 Gitee 拉取最新代码..."
    ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "cd $PROJECT_PATH && git fetch gitee && git reset --hard gitee/main"
    print_success "服务器代码已更新"

    print_info "重启 PM2 服务..."
    ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "pm2 restart number-guess-game"
    print_success "服务已重启"
}

# 查看服务器状态
server_status() {
    echo ""
    print_info "服务器 PM2 状态:"
    ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "pm2 list"
    echo ""
    print_info "最近日志:"
    ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "pm2 logs number-guess-game --lines 10 --nostream"
}

# 完整同步流程
full_sync() {
    print_info "开始完整同步流程..."
    push_code
    pull_server
    print_success "完整同步完成！"
    echo ""
    print_info "访问 https://111.229.83.216 验证"
}

# 帮助信息
show_help() {
    echo "代码同步脚本"
    echo ""
    echo "用法: ./scripts/sync.sh [命令]"
    echo ""
    echo "命令:"
    echo "  push    - 推送代码到 GitHub 和 Gitee"
    echo "  pull    - 服务器从 Gitee 拉取代码并重启服务"
    echo "  sync    - 完整同步（push + pull）"
    echo "  status  - 查看服务器 PM2 状态"
    echo "  help    - 显示帮助信息"
    echo ""
    echo "示例:"
    echo "  ./scripts/sync.sh push     # 本地推送到远程仓库"
    echo "  ./scripts/sync.sh pull     # 服务器拉取最新代码"
    echo "  ./scripts/sync.sh sync     # 完整同步流程"
}

# 主逻辑
case "$1" in
    push)
        push_code
        ;;
    pull)
        pull_server
        ;;
    sync)
        full_sync
        ;;
    status)
        server_status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        show_help
        ;;
esac