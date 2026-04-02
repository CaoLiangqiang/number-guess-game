/**
 * 游戏场景
 * 核心游戏逻辑：输入、猜测、AI对战
 */

class GameScene {
  constructor() {
    this.sceneManager = null
    this.mode = 'ai'
    this.difficulty = 4
    this.secretNumber = ''
    this.currentInput = ''
    this.history = []
    this.turn = 0
    this.timeElapsed = 0
    this.gameStarted = false
    this.gameOver = false
    this.ai = null
    this.aiThinking = false
    this.aiCandidateCount = 0
    this.aiInitialCandidateCount = 0  // 初始候选数量（用于计算进度）
    this.aiGuess = ''
    this.aiThinkingAnimTime = 0  // AI 思考动画计时器
    this.aiThinkingTickTimer = null  // AI 思考振动提示定时器
    this.elements = {}
    this.timer = 0
    this.pressedKey = null
    this.pressedItem = null  // 用于对话框按钮按下状态

    // 波纹效果
    this.ripples = []

    // 颜色过渡动画
    this.currentColor = { r: 99, g: 102, b: 241 }  // 默认主题色 #6366f1
    this.targetColor = { r: 99, g: 102, b: 241 }
    this.colorTransitionSpeed = 0.05  // 每帧过渡比例

    // AI 速度切换提示
    this.speedChangeToast = null  // { text, alpha, duration }

    // 难度切换提示
    this.difficultyChangeToast = null  // { text, alpha, duration }

    // 难度切换确认对话框
    this.showDifficultyConfirm = false
    this.pendingDifficulty = null
    this.skipDifficultyConfirmChecked = false  // "不再提示"复选框状态

    // 游戏内帮助弹窗
    this.showHelpDialog = false
    this.helpDialogSlideOffset = 0  // 滑动偏移量
    this.helpDialogSpringVelocity = 0  // 弹性动画速度

    // 游戏暂停
    this.isPaused = false
    this.showPauseDialog = false

    // 猜测历史滚动支持
    this.historyScrollOffset = 0
    this.historyScrollVelocity = 0
    this.historyIsScrolling = false
    this.historyFriction = 0.95
    this.historyBounceStiffness = 0.1
    this.historyItemHeight = 48
    this.historyItemGap = 8

    // 新猜测高亮效果
    this.newGuessHighlightTime = 0  // 高亮动画计时器
    this.newGuessHighlightDuration = 800  // 高亮持续时间 ms

    // 平滑滚动动画
    this.smoothScrollTarget = 0  // 目标滚动位置
    this.smoothScrollStart = 0   // 起始滚动位置
    this.smoothScrollProgress = 1  // 滚动进度 (0-1, 1表示完成)
    this.smoothScrollDuration = 300  // 平滑滚动持续时间 ms

    // 回到顶部按钮
    this.showScrollToTop = false  // 是否显示回到顶部按钮
    this.scrollToTopThreshold = 100  // 滚动超过此值时显示按钮
  }

  onEnter(params = {}) {
    const game = globalThis.getGame()
    this.mode = params.mode || 'ai'
    this.difficulty = game.gameState.settings.difficulty
    this.initGame()
    this.calculateLayout()

    // 首次游戏自动弹出帮助
    if (game.storageManager.isFirstTimePlayer()) {
      this.showHelpDialog = true
      this.helpDialogSlideOffset = 0
      this.helpDialogSpringVelocity = 0
      game.storageManager.setHelpShown()
    }
  }

  onExit() {
    this.stopTimer()
    this.stopAIThinkingTick()
  }

  calculateLayout() {
    const game = globalThis.getGame()
    const { width, height } = game.renderer
    const centerX = width / 2

    // 获取安全区域
    const systemInfo = wx.getSystemInfoSync()
    const safeArea = systemInfo.safeArea || { top: 0, bottom: height, left: 0, right: width }
    const safeTop = safeArea.top
    const safeBottom = safeArea.bottom
    const safeLeft = safeArea.left
    const safeRight = safeArea.right
    const safeWidth = safeRight - safeLeft
    const safeHeight = safeBottom - safeTop

    // 根据安全区域计算布局
    const padding = 16  // 统一内边距
    const digitSize = 48  // 数字格子大小
    const digitGap = 6

    // 布局参数
    const headerHeight = 44
    const aiSectionHeight = 70
    const inputHeight = 70
    const keyboardHeight = 180  // 键盘区域高度（4行）

    // 从安全区域顶部开始布局
    const headerY = safeTop + padding
    const aiSectionY = headerY + headerHeight + 8
    const inputY = safeBottom - keyboardHeight - inputHeight - padding - padding
    const historyY = aiSectionY + aiSectionHeight + padding
    const historyHeight = inputY - historyY - padding
    const keyboardY = safeBottom - keyboardHeight - padding

    this.elements = {
      statusBar: { y: headerY, h: headerHeight },
      aiSection: { y: aiSectionY, h: aiSectionHeight },
      speedBtn: { x: 0, y: 0, w: 60, h: 28 },
      historySection: { y: historyY, h: historyHeight },
      inputSection: { y: inputY },
      digitBoxes: [],
      keyboard: { y: keyboardY, keys: [] },
      safeArea: { top: safeTop, bottom: safeBottom, left: safeLeft, right: safeRight }
    }

    // 数字格子（居中）
    const totalDigitWidth = this.difficulty * digitSize + (this.difficulty - 1) * digitGap
    const startX = centerX - totalDigitWidth / 2
    for (let i = 0; i < this.difficulty; i++) {
      this.elements.digitBoxes.push({
        x: startX + i * (digitSize + digitGap),
        y: this.elements.inputSection.y + 12,
        size: digitSize
      })
    }

    // 键盘（自适应按钮大小，确保在安全区域内）
    const availableWidth = safeWidth - padding * 2
    const keySize = Math.min(48, Math.floor((availableWidth - 6 * 2) / 3))
    const keyGap = 6
    const keyboardRows = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['⌫', '0', '✓']
    ]

    keyboardRows.forEach((row, rowIndex) => {
      const rowWidth = row.length * keySize + (row.length - 1) * keyGap
      const rowStartX = centerX - rowWidth / 2
      row.forEach((key, colIndex) => {
        this.elements.keyboard.keys.push({
          x: rowStartX + colIndex * (keySize + keyGap),
          y: keyboardY + rowIndex * (keySize + keyGap),
          w: keySize, h: keySize,
          label: key, digit: key.length === 1 ? key : null
        })
      })
    })
  }

  initGame() {
    const game = globalThis.getGame()
    const { generateSecretNumber, generateDailySecret, NumberGuessingAI } = game.core

    // 根据模式生成谜题
    if (this.mode === 'daily') {
      // 每日挑战：使用固定谜题
      const dailyData = generateDailySecret(this.difficulty)
      this.secretNumber = dailyData.secret
      this.dailyDate = dailyData.date
      this.ai = null  // 每日挑战无 AI
    } else {
      // AI 对战模式：随机谜题
      this.secretNumber = generateSecretNumber(this.difficulty, true)
      this.dailyDate = null

      if (this.mode === 'ai') {
        this.ai = new NumberGuessingAI(this.difficulty)
        this.aiCandidateCount = this.ai.getPossibleCount()
        this.aiInitialCandidateCount = this.aiCandidateCount  // 保存初始值
      } else {
        this.ai = null
      }
    }

    this.currentInput = ''
    this.history = []
    this.turn = 0
    this.timeElapsed = 0
    this.gameStarted = false
    this.gameOver = false

    this.aiThinking = false
    this.aiThinkingAnimTime = 0
    this.aiGuess = ''
    this.ripples = []

    // 重置颜色过渡状态
    this.currentColor = { r: 99, g: 102, b: 241 }  // 默认主题色 #6366f1
    this.targetColor = { r: 99, g: 102, b: 241 }

    // 重置速度切换提示
    this.speedChangeToast = null

    // 重置难度切换提示
    this.difficultyChangeToast = null

    // 重置确认对话框状态
    this.showDifficultyConfirm = false
    this.pendingDifficulty = null

    // 重置猜测历史滚动状态
    this.historyScrollOffset = 0
    this.historyScrollVelocity = 0
    this.historyIsScrolling = false
    this.newGuessHighlightTime = 0
    this.smoothScrollProgress = 1  // 重置平滑滚动状态
  }

  startTimer() {
    this.timer = setInterval(() => this.timeElapsed++, 1000)
  }

  stopTimer() {
    if (this.timer) { clearInterval(this.timer); this.timer = 0 }
  }

  update(deltaTime) {
    // 更新 AI 思考动画计时器
    if (this.aiThinking) {
      this.aiThinkingAnimTime += deltaTime
    }

    // 更新波纹效果
    this.updateRipples(deltaTime)

    // 更新颜色过渡
    this.updateColorTransition()

    // 更新速度切换提示
    this.updateSpeedChangeToast(deltaTime)

    // 更新难度切换提示
    this.updateDifficultyChangeToast(deltaTime)

    // 更新帮助弹窗弹性动画
    this.updateHelpDialogSpring(deltaTime)

    // 更新猜测历史滚动物理
    this.updateHistoryScrollPhysics(deltaTime)

    // 更新新猜测高亮动画
    if (this.newGuessHighlightTime > 0) {
      this.newGuessHighlightTime -= deltaTime
      if (this.newGuessHighlightTime < 0) {
        this.newGuessHighlightTime = 0
      }
    }

    // 更新平滑滚动动画
    if (this.smoothScrollProgress < 1) {
      this.smoothScrollProgress += deltaTime / this.smoothScrollDuration
      if (this.smoothScrollProgress > 1) {
        this.smoothScrollProgress = 1
        this.historyScrollOffset = this.smoothScrollTarget
      } else {
        // 使用 easeOutQuad 缓动函数
        const t = this.easeOutQuad(this.smoothScrollProgress)
        this.historyScrollOffset = this.smoothScrollStart + (this.smoothScrollTarget - this.smoothScrollStart) * t
      }
    }

    // 更新回到顶部按钮显示状态
    this.showScrollToTop = this.historyScrollOffset > this.scrollToTopThreshold
  }

  /**
   * 缓动函数：easeOutQuad（快到慢）
   */
  easeOutQuad(t) {
    return 1 - (1 - t) * (1 - t)
  }

  /**
   * 更新颜色过渡动画
   */
  updateColorTransition() {
    // 线性插值过渡到目标颜色
    const speed = this.colorTransitionSpeed
    this.currentColor.r += (this.targetColor.r - this.currentColor.r) * speed
    this.currentColor.g += (this.targetColor.g - this.currentColor.g) * speed
    this.currentColor.b += (this.targetColor.b - this.currentColor.b) * speed
  }

  /**
   * 更新速度切换提示动画
   */
  updateSpeedChangeToast(deltaTime) {
    if (this.speedChangeToast) {
      this.speedChangeToast.duration -= deltaTime
      if (this.speedChangeToast.duration <= 0) {
        this.speedChangeToast.alpha -= deltaTime * 0.003
        if (this.speedChangeToast.alpha <= 0) {
          this.speedChangeToast = null
        }
      }
    }
  }

  /**
   * 更新难度切换提示动画
   */
  updateDifficultyChangeToast(deltaTime) {
    if (this.difficultyChangeToast) {
      this.difficultyChangeToast.duration -= deltaTime
      if (this.difficultyChangeToast.duration <= 0) {
        this.difficultyChangeToast.alpha -= deltaTime * 0.003
        if (this.difficultyChangeToast.alpha <= 0) {
          this.difficultyChangeToast = null
        }
      }
    }
  }

  /**
   * 更新帮助弹窗弹性动画
   */
  updateHelpDialogSpring(deltaTime) {
    if (this.showHelpDialog && !this.isScrolling) {
      const dt = deltaTime / 16.67  // 标准化到 60fps
      const stiffness = 0.15  // 弹簧刚度
      const damping = 0.7  // 阻尼系数

      // 弹簧力（向目标位置0拉回）
      const springForce = -this.helpDialogSlideOffset * stiffness

      // 更新速度
      this.helpDialogSpringVelocity += springForce * dt
      this.helpDialogSpringVelocity *= damping

      // 更新位置
      this.helpDialogSlideOffset += this.helpDialogSpringVelocity * dt

      // 如果接近平衡位置，停止动画
      if (Math.abs(this.helpDialogSlideOffset) < 0.5 && Math.abs(this.helpDialogSpringVelocity) < 0.1) {
        this.helpDialogSlideOffset = 0
        this.helpDialogSpringVelocity = 0
      }
    }
  }

  /**
   * 更新猜测历史滚动物理效果
   */
  updateHistoryScrollPhysics(deltaTime) {
    const dt = deltaTime / 16.67  // 标准化到 60fps

    // 计算最大滚动偏移
    const maxScrollOffset = this.getMaxHistoryScrollOffset()

    // 如果正在触摸，不更新物理
    if (this.historyIsScrolling) return

    // 应用惯性滚动
    if (Math.abs(this.historyScrollVelocity) > 0.5) {
      this.historyScrollOffset += this.historyScrollVelocity * dt
      this.historyScrollVelocity *= this.historyFriction

      // 边界检查
      if (this.historyScrollOffset < 0 || this.historyScrollOffset > maxScrollOffset) {
        this.historyScrollVelocity *= 0.5  // 撞墙减速
      }
    } else {
      this.historyScrollVelocity = 0
    }

    // 边界回弹
    if (this.historyScrollOffset < 0) {
      this.historyScrollOffset += (0 - this.historyScrollOffset) * this.historyBounceStiffness * dt
      if (Math.abs(this.historyScrollOffset) < 0.5) this.historyScrollOffset = 0
    } else if (this.historyScrollOffset > maxScrollOffset) {
      this.historyScrollOffset += (maxScrollOffset - this.historyScrollOffset) * this.historyBounceStiffness * dt
      if (Math.abs(this.historyScrollOffset - maxScrollOffset) < 0.5) {
        this.historyScrollOffset = maxScrollOffset
      }
    }
  }

  /**
   * 计算猜测历史最大滚动偏移
   */
  getMaxHistoryScrollOffset() {
    const listH = this.elements.historySection?.h - 30 || 200
    const totalContentHeight = this.history.length * (this.historyItemHeight + this.historyItemGap)
    return Math.max(0, totalContentHeight - listH + 16)
  }

  /**
   * 滚动猜测历史到底部（平滑动画）
   */
  scrollHistoryToBottom() {
    const targetOffset = this.getMaxHistoryScrollOffset()

    // 如果目标位置与当前位置接近，直接设置
    if (Math.abs(targetOffset - this.historyScrollOffset) < 10) {
      this.historyScrollOffset = targetOffset
      this.smoothScrollProgress = 1
      return
    }

    // 启动平滑滚动动画
    this.smoothScrollStart = this.historyScrollOffset
    this.smoothScrollTarget = targetOffset
    this.smoothScrollProgress = 0
    this.historyScrollVelocity = 0
  }

  /**
   * 滚动猜测历史到顶部（平滑动画）
   */
  scrollToTop() {
    // 如果当前位置接近顶部，直接设置
    if (this.historyScrollOffset < 10) {
      this.historyScrollOffset = 0
      this.smoothScrollProgress = 1
      return
    }

    // 启动平滑滚动动画
    this.smoothScrollStart = this.historyScrollOffset
    this.smoothScrollTarget = 0
    this.smoothScrollProgress = 0
    this.historyScrollVelocity = 0
  }

  /**
   * 切换难度（重新开始游戏）
   */
  cycleDifficulty() {
    const game = globalThis.getGame()
    const difficulties = [3, 4, 5]

    const currentIndex = difficulties.indexOf(this.difficulty)
    const nextIndex = (currentIndex + 1) % difficulties.length
    const nextDifficulty = difficulties[nextIndex]

    // 如果游戏已开始，检查是否需要确认
    if (this.gameStarted && !this.gameOver) {
      // 如果用户已选择跳过确认，直接切换
      if (game.gameState.settings.skipDifficultyConfirm) {
        this.doDifficultyChange(nextDifficulty)
        return
      }

      // 显示确认对话框
      this.pendingDifficulty = nextDifficulty
      this.showDifficultyConfirm = true
      this.skipDifficultyConfirmChecked = false  // 重置复选框
      game.audioManager.vibrate('short')
      return
    }

    // 游戏未开始，直接切换
    this.doDifficultyChange(nextDifficulty)
  }

  /**
   * 显示难度切换确认对话框
   */
  showDifficultyConfirmDialog(nextDifficulty) {
    this.pendingDifficulty = nextDifficulty
    this.showDifficultyConfirm = true
    const game = globalThis.getGame()
    game.audioManager.vibrate('short')
  }

  /**
   * 确认切换难度
   */
  confirmDifficultyChange() {
    const game = globalThis.getGame()

    // 如果勾选了"不再提示"，保存设置
    if (this.skipDifficultyConfirmChecked) {
      game.gameState.settings.skipDifficultyConfirm = true
      globalThis.__game__.saveUserData()
    }

    if (this.pendingDifficulty) {
      this.doDifficultyChange(this.pendingDifficulty)
    }
    this.showDifficultyConfirm = false
    this.pendingDifficulty = null
    this.skipDifficultyConfirmChecked = false
  }

  /**
   * 取消切换难度
   */
  cancelDifficultyChange() {
    this.showDifficultyConfirm = false
    this.pendingDifficulty = null
    this.skipDifficultyConfirmChecked = false
  }

  /**
   * 执行难度切换
   */
  doDifficultyChange(nextDifficulty) {
    const game = globalThis.getGame()

    // 更新设置
    game.gameState.settings.difficulty = nextDifficulty
    globalThis.__game__.saveUserData()

    // 显示提示
    this.difficultyChangeToast = {
      text: `🎯 难度: ${nextDifficulty}位`,
      subText: '🔄 已重新开始',
      alpha: 1,
      duration: 1000
    }

    // 振动反馈
    game.audioManager.vibrate('short')

    // 重新开始游戏
    this.difficulty = nextDifficulty
    this.initGame()
    this.calculateLayout()
  }

  /**
   * 切换 AI 动画速度
   */
  cycleAISpeed() {
    const game = globalThis.getGame()
    const speeds = ['slow', 'normal', 'fast', 'skip']
    const labels = { slow: '🐢 慢速', normal: '🚶 正常', fast: '🏃 快速', skip: '⏭️ 跳过' }

    const currentSpeed = game.gameState.settings.aiAnimationSpeed || 'normal'
    const currentIndex = speeds.indexOf(currentSpeed)
    const nextIndex = (currentIndex + 1) % speeds.length
    const nextSpeed = speeds[nextIndex]

    // 更新设置
    game.gameState.settings.aiAnimationSpeed = nextSpeed
    globalThis.__game__.saveUserData()

    // 显示提示（包含预估时长）
    const estimatedTime = this.getEstimatedGameTime(nextSpeed)
    this.speedChangeToast = {
      text: `⚡ AI速度: ${labels[nextSpeed]}`,
      subText: estimatedTime,
      alpha: 1,
      duration: 1000  // 1秒后开始淡出
    }

    // 振动反馈
    game.audioManager.vibrate('short')
  }

  /**
   * 获取预估游戏时长
   * 优先使用用户历史平均回合数
   */
  getEstimatedGameTime(speed) {
    const game = globalThis.getGame()

    // 优先使用用户历史平均回合数
    let avgRounds = game.storageManager.getAverageTurns(this.difficulty)

    // 无历史数据时使用默认值
    if (avgRounds === null) {
      const avgRoundsMap = {
        3: 4,   // 3位难度：平均约 4 回合
        4: 6,   // 4位难度：平均约 6 回合
        5: 8    // 5位难度：平均约 8 回合
      }
      avgRounds = avgRoundsMap[this.difficulty] || 6
    }

    const delayMap = {
      'slow': 2000,
      'normal': 1000,
      'fast': 500,
      'skip': 100
    }
    const delay = delayMap[speed] || 1000
    const totalMs = Math.round(avgRounds) * delay
    const seconds = Math.round(totalMs / 1000)

    if (seconds < 1) {
      return '⏱️ 预计 <1秒/局'
    } else {
      return `⏱️ 预计 ~${seconds}秒/局`
    }
  }

  /**
   * 获取当前 AI 速度标签
   */
  getAISpeedLabel() {
    const game = globalThis.getGame()
    const speed = game.gameState.settings.aiAnimationSpeed || 'normal'
    const labels = { slow: '🐢', normal: '🚶', fast: '🏃', skip: '⏭️' }
    return labels[speed]
  }

  /**
   * 获取 AI 思考预估时间提示
   */
  getAIThinkingEstimatedTime() {
    const game = globalThis.getGame()
    const speed = game.gameState.settings.aiAnimationSpeed || 'normal'

    const timeMap = {
      'slow': '⏱️ 约2秒',
      'normal': '⏱️ 约1秒',
      'fast': '⏱️ 约0.5秒',
      'skip': '⚡ 即时'
    }

    return timeMap[speed] || '⏱️ 约1秒'
  }

  /**
   * 更新波纹效果
   */
  updateRipples(deltaTime) {
    this.ripples = this.ripples.filter(ripple => {
      ripple.time += deltaTime
      ripple.radius += deltaTime * 0.15  // 扩散速度
      ripple.alpha = Math.max(0, 1 - ripple.time / ripple.duration)
      return ripple.alpha > 0
    })
  }

  /**
   * 添加波纹效果
   */
  addRipple(x, y, color) {
    this.ripples.push({
      x,
      y,
      radius: 0,
      alpha: 0.5,
      time: 0,
      duration: 400,  // 波纹持续时间 ms
      color
    })
  }

  render(renderer) {
    const game = globalThis.getGame()
    const theme = renderer.currentTheme
    const { width } = renderer

    renderer.drawGradientBackground()
    this.renderStatusBar(renderer)
    if (this.mode === 'ai') this.renderAISection(renderer)
    this.renderHistory(renderer)
    this.renderInput(renderer)
    this.renderKeyboard(renderer)

    // 渲染难度切换提示（放在最后，覆盖在最上层）
    this.renderDifficultyChangeToast(renderer)

    // 渲染难度切换确认对话框（最上层）
    this.renderDifficultyConfirmDialog(renderer)

    // 渲染帮助弹窗（最上层）
    this.renderHelpDialog(renderer)

    // 渲染暂停弹窗（最上层）
    this.renderPauseDialog(renderer)
  }

  renderStatusBar(renderer) {
    const game = globalThis.getGame()
    const theme = renderer.currentTheme
    const { width } = renderer
    const y = this.elements.statusBar.y
    const safeLeft = this.elements.safeArea?.left || 12
    const safeRight = this.elements.safeArea?.right || width - 12
    const margin = 12

    // 状态栏背景
    const barWidth = safeRight - safeLeft - margin * 2
    renderer.drawRect(safeLeft + margin, y, barWidth, 44, { fill: theme.bgSecondary, radius: 12 })

    // 回合数或目标提示
    if (this.turn === 0 && !this.gameStarted) {
      // 每日挑战显示日期
      if (this.mode === 'daily' && this.dailyDate) {
        renderer.drawText(`📅 ${this.dailyDate}`, safeLeft + margin + 20, y + 22, { fontSize: 16, color: theme.accent, baseline: 'middle' })
      } else {
        renderer.drawText('🎯 准备开始', safeLeft + margin + 20, y + 22, { fontSize: 16, color: theme.textPrimary, baseline: 'middle' })
      }
      // 最佳记录和平均用时提示
      const bestTurns = game.storageManager.getBestTurns(this.difficulty)
      const bestDuration = game.storageManager.getBestDuration(this.difficulty)
      const avgDuration = game.storageManager.getAverageDuration(this.difficulty)
      const hints = []
      if (bestTurns !== null) {
        hints.push(`🏆 ${bestTurns}回合`)
      }
      if (bestDuration !== null) {
        const bestMin = Math.floor(bestDuration / 60)
        const bestSec = bestDuration % 60
        const bestTimeStr = bestMin > 0 ? `${bestMin}分${bestSec}秒` : `${bestSec}秒`
        hints.push(`⚡ ${bestTimeStr}`)
      }
      if (avgDuration !== null) {
        const minutes = Math.floor(avgDuration / 60)
        const seconds = avgDuration % 60
        const timeStr = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`
        hints.push(`📊 平均${timeStr}`)
      }
      if (hints.length > 0) {
        renderer.drawText(hints.join(' · '), safeLeft + margin + 120, y + 22, {
          fontSize: 11,
          color: theme.textMuted,
          baseline: 'middle'
        })
      }
    } else {
      renderer.drawText(`🔄 回合 ${this.turn}`, safeLeft + margin + 20, y + 22, { fontSize: 16, color: theme.textPrimary, baseline: 'middle' })
    }

    // 计时器居中
    const centerX = (safeLeft + safeRight) / 2
    renderer.drawText(`⏱️ ${game.core.formatTime(this.timeElapsed)}`, centerX, y + 22, { fontSize: 16, color: theme.textPrimary, align: 'center', baseline: 'middle' })

    // 难度显示区域（可点击）
    const diffText = `🎯 ${this.difficulty}位`
    const diffBtnW = 60
    const diffBtnX = safeRight - margin - diffBtnW
    const diffBtnY = y + 8
    const diffBtnH = 28

    // 存储点击区域
    this.elements.difficultyBtn = { x: diffBtnX, y: diffBtnY, w: diffBtnW, h: diffBtnH }

    // 绘制难度按钮背景
    renderer.drawRect(diffBtnX, diffBtnY, diffBtnW, diffBtnH, {
      fill: theme.bgCard,
      radius: 14,
      stroke: theme.border,
      strokeWidth: 1
    })

    // 难度文字
    renderer.drawText(diffText, diffBtnX + diffBtnW / 2, diffBtnY + diffBtnH / 2, {
      fontSize: 14,
      color: theme.textSecondary,
      align: 'center',
      baseline: 'middle'
    })

    // 帮助按钮（在难度按钮左边）
    const helpBtnW = 28
    const helpBtnH = 28
    const helpBtnX = diffBtnX - helpBtnW - 8
    const helpBtnY = y + 8

    // 存储帮助按钮点击区域
    this.elements.helpBtn = { x: helpBtnX, y: helpBtnY, w: helpBtnW, h: helpBtnH }

    // 帮助按钮背景
    renderer.drawRect(helpBtnX, helpBtnY, helpBtnW, helpBtnH, {
      fill: theme.bgCard,
      radius: 14,
      stroke: theme.border,
      strokeWidth: 1
    })

    // 帮助按钮图标
    renderer.drawText('❓', helpBtnX + helpBtnW / 2, helpBtnY + helpBtnH / 2, {
      fontSize: 14,
      align: 'center',
      baseline: 'middle'
    })

    // 暂停按钮（在帮助按钮左边，游戏开始后显示）
    if (this.gameStarted && !this.gameOver) {
      const pauseBtnW = 28
      const pauseBtnH = 28
      const pauseBtnX = helpBtnX - pauseBtnW - 8
      const pauseBtnY = y + 8

      // 存储暂停按钮点击区域
      this.elements.pauseBtn = { x: pauseBtnX, y: pauseBtnY, w: pauseBtnW, h: pauseBtnH }

      // 暂停按钮背景
      renderer.drawRect(pauseBtnX, pauseBtnY, pauseBtnW, pauseBtnH, {
        fill: theme.bgCard,
        radius: 14,
        stroke: theme.border,
        strokeWidth: 1
      })

      // 暂停按钮图标
      const pauseIcon = this.isPaused ? '▶️' : '⏸️'
      renderer.drawText(pauseIcon, pauseBtnX + pauseBtnW / 2, pauseBtnY + pauseBtnH / 2, {
        fontSize: 14,
        align: 'center',
        baseline: 'middle'
      })
    } else {
      this.elements.pauseBtn = null
    }
  }

  renderAISection(renderer) {
    const theme = renderer.currentTheme
    const y = this.elements.aiSection.y
    const { width } = renderer
    const safeLeft = this.elements.safeArea?.left || 12
    const safeRight = this.elements.safeArea?.right || width - 12
    const margin = 12
    const sectionWidth = safeRight - safeLeft - margin * 2

    if (this.aiThinking) {
      // 背景 - 带发光效果
      renderer.drawRect(safeLeft + margin, y, sectionWidth, 70, { fill: theme.bgSecondary, radius: 12 })

      // 获取动态颜色
      const progressColor = this.getProgressColor()

      // 顶部高亮条
      renderer.drawRect(safeLeft + margin, y, sectionWidth, 3, { fill: progressColor, radius: 1.5 })

      // AI 图标和文字
      const text = '🤖 AI 分析中'
      const dots = this.getAnimatedDots()
      renderer.drawText(text + dots, safeLeft + margin + 20, y + 28, { fontSize: 16, color: progressColor, bold: true })

      // 候选数量进度条
      const progressWidth = sectionWidth - 40
      const progressHeight = 4
      const progressY = y + 50

      // 进度条背景
      renderer.drawRect(safeLeft + margin + 20, progressY, progressWidth, progressHeight, { fill: theme.bgCard, radius: 2 })

      // 进度条填充（动态宽度）
      const animProgress = (Math.sin(this.aiThinkingAnimTime * 0.002) + 1) / 2
      const fillWidth = progressWidth * (0.3 + animProgress * 0.5)
      renderer.drawRect(safeLeft + margin + 20, progressY, fillWidth, progressHeight, { fill: progressColor, radius: 2 })

      // 候选数和预估时间
      const candText = `📊 剩余候选: ${this.aiCandidateCount}`
      const estimatedTime = this.getAIThinkingEstimatedTime()
      renderer.drawText(candText, safeRight - margin - 20, y + 20, { fontSize: 11, color: theme.textSecondary, align: 'right' })
      renderer.drawText(estimatedTime, safeRight - margin - 20, y + 38, { fontSize: 11, color: theme.textMuted, align: 'right' })
    } else if (this.aiGuess) {
      renderer.drawRect(safeLeft + margin, y, sectionWidth, 60, { fill: theme.bgSecondary, radius: 12 })
      renderer.drawText('🤖 AI 猜测', safeLeft + margin + 20, y + 22, { fontSize: 14, color: theme.textSecondary })
      renderer.drawText(this.aiGuess, safeLeft + margin + 100, y + 20, { fontSize: 22, color: theme.accent, bold: true })

      // 显示结果
      const lastResult = this.history[this.history.length - 1]
      if (lastResult) {
        // 根据结果添加图标
        let resultIcon = ''
        if (lastResult.correct === this.difficulty) {
          resultIcon = '🎯 '  // 全中
        } else if (lastResult.correct > 0) {
          resultIcon = '📍 '  // 部分命中
        }
        const resultText = `${resultIcon}${lastResult.correct}/${this.difficulty}`
        renderer.drawText(resultText, safeRight - margin - 80, y + 20, { fontSize: 16, color: theme.textPrimary, align: 'right' })
      }

      // 速度切换按钮
      this.renderSpeedButton(renderer, y, width, safeLeft, safeRight)
    } else {
      // 初始状态：显示速度切换按钮
      renderer.drawRect(safeLeft + margin, y, sectionWidth, 60, { fill: theme.bgSecondary, radius: 12 })
      renderer.drawText('🤖 AI 对战模式', safeLeft + margin + 20, y + 22, { fontSize: 14, color: theme.textSecondary })
      renderer.drawText('👉 开始猜测吧！', safeLeft + margin + 20, y + 44, { fontSize: 12, color: theme.textMuted })

      // 速度切换按钮
      this.renderSpeedButton(renderer, y, width, safeLeft, safeRight)
    }

    // 渲染速度切换提示
    this.renderSpeedChangeToast(renderer)
  }

  /**
   * 渲染速度切换按钮
   */
  renderSpeedButton(renderer, y, width, safeLeft, safeRight) {
    const theme = renderer.currentTheme
    const game = globalThis.getGame()
    const speed = game.gameState.settings.aiAnimationSpeed || 'normal'
    const labels = { slow: '🐢 慢速', normal: '🚶 正常', fast: '🏃 快速', skip: '⏭️ 跳过' }
    const margin = 12

    // 按钮位置
    const btnW = 56
    const btnH = 28
    const btnX = safeRight - margin - btnW
    const btnY = y + 16

    // 更新元素位置（用于点击检测）
    this.elements.speedBtn = { x: btnX, y: btnY, w: btnW, h: btnH }

    // 按钮背景
    renderer.drawRect(btnX, btnY, btnW, btnH, {
      fill: theme.bgCard,
      radius: 14,
      stroke: theme.border,
      strokeWidth: 1
    })

    // 按钮文字
    renderer.drawText(labels[speed], btnX + btnW / 2, btnY + btnH / 2, {
      fontSize: 12,
      color: theme.textSecondary,
      align: 'center',
      baseline: 'middle'
    })
  }

  /**
   * 渲染速度切换提示
   */
  renderSpeedChangeToast(renderer) {
    if (!this.speedChangeToast) return

    const theme = renderer.currentTheme
    const { width, height } = renderer

    // 如果有子文本，增加高度
    const hasSubText = this.speedChangeToast.subText
    const toastW = hasSubText ? 160 : 140
    const toastH = hasSubText ? 52 : 36
    const toastX = (width - toastW) / 2
    const toastY = height / 2 - toastH / 2

    // 背景
    renderer.drawRect(toastX, toastY, toastW, toastH, {
      fill: `rgba(16, 185, 129, ${this.speedChangeToast.alpha * 0.9})`,
      radius: 18
    })

    // 主文字
    const textY = hasSubText ? toastY + 18 : toastY + toastH / 2
    renderer.drawText(this.speedChangeToast.text, toastX + toastW / 2, textY, {
      fontSize: 14,
      color: `rgba(255, 255, 255, ${this.speedChangeToast.alpha})`,
      align: 'center',
      baseline: 'middle',
      bold: true
    })

    // 子文本（预估时长）
    if (hasSubText) {
      renderer.drawText(this.speedChangeToast.subText, toastX + toastW / 2, toastY + 36, {
        fontSize: 11,
        color: `rgba(255, 255, 255, ${this.speedChangeToast.alpha * 0.8})`,
        align: 'center',
        baseline: 'middle'
      })
    }
  }

  /**
   * 渲染难度切换提示
   */
  renderDifficultyChangeToast(renderer) {
    if (!this.difficultyChangeToast) return

    const theme = renderer.currentTheme
    const { width, height } = renderer

    // 如果有子文本，增加高度
    const hasSubText = this.difficultyChangeToast.subText
    const toastW = hasSubText ? 160 : 140
    const toastH = hasSubText ? 52 : 36
    const toastX = (width - toastW) / 2
    const toastY = height / 2 - toastH / 2

    // 背景（使用主题色）
    renderer.drawRect(toastX, toastY, toastW, toastH, {
      fill: `rgba(99, 102, 241, ${this.difficultyChangeToast.alpha * 0.9})`,
      radius: 18
    })

    // 主文字
    const textY = hasSubText ? toastY + 18 : toastY + toastH / 2
    renderer.drawText(this.difficultyChangeToast.text, toastX + toastW / 2, textY, {
      fontSize: 14,
      color: `rgba(255, 255, 255, ${this.difficultyChangeToast.alpha})`,
      align: 'center',
      baseline: 'middle',
      bold: true
    })

    // 子文本
    if (hasSubText) {
      renderer.drawText(this.difficultyChangeToast.subText, toastX + toastW / 2, toastY + 36, {
        fontSize: 11,
        color: `rgba(255, 255, 255, ${this.difficultyChangeToast.alpha * 0.8})`,
        align: 'center',
        baseline: 'middle'
      })
    }
  }

  /**
   * 渲染难度切换确认对话框
   */
  renderDifficultyConfirmDialog(renderer) {
    if (!this.showDifficultyConfirm) return

    const theme = renderer.currentTheme
    const { width, height } = renderer

    // 半透明遮罩
    renderer.drawRect(0, 0, width, height, { fill: 'rgba(0,0,0,0.6)' })

    const dialogW = 280
    const dialogH = 190  // 增加高度以容纳复选框
    const dialogX = (width - dialogW) / 2
    const dialogY = (height - dialogH) / 2

    // 对话框背景
    renderer.drawRect(dialogX, dialogY, dialogW, dialogH, {
      fill: theme.bgSecondary,
      radius: 16
    })

    // 标题
    renderer.drawText('🎯 切换难度', width / 2, dialogY + 28, {
      fontSize: 18,
      color: theme.textPrimary,
      align: 'center',
      bold: true
    })

    // 提示文字
    renderer.drawText('⚠️ 当前游戏将被放弃并重新开始', width / 2, dialogY + 56, {
      fontSize: 14,
      color: theme.textSecondary,
      align: 'center'
    })

    renderer.drawText(`确定切换到 ${this.pendingDifficulty}位 难度？`, width / 2, dialogY + 76, {
      fontSize: 12,
      color: theme.textMuted,
      align: 'center'
    })

    // "不再提示"复选框
    const checkboxX = dialogX + 20
    const checkboxY = dialogY + 96
    const checkboxSize = 18
    const checkboxPressed = this.pressedItem === 'difficulty_checkbox'

    // 复选框背景
    renderer.drawRect(checkboxX, checkboxY, checkboxSize, checkboxSize, {
      fill: this.skipDifficultyConfirmChecked ? theme.accent : theme.bgCard,
      radius: 4,
      stroke: this.skipDifficultyConfirmChecked ? theme.accent : theme.border,
      strokeWidth: 1
    })

    // 勾选标记
    if (this.skipDifficultyConfirmChecked) {
      renderer.drawText('✓', checkboxX + checkboxSize / 2, checkboxY + checkboxSize / 2, {
        fontSize: 12,
        color: '#ffffff',
        align: 'center',
        baseline: 'middle',
        bold: true
      })
    }

    // 复选框文字
    renderer.drawText('🔇 不再提示', checkboxX + checkboxSize + 8, checkboxY + checkboxSize / 2, {
      fontSize: 13,
      color: theme.textSecondary,
      baseline: 'middle'
    })

    // 存储复选框点击区域
    this.elements.difficultyCheckbox = {
      x: checkboxX,
      y: checkboxY,
      w: checkboxSize + 80,  // 包含文字区域
      h: checkboxSize
    }

    // 按钮
    const btnW = 100
    const btnH = 40
    const btnY = dialogY + dialogH - 56
    const cancelX = dialogX + 20
    const confirmX = dialogX + dialogW - btnW - 20

    // 取消按钮
    const cancelPressed = this.pressedItem === 'difficulty_confirm_cancel'
    renderer.drawButton(cancelX, btnY, btnW, btnH, '✕ 取消', {
      radius: 10,
      fontSize: 14,
      pressed: cancelPressed
    })

    // 确认按钮
    const confirmPressed = this.pressedItem === 'difficulty_confirm_ok'
    renderer.drawButton(confirmX, btnY, btnW, btnH, '✓ 确认', {
      type: 'primary',
      radius: 10,
      fontSize: 14,
      pressed: confirmPressed
    })
  }

  /**
   * 渲染游戏内帮助弹窗
   */
  renderHelpDialog(renderer) {
    if (!this.showHelpDialog) return

    const theme = renderer.currentTheme
    const { width, height } = renderer

    // 计算滑动透明度（滑动越多越透明）
    const slideProgress = Math.abs(this.helpDialogSlideOffset) / 150
    const maskAlpha = Math.max(0.2, 0.6 - slideProgress * 0.4)

    // 半透明遮罩
    renderer.drawRect(0, 0, width, height, { fill: `rgba(0,0,0,${maskAlpha})` })

    // 对话框（带滑动偏移）
    const dialogW = 300
    const dialogH = 280
    const dialogX = (width - dialogW) / 2
    const dialogY = (height - dialogH) / 2 + this.helpDialogSlideOffset

    // 计算对话框透明度
    const dialogAlpha = Math.max(0.3, 1 - slideProgress * 0.7)

    // 对话框背景
    renderer.drawRect(dialogX, dialogY, dialogW, dialogH, {
      fill: theme.bgSecondary,
      radius: 16,
      alpha: dialogAlpha
    })

    // 标题
    const titleText = this.mode === 'daily' ? '🎯 每日挑战规则' : '📖 游戏规则'
    renderer.drawText(titleText, width / 2, dialogY + 28, {
      fontSize: 18,
      color: theme.textPrimary,
      align: 'center',
      bold: true,
      alpha: dialogAlpha
    })

    // 规则内容（根据模式显示不同说明）
    const rules = this.mode === 'daily' ? [
      `🎯 猜出今日固定的${this.difficulty}位数字`,
      `🔢 数字可以重复，首位可以是0`,
      `📍 提示显示正确位置数量`,
      ``,
      `💡 例如：答案是1234`,
      `   猜1256 → 📍 2/${this.difficulty}（1和2位置正确）`,
      ``,
      `📅 每天只有一次挑战机会`,
      `🏆 完成后可查看连续挑战天数！`
    ] : [
      `🎯 猜出隐藏的${this.difficulty}位数字`,
      `🔢 数字可以重复，首位可以是0`,
      `📍 提示显示正确位置数量`,
      ``,
      `💡 例如：答案是1234`,
      `   猜1256 → 📍 2/${this.difficulty}（1和2位置正确）`,
      ``,
      `🤖 AI对战：双方轮流猜测`,
      `⚡ 先猜中对方数字者获胜！`
    ]

    rules.forEach((rule, index) => {
      renderer.drawText(rule, dialogX + 20, dialogY + 60 + index * 22, {
        fontSize: 13,
        color: theme.textSecondary,
        alpha: dialogAlpha
      })
    })

    // 滑动提示（小字）
    renderer.drawText('👆 上下滑动关闭', width / 2, dialogY + dialogH + 16, {
      fontSize: 11,
      color: theme.textMuted,
      align: 'center',
      alpha: 0.6
    })

    // 两个按钮并排显示
    const btnW = 110
    const btnH = 36
    const btnGap = 12
    const totalBtnW = btnW * 2 + btnGap
    const btnStartX = (width - totalBtnW) / 2
    const btnY = dialogY + dialogH - 52

    // 完整引导按钮
    const guidePressed = this.pressedItem === 'help_guide'
    renderer.drawButton(btnStartX, btnY, btnW, btnH, '📖 完整引导', {
      radius: 10,
      fontSize: 13,
      pressed: guidePressed
    })

    // 知道了按钮
    const closePressed = this.pressedItem === 'help_close'
    renderer.drawButton(btnStartX + btnW + btnGap, btnY, btnW, btnH, '✓ 知道了', {
      type: 'primary',
      radius: 10,
      fontSize: 13,
      pressed: closePressed
    })

    // 存储按钮点击区域
    this.elements.helpGuideBtn = { x: btnStartX, y: btnY, w: btnW, h: btnH }
    this.elements.helpCloseBtn = { x: btnStartX + btnW + btnGap, y: btnY, w: btnW, h: btnH }
  }

  /**
   * 渲染暂停弹窗
   */
  renderPauseDialog(renderer) {
    if (!this.showPauseDialog) return

    const game = globalThis.getGame()
    const theme = renderer.currentTheme
    const { width, height } = renderer
    const centerX = width / 2
    const centerY = height / 2

    // 遮罩层（可点击关闭）
    renderer.drawRect(0, 0, width, height, { fill: 'rgba(0, 0, 0, 0.6)' })
    this.elements.pauseMask = { x: 0, y: 0, w: width, h: height }

    // 弹窗卡片
    const dialogW = Math.min(280, width - 48)
    const dialogH = 200  // 增加高度以显示进度
    const dialogX = centerX - dialogW / 2
    const dialogY = centerY - dialogH / 2

    renderer.drawRect(dialogX, dialogY, dialogW, dialogH, { fill: theme.bgCard, radius: 16 })

    // 标题
    renderer.drawText('⏸️ 游戏暂停', centerX, dialogY + 28, { fontSize: 20, color: theme.textPrimary, align: 'center', bold: true })

    // 当前进度显示
    const progressY = dialogY + 58
    renderer.drawText(`🔄 回合: ${this.turn}`, centerX, progressY, { fontSize: 14, color: theme.textSecondary, align: 'center' })
    renderer.drawText(`⏱️ 用时: ${game.core.formatTime(this.timeElapsed)}`, centerX, progressY + 24, { fontSize: 14, color: theme.textSecondary, align: 'center' })

    // 提示文字
    renderer.drawText('点击遮罩或按钮继续', centerX, dialogY + 110, { fontSize: 12, color: theme.textMuted, align: 'center' })

    // 按钮
    const btnW = 90
    const btnH = 44
    const btnGap = 12
    const btnStartX = centerX - btnW - btnGap / 2
    const btnY = dialogY + dialogH - btnH - 16

    // 继续游戏按钮
    const resumePressed = this.pressedItem === 'pause_resume'
    renderer.drawButton(btnStartX, btnY, btnW, btnH, '▶️ 继续', {
      type: 'primary',
      radius: 10,
      fontSize: 14,
      pressed: resumePressed
    })

    // 退出游戏按钮
    const quitPressed = this.pressedItem === 'pause_quit'
    renderer.drawButton(btnStartX + btnW + btnGap, btnY, btnW, btnH, '🚪 退出', {
      radius: 10,
      fontSize: 14,
      pressed: quitPressed
    })

    // 存储按钮点击区域
    this.elements.pauseResumeBtn = { x: btnStartX, y: btnY, w: btnW, h: btnH }
    this.elements.pauseQuitBtn = { x: btnStartX + btnW + btnGap, y: btnY, w: btnW, h: btnH }
  }

  /**
   * 获取动画点（跳动效果）
   */
  getAnimatedDots() {
    const dotCount = Math.floor((this.aiThinkingAnimTime / 400) % 4)
    return '.'.repeat(dotCount)
  }

  /**
   * 计算并返回进度颜色（带平滑过渡）
   * 候选多 → 橙黄色 (表示复杂)
   * 候选少 → 绿色/蓝色 (表示接近答案，根据配色方案)
   */
  getProgressColor() {
    const game = globalThis.getGame()
    const isColorblind = game.gameState.settings.colorScheme === 'colorblind'

    if (this.aiInitialCandidateCount === 0) {
      // 默认主题色
      this.targetColor = { r: 99, g: 102, b: 241 }
      return `rgb(${Math.round(this.currentColor.r)},${Math.round(this.currentColor.g)},${Math.round(this.currentColor.b)})`
    }

    const ratio = this.aiCandidateCount / this.aiInitialCandidateCount

    // 颜色插值：从橙黄 #f59e0b 到目标色
    // ratio 1.0 (全部候选) → 橙黄色
    // ratio 0.0 (无候选) → 绿色(默认) / 蓝色(色盲友好)
    const clampedRatio = Math.max(0, Math.min(1, ratio))

    // 计算目标颜色
    let targetR, targetG, targetB

    if (isColorblind) {
      // 色盲友好：橙黄 #f59e0b → 蓝色 #3b82f6
      targetR = Math.round(245 - (245 - 59) * (1 - clampedRatio))   // 245 → 59
      targetG = Math.round(158 - (158 - 130) * (1 - clampedRatio))  // 158 → 130
      targetB = Math.round(11 + (246 - 11) * (1 - clampedRatio))    // 11 → 246
    } else {
      // 默认：橙黄 #f59e0b → 绿色 #10b981
      targetR = Math.round(245 - (245 - 16) * (1 - clampedRatio))   // 245 → 16
      targetG = Math.round(158 + (184 - 158) * (1 - clampedRatio))  // 158 → 184
      targetB = Math.round(11 + (129 - 11) * (1 - clampedRatio))    // 11 → 129
    }

    // 更新目标颜色（触发过渡动画）
    this.targetColor = { r: targetR, g: targetG, b: targetB }

    // 返回当前过渡颜色
    return `rgb(${Math.round(this.currentColor.r)},${Math.round(this.currentColor.g)},${Math.round(this.currentColor.b)})`
  }

  renderHistory(renderer) {
    const theme = renderer.currentTheme
    const y = this.elements.historySection.y
    const { width } = renderer
    const safeLeft = this.elements.safeArea?.left || 12
    const safeRight = this.elements.safeArea?.right || width - 12
    const margin = 12
    const sectionWidth = safeRight - safeLeft - margin * 2

    const listY = y + 24
    const listH = this.elements.historySection.h - 30
    const maxScrollOffset = this.getMaxHistoryScrollOffset()

    renderer.drawText('📋 猜测历史', safeLeft + margin, y, { fontSize: 14, color: theme.textSecondary })
    renderer.drawRect(safeLeft + margin, listY, sectionWidth, listH, { fill: theme.bgSecondary, radius: 12 })

    if (this.history.length === 0) {
      const centerX = (safeLeft + safeRight) / 2
      renderer.drawText('👉 开始猜测吧！', centerX, listY + listH / 2, { fontSize: 16, color: theme.textMuted, align: 'center', baseline: 'middle' })
      return
    }

    // 计算可见项范围（带滚动偏移）
    const itemTotalHeight = this.historyItemHeight + this.historyItemGap
    const startIndex = Math.floor(this.historyScrollOffset / itemTotalHeight)
    const endIndex = Math.min(
      this.history.length,
      startIndex + Math.ceil(listH / itemTotalHeight) + 2
    )

    // 渲染可见项
    for (let i = startIndex; i < endIndex; i++) {
      const item = this.history[i]
      const itemY = listY + 8 + i * itemTotalHeight - this.historyScrollOffset

      // 跳过超出可视区域的项目
      if (itemY + this.historyItemHeight < listY || itemY > listY + listH) continue

      renderer.drawHistoryItem(safeLeft + margin + 8, itemY, sectionWidth - 16, item.guess, item.correct, { height: this.historyItemHeight, digitSize: 28, digitCount: this.difficulty })
    }

    // 新猜测高亮效果（最后一项）
    if (this.newGuessHighlightTime > 0 && this.history.length > 0) {
      const lastItemIndex = this.history.length - 1
      const lastItemY = listY + 8 + lastItemIndex * itemTotalHeight - this.historyScrollOffset

      // 只在可见范围内显示高亮
      if (lastItemY + this.historyItemHeight >= listY && lastItemY <= listY + listH) {
        // 计算高亮透明度（淡出效果）
        const progress = this.newGuessHighlightTime / this.newGuessHighlightDuration
        const highlightAlpha = progress * 0.3

        // 高亮边框
        renderer.drawRect(safeLeft + margin + 6, lastItemY - 2, sectionWidth - 12, this.historyItemHeight + 4, {
          fill: 'transparent',
          stroke: theme.accent,
          strokeWidth: 2,
          radius: 10,
          alpha: highlightAlpha * 2
        })

        // 高亮背景
        renderer.drawRect(safeLeft + margin + 8, lastItemY, sectionWidth - 16, this.historyItemHeight, {
          fill: theme.accent,
          radius: 8,
          alpha: highlightAlpha
        })
      }
    }

    // 滚动指示器
    if (maxScrollOffset > 0) {
      this.renderHistoryScrollIndicator(renderer, listY, listH, width, maxScrollOffset, theme)
    }

    // 回到顶部按钮
    if (this.showScrollToTop) {
      this.renderScrollToTopButton(renderer, listY, width, theme)
    }
  }

  /**
   * 渲染回到顶部按钮
   */
  renderScrollToTopButton(renderer, listY, width, theme) {
    const safeRight = this.elements.safeArea?.right || width - 12
    const margin = 12
    const btnSize = 32
    const btnX = safeRight - margin - btnSize - 10
    const btnY = listY + 8

    // 存储按钮点击区域
    this.elements.scrollToTopBtn = { x: btnX, y: btnY, w: btnSize, h: btnSize }

    // 按钮背景
    renderer.drawRect(btnX, btnY, btnSize, btnSize, {
      fill: theme.bgCard,
      radius: btnSize / 2,
      stroke: theme.border,
      strokeWidth: 1
    })

    // 向上箭头图标
    renderer.drawText('↑', btnX + btnSize / 2, btnY + btnSize / 2, {
      fontSize: 18,
      color: theme.textSecondary,
      align: 'center',
      baseline: 'middle',
      bold: true
    })
  }

  /**
   * 渲染猜测历史滚动指示器
   */
  renderHistoryScrollIndicator(renderer, listY, listH, width, maxScrollOffset, theme) {
    const safeRight = this.elements.safeArea?.right || width - 12
    const margin = 12

    // 指示器高度根据内容比例计算
    const indicatorHeight = Math.max(30, (listH / (maxScrollOffset + listH)) * listH)

    // 指示器位置
    let indicatorY = listY + (this.historyScrollOffset / maxScrollOffset) * (listH - indicatorHeight)

    // 边界回弹时指示器也跟随
    if (this.historyScrollOffset < 0) {
      indicatorY = listY + (this.historyScrollOffset / maxScrollOffset) * (listH - indicatorHeight) * 0.5
    } else if (this.historyScrollOffset > maxScrollOffset) {
      const overflow = this.historyScrollOffset - maxScrollOffset
      indicatorY = listY + listH - indicatorHeight - (overflow / maxScrollOffset) * (listH - indicatorHeight) * 0.5
    }

    // 指示器透明度（滚动时更明显）
    const alpha = this.historyIsScrolling || Math.abs(this.historyScrollVelocity) > 1 ? 1 : 0.5

    renderer.drawRect(safeRight - margin - 6, indicatorY, 4, indicatorHeight, {
      fill: `rgba(148, 163, 184, ${alpha})`,
      radius: 2
    })
  }

  renderInput(renderer) {
    const theme = renderer.currentTheme
    const y = this.elements.inputSection.y
    const { width } = renderer
    const safeLeft = this.elements.safeArea?.left || 12
    const safeRight = this.elements.safeArea?.right || width - 12
    const margin = 12
    const sectionWidth = safeRight - safeLeft - margin * 2

    renderer.drawRect(safeLeft + margin, y, sectionWidth, 70, { fill: theme.bgSecondary, radius: 12 })
    this.elements.digitBoxes.forEach((box, index) => {
      renderer.drawDigitBox(box.x, box.y, box.size, this.currentInput[index] || '', { active: index === this.currentInput.length, radius: 10 })
    })
  }

  renderKeyboard(renderer) {
    const theme = renderer.currentTheme
    const keys = this.elements.keyboard.keys

    keys.forEach((key, index) => {
      let type = 'default'
      let disabled = false
      let label = key.label

      if (key.label === '⌫') {
        type = 'action'
        label = '删除'
      } else if (key.label === '✓') {
        type = 'primary'
        label = '确认'
      }

      renderer.drawKey(key.x, key.y, key.w, key.h, label, {
        type, disabled, radius: 8,
        pressed: this.pressedKey === index
      })
    })

    // 渲染波纹效果
    this.ripples.forEach(ripple => {
      renderer.drawRipple(ripple.x, ripple.y, ripple.radius, ripple.alpha, ripple.color)
    })
  }

  handleInput(events) {
    const game = globalThis.getGame()
    const theme = game.renderer.currentTheme
    const { width, height } = game.renderer

    events.forEach(event => {
      if (event.type === 'tap') {
        // 如果显示暂停弹窗，优先处理弹窗输入
        if (this.showPauseDialog) {
          this.handlePauseDialogInput(event, game, width, height)
          return
        }

        // 如果显示帮助弹窗，优先处理弹窗输入
        if (this.showHelpDialog) {
          this.handleHelpDialogInput(event, game, width, height)
          return
        }

        // 如果显示确认对话框，优先处理对话框输入
        if (this.showDifficultyConfirm) {
          this.handleDifficultyConfirmInput(event, game, width, height)
          return
        }

        if (this.gameOver) return

        // 暂停时不处理输入
        if (this.isPaused) return

        this.pressedKey = null

        // 检测回到顶部按钮点击
        const scrollToTopBtn = this.elements.scrollToTopBtn
        if (scrollToTopBtn && game.inputManager.hitTest(event, scrollToTopBtn.x, scrollToTopBtn.y, scrollToTopBtn.w, scrollToTopBtn.h)) {
          this.scrollToTop()
          game.audioManager.vibrate('short')
          return
        }

        // 检测暂停按钮点击
        const pauseBtn = this.elements.pauseBtn
        if (pauseBtn && game.inputManager.hitTest(event, pauseBtn.x, pauseBtn.y, pauseBtn.w, pauseBtn.h)) {
          this.pauseGame()
          game.audioManager.vibrate('short')
          return
        }

        // 检测帮助按钮点击
        const helpBtn = this.elements.helpBtn
        if (helpBtn && game.inputManager.hitTest(event, helpBtn.x, helpBtn.y, helpBtn.w, helpBtn.h)) {
          this.showHelpDialog = true
          this.helpDialogSlideOffset = 0
          this.helpDialogSpringVelocity = 0
          game.audioManager.vibrate('short')
          return
        }

        // 检测难度按钮点击
        const difficultyBtn = this.elements.difficultyBtn
        if (difficultyBtn && game.inputManager.hitTest(event, difficultyBtn.x, difficultyBtn.y, difficultyBtn.w, difficultyBtn.h)) {
          this.cycleDifficulty()
          return  // 不再处理其他点击
        }

        // 检测速度按钮点击
        const speedBtn = this.elements.speedBtn
        if (speedBtn && game.inputManager.hitTest(event, speedBtn.x, speedBtn.y, speedBtn.w, speedBtn.h)) {
          this.cycleAISpeed()
          return  // 不再处理其他点击
        }

        this.elements.keyboard.keys.forEach((key, index) => {
          if (game.inputManager.hitTest(event, key.x, key.y, key.w, key.h)) {
            // 添加波纹效果
            const rippleX = key.x + key.w / 2
            const rippleY = key.y + key.h / 2
            let rippleColor = theme.accent
            if (key.label === '⌫') rippleColor = theme.error
            else if (key.label === '✓') rippleColor = theme.success
            this.addRipple(rippleX, rippleY, rippleColor)

            if (key.label === '⌫') {
              this.deleteDigit()
              game.audioManager.playDelete()
              game.audioManager.vibrate('short')
            } else if (key.label === '✓') {
              this.submitGuess()
            } else {
              this.inputDigit(key.label)
              game.audioManager.playKeyPress()
              game.audioManager.vibrate('short')
            }
          }
        })
      } else if (event.type === 'longpress') {
        // 长按数字输入框清空输入
        if (this.showPauseDialog || this.showHelpDialog || this.showDifficultyConfirm || this.gameOver || this.isPaused) return

        this.elements.digitBoxes.forEach(box => {
          if (game.inputManager.hitTest(event, box.x, box.y, box.size, box.size)) {
            if (this.currentInput.length > 0) {
              this.currentInput = ''
              game.audioManager.vibrate('medium')
              // 显示清空提示
              this.speedChangeToast = { text: '已清空输入', alpha: 1, duration: 1500 }
            }
          }
        })
      } else if (event.type === 'swipe') {
        this.pressedKey = null
        this.pressedItem = null

        // 处理猜测历史区域滚动
        if (!this.showPauseDialog && !this.showHelpDialog && !this.showDifficultyConfirm && !this.gameOver) {
          const historyY = this.elements.historySection?.y
          const historyH = this.elements.historySection?.h
          if (historyY && historyH && event.y >= historyY && event.y <= historyY + historyH) {
            const maxScrollOffset = this.getMaxHistoryScrollOffset()
            if (maxScrollOffset > 0) {
              // 取消平滑滚动动画
              this.smoothScrollProgress = 1
              this.historyScrollVelocity = event.dy
              this.historyScrollOffset = Math.max(-50, Math.min(maxScrollOffset + 50, this.historyScrollOffset - event.dy))
            }
          }
        }
      } else if (event.type === 'touchstart') {
        // 开始触摸历史区域
        if (!this.showPauseDialog && !this.showHelpDialog && !this.showDifficultyConfirm && !this.gameOver) {
          const historyY = this.elements.historySection?.y
          const historyH = this.elements.historySection?.h
          if (historyY && historyH && event.y >= historyY && event.y <= historyY + historyH) {
            // 取消平滑滚动动画
            this.smoothScrollProgress = 1
            this.historyIsScrolling = true
            this.historyScrollVelocity = 0
          }
        }
      } else if (event.type === 'touchend') {
        // 结束触摸，开始惯性滚动
        this.historyIsScrolling = false
      }
    })

    // 检测触摸按下状态
    if (game.inputManager.touchStart) {
      // 如果显示暂停弹窗，处理弹窗按钮按下状态
      if (this.showPauseDialog) {
        this.handlePauseDialogPress(game, width, height)
        return
      }

      // 如果显示帮助弹窗，处理弹窗按钮按下状态
      if (this.showHelpDialog) {
        this.handleHelpDialogPress(game, width, height)
        return
      }

      // 如果显示确认对话框，处理对话框按钮按下状态
      if (this.showDifficultyConfirm) {
        this.handleDifficultyConfirmPress(game, width, height)
        return
      }

      if (this.gameOver) return

      let found = false
      this.elements.keyboard.keys.forEach((key, index) => {
        if (game.inputManager.hitTest(game.inputManager.touchStart, key.x, key.y, key.w, key.h)) {
          this.pressedKey = index
          found = true
        }
      })
      if (!found) this.pressedKey = null
    }
  }

  /**
   * 处理难度切换确认对话框按钮按下状态
   */
  handleDifficultyConfirmPress(game, width, height) {
    const dialogW = 280
    const dialogH = 190
    const dialogX = (width - dialogW) / 2
    const dialogY = (height - dialogH) / 2
    const btnW = 100
    const btnH = 40
    const btnY = dialogY + dialogH - 56
    const cancelX = dialogX + 20
    const confirmX = dialogX + dialogW - btnW - 20

    this.pressedItem = null

    // 复选框按下状态
    const checkbox = this.elements.difficultyCheckbox
    if (checkbox && game.inputManager.hitTest(game.inputManager.touchStart, checkbox.x, checkbox.y, checkbox.w, checkbox.h)) {
      this.pressedItem = 'difficulty_checkbox'
      return
    }

    if (game.inputManager.hitTest(game.inputManager.touchStart, cancelX, btnY, btnW, btnH)) {
      this.pressedItem = 'difficulty_confirm_cancel'
    }

    if (game.inputManager.hitTest(game.inputManager.touchStart, confirmX, btnY, btnW, btnH)) {
      this.pressedItem = 'difficulty_confirm_ok'
    }
  }

  /**
   * 处理暂停弹窗输入
   */
  handlePauseDialogInput(event, game, width, height) {
    if (event.type !== 'tap') return

    // 检查继续按钮
    const resumeBtn = this.elements.pauseResumeBtn
    if (resumeBtn && game.inputManager.hitTest(event, resumeBtn.x, resumeBtn.y, resumeBtn.w, resumeBtn.h)) {
      this.resumeGame()
      game.audioManager.vibrate('short')
      return
    }

    // 检查退出按钮
    const quitBtn = this.elements.pauseQuitBtn
    if (quitBtn && game.inputManager.hitTest(event, quitBtn.x, quitBtn.y, quitBtn.w, quitBtn.h)) {
      this.showPauseDialog = false
      this.isPaused = false
      game.audioManager.vibrate('short')
      // 返回主菜单
      this.sceneManager.switchTo('menu')
      return
    }

    // 检查点击遮罩区域（点击遮罩继续游戏）
    const mask = this.elements.pauseMask
    if (mask && game.inputManager.hitTest(event, mask.x, mask.y, mask.w, mask.h)) {
      // 确保点击不在按钮区域
      if (!resumeBtn || !game.inputManager.hitTest(event, resumeBtn.x, resumeBtn.y, resumeBtn.w, resumeBtn.h)) {
        if (!quitBtn || !game.inputManager.hitTest(event, quitBtn.x, quitBtn.y, quitBtn.w, quitBtn.h)) {
          this.resumeGame()
          game.audioManager.vibrate('short')
        }
      }
    }
  }

  /**
   * 处理暂停弹窗按钮按下状态
   */
  handlePauseDialogPress(game, width, height) {
    this.pressedItem = null

    const resumeBtn = this.elements.pauseResumeBtn
    if (resumeBtn && game.inputManager.hitTest(game.inputManager.touchStart, resumeBtn.x, resumeBtn.y, resumeBtn.w, resumeBtn.h)) {
      this.pressedItem = 'pause_resume'
      return
    }

    const quitBtn = this.elements.pauseQuitBtn
    if (quitBtn && game.inputManager.hitTest(game.inputManager.touchStart, quitBtn.x, quitBtn.y, quitBtn.w, quitBtn.h)) {
      this.pressedItem = 'pause_quit'
    }
  }

  /**
   * 暂停游戏
   */
  pauseGame() {
    this.isPaused = true
    this.showPauseDialog = true
    this.stopTimer()
    this.stopAIThinkingTick()
  }

  /**
   * 继续游戏
   */
  resumeGame() {
    this.isPaused = false
    this.showPauseDialog = false
    this.startTimer()
  }

  /**
   * 处理帮助弹窗输入
   */
  handleHelpDialogInput(event, game, width, height) {
    // 处理滑动事件
    if (event.type === 'swipe') {
      this.helpDialogSlideOffset += event.dy || 0
      // 限制滑动范围
      this.helpDialogSlideOffset = Math.max(-200, Math.min(200, this.helpDialogSlideOffset))
      return
    }

    // 处理点击事件
    if (event.type === 'tap') {
      // 检查完整引导按钮
      const guideBtn = this.elements.helpGuideBtn
      if (guideBtn && game.inputManager.hitTest(event, guideBtn.x, guideBtn.y, guideBtn.w, guideBtn.h)) {
        this.showHelpDialog = false
        this.helpDialogSlideOffset = 0
        this.helpDialogSpringVelocity = 0
        game.audioManager.vibrate('short')
        // 跳转到引导场景
        this.sceneManager.switchTo('guide')
        return
      }

      // 检查关闭按钮
      const closeBtn = this.elements.helpCloseBtn
      if (closeBtn && game.inputManager.hitTest(event, closeBtn.x, closeBtn.y, closeBtn.w, closeBtn.h)) {
        this.showHelpDialog = false
        this.helpDialogSlideOffset = 0
        this.helpDialogSpringVelocity = 0
        game.audioManager.vibrate('short')
        return
      }

      // 点击遮罩区域关闭
      const dialogW = 300
      const dialogH = 280
      const dialogX = (width - dialogW) / 2
      const dialogY = (height - dialogH) / 2
      if (!game.inputManager.hitTest(event, dialogX, dialogY, dialogW, dialogH)) {
        this.showHelpDialog = false
        this.helpDialogSlideOffset = 0
        this.helpDialogSpringVelocity = 0
        game.audioManager.vibrate('short')
      }
    }

    // 处理触摸结束事件
    if (event.type === 'touchend') {
      // 滑动超过阈值时关闭弹窗
      if (Math.abs(this.helpDialogSlideOffset) > 100) {
        this.showHelpDialog = false
        this.helpDialogSlideOffset = 0
        this.helpDialogSpringVelocity = 0
        game.audioManager.vibrate('short')
      }
      // 未超过阈值时，弹性动画会自动弹回（不立即重置）
    }
  }

  /**
   * 处理帮助弹窗按钮按下状态
   */
  handleHelpDialogPress(game, width, height) {
    const guideBtn = this.elements.helpGuideBtn
    const closeBtn = this.elements.helpCloseBtn
    this.pressedItem = null

    if (guideBtn && game.inputManager.hitTest(game.inputManager.touchStart, guideBtn.x, guideBtn.y, guideBtn.w, guideBtn.h)) {
      this.pressedItem = 'help_guide'
    }

    if (closeBtn && game.inputManager.hitTest(game.inputManager.touchStart, closeBtn.x, closeBtn.y, closeBtn.w, closeBtn.h)) {
      this.pressedItem = 'help_close'
    }
  }

  inputDigit(digit) {
    if (this.currentInput.length >= this.difficulty) return
    if (!this.gameStarted) { this.gameStarted = true; this.startTimer() }
    this.currentInput += digit

    // 播放按键音
    const game = globalThis.getGame()
    game.audioManager.playKeyPress()
  }

  deleteDigit() {
    if (this.currentInput.length === 0) return
    this.currentInput = this.currentInput.slice(0, -1)

    // 播放删除音
    const game = globalThis.getGame()
    game.audioManager.playDelete()
  }

  submitGuess() {
    const game = globalThis.getGame()
    const { validateInput, calculateMatch } = game.core

    const validation = validateInput(this.currentInput, this.difficulty)
    if (!validation.valid) {
      wx.showToast({ title: validation.error, icon: 'none' })
      return
    }

    // 播放提交音
    game.audioManager.playSubmit()

    const correct = calculateMatch(this.secretNumber, this.currentInput)
    this.history.push({ guess: this.currentInput, correct })
    this.turn++
    this.currentInput = ''

    // 滚动到最新猜测并显示高亮
    this.scrollHistoryToBottom()
    this.newGuessHighlightTime = this.newGuessHighlightDuration

    if (correct === this.difficulty) {
      this.handleWin()
      return
    }

    if (this.mode === 'ai') this.aiTurn()
  }

  aiTurn() {
    const game = globalThis.getGame()
    const speed = game.gameState.settings.aiAnimationSpeed || 'normal'

    this.aiThinking = true
    this.aiThinkingAnimTime = 0  // 重置动画计时器

    // 根据速度设置计算延迟时间
    const delayMap = {
      'slow': 2000,
      'normal': 1000,
      'fast': 500,
      'skip': 100
    }
    const animDelay = delayMap[speed] || 1000

    // 如果不是跳过模式，启动振动提示
    if (speed !== 'skip') {
      this.startAIThinkingTick()  // 开始思考提示
    }

    setTimeout(() => {
      const aiGuess = this.ai.selectBestGuess()
      const correct = game.core.calculateMatch(this.secretNumber, aiGuess)
      this.ai.recordGuess(aiGuess, correct)
      this.ai.filterPossibleNumbers(aiGuess, correct)
      this.aiGuess = aiGuess
      this.aiCandidateCount = this.ai.getPossibleCount()
      this.aiThinking = false
      this.stopAIThinkingTick()  // 停止思考提示

      // AI 思考完成提示
      game.audioManager.vibrate('short')

      if (correct === this.difficulty) this.handleLose()
    }, animDelay)
  }

  /**
   * 开始 AI 思考振动提示
   */
  startAIThinkingTick() {
    const game = globalThis.getGame()
    // 开始思考时立即振动一次
    game.audioManager.vibrate('short')

    // 每 300ms 振动一次作为"思考中"提示
    this.aiThinkingTickTimer = setInterval(() => {
      if (this.aiThinking) {
        game.audioManager.vibrate('short')
      }
    }, 300)
  }

  /**
   * 停止 AI 思考振动提示
   */
  stopAIThinkingTick() {
    if (this.aiThinkingTickTimer) {
      clearInterval(this.aiThinkingTickTimer)
      this.aiThinkingTickTimer = null
    }
  }

  handleWin() {
    this.stopTimer()
    this.gameOver = true
    const game = globalThis.getGame()
    const { isRecordBroken, isNewBestTurns, isNewBestDuration } = game.storageManager.updateStats(true, this.turn, this.difficulty, this.timeElapsed)
    game.storageManager.addGameRecord({ mode: this.mode, difficulty: this.difficulty, turns: this.turn, duration: this.timeElapsed, isWin: true })

    // 播放胜利音效
    game.audioManager.playWin()

    // 保存每日挑战成绩
    if (this.mode === 'daily' && this.dailyDate) {
      game.storageManager.saveDailyChallengeResult(this.dailyDate, this.turn, this.timeElapsed, this.difficulty)
    }

    if (this.sceneManager) {
      this.sceneManager.switchTo('result', { isWin: true, secretNumber: this.secretNumber, turns: this.turn, duration: this.timeElapsed, isRecordBroken, isNewBestTurns, isNewBestDuration, mode: this.mode, dailyDate: this.dailyDate })
    } else {
      console.error('[GameScene] sceneManager not initialized')
    }
  }

  handleLose() {
    this.stopTimer()
    this.gameOver = true
    const game = globalThis.getGame()

    // 播放失败音效
    game.audioManager.playLose()

    game.storageManager.updateStats(false)
    game.storageManager.addGameRecord({ mode: this.mode, difficulty: this.difficulty, turns: this.turn, duration: this.timeElapsed, isWin: false })
    if (this.sceneManager) {
      this.sceneManager.switchTo('result', { isWin: false, secretNumber: this.secretNumber, turns: this.turn, duration: this.timeElapsed })
    } else {
      console.error('[GameScene] sceneManager not initialized')
    }
  }

  /**
   * 处理难度切换确认对话框点击
   */
  handleDifficultyConfirmInput(event, game, width, height) {
    const dialogW = 280
    const dialogH = 190
    const dialogX = (width - dialogW) / 2
    const dialogY = (height - dialogH) / 2
    const btnW = 100
    const btnH = 40
    const btnY = dialogY + dialogH - 56
    const cancelX = dialogX + 20
    const confirmX = dialogX + dialogW - btnW - 20

    // 复选框点击
    const checkbox = this.elements.difficultyCheckbox
    if (checkbox && game.inputManager.hitTest(event, checkbox.x, checkbox.y, checkbox.w, checkbox.h)) {
      this.skipDifficultyConfirmChecked = !this.skipDifficultyConfirmChecked
      game.audioManager.vibrate('short')
      return
    }

    // 取消按钮
    if (game.inputManager.hitTest(event, cancelX, btnY, btnW, btnH)) {
      game.audioManager.vibrate('short')
      this.cancelDifficultyChange()
      return
    }

    // 确认按钮
    if (game.inputManager.hitTest(event, confirmX, btnY, btnW, btnH)) {
      game.audioManager.vibrate('long')
      this.confirmDifficultyChange()
    }
  }
}

module.exports = GameScene