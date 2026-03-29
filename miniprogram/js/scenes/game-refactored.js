/**
 * 游戏场景 - 极简风格重构版
 *
 * 设计规范：
 * - 玻璃态卡片容器
 * - 4px基格间距系统
 * - Indigo强调色（#6366f1）
 * - 终端风格AI思考区
 * - 卡片式历史记录
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
    this.aiInitialCandidateCount = 0
    this.aiGuess = ''
    this.aiThinkingAnimTime = 0
    this.elements = {}
    this.timer = 0
    this.pressedKey = null
    this.ripples = []
    this.isPaused = false
    this.showPauseDialog = false

    // 主题
    this.theme = null

    // 动画
    this.inputFocusAnim = 0
    this.historyScrollOffset = 0
  }

  onEnter(params = {}) {
    const game = globalThis.getGame()
    this.mode = params.mode || 'ai'
    this.difficulty = game.gameState.settings.difficulty

    // 初始化主题
    const Theme = require('../engine/theme')
    this.theme = Theme.helpers.getColors()

    this.initGame()
    this.calculateLayout()
  }

  onExit() {
    this.stopTimer()
  }

  initGame() {
    const game = globalThis.getGame()
    const { generateSecretNumber, generateDailySecret, NumberGuessingAI } = game.core

    if (this.mode === 'daily') {
      const dailyData = generateDailySecret(this.difficulty)
      this.secretNumber = dailyData.secret
      this.dailyDate = dailyData.date
      this.ai = null
    } else {
      this.secretNumber = generateSecretNumber(this.difficulty, true)
      this.dailyDate = null

      if (this.mode === 'ai') {
        this.ai = new NumberGuessingAI(this.difficulty)
        this.aiCandidateCount = this.ai.getPossibleCount()
        this.aiInitialCandidateCount = this.aiCandidateCount
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
    this.inputFocusAnim = 0
    this.historyScrollOffset = 0
  }

  calculateLayout() {
    const game = globalThis.getGame()
    const { width, height } = game.renderer

    const systemInfo = wx.getSystemInfoSync()
    const safeArea = systemInfo.safeArea || { top: 0, bottom: height, left: 0, right: width }

    const safeTop = safeArea.top
    const safeBottom = safeArea.bottom
    const safeLeft = safeArea.left
    const safeRight = safeArea.right

    const centerX = (safeLeft + safeRight) / 2
    const safeWidth = safeRight - safeLeft
    const safeHeight = safeBottom - safeTop

    // 4px基格
    const sp = {
      xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48
    }

    // 头部区域（状态栏）
    const headerHeight = 44
    const headerY = safeTop + sp.md

    // AI思考区域（终端风格）
    const aiSectionHeight = this.mode === 'ai' ? 80 : 0
    const aiSectionY = headerY + headerHeight + sp.md

    // 历史记录区域（玻璃态卡片）
    const historyCardPadding = sp.md
    const historyCardX = safeLeft + sp.lg
    const historyCardWidth = safeWidth - sp.lg * 2
    const historyItemHeight = 40
    const maxHistoryItems = 5
    const historyCardHeight = historyCardPadding * 2 + maxHistoryItems * historyItemHeight
    const historyCardY = aiSectionY + (this.mode === 'ai' ? aiSectionHeight + sp.md : 0)

    // 数字输入区域
    const digitSize = 56
    const digitGap = sp.sm
    const inputSectionY = historyCardY + historyCardHeight + sp.lg

    // 键盘区域
    const keyboardPadding = sp.lg
    const keySize = (safeWidth - keyboardPadding * 2 - sp.sm * 2) / 3
    const keyGap = sp.sm
    const keyboardY = safeBottom - sp.xxl - (keySize + keyGap) * 4 - keyGap

    this.elements = {
      // 安全区域
      safeArea: { top: safeTop, bottom: safeBottom, left: safeLeft, right: safeRight },

      // 头部
      header: { y: headerY, h: headerHeight },

      // 暂停按钮
      pauseBtn: { x: safeRight - 44, y: headerY, w: 44, h: 44 },

      // AI思考区域
      aiSection: this.mode === 'ai' ? { y: aiSectionY, h: aiSectionHeight } : null,

      // 历史记录卡片
      historyCard: { x: historyCardX, y: historyCardY, w: historyCardWidth, h: historyCardHeight },
      historyItemHeight,

      // 数字输入
      inputSection: { y: inputSectionY },
      digitSize,
      digitGap,

      // 键盘
      keyboard: { y: keyboardY, padding: keyboardPadding, keySize, keyGap },

      // 按钮
      buttons: []
    }

    // 计算数字输入框位置
    const totalDigitWidth = this.difficulty * digitSize + (this.difficulty - 1) * digitGap
    const digitStartX = centerX - totalDigitWidth / 2

    this.elements.digitBoxes = []
    for (let i = 0; i < this.difficulty; i++) {
      this.elements.digitBoxes.push({
        x: digitStartX + i * (digitSize + digitGap),
        y: inputSectionY,
        size: digitSize,
        index: i
      })
    }

    // 计算键盘按键位置
    const keyboardRows = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['⌫', '0', '✓']
    ]

    this.elements.keys = []
    const kb = this.elements.keyboard
    const startX = safeLeft + kb.padding

    keyboardRows.forEach((row, rowIndex) => {
      row.forEach((key, colIndex) => {
        this.elements.keys.push({
          x: startX + colIndex * (kb.keySize + kb.keyGap),
          y: kb.y + rowIndex * (kb.keySize + kb.keyGap),
          size: kb.keySize,
          label: key,
          isSpecial: key === '⌫' || key === '✓',
          variant: key === '✓' ? 'success' : key === '⌫' ? 'danger' : 'default'
        })
      })
    })
  }

  // ... 游戏逻辑方法（update, render, handleInput等）将在后续实现

  update(deltaTime) {
    this.animationOffset += deltaTime * 0.002
    this.breathOffset += deltaTime * 0.003
    this.inputFocusAnim += deltaTime * 0.005

    // 更新计时器
    if (this.gameStarted && !this.gameOver && !this.isPaused) {
      this.timer += deltaTime
      if (this.timer >= 1000) {
        this.timeElapsed++
        this.timer -= 1000
      }
    }

    // AI思考动画
    if (this.aiThinking) {
      this.aiThinkingAnimTime += deltaTime
    }
  }

  render(renderer) {
    const game = globalThis.getGame()
    const theme = renderer.currentTheme
    const { width, height } = game.renderer
    const ui = renderer.ui

    // 绘制渐变背景
    renderer.drawGradientBackground()

    // 绘制头部状态栏
    this.renderHeader(renderer, ui, theme)

    // 绘制AI思考区域（如果是AI模式）
    if (this.mode === 'ai' && this.ai) {
      this.renderAIThinking(renderer, ui, theme)
    }

    // 绘制历史记录卡片
    this.renderHistory(renderer, ui, theme)

    // 绘制数字输入区域
    this.renderDigitInput(renderer, ui, theme)

    // 绘制键盘
    this.renderKeyboard(renderer, ui, theme)

    // 绘制暂停对话框（如果需要）
    if (this.showPauseDialog) {
      this.renderPauseDialog(renderer, ui, theme)
    }
  }

  renderHeader(renderer, ui, theme) {
    const { width } = renderer
    const header = this.elements.header

    // 绘制返回按钮
    ui.drawIconButton(20, header.y, 44, '‹', {
      style: 'ghost'
    })

    // 绘制模式标题
    const modeText = this.mode === 'ai' ? 'AI 对战' : this.mode === 'daily' ? '每日挑战' : '对战模式'
    renderer.drawText(modeText, width / 2, header.y + 22, {
      fontSize: 18,
      color: theme.text.primary,
      align: 'center',
      bold: true
    })

    // 绘制暂停按钮
    const pauseBtn = this.elements.pauseBtn
    ui.drawIconButton(pauseBtn.x, pauseBtn.y, pauseBtn.w, '⏸', {
      style: 'ghost'
    })

    // 绘制计时器（如果游戏开始）
    if (this.gameStarted) {
      const minutes = Math.floor(this.timeElapsed / 60)
      const seconds = this.timeElapsed % 60
      const timeText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      renderer.drawText(timeText, width / 2, header.y + 50, {
        fontSize: 14,
        color: theme.text.muted,
        align: 'center'
      })
    }
  }

  renderAIThinking(renderer, ui, theme) {
    if (!this.aiThinking) return

    const section = this.elements.aiSection
    const cardPadding = 16

    // 绘制终端风格卡片
    ui.drawGlassCard(section.x + 16, section.y, section.w - 32, section.h, {
      fill: 'rgba(10, 10, 10, 0.8)',
      stroke: 'rgba(99, 102, 241, 0.3)',
      radius: 8
    })

    // 绘制终端标题栏
    const { ctx, pixelRatio } = renderer
    const scale = pixelRatio
    ctx.save()
    ctx.fillStyle = 'rgba(99, 102, 241, 0.2)'
    ctx.fillRect((section.x + 16) * scale, (section.y + 4) * scale, (section.w - 32) * scale, 24 * scale)
    ctx.restore()

    // 绘制AI状态文字
    const thinkingDots = '.'.repeat(Math.floor(this.aiThinkingAnimTime / 500) % 4)
    renderer.drawText(`AI 思考中${thinkingDots}`, section.x + 32, section.y + 36, {
      fontSize: 12,
      color: theme.accent.light,
      align: 'left'
    })

    // 绘制候选数量
    if (this.aiCandidateCount > 0) {
      const progress = 1 - (this.aiCandidateCount / this.aiInitialCandidateCount)
      const progressText = `${Math.round(progress * 100)}%`
      renderer.drawText(`排除进度: ${progressText}`, section.x + 32, section.y + 58, {
        fontSize: 11,
        color: theme.text.muted,
        align: 'left'
      })
    }
  }

  renderHistory(renderer, ui, theme) {
    const card = this.elements.historyCard

    // 绘制玻璃态卡片
    ui.drawGlassCard(card.x, card.y, card.w, card.h, {
      radius: 12,
      shadow: true
    })

    // 绘制标题
    renderer.drawText('猜测记录', card.x + 16, card.y + 24, {
      fontSize: 14,
      color: theme.text.secondary,
      align: 'left',
      bold: true
    })

    // 绘制分割线
    ui.drawDivider(card.x + 16, card.y + 40, card.w - 32)

    // 绘制历史记录列表
    const itemHeight = this.elements.historyItemHeight
    const maxItems = Math.min(this.history.length, 5)
    const startIndex = Math.max(0, this.history.length - 5)

    for (let i = 0; i < maxItems; i++) {
      const historyIndex = startIndex + i
      const item = this.history[historyIndex]
      const itemY = card.y + 48 + i * itemHeight

      // 绘制交替背景
      if (i % 2 === 0) {
        const { ctx, pixelRatio } = renderer
        const scale = pixelRatio
        ctx.save()
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)'
        ctx.fillRect(card.x * scale, itemY * scale, card.w * scale, itemHeight * scale)
        ctx.restore()
      }

      // 绘制回合数
      renderer.drawText(`#${historyIndex + 1}`, card.x + 16, itemY + itemHeight / 2, {
        fontSize: 12,
        color: theme.text.muted,
        align: 'left'
      })

      // 绘制猜测数字
      renderer.drawText(item.guess, card.x + 60, itemY + itemHeight / 2, {
        fontSize: 16,
        color: theme.text.primary,
        align: 'left',
        bold: true
      })

      // 绘制结果
      const resultText = `${item.result.A}A${item.result.B}B`
      renderer.drawText(resultText, card.x + card.w - 16, itemY + itemHeight / 2, {
        fontSize: 14,
        color: item.result.A === this.difficulty ? theme.status.success : theme.accent.light,
        align: 'right',
        bold: true
      })
    }

    // 空状态提示
    if (this.history.length === 0) {
      renderer.drawText('还没有猜测记录', card.x + card.w / 2, card.y + card.h / 2 + 10, {
        fontSize: 13,
        color: theme.text.muted,
        align: 'center'
      })
    }
  }

  renderDigitInput(renderer, ui, theme) {
    const section = this.elements.inputSection
    const digitBoxes = this.elements.digitBoxes

    // 绘制标签
    renderer.drawText('输入你的猜测', section.y - 24, section.y - 24, {
      fontSize: 13,
      color: theme.text.muted,
      align: 'center'
    })

    // 绘制数字输入框
    digitBoxes.forEach((box, index) => {
      const value = this.currentInput[index] || ''
      const isFocused = this.currentInput.length === index

      ui.drawDigitInput(box.x, box.y, box.size, value, {
        focused: isFocused,
        filled: value !== '',
        error: false,
        success: false
      })
    })
  }

  renderKeyboard(renderer, ui, theme) {
    const kb = this.elements.keyboard

    // 绘制键盘背景（玻璃态）
    ui.drawGlassCard(
      kb.x - kb.padding + 8,
      kb.y - kb.padding + 8,
      (kb.keySize + kb.keyGap) * 3 - kb.keyGap + kb.padding * 2 - 16,
      (kb.keySize + kb.keyGap) * 4 - kb.keyGap + kb.padding * 2 - 16,
      {
        radius: 16,
        fill: 'rgba(15, 23, 42, 0.5)'
      }
    )

    // 绘制按键
    this.elements.keys.forEach(key => {
      const isPressed = this.pressedKey === key.label

      ui.drawKey(key.x, key.y, key.size, key.label, {
        pressed: isPressed,
        special: key.isSpecial,
        variant: key.variant
      })
    })
  }

  renderPauseDialog(renderer, ui, theme) {
    const { width, height } = renderer
    const dialogWidth = 280
    const dialogHeight = 200
    const dialogX = width / 2 - dialogWidth / 2
    const dialogY = height / 2 - dialogHeight / 2

    // 绘制遮罩
    const { ctx, pixelRatio } = renderer
    const scale = pixelRatio
    ctx.save()
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    ctx.fillRect(0, 0, width * scale, height * scale)
    ctx.restore()

    // 绘制对话框
    ui.drawGlassCard(dialogX, dialogY, dialogWidth, dialogHeight, {
      radius: 16,
      shadow: true
    })

    // 标题
    renderer.drawText('游戏暂停', dialogX + dialogWidth / 2, dialogY + 40, {
      fontSize: 20,
      color: theme.text.primary,
      align: 'center',
      bold: true
    })

    // 按钮
    const btnWidth = 100
    const btnHeight = 40
    const btnY = dialogY + dialogHeight - 70

    ui.drawPrimaryButton(dialogX + 30, btnY, btnWidth, btnHeight, '继续', {
      pressed: this.pressedButton === 'resume'
    })

    ui.drawSecondaryButton(dialogX + dialogWidth - 30 - btnWidth, btnY, btnWidth, btnHeight, '退出', {
      pressed: this.pressedButton === 'quit'
    })
  }

  // ========== 计时器方法 ==========

  startTimer() {
    if (this.timer) return
    this.timer = setInterval(() => {
      if (!this.isPaused && !this.gameOver) {
        this.timeElapsed++
      }
    }, 1000)
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  // ========== 输入处理方法 ==========

  handleInput(events) {
    const game = globalThis.getGame()

    events.forEach(event => {
      if (event.type === 'tap') {
        // 处理暂停对话框输入
        if (this.showPauseDialog) {
          this.handlePauseDialogInput(event)
          return
        }

        // 检查暂停按钮点击
        if (this.elements.pauseBtn) {
          const btn = this.elements.pauseBtn
          if (game.inputManager.hitTest(event, btn.x, btn.y, btn.w, btn.h)) {
            this.pauseGame()
            return
          }
        }

        // 处理键盘输入
        this.handleKeyboardInput(event)

        // 检查返回按钮
        if (this.elements.backBtn) {
          const btn = this.elements.backBtn
          if (game.inputManager.hitTest(event, btn.x, btn.y, btn.w, btn.h)) {
            this.sceneManager.switchTo('menu')
            return
          }
        }
      }
    })

    // 处理触摸按下状态
    if (game.inputManager.touchStart) {
      this.pressedKey = null
      this.elements.keys.forEach((key, index) => {
        if (game.inputManager.hitTest(game.inputManager.touchStart, key.x, key.y, key.size, key.size)) {
          this.pressedKey = index
        }
      })
    }
  }

  handleKeyboardInput(event) {
    const game = globalThis.getGame()

    this.elements.keys.forEach((key, index) => {
      if (game.inputManager.hitTest(event, key.x, key.y, key.size, key.size)) {
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
  }

  handlePauseDialogInput(event) {
    const game = globalThis.getGame()

    const dialogWidth = 280
    const dialogHeight = 200
    const dialogX = this.elements.centerX - dialogWidth / 2
    const dialogY = this.elements.centerY - dialogHeight / 2

    const btnWidth = 100
    const btnHeight = 40
    const btnY = dialogY + dialogHeight - 70

    // 继续按钮
    const resumeX = dialogX + 30
    if (game.inputManager.hitTest(event, resumeX, btnY, btnWidth, btnHeight)) {
      this.resumeGame()
      return
    }

    // 退出按钮
    const quitX = dialogX + dialogWidth - 30 - btnWidth
    if (game.inputManager.hitTest(event, quitX, btnY, btnWidth, btnHeight)) {
      this.showPauseDialog = false
      this.isPaused = false
      this.stopTimer()
      this.sceneManager.switchTo('menu')
    }
  }

  // ========== 游戏逻辑方法 ==========

  inputDigit(digit) {
    if (this.currentInput.length >= this.difficulty) return
    if (!this.gameStarted) {
      this.gameStarted = true
      this.startTimer()
    }
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

    const result = calculateMatch(this.secretNumber, this.currentInput)
    this.history.push({ guess: this.currentInput, result })
    this.turn++
    this.currentInput = ''

    // 检查胜利
    if (result.A === this.difficulty) {
      this.handleWin()
      return
    }

    // AI回合
    if (this.mode === 'ai' && this.ai) {
      this.aiTurn()
    }
  }

  aiTurn() {
    const game = globalThis.getGame()
    const speed = game.gameState.settings.aiAnimationSpeed || 'normal'

    this.aiThinking = true
    this.aiThinkingAnimTime = 0

    // 根据速度设置延迟
    const delayMap = {
      'slow': 2000,
      'normal': 1000,
      'fast': 500,
      'skip': 100
    }
    const delay = delayMap[speed] || 1000

    setTimeout(() => {
      const aiGuess = this.ai.selectBestGuess()
      const result = game.core.calculateMatch(this.secretNumber, aiGuess)

      this.ai.recordGuess(aiGuess, result)
      this.ai.filterPossibleNumbers(aiGuess, result)

      this.aiGuess = aiGuess
      this.aiCandidateCount = this.ai.getPossibleCount()
      this.aiThinking = false

      // AI猜测记录
      this.history.push({ guess: aiGuess, result, isAI: true })
      this.turn++

      // 检查AI胜利
      if (result.A === this.difficulty) {
        this.handleLoss()
      }
    }, delay)
  }

  handleWin() {
    this.stopTimer()
    this.gameOver = true

    const game = globalThis.getGame()
    const { isRecordBroken } = game.storageManager.updateStats(true, this.turn, this.difficulty, this.timeElapsed)
    game.storageManager.addGameRecord({
      mode: this.mode,
      difficulty: this.difficulty,
      turns: this.turn,
      duration: this.timeElapsed,
      isWin: true
    })

    // 播放胜利音效
    game.audioManager.playWin()

    // 跳转到结果场景
    this.sceneManager.switchTo('result', {
      isWin: true,
      secretNumber: this.secretNumber,
      turns: this.turn,
      duration: this.timeElapsed,
      isRecordBroken,
      mode: this.mode
    })
  }

  handleLoss() {
    this.stopTimer()
    this.gameOver = true

    const game = globalThis.getGame()
    game.storageManager.updateStats(false)
    game.storageManager.addGameRecord({
      mode: this.mode,
      difficulty: this.difficulty,
      turns: this.turn,
      duration: this.timeElapsed,
      isWin: false
    })

    // 播放失败音效
    game.audioManager.playLose()

    // 跳转到结果场景
    this.sceneManager.switchTo('result', {
      isWin: false,
      secretNumber: this.secretNumber,
      turns: this.turn,
      duration: this.timeElapsed
    })
  }

  pauseGame() {
    this.isPaused = true
    this.showPauseDialog = true
    this.stopTimer()
  }

  resumeGame() {
    this.isPaused = false
    this.showPauseDialog = false
    if (this.gameStarted && !this.gameOver) {
      this.startTimer()
    }
  }
}

module.exports = GameScene
