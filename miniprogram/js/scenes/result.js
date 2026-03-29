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
    this.difficulty = 4
    this.isRecordBroken = false
    this.isNewBestTurns = false
    this.isNewBestDuration = false
    this.badges = []  // 获得的徽章数组
    this.elements = {}
    this.safeArea = null

    // 动画状态
    this.animTime = 0
    this.titleScale = 0
    this.digitRevealed = 0
    this.stars = []
    this.shakeOffset = 0
    this.recordFlashTime = 0
    this.badgeAnimTime = 0  // 徽章动画计时器

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
    this.difficulty = this.secretNumber.length
    this.dailyDate = params.dailyDate || null
    this.isRecordBroken = params.isRecordBroken || false
    this.isNewBestTurns = params.isNewBestTurns || false
    this.isNewBestDuration = params.isNewBestDuration || false

    // 收集所有获得的徽章
    this.badges = this.collectBadges()

    this.calculateLayout()
    this.initAnimation()

    // 播放徽章音效（获得徽章时）
    if (this.badges.length > 0) {
      const game = globalThis.getGame()
      game.audioManager.playBadge()
    }
  }

  /**
   * 收集所有获得的徽章
   * @returns {Array} 徽章数组
   */
  collectBadges() {
    const badges = []

    // 闪电通关
    if (this.checkLightningWin()) {
      badges.push({ text: '⚡ 闪电通关', color: '#fbbf24' })
    }

    // 连胜徽章
    const streakBadge = this.checkStreakBadge()
    if (streakBadge) {
      badges.push({ text: streakBadge.text, color: streakBadge.color })
    }

    // 首次胜利
    if (this.checkFirstWin()) {
      badges.push({ text: '🎉 首次胜利', color: '#10b981' })
    }

    // 速度之星
    const speedBadge = this.checkSpeedStar()
    if (speedBadge) {
      badges.push({ text: speedBadge.text, color: speedBadge.color })
    }

    // 完美通关
    const perfectBadge = this.checkPerfectWin()
    if (perfectBadge) {
      badges.push({ text: perfectBadge.text, color: perfectBadge.color })
    }

    return badges
  }

  /**
   * 检查是否获得闪电通关徽章
   * @returns {boolean}
   */
  checkLightningWin() {
    if (!this.isWin) return false

    // 闪电通关阈值：3位难度≤3回合，4位难度≤5回合，5位难度≤7回合
    const thresholds = { 3: 3, 4: 5, 5: 7 }
    const threshold = thresholds[this.difficulty] || 7
    return this.turns <= threshold
  }

  /**
   * 检查连胜徽章等级
   * @returns {object|null} { level, text, color }
   */
  checkStreakBadge() {
    if (!this.isWin) return null

    const game = globalThis.getGame()
    const stats = game.storageManager.getStats()
    const streak = stats.winStreak || 0

    // 连胜里程碑：3连胜、5连胜、10连胜
    if (streak >= 10) {
      return { level: 10, text: '🏆 十连胜达人', color: '#fbbf24' }
    } else if (streak >= 5) {
      return { level: 5, text: '🔥 五连胜', color: '#f97316' }
    } else if (streak >= 3) {
      return { level: 3, text: '🔥 三连胜', color: '#ef4444' }
    }
    return null
  }

  /**
   * 检查是否首次胜利
   * @returns {boolean}
   */
  checkFirstWin() {
    if (!this.isWin) return false

    const game = globalThis.getGame()
    const stats = game.storageManager.getStats()
    // 只有1场胜利且是当前这场
    return stats.wins === 1
  }

  /**
   * 检查速度之星徽章
   * @returns {object|null} { text, color }
   */
  checkSpeedStar() {
    if (!this.isWin) return null

    // 速度之星阈值（秒）：3位30秒，4位45秒，5位60秒
    const thresholds = { 3: 30, 4: 45, 5: 60 }
    const threshold = thresholds[this.difficulty] || 60

    if (this.duration <= threshold) {
      return { text: '⏱️ 速度之星', color: '#06b6d4' }
    }
    return null
  }

  /**
   * 检查完美通关徽章（理论最优回合数）
   * @returns {object|null} { text, color }
   */
  checkPerfectWin() {
    if (!this.isWin) return null

    // 理论最优回合数：3位最少2回合，4位最少1回合（运气好），5位最少1回合
    // 实际设置为较难达到的阈值
    const perfectThresholds = { 3: 2, 4: 3, 5: 4 }
    const threshold = perfectThresholds[this.difficulty] || 4

    if (this.turns <= threshold) {
      return { text: '💎 完美通关', color: '#a855f7' }
    }
    return null
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
    this.badgeAnimTime = 0

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

    // 获取安全区域
    const systemInfo = wx.getSystemInfoSync()
    this.safeArea = systemInfo.safeArea || { top: 0, bottom: height, left: 0, right: width }

    const safeTop = this.safeArea.top
    const safeBottom = this.safeArea.bottom
    const safeLeft = this.safeArea.left
    const safeRight = this.safeArea.right
    const safeWidth = safeRight - safeLeft
    const centerX = (safeLeft + safeRight) / 2

    const btnWidth = Math.min(100, (safeWidth - 48) / 3)
    const btnHeight = 40
    const btnGap = 8

    this.elements = {
      title: { x: centerX, y: safeTop + 50 },
      secret: { x: centerX, y: safeTop + 130 },
      stats: { y: safeTop + 200 },
      // 三个按钮：返回首页、分享、再来一局
      homeBtn: { x: centerX - btnWidth * 1.5 - btnGap, y: safeBottom - 70, w: btnWidth, h: btnHeight, text: '🏠 首页' },
      shareBtn: { x: centerX - btnWidth / 2, y: safeBottom - 70, w: btnWidth, h: btnHeight, text: '📤 分享' },
      retryBtn: { x: centerX + btnWidth / 2 + btnGap, y: safeBottom - 70, w: btnWidth, h: btnHeight, text: '🔄 再来一局' }
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

    // 打破记录时的闪烁动画
    if (this.isRecordBroken) {
      this.recordFlashTime += deltaTime * 0.005
    }

    // 更新星星动画
    this.stars.forEach(star => {
      star.phase += star.speed * deltaTime
    })

    // 更新徽章动画
    if (this.badges.length > 0) {
      this.badgeAnimTime += deltaTime * 0.003
    }
  }

  render(renderer) {
    const game = globalThis.getGame()
    const theme = renderer.currentTheme
    const { width, height } = renderer

    // 获取安全区域
    const safeLeft = this.safeArea?.left || 12
    const safeRight = this.safeArea?.right || width - 12
    const safeTop = this.safeArea?.top || 0
    const margin = 12

    renderer.drawGradientBackground()

    // 成功时渲染星星
    if (this.isWin) {
      this.renderStars(renderer)
    }

    // 标题（带缩放和摇晃效果）
    this.renderTitle(renderer)

    // 打破记录提示
    if (this.isRecordBroken) {
      this.renderRecordBanner(renderer)
    }

    // 答案卡片
    this.renderSecretCard(renderer)

    // 统计
    this.renderStats(renderer)

    // 成就徽章区域
    this.renderAchievementBadges(renderer)

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
   * 渲染打破记录横幅
   */
  renderRecordBanner(renderer) {
    const theme = renderer.currentTheme
    const { width } = renderer
    const stats = globalThis.getGame().storageManager.getStats()

    // 闪烁效果
    const flash = Math.sin(this.recordFlashTime * 3) * 0.3 + 0.7
    const bannerY = 155

    // 横幅背景
    renderer.drawRect(24, bannerY, width - 48, 32, {
      fill: `rgba(251, 191, 36, ${flash * 0.3})`,
      radius: 8,
      stroke: `rgba(251, 191, 36, ${flash})`,
      strokeWidth: 2
    })

    // 格式化日期
    const dateStr = stats.maxWinStreakDate ? this.formatStreakDate(stats.maxWinStreakDate) : ''
    const text = dateStr ? `🏆 新纪录！连胜 ${stats.maxWinStreak} 场 (${dateStr})` : `🏆 新纪录！连胜 ${stats.maxWinStreak} 场`

    renderer.drawText(text, width / 2, bannerY + 16, {
      fontSize: 14,
      color: `rgba(251, 191, 36, ${flash})`,
      align: 'center',
      baseline: 'middle',
      bold: true
    })
  }

  /**
   * 格式化连胜记录日期
   * @param {string} isoDate - ISO 日期字符串
   * @returns {string} 格式化的日期
   */
  formatStreakDate(isoDate) {
    try {
      const date = new Date(isoDate)
      const month = date.getMonth() + 1
      const day = date.getDate()
      return `${month}月${day}日`
    } catch (e) {
      return ''
    }
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

    // 根据模式选择标题
    let titleText = ''
    let color = this.isWin ? theme.success : theme.error

    if (this.mode === 'daily' && this.dailyDate) {
      // 每日挑战模式
      titleText = this.isWin ? '🎯 每日挑战完成！' : '💪 再接再厉'
    } else {
      // AI 对战模式
      titleText = this.isWin ? '🎉 恭喜获胜！' : '🤖 AI 获胜'
    }

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

    // 每日挑战模式显示日期
    if (this.mode === 'daily' && this.dailyDate && scale > 0.9) {
      renderer.drawText(`📅 ${this.dailyDate}`, title.x, title.y + 35, {
        fontSize: 14,
        color: theme.textMuted,
        align: 'center',
        baseline: 'middle'
      })
    }
  }

  /**
   * 渲染答案卡片
   */
  renderSecretCard(renderer) {
    const game = globalThis.getGame()
    const theme = renderer.currentTheme
    const { width } = renderer

    // 如果显示记录横幅，卡片下移
    const cardY = this.isRecordBroken ? 195 : 160

    // 卡片背景
    renderer.drawRect(32, cardY, width - 64, 100, { fill: theme.bgSecondary, radius: 16 })
    renderer.drawText('🔑 答案', width / 2, cardY + 20, { fontSize: 14, color: theme.textSecondary, align: 'center' })

    // 数字格子依次显示
    const digitSize = 40
    const gap = 8
    const totalWidth = this.secretNumber.length * digitSize + (this.secretNumber.length - 1) * gap
    const startX = width / 2 - totalWidth / 2

    for (let i = 0; i < this.secretNumber.length; i++) {
      const x = startX + i * (digitSize + gap)
      const y = cardY + 45
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

    // 如果显示记录横幅，统计卡片下移
    const statsY = this.isRecordBroken ? 315 : this.elements.stats.y

    renderer.drawRect(32, statsY, width - 64, 120, { fill: theme.bgSecondary, radius: 16 })

    // 第一行：难度、回合数
    renderer.drawText('🎯 难度', 50, statsY + 24, { fontSize: 12, color: theme.textSecondary })
    renderer.drawText(`${this.secretNumber.length}位`, 50, statsY + 48, { fontSize: 20, color: theme.textPrimary, bold: true })

    renderer.drawText('🔄 回合数', width / 2, statsY + 24, { fontSize: 12, color: theme.textSecondary, align: 'center' })
    renderer.drawText(String(this.turns), width / 2, statsY + 48, { fontSize: 20, color: theme.textPrimary, align: 'center', bold: true })

    // 新最佳回合数标记或与最佳差距
    if (this.isWin) {
      const bestTurns = game.storageManager.getBestTurns(this.secretNumber.length)
      if (this.isNewBestTurns) {
        // 显示新最佳标记和日期
        const today = new Date()
        const dateStr = `${today.getMonth() + 1}/${today.getDate()}`
        renderer.drawText(`🎉 新最佳 (${dateStr})`, width / 2 + 35, statsY + 48, {
          fontSize: 11,
          color: theme.success,
          align: 'left',
          baseline: 'middle'
        })
      } else if (bestTurns !== null) {
        const diff = this.turns - bestTurns
        if (diff > 0) {
          renderer.drawText(`差${diff}回合平最佳`, width / 2 + 35, statsY + 48, {
            fontSize: 11,
            color: theme.textMuted,
            align: 'left',
            baseline: 'middle'
          })
        }
      }
    }

    renderer.drawText('⏱️ 用时', width - 50, statsY + 24, { fontSize: 12, color: theme.textSecondary, align: 'right' })
    renderer.drawText(game.core.formatTime(this.duration), width - 50, statsY + 48, { fontSize: 20, color: theme.textPrimary, align: 'right', bold: true })

    // 最佳用时标记
    if (this.isWin && this.isNewBestDuration) {
      const today = new Date()
      const dateStr = `${today.getMonth() + 1}/${today.getDate()}`
      renderer.drawText(`🎉 新最佳 (${dateStr})`, width - 115, statsY + 48, {
        fontSize: 11,
        color: theme.success,
        align: 'right',
        baseline: 'middle'
      })
    }

    // 用时与平均对比（胜利时显示）
    if (this.isWin) {
      const avgDuration = game.storageManager.getAverageDuration(this.secretNumber.length)
      if (avgDuration !== null) {
        const diff = this.duration - avgDuration
        let compareText = ''
        let compareColor = theme.textMuted
        if (diff < 0) {
          const faster = Math.abs(diff)
          const fasterMin = Math.floor(faster / 60)
          const fasterSec = faster % 60
          compareText = fasterMin > 0 ? `快${fasterMin}分${fasterSec}秒` : `快${fasterSec}秒`
          compareColor = theme.success
        } else if (diff > 0) {
          const slower = diff
          const slowerMin = Math.floor(slower / 60)
          const slowerSec = slower % 60
          compareText = slowerMin > 0 ? `慢${slowerMin}分${slowerSec}秒` : `慢${slowerSec}秒`
          compareColor = theme.textMuted
        } else {
          compareText = '持平'
          compareColor = theme.textMuted
        }
        renderer.drawText(compareText, width - 50, statsY + 68, {
          fontSize: 11,
          color: compareColor,
          align: 'right'
        })
      }
    }

    // 第二行：模式
    renderer.drawText('🎮 模式', width / 2, statsY + 85, { fontSize: 12, color: theme.textSecondary, align: 'center' })
    const modeText = this.mode === 'ai' ? '🤖 AI对战' : '🎯 每日挑战'
    renderer.drawText(modeText, width / 2, statsY + 105, { fontSize: 14, color: theme.accent, align: 'center' })
  }

  /**
   * 渲染成就徽章区域
   */
  renderAchievementBadges(renderer) {
    // 使用预收集的徽章
    if (this.badges.length === 0) return

    const theme = renderer.currentTheme
    const { width } = renderer

    // 计算徽章位置（统计卡片下方）
    const statsY = this.isRecordBroken ? 315 : this.elements.stats.y
    const badgeHeight = 36
    const badgeGap = 8

    // 徽章动画效果
    const pulse = Math.sin(this.badgeAnimTime) * 0.1 + 0.9
    const glow = Math.sin(this.badgeAnimTime * 2) * 0.3 + 0.7

    // 渲染每个徽章
    this.badges.forEach((badge, index) => {
      const badgeY = statsY + 135 + index * (badgeHeight + badgeGap)
      const badgeWidth = badge.text.length > 6 ? 150 : 120
      const badgeX = width / 2 - badgeWidth / 2

      // 发光层
      renderer.drawGlow(badgeX, badgeY, badgeWidth, badgeHeight, badge.color, glow * 0.3, 12, 18)

      // 徽章背景
      renderer.drawRect(badgeX, badgeY, badgeWidth, badgeHeight, {
        fill: this.hexToRgba(badge.color, pulse * 0.2),
        radius: 18,
        stroke: this.hexToRgba(badge.color, pulse),
        strokeWidth: 2
      })

      // 徽章文字
      renderer.drawText(badge.text, width / 2, badgeY + badgeHeight / 2, {
        fontSize: 16,
        color: badge.color,
        align: 'center',
        baseline: 'middle',
        bold: true
      })
    })
  }

  /**
   * 十六进制颜色转RGBA
   */
  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
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
    const timeText = game.core.formatTime(this.duration)
    const modeText = this.mode === 'ai' ? 'AI对战' : '每日挑战'

    // 根据表现生成不同的分享文案
    let shareTitle = ''
    if (this.isWin) {
      const difficulty = this.secretNumber.length
      const excellent = difficulty      // 优秀（4位难度: 4回合内）
      const good = difficulty * 2       // 良好（4位难度: 8回合内）

      if (this.turns <= excellent) {
        shareTitle = `🏆 完美！${this.turns}回合破解${difficulty}位数字！用时${timeText}`
      } else if (this.turns <= good) {
        shareTitle = `🎉 出色表现！${this.turns}回合破解答案，用时${timeText}`
      } else {
        shareTitle = `✨ 我在数字对决Pro获胜了！${this.turns}回合，用时${timeText}`
      }
    } else {
      shareTitle = `💪 再接再厉！挑战${this.secretNumber.length}位难度，下次一定赢！`
    }

    // 生成分享图片
    this.generateShareImage((imagePath) => {
      if (imagePath) {
        // 使用生成的图片分享
        wx.shareAppMessage({
          title: shareTitle,
          path: '/pages/index/index',
          imageUrl: imagePath,
          success: () => {
            wx.showToast({ title: '📤 分享成功', icon: 'success' })
          },
          fail: (err) => {
            // 更友好的失败提示
            if (err && err.errMsg && err.errMsg.includes('cancel')) {
              wx.showToast({ title: '📤 分享已取消', icon: 'none' })
            } else {
              wx.showModal({
                title: '分享失败',
                content: '无法完成分享，请稍后重试或检查网络连接',
                showCancel: false,
                confirmText: '知道了'
              })
            }
          }
        })
      } else {
        // 回退到默认分享
        wx.shareAppMessage({
          title: shareTitle,
          path: '/pages/index/index',
          imageUrl: 'assets/images/share.png',
          success: () => {
            wx.showToast({ title: '📤 分享成功', icon: 'success' })
          },
          fail: (err) => {
            // 更友好的失败提示
            if (err && err.errMsg && err.errMsg.includes('cancel')) {
              wx.showToast({ title: '📤 分享已取消', icon: 'none' })
            } else {
              wx.showModal({
                title: '分享失败',
                content: '无法完成分享，请稍后重试或检查网络连接',
                showCancel: false,
                confirmText: '知道了'
              })
            }
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
      ctx.fillText('🎮 数字对决 Pro', 187.5, 40)

      // 绘制结果
      const resultText = this.isWin ? '🎉 恭喜获胜！' : '🤖 AI 获胜'
      ctx.fillStyle = this.isWin ? '#10b981' : '#ef4444'
      ctx.font = 'bold 28px sans-serif'
      ctx.fillText(resultText, 187.5, 90)

      // 绘制答案
      ctx.fillStyle = '#94a3b8'
      ctx.font = '14px sans-serif'
      ctx.fillText('🔑 答案', 187.5, 130)

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
      ctx.fillText('🔄 回合数', 60, statsY)
      ctx.fillStyle = '#f1f5f9'
      ctx.font = 'bold 20px sans-serif'
      ctx.fillText(String(this.turns), 60, statsY + 24)

      // 用时
      ctx.fillStyle = '#64748b'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('⏱️ 用时', 187.5, statsY)
      ctx.fillStyle = '#f1f5f9'
      ctx.font = 'bold 20px sans-serif'
      const game = globalThis.getGame()
      ctx.fillText(game.core.formatTime(this.duration), 187.5, statsY + 24)

      // 模式
      ctx.fillStyle = '#64748b'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText('🎮 模式', 315, statsY)
      ctx.fillStyle = '#f1f5f9'
      ctx.font = 'bold 20px sans-serif'
      ctx.fillText(this.mode === 'ai' ? '🤖 AI对战' : '🎯 每日挑战', 315, statsY + 24)

      // 绘制底部提示
      ctx.fillStyle = '#64748b'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('📱 扫码体验数字对决 Pro', 187.5, 280)

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