// history.js - 游戏历史页面
const storage = require('../../utils/storage')

Page({
  data: {
    history: []
  },

  onLoad() {
    this.loadHistory()
  },

  onShow() {
    this.loadHistory()
  },

  loadHistory() {
    const rawHistory = storage.getGameHistory(50)

    const history = rawHistory.map(item => ({
      ...item,
      dateStr: this.formatDate(item.playedAt)
    }))

    this.setData({ history })
  },

  formatDate(isoString) {
    const date = new Date(isoString)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    return `${month}月${day}日 ${hour}:${minute}`
  },

  goPlay() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})