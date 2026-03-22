// lobby.js - 联机大厅页面
const app = getApp()
const { getWSService, WS_STATE } = require('../../services/websocket')

Page({
  data: {
    onlineCount: 0,
    onlinePlayers: [],
    showJoinModal: false,
    roomCode: '',
    matching: false,
    connected: false
  },

  wsService: null,

  onLoad() {
    this.checkLogin()
    this.initWebSocket()
  },

  onShow() {
    this.loadOnlinePlayers()
    this.updateConnectionStatus()
  },

  onUnload() {
    this.stopMatch()
    this.removeWSEventHandlers()
  },

  // 检查登录状态
  checkLogin() {
    if (!app.isLoggedIn()) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再进入联机大厅',
        showCancel: false,
        success: () => {
          wx.switchTab({
            url: '/pages/index/index'
          })
        }
      })
    }
  },

  // 初始化 WebSocket
  async initWebSocket() {
    this.wsService = getWSService()
    this.setupWSEventHandlers()

    try {
      await this.wsService.connect()
      this.setData({ connected: true })
    } catch (error) {
      console.log('[Lobby] WebSocket 连接失败，使用离线模式')
      this.setData({ connected: false })
    }
  },

  // 设置 WebSocket 事件处理器
  setupWSEventHandlers() {
    this.wsService.on('room_created', this.onRoomCreated.bind(this))
    this.wsService.on('room_joined', this.onRoomJoined.bind(this))
    this.wsService.on('matched', this.onMatched.bind(this))
    this.wsService.on('match_cancelled', this.onMatchCancelled.bind(this))
    this.wsService.on('online_players', this.onOnlinePlayers.bind(this))
    this.wsService.on('error', this.onWSError.bind(this))
    this.wsService.on('disconnected', this.onDisconnected.bind(this))
  },

  // 移除 WebSocket 事件处理器
  removeWSEventHandlers() {
    if (this.wsService) {
      this.wsService.off('room_created', this.onRoomCreated)
      this.wsService.off('room_joined', this.onRoomJoined)
      this.wsService.off('matched', this.onMatched)
      this.wsService.off('match_cancelled', this.onMatchCancelled)
      this.wsService.off('online_players', this.onOnlinePlayers)
      this.wsService.off('error', this.onWSError)
      this.wsService.off('disconnected', this.onDisconnected)
    }
  },

  // 更新连接状态
  updateConnectionStatus() {
    if (this.wsService) {
      this.setData({
        connected: this.wsService.isConnected()
      })
    }
  },

  // WebSocket 事件回调
  onRoomCreated(data) {
    wx.hideLoading()
    wx.navigateTo({
      url: `/pages/room/room?roomId=${data.roomCode}&isHost=true`
    })
  },

  onRoomJoined(data) {
    wx.hideLoading()
    this.closeJoinDialog()
    wx.navigateTo({
      url: `/pages/room/room?roomId=${data.roomCode}&isHost=false`
    })
  },

  onMatched(data) {
    this.setData({ matching: false })
    wx.hideLoading()
    wx.navigateTo({
      url: `/pages/room/room?roomId=${data.roomCode}&isHost=false&matched=true`
    })
  },

  onMatchCancelled() {
    this.setData({ matching: false })
  },

  onOnlinePlayers(data) {
    this.setData({
      onlineCount: data.count || 0,
      onlinePlayers: data.players || []
    })
  },

  onWSError(data) {
    wx.hideLoading()
    wx.showToast({ title: data.message || '服务器错误', icon: 'none' })
  },

  onDisconnected() {
    this.setData({ connected: false })
  },

  // 加载在线玩家
  async loadOnlinePlayers() {
    if (this.wsService && this.wsService.isConnected()) {
      // 已连接服务器，请求在线玩家列表
      // 服务器会通过 'online_players' 事件返回数据
    } else {
      // 离线模式：使用模拟数据
      this.setData({
        onlineCount: 5,
        onlinePlayers: [
          { openid: '1', nickname: '玩家A', avatar: '', status: 'idle' },
          { openid: '2', nickname: '玩家B', avatar: '', status: 'playing' },
        ]
      })
    }
  },

  // 创建房间
  async createRoom() {
    if (!app.isLoggedIn()) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    try {
      wx.showLoading({ title: '创建中...' })

      if (this.wsService && this.wsService.isConnected()) {
        // 使用 WebSocket 创建房间
        const roomCode = this.wsService.createRoom(app.globalData.settings.difficulty)
        // 等待 room_created 事件
      } else {
        // 离线模式：直接跳转
        wx.hideLoading()
        const roomCode = this.generateRoomCode()
        wx.navigateTo({
          url: `/pages/room/room?roomId=${roomCode}&isHost=true`
        })
      }
    } catch (error) {
      wx.hideLoading()
      wx.showToast({ title: '创建失败', icon: 'error' })
    }
  },

  // 显示加入房间弹窗
  showJoinDialog() {
    this.setData({ showJoinModal: true, roomCode: '' })
  },

  // 关闭加入房间弹窗
  closeJoinDialog() {
    this.setData({ showJoinModal: false })
  },

  // 输入房间号
  onRoomCodeChange(e) {
    const value = e.detail.toUpperCase()
    this.setData({ roomCode: value })
  },

  // 加入房间
  async joinRoom() {
    const { roomCode } = this.data

    if (!roomCode || roomCode.length !== 6) {
      wx.showToast({ title: '请输入正确的房间号', icon: 'none' })
      return
    }

    try {
      wx.showLoading({ title: '加入中...' })

      if (this.wsService && this.wsService.isConnected()) {
        // 使用 WebSocket 加入房间
        this.wsService.joinRoom(roomCode)
        // 等待 room_joined 事件
      } else {
        // 离线模式：直接跳转
        wx.hideLoading()
        this.closeJoinDialog()
        wx.navigateTo({
          url: `/pages/room/room?roomId=${roomCode}&isHost=false`
        })
      }
    } catch (error) {
      wx.hideLoading()
      wx.showToast({ title: '房间不存在', icon: 'error' })
    }
  },

  // 快速匹配
  async quickMatch() {
    if (!app.isLoggedIn()) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    this.setData({ matching: true })

    if (this.wsService && this.wsService.isConnected()) {
      // 使用 WebSocket 匹配
      this.wsService.startMatch(app.globalData.settings.difficulty)
      // 等待 matched 事件
    } else {
      // 离线模式：模拟匹配
      setTimeout(() => {
        this.setData({ matching: false })
        wx.showToast({ title: '暂无匹配对手', icon: 'none' })
      }, 5000)
    }
  },

  // 取消匹配
  cancelMatch() {
    this.stopMatch()
    this.setData({ matching: false })
  },

  stopMatch() {
    if (this.wsService && this.wsService.isConnected()) {
      this.wsService.cancelMatch()
    }
  },

  // 邀请玩家
  invitePlayer(e) {
    const openid = e.currentTarget.dataset.openid
    const token = wx.getStorageSync('token')
    const myOpenid = app.globalData.userInfo?.openid

    if (!token || !myOpenid) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    wx.showModal({
      title: '邀请对战',
      content: '确定邀请该玩家进行对战吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '发送邀请...' })

          try {
            // 先创建房间
            const roomCode = this.generateRoomCode()

            // 通过 WebSocket 创建房间
            if (this.wsService && this.wsService.isConnected()) {
              // 监听房间创建结果
              const roomCreated = await new Promise((resolve, reject) => {
                const handler = (msg) => {
                  if (msg.type === 'room_created') {
                    this.wsService.off('message', handler)
                    resolve(msg.room)
                  } else if (msg.type === 'error') {
                    this.wsService.off('message', handler)
                    reject(new Error(msg.message))
                  }
                }
                this.wsService.on('message', handler)

                // 发送创建房间请求
                this.wsService.send({
                  type: 'create_room',
                  roomCode,
                  playerId: myOpenid
                })

                // 5秒超时
                setTimeout(() => {
                  this.wsService.off('message', handler)
                  reject(new Error('创建房间超时'))
                }, 5000)
              })

              // 发送邀请
              const response = await new Promise((resolve, reject) => {
                wx.request({
                  url: `${app.globalData.serverUrl}/api/invite`,
                  method: 'POST',
                  header: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  data: {
                    roomCode: roomCreated.code,
                    fromOpenid: myOpenid,
                    toOpenid: openid
                  },
                  success: (res) => resolve(res.data),
                  fail: (err) => reject(err)
                })
              })

              wx.hideLoading()

              if (response.success) {
                wx.showToast({ title: '邀请已发送', icon: 'success' })
              } else {
                wx.showToast({ title: response.message || '发送失败', icon: 'none' })
              }
            } else {
              wx.hideLoading()
              wx.showToast({ title: '未连接服务器', icon: 'none' })
            }
          } catch (error) {
            wx.hideLoading()
            console.error('邀请失败:', error)
            wx.showToast({ title: error.message || '邀请失败', icon: 'none' })
          }
        }
      }
    })
  },

  // 生成房间号（离线模式用）
  generateRoomCode() {
    const chars = '0123456789ABCDEF'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)]
    }
    return code
  },

  onPullDownRefresh() {
    this.loadOnlinePlayers()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 500)
  }
})