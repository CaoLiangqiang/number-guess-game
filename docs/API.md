# 数字对决 Pro WebSocket API

**版本**: 2.4.24
**范围**: H5 联机模式
**更新时间**: 2026-03-29

---

## 1. 协议范围

本文件描述 H5 联机模式使用的 WebSocket 协议。微信小游戏当前不承载联机能力。

连接成功后，服务端会先发送：

```json
{
  "type": "connected",
  "message": "Connected to Number Guess Pro server",
  "instanceId": "local-1234567890",
  "version": "2.4.24",
  "timestamp": 1234567890123
}
```

---

## 2. 基本约束

| 项目 | 约束 |
|------|------|
| 传输协议 | `ws://` / `wss://` |
| 房间号 | 6 位十六进制字符串，例如 `A1B2C3` |
| 玩家 ID | 字符串 |
| 难度 | `3` / `4` / `5` |
| 秘密数字 / 猜测 | `3-5` 位数字字符串 |
| 心跳 | 客户端 `ping`，服务端 `pong` |

说明：

- 当前规则允许重复数字
- 当前规则允许首位数字为 `0`
- `guess_result.feedback` 表示“位置正确的数字个数”

---

## 3. 客户端消息

### 3.1 `ping`

```json
{ "type": "ping", "timestamp": 1234567890123 }
```

### 3.2 `create_room`

```json
{
  "type": "create_room",
  "roomCode": "A1B2C3",
  "playerId": "player_abc123"
}
```

### 3.3 `join_room`

```json
{
  "type": "join_room",
  "roomCode": "A1B2C3",
  "playerId": "player_xyz789"
}
```

### 3.4 `leave_room`

```json
{
  "type": "leave_room",
  "roomCode": "A1B2C3",
  "playerId": "player_abc123"
}
```

### 3.5 `player_ready`

```json
{
  "type": "player_ready",
  "roomCode": "A1B2C3",
  "playerId": "player_abc123",
  "secret": "0011"
}
```

### 3.6 `submit_guess`

```json
{
  "type": "submit_guess",
  "roomCode": "A1B2C3",
  "playerId": "player_abc123",
  "guess": "5280"
}
```

### 3.7 `request_rematch`

```json
{
  "type": "request_rematch",
  "roomCode": "A1B2C3",
  "playerId": "player_abc123"
}
```

### 3.8 `random_match`

```json
{
  "type": "random_match",
  "playerId": "player_abc123"
}
```

### 3.9 `cancel_random_match`

```json
{
  "type": "cancel_random_match",
  "playerId": "player_abc123"
}
```

### 3.10 `set_difficulty`

```json
{
  "type": "set_difficulty",
  "roomCode": "A1B2C3",
  "playerId": "player_abc123",
  "difficulty": 5
}
```

### 3.11 `batch`

用于弱网场景合并消息：

```json
{
  "type": "batch",
  "timestamp": 1234567890123,
  "messages": [
    { "type": "ping", "timestamp": 1234567890123 },
    {
      "type": "submit_guess",
      "roomCode": "A1B2C3",
      "playerId": "player_abc123",
      "guess": "5280"
    }
  ]
}
```

---

## 4. 服务端消息

### 4.1 房间与连接

| 类型 | 关键字段 | 说明 |
|------|----------|------|
| `pong` | `timestamp` | 心跳响应 |
| `room_created` | `room` | 创建房间成功 |
| `room_joined` | `room`, `role`, `isReconnect` | 加入房间成功 |
| `player_joined` | `playerId` | 对手进入房间 |
| `player_disconnected` | `playerId`, `message` | 对手掉线 |
| `opponent_reconnected` | `playerId`, `message` | 对手重连成功 |
| `game_reconnect` | `room`, `currentPlayer`, `turn`, `history`, `mySecret`, `isMyTurn`, `remainingTime` | 重连时补发完整游戏状态 |

### 4.2 游戏流程

| 类型 | 关键字段 | 说明 |
|------|----------|------|
| `game_start` | `firstPlayer`, `room` | 双方准备完成，游戏开始 |
| `guess_result` | `playerId`, `guess`, `feedback`, `room` | 一次猜测的裁定结果 |
| `turn_change` | `currentPlayer`, `turn`, `room` | 回合切换 |
| `game_over` | `winner`, `room`, `history` | 常规胜负结算 |
| `turn_timeout` | `timeoutPlayer`, `winner`, `message` | 回合超时判负 |
| `rematch_requested` | `playerId`, `room` | 再来一局 |
| `difficulty_changed` | `difficulty`, `room` | 房主修改难度 |

### 4.3 匹配流程

| 类型 | 关键字段 | 说明 |
|------|----------|------|
| `random_match_waiting` | `message` | 进入随机匹配队列 |
| `random_match_found` | `roomCode`, `isHost` | 随机匹配成功 |
| `random_match_timeout` | `message` | 匹配超时 |
| `random_match_cancelled` | `message` | 主动取消匹配 |

### 4.4 错误消息

```json
{
  "type": "error",
  "code": "VALIDATION_ERROR",
  "message": "Missing required field: roomCode"
}
```

常见错误码：

- `VALIDATION_ERROR`
- `PARSE_ERROR`

---

## 5. 示例流程

```text
Client A                         Server                         Client B
   |                               |                               |
   |-- create_room ---------------->|                               |
   |<-- room_created ---------------|                               |
   |                               |<----- join_room --------------|
   |<-- player_joined --------------|---- room_joined ------------>|
   |-- player_ready ---------------->|                               |
   |                               |<----- player_ready -----------|
   |<-- game_start -----------------|---- game_start ------------->|
   |-- submit_guess ---------------->|                               |
   |<-- guess_result ---------------|---- guess_result ----------->|
   |<-- turn_change ----------------|---- turn_change ------------>|
   |                               |<----- submit_guess ----------|
   |<-- guess_result ---------------|---- guess_result ----------->|
   |                               |                               |
```

---

## 6. 健康检查

服务端提供：

```http
GET /health
```

典型返回：

```json
{
  "status": "ok",
  "version": "2.4.24",
  "instanceId": "local-1234567890",
  "redisConnected": true,
  "rooms": 5,
  "connections": 12,
  "uptime": 3600.5
}
```
