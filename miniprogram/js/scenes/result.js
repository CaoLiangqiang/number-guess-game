/**
 * 结果场景
 * 支持成功/失败反馈动画
 */

class ResultScene {
  constructor() {
    this.sceneManager = null
    this.isWin = false
    this.secretNumber = ''
    this.turns = 0
    this.duration = 0
    this.mode = 'ai'
    this.elements = {}

    // 动画状态
    this.animTime = 0
    this.titleScale = 0
    this.digitRevealed = 0
    this.stars = []
    this.shakeOffset = 0

    // 振动反馈状态
    this.vibrationPlayed = false
    this.lastDigitVibrated = 0
  }

  onEnter(params = {}) {
    this.isWin = params.isWin
    this.secretNumber = params.secretNumber
    this.turns = params.turns
    this.duration = params.duration
    this.mode = params.mode || 'ai'
    this.calculateLayout()
    this.initAnimation()
  }

  onExit() {}

  /**
   * 初始化动画状态
   */
  initAnimation() {
    this.animTime = 0
    this.titleScale = 0
    this.digitRevealed = 0
    this.shakeOffset = 0
    this.vibrationPlayed = false
    this.lastDigitVibrated = 0

    // 初始化星星（成功时）
    if (this.isWin) {
      this.stars = []
      for (let i = 0; i < 12; i++) {
        this.stars.push({
          x: Math.random() * 375,
          y: Math.random() * 200 + 50,
          size: Math.random() * 8 + 4,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.003 + 0.002
        })
      }
    } else {
      this.stars = []
    }

    // 播放初始振动反馈
    this.playInitialFeedback()
  }

  /**
   * 播放初始反馈（进入场景时）
   */
  playInitialFeedback() {
    const game = globalThis.getGame()

    if (this.isWin) {
      // 根据回合数调整振动强度
      const intensity = this.getVibrationIntensity()
      const pattern = this.getVictoryPattern(intensity)

      // 播放胜利振动模式
      pattern.forEach((delay, index) => {
        setTimeout(() => {
          game.audioManager.vibrate('short')
        }, delay)
      })
    } else {
      // 失败：播放一个长振动
      game.audioManager.vibrate('long')
    }
  }

  /**
   * 根据回合数计算振动强度等级
   * @returns {number} 1-3, 越小越强烈
   */
  getVibrationIntensity() {
    // 根据难度调整阈值
    const difficulty = this.secretNumber.length
    const excellent = difficulty      // 优秀（4位难度: 4回合内）
    const good = difficulty * 2       // 良好（4位难度: 8回合内）
    const normal = difficulty * 3     // 一般（4位难度: 12回合内）

    if (this.turns <= excellent) {
      return 1  // 强烈
    } else if (this.turns <= good) {
      return 2  // 中等
    } else {
      return 3  // 轻柔
    }
  }

  /**
   * 获取胜利振动模式
   * @param {number} intensity - 强度等级 1-3
   * @returns {number[]} 振动延迟数组
   */
  getVictoryPattern(intensity) {
    switch (intensity) {
      case 1:
        // 强烈：快速连振 5 次
        return [0, 60, 120, 180, 240]
      case 2:
        // 中等：连振 4 次
        return [0, 100, 200, 300]
      case 3:
      default:
        // 轻柔：连振 3 次
        return [0, 150, 300]
    }
  }

  /**
   * 播放完成反馈（所有数字显示完成后）
   */
  playCompletionFeedback() {
    const game = globalThis.getGame()

    if (this.isWin) {
      // 根据回合数调整振动强度
      const intensity = this.getVibrationIntensity()

      // 根据强度播放不同模式
      if (intensity === 1) {
        // 强烈：连续快速振动
        setTimeout(() => game.audioManager.vibrate('short'), 0)
        setTimeout(() => game.audioManager.vibrate('short'), 50)
        setTimeout(() => game.audioManager.vibrate('short'), 100)
        setTimeout(() => game.audioManager.vibrate('short'), 150)
        setTimeout(() => game.audioManager.vibrate('short'), 200)
      } else if (intensity === 2) {
        // 中等：标准振动
        setTimeout(() => game.audioManager.vibrate('short'), 0)
        setTimeout(() => game.audioManager.vibrate('short'), 80)
        setTimeout(() => game.audioManager.vibrate('short'), 160)
        setTimeout(() => game.audioManager.vibrate('short'), 240)
      } else {
        // 轻柔：少量振动
        setTimeout(() => game.audioManager.vibrate('short'), 0)
        setTimeout(() => game.audioManager.vibrate('short'), 120)
        setTimeout(() => game.audioManager.vibrate('short'), 240)
      }
    }
    // 失败不需要额外反馈
  }

  calculateLayout() {
    const game = globalThis.getGame()
    const { width, height } = game.renderer
    const centerX = width / 2
    const btnWidth = 100
    const btnHeight = 40
    const btnGap = 12

    this.elements = {
      title: { x: centerX, y: 120 },
      secret: { x: centerX, y: 200 },
      stats: { y: 280 },
      // 三个按钮：返回首页、分享、再来一局
      homeBtn: { x: centerX - btnWidth * 1.5 - btnGap, y: height - 100, w: btnWidth, h: btnHeight, text: '首页' },
      shareBtn: { x: centerX - btnWidth / 2, y: height - 100, w: btnWidth, h: btnHeight, text: '分享' },
      retryBtn: { x: centerX + btnWidth / 2 + btnGap, y: height - 100, w: btnWidth, h: btnHeight, text: '再来一局' }
    }
  }

  update(deltaTime) {
    this.animTime += deltaTime

    // 标题缩放动画（弹性效果）
    if (this.titleScale < 1) {
      this.titleScale += deltaTime * 0.004
      if (this.titleScale > 1) this.titleScale = 1
      // 弹性回弹
      if (this.titleScale > 1) {
        const overshoot = this.titleScale - 1
        this.titleScale = 1 - overshoot * 0.3
      }
    }

    // 数字依次显示
    if (this.digitRevealed < this.secretNumber.length) {
      this.digitRevealed += deltaTime * 0.002
      if (this.digitRevealed > this.secretNumber.length) {
        this.digitRevealed = this.secretNumber.length
      }

      // 每显示一个新数字时播放振动
      const currentDigit = Math.floor(this.digitRevealed)
      if (currentDigit > this.lastDigitVibrated && currentDigit <= this.secretNumber.length) {
        this.lastDigitVibrated = currentDigit
        const game = globalThis.getGame()
        game.audioManager.vibrate('short')
      }
    }

    // 所有数字显示完成后播放结束反馈（仅一次）
    if (this.digitRevealed >= this.secretNumber.length && !this.vibrationPlayed) {
      this.vibrationPlayed = true
      this.playCompletionFeedback()
    }

    // 失败时的摇晃效果
    if (!this.isWin && this.animTime < 500) {
      this.shakeOffset = Math.sin(this.animTime * 0.02) * Math.max(0, 5 - this.animTime * 0.01)
    } else {
      this.shakeOffset = 0
    }

    // 更新星星动画
    this.stars.forEach(star => {
      star.phase += star.speed * deltaTime
    })
  }

  render(renderer) {
    const game = globalThis.getGame()
    const theme = renderer.currentTheme
    const { width, height } = renderer

    renderer.drawGradientBackground()

    // 成功时渲染星星
    if (this.isWin) {
      this.renderStars(renderer)
    }

    // 标题（带缩放和摇晃效果）
    this.renderTitle(renderer)

    // 答案卡片
    this.renderSecretCard(renderer)

    // 统计
    this.renderStats(renderer)

    // 按钮
    renderer.drawButton(this.elements.homeBtn.x, this.elements.homeBtn.y, this.elements.homeBtn.w, this.elements.homeBtn.h, this.elements.homeBtn.text, { radius: 10, fontSize: 14 })
    renderer.drawButton(this.elements.shareBtn.x, this.elements.shareBtn.y, this.elements.shareBtn.w, this.elements.shareBtn.h, this.elements.shareBtn.text, { radius: 10, fontSize: 14 })
    renderer.drawButton(this.elements.retryBtn.x, this.elements.retryBtn.y, this.elements.retryBtn.w, this.elements.retryBtn.h, this.elements.retryBtn.text, { type: 'primary', radius: 10, fontSize: 14 })
  }

  /**
   * 渲染星星效果
   */
  renderStars(renderer) {
    const theme = renderer.currentTheme

    this.stars.forEach(star => {
      const alpha = 0.5 + Math.sin(star.phase) * 0.5
      const size = star.size * (0.8 + Math.sin(star.phase * 2) * 0.2)

      // 绘制星星（简单的四角星）
      const x = star.x
      const y = star.y

      renderer.drawRect(x - size / 2, y - 1, size, 2, { fill: `rgba(251, 191, 36, ${alpha})` })
      renderer.drawRect(x - 1, y - size / 2, 2, size, { fill: `rgba(251, 191, 36, ${alpha})` })
    })
  }

  /**
   * 渲染标题（带动画）
   */
  renderTitle(renderer) {
    const theme = renderer.currentTheme
    const { title } = this.elements

    // 应用缩放和摇晃
    const scale = this.easeOutBack(this.titleScale)
    const shakeX = this.shakeOffset

    const titleText = this.isWin ? '恭喜获胜！' : 'AI 获胜'
    const color = this.isWin ? theme.success : theme.error

    // 绘制标题（使用缩放效果）
    const fontSize = Math.round(32 * scale)
    if (fontSize > 0) {
      renderer.drawText(titleText, title.x + shakeX, title.y, {
        fontSize,
        color,
        align: 'center',
        baseline: 'middle',
        bold: true
      })

      // 成功时添加光芒效果
      if (this.isWin && scale > 0.8) {
        const glowAlpha = (scale - 0.8) * 2
        renderer.drawText(titleText, title.x + shakeX, title.y, {
          fontSize,
          color: `rgba(16, 185, 129, ${glowAlpha * 0.3})`,
          align: 'center',
          baseline: 'middle',
          bold: true
        })
      }
    }
  }

  /**
   * 渲染答案卡片
   */
  renderSecretCard(renderer) {
    const game = globalThis.getGame()
    const theme = renderer.currentTheme
    const { width } = renderer

    // 卡片背景
    renderer.drawRect(32, 160, width - 64, 100, { fill: theme.bgSecondary, radius: 16 })
    renderer.drawText('答案', width / 2, 180, { fontSize: 14, color: theme.textSecondary, align: 'center' })

    // 数字格子依次显示
    const digitSize = 40
    const gap = 8
    const totalWidth = this.secretNumber.length * digitSize + (this.secretNumber.length - 1) * gap
    const startX = width / 2 - totalWidth / 2

    for (let i = 0; i < this.secretNumber.length; i++) {
      const x = startX + i * (digitSize + gap)
      const y = 205
      const revealed = i < Math.floor(this.digitRevealed)

      // 格子背景
      let bgColor = theme.bgCard
      if (revealed) {
        bgColor = this.isWin ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'
      }

      renderer.drawRect(x, y, digitSize, digitSize, {
        fill: bgColor,
        radius: 8,
        stroke: revealed ? (this.isWin ? theme.success : theme.error) : theme.border,
        strokeWidth: revealed ? 2 : 1
      })

      // 数字
      if (revealed) {
        renderer.drawText(this.secretNumber[i], x + digitSize / 2, y + digitSize / 2, {
          fontSize: 24,
          color: this.isWin ? theme.success : theme.error,
          align: 'center',
          baseline: 'middle',
          bold: true
        })
      }
    }
  }

  /**
   * 渲染统计数据
   */
  renderStats(renderer) {
    const game = globalThis.getGame()
    const theme = renderer.currentTheme
    const { width } = renderer
    const statsY = this.elements.stats.y

    renderer.drawRect(32, statsY, width - 64, 120, { fill: theme.bgSecondary, radius: 16 })

    renderer.drawText('回合数', 60, statsY + 24, { fontSize: 14, color: theme.textSecondary })
    renderer.drawText(String(this.turns), 60, statsY + 52, { fontSize: 24, color: theme.textPrimary, bold: true })

    renderer.drawText('用时', width / 2, statsY + 24, { fontSize: 14, color: theme.textSecondary, align: 'center' })
    renderer.drawText(game.core.formatTime(this.duration), width / 2, statsY + 52, { fontSize: 24, color: theme.textPrimary, align: 'center', bold: true })

    renderer.drawText('模式', width - 60, statsY + 24, { fontSize: 14, color: theme.textSecondary, align: 'right' })
    renderer.drawText(this.mode === 'ai' ? 'AI对战' : '每日挑战', width - 60, statsY + 52, { fontSize: 24, color: theme.textPrimary, align: 'right', bold: true })
  }

  /**
   * 缓动函数：easeOutBack（弹性效果）
   */
  easeOutBack(t) {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  }

  handleInput(events) {
    const game = globalThis.getGame()

    events.forEach(event => {
      if (event.type !== 'tap') return

      if (game.inputManager.hitTest(event, this.elements.homeBtn.x, this.elements.homeBtn.y, this.elements.homeBtn.w, this.elements.homeBtn.h)) {
        game.audioManager.vibrate('short')
        this.sceneManager.switchTo('menu')
      }

      if (game.inputManager.hitTest(event, this.elements.shareBtn.x, this.elements.shareBtn.y, this.elements.shareBtn.w, this.elements.shareBtn.h)) {
        game.audioManager.vibrate('short')
        this.shareResult()
      }

      if (game.inputManager.hitTest(event, this.elements.retryBtn.x, this.elements.retryBtn.y, this.elements.retryBtn.w, this.elements.retryBtn.h)) {
        game.audioManager.vibrate('short')
        this.sceneManager.switchTo('game', { mode: this.mode })
      }
    })
  }

  /**
   * 分享战绩
   */
  shareResult() {
    const game = globalThis.getGame()
    const resultText = this.isWin ? '获胜' : '挑战失败'
    const turnsText = `${this.turns}回合`
    const timeText = game.core.formatTime(this.duration)
    const modeText = this.mode === 'ai' ? 'AI对战' : '每日挑战'

    // 生成分享图片
    this.generateShareImage((imagePath) => {
      if (imagePath) {
        // 使用生成的图片分享
        wx.shareAppMessage({
          title: `我在数字对决Pro${resultText}了！${turnsText}破解答案，用时${timeText}`,
          path: '/pages/index/index',
          imageUrl: imagePath,
          success: () => {
            wx.showToast({ title: '分享成功', icon: 'success' })
          },
          fail: () => {
            wx.showToast({ title: '分享取消', icon: 'none' })
          }
        })
      } else {
        // 回退到默认分享
        wx.shareAppMessage({
          title: `我在数字对决Pro${resultText}了！${turnsText}破解答案，用时${timeText}`,
          path: '/pages/index/index',
          imageUrl: 'assets/images/share.png',
          success: () => {
            wx.showToast({ title: '分享成功', icon: 'success' })
          },
          fail: () => {
            wx.showToast({ title: '分享取消', icon: 'none' })
          }
        })
      }
    })
  }

  /**
   * 生成分享图片
   * @param {Function} callback - 回调函数，参数为图片路径
   */
  generateShareImage(callback) {
    try {
      // 创建离屏 Canvas
      const canvas = wx.createOffscreenCanvas({
        type: '2d',
        width: 375,
        height: 300
      })
      const ctx = canvas.getContext('2d')

      // 绘制背景
      const gradient = ctx.createLinearGradient(0, 0, 0, 300)
      gradient.addColorStop(0, '#1e293b')
      gradient.addColorStop(1, '#0f172a')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 375, 300)

      // 绘制标题
      ctx.fillStyle = '#f1f5f9'
      ctx.font = 'bold 24px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('数字对决 Pro', 187.5, 40)

      // 绘制结果
      const resultText = this.isWin ? '恭喜获胜！' : 'AI 获胜'
      ctx.fillStyle = this.isWin ? '#10b981' : '#ef4444'
      ctx.font = 'bold 28px sans-serif'
      ctx.fillText(resultText, 187.5, 90)

      // 绘制答案
      ctx.fillStyle = '#94a3b8'
      ctx.font = '14px sans-serif'
      ctx.fillText('答案', 187.5, 130)

      // 绘制数字格子
      const digitSize = 36
      const gap = 6
      const totalWidth = this.secretNumber.length * digitSize + (this.secretNumber.length - 1) * gap
      const startX = 187.5 - totalWidth / 2

      for (let i = 0; i < this.secretNumber.length; i++) {
        const x = startX + i * (digitSize + gap)
        const y = 145

        // 格子背景
        ctx.fillStyle = this.isWin ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'
        ctx.beginPath()
        ctx.roundRect(x, y, digitSize, digitSize, 6)
        ctx.fill()

        // 边框
        ctx.strokeStyle = this.isWin ? '#10b981' : '#ef4444'
        ctx.lineWidth = 2
        ctx.stroke()

        // 数字
        ctx.fillStyle = this.isWin ? '#10b981' : '#ef4444'
        ctx.font = 'bold 20px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(this.secretNumber[i], x + digitSize / 2, y + digitSize / 2)
      }

      // 绘制统计信息
      ctx.textBaseline = 'alphabetic'
      const statsY = 210

      // 回合数
      ctx.fillStyle = '#64748b'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('回合数', 60, statsY)
      ctx.fillStyle = '#f1f5f9'
      ctx.font = 'bold 20px sans-serif'
      ctx.fillText(String(this.turns), 60, statsY + 24)

      // 用时
      ctx.fillStyle = '#64748b'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('用时', 187.5, statsY)
      ctx.fillStyle = '#f1f5f9'
      ctx.font = 'bold 20px sans-serif'
      const game = globalThis.getGame()
      ctx.fillText(game.core.formatTime(this.duration), 187.5, statsY + 24)

      // 模式
      ctx.fillStyle = '#64748b'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText('模式', 315, statsY)
      ctx.fillStyle = '#f1f5f9'
      ctx.font = 'bold 20px sans-serif'
      ctx.fillText(this.mode === 'ai' ? 'AI对战' : '每日挑战', 315, statsY + 24)

      // 绘制底部提示
      ctx.fillStyle = '#64748b'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('扫码体验数字对决 Pro', 187.5, 280)

      // 保存图片
      const fs = wx.getFileSystemManager()
      const imagePath = `${wx.env.USER_DATA_PATH}/share_${Date.now()}.png`

      wx.canvasToTempFilePath({
        canvas: canvas,
        destWidth: 750,
        destHeight: 600,
        success: (res) => {
          callback(res.tempFilePath)
        },
        fail: (err) => {
          console.error('[Share] Generate image failed:', err)
          callback(null)
        }
      })
    } catch (err) {
      console.error('[Share] Generate image error:', err)
      callback(null)
    }
  }
}

module.exports = ResultScene