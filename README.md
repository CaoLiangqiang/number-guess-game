# 数字对决 Pro

[![PWA](https://img.shields.io/badge/PWA-Ready-blue)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![WeChat](https://img.shields.io/badge/WeChat-小游戏-green)]()
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-2.4.44-purple)]()

> 同一套数字推理玩法交付为 H5 Web、微信小游戏，以及一套仅供研发验收使用的浏览器预览壳。

## 当前版本交付形态

| 形态 | 入口 | 面向对象 | 当前能力 |
|------|------|----------|----------|
| H5 Web | `index.html` | 玩家 | AI 对战、双人联机、PWA 安装与离线单机 |
| 微信小游戏 | `miniprogram/` | 玩家 | AI 对战、每日挑战、引导/历史/设置、本地统计 |
| 小程序预览壳 | `miniprogram-preview.html` | 开发与测试 | 在浏览器中运行小游戏场景、切换预设、切换视口、导出 PNG |

正式玩家端是 H5 Web 和微信小游戏。`miniprogram-preview.html` 只用于研发和验收提效，不替代微信开发者工具中的最终发布验证。

## 正式交付内容

### H5 Web

- 3/4/5 位数字猜谜，允许重复数字，允许首位为 `0`
- AI 对战，使用 Minimax + 信息熵策略
- 双人联机、随机匹配、断线重连、回合超时处理
- PWA 缓存、安装和离线单机能力

### 微信小游戏

- 主菜单、AI 对战、每日挑战、结果页、设置页、历史页、新手引导
- AI 思考进度、候选数量和预计耗时提示
- 游戏内帮助与暂停流程
- 本地统计：总场次、胜率、连胜、最佳回合、最佳用时、总用时、总猜测次数
- 历史记录浏览与清空确认

### 浏览器预览壳

- 直接复用 `miniprogram/` 现有模块，不维护第二套界面代码
- 通过浏览器 `wx` shim 和模块加载器启动小游戏入口
- 预置 `menu`、`settings`、`history`、`guide`、`game-ai`、`game-daily`、`result-win`、`result-lose` 等场景数据
- 支持常用移动端视口和 PNG 导出，便于 UI 回归和提交前自检

## 实际实现方式

### H5 Web 实现

- 页面入口：`index.html`
- 客户端模块：`js/config.js`、`js/game.js`、`js/ai.js`、`js/network.js`、`js/audio.js`、`js/storage.js`、`js/pwa.js`、`js/app.js`
- 发布能力：`service-worker.js` + `manifest.json`
- 联机后端：`server/server.js`，基于 Node.js 和 `ws`，可选 Redis 共享房间状态

### 微信小游戏实现

- 入口：`miniprogram/game.js`
- 规则与 AI：`miniprogram/js/core/`
- 引擎层：`miniprogram/js/engine/`
  - `renderer.js` 负责 Canvas 2D 绘制
  - `scene.js` 负责场景生命周期
  - `input.js` 负责触摸输入
  - `audio.js` 负责音频与振动
  - `storage.js` 负责本地持久化和统计聚合
- 场景层：`miniprogram/js/scenes/`
  - `menu.js`、`game.js`、`result.js`、`settings.js`、`history.js`、`guide.js`

### 小程序预览壳实现

- 页面壳：`miniprogram-preview.html`
- 浏览器模块加载：`js/miniprogram-preview/module-loader.js`
- `wx` 兼容层：`js/miniprogram-preview/wx-shim.js`
- 预览控制器：`js/miniprogram-preview/app.js`
- 预设数据：`js/miniprogram-preview/seed-data.js`

### 版本同步实现

- `package.json` 是版本源
- `update-git-version.js` 负责把版本号和当前提交同步到：
  - `package-lock.json`
  - `js/config.js`
  - `service-worker.js`
  - `server/package.json`
  - `server/package-lock.json`
  - `server/server.js`
  - `miniprogram/game.js`
  - `README.md`
  - `CLAUDE.md`

## 本地开发

```bash
npm install
npm run dev
```

本地静态服务启动后：

- H5 Web：`http://localhost:8080`
- 小程序预览壳：`http://localhost:8080/miniprogram-preview.html`

微信小游戏正式验收仍使用微信开发者工具导入 `miniprogram/`。

## 测试

```bash
# 单元测试
npm run test:jest

# E2E
npm run test:e2e

# 全量
npm test
```

当前仓库测试覆盖：

- Jest：H5 规则、网络、音频、小游戏启动、小游戏核心、预览壳 runtime
- Playwright：H5 页面流程与视觉快照

## 部署与发布

- H5 静态资源可部署到 GitHub Pages、Gitee Pages 或其他静态托管
- WebSocket 服务部署说明见 [docs/DEPLOY_GUIDE.md](docs/DEPLOY_GUIDE.md)
- 微信小游戏发布流程见微信开发者工具上传与提审

## 文档分工

| 文档 | 作用 |
|------|------|
| [README.md](README.md) | 产品形态、交付范围、仓库入口 |
| [CHANGELOG.md](CHANGELOG.md) | 版本变更记录 |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 当前实现架构与模块边界 |
| [docs/MINIPROGRAM_DEV.md](docs/MINIPROGRAM_DEV.md) | 微信小游戏正式交付说明 |
| [docs/API.md](docs/API.md) | H5 联机 WebSocket 协议 |
| [docs/DEPLOY_GUIDE.md](docs/DEPLOY_GUIDE.md) | WebSocket 服务部署与联调 |

## 许可

[MIT](LICENSE) © 数字对决 Pro
