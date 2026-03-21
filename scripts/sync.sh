#!/bin/bash
# 同步代码脚本
# 用法: ./scripts/sync.sh [local|server]

set -e

if [ "$1" = "local" ]; then
    echo "📦 推送代码到 GitHub 和 Gitee..."
    git push origin main
    git push gitee main
    echo "✅ 本地代码已同步到远程仓库"

elif [ "$1" = "server" ]; then
    echo "📥 服务器从 Gitee 拉取最新代码..."
    cd /home/ubuntu/number-guess-game
    git fetch gitee
    git reset --hard gitee/main
    pm2 restart number-guess-game
    echo "✅ 服务器代码已更新"

else
    echo "用法:"
    echo "  ./scripts/sync.sh local   - 本地推送到 GitHub 和 Gitee"
    echo "  ./scripts/sync.sh server  - 服务器从 Gitee 拉取代码"
fi