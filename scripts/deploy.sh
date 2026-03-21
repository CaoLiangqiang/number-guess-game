#!/bin/bash
# 数字对决 Pro - 服务器部署脚本
# 使用方法: ./scripts/deploy.sh [option]
# Options:
#   docker   - 使用 Docker 部署
#   render   - 显示 Render 部署说明
#   railway  - 显示 Railway 部署说明
#   test     - 本地测试服务器

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_DIR="$PROJECT_DIR/server"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  数字对决 Pro - 服务器部署${NC}"
echo -e "${BLUE}========================================${NC}"

case "${1:-help}" in
  docker)
    echo -e "\n${GREEN}🐳 Docker 部署${NC}\n"
    
    # 检查 Docker 是否安装
    if ! command -v docker &> /dev/null; then
      echo -e "${RED}错误: Docker 未安装${NC}"
      echo "请访问 https://docs.docker.com/get-docker/ 安装 Docker"
      exit 1
    fi
    
    # 检查 docker-compose 是否安装
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
      echo -e "${RED}错误: Docker Compose 未安装${NC}"
      exit 1
    fi
    
    echo "正在构建并启动服务..."
    cd "$PROJECT_DIR"
    
    # 使用 docker-compose
    if command -v docker-compose &> /dev/null; then
      docker-compose up -d --build
    else
      docker compose up -d --build
    fi
    
    echo -e "\n${GREEN}✅ 服务已启动${NC}"
    echo -e "WebSocket 服务器: ${YELLOW}ws://localhost:8080${NC}"
    echo -e "健康检查: ${YELLOW}http://localhost:8080/health${NC}"
    echo ""
    echo "查看日志: docker-compose logs -f"
    echo "停止服务: docker-compose down"
    ;;
    
  render)
    echo -e "\n${GREEN}🚀 Render 部署说明${NC}\n"
    echo "1. 访问 https://render.com 并登录/注册"
    echo "2. 点击 'New' -> 'Web Service'"
    echo "3. 连接 GitHub 仓库并选择 number-guess-game"
    echo "4. 配置服务:"
    echo "   - Name: number-guess-game-server"
    echo "   - Root Directory: server"
    echo "   - Build Command: npm install"
    echo "   - Start Command: node server.js"
    echo "   - Plan: Free"
    echo ""
    echo "5. 创建 Redis 服务 (推荐使用 Upstash 免费方案):"
    echo "   - 访问 https://upstash.com"
    echo "   - 创建 Redis 数据库"
    echo "   - 复制连接 URL"
    echo ""
    echo "6. 在 Render 设置环境变量:"
    echo "   - REDIS_URL: <你的 Redis 连接 URL>"
    echo ""
    echo "7. 部署完成后，服务器 URL 格式:"
    echo "   ${YELLOW}wss://your-app.onrender.com${NC}"
    ;;
    
  railway)
    echo -e "\n${GREEN}🚂 Railway 部署说明${NC}\n"
    echo "1. 安装 Railway CLI:"
    echo "   npm install -g @railway/cli"
    echo ""
    echo "2. 登录 Railway:"
    echo "   railway login"
    echo ""
    echo "3. 初始化项目:"
    echo "   railway init"
    echo ""
    echo "4. 添加 Redis:"
    echo "   railway add --plugin redis"
    echo ""
    echo "5. 部署服务器:"
    echo "   cd server && railway up"
    echo ""
    echo "6. 设置环境变量:"
    echo "   railway variables set REDIS_URL=\${{Redis.REDIS_URL}}"
    echo "   railway variables set NODE_ENV=production"
    echo ""
    echo "7. 获取服务器 URL:"
    echo "   railway domain"
    ;;
    
  test)
    echo -e "\n${GREEN}🧪 本地测试${NC}\n"
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
      echo -e "${RED}错误: Node.js 未安装${NC}"
      exit 1
    fi
    
    # 安装依赖
    echo "安装依赖..."
    cd "$SERVER_DIR"
    npm install
    
    # 检查 Redis
    echo ""
    echo -e "${YELLOW}注意: 需要运行 Redis 服务器${NC}"
    echo "如果未运行，可以使用 Docker 启动:"
    echo "  docker run -d -p 6379:6379 redis:7-alpine"
    echo ""
    
    # 启动服务器
    echo "启动服务器..."
    echo -e "WebSocket URL: ${YELLOW}ws://localhost:8080${NC}"
    echo -e "健康检查: ${YELLOW}http://localhost:8080/health${NC}"
    echo ""
    
    # 如果有 Redis URL 则使用
    if [ -n "$REDIS_URL" ]; then
      REDIS_URL=$REDIS_URL node server.js
    else
      echo -e "${YELLOW}警告: 未设置 REDIS_URL，使用内存存储模式${NC}"
      node server.js
    fi
    ;;
    
  health)
    echo -e "\n${GREEN}🏥 健康检查${NC}\n"
    
    # 检查本地服务器
    if curl -s http://localhost:8080/health > /dev/null 2>&1; then
      echo -e "本地服务器: ${GREEN}✅ 运行中${NC}"
      curl -s http://localhost:8080/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:8080/health
    else
      echo -e "本地服务器: ${RED}❌ 未运行${NC}"
    fi
    ;;
    
  *)
    echo ""
    echo "使用方法: ./scripts/deploy.sh [option]"
    echo ""
    echo "选项:"
    echo "  docker   - 使用 Docker 部署"
    echo "  render   - 显示 Render 部署说明"
    echo "  railway  - 显示 Railway 部署说明"
    echo "  test     - 本地测试服务器"
    echo "  health   - 健康检查"
    echo ""
    echo "示例:"
    echo "  ./scripts/deploy.sh docker"
    echo "  ./scripts/deploy.sh test"
    ;;
esac