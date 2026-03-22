/**
 * 设置场景
 */

class SettingsScene {
  constructor() {
    this.sceneManager = null
    this.elements = {}
  }

  onEnter() { this.calculateLayout() }
  onExit() { globalThis.getGame().saveUserData() }

  calculateLayout() {
    const game = globalThis.getGame()
    const { width, height } = game.renderer
    const centerX = width / 2

    this.elements = {
      title: { x: centerX, y: 40 },
      difficulty: { y: 100, options: [3, 4, 5] },
      sound: { y: 180 },
      backBtn: { x: centerX - 80, y: height - 80, w: 160, h: 44, text: '返回' }
    }
  }

  update(deltaTime) {}

  render(renderer) {
    const game = globalThis.getGame()
    const theme = renderer.currentTheme
    const { width, height } = renderer
    const settings = game.gameState.settings

    renderer.drawGradientBackground()
    renderer.drawText('设置', this.elements.title.x, this.elements.title.y, { fontSize: 28, color: theme.textPrimary, align: 'center', bold: true })

    // 难度
    const diffY = this.elements.difficulty.y
    renderer.drawRect(20, diffY, width - 40, 60, { fill: theme.bgSecondary, radius: 12 })
    renderer.drawText('难度', 40, diffY + 30, { fontSize: 16, color: theme.textPrimary, baseline: 'middle' })

    const options = this.elements.difficulty.options
    const optWidth = 60
    const optStartX = width - 40 - options.length * optWidth

    options.forEach((opt, index) => {
      const x = optStartX + index * optWidth
      const isActive = settings.difficulty === opt
      if (isActive) renderer.drawRect(x, diffY + 12, 50, 36, { fill: theme.accent, radius: 8 })
      renderer.drawText(`${opt}位`, x + 25, diffY + 30, { fontSize: 14, color: isActive ? '#ffffff' : theme.textSecondary, align: 'center', baseline: 'middle' })
    })

    // 音效
    const soundY = this.elements.sound.y
    renderer.drawRect(20, soundY, width - 40, 60, { fill: theme.bgSecondary, radius: 12 })
    renderer.drawText('音效', 40, soundY + 30, { fontSize: 16, color: theme.textPrimary, baseline: 'middle' })
    renderer.drawText(settings.soundEnabled ? '✓ 开启' : '✗ 关闭', width - 60, soundY + 30, { fontSize: 14, color: settings.soundEnabled ? theme.success : theme.textMuted, align: 'right', baseline: 'middle' })

    renderer.drawButton(this.elements.backBtn.x, this.elements.backBtn.y, this.elements.backBtn.w, this.elements.backBtn.h, this.elements.backBtn.text, { type: 'primary', radius: 12 })
  }

  handleInput(events) {
    const game = globalThis.getGame()
    const settings = game.gameState.settings
    const { width } = game.renderer

    events.forEach(event => {
      if (event.type !== 'tap') return

      // 难度
      const options = this.elements.difficulty.options
      const optWidth = 60
      const optStartX = width - 40 - options.length * optWidth
      const diffY = this.elements.difficulty.y

      options.forEach((opt, index) => {
        const x = optStartX + index * optWidth
        if (game.inputManager.hitTest(event, x, diffY + 12, 50, 36)) {
          settings.difficulty = opt
          game.audioManager.vibrate('short')
        }
      })

      // 音效
      const soundY = this.elements.sound.y
      if (game.inputManager.hitTest(event, 20, soundY, width - 40, 60)) {
        settings.soundEnabled = !settings.soundEnabled
        game.audioManager.setEnabled(settings.soundEnabled)
        game.audioManager.vibrate('short')
      }

      // 返回
      if (game.inputManager.hitTest(event, this.elements.backBtn.x, this.elements.backBtn.y, this.elements.backBtn.w, this.elements.backBtn.h)) {
        game.audioManager.vibrate('short')
        this.sceneManager.switchTo('menu')
      }
    })
  }
}

module.exports = SettingsScene