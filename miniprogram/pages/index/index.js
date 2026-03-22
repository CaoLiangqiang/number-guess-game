// index.js - 首页逻辑
const app = getApp()
const game = require('../../utils/game')

Page({
  data: {
    userInfo: null,
    stats: {
      winRate: 0,
      winStreak: 0
    },
    settings: {
      difficulty: 4,
      soundEnabled: true
    },
    dailyChallenge: {
      status: 'pending' // pending | completed
    },
    guideCompleted: false
  },

  onLoad() {
    this.loadUserInfo()
    this.loadSettings()
    this.checkDailyChallenge()
    this.checkGuideStatus()
  },

  onShow() {
    // 每次显示时刷新数据
    this.loadUserInfo()
  },

  // 加载用户信息
  loadUserInfo() {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo
      })
      // TODO: 从服务器获取统计数据
      this.loadUserStats()
    }
  },

  // 加载用户统计
  loadUserStats() {
    // TODO: 调用云函数获取用户统计数据
    // 临时使用本地数据
    const stats = wx.getStorageSync('userStats') || {
      totalGames: 0,
      wins: 0,
      winStreak: 0
    }
    const winRate = stats.totalGames > 0
      ? Math.round((stats.wins / stats.totalGames) * 100)
      : 0

    this.setData({
      stats: {
        winRate,
        winStreak: stats.winStreak
      }
    })
  },

  // 加载设置
  loadSettings() {
    this.setData({
      settings: app.globalData.settings
    })
  },

  // 检查每日挑战状态
  checkDailyChallenge() {
    const today = new Date().toISOString().split('T')[0]
    const completedDate = wx.getStorageSync('dailyChallengeDate')

    this.setData({
      dailyChallenge: {
        status: completedDate === today ? 'completed' : 'pending'
      }
    })
  },

  // 检查新手引导状态
  checkGuideStatus() {
    const guideCompleted = wx.getStorageSync('guide_completed')
    this.setData({ guideCompleted })
  },

  // 微信登录
  async handleLogin() {
    try {
      wx.showLoading({ title: '登录中...' })

      // 获取用户信息
      const { userInfo } = await wx.getUserProfile({
        desc: '用于展示用户昵称和头像'
      })

      // 调用登录
      const result = await app.login()

      app.globalData.userInfo = userInfo

      this.setData({
        userInfo
      })

      wx.hideLoading()
      wx.showToast({ title: '登录成功', icon: 'success' })

    } catch (error) {
      wx.hideLoading()
      console.error('登录失败:', error)
      wx.showToast({ title: '登录失败', icon: 'error' })
    }
  },

  // 开始AI对战
  startAIGame() {
    const difficulty = this.data.settings.difficulty
    wx.navigateTo({
      url: `/pages/game/game?mode=ai&difficulty=${difficulty}`
    })
  },

  // 开始每日挑战
  startDailyChallenge() {
    if (this.data.dailyChallenge.status === 'completed') {
      wx.showToast({ title: '今日已完成挑战', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: '/pages/game/game?mode=daily'
    })
  },

  // 前往联机大厅
  goToLobby() {
    wx.switchTab({
      url: '/pages/lobby/lobby'
    })
  },

  // 设置难度
  setDifficulty(e) {
    const difficulty = parseInt(e.currentTarget.dataset.value)
    this.setData({
      'settings.difficulty': difficulty
    })
    app.saveSettings({ difficulty })
  },

  // 切换音效
  toggleSound(e) {
    const soundEnabled = e.detail.value
    this.setData({
      'settings.soundEnabled': soundEnabled
    })
    app.saveSettings({ soundEnabled })
  },

  // 显示新手引导
  showGuide() {
    wx.navigateTo({
      url: '/pages/rules/rules'
    })
  }
})