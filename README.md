# 数字对决 Pro

[![PWA](https://img.shields.io/badge/PWA-Ready-blue)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-2.2.2-purple)]()

> 一款基于 H5 的数字推理对战游戏，支持单机人机对战和双人实时联机对战。

## 产品形态

### 核心玩法

**数字对决 Pro** 是一款考验逻辑推理能力的数字猜谜游戏：

1. 玩家选择一个 N 位数字（0-9 可重复）
2. 与对手轮流猜测对方的数字
3. 根据"位置和数字都对"的个数反馈进行推理
4. 先猜中对方数字者获胜！

### 游戏模式

| 模式 | 说明 | 网络要求 |
|------|------|----------|
| 🤖 人机对战 | 与 AI 对战，支持 3/4/5 位难度 | 离线可用 |
| 👥 双人联机 | 创建房间邀请好友，实时对战 | 需要网络 |

### 产品特色

| 特色 | 描述 |
|------|------|
| AI 可视化 | Minimax + 信息熵算法，实时展示 AI 思考过程 |
| 联机对战 | 房间邀请制、断线重连、弱网适配 |
| PWA 支持 | 可安装到主屏幕，单机模式支持离线游玩 |
| 响应式设计 | 桌面端/移动端自适应，支持触屏操作 |

## 技术实现

### 架构

```
┌─────────────────────────────────────────────────────────┐
│                    前端 (单页应用)                        │
│  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐           │
│  │ UI层  │  │游戏层 │  │网络层 │  │存储层 │           │
│  │ HTML  │  │  JS   │  │  WS   │  │ LS/SW │           │
│  └───────┘  └───────┘  └───────┘  └───────┘           │
└─────────────────────────────────────────────────────────┘
                        ↕ WebSocket
┌─────────────────────────────────────────────────────────┐
│                  后端 (Node.js)                          │
│  WebSocket 服务器 + 房间管理 + Redis (可选)              │
└─────────────────────────────────────────────────────────┘
```

### 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | Vanilla JS (ES6+) | 零依赖、无构建步骤 |
| 样式 | Tailwind CSS (CDN) | 快速开发、暗色主题 |
| 图标 | Lucide Icons (CDN) | SVG 图标库 |
| 实时通信 | WebSocket | 双向通信、低延迟 |
| 离线缓存 | Service Worker | PWA 标准 |
| 后端 | Node.js + ws | WebSocket 服务器 |
| 状态存储 | Redis (可选) | 分布式房间状态 |

### 模块结构

```
js/
├── config.js      # 环境配置、调试开关
├── icons.js       # SVG 图标管理
├── audio.js       # 音效播放、振动反馈
├── storage.js     # localStorage 封装
├── game.js        # 游戏规则、验证、计算
├── ai.js          # Minimax + 信息熵算法
├── network.js     # WebSocket 客户端
├── pwa.js         # PWA 安装、更新管理
└── app.js         # 应用入口、主逻辑

server/
├── server.js      # WebSocket 服务器
├── logger.js      # 日志系统
├── wechat.js      # 微信小程序接口 (预留)
├── cloud-db.js    # 云数据库模拟 (预留)
├── ranking.js     # 排行榜模块 (预留)
└── daily-challenge.js  # 每日挑战 (预留)
```

## 快速开始

### 在线体验

| 平台 | 地址 | 说明 |
|------|------|------|
| 腾讯云 | `https://111.229.83.216` | 自签名证书，完整联机功能 |
| GitHub Pages | `https://caoliangqiang.github.io/number-guess-game/` | 静态托管，联机需外部服务器 |

### 本地运行

```bash
# 克隆仓库
git clone https://github.com/CaoLiangqiang/number-guess-game.git
cd number-guess-game

# 安装依赖（测试需要）
npm install

# 启动前端开发服务器
npm run dev

# 启动 WebSocket 服务器（联机模式）
cd server && npm install && npm start
```

## 部署指南

### 前端部署

推荐使用 **GitHub Pages** 或 **Gitee Pages**：

1. 上传代码到 GitHub/Gitee 仓库
2. 开启 Pages 服务
3. 获得访问地址

### 后端部署

参见 [docs/DEPLOY_GUIDE.md](docs/DEPLOY_GUIDE.md) 获取详细部署指南。

支持平台：
- Render.com（免费）
- Railway.app（免费）
- 阿里云/腾讯云 VPS

## 测试

```bash
# 运行所有测试
npm test

# 仅单元测试
npm run test:jest

# 仅 E2E 测试
npm run test:e2e

# Playwright UI 模式
npm run test:ui
```

测试覆盖：
- 92 个 Jest 单元测试
- 30+ 个 Playwright E2E 测试

## PWA 安装

### Android (Chrome)
访问游戏 → 点击底部安装提示

### iOS (Safari)
分享 → 添加到主屏幕

### 桌面端 (Chrome/Edge)
访问游戏 → 地址栏安装图标

## 已知问题

### Safari/iOS 联机问题
Safari 对自签名 SSL 证书验证严格，可能导致 WebSocket 连接失败。

**解决方案**：
1. 使用 Chrome 或 Edge 浏览器
2. 或先在 Safari 中访问 `https://服务器地址` 接受证书警告
3. 或配置正规 SSL 证书（推荐 Let's Encrypt）

## 文档

| 文档 | 说明 |
|------|------|
| [README.md](README.md) | 项目说明 |
| [CHANGELOG.md](CHANGELOG.md) | 版本更新日志 |
| [CLAUDE.md](CLAUDE.md) | Claude Code 项目指南 |
| [docs/DEPLOY_GUIDE.md](docs/DEPLOY_GUIDE.md) | 服务器部署指南 |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 架构设计文档 |
| [docs/API.md](docs/API.md) | API 接口文档 |

## 许可

[MIT](LICENSE) © 数字对决 Pro