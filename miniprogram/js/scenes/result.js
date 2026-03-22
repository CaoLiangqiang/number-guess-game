/**
 * 结果场景
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
  }

  onEnter(params = {}) {
    this.isWin = params.isWin
    this.secretNumber = params.secretNumber
    this.turns = params.turns
    this.duration = params.duration
    this.mode = params.mode || 'ai'
    this.calculateLayout()
  }

  onExit() {}

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

  update(deltaTime) {}

  render(renderer) {
    const game = globalThis.getGame()
    const theme = renderer.currentTheme
    const { width, height } = renderer

    renderer.drawGradientBackground()

    // 标题
    const title = this.isWin ? '🎉 恭喜获胜！' : '😢 AI 获胜'
    renderer.drawText(title, this.elements.title.x, this.elements.title.y, {
      fontSize: 32, color: this.isWin ? theme.success : theme.error, align: 'center', baseline: 'middle', bold: true
    })

    // 答案卡片
    renderer.drawRect(32, 160, width - 64, 100, { fill: theme.bgSecondary, radius: 16 })
    renderer.drawText('答案', width / 2, 180, { fontSize: 14, color: theme.textSecondary, align: 'center' })
    renderer.drawText(this.secretNumber, width / 2, 220, { fontSize: 40, color: theme.accent, align: 'center', baseline: 'middle', bold: true })

    // 统计
    const statsY = this.elements.stats.y
    renderer.drawRect(32, statsY, width - 64, 120, { fill: theme.bgSecondary, radius: 16 })

    renderer.drawText('回合数', 60, statsY + 24, { fontSize: 14, color: theme.textSecondary })
    renderer.drawText(String(this.turns), 60, statsY + 52, { fontSize: 24, color: theme.textPrimary, bold: true })

    renderer.drawText('用时', width / 2, statsY + 24, { fontSize: 14, color: theme.textSecondary, align: 'center' })
    renderer.drawText(game.core.formatTime(this.duration), width / 2, statsY + 52, { fontSize: 24, color: theme.textPrimary, align: 'center', bold: true })

    renderer.drawText('模式', width - 60, statsY + 24, { fontSize: 14, color: theme.textSecondary, align: 'right' })
    renderer.drawText(this.mode === 'ai' ? 'AI对战' : '每日挑战', width - 60, statsY + 52, { fontSize: 24, color: theme.textPrimary, align: 'right', bold: true })

    // 按钮
    renderer.drawButton(this.elements.homeBtn.x, this.elements.homeBtn.y, this.elements.homeBtn.w, this.elements.homeBtn.h, this.elements.homeBtn.text, { radius: 12, fontSize: 16 })
    renderer.drawButton(this.elements.retryBtn.x, this.elements.retryBtn.y, this.elements.retryBtn.w, this.elements.retryBtn.h, this.elements.retryBtn.text, { type: 'primary', radius: 12, fontSize: 16 })
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