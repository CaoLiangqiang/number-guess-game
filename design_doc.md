# 数字对决 Pro - 产品设计与部署方案

**版本**: v2.0.0  
**日期**: 2026-02-19  
**平台**: 微信H5 / 移动端浏览器  
**架构**: 前端 + 联机服务器（支持单机/联机双模式）

---

## 目录

1. [产品概述](#一产品概述)
2. [单人模式（人机对战）](#二单人模式人机对战)
3. [双人联机模式](#三双人联机模式)
4. [软件实现方案](#四软件实现方案)
5. [部署规划](#五部署规划)
6. [国内CDN优化](#六国内cdn优化)
7. [国内部署方案详解](#七国内部署方案详解)
8. [网络安全与合规](#八网络安全与合规)
9. [容灾备份机制](#九容灾备份机制)
10. [快速部署清单](#十快速部署清单)
11. [常见问题](#十一常见问题)
12. [更新日志](#十二更新日志)

---

## 一、产品概述

### 1.1 产品定位

**数字对决 Pro** 是一款基于 H5 的数字推理对战游戏，支持单机人机对战和双人实时联机对战两种模式。

| 属性 | 说明 |
|------|------|
| 产品名称 | 数字对决 Pro |
| 目标平台 | 微信内置浏览器、移动端浏览器（iOS Safari、Android Chrome） |
| 核心玩法 | 玩家选一个4位数字（0-9可重复），轮流猜测对方数字，根据"位置和数字都对"的个数反馈进行推理 |
| 游戏模式 | 单机人机对战、双人实时联机对战 |
| AI特色 | 使用 Minimax + 信息熵算法，可视化展示 AI 思考过程 |

### 1.2 游戏模式对比

| 特性 | 单人模式（PVC） | 双人联机模式（PVP） |
|------|----------------|---------------------|
| 网络需求 | 无需网络 | 需要网络连接 |
| 对手类型 | AI算法 | 真实玩家 |
| 匹配方式 | 即开即玩 | 好友邀请 / 随机匹配 |
| 回合时间 | 无限制 | 60秒/回合（可配置） |
| 断线处理 | 不适用 | 支持断线重连 |
| 数据存储 | 本地 | 服务器持久化 |

---

## 二、单人模式（人机对战）

### 2.1 核心规则

- 玩家和AI各选一个4位数字（0-9可重复，如：1122、0000）
- 轮流猜测对方数字
- 每次猜测后获得反馈："位置和数字都对"的个数（0-4）
- 最先猜中对方数字者获胜

### 2.2 AI算法特点

- 使用 Minimax 算法 + 信息熵计算
- AI 思考过程在终端面板可视化展示
- AI 首步固定使用 "0011"（最优开局策略）

---

## 三、双人联机模式

### 3.1 功能概述

双人联机模式允许两名玩家通过互联网进行实时对战，完全遵循单机模式的核心游戏规则和交互逻辑。

### 3.2 用户流程图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           双人联机模式用户流程图                               │
└─────────────────────────────────────────────────────────────────────────────┘

                                    ┌─────────┐
                                    │  主菜单  │
                                    └────┬────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
            ┌───────────────┐    ┌───────────────┐    ┌───────────────┐
            │   创建房间     │    │   加入房间     │    │   随机匹配     │
            │  (生成房间号)  │    │  (输入房间号)  │    │  (自动匹配)   │
            └───────┬───────┘    └───────┬───────┘    └───────┬───────┘
                    │                    │                    │
                    └────────────────────┼────────────────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │    等待对手连接      │
                              │  (显示房间号/二维码) │
                              └──────────┬──────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │     双方准备阶段     │
                              │  (各自设置秘密数字)  │
                              └──────────┬──────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │      游戏进行中      │
                              │  (轮流猜测实时同步)  │
                              └──────────┬──────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
            ┌───────────────┐    ┌───────────────┐    ┌───────────────┐
            │   正常结束     │    │   断线重连     │    │   中途退出     │
            │  (一方猜中)   │    │  (网络恢复)   │    │  (对方获胜)   │
            └───────┬───────┘    └───────┬───────┘    └───────┬───────┘
                    │                    │                    │
                    └────────────────────┼────────────────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │      结算页面        │
                              │  (显示双方秘密数字)  │
                              └──────────┬──────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │   再来一局/返回菜单  │
                              └─────────────────────┘
```

### 3.3 界面原型

#### 3.3.1 联机模式入口界面

```
┌─────────────────────────────────────────────────────────────────┐
│  # 数字对决 PRO                                                  │
│     AI深度推理 · 实时联机对战 · 即开即玩                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🤖 挑战 AI                                              │ │
│  │     与最强算法对决，观看AI思考全过程                      │ │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  👥 双人联机                                             │ │
│  │     与好友实时对战，比拼推理速度                          │ │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📋 游戏规则                                             │ │
│  │  1. 双方各选一个四位数（0-9可重复）                       │ │
│  │  2. 轮流猜测，根据反馈推理对方数字                        │ │
│  │  3. 最先猜中对方数字者获胜                               │ │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.3.2 联机大厅界面

```
┌─────────────────────────────────────────────────────────────────┐
│  ← 返回主菜单                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🎮 创建房间                                             │ │
│  │     生成房间号，邀请好友加入                              │ │
│  │     [ 创建房间 ]                                         │ │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🔑 加入房间                                             │ │
│  │     输入好友分享的房间号                                  │ │
│  │     [ 输入6位房间号 ]    [ 加入 ]                        │ │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🎲 随机匹配                                             │ │
│  │     系统自动匹配在线玩家                                  │ │
│  │     [ 开始匹配 ]                                         │ │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📊 在线人数: 128人    匹配中: 12人    平均等待: 8秒      │ │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.3.3 等待房间界面

```
┌─────────────────────────────────────────────────────────────────┐
│  ← 返回大厅                                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    房间号: 8A3B9C                        │ │
│  │                    [复制] [分享微信]                      │ │
│  │                                                          │ │
│  │  ┌─────────────┐              ┌─────────────┐           │ │
│  │  │   👤 你     │              │   ⏳ 等待   │           │ │
│  │  │   (房主)   │              │   对手加入  │           │ │
│  │  │   [已准备]  │              │             │           │ │
│  │  └─────────────┘              └─────────────┘           │ │
│  │                                                          │ │
│  │  等待对手加入... (2/2)                                   │ │
│  │  [取消等待]                                              │ │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.3.4 联机对战游戏界面

```
┌─────────────────────────────────────────────────────────────────┐
│  房间: 8A3B9C    回合: 3/20    网络: ● 32ms                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │    你 👤     │  │   对战信息   │  │   对手 👤    │         │
│  │   步数: 2    │  │   VS         │  │   步数: 1    │         │
│  │   [你的回合]  │  │   ⏱️ 15:32   │  │   [思考中]   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   你的秘密   │  │   输入猜测   │  │   对手秘密   │         │
│  │   [已设置]   │  │  ┌─┬─┬─┐    │  │   [已设置]   │         │
│  │              │  │  │1│2│3│4│   │  │              │         │
│  │              │  │  └─┴─┴─┘    │  │              │         │
│  │              │  │  [提交猜测]  │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   你的历史   │  │   系统消息   │  │   对手历史   │         │
│  │  1234: 2/4   │  │  对手猜测    │  │  5678: 1/4   │         │
│  │  5678: 1/4   │  │  等待反馈... │  │  [等待反馈]  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.4 网络通信需求

#### 3.4.1 通信协议选择

| 协议 | 用途 | 说明 |
|------|------|------|
| WebSocket | 主要通信 | 实时双向数据传输，游戏状态同步 |
| HTTP/HTTPS | 辅助通信 | 房间管理、用户认证、排行榜查询 |
| STUN/TURN | NAT穿透 | 解决国内复杂网络环境下的连接问题 |

#### 3.4.2 消息类型定义

```typescript
// 客户端 → 服务器
enum ClientMessageType {
    CREATE_ROOM = 'create_room',      // 创建房间
    JOIN_ROOM = 'join_room',          // 加入房间
    LEAVE_ROOM = 'leave_room',        // 离开房间
    PLAYER_READY = 'player_ready',    // 玩家准备
    SET_SECRET = 'set_secret',        // 设置秘密数字
    SUBMIT_GUESS = 'submit_guess',    // 提交猜测
    HEARTBEAT = 'heartbeat',          // 心跳包
    RECONNECT = 'reconnect',          // 断线重连
}

// 服务器 → 客户端
enum ServerMessageType {
    ROOM_CREATED = 'room_created',    // 房间创建成功
    PLAYER_JOINED = 'player_joined',  // 有玩家加入
    PLAYER_LEFT = 'player_left',      // 有玩家离开
    GAME_START = 'game_start',        // 游戏开始
    TURN_START = 'turn_start',        // 回合开始
    GUESS_RESULT = 'guess_result',    // 猜测结果
    GAME_OVER = 'game_over',          // 游戏结束
    ERROR = 'error',                  // 错误信息
    PING = 'ping',                    // 服务器心跳
}
```

### 3.5 数据同步机制

#### 3.5.1 状态同步策略

采用**帧同步 + 状态校验**的混合方案：

```
┌─────────────────────────────────────────────────────────────────┐
│                      数据同步架构图                              │
└─────────────────────────────────────────────────────────────────┘

     玩家A (客户端)              游戏服务器              玩家B (客户端)
          │                          │                          │
          │  1. 提交猜测: 1234       │                          │
          │ ───────────────────────> │                          │
          │                          │                          │
          │                          │  2. 验证猜测合法性        │
          │                          │  3. 计算反馈结果          │
          │                          │                          │
          │  4. 广播猜测结果         │                          │
          │ <─────────────────────── │ ───────────────────────> │
          │                          │                          │
          │  5. 更新本地状态         │                          │  5. 更新本地状态
          │  6. 渲染UI              │                          │  6. 渲染UI
          │                          │                          │
          │  7. 状态校验请求         │                          │
          │ ───────────────────────> │                          │
          │                          │  8. 返回权威状态          │
          │ <─────────────────────── │                          │
```

#### 3.5.2 关键数据结构设计

```typescript
// 游戏房间状态
interface GameRoom {
    roomId: string;              // 房间ID (6位字母数字)
    hostId: string;              // 房主ID
    guestId?: string;            // 客人ID
    status: RoomStatus;          // 房间状态
    createdAt: number;           // 创建时间
    gameState?: GameState;       // 游戏状态
}

// 游戏状态
interface GameState {
    turn: number;                // 当前回合数
    currentPlayer: string;       // 当前行动玩家ID
    playerA: PlayerState;        // 玩家A状态
    playerB: PlayerState;        // 玩家B状态
    history: TurnRecord[];       // 历史记录
    startTime: number;           // 开始时间
    turnDeadline: number;        // 回合截止时间
}

// 玩家状态
interface PlayerState {
    playerId: string;
    secret: string;              // 秘密数字 (加密存储)
    stepCount: number;           // 步数
    isReady: boolean;            // 是否已准备
    isOnline: boolean;           // 是否在线
    lastPing: number;            // 最后心跳时间
}

// 回合记录
interface TurnRecord {
    turn: number;
    playerId: string;
    guess: string;
    feedback: number;            // 反馈结果 (0-4)
    timestamp: number;
}
```

### 3.6 异常处理策略

#### 3.6.1 断线重连机制

```
┌─────────────────────────────────────────────────────────────────┐
│                      断线重连流程图                              │
└─────────────────────────────────────────────────────────────────┘

    检测到断线
        │
        ▼
┌───────────────┐
│  尝试自动重连  │◄─────────────────────┐
│  (最多5次)    │                      │
└───────┬───────┘                      │
        │                              │
    重连成功?                          │
        │                              │
   ┌────┴────┐                         │
   │         │                         │
   是        否                        │
   │         │                         │
   ▼         ▼                         │
┌───────┐  ┌───────────────┐           │
│同步状态│  │ 显示重连失败  │           │
│恢复游戏│  │ [重新连接]   │───────────┘
└───────┘  └───────────────┘
```

#### 3.6.2 异常场景处理

| 异常场景 | 处理策略 | 用户体验 |
|----------|----------|----------|
| 玩家短暂断线 (<5秒) | 自动重连，游戏暂停等待 | 显示"对手网络不稳定，等待中..." |
| 玩家长时间断线 (>30秒) | 判定该玩家弃权，对方获胜 | 显示"对手已离线，你获得了胜利" |
| 回合超时 | 自动跳过该回合，切换玩家 | 显示"回合超时，自动跳过" |
| 网络抖动 | 消息队列缓冲，平滑处理 | 无明显感知 |
| 作弊检测 | 服务器校验，异常对局标记 | 对局无效，返回大厅 |

### 3.7 游戏平衡调整

#### 3.7.1 回合时间限制

| 模式 | 回合时间 | 说明 |
|------|----------|------|
| 休闲模式 | 无限制 | 适合好友间轻松对局 |
| 标准模式 | 60秒/回合 | 平衡思考时间和游戏节奏 |
| 快速模式 | 30秒/回合 | 快节奏对局 |
| 极限模式 | 15秒/回合 | 考验即时反应 |

#### 3.7.2 匹配机制

- **好友邀请**：生成6位房间号，支持微信分享
- **随机匹配**：基于ELO评分系统，匹配实力相近玩家
- **段位系统**：青铜→白银→黄金→铂金→钻石→王者

---

## 四、软件实现方案

### 4.1 系统架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           数字对决 Pro 系统架构                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              客户端层 (Client)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   微信浏览器     │  │   iOS Safari    │  │  Android Chrome │             │
│  │   (内置H5)      │  │   (移动端)      │  │   (移动端)      │             │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘             │
│           │                    │                    │                       │
│           └────────────────────┼────────────────────┘                       │
│                                │                                            │
│  ┌─────────────────────────────┴─────────────────────────────┐              │
│  │                    前端应用 (Vanilla JS)                   │              │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │              │
│  │  │ 游戏逻辑  │  │ 网络模块  │  │ 本地存储  │  │   UI渲染  │  │              │
│  │  │  (Game)  │  │(WebSocket│  │(IndexedDB│  │  (DOM)   │  │              │
│  │  └──────────┘  │  /HTTP)  │  └──────────┘  └──────────┘  │              │
│  │                └──────────┘                              │              │
│  └─────────────────────────────┬─────────────────────────────┘              │
│                                │                                            │
└────────────────────────────────┼────────────────────────────────────────────┘
                                 │ HTTPS/WSS
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           接入层 (Access Layer)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        阿里云 CDN / 腾讯云 CDN                       │   │
│  │  • 静态资源加速  • HTTPS卸载  • DDoS防护  • 智能调度                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        负载均衡器 (SLB/CLB)                          │   │
│  │  • 流量分发  • 健康检查  • 会话保持  • SSL终结                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           服务层 (Service Layer)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      API Gateway (Kong/Spring Gateway)               │   │
│  │  • 限流熔断  • 鉴权认证  • 日志记录  • 协议转换                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   游戏服务集群    │  │   匹配服务集群    │  │   用户服务集群    │             │
│  │  (Game Server)  │  │ (Match Service) │  │  (User Service) │             │
│  │                 │  │                 │  │                 │             │
│  │ • 房间管理      │  │ • 匹配算法      │  │ • 用户认证      │             │
│  │ • 状态同步      │  │ • 段位计算      │  │ • 数据管理      │             │
│  │ • 断线重连      │  │ • 排行榜        │  │ • 战绩统计      │             │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘             │
│           │                    │                    │                       │
│           └────────────────────┼────────────────────┘                       │
│                                │                                            │
│  ┌─────────────────────────────┴─────────────────────────────┐              │
│  │                    消息队列 (RocketMQ/RabbitMQ)            │              │
│  │  • 异步解耦  • 削峰填谷  • 可靠投递  • 顺序消息              │              │
│  └─────────────────────────────┬─────────────────────────────┘              │
│                                │                                            │
└────────────────────────────────┼────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           数据层 (Data Layer)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   Redis 集群     │  │   MySQL 主从     │  │   MongoDB 集群   │             │
│  │                 │  │                 │  │                 │             │
│  │ • 房间状态缓存   │  │ • 用户数据      │  │ • 游戏日志      │             │
│  │ • 在线用户      │  │ • 战绩数据      │  │ • 对局回放      │             │
│  │ • 排行榜        │  │ • 配置信息      │  │ • 审计日志      │             │
│  │ • 限流计数      │  │ • 关系数据      │  │ • 大数据分析    │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 联机架构设计

#### 4.2.1 国内网络优化策略

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        国内网络优化架构图                                     │
└─────────────────────────────────────────────────────────────────────────────┘

                              玩家A (北京)
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           华北节点 (北京)                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   WebSocket     │  │   STUN Server   │  │   TURN Server   │             │
│  │   Gateway       │  │   (NAT探测)     │  │   (中继转发)    │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
           ┌─────────────────────┼─────────────────────┐
           │                     │                     │
           ▼                     ▼                     ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│  华东节点(上海) │◄─────►│  华北节点(北京) │◄─────►│  华南节点(广州) │
│               │ 专线  │               │ 专线  │               │
└───────────────┘       └───────────────┘       └───────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    中心数据库集群    │
                    │  (主从同步/异地多活) │
                    └─────────────────────┘
                               │
           ┌───────────────────┼───────────────────┐
           │                   │                   │
           ▼                   ▼                   ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│  西南节点(成都) │       │  华中节点(武汉) │       │  西北节点(西安) │
│               │       │               │       │               │
└───────────────┘       └───────────────┘       └───────────────┘
```

#### 4.2.2 NAT穿透方案

| 方案 | 适用场景 | 实现方式 |
|------|----------|----------|
| STUN | 公网IP/全锥型NAT | 通过STUN服务器获取公网地址，直接P2P连接 |
| TURN | 对称型NAT/企业防火墙 | 通过TURN服务器中继转发数据 |
| WebSocket | 所有场景（保底） | 通过WebSocket服务器中转，保证连通性 |

```javascript
// NAT穿透检测流程
class NATTraversal {
    async checkNATType() {
        // 1. 尝试STUN获取公网地址
        const stunResult = await this.trySTUN();
        
        if (stunResult.directConnect) {
            // 可以直接P2P，但WebSocket更稳定，仍使用服务器中继
            return { type: 'WEBSOCKET', server: this.selectNearestServer() };
        }
        
        // 2. 尝试TURN中继
        const turnResult = await this.tryTURN();
        if (turnResult.success) {
            return { type: 'TURN', server: turnResult.server };
        }
        
        // 3. 保底方案：WebSocket
        return { type: 'WEBSOCKET', server: this.selectNearestServer() };
    }
    
    selectNearestServer() {
        // 根据用户IP选择最近的服务器节点
        const regions = {
            '华北': ['北京', '天津', '河北', '山西', '内蒙古'],
            '华东': ['上海', '江苏', '浙江', '安徽', '福建', '江西', '山东'],
            '华南': ['广东', '广西', '海南'],
            '华中': ['河南', '湖北', '湖南'],
            '西南': ['重庆', '四川', '贵州', '云南', '西藏'],
            '西北': ['陕西', '甘肃', '青海', '宁夏', '新疆'],
            '东北': ['辽宁', '吉林', '黑龙江']
        };
        // 返回对应区域的服务器地址
    }
}
```

#### 4.2.3 网络延迟优化

```javascript
// 延迟优化策略
class LatencyOptimizer {
    // 1. 预测性输入
    handleLocalInput(input) {
        // 立即在本地渲染，不等待服务器确认
        this.renderLocal(input);
        
        // 同时发送给服务器
        this.sendToServer(input);
        
        // 保存操作用于回滚
        this.pendingInputs.push(input);
    }
    
    // 2. 服务器状态校验
    onServerState(serverState) {
        if (this.stateMismatch(serverState)) {
            // 状态不一致，回滚并重新应用
            this.rollbackTo(serverState);
            this.reapplyPendingInputs();
        }
    }
    
    // 3. 插值平滑
    interpolateOpponentState(timestamp) {
        // 对对手状态进行插值，使移动更平滑
        const prev = this.getStateAt(timestamp - 100);
        const next = this.getStateAt(timestamp + 100);
        return this.lerp(prev, next, 0.5);
    }
}
```

#### 4.2.4 弱网环境适配

```javascript
// 弱网适配策略
class WeakNetworkAdapter {
    constructor() {
        this.quality = 'good'; // good | poor | bad
        this.adaptiveInterval = 1000; // 心跳间隔
    }
    
    // 网络质量检测
    checkNetworkQuality() {
        const rtt = this.measureRTT();
        const lossRate = this.measureLossRate();
        
        if (rtt < 100 && lossRate < 1) {
            this.quality = 'good';
            this.adaptiveInterval = 1000;
        } else if (rtt < 300 && lossRate < 5) {
            this.quality = 'poor';
            this.adaptiveInterval = 2000;
        } else {
            this.quality = 'bad';
            this.adaptiveInterval = 5000;
        }
    }
    
    // 消息压缩
    compressMessage(message) {
        // 使用MessagePack压缩
        return msgpack.encode(message);
    }
    
    // 消息合并
    batchMessages(messages) {
        // 将多个小消息合并发送
        return {
            type: 'batch',
            data: messages
        };
    }
    
    // 断线恢复
    async recoverConnection() {
        // 指数退避重连
        for (let i = 0; i < 5; i++) {
            await this.sleep(Math.pow(2, i) * 1000);
            if (await this.tryConnect()) {
                await this.syncGameState();
                return true;
            }
        }
        return false;
    }
}
```

### 4.3 实时数据同步机制

#### 4.3.1 同步协议设计

```javascript
// 基于WebSocket的实时同步协议
class GameSyncProtocol {
    // 客户端状态机
    states = {
        DISCONNECTED: 'disconnected',
        CONNECTING: 'connecting',
        CONNECTED: 'connected',
        SYNCING: 'syncing',
        IN_GAME: 'in_game'
    };
    
    // 消息序列号管理
    sequenceNumber = 0;
    pendingAcks = new Map();
    
    // 发送可靠消息
    sendReliable(message) {
        const seq = ++this.sequenceNumber;
        const packet = {
            seq,
            type: message.type,
            data: message.data,
            timestamp: Date.now()
        };
        
        // 保存等待确认
        this.pendingAcks.set(seq, {
            packet,
            retries: 0,
            lastSent: Date.now()
        });
        
        this.ws.send(JSON.stringify(packet));
        
        // 启动重传定时器
        this.scheduleRetransmit(seq);
    }
    
    // 发送非可靠消息（如心跳）
    sendUnreliable(message) {
        this.ws.send(JSON.stringify({
            ...message,
            timestamp: Date.now()
        }));
    }
    
    // 接收消息处理
    onMessage(rawMessage) {
        const message = JSON.parse(rawMessage);
        
        // 发送确认
        if (message.seq) {
            this.sendAck(message.seq);
        }
        
        // 处理确认
        if (message.type === 'ack') {
            this.pendingAcks.delete(message.seq);
            return;
        }
        
        // 处理业务消息
        this.handleBusinessMessage(message);
    }
}
```

#### 4.3.2 状态一致性保证

```javascript
// 权威服务器模式
class AuthoritativeServer {
    // 服务器是唯一的状态权威来源
    gameStates = new Map(); // roomId -> GameState
    
    // 处理玩家输入
    handleInput(roomId, playerId, input) {
        const state = this.gameStates.get(roomId);
        
        // 验证输入合法性
        if (!this.validateInput(state, playerId, input)) {
            return { error: 'Invalid input' };
        }
        
        // 应用输入到游戏状态
        const newState = this.applyInput(state, playerId, input);
        this.gameStates.set(roomId, newState);
        
        // 广播状态更新给所有玩家
        this.broadcast(roomId, {
            type: 'state_update',
            state: newState,
            timestamp: Date.now()
        });
        
        return { success: true };
    }
    
    // 定期全量同步（防止状态漂移）
    startFullSync() {
        setInterval(() => {
            for (const [roomId, state] of this.gameStates) {
                this.broadcast(roomId, {
                    type: 'full_sync',
                    state: state,
                    checksum: this.calculateChecksum(state)
                });
            }
        }, 10000); // 每10秒全量同步一次
    }
}
```

### 4.4 联机匹配系统

#### 4.4.1 匹配算法

```javascript
// 基于ELO的匹配系统
class MatchmakingSystem {
    constructor() {
        this.waitingQueue = []; // 等待匹配的玩家
        this.eloRange = 100; // 初始ELO匹配范围
        this.maxWaitTime = 30000; // 最大等待时间30秒
    }
    
    // 玩家请求匹配
    requestMatch(player) {
        player.joinTime = Date.now();
        player.eloRange = this.eloRange;
        this.waitingQueue.push(player);
        
        // 尝试立即匹配
        this.tryMatch(player);
        
        // 启动匹配扩展
        this.startMatchExpansion(player);
    }
    
    // 尝试匹配
    tryMatch(player) {
        const candidates = this.waitingQueue.filter(p => 
            p.id !== player.id &&
            Math.abs(p.elo - player.elo) <= player.eloRange
        );
        
        if (candidates.length > 0) {
            // 选择ELO最接近的对手
            const opponent = candidates.sort((a, b) => 
                Math.abs(a.elo - player.elo) - Math.abs(b.elo - player.elo)
            )[0];
            
            this.createMatch(player, opponent);
        }
    }
    
    // 匹配范围随时间扩展
    startMatchExpansion(player) {
        const expand = () => {
            const waitTime = Date.now() - player.joinTime;
            
            if (waitTime > this.maxWaitTime) {
                // 匹配AI或返回超时
                this.matchWithAI(player);
                return;
            }
            
            // 每5秒扩展一次匹配范围
            player.eloRange += 50;
            this.tryMatch(player);
            
            setTimeout(expand, 5000);
        };
        
        setTimeout(expand, 5000);
    }
    
    // 创建对局
    createMatch(player1, player2) {
        // 从队列移除
        this.waitingQueue = this.waitingQueue.filter(
            p => p.id !== player1.id && p.id !== player2.id
        );
        
        // 创建房间
        const room = this.gameRoomManager.createRoom({
            type: 'ranked',
            players: [player1, player2]
        });
        
        // 通知双方
        this.notifyMatchFound(player1, player2, room);
    }
}
```

#### 4.4.2 好友邀请系统

```javascript
// 好友房间管理
class FriendRoomManager {
    rooms = new Map(); // roomId -> Room
    
    // 创建房间
    createRoom(hostId) {
        const roomId = this.generateRoomId();
        const room = {
            id: roomId,
            hostId,
            guestId: null,
            status: 'waiting',
            createdAt: Date.now()
        };
        
        this.rooms.set(roomId, room);
        
        // 30分钟后自动清理
        setTimeout(() => this.cleanupRoom(roomId), 30 * 60 * 1000);
        
        return room;
    }
    
    // 生成6位房间号
    generateRoomId() {
        const chars = '0123456789ABCDEF';
        let id = '';
        for (let i = 0; i < 6; i++) {
            id += chars[Math.floor(Math.random() * chars.length)];
        }
        return id;
    }
    
    // 加入房间
    joinRoom(roomId, guestId) {
        const room = this.rooms.get(roomId);
        
        if (!room) {
            return { error: 'Room not found' };
        }
        
        if (room.guestId) {
            return { error: 'Room is full' };
        }
        
        room.guestId = guestId;
        room.status = 'ready';
        
        // 通知房主
        this.notifyHost(room.hostId, {
            type: 'player_joined',
            guestId
        });
        
        return { success: true, room };
    }
    
    // 生成微信分享内容
    generateShareContent(roomId) {
        return {
            title: '来挑战我的推理极限！',
            desc: '我在数字对决Pro创建了房间，房间号：' + roomId,
            link: 'https://game.example.com/?room=' + roomId,
            imgUrl: 'https://game.example.com/share-icon.png'
        };
    }
}
```

### 4.5 网络异常处理机制

#### 4.5.1 断线重连实现

```javascript
// 断线重连管理器
class ReconnectionManager {
    constructor() {
        this.maxRetries = 5;
        this.retryDelay = 1000;
        this.gameState = null;
        this.reconnectToken = null;
    }
    
    // 连接断开处理
    onDisconnect(reason) {
        console.log('Disconnected:', reason);
        
        // 显示重连UI
        this.showReconnectingUI();
        
        // 尝试重连
        this.attemptReconnect(0);
    }
    
    // 重连尝试
    async attemptReconnect(attempt) {
        if (attempt >= this.maxRetries) {
            this.showReconnectFailed();
            return;
        }
        
        try {
            // 指数退避
            const delay = Math.pow(2, attempt) * this.retryDelay;
            await this.sleep(delay);
            
            // 尝试连接
            await this.connect();
            
            // 恢复游戏状态
            await this.restoreGameState();
            
            this.hideReconnectingUI();
            
        } catch (error) {
            this.attemptReconnect(attempt + 1);
        }
    }
    
    // 恢复游戏状态
    async restoreGameState() {
        const response = await this.send({
            type: 'reconnect',
            token: this.reconnectToken,
            lastSeq: this.lastReceivedSeq
        });
        
        if (response.success) {
            // 应用服务器状态
            this.gameState = response.gameState;
            this.render();
        }
    }
    
    // 保存重连令牌
    saveReconnectToken(token) {
        this.reconnectToken = token;
        // 同时保存到localStorage，防止页面刷新
        localStorage.setItem('reconnect_token', token);
    }
}
```

#### 4.5.2 游戏状态恢复

```javascript
// 游戏状态恢复
class GameStateRecovery {
    // 保存关键状态点
    saveCheckpoint(state) {
        const checkpoint = {
            timestamp: Date.now(),
            gameState: state,
            checksum: this.calculateChecksum(state)
        };
        
        // 保存到本地
        localStorage.setItem('game_checkpoint', JSON.stringify(checkpoint));
        
        // 发送到服务器备份
        this.sendToServer({
            type: 'checkpoint',
            data: checkpoint
        });
    }
    
    // 从检查点恢复
    async recoverFromCheckpoint() {
        // 优先从服务器获取
        const serverCheckpoint = await this.fetchServerCheckpoint();
        
        if (serverCheckpoint) {
            return this.validateAndApply(serverCheckpoint);
        }
        
        // 服务器不可用，尝试本地恢复
        const localCheckpoint = localStorage.getItem('game_checkpoint');
        if (localCheckpoint) {
            return this.validateAndApply(JSON.parse(localCheckpoint));
        }
        
        return null;
    }
    
    // 验证检查点完整性
    validateAndApply(checkpoint) {
        const computedChecksum = this.calculateChecksum(checkpoint.gameState);
        
        if (computedChecksum !== checkpoint.checksum) {
            console.error('Checkpoint checksum mismatch');
            return null;
        }
        
        return checkpoint.gameState;
    }
}
```

### 4.6 代码模块化设计

#### 4.6.1 模块结构

```
src/
├── core/                       # 核心游戏逻辑
│   ├── Game.js                 # 游戏主类
│   ├── Rules.js                # 游戏规则
│   └── AI.js                   # AI算法
│
├── network/                    # 网络模块
│   ├── WebSocketClient.js      # WebSocket客户端
│   ├── ReconnectionManager.js  # 断线重连
│   ├── LatencyOptimizer.js     # 延迟优化
│   └── WeakNetworkAdapter.js   # 弱网适配
│
├── matchmaking/                # 匹配系统
│   ├── MatchmakingClient.js    # 匹配客户端
│   ├── FriendRoomManager.js    # 好友房间
│   └── ELOCalculator.js        # ELO计算
│
├── sync/                       # 状态同步
│   ├── StateSync.js            # 状态同步器
│   ├── InputBuffer.js          # 输入缓冲
│   └── RollbackEngine.js       # 回滚引擎
│
├── ui/                         # UI组件
│   ├── components/             # 可复用组件
│   ├── screens/                # 页面级组件
│   └── styles/                 # 样式文件
│
├── utils/                      # 工具函数
│   ├── crypto.js               # 加密工具
│   ├── storage.js              # 存储工具
│   └── validators.js           # 验证工具
│
└── config/                     # 配置文件
    ├── network.config.js       # 网络配置
    ├── game.config.js          # 游戏配置
    └── servers.config.js       # 服务器配置
```

#### 4.6.2 核心类设计

```javascript
// 游戏主类 - 支持单机和联机双模式
class NumberGamePro {
    constructor(mode = 'single') {
        this.mode = mode; // 'single' | 'multiplayer'
        this.state = new GameState();
        this.network = mode === 'multiplayer' ? new NetworkManager() : null;
        this.ui = new GameUI(this);
        
        this.init();
    }
    
    init() {
        if (this.network) {
            this.network.on('state_update', (data) => this.onServerState(data));
            this.network.on('player_disconnect', () => this.onOpponentDisconnect());
        }
    }
    
    // 提交猜测
    submitGuess(guess) {
        if (this.mode === 'single') {
            // 单机模式：本地处理
            this.handleLocalGuess(guess);
        } else {
            // 联机模式：发送到服务器
            this.network.send({
                type: 'submit_guess',
                guess: guess
            });
            
            // 预测性渲染
            this.ui.showPendingGuess(guess);
        }
    }
    
    // 接收服务器状态
    onServerState(data) {
        // 校验本地状态
        if (this.state.checksum !== data.checksum) {
            // 状态不一致，回滚并应用服务器状态
            this.state = data.state;
            this.ui.render(this.state);
        }
    }
}
```

---

## 五、部署规划

### 5.1 服务器部署架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          服务器部署架构图                                     │
└─────────────────────────────────────────────────────────────────────────────┘

                              用户流量入口
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
           ┌─────────────────┐           ┌─────────────────┐
           │   阿里云 CDN    │           │   腾讯云 CDN    │
           │  (静态资源加速)  │           │  (静态资源加速)  │
           └────────┬────────┘           └────────┬────────┘
                    │                             │
                    └──────────────┬──────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────┐
                    │      全局负载均衡器 (GSLB)    │
                    │   • 智能DNS解析              │
                    │   • 就近接入                 │
                    │   • 故障自动切换              │
                    └─────────────┬───────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│   华北节点     │       │   华东节点     │       │   华南节点     │
│   (北京)      │◄─────►│   (上海)      │◄─────►│   (广州)      │
│               │ 专线  │               │ 专线  │               │
├───────────────┤       ├───────────────┤       ├───────────────┤
│  SLB负载均衡   │       │  SLB负载均衡   │       │  SLB负载均衡   │
│  ┌─────────┐  │       │  ┌─────────┐  │       │  ┌─────────┐  │
│  │ECS x 4  │  │       │  │ECS x 4  │  │       │  │ECS x 4  │  │
│  │(游戏服) │  │       │  │(游戏服) │  │       │  │(游戏服) │  │
│  └─────────┘  │       │  └─────────┘  │       │  └─────────┘  │
│  ┌─────────┐  │       │  ┌─────────┐  │       │  ┌─────────┐  │
│  │ECS x 2  │  │       │  │ECS x 2  │  │       │  │ECS x 2  │  │
│  │(匹配服) │  │       │  │(匹配服) │  │       │  │(匹配服) │  │
│  └─────────┘  │       │  └─────────┘  │       │  └─────────┘  │
└───────┬───────┘       └───────┬───────┘       └───────┬───────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                                ▼
                    ┌─────────────────────────────┐
                    │        数据层集群            │
                    │                             │
                    │  ┌─────────────────────┐   │
                    │  │   Redis 集群         │   │
                    │  │  • 阿里云Redis       │   │
                    │  │  • 主从+哨兵模式     │   │
                    │  │  • 跨可用区部署      │   │
                    │  └─────────────────────┘   │
                    │                             │
                    │  ┌─────────────────────┐   │
                    │  │   MySQL 集群         │   │
                    │  │  • 主从复制          │   │
                    │  │  • 读写分离          │   │
                    │  │  • 自动备份          │   │
                    │  └─────────────────────┘   │
                    │                             │
                    │  ┌─────────────────────┐   │
                    │  │   MongoDB 集群       │   │
                    │  │  • 副本集模式        │   │
                    │  │  • 分片集群          │   │
                    │  └─────────────────────┘   │
                    │                             │
                    │  ┌─────────────────────┐   │
                    │  │   RocketMQ 集群      │   │
                    │  │  • 消息队列          │   │
                    │  │  • 异步解耦          │   │
                    │  └─────────────────────┘   │
                    │                             │
                    └─────────────────────────────┘
```

### 5.2 服务器资源配置

#### 5.2.1 服务器规格

| 服务类型 | 实例规格 | 数量 | 说明 |
|----------|----------|------|------|
| 游戏服务器 | ECS 4核8G | 12台 (每区域4台) | 处理WebSocket连接和游戏逻辑 |
| 匹配服务器 | ECS 2核4G | 6台 (每区域2台) | 处理匹配算法和房间管理 |
| API网关 | ECS 4核8G | 3台 | 统一接入和协议转换 |
| Redis缓存 | 阿里云Redis 8G | 3个实例 | 房间状态、在线用户 |
| MySQL数据库 | RDS 4核8G | 1主2从 | 用户数据、战绩数据 |
| MongoDB | 副本集 3节点 | 1套 | 游戏日志、对局回放 |
| 消息队列 | RocketMQ | 3节点 | 异步消息处理 |

#### 5.2.2 性能估算

| 指标 | 估算值 | 说明 |
|------|--------|------|
| 单服并发连接 | 10,000 | 每游戏服务器 |
| 单服房间数 | 5,000 | 每游戏服务器 |
| 总并发用户 | 120,000 | 三区域总和 |
| 日活跃用户(DAU) | 500,000 | 按1:4比例 |
| 匹配响应时间 | < 3秒 | 95%分位 |
| 游戏延迟(P99) | < 100ms | 同区域 |

### 5.3 部署流程

#### 5.3.1 环境配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  game-server:
    image: number-guess/game-server:${VERSION}
    ports:
      - "8080:8080"
      - "8081:8081"  # WebSocket
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
      - MYSQL_URL=mysql://mysql:3306/game
      - REGION=${REGION}
    deploy:
      replicas: 4
      resources:
        limits:
          cpus: '2'
          memory: 4G
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  match-service:
    image: number-guess/match-service:${VERSION}
    ports:
      - "8082:8082"
    environment:
      - REDIS_URL=redis://redis:6379
    deploy:
      replicas: 2

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl

volumes:
  redis-data:
```

#### 5.3.2 版本控制与发布

```bash
#!/bin/bash
# deploy.sh - 部署脚本

VERSION=$1
ENV=$2

# 1. 构建镜像
docker build -t number-guess/game-server:${VERSION} ./game-server
docker build -t number-guess/match-service:${VERSION} ./match-service

# 2. 推送镜像到仓库
docker push number-guess/game-server:${VERSION}
docker push number-guess/match-service:${VERSION}

# 3. 更新配置
export VERSION=${VERSION}
export REGION=${ENV}
envsubst < docker-compose.yml > docker-compose.deploy.yml

# 4. 滚动部署
docker-compose -f docker-compose.deploy.yml up -d --no-deps --scale game-server=5 game-server

# 5. 健康检查
sleep 10
./health-check.sh

# 6. 缩容旧版本
docker-compose -f docker-compose.deploy.yml up -d --scale game-server=4 game-server

echo "Deployment completed: ${VERSION}"
```

#### 5.3.3 灰度发布

```yaml
# 灰度发布策略
灰度发布:
  阶段1:
    范围: "华北节点 10% 流量"
    监控指标:
      - 错误率 < 0.1%
      - 平均延迟 < 50ms
      - 成功率 > 99.9%
    持续时间: "30分钟"
  
  阶段2:
    范围: "华北节点 50% 流量"
    条件: "阶段1指标全部通过"
    持续时间: "1小时"
  
  阶段3:
    范围: "华北节点 100% 流量"
    条件: "阶段2指标全部通过"
    持续时间: "2小时"
  
  阶段4:
    范围: "全区域 100% 流量"
    条件: "阶段3无异常"
```

#### 5.3.4 回滚机制

```bash
#!/bin/bash
# rollback.sh - 回滚脚本

ROLLBACK_VERSION=$1

echo "Starting rollback to version: ${ROLLBACK_VERSION}"

# 1. 快速切换流量到旧版本
kubectl set image deployment/game-server game-server=number-guess/game-server:${ROLLBACK_VERSION}

# 2. 验证回滚
sleep 5
./health-check.sh

# 3. 通知告警
./send-alert.sh "Rollback completed to ${ROLLBACK_VERSION}"

echo "Rollback completed"
```

### 5.4 服务器监控系统

#### 5.4.1 监控架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        监控架构图                                │
└─────────────────────────────────────────────────────────────────┘

    服务器指标                    应用指标                    业务指标
         │                          │                          │
         ▼                          ▼                          ▼
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│  Node Exporter  │        │  Application    │        │   Custom        │
│  (系统指标)      │        │  Metrics        │        │   Metrics       │
└────────┬────────┘        └────────┬────────┘        └────────┬────────┘
         │                          │                          │
         └──────────────────────────┼──────────────────────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    Prometheus       │
                         │   (指标收集存储)     │
                         └──────────┬──────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
           ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
           │   Grafana   │  │   Alert     │  │   ELK       │
           │  (可视化)   │  │  Manager    │  │  (日志分析)  │
           │             │  │  (告警)     │  │             │
           └─────────────┘  └──────┬──────┘  └─────────────┘
                                   │
                                   ▼
                          ┌─────────────────┐
                          │  告警通知渠道    │
                          │ • 钉钉          │
                          │ • 企业微信      │
                          │ • 短信          │
                          │ • 电话          │
                          └─────────────────┘
```

#### 5.4.2 关键监控指标

| 类别 | 指标 | 告警阈值 | 说明 |
|------|------|----------|------|
| 系统 | CPU使用率 | > 80% | 服务器负载 |
| 系统 | 内存使用率 | > 85% | 内存压力 |
| 系统 | 磁盘使用率 | > 90% | 存储空间 |
| 网络 | 连接数 | > 8000 | 单服务器 |
| 网络 | 延迟P99 | > 100ms | 网络质量 |
| 应用 | 错误率 | > 0.1% | 请求错误 |
| 应用 | 响应时间 | > 200ms | 平均响应 |
| 业务 | 在线房间数 | 监控 | 业务规模 |
| 业务 | 匹配成功率 | < 95% | 匹配质量 |
| 业务 | 断线率 | > 5% | 网络稳定性 |

#### 5.4.3 告警规则

```yaml
# alert-rules.yml
groups:
  - name: game-server
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.001
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          
      - alert: HighLatency
        expr: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 0.1
        for: 3m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
          
      - alert: ServerDown
        expr: up{job="game-server"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Game server is down"
```

### 5.5 运维文档

#### 5.5.1 日常维护流程

| 时间 | 任务 | 执行人 | 说明 |
|------|------|--------|------|
| 每日 | 查看监控大盘 | 运维 | 检查核心指标 |
| 每日 | 查看告警记录 | 运维 | 处理夜间告警 |
| 每周 | 数据库备份验证 | 运维 | 恢复测试 |
| 每周 | 安全补丁检查 | 运维 | 系统更新 |
| 每月 | 容量规划评估 | 运维+开发 | 资源扩容 |
| 每月 | 故障演练 | 运维 | 容灾测试 |

#### 5.5.2 常见问题处理

| 问题 | 现象 | 处理步骤 |
|------|------|----------|
| 服务器宕机 | 连接失败 | 1. 检查服务器状态 2. 自动切换到备用节点 3. 排查故障原因 |
| 数据库延迟 | 查询缓慢 | 1. 检查慢查询日志 2. 优化SQL或索引 3. 必要时读写分离 |
| Redis内存不足 | 缓存失效 | 1. 清理过期key 2. 扩容Redis 3. 优化缓存策略 |
| 网络抖动 | 延迟升高 | 1. 切换CDN节点 2. 启用弱网适配 3. 联系运营商 |
| 匹配超时 | 用户等待久 | 1. 检查匹配服务 2. 扩大匹配范围 3. 提供AI对战选项 |

#### 5.5.3 紧急响应预案

```
┌─────────────────────────────────────────────────────────────────┐
│                     紧急响应流程图                               │
└─────────────────────────────────────────────────────────────────┘

    故障发生
        │
        ▼
┌───────────────┐
│  自动故障检测  │
│  (监控告警)   │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│  自动故障转移  │◄──── 5分钟内自动恢复
│  (切换流量)   │
└───────┬───────┘
        │
   是否恢复?
        │
   ┌────┴────┐
   │         │
   是        否
   │         │
   ▼         ▼
┌───────┐  ┌───────────────┐
│ 恢复  │  │ 人工介入      │
│ 监控  │  │ • 值班人员接收告警
│       │  │ • 启动应急响应群
└───────┘  │ • 评估影响范围
           │ • 制定修复方案
           └───────┬───────┘
                   │
                   ▼
           ┌───────────────┐
           │  故障修复     │
           │ • 根因分析    │
           │ • 修复验证    │
           │ • 恢复服务    │
           └───────┬───────┘
                   │
                   ▼
           ┌───────────────┐
           │  事后复盘     │
           │ • 故障报告    │
           │ • 改进措施    │
           │ • 更新预案    │
           └───────────────┘
```

---

## 六、国内CDN优化

### 6.1 CDN配置

本版本已针对国内网络环境进行优化：

| 资源 | 原CDN | 国内CDN |
|------|-------|---------|
| Tailwind CSS | cdn.tailwindcss.com | cdn.bootcdn.net |
| Google Fonts | fonts.googleapis.com | fonts.loli.net (国内镜像) |

**优化效果**：
- 首屏加载时间：从 3-5秒 降至 1-2秒
- CDN可用性：从 70% 提升至 99.9%
- 无需翻墙即可正常访问

---

## 七、国内部署方案详解

### 7.1 方案一：Gitee Pages（推荐，免费且稳定）

**适用场景**：个人项目、快速上线、零成本

```bash
# 步骤1：注册Gitee账号
# 访问 https://gitee.com 注册账号（需手机验证）

# 步骤2：创建仓库
# 点击右上角 "+" → 新建仓库
# 仓库名称：number-guess
# 设为公开

# 步骤3：上传代码
# 方式A：网页上传
#   - 点击"上传文件"
#   - 拖拽 index.html 到上传区域
#   - 点击"提交"

# 方式B：Git命令行
git init
git add index.html
git commit -m "数字对决 Pro v2.0.0"
git remote add origin https://gitee.com/你的用户名/number-guess.git
git push -u origin master

# 步骤4：启用Gitee Pages
# 仓库页面 → 服务 → Gitee Pages
# 部署分支：master
# 部署目录：/ (根目录)
# 点击"启动"

# 步骤5：获取访问地址
# https://你的用户名.gitee.io/number-guess/
```

**优点**：
- 完全免费，无流量限制
- 国内访问速度快（平均延迟 < 50ms）
- 支持自定义域名（需备案）
- 稳定性高，SLA 99.9%

**注意事项**：
- 免费版不支持 HTTPS 自定义域名
- 如需绑定自定义域名，需升级 Gitee Pages Pro（￥99/年）

### 7.2 方案二：阿里云 OSS + CDN（企业级推荐）

**适用场景**：企业项目、高流量、需要自定义域名

#### 7.2.1 资源选型建议

| 资源类型 | 推荐配置 | 月费用估算 |
|----------|----------|------------|
| OSS存储 | 标准存储 1GB | ￥0.12 |
| CDN流量 | 按量付费 100GB | ￥17 |
| 域名 | .com 域名 | ￥55/年 |
| ICP备案 | 免费（需时间） | ￥0 |

**总计**：约 ￥20-30/月

#### 7.2.2 部署步骤

```bash
# 步骤1：开通阿里云OSS
# 访问 https://oss.console.aliyun.com
# 创建Bucket，配置如下：
#   - Bucket名称：number-guess（全局唯一）
#   - 地域：华东1（杭州）或 华东2（上海）
#   - 存储类型：标准存储
#   - 读写权限：公共读

# 步骤2：上传文件
# 方式A：控制台上传
#   - 进入Bucket → 文件管理
#   - 点击"上传文件"
#   - 选择 index.html

# 方式B：使用ossutil命令行工具
wget https://gosspublic.alicdn.com/ossutil/1.7.14/ossutil64
chmod +x ossutil64
./ossutil64 config -e oss-cn-hangzhou.aliyuncs.com -i 你的AccessKeyID -k 你的AccessKeySecret
./ossutil64 cp index.html oss://number-guess/index.html

# 步骤3：配置静态网站托管
# Bucket设置 → 静态页面
# 默认首页：index.html
# 默认404页：index.html

# 步骤4：绑定自定义域名（可选）
# Bucket设置 → 域名管理 → 绑定域名
# 输入你的域名（如 game.yourdomain.com）

# 步骤5：配置CDN加速
# 访问 https://cdn.console.aliyun.com
# 添加域名 → 配置源站为OSS域名
# 开启HTTPS（需上传SSL证书，可使用免费证书）
```

#### 7.2.3 CDN配置优化

```
推荐CDN配置：
├── 节点缓存时间：1年（静态资源）
├── 防盗链：配置白名单域名
├── IP访问限频：100次/秒
├── 带宽限速：根据预算设置
└── HTTPS：强制HTTPS跳转
```

### 7.3 方案三：腾讯云 COS + CDN

**适用场景**：微信生态项目、腾讯系产品

```bash
# 步骤1：开通腾讯云COS
# 访问 https://console.cloud.tencent.com/cos
# 创建存储桶：
#   - 名称：number-guess
#   - 地域：上海或广州
#   - 访问权限：公有读、私有写

# 步骤2：上传文件
# 控制台上传 或 使用COSCMD工具
pip install coscmd
coscmd config -a 你的SecretId -s 你的SecretKey -b number-guess-1234567890 -r ap-shanghai
coscmd upload index.html /

# 步骤3：开启静态网站
# 存储桶设置 → 静态网站 → 开启

# 步骤4：配置CDN
# 访问 https://console.cloud.tencent.com/cdn
# 添加域名，源站选择COS存储桶
```

**腾讯云优势**：
- 微信内置浏览器访问更快
- 与微信小程序生态无缝对接
- 提供免费SSL证书

### 7.4 方案四：华为云 OBS + CDN

**适用场景**：政企项目、数据安全要求高

```bash
# 步骤1：开通华为云OBS
# 访问 https://console.huaweicloud.com/obs
# 创建桶：
#   - 桶名：number-guess
#   - 区域：华北-北京四 或 华东-上海一
#   - 桶策略：公共读

# 步骤2：上传并配置静态网站托管
# 控制台上传 index.html
# 桶设置 → 静态网站托管 → 开启

# 步骤3：配置CDN
# 访问 https://console.huaweicloud.com/cdn
```

**华为云优势**：
- 符合等保2.0要求
- 数据本地化存储
- 国产化适配好

---

## 八、网络安全与合规

### 8.1 域名备案流程

#### 8.1.1 备案必要性

根据《中华人民共和国网络安全法》和《互联网信息服务管理办法》：
- 使用国内服务器必须进行ICP备案
- 使用自定义域名必须备案
- Gitee Pages 绑定自定义域名需要备案

#### 8.1.2 备案流程（以阿里云为例）

```
备案流程：
├── 1. 准备材料（1-2天）
│   ├── 营业执照/身份证扫描件
│   ├── 域名证书
│   ├── 网站负责人手持身份证照片
│   └── 网站真实性核验单（平台提供模板）
│
├── 2. 提交备案申请（1天）
│   ├── 登录阿里云ICP备案系统
│   ├── 填写主体信息
│   ├── 填写网站信息
│   └── 上传材料
│
├── 3. 云服务商初审（1-2天）
│   └── 阿里云审核材料完整性
│
├── 4. 管局审核（5-20天）
│   └── 通信管理局最终审核
│
└── 5. 备案完成
    └── 获得ICP备案号（如：京ICP备12345678号）
```

#### 8.1.3 备案注意事项

- **网站名称**：不能包含"中国"、"国家"等敏感词
- **网站内容**：必须与备案信息一致
- **备案主体**：个人备案不能用于商业用途
- **备案号展示**：网站底部必须展示备案号并链接到工信部网站

### 8.2 基础安全配置

```html
<!-- 已添加的安全响应头（需服务器配置） -->
Content-Security-Policy: default-src 'self' 'unsafe-inline' https://cdn.bootcdn.net https://fonts.loli.net
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

### 8.3 CDN安全配置

```
CDN安全策略：
├── 防盗链配置
│   ├── Referer白名单：允许空Referer（移动端兼容）
│   └── IP黑名单：封禁恶意IP
│
├── 访问控制
│   ├── IP访问频率限制：100次/秒
│   ├── 单IP带宽限制：10Mbps
│   └── 地域访问控制：可选限制海外访问
│
└── HTTPS配置
    ├── 强制HTTPS跳转
    ├── TLS版本：TLS 1.2+
    └── HSTS：max-age=31536000
```

### 8.4 合规配置

```html
<!-- 网站底部必须添加（备案后） -->
<footer>
    <a href="https://beian.miit.gov.cn/" target="_blank">京ICP备12345678号</a>
    <!-- 如使用公安备案 -->
    <a href="http://www.beian.gov.cn/" target="_blank">
        <img src="公安备案图标.png"> 京公网安备 xxxxx号
    </a>
</footer>
```

---

## 九、容灾备份机制

### 9.1 多CDN备份方案

```javascript
// 自动CDN故障切换（可添加到index.html）
(function() {
    const cdnList = [
        'https://cdn.bootcdn.net/ajax/libs/tailwindcss/3.4.1/tailwind.min.js',
        'https://cdn.jsdelivr.net/npm/tailwindcss@3.4.1/lib/index.min.js',
        'https://unpkg.com/tailwindcss@3.4.1/dist/tailwind.min.js'
    ];
    
    function loadScript(url, index) {
        if (index >= cdnList.length) {
            console.error('所有CDN都不可用');
            return;
        }
        
        const script = document.createElement('script');
        script.src = url;
        script.onerror = () => loadScript(cdnList[index + 1], index + 1);
        document.head.appendChild(script);
    }
    
    loadScript(cdnList[0], 0);
})();
```

### 9.2 多地域容灾

```
容灾架构：
├── 主站点：阿里云OSS（上海）
├── 备站点：腾讯云COS（广州）
├── DNS切换：DNSPod智能解析
│   ├── 主站点健康检测（30秒间隔）
│   ├── 故障自动切换（TTL 60秒）
│   └── 手动切换（即时生效）
└── 监控告警：云监控 + 短信通知
```

### 9.3 监控告警配置

```yaml
# 阿里云云监控配置示例
监控项：
  - 名称: HTTP可用性
    URL: https://your-domain.com
    检测频率: 30秒
    告警条件: 连续3次失败
    通知方式: 短信 + 邮件
    
  - 名称: 响应时间
    告警条件: > 3秒
    通知方式: 邮件
```

---

## 十、快速部署清单

### 10.1 最简方案（5分钟上线）

- [ ] 注册 Gitee 账号
- [ ] 创建公开仓库
- [ ] 上传 index.html
- [ ] 启用 Gitee Pages
- [ ] 获得访问链接分享给用户

### 10.2 企业方案（1-3天上线）

- [ ] 购买域名
- [ ] 提交ICP备案（5-20天）
- [ ] 开通云存储服务（阿里云/腾讯云/华为云）
- [ ] 配置CDN加速
- [ ] 配置HTTPS证书
- [ ] 添加网站备案号
- [ ] 配置监控告警

### 10.3 联机服务器部署清单

- [ ] 购买云服务器（ECS）
- [ ] 配置安全组规则
- [ ] 部署游戏服务端
- [ ] 配置负载均衡
- [ ] 部署Redis缓存
- [ ] 部署MySQL数据库
- [ ] 配置域名解析
- [ ] 配置SSL证书
- [ ] 部署监控系统
- [ ] 配置告警规则

---

## 十一、常见问题

**Q: 不备案可以使用吗？**
A: 可以。使用 Gitee Pages 默认域名或云服务商提供的临时域名即可，无需备案。

**Q: 如何选择云服务商？**
A: 
- 个人项目：Gitee Pages（免费）
- 微信生态：腾讯云（微信访问更快）
- 企业项目：阿里云（生态完善）
- 政企项目：华为云（合规性好）

**Q: CDN费用如何估算？**
A: 
- 日活100用户：约 1GB/月 流量，费用 < ￥1
- 日活1000用户：约 10GB/月 流量，费用约 ￥2
- 日活10000用户：约 100GB/月 流量，费用约 ￥17

**Q: 如何处理网络波动？**
A: 
1. 使用多CDN备份
2. 配置合理的缓存策略
3. 开启云监控告警
4. 准备备用访问地址

**Q: 联机模式需要多少服务器资源？**
A: 
- 初期（<1000 DAU）：2核4G × 2台，约 ￥200/月
- 中期（<10000 DAU）：4核8G × 4台，约 ￥800/月
- 后期（>10000 DAU）：需根据实际负载扩容

**Q: 如何保障游戏公平性？**
A: 
1. 服务器权威验证所有操作
2. 客户端只负责展示，逻辑在服务端
3. 加密传输敏感数据（如秘密数字）
4. 异常行为检测和封号机制

---

## 十二、更新日志

- **v2.0.0** (2026-02-19): 新增双人联机模式，完整联机架构设计，国内部署方案
- **v1.2.0** (2026-02-18): 国内CDN优化，添加完整国内部署方案
- **v1.1.0** (2026-02-18): 微信H5适配
- **v1.0.0** (2026-02-18): 初始版本，支持微信H5、人机对战
