// profile.js - 个人中心页面
const app = getApp()
const storage = require('../../utils/storage')

Page({
  data: {
    userInfo: null,
    openid: null,
    stats: {
      totalGames: 0,
      wins: 0,
      winRate: 0,
      winStreak: 0
    },
    settings: {
      theme: 'dark',
      soundEnabled: true,
      difficulty: 4
    },
    showSettingsSheet: false
  },

  onLoad() {
    this.loadUserInfo()
    this.loadStats()
    this.loadSettings()
  },

  onShow() {
    this.loadStats()
  },

  loadUserInfo() {
    this.setData({
      userInfo: app.globalData.userInfo,
      openid: app.globalData.openid
    })
  },

  loadStats() {
    const stats = storage.getUserStats()
    const winRate = stats.totalGames > 0
      ? Math.round((stats.wins / stats.totalGames) * 100)
      : 0

    this.setData({
      stats: {
        totalGames: stats.totalGames,
        wins: stats.wins,
        winRate,
        winStreak: stats.winStreak
      }
    })
  },

  loadSettings() {
    this.setData({
      settings: app.globalData.settings
    })
  },

  async handleLogin() {
    try {
      wx.showLoading({ title: '登录中...' })

      const { userInfo } = await wx.getUserProfile({
        desc: '用于展示用户昵称和头像'
      })

      await app.login()

      app.globalData.userInfo = userInfo

      this.setData({
        userInfo,
        openid: app.globalData.openid
      })

      wx.hideLoading()
      wx.showToast({ title: '登录成功', icon: 'success' })

    } catch (error) {
      wx.hideLoading()
      wx.showToast({ title: '登录失败', icon: 'error' })
    }
  },

  goToHistory() {
    wx.navigateTo({
      url: '/pages/history/history'
    })
  },

  goToRules() {
    wx.navigateTo({
      url: '/pages/rules/rules'
    })
  },

  showSettings() {
    this.setData({ showSettingsSheet: true })
  },

  closeSettings() {
    this.setData({ showSettingsSheet: false })
  },

  toggleTheme(e) {
    const theme = e.detail.value ? 'dark' : 'light'
    this.setData({ 'settings.theme': theme })
    app.saveSettings({ theme })
  },

  toggleSound(e) {
    const soundEnabled = e.detail.value
    this.setData({ 'settings.soundEnabled': soundEnabled })
    app.saveSettings({ soundEnabled })
  },

  setDifficulty(e) {
    const difficulty = parseInt(e.currentTarget.dataset.value)
    this.setData({ 'settings.difficulty': difficulty })
    app.saveSettings({ difficulty })
  },

  showAbout() {
    wx.showModal({
      title: '关于数字对决 Pro',
      content: '版本：1.0.0\n\n一款社交竞技数字推理游戏\n\n支持 AI 对战、好友对战、每日挑战',
      showCancel: false
    })
  }
})