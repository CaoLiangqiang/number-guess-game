// error.js - 错误页面
Page({
  data: {
    icon: '😕',
    title: '出错了',
    message: '请稍后重试',
    canRetry: false
  },

  onLoad(options) {
    const { type, message } = options

    let icon = '😕'
    let title = '出错了'
    let msg = message || '请稍后重试'
    let canRetry = false

    switch (type) {
      case 'network':
        icon = '📡'
        title = '网络错误'
        msg = '网络连接失败，请检查网络设置'
        canRetry = true
        break
      case 'room':
        icon = '🚪'
        title = '房间不存在'
        msg = '该房间已关闭或不存在'
        break
      case 'game':
        icon = '🎮'
        title = '游戏已结束'
        msg = '该游戏已经结束'
        break
    }

    this.setData({ icon, title, message: msg, canRetry })
  },

  retry() {
    // 尝试重新加载上一页
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
    } else {
      wx.switchTab({
        url: '/pages/index/index'
      })
    }
  },

  goHome() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})