/**
 * 设置场景
 * 完整的设置选项和游戏统计展示
 */

class SettingsScene {
  constructor() {
    this.sceneManager = null
    this.elements = {}
    this.pressedItem = null
    this.showConfirm = false // 是否显示确认对话框
  }

  onEnter() {
    this.calculateLayout()
    this.pressedItem = null
  }

  onExit() {
    globalThis.getGame().saveUserData()
  }

  calculateLayout() {
    const game = globalThis.getGame()
    const { width, height } = game.renderer
    const centerX = width / 2
    const itemHeight = 56
    const gap = 8

    this.elements = {
      title: { x: centerX, y: 40 },
      // 设置项
      difficulty: { y: 100, h: itemHeight, options: [3, 4, 5] },
      transition: { y: 100 + itemHeight + gap, h: itemHeight, options: ['fade', 'slide', 'scale'], labels: ['淡入', '滑动', '缩放'] },
      sound: { y: 100 + (itemHeight + gap) * 2, h: itemHeight },
      vibration: { y: 100 + (itemHeight + gap) * 3, h: itemHeight },
      // 统计区域
      statsTitle: { y: 100 + (itemHeight + gap) * 4 + 16 },
      stats: { y: 100 + (itemHeight + gap) * 4 + 48, h: 80 },
      resetBtn: { x: centerX - 60, y: 100 + (itemHeight + gap) * 4 + 48 + 80 + gap, w: 120, h: 36 },
      // 关于
      about: { y: height - 160 },
      // 按钮
      backBtn: { x: centerX - 80, y: height - 80, w: 160, h: 44, text: '返回' }
    }
  }

  update(deltaTime) {}

  render(renderer) {
    const game = globalThis.getGame()
    const theme = renderer.currentTheme
    const { width, height } = renderer
    const settings = game.gameState.settings
    const stats = game.gameState.stats

    renderer.drawGradientBackground()
    renderer.drawText('设置', this.elements.title.x, this.elements.title.y, {
      fontSize: 28,
      color: theme.textPrimary,
      align: 'center',
      bold: true
    })

    // 难度设置
    this.renderDifficultySetting(renderer, settings, theme, width)

    // 过渡效果设置
    this.renderTransitionSetting(renderer, settings, theme, width)

    // 音效设置
    this.renderToggleSetting(renderer, '音效', settings.soundEnabled, this.elements.sound, theme, width, 'sound')

    // 震动设置
    this.renderToggleSetting(renderer, '震动', settings.vibrationEnabled !== false, this.elements.vibration, theme, width, 'vibration')

    // 统计区域
    this.renderStats(renderer, stats, theme, width)

    // 重置按钮
    this.renderResetButton(renderer, theme, width)

    // 关于信息
    this.renderAbout(renderer, theme, width)

    // 返回按钮
    renderer.drawButton(
      this.elements.backBtn.x,
      this.elements.backBtn.y,
      this.elements.backBtn.w,
      this.elements.backBtn.h,
      this.elements.backBtn.text,
      { type: 'primary', radius: 12 }
    )

    // 确认对话框
    this.renderConfirmDialog(renderer, theme, width, height)
  }

  /**
   * 渲染难度设置
   */
  renderDifficultySetting(renderer, settings, theme, width) {
    const diffY = this.elements.difficulty.y
    const diffH = this.elements.difficulty.h

    // 背景
    renderer.drawRect(20, diffY, width - 40, diffH, { fill: theme.bgSecondary, radius: 12 })

    // 标签
    renderer.drawText('难度', 40, diffY + diffH / 2, {
      fontSize: 16,
      color: theme.textPrimary,
      baseline: 'middle'
    })

    // 选项
    const options = this.elements.difficulty.options
    const optWidth = 56
    const optGap = 8
    const totalWidth = options.length * optWidth + (options.length - 1) * optGap
    const optStartX = width - 32 - totalWidth

    options.forEach((opt, index) => {
      const x = optStartX + index * (optWidth + optGap)
      const isActive = settings.difficulty === opt
      const isPressed = this.pressedItem === `diff_${opt}`

      // 选项背景
      renderer.drawRect(x, diffY + 10, optWidth, diffH - 20, {
        fill: isActive ? theme.accent : (isPressed ? theme.bgCard : 'transparent'),
        radius: 8,
        stroke: !isActive ? theme.border : undefined,
        strokeWidth: 1
      })

      // 选项文字
      renderer.drawText(`${opt}位`, x + optWidth / 2, diffY + diffH / 2, {
        fontSize: 14,
        color: isActive ? '#ffffff' : theme.textSecondary,
        align: 'center',
        baseline: 'middle',
        bold: isActive
      })
    })
  }

  /**
   * 渲染过渡效果设置
   */
  renderTransitionSetting(renderer, settings, theme, width) {
    const elem = this.elements.transition
    const y = elem.y
    const h = elem.h

    // 背景
    renderer.drawRect(20, y, width - 40, h, { fill: theme.bgSecondary, radius: 12 })

    // 标签
    renderer.drawText('过渡', 40, y + h / 2, {
      fontSize: 16,
      color: theme.textPrimary,
      baseline: 'middle'
    })

    // 选项
    const options = elem.options
    const labels = elem.labels
    const optWidth = 56
    const optGap = 8
    const totalWidth = options.length * optWidth + (options.length - 1) * optGap
    const optStartX = width - 32 - totalWidth

    const currentEffect = settings.transitionEffect || 'fade'

    options.forEach((opt, index) => {
      const x = optStartX + index * (optWidth + optGap)
      const isActive = currentEffect === opt
      const isPressed = this.pressedItem === `trans_${opt}`

      // 选项背景
      renderer.drawRect(x, y + 10, optWidth, h - 20, {
        fill: isActive ? theme.accent : (isPressed ? theme.bgCard : 'transparent'),
        radius: 8,
        stroke: !isActive ? theme.border : undefined,
        strokeWidth: 1
      })

      // 选项文字
      renderer.drawText(labels[index], x + optWidth / 2, y + h / 2, {
        fontSize: 14,
        color: isActive ? '#ffffff' : theme.textSecondary,
        align: 'center',
        baseline: 'middle',
        bold: isActive
      })
    })
  }

  /**
   * 渲染开关设置
   */
  renderToggleSetting(renderer, label, isEnabled, element, theme, width, key) {
    const y = element.y
    const h = element.h
    const isPressed = this.pressedItem === key

    // 背景
    renderer.drawRect(20, y, width - 40, h, { fill: theme.bgSecondary, radius: 12 })

    // 标签
    renderer.drawText(label, 40, y + h / 2, {
      fontSize: 16,
      color: theme.textPrimary,
      baseline: 'middle'
    })

    // 开关
    const switchWidth = 48
    const switchHeight = 28
    const switchX = width - 40 - switchWidth
    const switchY = y + (h - switchHeight) / 2

    // 开关轨道
    renderer.drawRect(switchX, switchY, switchWidth, switchHeight, {
      fill: isEnabled ? theme.accent : theme.bgCard,
      radius: switchHeight / 2
    })

    // 开关把手
    const knobSize = 22
    const knobX = isEnabled ? switchX + switchWidth - knobSize - 3 : switchX + 3
    const knobY = switchY + (switchHeight - knobSize) / 2

    renderer.drawRect(knobX, knobY, knobSize, knobSize, {
      fill: '#ffffff',
      radius: knobSize / 2
    })
  }

  /**
   * 渲染统计信息
   */
  renderStats(renderer, stats, theme, width) {
    const statsTitleY = this.elements.statsTitle.y
    const statsY = this.elements.stats.y
    const statsH = this.elements.stats.h

    // 标题
    renderer.drawText('游戏统计', 20, statsTitleY, {
      fontSize: 14,
      color: theme.textSecondary
    })

    // 统计卡片
    renderer.drawRect(20, statsY, width - 40, statsH, { fill: theme.bgSecondary, radius: 12 })

    // 计算胜率
    const winRate = stats.totalGames > 0
      ? Math.round(stats.wins / stats.totalGames * 100)
      : 0

    // 统计项
    const statItems = [
      { label: '总场次', value: stats.totalGames || 0 },
      { label: '胜率', value: `${winRate}%` },
      { label: '最高连胜', value: stats.maxWinStreak || 0 }
    ]

    const itemWidth = (width - 40) / 3

    statItems.forEach((item, index) => {
      const x = 20 + itemWidth * index + itemWidth / 2

      renderer.drawText(item.value, x, statsY + 32, {
        fontSize: 24,
        color: index === 1 ? theme.accent : theme.textPrimary,
        align: 'center',
        baseline: 'middle',
        bold: true
      })

      renderer.drawText(item.label, x, statsY + 56, {
        fontSize: 12,
        color: theme.textMuted,
        align: 'center'
      })
    })
  }

  /**
   * 渲染重置按钮
   */
  renderResetButton(renderer, theme, width) {
    const btn = this.elements.resetBtn
    const isPressed = this.pressedItem === 'reset'

    renderer.drawButton(btn.x, btn.y, btn.w, btn.h, '重置数据', {
      radius: 8,
      fontSize: 14,
      pressed: isPressed
    })
  }

  /**
   * 渲染关于信息
   */
  renderAbout(renderer, theme, width) {
    const game = globalThis.getGame()
    const aboutY = this.elements.about.y

    renderer.drawText(`v${game.GameConfig.version}`, width / 2, aboutY, {
      fontSize: 12,
      color: theme.textMuted,
      align: 'center'
    })

    renderer.drawText('数字对决 Pro', width / 2, aboutY + 20, {
      fontSize: 12,
      color: theme.textMuted,
      align: 'center'
    })

    renderer.drawText('© 2026 数字对决团队', width / 2, aboutY + 40, {
      fontSize: 10,
      color: theme.textMuted,
      align: 'center'
    })
  }

  /**
   * 渲染确认对话框
   */
  renderConfirmDialog(renderer, theme, width, height) {
    if (!this.showConfirm) return

    // 半透明遮罩
    renderer.drawRect(0, 0, width, height, { fill: 'rgba(0,0,0,0.6)' })

    const dialogW = 280
    const dialogH = 160
    const dialogX = (width - dialogW) / 2
    const dialogY = (height - dialogH) / 2

    // 对话框背景
    renderer.drawRect(dialogX, dialogY, dialogW, dialogH, {
      fill: theme.bgSecondary,
      radius: 16
    })

    // 标题
    renderer.drawText('确认重置', width / 2, dialogY + 32, {
      fontSize: 18,
      color: theme.textPrimary,
      align: 'center',
      bold: true
    })

    // 提示文字
    renderer.drawText('确定要重置所有游戏统计数据吗？', width / 2, dialogY + 64, {
      fontSize: 14,
      color: theme.textSecondary,
      align: 'center'
    })

    renderer.drawText('此操作不可撤销', width / 2, dialogY + 84, {
      fontSize: 12,
      color: theme.textMuted,
      align: 'center'
    })

    // 按钮
    const btnW = 100
    const btnH = 40
    const btnY = dialogY + dialogH - 56
    const cancelX = dialogX + 20
    const confirmX = dialogX + dialogW - btnW - 20

    // 取消按钮
    const cancelPressed = this.pressedItem === 'confirm_cancel'
    renderer.drawButton(cancelX, btnY, btnW, btnH, '取消', {
      radius: 10,
      fontSize: 14,
      pressed: cancelPressed
    })

    // 确认按钮
    const confirmPressed = this.pressedItem === 'confirm_ok'
    renderer.drawButton(confirmX, btnY, btnW, btnH, '确认', {
      type: 'primary',
      radius: 10,
      fontSize: 14,
      pressed: confirmPressed
    })
  }

  /**
   * 显示重置确认对话框
   */
  showResetConfirm() {
    this.showConfirm = true
  }

  /**
   * 重置统计数据
   */
  resetStats() {
    const game = globalThis.getGame()
    game.gameState.stats = {
      totalGames: 0,
      wins: 0,
      winStreak: 0,
      maxWinStreak: 0
    }
    game.saveUserData()
    this.showConfirm = false
  }

  handleInput(events) {
    const game = globalThis.getGame()
    const settings = game.gameState.settings
    const { width, height } = game.renderer

    events.forEach(event => {
      if (event.type === 'tap') {
        // 如果显示确认对话框，优先处理对话框输入
        if (this.showConfirm) {
          this.handleConfirmDialogInput(event, game, width, height)
          return
        }

        this.pressedItem = null

        // 难度选择
        const options = this.elements.difficulty.options
        const optWidth = 56
        const optGap = 8
        const totalWidth = options.length * optWidth + (options.length - 1) * optGap
        const optStartX = width - 32 - totalWidth
        const diffY = this.elements.difficulty.y
        const diffH = this.elements.difficulty.h

        options.forEach((opt, index) => {
          const x = optStartX + index * (optWidth + optGap)
          if (game.inputManager.hitTest(event, x, diffY + 10, optWidth, diffH - 20)) {
            settings.difficulty = opt
            game.audioManager.vibrate('short')
          }
        })

        // 过渡效果选择
        const transElem = this.elements.transition
        const transOptions = transElem.options
        const transOptWidth = 56
        const transOptGap = 8
        const transTotalWidth = transOptions.length * transOptWidth + (transOptions.length - 1) * transOptGap
        const transOptStartX = width - 32 - transTotalWidth
        const transY = transElem.y
        const transH = transElem.h

        transOptions.forEach((opt, index) => {
          const x = transOptStartX + index * (transOptWidth + transOptGap)
          if (game.inputManager.hitTest(event, x, transY + 10, transOptWidth, transH - 20)) {
            settings.transitionEffect = opt
            game.audioManager.vibrate('short')
          }
        })

        // 音效开关
        const soundY = this.elements.sound.y
        const soundH = this.elements.sound.h
        if (game.inputManager.hitTest(event, 20, soundY, width - 40, soundH)) {
          settings.soundEnabled = !settings.soundEnabled
          game.audioManager.setEnabled(settings.soundEnabled)
          game.audioManager.vibrate('short')
        }

        // 震动开关
        const vibY = this.elements.vibration.y
        const vibH = this.elements.vibration.h
        if (game.inputManager.hitTest(event, 20, vibY, width - 40, vibH)) {
          settings.vibrationEnabled = settings.vibrationEnabled !== false ? false : true
          game.audioManager.setVibrationEnabled(settings.vibrationEnabled)
          if (settings.vibrationEnabled) {
            game.audioManager.vibrate('short')
          }
        }

        // 返回按钮
        if (game.inputManager.hitTest(event, this.elements.backBtn.x, this.elements.backBtn.y, this.elements.backBtn.w, this.elements.backBtn.h)) {
          game.audioManager.vibrate('short')
          this.sceneManager.switchTo('menu')
        }

        // 重置按钮
        const resetBtn = this.elements.resetBtn
        if (game.inputManager.hitTest(event, resetBtn.x, resetBtn.y, resetBtn.w, resetBtn.h)) {
          game.audioManager.vibrate('short')
          this.showResetConfirm()
        }
      }

      // 触摸按下状态
      if (game.inputManager.touchStart) {
        // 如果显示确认对话框，处理对话框按钮按下状态
        if (this.showConfirm) {
          this.handleConfirmDialogPress(game, width, height)
          return
        }

        // 难度选项
        const options = this.elements.difficulty.options
        const optWidth = 56
        const optGap = 8
        const totalWidth = options.length * optWidth + (options.length - 1) * optGap
        const optStartX = width - 32 - totalWidth
        const diffY = this.elements.difficulty.y
        const diffH = this.elements.difficulty.h

        for (const opt of options) {
          const index = options.indexOf(opt)
          const x = optStartX + index * (optWidth + optGap)
          if (game.inputManager.hitTest(game.inputManager.touchStart, x, diffY + 10, optWidth, diffH - 20)) {
            this.pressedItem = `diff_${opt}`
            break
          }
        }

        // 过渡效果选项
        const transElem = this.elements.transition
        const transOptions = transElem.options
        const transOptWidth = 56
        const transOptGap = 8
        const transTotalWidth = transOptions.length * transOptWidth + (transOptions.length - 1) * transOptGap
        const transOptStartX = width - 32 - transTotalWidth
        const transY = transElem.y
        const transH = transElem.h

        for (const opt of transOptions) {
          const index = transOptions.indexOf(opt)
          const x = transOptStartX + index * (transOptWidth + transOptGap)
          if (game.inputManager.hitTest(game.inputManager.touchStart, x, transY + 10, transOptWidth, transH - 20)) {
            this.pressedItem = `trans_${opt}`
            break
          }
        }

        // 开关项
        const soundY = this.elements.sound.y
        const soundH = this.elements.sound.h
        if (game.inputManager.hitTest(game.inputManager.touchStart, 20, soundY, width - 40, soundH)) {
          this.pressedItem = 'sound'
        }

        const vibY = this.elements.vibration.y
        const vibH = this.elements.vibration.h
        if (game.inputManager.hitTest(game.inputManager.touchStart, 20, vibY, width - 40, vibH)) {
          this.pressedItem = 'vibration'
        }

        // 重置按钮
        const resetBtn = this.elements.resetBtn
        if (game.inputManager.hitTest(game.inputManager.touchStart, resetBtn.x, resetBtn.y, resetBtn.w, resetBtn.h)) {
          this.pressedItem = 'reset'
        }
      }
    })
  }

  /**
   * 处理确认对话框点击
   */
  handleConfirmDialogInput(event, game, width, height) {
    const dialogW = 280
    const dialogH = 160
    const dialogX = (width - dialogW) / 2
    const dialogY = (height - dialogH) / 2
    const btnW = 100
    const btnH = 40
    const btnY = dialogY + dialogH - 56
    const cancelX = dialogX + 20
    const confirmX = dialogX + dialogW - btnW - 20

    // 取消按钮
    if (game.inputManager.hitTest(event, cancelX, btnY, btnW, btnH)) {
      game.audioManager.vibrate('short')
      this.showConfirm = false
      return
    }

    // 确认按钮
    if (game.inputManager.hitTest(event, confirmX, btnY, btnW, btnH)) {
      game.audioManager.vibrate('long')
      this.resetStats()
    }
  }

  /**
   * 处理确认对话框按钮按下状态
   */
  handleConfirmDialogPress(game, width, height) {
    const dialogW = 280
    const dialogH = 160
    const dialogX = (width - dialogW) / 2
    const dialogY = (height - dialogH) / 2
    const btnW = 100
    const btnH = 40
    const btnY = dialogY + dialogH - 56
    const cancelX = dialogX + 20
    const confirmX = dialogX + dialogW - btnW - 20

    this.pressedItem = null

    if (game.inputManager.hitTest(game.inputManager.touchStart, cancelX, btnY, btnW, btnH)) {
      this.pressedItem = 'confirm_cancel'
    }

    if (game.inputManager.hitTest(game.inputManager.touchStart, confirmX, btnY, btnW, btnH)) {
      this.pressedItem = 'confirm_ok'
    }
  }
}

module.exports = SettingsScene