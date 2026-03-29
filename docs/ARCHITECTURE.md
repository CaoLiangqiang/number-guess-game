# 数字对决 Pro 架构说明

**版本**: 2.4.24
**更新时间**: 2026-03-29

---

## 1. 系统概览

当前版本包含三个运行形态：

| 运行形态 | 入口 | 目标 | 说明 |
|----------|------|------|------|
| H5 Web | `index.html` | 面向玩家 | 浏览器/PWA，支持 AI 对战和双人联机 |
| 微信小游戏 | `miniprogram/game.js` | 面向玩家 | Canvas 2D 原生小游戏，当前以单机 AI 和每日挑战为主 |
| 小程序预览壳 | `miniprogram-preview.html` | 面向研发 | 在浏览器中复用小游戏模块，做 UI 检查和截图导出 |

共享产品规则：

- 支持 `3/4/5` 位数字
- 允许重复数字
- 允许首位数字为 `0`
- AI 开局策略按重复数字规则优化，4 位默认首猜为 `0011`

---

## 2. H5 Web 架构

### 2.1 客户端模块

```
index.html
├── js/config.js     # 环境检测、服务地址、版本信息
├── js/game.js       # 规则校验、提示计算、核心工具函数
├── js/ai.js         # AI 选点和信息熵策略
├── js/network.js    # WebSocket 客户端、重连、弱网处理
├── js/audio.js      # 音效和振动反馈
├── js/storage.js    # 本地存储
├── js/pwa.js        # 安装和更新提示
└── js/app.js        # 页面状态与交互编排
```

### 2.2 服务端模块

```
server/
├── server.js        # WebSocket 主服务
├── logger.js        # 日志输出
├── daily-challenge.js
├── ranking.js
├── wechat.js
├── cloud-db.js
└── token.js
```

关键实现点：

- WebSocket 服务基于 Node.js `ws`
- 房间状态优先保存在内存，可选 Redis 共享
- 协议支持创建房间、加入房间、准备、提交猜测、重赛、随机匹配、难度变更、断线重连
- `/health` 提供健康检查

---

## 3. 微信小游戏架构

### 3.1 模块层次

```
miniprogram/
├── game.js
└── js/
    ├── core/
    │   ├── game.js
    │   └── ai.js
    ├── engine/
    │   ├── renderer.js
    │   ├── scene.js
    │   ├── input.js
    │   ├── audio.js
    │   └── storage.js
    └── scenes/
        ├── menu.js
        ├── game.js
        ├── result.js
        ├── settings.js
        ├── history.js
        └── guide.js
```

### 3.2 责任划分

- `core/game.js`
  - 生成谜底
  - 校验输入
  - 计算匹配反馈
  - 生成每日挑战谜题
- `core/ai.js`
  - AI 开局策略
  - 候选集收缩
  - 最佳猜测选择
- `engine/renderer.js`
  - Canvas 2D 绘制抽象
  - 统一按钮、发光、卡片等 UI 基础能力
- `engine/scene.js`
  - 场景注册、切换、更新、渲染
- `engine/input.js`
  - 将触摸输入归一化为 tap / swipe / touchstart / touchend
- `engine/storage.js`
  - 设置、历史、统计、每日挑战成绩的本地持久化
  - 聚合统计，如平均回合、最佳用时、总用时、总猜测次数

### 3.3 场景边界

- `menu.js`
  - AI 对战入口
  - 每日挑战入口
  - 设置、历史、引导入口
- `game.js`
  - AI 对战和每日挑战主流程
  - 帮助弹窗
  - 暂停弹窗
  - AI 思考状态与预计耗时
- `result.js`
  - 胜负反馈
  - 记录破纪录状态
- `settings.js`
  - 难度、音效、振动、配色、AI 动画速度
  - 汇总统计展示
- `history.js`
  - 战绩列表浏览
  - 清空记录确认
- `guide.js`
  - 新手引导与规则说明

---

## 4. 小程序预览壳架构

预览壳不复制小游戏 UI，而是直接在浏览器中启动小游戏入口。

```
miniprogram-preview.html
└── js/miniprogram-preview/
    ├── module-loader.js  # 在浏览器里解析 CommonJS require
    ├── wx-shim.js        # 模拟 wx、canvas、storage、audio、share 等基础 API
    ├── seed-data.js      # 注入场景所需的 settings/stats/history/daily 数据
    └── app.js            # 绑定控制面板、切换场景、导出截图
```

关键实现点：

- `module-loader.js` 通过同步文本加载和 `new Function` 执行小游戏模块
- `wx-shim.js` 提供最小可运行 `wx` 环境，包括：
  - `createCanvas`
  - `getStorageSync` / `setStorageSync`
  - `showToast` / `showModal`
  - `createInnerAudioContext`
  - `canvasToTempFilePath`
- `seed-data.js` 提供常用验收预设，避免手动打流程
- `app.js` 负责：
  - 绑定指针事件到小游戏触摸事件
  - 注入预设数据
  - 调整 viewport
  - 导出 PNG

限制：

- 预览壳是开发工具，不是发布产物
- 最终机型表现、微信容器行为和审核相关问题，仍需在微信开发者工具中验证

---

## 5. 数据与状态

### 5.1 H5

- 浏览器本地存储保存设置、历史和客户端状态
- 联机房间状态由 WebSocket 服务维护
- Redis 可选，用于多实例共享房间和恢复

### 5.2 微信小游戏

- `wx.setStorageSync` 保存设置、历史、统计和每日挑战结果
- `storage.js` 负责统计聚合，不把展示逻辑散落到各个 scene

---

## 6. 版本与发布元数据

版本号以 `package.json` 为源头。

`update-git-version.js` 会把当前版本和短提交哈希同步到：

- `js/config.js`
- `service-worker.js`
- `miniprogram/game.js`
- `README.md`
- `CLAUDE.md`

这样 H5、小游戏和文档的版本标识保持一致。

---

## 7. 测试与验证

测试体系分为两层：

- Jest
  - H5 规则与网络
  - 小游戏核心逻辑和启动流程
  - 小程序预览壳 runtime
- Playwright
  - H5 页面流程和视觉快照
  - 预览壳可做本地浏览器烟测，但不是最终发布验证手段

---

## 8. 当前边界

- 微信小游戏当前不承载双人联机，对外正式交付以单机 AI 和每日挑战为主
- H5 是联机能力的正式承载端
- 浏览器预览壳服务于研发和设计验收，不对玩家暴露
