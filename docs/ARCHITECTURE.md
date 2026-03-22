# 数字对决 Pro - 架构设计文档

**版本**: 2.3.0
**更新时间**: 2026-03-23
**维护者**: Chris

---

## 1. 系统概述

数字对决 Pro 是一款数字推理对战游戏，提供两个平台版本：
- **H5 Web 版本**：基于浏览器的 PWA 应用
- **微信小游戏版本**：基于 Canvas 2D 的原生小游戏

### 1.1 核心特性

| 特性 | H5 Web | 微信小游戏 |
|------|--------|------------|
| 单机模式 | ✅ 与 AI 对战 | ✅ 与 AI 对战 |
| 联机模式 | ✅ WebSocket 实时对战 | 🔜 计划中 |
| PWA 支持 | ✅ 可安装、离线游玩 | N/A |
| 响应式设计 | ✅ 桌面端/移动端 | ✅ 全屏适配 |

### 1.2 技术选型对比

| 层级 | H5 Web | 微信小游戏 |
|------|--------|------------|
| 渲染 | HTML + CSS (Tailwind) | Canvas 2D |
| 框架 | Vanilla JS (ES6+) | Vanilla JS (ES6+) |
| 实时通信 | WebSocket | 🔜 计划中 |
| 离线缓存 | Service Worker | wx.setStorageSync |
| 测试框架 | Jest + Playwright | Jest |

---

## 2. H5 Web 架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        客户端 (Browser)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │  UI层   │  │ 游戏层  │  │ 网络层  │  │ 存储层  │        │
│  │ (HTML)  │  │  (JS)   │  │  (WS)   │  │ (LS/SW) │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       │            │            │            │              │
│       └────────────┴────────────┴────────────┘              │
│                          │                                   │
│                    ┌─────┴─────┐                            │
│                    │   app.js  │                            │
│                    │  (主入口) │                            │
│                    └───────────┘                            │
└─────────────────────────────────────────────────────────────┘
                           │
                    WebSocket
                           │
┌─────────────────────────────────────────────────────────────┐
│                     服务器 (Node.js)                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ WebSocket   │  │   房间管理   │  │   游戏逻辑   │         │
│  │   Server    │  │   (内存)    │  │   (裁判)    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                          │                                   │
│                   ┌──────┴──────┐                           │
│                   │    Redis    │ (可选，分布式部署)         │
│                   └─────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 前端模块架构

```
js/
├── config.js      # 配置中心 - 环境检测、调试开关
├── icons.js       # 图标系统 - SVG图标管理
├── audio.js       # 音效系统 - 音频播放、振动反馈
├── storage.js     # 存储系统 - localStorage 封装
├── game.js        # 游戏核心 - 规则、验证、计算
├── ai.js          # AI引擎 - Minimax + 信息熵算法
├── network.js     # 网络通信 - WebSocket客户端
├── pwa.js         # PWA管理 - 安装、更新、缓存
└── app.js         # 应用入口 - 初始化、事件绑定
```

### 2.3 模块依赖关系

```
                    ┌───────────┐
                    │  app.js   │ (主入口)
                    └─────┬─────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌───────────┐      ┌───────────┐     ┌───────────┐
│  game.js  │      │ network.js│     │   pwa.js  │
└─────┬─────┘      └─────┬─────┘     └───────────┘
      │                  │
      ▼                  ▼
┌───────────┐      ┌───────────┐
│   ai.js   │      │  config.js │
└───────────┘      └───────────┘
                          │
                          ▼
                   ┌───────────┐
                   │ storage.js│
                   └───────────┘
```

---

## 3. 微信小游戏架构

### 3.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    微信小游戏运行时                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   渲染引擎   │  │  场景管理   │  │  输入管理   │        │
│  │ (Renderer)  │  │ (Scene)     │  │ (Input)     │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                 │
│         └────────────────┼────────────────┘                 │
│                          │                                  │
│                    ┌─────┴─────┐                           │
│                    │  game.js  │                           │
│                    │  (入口)   │                           │
│                    └───────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 模块结构

```
miniprogram/
├── game.js                # 入口文件：初始化、游戏循环
├── js/
│   ├── core/
│   │   ├── game.js        # 游戏核心逻辑
│   │   └── ai.js          # AI 算法
│   ├── engine/
│   │   ├── renderer.js    # Canvas 渲染器
│   │   ├── scene.js       # 场景管理器
│   │   ├── input.js       # 触摸输入处理
│   │   ├── audio.js       # 音频管理
│   │   └── storage.js     # 本地存储
│   └── scenes/
│       ├── menu.js        # 主菜单场景
│       ├── game.js        # 游戏场景
│       ├── result.js      # 结果场景
│       ├── settings.js    # 设置场景
│       ├── history.js     # 历史记录场景
│       └── guide.js       # 新手引导场景
```

### 3.3 渲染引擎

**Renderer 类** - Canvas 2D 渲染封装

```javascript
class Renderer {
  // 绘制基础图形
  drawRect(x, y, w, h, options)    // 矩形
  drawText(text, x, y, options)    // 文字

  // 绘制游戏组件
  drawButton(x, y, w, h, text)     // 按钮
  drawDigitBox(x, y, size, digit)  // 数字格
  drawKey(x, y, w, h, label)       // 键盘按键
  drawHistoryItem(x, y, w, ...)    // 历史记录项
  drawGradientBackground()         // 渐变背景
}
```

### 3.4 场景管理

**SceneManager 类** - 场景生命周期管理

```javascript
class SceneManager {
  register(name, scene)    // 注册场景
  switchTo(name, params)   // 切换场景
  update(deltaTime)        // 更新当前场景
  render(renderer)         // 渲染当前场景
  handleInput(events)      // 分发输入事件
}
```

**场景接口**:

```javascript
class BaseScene {
  onEnter(params) { }      // 进入场景
  onExit() { }             // 离开场景
  update(deltaTime) { }    // 更新逻辑
  render(renderer) { }     // 渲染画面
  handleInput(events) { }  // 处理输入
}
```

### 3.5 输入处理

**InputManager 类** - 触摸事件处理

```javascript
class InputManager {
  // 事件类型
  // - tap: 点击事件
  // - swipe: 滑动事件
  // - longpress: 长按事件

  getEvents()              // 获取事件队列
  hitTest(event, x, y, w, h)  // 碰撞检测
}
```

---

## 4. 核心模块设计（H5 Web）

### 4.1 游戏核心 (game.js)

**职责**: 游戏规则、输入验证、结果计算

```javascript
// 核心API
generateSecretNumber(digitCount)  // 生成秘密数字
validateInput(input, digitCount)  // 验证输入
calculateHint(guess, secret)      // 计算提示 (xAyB)
isCorrect(guess, secret)          // 判断正确
getHintMessage(hit, blow)         // 获取提示信息
```

**设计原则**:
- 纯函数设计，无副作用
- 支持不同位数游戏（3-5位）
- 完整的输入验证

### 3.2 AI引擎 (ai.js)

**职责**: AI对手逻辑、最优猜测算法

```javascript
// 核心API
class NumberGuessingAI {
    constructor(digitCount)
    selectOpeningGuess()          // 选择开局猜测
    selectBestGuess()             // 选择最佳猜测
    calculateEntropy(guess)       // 计算信息熵
    updateWithFeedback(feedback)  // 根据反馈更新
}
```

**算法说明**:
1. **开局策略**: 使用预计算的信息熵最优开局（4位: "0011"）
2. **Minimax算法**: 选择使最坏情况剩余候选最少的猜测
3. **信息熵**: 计算每个猜测的期望信息增益

### 3.3 网络通信 (network.js)

**职责**: WebSocket连接、消息处理、重连机制

```javascript
// 核心API
class WebSocketClient {
    connect(url)                  // 建立连接
    send(message)                 // 发送消息
    on(event, handler)            // 注册事件处理
    reconnect()                   // 重连机制
    startHeartbeat()              // 心跳检测
}
```

**关键特性**:
- 自动重连（指数退避，最多5次）
- 心跳检测（5秒间隔，3次丢失判定断线）
- 全局重连限制（20次/分钟）
- 弱网消息合并（500ms窗口）

### 3.4 存储系统 (storage.js)

**职责**: 本地数据持久化

```javascript
// 存储键
STORAGE_KEYS = {
    GAME_HISTORY: 'ngg_history',
    SETTINGS: 'ngg_settings',
    SOUND_ENABLED: 'soundEnabled',
    STATS: 'ngg_stats'
}
```

---

## 4. 数据流设计

### 4.1 单机模式数据流

```
用户输入 ──→ validateInput() ──→ calculateHint()
                                         │
                                         ▼
                              更新UI显示结果
                                         │
                                         ▼
                              AI.selectBestGuess()
                                         │
                                         ▼
                              更新UI显示AI猜测
```

### 4.2 联机模式数据流

```
玩家A                服务器                玩家B
  │                    │                    │
  │── submit_guess ───→│                    │
  │                    │── guess_result ───→│
  │                    │                    │
  │←── turn_change ────│                    │
  │                    │←── submit_guess ───│
  │                    │── guess_result ───→│
  │                    │                    │
  │                    │←── turn_change ────│
```

---

## 5. PWA架构

### 5.1 缓存策略

| 资源类型 | 策略 | 说明 |
|----------|------|------|
| 核心文件 | Cache First | index.html, manifest.json |
| CDN资源 | Stale While Revalidate | Tailwind CSS |
| 图标 | Cache First | /icons/* |
| API请求 | Network Only | WebSocket |

### 5.2 Service Worker生命周期

```
安装(install) ──→ 激活(activate) ──→ 拦截请求(fetch)
       │                                    │
       └── 预缓存核心资源                    └── 根据策略响应
```

---

## 6. 安全设计

### 6.1 消息验证

服务器对所有消息进行Schema验证：

```javascript
MESSAGE_SCHEMAS = {
    create_room: { roomCode: /^[0-9A-F]{6}$/, playerId: 'string' },
    submit_guess: { roomCode, playerId, guess: /^\d{4}$/ },
    // ...
}
```

### 6.2 防护措施

| 威胁 | 防护措施 |
|------|----------|
| XSS | 内联脚本使用CSP |
| 注入攻击 | 输入验证、参数化 |
| DDoS | 连接限流、心跳检测 |
| 中间人攻击 | WSS加密传输 |

---

## 7. 性能优化

### 7.1 前端优化

| 优化项 | 实施方式 |
|--------|----------|
| 资源加载 | CDN加速、懒加载 |
| 渲染性能 | 虚拟滚动、防抖节流 |
| 缓存利用 | Service Worker |
| 包体积 | 无构建、按需加载 |

### 7.2 后端优化

| 优化项 | 实施方式 |
|--------|----------|
| 连接管理 | 连接池、心跳保活 |
| 内存管理 | 定期清理空闲房间 |
| 分布式 | Redis状态共享 |

---

## 8. 部署架构

### 8.1 简单部署（单实例）

```
用户 ──→ CDN ──→ 静态文件 (index.html)
              │
              └──→ WebSocket服务器 (单实例)
```

### 8.2 高可用部署（多实例）

```
用户 ──→ 负载均衡 ──→ WebSocket实例1
                    │
                    ├──→ WebSocket实例2
                    │
                    └──→ Redis (状态共享)
```

---

## 9. 扩展性设计

### 9.1 功能扩展点

| 扩展点 | 说明 |
|--------|------|
| 位数变化 | AI支持3-5位，游戏逻辑可配置 |
| 主题系统 | CSS变量已预留 |
| AI策略 | 可注入不同算法 |
| 房间功能 | 支持密码、观战等 |

### 9.2 未来架构演进

```
当前架构                      未来演进
──────────                   ──────────
单文件应用                    可能的拆分
├── index.html               ├── 组件化（可选Web Components）
└── js/*.js                  ├── 状态管理（可选Proxy-based）
                             └── 构建工具（可选Vite）
```

---

## 10. 技术债务

### 10.1 已知限制

| 项目 | 当前状态 | 计划改进 |
|------|----------|----------|
| 图标系统 | 使用emoji | 迁移到SVG图标 |
| 音效系统 | 部分实现 | 完善音效库 |
| 测试覆盖 | 58个测试 | 增加边界测试 |

---

*文档维护: Chris*
*最后更新: 2026-03-23*