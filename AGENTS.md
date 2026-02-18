# 数字对决 Pro - 项目指南

> 本文档面向 AI 编程助手，用于快速了解本项目架构和开发规范。

## 项目概述

**数字对决 Pro** 是一款基于 H5 的在线数字推理对战游戏，支持人机对战和 P2P 实时联机对战。

- **产品名称**: 数字对决 Pro
- **目标平台**: 微信内置浏览器、移动端浏览器（iOS Safari、Android Chrome）
- **核心玩法**: 双方各选一个4位数字（0-9可重复），轮流猜测对方数字，根据"位置和数字都对"的个数反馈进行推理
- **AI特色**: 使用 Minimax + 信息熵算法，可视化展示 AI 思考过程

## 技术栈

| 模块 | 技术方案 | 说明 |
|------|----------|------|
| 前端框架 | Vanilla JS (ES6+) | 单文件应用，无构建步骤 |
| 样式方案 | Tailwind CSS (CDN) | 原子化CSS，无需打包 |
| P2P通信 | PeerJS (WebRTC) | 浏览器原生支持 |
| 中转服务器 | Socket.io + Node.js | 微信环境兼容（部署在 Glitch） |
| 二维码 | QRCode.js | 纯前端生成房间码 |
| 字体 | Google Fonts (Inter + JetBrains Mono) | 界面字体和等宽字体 |

## 项目结构

```
number-guess/
├── index.html          # 主游戏文件（重命名自 demo.html）
├── server.js           # Socket.io 信令服务器（Glitch 部署用）
├── design_doc.md       # 技术设计文档（PRD、实现方案、测试用例）
└── AGENTS.md           # 本文件
```

**重要**: 前端代码在 `index.html` 中，后端代码在 `server.js` 中。

## 微信 H5 适配说明

### 微信环境检测

游戏自动检测微信环境并进行适配：

```javascript
const isWechat = /MicroMessenger/i.test(navigator.userAgent);
if (isWechat) {
    // 显示微信提示条
    // 自动切换到 Socket.io 模式
    this.useSocketIO = true;
}
```

### 连接方案对比

| 方案 | 技术 | 微信支持 | 适用场景 |
|------|------|----------|----------|
| PeerJS | WebRTC P2P | ❌ 不支持 | 浏览器原生环境 |
| Socket.io | WebSocket/轮询 | ✅ 支持 | 微信内置浏览器 |

### 微信分享优化

HTML `<head>` 已添加 Open Graph 标签：

```html
<meta property="og:title" content="数字对决 Pro - 来挑战我的推理极限！">
<meta property="og:description" content="我已经想好了4位数字，你敢来猜吗？...">
<meta property="og:image" content="https://images.unsplash.com/...">
```

## 部署指南

### 前端部署（Vercel）

```bash
# 1. 推送代码到 GitHub
git init
git add index.html server.js design_doc.md
git commit -m "数字对决 Pro v1.0"
git push origin main

# 2. 在 Vercel 导入项目
# 访问 vercel.com，使用 GitHub 登录
# 点击 "Add New Project"
# 选择你的仓库，直接部署
# 获得链接: https://your-game.vercel.app
```

### 后端部署（Glitch）

```bash
# 1. 访问 glitch.com，创建新项目
# 2. 选择 "hello-express" 模板
# 3. 复制 server.js 内容到项目中
# 4. 获得项目地址: https://number-game-signal.glitch.me
# 5. 更新 index.html 中的 SERVER_URL
```

**保持喚醒**: Glitch 免费版有5分钟休眠机制，建议使用 UptimeRobot 每5分钟 ping 一次保持唤醒。

### 完整部署流程

```
1. 前端部署到 Vercel
   └── 获得: https://number-guess.vercel.app
   
2. 后端部署到 Glitch
   └── 获得: https://number-game-signal.glitch.me
   
3. 修改 index.html 中的 SERVER_URL
   └── const SERVER_URL = 'https://number-game-signal.glitch.me';
   
4. 更新 Open Graph 图片地址（可选）
   
5. 使用草料二维码生成器生成二维码
   └── https://cli.im
```

## 游戏模式

### 1. 人机对战 (PVC)
- AI 使用 Minimax 算法 + 信息熵计算
- AI 思考过程在终端面板可视化展示
- AI 首步固定使用 "0011"（最优开局策略）
- **适用场景**: 离线、微信、所有浏览器

### 2. 联机对战 (PVP)
- 支持两种连接方式：WebRTC (PeerJS) 或 WebSocket (Socket.io)
- Host 创建房间，生成房间码
- Guest 输入房间码加入
- 双方轮流猜测，猜中者获胜
- **适用场景**: 浏览器建议使用 WebRTC，微信必须使用 Socket.io

## 关键算法

### Minimax 选择策略

```javascript
selectMinimaxGuess() {
    // 从候选数字中，选择"最坏情况下剩余可能性最少"的数字
    // 计算每个候选的反馈分布，选择最大分组最小的
}
```

### 信息熵计算

```javascript
calculateEntropy(distribution) {
    // H = -Σ(p * log2(p))
    // 用于评估猜测的信息增益
}
```

### 匹配度计算

```javascript
calculateMatch(guess, target) {
    // 计算 guess 和 target 中"位置且数字都对"的个数
    // 例如: calculateMatch('1234', '1255') => 2
}
```

## 开发规范

### 代码风格
- 使用 ES6+ 语法（class、箭头函数、const/let）
- 方法命名使用 camelCase
- DOM 元素 ID 使用 kebab-case
- 类名使用 PascalCase

### 颜色主题

| 用途 | 颜色值 |
|------|--------|
| 主色调 | indigo-500 / indigo-600 |
| AI/对手色 | pink-500 / rose-600 |
| 成功色 | emerald-500 / teal-600 |
| 警告色 | yellow-500 / orange-600 |
| 背景色 | slate-900 (深色主题) |

### 终端输出样式

```javascript
// AI 终端日志类型
'header'    // 黄色粗体 - 轮次标题
'process'   // 蓝色 - 处理过程
'success'   // 绿色 - 成功信息
'decision'  // 紫色粗体 - 决策结果
'win'       // 粉色粗体大号 - 胜利
'player'    // 靛蓝色 - 玩家操作
'info'      // 灰色 - 普通信息
```

## 测试说明

本项目无自动化测试，依赖手动测试。测试矩阵：

| 测试项 | 微信安卓 | 微信iOS | Safari | Chrome |
|--------|----------|---------|--------|--------|
| 人机模式 | ✅ | ✅ | ✅ | ✅ |
| 创建房间 | ✅ | ✅ | ✅ | ✅ |
| 实时对战 | ✅ (Socket.io) | ✅ (Socket.io) | ✅ (PeerJS) | ✅ (PeerJS) |
| 断线重连 | ✅ | ✅ | ✅ | ✅ |

### 关键测试用例

1. **TC001**: 输入边界测试 - 非数字字符过滤、超长输入截断
2. **TC002**: AI 响应性能 - 10000 可能性时计算耗时 < 500ms
3. **TC003**: PVP 房间创建与加入流程
4. **TC004**: 网络断开处理
5. **TC005**: 微信环境检测 - 提示条显示、自动切换连接方式

## 版本历史

- **v1.1.0** (2026-02-18): 微信H5适配版，添加 Socket.io 支持，优化分享体验
- **v1.0.0** (2026-02-18): 初始版本，支持微信H5、人机对战、PVP联机
