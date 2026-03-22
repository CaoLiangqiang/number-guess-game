// app.js - 数字对决 Pro 微信小程序入口
const auth = require('./utils/auth')
const theme = require('./utils/theme')

App({
  globalData: {
    userInfo: null,
    openid: null,
    token: null,
    settings: {
      theme: 'dark',
      soundEnabled: true,
      difficulty: 4
    },
    gameConfig: {
      wsServer: 'wss://your-server.com',
      apiServer: 'https://your-server.com'
    }
  },

  onLaunch() {
    // 初始化主题
    theme.initTheme()
    // 检查登录状态
    this.checkLoginStatus()
    // 加载用户设置
    this.loadSettings()
    // 检查更新
    this.checkUpdate()
  },

  checkLoginStatus() {
    const token = wx.getStorageSync('token')
    const openid = wx.getStorageSync('openid')
    if (token && openid) {
      this.globalData.token = token
      this.globalData.openid = openid
    }
    // 加载用户信息
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.globalData.userInfo = userInfo
    }
  },

  loadSettings() {
    try {
      const settings = wx.getStorageSync('settings')
      if (settings) {
        this.globalData.settings = { ...this.globalData.settings, ...settings }
      }
    } catch (e) {
      console.error('加载设置失败:', e)
    }
  },

  saveSettings(settings) {
    this.globalData.settings = { ...this.globalData.settings, ...settings }
    wx.setStorageSync('settings', this.globalData.settings)
  },

  checkUpdate() {
    const updateManager = wx.getUpdateManager()
    updateManager.onUpdateReady(() => {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success: (res) => {
          if (res.confirm) {
            updateManager.applyUpdate()
          }
        }
      })
    })
  },

  // 微信登录
  async login() {
    return auth.wxLogin()
  },

  // 获取用户信息（需要授权）
  async getUserProfile() {
    return auth.getUserProfile()
  },

  // 检查是否已登录
  isLoggedIn() {
    return auth.isLoggedIn()
  },

  // 获取当前用户
  getCurrentUser() {
    return auth.getCurrentUser()
  },

  // 登出
  logout() {
    auth.logout()
  }
})