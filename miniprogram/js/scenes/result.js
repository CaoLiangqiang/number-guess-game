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
      // 胜利：播放庆祝振动模式（三连短振）
      setTimeout(() => game.audioManager.vibrate('short'), 0)
      setTimeout(() => game.audioManager.vibrate('short'), 100)
      setTimeout(() => game.audioManager.vibrate('short'), 200)
    } else {
      // 失败：播放一个长振动
      game.audioManager.vibrate('long')
    }
  }

  /**
   * 播放完成反馈（所有数字显示完成后）
   */
  playCompletionFeedback() {
    const game = globalThis.getGame()

    if (this.isWin) {
      // 胜利完成：再次播放庆祝振动
      setTimeout(() => game.audioManager.vibrate('short'), 0)
      setTimeout(() => game.audioManager.vibrate('short'), 80)
      setTimeout(() => game.audioManager.vibrate('short'), 160)
      setTimeout(() => game.audioManager.vibrate('short'), 240)
    }
    // 失败不需要额外反馈
  }

  calculateLayout() {
    const game = globalThis.getGame()
    const { width, height } = game.renderer
    const centerX = width / 2
    const btnWidth = 160
    const btnHeight = 44

    this.elements = {
      title: { x: centerX, y: 120 },
      secret: { x: centerX, y: 200 },
      stats: { y: 280 },
      homeBtn: { x: centerX - btnWidth - 16, y: height - 120, w: btnWidth, h: btnHeight, text: '返回首页' },
      retryBtn: { x: centerX + 16, y: height - 120, w: btnWidth, h: btnHeight, text: '再来一局' }
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
    renderer.drawButton(this.elements.homeBtn.x, this.elements.homeBtn.y, this.elements.homeBtn.w, this.elements.homeBtn.h, this.elements.homeBtn.text, { radius: 12, fontSize: 16 })
    renderer.drawButton(this.elements.retryBtn.x, this.elements.retryBtn.y, this.elements.retryBtn.w, this.elements.retryBtn.h, this.elements.retryBtn.text, { type: 'primary', radius: 12, fontSize: 16 })
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

      if (game.inputManager.hitTest(event, this.elements.retryBtn.x, this.elements.retryBtn.y, this.elements.retryBtn.w, this.elements.retryBtn.h)) {
        game.audioManager.vibrate('short')
        this.sceneManager.switchTo('game', { mode: this.mode })
      }
    })
  }
}

module.exports = ResultScene