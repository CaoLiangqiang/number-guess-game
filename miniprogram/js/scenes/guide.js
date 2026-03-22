/**
 * 新手引导场景
 */

class GuideScene {
  constructor() {
    this.sceneManager = null
    this.currentPage = 0
    this.pages = []
    this.elements = {}
  }

  onEnter() {
    this.pages = [
      { title: '游戏目标', content: '猜出对方想好的4位数字。\n每位数字都不相同，第一位不为0。' },
      { title: '如何猜测', content: '输入4位数字作为你的猜测。\n系统会给出提示帮助你缩小范围。' },
      { title: '提示含义', content: 'A = 数字和位置都正确\nB = 数字正确但位置错误\n\n例如：答案1234，猜测1562\n得到 1A1B（1是A，2是B）' },
      { title: 'AI对战', content: '你和AI轮流猜测对方数字。\n先猜中对方数字者获胜！' }
    ]
    this.currentPage = 0
    this.calculateLayout()
  }

  onExit() {}

  calculateLayout() {
    const game = globalThis.getGame()
    const { width, height } = game.renderer
    const centerX = width / 2

    this.elements = {
      title: { x: centerX, y: 60 },
      content: { x: centerX, y: 160, w: width - 48 },
      indicators: { y: height - 180 },
      prevBtn: { x: 32, y: height - 100, w: 100, h: 44, text: '上一页' },
      nextBtn: { x: width - 132, y: height - 100, w: 100, h: 44, text: '下一页' }
    }
  }

  update(deltaTime) {}

  render(renderer) {
    const game = globalThis.getGame()
    const theme = renderer.currentTheme
    const { width, height } = renderer
    const page = this.pages[this.currentPage]

    renderer.drawGradientBackground()
    renderer.drawText(page.title, this.elements.title.x, this.elements.title.y, { fontSize: 28, color: theme.accent, align: 'center', bold: true })

    const contentY = this.elements.content.y
    renderer.drawRect(24, contentY, width - 48, 200, { fill: theme.bgSecondary, radius: 16 })

    const lines = page.content.split('\n')
    lines.forEach((line, index) => {
      renderer.drawText(line, width / 2, contentY + 40 + index * 32, { fontSize: 16, color: theme.textPrimary, align: 'center' })
    })

    // 页码
    const indicatorY = this.elements.indicators.y
    const dotSize = 8
    const dotGap = 16
    const totalWidth = this.pages.length * dotSize + (this.pages.length - 1) * dotGap
    const startX = width / 2 - totalWidth / 2

    this.pages.forEach((_, index) => {
      const x = startX + index * (dotSize + dotGap)
      renderer.drawRect(x, indicatorY, dotSize, dotSize, { fill: index === this.currentPage ? theme.accent : theme.bgCard, radius: dotSize / 2 })
    })

    if (this.currentPage > 0) {
      renderer.drawButton(this.elements.prevBtn.x, this.elements.prevBtn.y, this.elements.prevBtn.w, this.elements.prevBtn.h, this.elements.prevBtn.text, { radius: 12 })
    }

    const isLastPage = this.currentPage === this.pages.length - 1
    renderer.drawButton(this.elements.nextBtn.x, this.elements.nextBtn.y, this.elements.nextBtn.w, this.elements.nextBtn.h, isLastPage ? '开始游戏' : this.elements.nextBtn.text, { type: 'primary', radius: 12 })
  }

  handleInput(events) {
    const game = globalThis.getGame()

    events.forEach(event => {
      if (event.type !== 'tap') return

      if (this.currentPage > 0 && game.inputManager.hitTest(event, this.elements.prevBtn.x, this.elements.prevBtn.y, this.elements.prevBtn.w, this.elements.prevBtn.h)) {
        this.currentPage--
        game.audioManager.vibrate('short')
      }

      if (game.inputManager.hitTest(event, this.elements.nextBtn.x, this.elements.nextBtn.y, this.elements.nextBtn.w, this.elements.nextBtn.h)) {
        if (this.currentPage === this.pages.length - 1) {
          this.sceneManager.switchTo('game', { mode: 'ai' })
        } else {
          this.currentPage++
        }
        game.audioManager.vibrate('short')
      }
    })
  }
}

module.exports = GuideScene