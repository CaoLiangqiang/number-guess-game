# 数字对决 Pro

[![PWA](https://img.shields.io/badge/PWA-Ready-blue)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![WeChat](https://img.shields.io/badge/WeChat-小游戏-green)]()
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-2.4.0-purple)]()

> 一款基于 H5 和微信小游戏的数字推理对战游戏，支持单机人机对战和双人实时联机对战。

## 产品形态

### 双平台发布

| 平台 | 入口 | 特性 |
|------|------|------|
| **H5 Web** | `index.html` | PWA 支持、可安装、离线游玩 |
| **微信小游戏** | `miniprogram/` | 原生小游戏体验、Canvas 渲染 |

### 核心玩法

**数字对决 Pro** 是一款考验逻辑推理能力的数字猜谜游戏：

1. 玩家选择一个 N 位数字（传统规则：不重复，首位不为0）
2. 与对手轮流猜测对方的数字
3. 根据"位置和数字都对"(A)和"数字对位置不对"(B)的反馈进行推理
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
| 微信小游戏 | Canvas 2D 原生渲染，流畅体验 |

---

## 版本实现

### H5 Web 版本

**入口文件**: `index.html`

**技术栈**:
| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | Vanilla JS (ES6+) | 零依赖、无构建步骤 |
| 样式 | Tailwind CSS (CDN) | 快速开发、暗色主题 |
| 图标 | Lucide Icons (CDN) | SVG 图标库 |
| 实时通信 | WebSocket | 双向通信、低延迟 |
| 离线缓存 | Service Worker | PWA 标准 |

**模块结构**:
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
```

### 微信小游戏版本

**入口文件**: `miniprogram/game.js`

**技术栈**:
| 层级 | 技术 | 说明 |
|------|------|------|
| 渲染引擎 | Canvas 2D | 原生小游戏 API |
| 场景管理 | SceneManager | 自研场景系统 |
| 输入处理 | wx.onTouch* | 微信触摸事件 |

**模块结构**:
```
miniprogram/
├── game.js                # 游戏入口
├── game.json              # 小游戏配置
├── project.config.json    # 项目配置
├── js/
│   ├── core/
│   │   ├── game.js        # 游戏核心逻辑
│   │   └── ai.js          # AI 算法
│   ├── engine/
│   │   ├── renderer.js    # Canvas 渲染器
│   │   ├── scene.js       # 场景管理
│   │   ├── input.js       # 输入处理
│   │   ├── audio.js       # 音频管理
│   │   └── storage.js     # 存储管理
│   └── scenes/
│       ├── menu.js        # 主菜单
│       ├── game.js        # 游戏场景
│       ├── result.js      # 结果页
│       ├── settings.js    # 设置页
│       ├── history.js     # 历史记录
│       └── guide.js       # 新手引导
└── assets/
    ├── images/            # 图片资源
    └── sounds/            # 音效资源
```

**已实现功能**:
- ✅ 主菜单场景
- ✅ AI 对战场景
- ✅ 结果展示
- ✅ 设置页面（难度选择、音效开关）
- ✅ 历史记录（支持滚动）
- ✅ 新手引导
- ✅ 按钮按下反馈
- ✅ AI 最优开局策略

---

## 快速开始

### H5 Web 版本

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

### 微信小游戏版本

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 导入项目：选择 `miniprogram/` 目录
3. 或导入根目录，使用 `project.config.json` 配置

---

## 测试

```bash
# 运行所有测试
npm test

# 仅单元测试
npm run test:jest

# 仅 E2E 测试
npm run test:e2e
```

测试覆盖：
- Jest 单元测试：游戏逻辑、AI 算法、存储管理
- Playwright E2E 测试：完整用户流程

---

## 部署指南

### H5 Web 部署

推荐使用 **GitHub Pages** 或 **Gitee Pages**：
1. 上传代码到 GitHub/Gitee 仓库
2. 开启 Pages 服务
3. 获得访问地址

### WebSocket 服务器部署

参见 [docs/DEPLOY_GUIDE.md](docs/DEPLOY_GUIDE.md) 获取详细部署指南。

支持平台：
- Render.com（免费）
- Railway.app（免费）
- 阿里云/腾讯云 VPS

### 微信小游戏发布

1. 在微信开发者工具中完成调试
2. 点击"上传"提交审核
3. 审核通过后发布

---

## 文档

| 文档 | 说明 |
|------|------|
| [README.md](README.md) | 项目说明（本文件） |
| [CHANGELOG.md](CHANGELOG.md) | 版本更新日志 |
| [CLAUDE.md](CLAUDE.md) | Claude Code 项目指南 |
| [docs/DEPLOY_GUIDE.md](docs/DEPLOY_GUIDE.md) | 服务器部署指南 |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 架构设计文档 |
| [docs/API.md](docs/API.md) | API 接口文档 |

---

## 许可

[MIT](LICENSE) © 数字对决 Pro