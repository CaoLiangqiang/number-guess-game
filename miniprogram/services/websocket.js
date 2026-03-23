/**
 * WebSocket 服务模块
 * 处理与服务器的实时通信
 *
 * 注意：这是为小游戏环境设计的版本，不依赖 getApp()
 * 联机功能计划在后续版本实现
 */

// WebSocket 状态
const WS_STATE = {
  DISCONNECTED: 0,
  CONNECTING: 1,
  CONNECTED: 2
}

// 默认服务器配置 - 联机功能计划中
const DEFAULT_SERVER = 'wss://number-guess-game.example.com'

class WebSocketService {
  constructor(config = {}) {
    this.ws = null
    this.state = WS_STATE.DISCONNECTED
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
    this.heartbeatTimer = null
    this.messageQueue = []
    this.eventHandlers = new Map()
    this.roomCode = null
    // 配置可通过构造函数传入
    this.serverUrl = config.serverUrl || DEFAULT_SERVER
    this.playerId = config.playerId || null
  }

  /**
   * 设置配置
   */
  setConfig(config) {
    if (config.serverUrl) this.serverUrl = config.serverUrl
    if (config.playerId) this.playerId = config.playerId
  }

  /**
   * 获取服务器地址
   */
  getServerUrl() {
    return this.serverUrl
  }

  /**
   * 获取当前玩家ID
   */
  getPlayerId() {
    return this.playerId
  }

  /**
   * 连接 WebSocket
   */
  connect() {
    return new Promise((resolve, reject) => {
      if (this.state === WS_STATE.CONNECTED) {
        resolve()
        return
      }

      if (this.state === WS_STATE.CONNECTING) {
        reject(new Error('正在连接中'))
        return
      }

      const serverUrl = this.getServerUrl()
      this.state = WS_STATE.CONNECTING
      this.reconnectAttempts++

      console.log('[WS] 连接服务器:', serverUrl)

      this.ws = wx.connectSocket({
        url: serverUrl,
        protocols: ['json'],
        success: () => {
          console.log('[WS] 连接请求已发送')
        },
        fail: (err) => {
          this.state = WS_STATE.DISCONNECTED
          console.error('[WS] 连接失败:', err)
          reject(err)
        }
      })

      // 连接成功
      wx.onSocketOpen(() => {
        this.state = WS_STATE.CONNECTED
        this.reconnectAttempts = 0
        console.log('[WS] 连接已建立')

        // 发送队列中的消息
        this.flushMessageQueue()

        // 开始心跳
        this.startHeartbeat()

        resolve()
      })

      // 连接失败
      wx.onSocketError((err) => {
        this.state = WS_STATE.DISCONNECTED
        console.error('[WS] 连接错误:', err)

        // 尝试重连
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts)
        }

        reject(err)
      })

      // 连接关闭
      wx.onSocketClose(() => {
        this.state = WS_STATE.DISCONNECTED
        console.log('[WS] 连接已关闭')
        this.stopHeartbeat()
        this.emit('disconnected')
      })

      // 接收消息
      wx.onSocketMessage((res) => {
        this.handleMessage(res.data)
      })
    })
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.ws) {
      wx.closeSocket()
      this.ws = null
    }
    this.state = WS_STATE.DISCONNECTED
    this.stopHeartbeat()
    this.roomCode = null
    console.log('[WS] 已断开连接')
  }

  /**
   * 发送消息
   */
  send(type, data = {}) {
    const message = {
      type,
      ...data,
      timestamp: Date.now()
    }

    const messageStr = JSON.stringify(message)

    if (this.state === WS_STATE.CONNECTED) {
      wx.sendSocketMessage({
        data: messageStr,
        fail: (err) => {
          console.error('[WS] 发送失败:', err)
          this.messageQueue.push(messageStr)
        }
      })
    } else {
      console.log('[WS] 未连接，消息加入队列:', type)
      this.messageQueue.push(messageStr)
    }
  }

  /**
   * 发送队列中的消息
   */
  flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.state === WS_STATE.CONNECTED) {
      const message = this.messageQueue.shift()
      wx.sendSocketMessage({
        data: message,
        fail: (err) => console.error('[WS] 队列消息发送失败:', err)
      })
    }
  }

  /**
   * 开始心跳
   */
  startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (this.state === WS_STATE.CONNECTED) {
        this.send('ping')
      }
    }, 30000)
  }

  /**
   * 停止心跳
   */
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /**
   * 处理收到的消息
   */
  handleMessage(data) {
    try {
      const message = JSON.parse(data)
      console.log('[WS] 收到消息:', message.type)

      switch (message.type) {
        case 'pong':
          // 心跳响应
          break

        case 'room_created':
          this.roomCode = message.roomCode
          this.emit('room_created', message)
          break

        case 'room_joined':
          this.roomCode = message.roomCode
          this.emit('room_joined', message)
          break

        case 'player_joined':
          this.emit('player_joined', message)
          break

        case 'player_left':
          this.emit('player_left', message)
          break

        case 'player_ready':
          this.emit('player_ready', message)
          break

        case 'game_start':
          this.emit('game_start', message)
          break

        case 'game_end':
          this.emit('game_end', message)
          break

        case 'turn_result':
          this.emit('turn_result', message)
          break

        case 'error':
          console.error('[WS] 服务器错误:', message.message)
          this.emit('error', message)
          break

        case 'matched':
          this.emit('matched', message)
          break

        case 'match_cancelled':
          this.emit('match_cancelled', message)
          break

        case 'online_players':
          this.emit('online_players', message)
          break

        case 'stats_updated':
          this.emit('stats_updated', message)
          break

        default:
          console.log('[WS] 未知消息类型:', message.type)
      }
    } catch (err) {
      console.error('[WS] 解析消息失败:', err, data)
    }
  }

  /**
   * 注册事件处理器
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event).push(handler)
  }

  /**
   * 移除事件处理器
   */
  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event)
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  /**
   * 触发事件
   */
  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data)
        } catch (err) {
          console.error('[WS] 事件处理器错误:', err)
        }
      })
    }
  }

  /**
   * 清除所有事件处理器
   */
  clearHandlers() {
    this.eventHandlers.clear()
  }

  // ==================== 房间操作 ====================

  /**
   * 创建房间
   */
  createRoom(difficulty = 4) {
    const playerId = this.getPlayerId()
    const roomCode = this.generateRoomCode()

    this.send('create_room', {
      roomCode,
      playerId,
      difficulty
    })

    return roomCode
  }

  /**
   * 加入房间
   */
  joinRoom(roomCode) {
    const playerId = this.getPlayerId()

    this.send('join_room', {
      roomCode,
      playerId
    })
  }

  /**
   * 离开房间
   */
  leaveRoom() {
    const playerId = this.getPlayerId()

    if (this.roomCode) {
      this.send('leave_room', {
        roomCode: this.roomCode,
        playerId
      })
      this.roomCode = null
    }
  }

  /**
   * 设置准备状态
   */
  setReady(secret) {
    const playerId = this.getPlayerId()

    this.send('player_ready', {
      roomCode: this.roomCode,
      playerId,
      secret
    })
  }

  /**
   * 设置难度
   */
  setDifficulty(difficulty) {
    const playerId = this.getPlayerId()

    this.send('set_difficulty', {
      roomCode: this.roomCode,
      playerId,
      difficulty
    })
  }

  /**
   * 提交猜测
   */
  submitGuess(guess) {
    const playerId = this.getPlayerId()

    this.send('submit_guess', {
      roomCode: this.roomCode,
      playerId,
      guess
    })
  }

  /**
   * 请求重赛
   */
  requestRematch() {
    const playerId = this.getPlayerId()

    this.send('request_rematch', {
      roomCode: this.roomCode,
      playerId
    })
  }

  // ==================== 匹配操作 ====================

  /**
   * 开始随机匹配
   */
  startMatch(difficulty = 4) {
    const playerId = this.getPlayerId()

    this.send('random_match', {
      playerId,
      difficulty
    })
  }

  /**
   * 取消匹配
   */
  cancelMatch() {
    const playerId = this.getPlayerId()

    this.send('cancel_random_match', {
      playerId
    })
  }

  // ==================== 辅助方法 ====================

  /**
   * 生成房间号
   */
  generateRoomCode() {
    const chars = '0123456789ABCDEF'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)]
    }
    return code
  }

  /**
   * 获取连接状态
   */
  isConnected() {
    return this.state === WS_STATE.CONNECTED
  }

  /**
   * 获取当前房间号
   */
  getRoomCode() {
    return this.roomCode
  }
}

// 单例模式
let wsService = null

function getWSService() {
  if (!wsService) {
    wsService = new WebSocketService()
  }
  return wsService
}

module.exports = {
  getWSService,
  WS_STATE
}