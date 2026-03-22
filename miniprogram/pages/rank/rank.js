// rank.js - 排行榜页面
const app = getApp()

Page({
  data: {
    activeTab: 'winRate',
    winRateList: [],
    winStreakList: [],
    dailyList: [],
    myRank: null,
    userInfo: null
  },

  onLoad() {
    this.loadUserInfo()
    this.loadRankings()
  },

  onShow() {
    this.loadRankings()
  },

  loadUserInfo() {
    this.setData({
      userInfo: app.globalData.userInfo
    })
  },

  async loadRankings() {
    // TODO: 从云数据库获取排行榜数据
    // 目前使用模拟数据
    const mockData = [
      { openid: '1', nickname: '玩家A', avatar: '', value: 95 },
      { openid: '2', nickname: '玩家B', avatar: '', value: 88 },
      { openid: '3', nickname: '玩家C', avatar: '', value: 82 },
    ]

    this.setData({
      winRateList: mockData,
      winStreakList: [
        { openid: '1', nickname: '玩家A', avatar: '', value: 12 },
        { openid: '2', nickname: '玩家D', avatar: '', value: 8 },
        { openid: '3', nickname: '玩家E', avatar: '', value: 5 },
      ],
      dailyList: []
    })

    // 计算我的排名
    this.calculateMyRank()
  },

  calculateMyRank() {
    const { activeTab, winRateList, winStreakList, dailyList } = this.data
    let list, displayValue

    switch (activeTab) {
      case 'winRate':
        list = winRateList
        displayValue = '胜率 0%'
        break
      case 'winStreak':
        list = winStreakList
        displayValue = '0连胜'
        break
      case 'daily':
        list = dailyList
        displayValue = '未参与'
        break
    }

    // TODO: 根据用户实际数据计算排名
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
    this.loadRankings().then(() => {
      wx.stopPullDownRefresh()
    })
  }
})