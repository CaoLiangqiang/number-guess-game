// room.js - 游戏房间页面
const app = getApp()

Page({
  data: {
    roomId: '',
    isHost: false,
    difficulty: 4,
    host: null,
    guest: null
  },

  onLoad(options) {
    const { roomId, isHost } = options
    this.setData({
      roomId: roomId || 'ABC123',
      isHost: isHost === 'true'
    })

    this.initRoom()
  },

  onUnload() {
    // 离开房间时通知服务器
    this.leaveRoom()
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

    // TODO: 连接 WebSocket 监听房间事件
    this.listenRoomEvents()
  },

  listenRoomEvents() {
    // TODO: 监听玩家加入、离开、准备等事件
  },

  setDifficulty(e) {
    const difficulty = parseInt(e.currentTarget.dataset.value)
    this.setData({ difficulty })
  },

  shareRoom() {
    // 分享房间给好友
    wx.shareAppMessage({
      title: '来和我对战吧！',
      path: `/pages/room/room?roomId=${this.data.roomId}&isHost=false`
    })
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
    // TODO: 通知服务器离开房间
    wx.navigateBack()
  },

  // 玩家加入回调
  onPlayerJoin(player) {
    this.setData({ guest: player })
  },

  // 玩家离开回调
  onPlayerLeave() {
    this.setData({ guest: null })
  }
})