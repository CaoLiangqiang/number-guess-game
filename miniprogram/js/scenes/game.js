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
  }

  onEnter(params = {}) {
    const game = globalThis.getGame()
    this.mode = params.mode || 'ai'
    this.difficulty = game.gameState.settings.difficulty
    this.initGame()
    this.calculateLayout()
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
    const { generateSecretNumber, NumberGuessingAI } = game.core

    this.secretNumber = generateSecretNumber(this.difficulty, true)
    this.currentInput = ''
    this.history = []
    this.turn = 0
    this.timeElapsed = 0
    this.gameStarted = false
    this.gameOver = false

    if (this.mode === 'ai') {
      this.ai = new NumberGuessingAI(this.difficulty)
      this.aiCandidateCount = this.ai.getPossibleCount()
      this.aiInitialCandidateCount = this.aiCandidateCount  // 保存初始值
    } else {
      this.ai = null
    }
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
      renderer.drawText('🎯 准备开始', safeLeft + margin + 20, y + 22, { fontSize: 16, color: theme.textPrimary, baseline: 'middle' })
      // 最佳记录和平均用时提示
      const bestTurns = game.storageManager.getBestTurns(this.difficulty)
      const avgDuration = game.storageManager.getAverageDuration(this.difficulty)
      const hints = []
      if (bestTurns !== null) {
        hints.push(`🏆 最佳${bestTurns}回合`)
      }
      if (avgDuration !== null) {
        const minutes = Math.floor(avgDuration / 60)
        const seconds = avgDuration % 60
        const timeStr = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`
        hints.push(`⏱️ 平均${timeStr}`)
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
      renderer.drawRect(safeLeft + margin, y, sectionWidth, 70, { fill: theme.bgSecondary, radius: 16 })

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

      // 候选数文字
      const candText = `📊 剩余候选: ${this.aiCandidateCount}`
      renderer.drawText(candText, safeRight - margin - 20, y + 28, { fontSize: 12, color: theme.textSecondary, align: 'right' })
    } else if (this.aiGuess) {
      renderer.drawRect(safeLeft + margin, y, sectionWidth, 60, { fill: theme.bgSecondary, radius: 16 })
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
      renderer.drawRect(safeLeft + margin, y, sectionWidth, 60, { fill: theme.bgSecondary, radius: 16 })
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

    const itemHeight = 48
    const listY = y + 24
    const listH = this.elements.historySection.h - 30

    renderer.drawText('📋 猜测历史', safeLeft + margin, y, { fontSize: 14, color: theme.textSecondary })
    renderer.drawRect(safeLeft + margin, listY, sectionWidth, listH, { fill: theme.bgSecondary, radius: 12 })

    this.history.forEach((item, index) => {
      const itemY = listY + 8 + index * (itemHeight + 8)
      if (itemY + itemHeight > listY + listH) return
      renderer.drawHistoryItem(safeLeft + margin + 8, itemY, sectionWidth - 16, item.guess, item.correct, { height: itemHeight, digitSize: 28, digitCount: this.difficulty })
    })

    if (this.history.length === 0) {
      const centerX = (safeLeft + safeRight) / 2
      renderer.drawText('👉 开始猜测吧！', centerX, listY + listH / 2, { fontSize: 16, color: theme.textMuted, align: 'center', baseline: 'middle' })
    }
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
        // 如果显示确认对话框，优先处理对话框输入
        if (this.showDifficultyConfirm) {
          this.handleDifficultyConfirmInput(event, game, width, height)
          return
        }

        if (this.gameOver) return

        this.pressedKey = null

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
              game.audioManager.vibrate('short')
            } else if (key.label === '✓') {
              this.submitGuess()
            } else {
              this.inputDigit(key.label)
              game.audioManager.vibrate('short')
            }
          }
        })
      } else if (event.type === 'swipe') {
        this.pressedKey = null
        this.pressedItem = null
      }
    })

    // 检测触摸按下状态
    if (game.inputManager.touchStart) {
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

  inputDigit(digit) {
    if (this.currentInput.length >= this.difficulty) return
    if (!this.gameStarted) { this.gameStarted = true; this.startTimer() }
    this.currentInput += digit
  }

  deleteDigit() {
    this.currentInput = this.currentInput.slice(0, -1)
  }

  submitGuess() {
    const game = globalThis.getGame()
    const { validateInput, calculateMatch } = game.core

    const validation = validateInput(this.currentInput, this.difficulty)
    if (!validation.valid) {
      wx.showToast({ title: validation.error, icon: 'none' })
      return
    }

    const correct = calculateMatch(this.secretNumber, this.currentInput)
    this.history.push({ guess: this.currentInput, correct })
    this.turn++
    this.currentInput = ''

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
    if (this.sceneManager) {
      this.sceneManager.switchTo('result', { isWin: true, secretNumber: this.secretNumber, turns: this.turn, duration: this.timeElapsed, isRecordBroken, isNewBestTurns, isNewBestDuration })
    } else {
      console.error('[GameScene] sceneManager not initialized')
    }
  }

  handleLose() {
    this.stopTimer()
    this.gameOver = true
    const game = globalThis.getGame()
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