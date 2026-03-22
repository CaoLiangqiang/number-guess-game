// room.js - 游戏房间页面
const app = getApp()
const { getWSService, WS_STATE } = require('../../services/websocket')

Page({
  data: {
    roomId: '',
    isHost: false,
    difficulty: 4,
    host: null,
    guest: null,
    connected: false,
    opponentReady: false
  },

  wsService: null,

  onLoad(options) {
    const { roomId, isHost, matched } = options
    this.setData({
      roomId: roomId || 'ABC123',
      isHost: isHost === 'true',
      matched: matched === 'true'
    })

    this.initRoom()
  },

  onUnload() {
    // 离开房间时通知服务器
    this.leaveRoom()
    this.removeWSEventHandlers()
  },

  initRoom() {
    // 设置房主信息
    if (this.data.isHost) {
      this.setData({
        host: {
          openid: app.globalData.openid,
          nickname: app.globalData.userInfo?.nickName || '房主',
          avatar: app.globalData.userInfo?.avatarUrl
        }
      })
    }

    // 初始化 WebSocket 并监听房间事件
    this.initWebSocket()
  },

  // 初始化 WebSocket
  async initWebSocket() {
    this.wsService = getWSService()
    this.setupWSEventHandlers()

    // 如果已连接，直接加入房间
    if (this.wsService.isConnected()) {
      this.setData({ connected: true })
      if (!this.data.isHost) {
        this.wsService.joinRoom(this.data.roomId)
      }
    } else {
      try {
        await this.wsService.connect()
        this.setData({ connected: true })
        if (!this.data.isHost) {
          this.wsService.joinRoom(this.data.roomId)
        }
      } catch (error) {
        console.log('[Room] WebSocket 连接失败，使用离线模式')
        this.setData({ connected: false })
      }
    }
  },

  // 设置 WebSocket 事件处理器
  setupWSEventHandlers() {
    this.wsService.on('player_joined', this.onPlayerJoined.bind(this))
    this.wsService.on('player_left', this.onPlayerLeft.bind(this))
    this.wsService.on('player_ready', this.onPlayerReady.bind(this))
    this.wsService.on('game_start', this.onGameStart.bind(this))
    this.wsService.on('error', this.onWSError.bind(this))
    this.wsService.on('disconnected', this.onDisconnected.bind(this))
  },

  // 移除 WebSocket 事件处理器
  removeWSEventHandlers() {
    if (this.wsService) {
      this.wsService.off('player_joined', this.onPlayerJoined)
      this.wsService.off('player_left', this.onPlayerLeft)
      this.wsService.off('player_ready', this.onPlayerReady)
      this.wsService.off('game_start', this.onGameStart)
      this.wsService.off('error', this.onWSError)
      this.wsService.off('disconnected', this.onDisconnected)
    }
  },

  // WebSocket 事件回调
  onPlayerJoined(data) {
    console.log('[Room] 玩家加入:', data)
    this.setData({
      guest: {
        openid: data.playerId,
        nickname: data.nickname || '玩家',
        avatar: data.avatar
      }
    })
  },

  onPlayerLeft(data) {
    console.log('[Room] 玩家离开:', data)
    this.setData({ guest: null })
    wx.showToast({ title: '对手已离开', icon: 'none' })
  },

  onPlayerReady(data) {
    console.log('[Room] 玩家准备:', data)
    this.setData({ opponentReady: true })
  },

  onGameStart(data) {
    console.log('[Room] 游戏开始:', data)
    wx.redirectTo({
      url: `/pages/game/game?mode=friend&difficulty=${data.difficulty || this.data.difficulty}&roomId=${this.data.roomId}`
    })
  },

  onWSError(data) {
    console.error('[Room] 错误:', data)
    wx.showToast({ title: data.message || '服务器错误', icon: 'none' })
  },

  onDisconnected() {
    this.setData({ connected: false })
  },

  setDifficulty(e) {
    const difficulty = parseInt(e.currentTarget.dataset.value)
    this.setData({ difficulty })

    // 通知服务器难度变更
    if (this.wsService && this.wsService.isConnected()) {
      this.wsService.setDifficulty(difficulty)
    }
  },

  shareRoom() {
    // 分享房间给好友
    return {
      title: '来和我对战吧！',
      path: `/pages/room/room?roomId=${this.data.roomId}&isHost=false`
    }
  },

  startGame() {
    if (!this.data.guest) {
      wx.showToast({ title: '等待玩家加入', icon: 'none' })
      return
    }

    // 跳转到游戏页面
    wx.redirectTo({
      url: `/pages/game/game?mode=friend&difficulty=${this.data.difficulty}&roomId=${this.data.roomId}`
    })
  },

  leaveRoom() {
    // 通知服务器离开房间
    if (this.wsService && this.wsService.isConnected()) {
      this.wsService.leaveRoom()
    }
    wx.navigateBack()
  },

  // 玩家加入回调（兼容旧接口）
  onPlayerJoin(player) {
    this.setData({ guest: player })
  },

  // 玩家离开回调（兼容旧接口）
  onPlayerLeave() {
    this.setData({ guest: null })
  }
})