/**
 * 输入管理器
 * 处理触摸事件并转换为游戏输入
 */

class InputManager {
  constructor(canvas) {
    this.canvas = canvas
    this.events = []
    this.touchStart = null
    this.touchEnd = null

    this.bindEvents()
  }

  /**
   * 绑定触摸事件
   */
  bindEvents() {
    wx.onTouchStart((e) => {
      const touch = e.touches[0]
      this.touchStart = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now()
      }
    })

    wx.onTouchEnd((e) => {
      const touch = e.changedTouches[0]
      this.touchEnd = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now()
      }

      // 判断是否为点击（非滑动）
      const dx = Math.abs(this.touchEnd.x - this.touchStart.x)
      const dy = Math.abs(this.touchEnd.y - this.touchStart.y)
      const dt = this.touchEnd.timestamp - this.touchStart.timestamp

      if (dx < 10 && dy < 10 && dt < 300) {
        // 这是一个点击事件
        this.events.push({
          type: 'tap',
          x: this.touchEnd.x,
          y: this.touchEnd.y
        })
      }
    })

    // 长按
    wx.onTouchStart((e) => {
      this.longPressTimer = setTimeout(() => {
        const touch = e.touches[0]
        this.events.push({
          type: 'longpress',
          x: touch.clientX,
          y: touch.clientY
        })
      }, 500)
    })

    wx.onTouchEnd(() => {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer)
        this.longPressTimer = null
      }
    })
  }

  /**
   * 获取并清空事件队列
   * @returns {Array} 事件数组
   */
  getEvents() {
    const events = [...this.events]
    this.events = []
    return events
  }

  /**
   * 检测点击是否在矩形区域内
   * @param {object} event - 事件对象
   * @param {number} x - 矩形左上角 x
   * @param {number} y - 矩形左上角 y
   * @param {number} w - 矩形宽度
   * @param {number} h - 矩形高度
   * @returns {boolean}
   */
  hitTest(event, x, y, w, h) {
    return event.x >= x && event.x <= x + w && event.y >= y && event.y <= y + h
  }
}

module.exports = InputManager