# 数字对决 Pro - WebSocket API 文档

**版本**: 2.2.0  
**更新时间**: 2026-03-18  
**维护者**: Chris

---

## 概述

数字对决 Pro 使用 WebSocket 协议实现双人实时联机对战。服务器支持以下功能：

- 创建/加入房间
- 玩家准备和游戏开始
- 回合制猜测对战
- 随机匹配
- 断线重连

---

## 连接信息

| 环境 | 地址 |
|------|------|
| 开发 | `ws://localhost:8080` |
| 生产 | 根据部署环境配置 |

### 连接响应

连接成功后，服务器会发送欢迎消息：

```json
{
  "type": "connected",
  "message": "Connected to Number Guess Pro server",
  "instanceId": "local-1234567890",
  "version": "2.2.0",
  "timestamp": 1234567890123
}
```

---

## 消息格式

所有消息均为 JSON 格式，必须包含 `type` 字段。

### 通用字段

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| type | string | ✓ | 消息类型 |

---

## 客户端消息类型

### 1. 心跳检测 (ping)

保持连接活跃，检测网络延迟。

```json
{
  "type": "ping",
  "timestamp": 1234567890123
}
```

**响应**:

```json
{
  "type": "pong",
  "timestamp": 1234567890123
}
```

---

### 2. 创建房间 (create_room)

创建新的游戏房间。

```json
{
  "type": "create_room",
  "roomCode": "A1B2C3",
  "playerId": "player_abc123"
}
```

**字段说明**:

| 字段 | 类型 | 必需 | 格式 | 说明 |
|------|------|------|------|------|
| roomCode | string | ✓ | 6位十六进制 | 房间号 |
| playerId | string | ✓ | 最长64字符 | 玩家唯一标识 |

**成功响应**:

```json
{
  "type": "room_created",
  "room": {
    "code": "A1B2C3",
    "hostId": "player_abc123",
    "guestId": null,
    "hostReady": false,
    "guestReady": false,
    "gameState": "waiting"
  }
}
```

**错误响应**:

```json
{
  "type": "error",
  "message": "Room already exists"
}
```

---

### 3. 加入房间 (join_room)

加入已存在的游戏房间。

```json
{
  "type": "join_room",
  "roomCode": "A1B2C3",
  "playerId": "player_xyz789"
}
```

**成功响应**:

```json
{
  "type": "room_joined",
  "room": { ... },
  "role": "guest",
  "isReconnect": false
}
```

**重连场景**:

当游戏进行中玩家断线重连时：

```json
{
  "type": "game_reconnect",
  "room": { ... },
  "currentPlayer": "player_abc123",
  "turn": 5,
  "history": [...],
  "mySecret": "1234",
  "isMyTurn": true,
  "remainingTime": 45000
}
```

---

### 4. 离开房间 (leave_room)

离开当前房间。

```json
{
  "type": "leave_room",
  "roomCode": "A1B2C3",
  "playerId": "player_abc123"
}
```

---

### 5. 玩家准备 (player_ready)

设置秘密数字并标记准备状态。

```json
{
  "type": "player_ready",
  "roomCode": "A1B2C3",
  "playerId": "player_abc123",
  "secret": "1234"
}
```

**字段说明**:

| 字段 | 类型 | 必需 | 格式 | 说明 |
|------|------|------|------|------|
| secret | string | ✓ | 4位数字 | 秘密数字 |

**广播消息** (双方都准备后):

```json
{
  "type": "game_start",
  "firstPlayer": "player_abc123",
  "room": { ... }
}
```

---

### 6. 提交猜测 (submit_guess)

提交猜测数字。

```json
{
  "type": "submit_guess",
  "roomCode": "A1B2C3",
  "playerId": "player_abc123",
  "guess": "5678"
}
```

**字段说明**:

| 字段 | 类型 | 必需 | 格式 | 说明 |
|------|------|------|------|------|
| guess | string | ✓ | 4位数字 | 猜测数字 |

**响应**:

```json
{
  "type": "guess_result",
  "playerId": "player_abc123",
  "guess": "5678",
  "feedback": 2,
  "room": { ... }
}
```

`feedback` 表示位置正确的数字个数（0-4）。

**游戏结束** (猜中时):

```json
{
  "type": "game_over",
  "winner": "player_abc123",
  "room": { ... },
  "history": [...]
}
```

---

### 7. 请求重赛 (request_rematch)

请求再来一局。

```json
{
  "type": "request_rematch",
  "roomCode": "A1B2C3",
  "playerId": "player_abc123"
}
```

---

### 8. 随机匹配 (random_match)

加入随机匹配队列。

```json
{
  "type": "random_match",
  "playerId": "player_abc123"
}
```

**等待响应**:

```json
{
  "type": "random_match_waiting",
  "message": "等待对手加入..."
}
```

**匹配成功**:

```json
{
  "type": "random_match_found",
  "roomCode": "D4E5F6",
  "isHost": true
}
```

**超时响应**:

```json
{
  "type": "random_match_timeout",
  "message": "未找到对手，请重试"
}
```

---

### 9. 取消随机匹配 (cancel_random_match)

取消随机匹配。

```json
{
  "type": "cancel_random_match",
  "playerId": "player_abc123"
}
```

---

### 10. 批量消息 (batch)

合并发送多条消息，减少网络开销。

```json
{
  "type": "batch",
  "messages": [
    { "type": "submit_guess", ... },
    { "type": "ping", ... }
  ],
  "timestamp": 1234567890123
}
```

---

## 服务器消息类型

### 错误消息 (error)

```json
{
  "type": "error",
  "code": "VALIDATION_ERROR",
  "message": "Missing required field: roomCode"
}
```

**常见错误代码**:

| 代码 | 说明 |
|------|------|
| VALIDATION_ERROR | 消息格式验证失败 |
| PARSE_ERROR | JSON 解析失败 |

### 玩家加入通知 (player_joined)

```json
{
  "type": "player_joined",
  "playerId": "player_xyz789"
}
```

### 玩家离开通知 (player_left)

```json
{
  "type": "player_left",
  "playerId": "player_xyz789"
}
```

### 玩家断线通知 (player_disconnected)

```json
{
  "type": "player_disconnected",
  "playerId": "player_xyz789",
  "message": "Opponent disconnected"
}
```

### 对手重连通知 (opponent_reconnected)

```json
{
  "type": "opponent_reconnected",
  "playerId": "player_xyz789",
  "message": "对手已重新连接"
}
```

### 回合切换 (turn_change)

```json
{
  "type": "turn_change",
  "currentPlayer": "player_xyz789",
  "turn": 3,
  "room": { ... }
}
```

### 回合超时 (turn_timeout)

```json
{
  "type": "turn_timeout",
  "timeoutPlayer": "player_xyz789",
  "winner": "player_abc123",
  "message": "玩家 player_xyz789 回合超时（60秒），对手获胜"
}
```

---

## 超时设置

| 类型 | 超时时间 | 说明 |
|------|----------|------|
| 心跳检测 | 30秒 | 无心跳响应则断开 |
| 回合超时 | 60秒 | 超时判负 |
| 随机匹配 | 60秒 | 超时自动退出队列 |
| 断线重连 | 30秒 | 允许重连时间窗口 |

---

## 健康检查

HTTP 端点: `GET /health`

```json
{
  "status": "ok",
  "version": "2.2.0",
  "instanceId": "local-1234567890",
  "redisConnected": true,
  "rooms": 5,
  "connections": 12,
  "uptime": 3600.5
}
```

---

## 消息验证 Schema

服务器使用以下 Schema 验证消息格式：

| 消息类型 | 必需字段 | 可选字段 | 格式约束 |
|----------|----------|----------|----------|
| ping | type | timestamp | - |
| create_room | type, roomCode, playerId | - | roomCode: /^[0-9A-F]{6}$/ |
| join_room | type, roomCode, playerId | - | roomCode: /^[0-9A-F]{6}$/ |
| leave_room | type, roomCode, playerId | - | - |
| player_ready | type, roomCode, playerId, secret | - | secret: /^\d{4}$/ |
| submit_guess | type, roomCode, playerId, guess | - | guess: /^\d{4}$/ |
| random_match | type, playerId | - | - |
| cancel_random_match | type, playerId | - | - |
| batch | type, messages | timestamp | messages: array |

---

## 示例流程

### 完整对战流程

```
Client A                          Server                          Client B
   |                                |                                |
   |-- create_room --------------->|                                |
   |<-- room_created --------------|                                |
   |                                |<------ join_room -------------|
   |<-- player_joined -------------|--- room_joined -------------->|
   |                                |                                |
   |-- player_ready (secret) ------>|                                |
   |                                |<---- player_ready (secret) ---|
   |<-- game_start -----------------|--- game_start --------------->|
   |                                |                                |
   |<-- turn_change --------------- |--- turn_change -------------->|
   |                                |                                |
   |-- submit_guess --------------->|                                |
   |<-- guess_result -------------- |--- guess_result ------------->|
   |                                |                                |
   |                                |<---- submit_guess ------------|
   |<-- guess_result -------------- |--- guess_result ------------->|
   |                                |                                |
   ... (继续对战) ...
   |                                |                                |
   |-- submit_guess (correct) ----->|                                |
   |<-- game_over ------------------|--- game_over ----------------->|
   |                                |                                |
```

---

## 更新日志

### v2.2.0 (2026-03-18)
- NGG-003: AI 算法优化，移除硬编码首次猜测
- NGG-004: 添加 API 文档

### v2.1.0
- 添加消息格式验证 (NGG-001)
- 添加批量消息支持
- 添加回合超时机制

---

*文档维护: Chris*  
*最后更新: 2026-03-18*