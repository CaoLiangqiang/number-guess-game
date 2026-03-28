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
    this.safeArea = null
  }

  onEnter() {
    const game = globalThis.getGame()
    const { width, height } = game.renderer

    // 获取安全区域
    const systemInfo = wx.getSystemInfoSync()
    this.safeArea = systemInfo.safeArea || { top: 0, bottom: height, left: 0, right: width }

    // 计算 UI 布局（使用安全区域）
    const safeTop = this.safeArea.top
    const safeBottom = this.safeArea.bottom
    const safeLeft = this.safeArea.left
    const safeRight = this.safeArea.right
    const safeHeight = safeBottom - safeTop
    const centerX = (safeLeft + safeRight) / 2

    const btnWidth = Math.min(200, safeRight - safeLeft - 32)
    const btnHeight = 48
    const btnX = centerX - btnWidth / 2
    const btnGap = 52
    const startY = safeTop + 100

    this.elements = {
      title: { x: centerX, y: safeTop + 60 },
      subtitle: { x: centerX, y: safeTop + 105 },
      aiBtn: { x: btnX, y: startY + btnGap * 0, w: btnWidth, h: btnHeight, text: '🤖 AI 对战' },
      dailyBtn: { x: btnX, y: startY + btnGap * 1, w: btnWidth, h: btnHeight, text: '🎯 每日挑战' },
      historyBtn: { x: btnX, y: startY + btnGap * 2, w: btnWidth, h: btnHeight, text: '📋 历史记录' },
      guideBtn: { x: btnX, y: startY + btnGap * 3, w: btnWidth, h: btnHeight, text: '📖 游戏规则' },
      settingsBtn: { x: btnX, y: startY + btnGap * 4, w: btnWidth, h: btnHeight, text: '⚙️ 设置' },
      stats: { x: centerX, y: safeBottom - 60 },
      version: { x: centerX, y: safeBottom - 20 }
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

    renderer.drawText('🎮 数字对决', this.elements.title.x, titleY, {
      fontSize: 36, color: theme.textPrimary, align: 'center', baseline: 'middle', bold: true
    })

    renderer.drawText('✨ Pro', this.elements.subtitle.x, this.elements.subtitle.y, {
      fontSize: 24, color: theme.accent, align: 'center', baseline: 'middle', bold: true
    })

    // 按钮
    const btns = ['aiBtn', 'dailyBtn', 'historyBtn', 'guideBtn', 'settingsBtn']
    btns.forEach(key => {
      const btn = this.elements[key]
      // 每日挑战按钮特殊处理：显示完成状态
      let btnText = btn.text
      if (key === 'dailyBtn') {
        const isCompleted = game.storageManager.isDailyChallengeCompletedToday()
        const streak = game.storageManager.getDailyChallengeStreak()
        if (isCompleted) {
          btnText = '✅ 已完成'
        } else if (streak > 0) {
          btnText = `🎯 每日挑战 🔥${streak}`
        }
      }
      renderer.drawButton(btn.x, btn.y, btn.w, btn.h, btnText, {
        type: key === 'aiBtn' ? 'primary' : 'secondary',
        radius: 12, fontSize: 16,
        pressed: this.pressedButton === key
      })
    })

    // 统计
    const statsY = this.elements.stats.y
    const winRate = stats.totalGames > 0 ? Math.round(stats.wins / stats.totalGames * 100) : 0
    const streakText = stats.winStreak > 0 ? `${stats.winStreak}/${stats.maxWinStreak || 0}` : `0/${stats.maxWinStreak || 0}`
    renderer.drawText(`🎮 ${stats.totalGames || 0}场`, this.elements.stats.x - 60, statsY, {
      fontSize: 12, color: theme.textMuted, align: 'center'
    })
    renderer.drawText(`🏆 ${winRate}%`, this.elements.stats.x, statsY, {
      fontSize: 14, color: theme.textSecondary, align: 'center'
    })
    renderer.drawText(`🔥 ${streakText}`, this.elements.stats.x + 60, statsY, {
      fontSize: 14, color: theme.textSecondary, align: 'center'
    })

    // 版本号
    renderer.drawText(`v${game.GameConfig.version}`, this.elements.version.x, this.elements.version.y, {
      fontSize: 11, color: theme.textMuted, align: 'center'
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
    const game = globalThis.getGame()
    switch (key) {
      case 'aiBtn':
        this.sceneManager.switchTo('game', { mode: 'ai' })
        break
      case 'dailyBtn':
        // 检查今日是否已完成挑战
        if (game.storageManager.isDailyChallengeCompletedToday()) {
          wx.showToast({
            title: '今日挑战已完成',
            icon: 'success',
            duration: 2000
          })
        } else {
          this.sceneManager.switchTo('game', { mode: 'daily' })
        }
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