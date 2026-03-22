// network.js - 网络通信工具（微信小程序版）
const app = getApp()

/**
 * WebSocket 客户端类
 * 适配微信小程序的 wx.connectSocket API
 */
class WebSocketClient {
  constructor(url) {
    this.url = url
    this.socketTask = null
    this.connected = false
    this.reconnecting = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 2000
    this.heartbeatInterval = null
    this.heartbeatTimeout = 30000
    this.messageQueue = []
    this.listeners = new Map()
  }

  /**
   * 连接 WebSocket
   */
  connect() {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        resolve()
        return
      }

      this.socketTask = wx.connectSocket({
        url: this.url,
        success: () => {
          console.log('[WebSocket] 连接中...')
        },
        fail: (err) => {
          console.error('[WebSocket] 连接失败:', err)
          reject(err)
        }
      })

      this.socketTask.onOpen(() => {
        console.log('[WebSocket] 连接成功')
        this.connected = true
        this.reconnectAttempts = 0
        this.startHeartbeat()
        this.flushMessageQueue()
        this.emit('connected')
        resolve()
      })

      this.socketTask.onMessage((res) => {
        try {
          const data = JSON.parse(res.data)
          this.handleMessage(data)
        } catch (e) {
          console.error('[WebSocket] 消息解析失败:', e)
        }
      })

      this.socketTask.onClose(() => {
        console.log('[WebSocket] 连接关闭')
        this.connected = false
        this.stopHeartbeat()
        this.emit('disconnected')
        this.attemptReconnect()
      })

      this.socketTask.onError((err) => {
        console.error('[WebSocket] 错误:', err)
        this.emit('error', err)
      })
    })
  }

  /**
   * 发送消息
   */
  send(type, data = {}) {
    const message = JSON.stringify({ type, ...data })

    if (this.connected) {
      this.socketTask.send({
        data: message,
        fail: (err) => {
          console.error('[WebSocket] 发送失败:', err)
          this.messageQueue.push(message)
        }
      })
    } else {
      console.log('[WebSocket] 未连接，消息入队')
      this.messageQueue.push(message)
    }
  }

  /**
   * 处理接收的消息
   */
  handleMessage(data) {
    const { type, ...payload } = data
    this.emit(type, payload)
  }

  /**
   * 事件监听
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  /**
   * 移除监听
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  /**
   * 触发事件
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data))
    }
  }

  /**
   * 开始心跳
   */
  startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatInterval = setInterval(() => {
      this.send('heartbeat', { timestamp: Date.now() })
    }, this.heartbeatTimeout)
  }

  /**
   * 停止心跳
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * 发送队列中的消息
   */
  flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.connected) {
      const message = this.messageQueue.shift()
      this.socketTask.send({
        data: message,
        fail: (err) => {
          console.error('[WebSocket] 队列消息发送失败:', err)
        }
      })
    }
  }

  /**
   * 尝试重连
   */
  attemptReconnect() {
    if (this.reconnecting || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return
    }

    this.reconnecting = true
    this.reconnectAttempts++

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    console.log(`[WebSocket] ${delay}ms 后尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    setTimeout(() => {
      this.connect()
        .then(() => {
          this.reconnecting = false
        })
        .catch(() => {
          this.reconnecting = false
        })
    }, delay)
  }

  /**
   * 关闭连接
   */
  close() {
    this.stopHeartbeat()
    this.reconnectAttempts = this.maxReconnectAttempts // 阻止重连
    if (this.socketTask) {
      this.socketTask.close()
    }
    this.connected = false
  }
}

/**
 * 获取 WebSocket 服务器 URL
 */
function getWebSocketUrl() {
  const config = app.globalData.gameConfig
  return config.wsServer || 'wss://your-server.com'
}

/**
 * 创建 WebSocket 客户端
 */
function createWebSocketClient() {
  const url = getWebSocketUrl()
  return new WebSocketClient(url)
}

module.exports = {
  WebSocketClient,
  getWebSocketUrl,
  createWebSocketClient
}