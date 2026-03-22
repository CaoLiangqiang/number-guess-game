/**
 * 历史记录场景
 */

class HistoryScene {
  constructor() {
    this.sceneManager = null
    this.history = []
    this.elements = {}
  }

  onEnter() {
    const game = globalThis.getGame()
    this.history = game.storageManager.getGameHistory(100)
    this.calculateLayout()
  }

  onExit() {}

  calculateLayout() {
    const game = globalThis.getGame()
    const { width, height } = game.renderer
    const centerX = width / 2

    this.elements = {
      title: { x: centerX, y: 40 },
      list: { y: 80, h: height - 160 },
      backBtn: { x: centerX - 80, y: height - 60, w: 160, h: 44, text: '返回' }
    }
  }

  update(deltaTime) {}

  render(renderer) {
    const game = globalThis.getGame()
    const theme = renderer.currentTheme
    const { width, height } = renderer

    renderer.drawGradientBackground()
    renderer.drawText('历史记录', this.elements.title.x, this.elements.title.y, { fontSize: 28, color: theme.textPrimary, align: 'center', bold: true })

    const listY = this.elements.list.y
    const listH = this.elements.list.h
    renderer.drawRect(12, listY, width - 24, listH, { fill: theme.bgSecondary, radius: 12 })

    if (this.history.length === 0) {
      renderer.drawText('暂无游戏记录', width / 2, listY + listH / 2, { fontSize: 16, color: theme.textMuted, align: 'center', baseline: 'middle' })
    } else {
      const itemHeight = 72
      this.history.forEach((item, index) => {
        const y = listY + 8 + index * (itemHeight + 8)
        if (y > listY + listH - itemHeight) return

        renderer.drawRect(20, y, width - 40, itemHeight, { fill: theme.bgCard, radius: 8 })
        const icon = item.isWin ? '🎉' : '😢'
        renderer.drawText(icon, 36, y + 20, { fontSize: 20 })
        renderer.drawText(`${item.difficulty}位 / ${item.turns}回合`, 72, y + 16, { fontSize: 14, color: theme.textPrimary, bold: true })
        renderer.drawText(game.core.formatTime(item.duration), 72, y + 40, { fontSize: 12, color: theme.textSecondary })

        const date = new Date(item.playedAt)
        const timeStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
        renderer.drawText(timeStr, width - 36, y + 28, { fontSize: 12, color: theme.textMuted, align: 'right', baseline: 'middle' })
      })
    }

    renderer.drawButton(this.elements.backBtn.x, this.elements.backBtn.y, this.elements.backBtn.w, this.elements.backBtn.h, this.elements.backBtn.text, { radius: 12 })
  }

  handleInput(events) {
    const game = globalThis.getGame()

    events.forEach(event => {
      if (event.type !== 'tap') return
      if (game.inputManager.hitTest(event, this.elements.backBtn.x, this.elements.backBtn.y, this.elements.backBtn.w, this.elements.backBtn.h)) {
        game.audioManager.vibrate('short')
        this.sceneManager.switchTo('menu')
      }
    })
  }
}

module.exports = HistoryScene