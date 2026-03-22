# 数字对决 Pro 微信小程序设计文档

**版本**: 1.0.0
**日期**: 2026-03-22
**状态**: 待审核

---

## 一、项目概述

### 1.1 产品定位

**数字对决 Pro** 微信小程序是一款**社交竞技数字推理游戏**，以好友对战、排行榜、每日挑战为核心玩法，打造轻量、有趣、有竞争感的休闲游戏体验。

### 1.2 目标用户

- 微信生态用户
- 喜欢休闲益智游戏的玩家
- 有社交竞争需求的用户

### 1.3 核心价值

- **社交竞技**：好友对战、排行榜竞争、每日挑战
- **轻量休闲**：单局 3-5 分钟，随时开玩
- **策略乐趣**：AI 算法挑战，推理成就感

---

## 二、MVP 功能范围

### 2.1 功能清单

| 功能 | 优先级 | 来源 | 说明 |
|------|--------|------|------|
| AI 单机对战 | P0 | 现有 | 与 AI 对战，可离线 |
| 好友对战 | P0 | 现有 | 房间邀请制，WebSocket 实时对战 |
| 每日挑战 | P0 | 新增 | 每天固定题目，好友最少步数排行 |
| 排行榜 | P0 | 新增 | 胜率榜、连胜榜、每日挑战榜 |
| 微信登录 | P0 | 新增 | 微信授权登录，获取用户信息 |
| 双主题 | P0 | 新增 | 深色/浅色主题切换 |
| 成就系统 | P1 | 新增 | V1.1 迭代 |
| 好友系统 | P1 | 新增 | V1.1 迭代 |
| 战绩统计增强 | P2 | 新增 | V1.2 迭代 |

### 2.2 功能详情

#### 2.2.1 每日挑战

**功能描述**：
- 每日 0:00 自动生成新题目（4位数字，固定难度）
- 用户参与挑战，记录步数和用时
- 好友排行榜按步数→用时→完成时间排序
- 每日限参与一次，可查看历史挑战记录

**技术实现**：
- 云函数定时任务生成题目
- 云数据库存储挑战记录
- Redis 缓存热门日期排行榜

#### 2.2.2 排行榜

**排行榜维度**：
1. **胜率榜**：胜场/总场数，要求最低 10 场
2. **连胜榜**：当前连胜次数
3. **最快猜中榜**：最少步数猜中记录
4. **每日挑战榜**：当日挑战最少步数

**更新策略**：
- 连胜榜、最快猜中榜：实时更新
- 胜率榜：云函数每小时聚合
- 每日挑战榜：游戏结束时更新

#### 2.2.3 好友对战

**基于现有功能改造**：
1. 接入微信登录，用 openid 替代匿名 playerId
2. 支持微信分享邀请好友
3. 支持微信好友在线状态显示（V1.1）

---

## 三、技术架构

### 3.1 架构选型

**方案**：微信云托管 + 云数据库

**选型理由**：
- 复用现有 Node.js 服务器代码，改造成本低
- 全托管服务，运维成本低
- 与微信生态深度集成

### 3.2 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    微信小程序前端                             │
│              WXML/WXSS/JS + Vant Weapp                       │
└─────────────────────────┬───────────────────────────────────┘
                          │ wx.connectSocket()
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              微信云托管 - Docker 容器                         │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │  Node.js 服务器  │    │  Redis (可选)   │                │
│  │  (现有代码复用)  │    │  状态缓存        │                │
│  └────────┬────────┘    └─────────────────┘                │
└───────────┼─────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                   微信云数据库                                │
│    users, games, daily_challenges, rankings, achievements   │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| **前端框架** | 微信小程序原生 | - | 无跨端需求，原生最优 |
| **UI 组件** | Vant Weapp | 1.11.x | 支持主题定制，组件丰富 |
| **状态管理** | 小程序全局数据 | - | 简单场景无需引入额外方案 |
| **后端运行时** | Node.js | 18.x | 现有代码复用 |
| **WebSocket** | ws | ^8.14.2 | 现有代码复用 |
| **缓存** | Redis | 7-alpine | 可选，云托管内置 |
| **数据库** | 微信云数据库 | - | 文档数据库，免费额度 |
| **定时任务** | 云函数 | - | 每日挑战生成、排行榜聚合 |

---

## 四、数据模型

### 4.1 集合设计

#### users (用户表)

```javascript
{
  _id: String,              // 文档ID
  openid: String,           // 微信 openid (唯一索引)
  unionid: String,          // 微信 unionid
  nickname: String,         // 昵称
  avatar: String,           // 头像URL
  stats: {
    totalGames: Number,     // 总对局数
    wins: Number,           // 胜场
    losses: Number,         // 负场
    winStreak: Number,      // 当前连胜
    maxWinStreak: Number,   // 最大连胜
    avgSteps: Number,       // 平均猜中步数
    fastestWin: Number      // 最快猜中步数
  },
  settings: {
    theme: String,          // 'dark' | 'light'
    soundEnabled: Boolean,
    difficulty: Number      // 3-5
  },
  achievements: [{
    id: String,
    unlockedAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

#### games (游戏记录表)

```javascript
{
  _id: String,
  mode: String,             // 'ai' | 'friend' | 'daily'
  difficulty: Number,       // 3-5
  players: {
    host: {
      openid: String,
      nickname: String,
      secret: String,
      history: [{ guess, hits, blows }],
      steps: Number,
      isWinner: Boolean
    },
    guest: { ... }          // AI模式为null
  },
  winner: String,           // 获胜者 openid
  dailyDate: String,        // 每日挑战日期 (YYYY-MM-DD)
  startedAt: Date,
  endedAt: Date,
  duration: Number          // 游戏时长(秒)
}
```

#### daily_challenges (每日挑战表)

```javascript
{
  _id: String,
  date: String,             // "2026-03-22" (唯一索引)
  secret: String,           // 谜题答案 (加密存储)
  difficulty: Number,       // 4 (固定)
  participants: Number,     // 参与人数
  leaderboard: [{
    openid: String,
    nickname: String,
    avatar: String,
    steps: Number,
    duration: Number,
    completedAt: Date
  }],                       // 前100名
  createdAt: Date
}
```

#### rankings (排行榜表)

```javascript
{
  _id: String,
  type: String,             // 'winRate' | 'winStreak' | 'fastestWin' | 'daily'
  period: String,           // 'allTime' | 'weekly' | 'daily'
  updated: Date,
  ranks: [{
    rank: Number,
    openid: String,
    nickname: String,
    avatar: String,
    value: Number,
    extra: Object
  }]                        // 前100名
}
```

#### achievements (成就定义表)

```javascript
{
  _id: String,              // 'first_win' | 'streak_5' | 'master' ...
  name: String,
  description: String,
  icon: String,
  category: String,         // 'gameplay' | 'social' | 'challenge'
  condition: {
    type: String,
    value: Number
  },
  reward: {
    title: String,
    badge: String
  }
}
```

### 4.2 索引策略

| 集合 | 索引字段 | 类型 | 说明 |
|------|---------|------|------|
| users | openid | 唯一 | 用户查询 |
| games | mode, startedAt | 复合 | 按模式查询记录 |
| games | dailyDate | 普通 | 每日挑战查询 |
| daily_challenges | date | 唯一 | 日期查询 |
| rankings | type, period | 复合 | 排行榜查询 |

---

## 五、页面结构

### 5.1 页面导航

采用 **TabBar 底部导航** 结构：

```
┌─────────────────────────────────────────┐
│              TabBar (底部)               │
│  首页  │  排行榜  │  大厅  │  我的      │
└─────────────────────────────────────────┘
```

### 5.2 页面清单

| 页面 | 路径 | 功能 |
|------|------|------|
| 首页 | /pages/index/index | 游戏入口、AI对战、每日挑战 |
| 游戏页 | /pages/game/game | 游戏主界面 |
| 排行榜 | /pages/rank/rank | 各维度排行 |
| 联机大厅 | /pages/lobby/lobby | 创建/加入房间、随机匹配 |
| 房间页 | /pages/room/room | 等待玩家、设置难度 |
| 历史记录 | /pages/history/history | 战绩回顾 |
| 个人中心 | /pages/profile/profile | 设置、成就、统计 |

### 5.3 组件清单

| 组件 | 路径 | 说明 |
|------|------|------|
| 数字键盘 | /components/keyboard/keyboard | 游戏输入 |
| 猜测历史 | /components/history/history | 猜测记录展示 |
| AI 终端 | /components/ai-terminal/ai-terminal | AI 思考可视化 |
| 排行榜项 | /components/rank-item/rank-item | 排行列表项 |
| 成就卡片 | /components/achievement/achievement | 成就展示 |

---

## 六、接口设计

### 6.1 WebSocket 消息协议

**复用现有协议**，新增以下消息类型：

| 类型 | 方向 | 说明 |
|------|------|------|
| `login` | C→S | 微信登录，携带 code |
| `login_success` | S→C | 登录成功，返回用户信息 |
| `daily_challenge` | C→S | 开始每日挑战 |
| `daily_result` | S→C | 每日挑战结果 |

### 6.2 云函数接口

| 函数名 | 触发方式 | 说明 |
|--------|---------|------|
| `generateDailyChallenge` | 定时触发 (每日0点) | 生成每日挑战题目 |
| `updateRankings` | 定时触发 (每小时) | 聚合更新排行榜 |
| `checkAchievements` | 游戏结束时调用 | 检查成就解锁 |

### 6.3 云数据库操作

通过云托管 Node.js 服务器操作云数据库：

```javascript
// 初始化云数据库
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

// 示例：保存游戏记录
async function saveGame(gameData) {
  return await db.collection('games').add({ data: gameData })
}
```

---

## 七、安全设计

### 7.1 用户认证

- 微信静默登录获取 openid
- 敏感操作需检查 openid 匹配
- WebSocket 连接时验证身份

### 7.2 数据安全

- 每日挑战答案加密存储
- 用户输入验证（防注入）
- 敏感数据传输使用 HTTPS/WSS

### 7.3 防作弊

- 服务端验证所有游戏逻辑
- 步数/时间由服务端计算
- 异常数据检测与告警

---

## 八、开发规范

### 8.1 代码规范

- JavaScript: ESLint + Airbnb 规范
- 命名: camelCase (变量/方法), PascalCase (类)
- 注释: JSDoc 格式

### 8.2 Git 规范

- 分支: main (生产), develop (开发), feature/* (功能)
- 提交: feat/fix/docs/style/refactor 前缀

### 8.3 目录结构

```
miniprogram/
├── app.js
├── app.json
├── app.wxss
├── pages/
│   ├── index/
│   ├── game/
│   ├── rank/
│   ├── lobby/
│   ├── room/
│   ├── history/
│   └── profile/
├── components/
│   ├── keyboard/
│   ├── history/
│   ├── ai-terminal/
│   ├── rank-item/
│   └── achievement/
├── utils/
│   ├── game.js          # 复用现有
│   ├── ai.js            # 复用现有
│   ├── network.js       # 适配小程序
│   ├── storage.js       # 适配小程序
│   └── api.js           # 新增：云函数调用
└── assets/
    ├── images/
    └── sounds/
```

---

## 九、测试策略

### 9.1 测试类型

| 类型 | 工具 | 覆盖率要求 |
|------|------|-----------|
| 单元测试 | Jest | ≥80% |
| 组件测试 | 微信开发者工具 | 核心组件 |
| E2E 测试 | miniprogram-automator | 核心流程 |

### 9.2 测试用例

**核心测试场景**：
1. AI 对战完整流程
2. 好友对战流程
3. 每日挑战流程
4. 排行榜更新逻辑
5. 断线重连处理

---

## 十、上线计划

### 10.1 合规准备

| 事项 | 状态 | 预计完成 |
|------|------|---------|
| 软件著作权登记 | 待申请 | 30工作日 |
| ICP 备案 | 待办理 | 20工作日 |
| 隐私政策 | 待编写 | 1天 |
| 用户协议 | 待编写 | 1天 |

### 10.2 发布计划

| 阶段 | 版本 | 内容 | 预计时间 |
|------|------|------|---------|
| 内测 | 0.9.0 | MVP 功能内测 | 开发完成后 |
| 公测 | 0.95.0 | 修复内测问题 | 1周后 |
| 正式 | 1.0.0 | 正式上线 | 审核通过后 |

### 10.3 运营计划

- 每日挑战分享功能
- 排行榜社交传播
- 成就分享炫耀

---

## 十一、风险与对策

| 风险 | 影响 | 对策 |
|------|------|------|
| 审核不通过 | 上线延期 | 提前了解审核规范，避免违规内容 |
| 云托管成本超预期 | 成本压力 | 监控资源使用，优化性能 |
| 用户留存低 | 产品失败 | 优化新手引导，增加每日挑战粘性 |
| 作弊行为 | 公平性问题 | 服务端验证，异常检测 |

---

## 附录

### A. 参考资料

- [微信小程序开发文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [Vant Weapp 组件库](https://vant-contrib.gitee.io/vant-weapp/)
- [微信云托管文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)

### B. 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0.0 | 2026-03-22 | 初始版本 |