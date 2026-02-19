# 数字对决 Pro - 项目指南

> 本文档面向 AI 编程助手，用于快速了解本项目架构和开发规范。

## 项目概述

**数字对决 Pro** 是一款基于 H5 的数字推理对战游戏，支持单机人机对战和双人实时联机对战两种模式。

- **产品名称**: 数字对决 Pro
- **目标平台**: 微信内置浏览器、移动端浏览器（iOS Safari、Android Chrome）、PWA
- **核心玩法**: 玩家选一个4位数字（0-9可重复），与对手轮流猜测对方数字，根据"位置和数字都对"的个数反馈进行推理
- **AI特色**: 使用 Minimax + 信息熵算法，可视化展示 AI 思考过程
- **联机特色**: 支持好友房间、实时对战、断线重连、弱网适配
- **PWA特色**: 支持离线游玩（单机模式）、可安装到主屏幕、缓存更新管理

## 技术栈

| 模块 | 技术方案 | 说明 |
|------|----------|------|
| 前端框架 | Vanilla JS (ES6+) | 单文件应用，无构建步骤 |
| 样式方案 | Tailwind CSS (BootCDN) | 国内CDN加速 |
| 字体 | Google Fonts (Loli镜像) | 国内CDN镜像 |
| 实时通信 | WebSocket | 双人联机模式使用 |
| PWA | Service Worker + Manifest | 离线缓存、安装提示 |

## 项目结构

```
number-guess/
├── index.html              # 主游戏文件（包含单机和联机模式）
├── manifest.json           # PWA 配置文件
├── service-worker.js       # Service Worker（离线缓存）
├── offline.html            # 离线回退页面
├── icons/                  # PWA 图标
│   ├── icon-48x48.png
│   ├── icon-72x72.png
│   ├── icon-96x96.png
│   ├── icon-128x128.png
│   ├── icon-144x144.png
│   ├── icon-152x152.png
│   ├── icon-192x192.png
│   ├── icon-384x384.png
│   ├── icon-512x512.png
│   └── icon.svg
├── server/                 # 联机服务器
│   ├── server.js           # WebSocket 服务器
│   └── package.json        # 服务器依赖
├── docs/                   # 文档目录
│   └── DEPLOY_GUIDE.md     # 服务器部署指南
├── .trae/
│   └── specs/
│       ├── add-multiplayer-mode/  # 双人联机模式Spec
│       └── pwa-conversion/        # PWA改造Spec
├── design_doc.md           # 产品设计与部署方案
└── AGENTS.md               # 本文件
```

## PWA 功能

### 已实现功能

| 功能 | 状态 | 说明 |
|------|------|------|
| Web App Manifest | ✅ | 独立 manifest.json，支持安装到主屏幕 |
| Service Worker | ✅ | 离线缓存、更新管理 |
| 离线缓存 | ✅ | 单机模式可离线游玩 |
| 安装提示 | ✅ | 自动检测并提示用户安装 |
| iOS 安装引导 | ✅ | Safari 专用安装指引 |
| 网络状态检测 | ✅ | 实时显示在线/离线状态 |
| 缓存更新 | ✅ | 新版本检测和提示更新 |

### PWA 使用说明

1. **安装应用**
   - Android Chrome: 访问应用时会自动提示安装
   - iOS Safari: 点击分享按钮 → 添加到主屏幕
   - Desktop Chrome: 地址栏点击安装图标

2. **离线游玩**
   - 单机模式：无需网络，随时随地可玩
   - 联机模式：需要网络连接

3. **更新应用**
   - 应用会自动检测新版本
   - 有新版本时显示更新提示
   - 点击更新后立即使用新版本

## 国内CDN优化

本版本已针对国内网络环境进行优化：

| 资源 | CDN地址 |
|------|---------|
| Tailwind CSS | https://cdn.bootcdn.net/ajax/libs/tailwindcss/3.4.1/tailwind.min.js |
| Google Fonts | https://fonts.loli.net (国内镜像) |

## 部署方案

### 个人项目（推荐）

**Gitee Pages** - 免费、稳定、国内访问快

```bash
# 1. 注册Gitee账号 → 创建仓库 → 上传index.html
# 2. 仓库页面 → 服务 → Gitee Pages → 启动
# 3. 获得链接: https://你的用户名.gitee.io/number-guess/
```

### 企业项目

| 云服务商 | 适用场景 | 月费用 |
|----------|----------|--------|
| 阿里云 OSS+CDN | 企业项目、生态完善 | ￥20-30 |
| 腾讯云 COS+CDN | 微信生态项目 | ￥20-30 |
| 华为云 OBS+CDN | 政企项目、合规要求 | ￥20-30 |

### 域名备案

- 使用国内服务器/自定义域名需ICP备案
- 备案周期：5-20天
- 使用Gitee Pages默认域名无需备案

## 微信分享优化

HTML `<head>` 已添加 Open Graph 标签：

```html
<meta property="og:title" content="数字对决 Pro - 来挑战我的推理极限！">
<meta property="og:description" content="我已经想好了4位数字，你敢来猜吗？">
```

## 游戏模式

### 人机对战 (PVC)
- AI 使用 Minimax 算法 + 信息熵计算
- AI 思考过程在终端面板可视化展示
- AI 首步固定使用 "0011"（最优开局策略）
- **适用场景**: 离线、微信、所有浏览器，即开即玩

### 双人联机对战 (PVP)
- 支持创建房间、生成6位房间号
- 支持通过房间号加入好友房间
- 实时同步游戏状态（回合、猜测、反馈）
- 支持断线重连（最多5次尝试）
- 弱网环境自适应（动态调整心跳间隔）
- **适用场景**: 需要网络连接，适合与好友实时对战

## 核心类说明

### NumberGamePro
游戏主类，支持单/双模式切换。

```javascript
// 单机模式
const game = new NumberGamePro('single');

// 联机模式
const game = new NumberGamePro('multiplayer');
game.initMultiplayer('wss://your-server.com');
```

### WebSocketClient
WebSocket通信客户端，管理连接、心跳、重连。

```javascript
const wsClient = new WebSocketClient('wss://your-server.com');
wsClient.connect();
wsClient.on('message', (data) => { ... });
```

### RoomManager
房间管理类，处理创建/加入/离开房间。

```javascript
const roomManager = new RoomManager(wsClient);
roomManager.createRoom();  // 生成6位房间号
roomManager.joinRoom('8A3B9C');
```

### PWA 管理模块

#### PWAInstallManager
管理 PWA 安装提示和 iOS 安装引导。

```javascript
PWAInstallManager.init();        // 初始化
PWAInstallManager.install();     // 触发安装
PWAInstallManager.dismiss();     // 关闭提示
```

#### NetworkManager
管理网络状态检测和提示。

```javascript
NetworkManager.init();           // 初始化
NetworkManager.checkOnline();    // 检查是否在线
NetworkManager.showStatusMessage(msg, type);  // 显示状态消息
```

#### SWUpdateManager
管理 Service Worker 更新。

```javascript
SWUpdateManager.init();          // 初始化
SWUpdateManager.update();        // 更新到新版本
```

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

## Service Worker 缓存策略

### 缓存资源

| 类型 | 资源 | 策略 |
|------|------|------|
| 核心 | index.html, manifest.json, offline.html | Cache First |
| 图标 | icons/* | Cache First |
| CDN | Tailwind CSS, Fonts | Stale While Revalidate |
| 图片 | 所有图片 | Cache First |

### 缓存版本管理

- 使用 `CACHE_VERSION` 管理版本
- 新版本激活时自动清理旧缓存
- 支持后台更新和手动更新

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
| 联机模式 | emerald-500 / teal-600 |
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

手动测试矩阵：

| 测试项 | 微信安卓 | 微信iOS | Safari | Chrome |
|--------|----------|---------|--------|--------|
| 人机模式 | ✅ | ✅ | ✅ | ✅ |
| 联机模式 | ✅ | ✅ | ✅ | ✅ |
| 输入验证 | ✅ | ✅ | ✅ | ✅ |
| AI响应 | ✅ | ✅ | ✅ | ✅ |
| 断线重连 | ✅ | ✅ | ✅ | ✅ |
| PWA安装 | N/A | ✅ | ✅ | ✅ |
| 离线功能 | N/A | ✅ | ✅ | ✅ |

### 关键测试用例

1. **TC001**: 输入边界测试 - 非数字字符过滤、超长输入截断
2. **TC002**: AI 响应性能 - 10000 可能性时计算耗时 < 500ms
3. **TC003**: 游戏胜负判定
4. **TC004**: 联机房间创建 - 生成6位房间号
5. **TC005**: 联机断线重连 - 自动重连最多5次
6. **TC006**: PWA 离线功能 - 断网后单机模式仍可游玩
7. **TC007**: PWA 安装流程 - 各平台安装提示正常

## 网络安全与合规

### 安全配置
- Content-Security-Policy 响应头
- HTTPS 强制跳转
- 防盗链配置

### 数据合规
- 纯前端应用，无用户数据存储
- 天然符合《网络安全法》和《数据安全法》
- 数据本地化存储（localStorage/IndexedDB）

## 版本历史

- **v2.1.0** (2026-02-19): PWA 改造完成，支持离线游玩、安装到主屏幕、缓存更新
- **v2.0.0** (2026-02-19): 新增双人联机模式，支持好友房间、实时对战、断线重连、弱网适配
- **v1.2.0** (2026-02-18): 国内CDN优化，添加完整国内部署方案
- **v1.1.0** (2026-02-18): 微信H5适配版
- **v1.0.0** (2026-02-18): 初始版本，支持微信H5、人机对战
