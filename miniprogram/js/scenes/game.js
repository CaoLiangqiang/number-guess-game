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

    // 波纹效果
    this.ripples = []

    // 颜色过渡动画
    this.currentColor = { r: 99, g: 102, b: 241 }  // 默认主题色 #6366f1
    this.targetColor = { r: 99, g: 102, b: 241 }
    this.colorTransitionSpeed = 0.05  // 每帧过渡比例
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
    const digitSize = 56
    const digitGap = 8

    this.elements = {
      statusBar: { y: 20, h: 44 },
      aiSection: { y: 80, h: 60 },
      historySection: { y: 160, h: height - 400 },
      inputSection: { y: height - 230 },
      digitBoxes: [],
      keyboard: { y: height - 160, keys: [] }
    }

    // 数字格子
    const totalDigitWidth = this.difficulty * digitSize + (this.difficulty - 1) * digitGap
    const startX = centerX - totalDigitWidth / 2
    for (let i = 0; i < this.difficulty; i++) {
      this.elements.digitBoxes.push({
        x: startX + i * (digitSize + digitGap),
        y: this.elements.inputSection.y + 20,
        size: digitSize
      })
    }

    // 键盘
    const keySize = 44
    const keyGap = 8
    const keyboardRows = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['删除', '0', '确认']]
    const keyboardY = this.elements.keyboard.y
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

    this.secretNumber = generateSecretNumber(this.difficulty, false)
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
  }

  renderStatusBar(renderer) {
    const game = globalThis.getGame()
    const theme = renderer.currentTheme
    const { width } = renderer
    const y = this.elements.statusBar.y

    renderer.drawRect(12, y, width - 24, 44, { fill: theme.bgSecondary, radius: 12 })
    renderer.drawText(`回合 ${this.turn}`, 32, y + 22, { fontSize: 16, color: theme.textPrimary, baseline: 'middle' })
    renderer.drawText(game.core.formatTime(this.timeElapsed), width / 2, y + 22, { fontSize: 16, color: theme.textPrimary, align: 'center', baseline: 'middle' })
    renderer.drawText(`${this.difficulty}位`, width - 32, y + 22, { fontSize: 16, color: theme.textSecondary, align: 'right', baseline: 'middle' })
  }

  renderAISection(renderer) {
    const theme = renderer.currentTheme
    const y = this.elements.aiSection.y
    const { width } = renderer

    if (this.aiThinking) {
      // 背景 - 带发光效果
      renderer.drawRect(12, y, width - 24, 70, { fill: theme.bgSecondary, radius: 16 })

      // 获取动态颜色
      const progressColor = this.getProgressColor()

      // 顶部高亮条
      const pulseAlpha = 0.3 + Math.sin(this.aiThinkingAnimTime * 0.003) * 0.2
      renderer.drawRect(12, y, width - 24, 3, { fill: progressColor, radius: 1.5 })

      // AI 图标和文字
      const text = 'AI 分析中'
      const dots = this.getAnimatedDots()
      renderer.drawText(text + dots, 32, y + 28, { fontSize: 16, color: progressColor, bold: true })

      // 候选数量进度条
      const progressWidth = width - 64
      const progressHeight = 4
      const progressY = y + 50

      // 进度条背景
      renderer.drawRect(32, progressY, progressWidth, progressHeight, { fill: theme.bgCard, radius: 2 })

      // 进度条填充（动态宽度）
      const animProgress = (Math.sin(this.aiThinkingAnimTime * 0.002) + 1) / 2
      const fillWidth = progressWidth * (0.3 + animProgress * 0.5)
      renderer.drawRect(32, progressY, fillWidth, progressHeight, { fill: progressColor, radius: 2 })

      // 候选数文字
      const candText = `剩余候选: ${this.aiCandidateCount}`
      renderer.drawText(candText, width - 32, y + 28, { fontSize: 12, color: theme.textSecondary, align: 'right' })
    } else if (this.aiGuess) {
      renderer.drawRect(12, y, width - 24, 60, { fill: theme.bgSecondary, radius: 16 })
      renderer.drawText('AI 猜测', 32, y + 22, { fontSize: 14, color: theme.textSecondary })
      renderer.drawText(this.aiGuess, 120, y + 20, { fontSize: 22, color: theme.accent, bold: true })

      // 显示结果
      const lastResult = this.history[this.history.length - 1]
      if (lastResult) {
        const resultText = `${lastResult.hits}A${lastResult.blows}B`
        renderer.drawText(resultText, width - 32, y + 20, { fontSize: 16, color: theme.textPrimary, align: 'right' })
      }
    }
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
    const itemHeight = 48
    const listY = y + 24
    const listH = this.elements.historySection.h - 30

    renderer.drawText('猜测历史', 20, y, { fontSize: 14, color: theme.textSecondary })
    renderer.drawRect(12, listY, width - 24, listH, { fill: theme.bgSecondary, radius: 12 })

    this.history.forEach((item, index) => {
      const itemY = listY + 8 + index * (itemHeight + 8)
      if (itemY + itemHeight > listY + listH) return
      renderer.drawHistoryItem(20, itemY, width - 40, item.guess, item.hits, item.blows, { height: itemHeight, digitSize: 28 })
    })

    if (this.history.length === 0) {
      renderer.drawText('开始猜测吧！', width / 2, listY + listH / 2, { fontSize: 16, color: theme.textMuted, align: 'center', baseline: 'middle' })
    }
  }

  renderInput(renderer) {
    const theme = renderer.currentTheme
    const y = this.elements.inputSection.y
    const { width } = renderer

    renderer.drawRect(12, y, width - 24, 80, { fill: theme.bgSecondary, radius: 12 })
    this.elements.digitBoxes.forEach((box, index) => {
      renderer.drawDigitBox(box.x, box.y, box.size, this.currentInput[index] || '', { active: index === this.currentInput.length, radius: 10 })
    })
  }

  renderKeyboard(renderer) {
    const theme = renderer.currentTheme
    const keys = this.elements.keyboard.keys
    const usedDigits = this.currentInput.split('')

    keys.forEach((key, index) => {
      let type = 'default'
      let disabled = false
      if (key.label === '删除') type = 'action'
      else if (key.label === '确认') type = 'primary'
      else if (usedDigits.includes(key.label)) disabled = true

      renderer.drawKey(key.x, key.y, key.w, key.h, key.label, {
        type, disabled, radius: 8,
        pressed: this.pressedKey === index && !disabled
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

    events.forEach(event => {
      if (event.type === 'tap' && !this.gameOver) {
        this.pressedKey = null
        this.elements.keyboard.keys.forEach((key, index) => {
          if (game.inputManager.hitTest(event, key.x, key.y, key.w, key.h)) {
            // 添加波纹效果
            const rippleX = key.x + key.w / 2
            const rippleY = key.y + key.h / 2
            let rippleColor = theme.accent
            if (key.label === '确认') rippleColor = theme.success
            else if (key.label === '删除') rippleColor = theme.error
            this.addRipple(rippleX, rippleY, rippleColor)

            if (key.label === '删除') {
              this.deleteDigit()
              game.audioManager.vibrate('short')
            } else if (key.label === '确认') {
              this.submitGuess()
            } else {
              if (!this.currentInput.includes(key.label)) {
                this.inputDigit(key.label)
                game.audioManager.vibrate('short')
              }
            }
          }
        })
      } else if (event.type === 'swipe') {
        this.pressedKey = null
      }
    })

    // 检测触摸按下状态
    if (game.inputManager.touchStart && !this.gameOver) {
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
    const { validateInputStrict, calculateHint } = game.core

    const validation = validateInputStrict(this.currentInput, this.difficulty)
    if (!validation.valid) {
      wx.showToast({ title: validation.error, icon: 'none' })
      return
    }

    const result = calculateHint(this.secretNumber, this.currentInput)
    this.history.push({ guess: this.currentInput, hits: result.hits, blows: result.blows })
    this.turn++
    this.currentInput = ''

    if (result.hits === this.difficulty) {
      this.handleWin()
      return
    }

    if (this.mode === 'ai') this.aiTurn()
  }

  aiTurn() {
    const game = globalThis.getGame()
    this.aiThinking = true
    this.aiThinkingAnimTime = 0  // 重置动画计时器
    this.startAIThinkingTick()  // 开始思考提示

    setTimeout(() => {
      const aiGuess = this.ai.selectBestGuess()
      const result = game.core.calculateHint(this.secretNumber, aiGuess)
      this.ai.recordGuess(aiGuess, result.hits, result.blows)
      this.ai.filterPossibleNumbers(aiGuess, result.hits, result.blows)
      this.aiGuess = aiGuess
      this.aiCandidateCount = this.ai.getPossibleCount()
      this.aiThinking = false
      this.stopAIThinkingTick()  // 停止思考提示

      // AI 思考完成提示
      game.audioManager.vibrate('short')

      if (result.hits === this.difficulty) this.handleLose()
    }, 1000)
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
    game.storageManager.updateStats(true)
    game.storageManager.addGameRecord({ mode: this.mode, difficulty: this.difficulty, turns: this.turn, duration: this.timeElapsed, isWin: true })
    if (this.sceneManager) {
      this.sceneManager.switchTo('result', { isWin: true, secretNumber: this.secretNumber, turns: this.turn, duration: this.timeElapsed })
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
}

module.exports = GameScene