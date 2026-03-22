// rules.js - 游戏规则页面
const storage = require('../../utils/storage')

Page({
  onLoad() {
    // 标记新手引导完成
    storage.markGuideCompleted()
  },

  goBack() {
    wx.navigateBack()
  }
})