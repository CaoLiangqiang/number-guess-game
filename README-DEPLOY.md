# 数字对决 Pro - 服务器部署指南

本文档介绍如何部署 WebSocket 服务器以支持联机对战功能。

## 目录

- [环境要求](#环境要求)
- [部署选项](#部署选项)
  - [Option 1: Railway (推荐)](#option-1-railway-推荐)
  - [Option 2: Render](#option-2-render)
  - [Option 3: Docker 自托管](#option-3-docker-自托管)
- [环境变量配置](#环境变量配置)
- [Redis 配置](#redis-配置)
- [验证部署](#验证部署)

---

## 环境要求

- Node.js 18+
- Redis 服务器（用于房间状态持久化）
- 端口 8080（或自定义 PORT）

---

## 部署选项

### Option 1: Railway (推荐)

Railway 提供 Redis 和 WebSocket 的良好支持。

#### 步骤

1. **Fork 本仓库**

2. **创建 Railway 项目**
   ```bash
   # 安装 Railway CLI
   npm install -g @railway/cli
   
   # 登录
   railway login
   
   # 初始化项目
   railway init
   ```

3. **添加 Redis 服务**
   ```bash
   railway add --plugin redis
   ```

4. **部署服务器**
   ```bash
   cd server
   railway up
   ```

5. **设置环境变量**
   ```bash
   railway variables set REDIS_URL=${{Redis.REDIS_URL}}
   railway variables set NODE_ENV=production
   ```

6. **获取服务器 URL**
   ```bash
   railway domain
   ```
   输出示例: `https://number-guess-game.up.railway.app`

### Option 2: Render

Render 支持免费部署 WebSocket 服务。

#### 步骤

1. **创建 Render 账户**
   访问 https://render.com 并注册

2. **创建 Web Service**
   - 连接 GitHub 仓库
   - 选择仓库 `number-guess-game`
   - 设置:
     - **Name**: `number-guess-game-server`
     - **Root Directory**: `server`
     - **Build Command**: `npm install`
     - **Start Command**: `node server.js`
     - **Instance Type**: Free

3. **添加 Redis**
   - 在 Render Dashboard 创建 Redis 实例
   - 或使用外部 Redis 服务（如 Upstash、Redis Cloud）

4. **设置环境变量**
   - `REDIS_URL`: Redis 连接 URL
   - `NODE_ENV`: `production`

### Option 3: Docker 自托管

适合自有服务器部署。

#### Dockerfile

创建 `server/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 8080

CMD ["node", "server.js"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  server:
    build: ./server
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  redis_data:
```

#### 部署命令

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f server

# 停止服务
docker-compose down
```

---

## 环境变量配置

| 变量名 | 说明 | 必需 | 默认值 |
|--------|------|------|--------|
| `PORT` | 服务器端口 | 否 | `8080` |
| `REDIS_URL` | Redis 连接 URL | 是 | - |
| `NODE_ENV` | 运行环境 | 否 | `development` |

### 示例配置

```bash
# .env 文件
PORT=8080
REDIS_URL=redis://localhost:6379
NODE_ENV=production
```

---

## Redis 配置

### 使用 Redis Cloud (免费方案)

1. 访问 https://redis.com/try-free/
2. 创建免费 Redis 实例
3. 获取连接 URL，格式: `redis://default:PASSWORD@HOST:PORT`

### 使用 Upstash (免费方案)

1. 访问 https://upstash.com/
2. 创建 Redis 数据库
3. 复制连接 URL

---

## 验证部署

### 本地测试

```bash
# 安装依赖
cd server
npm install

# 启动 Redis (Docker)
docker run -d -p 6379:6379 redis:7-alpine

# 启动服务器
REDIS_URL=redis://localhost:6379 node server.js
```

### 连接测试

```javascript
// 在浏览器控制台测试
const ws = new WebSocket('wss://your-server-url');
ws.onopen = () => console.log('Connected!');
ws.onerror = (e) => console.error('Error:', e);
```

### 健康检查

```bash
# 检查服务器状态
curl https://your-server-url/health

# 或使用 wscat
npm install -g wscat
wscat -c wss://your-server-url
```

---

## 前端配置

部署服务器后，在前端配置 WebSocket URL:

```javascript
// 在 game.html 或配置文件中
const WS_URL = 'wss://your-server-url';
// 或使用环境变量
const WS_URL = window.WS_SERVER_URL || 'ws://localhost:8080';
```

---

## 故障排查

### 常见问题

1. **WebSocket 连接失败**
   - 检查防火墙是否允许 WebSocket 连接
   - 确认使用 `wss://` (安全 WebSocket) 协议

2. **Redis 连接失败**
   - 检查 REDIS_URL 格式是否正确
   - 确认 Redis 服务是否运行

3. **房间无法创建**
   - 检查服务器日志
   - 确认 Redis 连接正常

### 日志查看

```bash
# Railway
railway logs

# Render
# 在 Dashboard > Logs 查看

# Docker
docker-compose logs -f server
```

---

## 安全建议

1. **使用 WSS**: 生产环境必须使用 `wss://` 加密连接
2. **限制连接速率**: 在反向代理配置速率限制
3. **验证消息格式**: 服务器已内置消息验证
4. **定期清理**: 服务器自动清理过期房间

---

*文档更新: 2026-03-19*