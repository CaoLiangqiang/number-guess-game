/**
 * 主菜单场景
 * 显示游戏标题、开始游戏、设置等入口
 */

class MenuScene {
  constructor() {
    this.sceneManager = null
    this.elements = {}
    this.animationOffset = 0
    this.pressedButton = null
  }

  onEnter() {
    const game = globalThis.getGame()
    const { width, height } = game.renderer

    // 计算 UI 布局
    const centerX = width / 2
    const btnWidth = 200
    const btnHeight = 48
    const btnX = centerX - btnWidth / 2

    this.elements = {
      title: { x: centerX, y: 120 },
      subtitle: { x: centerX, y: 170 },
      aiBtn: { x: btnX, y: 280, w: btnWidth, h: btnHeight, text: '🤖 AI 对战' },
      dailyBtn: { x: btnX, y: 340, w: btnWidth, h: btnHeight, text: '🎯 每日挑战' },
      historyBtn: { x: btnX, y: 400, w: btnWidth, h: btnHeight, text: '📋 历史记录' },
      guideBtn: { x: btnX, y: 460, w: btnWidth, h: btnHeight, text: '📖 游戏规则' },
      settingsBtn: { x: btnX, y: 520, w: btnWidth, h: btnHeight, text: '⚙️ 设置' },
      stats: { x: centerX, y: height - 100 }
    }

    this.pressedButton = null
  }

  onExit() {}

  update(deltaTime) {
    this.animationOffset += deltaTime * 0.002
  }

  render(renderer) {
    const game = globalThis.getGame()
    const theme = renderer.currentTheme
    const { width, height } = renderer
    const stats = game.storageManager.getStats()

    // 背景
    renderer.drawGradientBackground()

    // 标题动画
    const titleY = this.elements.title.y + Math.sin(this.animationOffset) * 3

    renderer.drawText('数字对决', this.elements.title.x, titleY, {
      fontSize: 42, color: theme.textPrimary, align: 'center', baseline: 'middle', bold: true
    })

    renderer.drawText('Pro', this.elements.subtitle.x, this.elements.subtitle.y, {
      fontSize: 28, color: theme.accent, align: 'center', baseline: 'middle', bold: true
    })

    // 按钮
    const btns = ['aiBtn', 'dailyBtn', 'historyBtn', 'guideBtn', 'settingsBtn']
    btns.forEach(key => {
      const btn = this.elements[key]
      renderer.drawButton(btn.x, btn.y, btn.w, btn.h, btn.text, {
        type: key === 'aiBtn' ? 'primary' : 'secondary',
        radius: 12, fontSize: 16,
        pressed: this.pressedButton === key
      })
    })

    // 统计
    const statsY = this.elements.stats.y
    const winRate = stats.totalGames > 0 ? Math.round(stats.wins / stats.totalGames * 100) : 0
    renderer.drawText(`胜率: ${winRate}%`, width / 2 - 60, statsY, {
      fontSize: 14, color: theme.textSecondary, align: 'center'
    })
    renderer.drawText(`连胜: ${stats.winStreak}`, width / 2 + 60, statsY, {
      fontSize: 14, color: theme.textSecondary, align: 'center'
    })

    // 版本号
    renderer.drawText(`v${game.GameConfig.version}`, width / 2, height - 30, {
      fontSize: 12, color: theme.textMuted, align: 'center'
    })
  }

  handleInput(events) {
    const game = globalThis.getGame()

    events.forEach(event => {
      if (event.type === 'tap') {
        this.pressedButton = null
        const btns = ['aiBtn', 'dailyBtn', 'historyBtn', 'guideBtn', 'settingsBtn']
        btns.forEach(key => {
          const btn = this.elements[key]
          if (game.inputManager.hitTest(event, btn.x, btn.y, btn.w, btn.h)) {
            game.audioManager.vibrate('short')
            this.onButtonClick(key)
          }
        })
      } else if (event.type === 'swipe') {
        this.pressedButton = null
      }
    })

    // 检测触摸按下状态
    if (game.inputManager.touchStart) {
      const btns = ['aiBtn', 'dailyBtn', 'historyBtn', 'guideBtn', 'settingsBtn']
      let found = false
      btns.forEach(key => {
        const btn = this.elements[key]
        if (game.inputManager.hitTest(game.inputManager.touchStart, btn.x, btn.y, btn.w, btn.h)) {
          this.pressedButton = key
          found = true
        }
      })
      if (!found) this.pressedButton = null
    }
  }

  onButtonClick(key) {
    switch (key) {
      case 'aiBtn':
        this.sceneManager.switchTo('game', { mode: 'ai' })
        break
      case 'dailyBtn':
        this.sceneManager.switchTo('game', { mode: 'daily' })
        break
      case 'historyBtn':
        this.sceneManager.switchTo('history')
        break
      case 'guideBtn':
        this.sceneManager.switchTo('guide')
        break
      case 'settingsBtn':
        this.sceneManager.switchTo('settings')
        break
    }
  }
}

module.exports = MenuScene