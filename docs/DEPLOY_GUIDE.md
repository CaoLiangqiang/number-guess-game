# WebSocket 服务部署指南

**适用范围**: H5 联机模式
**更新时间**: 2026-03-29

---

## 1. 这份文档解决什么问题

联机能力由 `server/` 下的 Node.js WebSocket 服务提供。
本指南只覆盖：

- WebSocket 服务部署
- H5 前端服务地址配置
- 基本联调和健康检查

它不覆盖微信小游戏提审发布流程。

---

## 2. 相关文件

| 文件 | 作用 |
|------|------|
| `server/server.js` | WebSocket 服务入口 |
| `render.yaml` | Render 部署配置 |
| `Dockerfile` | 容器化部署 |
| `docker-compose.yml` | 本地联调 |
| `js/config.js` | H5 客户端的 WebSocket 地址配置 |

---

## 3. 推荐部署路径

### 方案 A: Render

适合快速上线和低维护成本。

#### 步骤

1. 将仓库推送到 GitHub。
2. 在 Render 创建新的 Web Service。
3. 选择本仓库，或直接复用仓库中的 `render.yaml`。
4. 运行环境选择 Node.js。
5. 如需多实例共享房间，配置 `REDIS_URL`。

#### 启动配置

| 项目 | 建议值 |
|------|--------|
| Build Command | `npm install --prefix server` |
| Start Command | `npm --prefix server start` |
| Health Check | `/health` |

### 方案 B: Railway

适合快速托管 Node 服务。

#### 步骤

1. 导入当前仓库。
2. 将工作目录指向仓库根目录。
3. 启动命令使用 `npm --prefix server start`。
4. 如需要 Redis，追加托管 Redis 服务并注入 `REDIS_URL`。

### 方案 C: VPS / 容器

适合自有环境和长期稳定部署。

#### Docker

```bash
docker build -t number-guess-game .
docker run -p 8080:8080 -e REDIS_URL=redis://host:6379 number-guess-game
```

#### 直接运行

```bash
cd server
npm install
npm start
```

---

## 4. H5 前端如何接到线上服务

部署完成后，更新 [js/config.js](../js/config.js) 里的 `wsServers`：

```javascript
wsServers: {
  development: 'ws://localhost:8080',
  github_pages: 'wss://your-server.example.com',
  netlify: 'wss://your-server.example.com',
  vercel: 'wss://your-server.example.com',
  production: 'wss://your-server.example.com'
}
```

注意：

- HTTPS 页面必须使用 `wss://`
- `localhost` 开发环境保留 `ws://localhost:8080`

---

## 5. 健康检查与联调

### 健康检查

```bash
curl https://your-server.example.com/health
```

返回 `status: "ok"` 即表示服务正常对外。

### 本地联调

```bash
# 终端 1
npm run dev

# 终端 2
cd server
npm install
npm start
```

然后打开两个浏览器窗口访问 `http://localhost:8080`，测试：

- 创建房间 / 加入房间
- 设置难度
- 准备开始
- 猜测流程
- 断线重连

---

## 6. Redis 什么时候需要

不使用 Redis：

- 单实例部署即可
- 房间状态只保存在当前进程内

使用 Redis：

- 多实例部署
- 需要房间状态跨实例恢复
- 需要更稳定的线上房间保活能力

---

## 7. 线上检查清单

- 服务地址已更新到 `js/config.js`
- `GET /health` 正常
- 双开浏览器能完整走通一局
- 回合超时和断线重连行为正常
- HTTPS/WSS 配置正确
