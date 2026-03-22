// app.js - 数字对决 Pro 微信小程序入口
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
      wsServer: 'wss://your-server.com'
    }
  },

  onLaunch() {
    // 检查登录状态
    this.checkLoginStatus();
    // 加载用户设置
    this.loadSettings();
    // 检查更新
    this.checkUpdate();
  },

  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    const openid = wx.getStorageSync('openid');
    if (token && openid) {
      this.globalData.token = token;
      this.globalData.openid = openid;
    }
  },

  loadSettings() {
    try {
      const settings = wx.getStorageSync('settings');
      if (settings) {
        this.globalData.settings = { ...this.globalData.settings, ...settings };
      }
    } catch (e) {
      console.error('加载设置失败:', e);
    }
  },

  saveSettings(settings) {
    this.globalData.settings = { ...this.globalData.settings, ...settings };
    wx.setStorageSync('settings', this.globalData.settings);
  },

  checkUpdate() {
    const updateManager = wx.getUpdateManager();
    updateManager.onUpdateReady(() => {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success: (res) => {
          if (res.confirm) {
            updateManager.applyUpdate();
          }
        }
      });
    });
  },

  // 微信登录
  async login() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            // 发送 code 到服务器换取 openid 和 token
            this.loginWithCode(res.code).then(resolve).catch(reject);
          } else {
            reject(new Error('wx.login 失败'));
          }
        },
        fail: reject
      });
    });
  },

  async loginWithCode(code) {
    // TODO: 调用后端接口换取 token
    // 临时方案：直接返回
    return { code };
  },

  // 检查是否已登录
  isLoggedIn() {
    return !!this.globalData.token && !!this.globalData.openid;
  },

  // 登出
  logout() {
    this.globalData.token = null;
    this.globalData.openid = null;
    this.globalData.userInfo = null;
    wx.removeStorageSync('token');
    wx.removeStorageSync('openid');
  }
});