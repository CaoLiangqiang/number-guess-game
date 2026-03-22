// lobby.js - 联机大厅页面
const app = getApp()

Page({
  data: {
    onlineCount: 0,
    onlinePlayers: [],
    showJoinModal: false,
    roomCode: '',
    matching: false
  },

  onLoad() {
    this.checkLogin()
  },

  onShow() {
    this.loadOnlinePlayers()
  },

  onUnload() {
    this.stopMatch()
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

  // 加载在线玩家
  async loadOnlinePlayers() {
    // TODO: 从服务器获取在线玩家列表
    // 目前使用模拟数据
    this.setData({
      onlineCount: 5,
      onlinePlayers: [
        { openid: '1', nickname: '玩家A', avatar: '', status: 'idle' },
        { openid: '2', nickname: '玩家B', avatar: '', status: 'playing' },
      ]
    })
  },

  // 创建房间
  async createRoom() {
    if (!app.isLoggedIn()) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    try {
      wx.showLoading({ title: '创建中...' })

      // TODO: 调用 WebSocket 创建房间
      // const result = await this.wsCreateRoom()

      wx.hideLoading()

      // 跳转到房间页面
      wx.navigateTo({
        url: '/pages/room/room?roomId=ABC123&isHost=true'
      })
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

      // TODO: 调用 WebSocket 加入房间
      // const result = await this.wsJoinRoom(roomCode)

      wx.hideLoading()
      this.closeJoinDialog()

      // 跳转到房间页面
      wx.navigateTo({
        url: `/pages/room/room?roomId=${roomCode}&isHost=false`
      })
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

    // TODO: 实现 WebSocket 匹配逻辑
    // 模拟匹配
    setTimeout(() => {
      this.setData({ matching: false })
      wx.showToast({ title: '暂无匹配对手', icon: 'none' })
    }, 5000)
  },

  // 取消匹配
  cancelMatch() {
    this.stopMatch()
    this.setData({ matching: false })
  },

  stopMatch() {
    // TODO: 取消 WebSocket 匹配
  },

  // 邀请玩家
  invitePlayer(e) {
    const openid = e.currentTarget.dataset.openid
    // TODO: 发送邀请
    wx.showToast({ title: '邀请已发送', icon: 'success' })
  },

  onPullDownRefresh() {
    this.loadOnlinePlayers().then(() => {
      wx.stopPullDownRefresh()
    })
  }
})