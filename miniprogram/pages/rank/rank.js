// rank.js - 排行榜页面
const app = getApp()
const { getWSService } = require('../../services/websocket')

Page({
  data: {
    activeTab: 'winRate',
    winRateList: [],
    winStreakList: [],
    dailyList: [],
    myRank: null,
    userInfo: null,
    connected: false
  },

  wsService: null,

  onLoad() {
    this.loadUserInfo()
    this.initWebSocket()
    this.loadRankings()
  },

  onShow() {
    this.loadRankings()
  },

  onUnload() {
    this.removeWSEventHandlers()
  },

  loadUserInfo() {
    this.setData({
      userInfo: app.globalData.userInfo
    })
  },

  // 初始化 WebSocket
  async initWebSocket() {
    this.wsService = getWSService()
    this.setupWSEventHandlers()

    if (this.wsService.isConnected()) {
      this.setData({ connected: true })
    }
  },

  // 设置 WebSocket 事件处理器
  setupWSEventHandlers() {
    if (this.wsService) {
      this.wsService.on('online_players', this.onRankingData.bind(this))
    }
  },

  // 移除 WebSocket 事件处理器
  removeWSEventHandlers() {
    if (this.wsService) {
      this.wsService.off('online_players', this.onRankingData)
    }
  },

  // 收到排行榜数据
  onRankingData(data) {
    if (data.rankings) {
      this.setData({
        winRateList: data.rankings.winRate || [],
        winStreakList: data.rankings.winStreak || [],
        dailyList: data.rankings.daily || []
      })
      this.calculateMyRank()
    }
  },

  async loadRankings() {
    // 如果连接了服务器，请求排行榜数据
    if (this.wsService && this.wsService.isConnected()) {
      // 服务器会通过 'online_players' 事件返回数据
      this.setData({ connected: true })
    } else {
      // 离线模式：使用本地存储或模拟数据
      const cachedRankings = wx.getStorageSync('cachedRankings')
      if (cachedRankings) {
        this.setData({
          winRateList: cachedRankings.winRate || [],
          winStreakList: cachedRankings.winStreak || [],
          dailyList: cachedRankings.daily || []
        })
      } else {
        // 模拟数据
        this.setData({
          winRateList: [
            { openid: '1', nickname: '玩家A', avatar: '', value: 95 },
            { openid: '2', nickname: '玩家B', avatar: '', value: 88 },
            { openid: '3', nickname: '玩家C', avatar: '', value: 82 },
          ],
          winStreakList: [
            { openid: '1', nickname: '玩家A', avatar: '', value: 12 },
            { openid: '2', nickname: '玩家D', avatar: '', value: 8 },
            { openid: '3', nickname: '玩家E', avatar: '', value: 5 },
          ],
          dailyList: []
        })
      }
    }

    // 计算我的排名
    this.calculateMyRank()
  },

  calculateMyRank() {
    const { activeTab, winRateList, winStreakList, dailyList } = this.data
    const stats = wx.getStorageSync('userStats') || { totalGames: 0, wins: 0, winStreak: 0 }
    let displayValue

    switch (activeTab) {
      case 'winRate':
        const winRate = stats.totalGames > 0
          ? Math.round((stats.wins / stats.totalGames) * 100)
          : 0
        displayValue = `胜率 ${winRate}%`
        break
      case 'winStreak':
        displayValue = `${stats.winStreak || 0}连胜`
        break
      case 'daily':
        displayValue = '未参与'
        break
    }

    this.setData({
      myRank: {
        rank: 99,
        displayValue
      }
    })
  },

  onTabChange(e) {
    this.setData({ activeTab: e.detail.name })
    this.calculateMyRank()
  },

  onPullDownRefresh() {
    this.loadRankings()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 500)
  }
})