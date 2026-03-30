/**
 * 主菜单场景 - 极简风格重构版
 *
 * 设计规范：
 * - 玻璃态卡片容器
 * - 4px基格间距系统
 * - Indigo强调色（#6366f1）
 * - 无emoji，简洁文字
 * - 呼吸灯主按钮效果
 */

const Theme = require('../engine/theme')

class MenuScene {
  constructor() {
    this.sceneManager = null
    this.elements = {}

    // 动画状态
    this.animationOffset = 0
    this.breathOffset = 0
    this.pressedButton = null

    // 安全区域
    this.safeArea = null

    // 标题动画
    this.titleBounce = 0

    // 初始化主题
    this.theme = Theme.helpers.getColors()
  }

  onEnter() {
    const game = globalThis.getGame()
    const { width, height } = game.renderer

    // 获取安全区域
    const systemInfo = wx.getSystemInfoSync()
    this.safeArea = systemInfo.safeArea || { top: 0, bottom: height, left: 0, right: width }

    // 计算布局
    this.calculateLayout()

    this.pressedButton = null
  }

  onExit() {}

  /**
   * 计算布局 - 使用 4px 基格系统
   */
  calculateLayout() {
    const game = globalThis.getGame()
    const { width } = game.renderer

    const safeTop = this.safeArea.top
    const safeBottom = this.safeArea.bottom
    const safeLeft = this.safeArea.left
    const safeRight = this.safeArea.right
    const safeWidth = safeRight - safeLeft
    const safeHeight = safeBottom - safeTop

    const centerX = (safeLeft + safeRight) / 2

    // 使用 4px 基格
    const spacing = {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 48
    }

    // 布局参数
    const titleY = safeTop + spacing.xxl + 20
    const subtitleY = titleY + spacing.lg + 8

    // 按钮组容器 - 玻璃态卡片
    const cardPadding = spacing.lg
    const cardWidth = Math.min(280, safeWidth - spacing.xl * 2)
    const cardX = centerX - cardWidth / 2

    // 按钮参数
    const btnWidth = cardWidth - cardPadding * 2
    const btnHeight = 48
    const btnGap = spacing.md

    // 计算卡片高度
    const buttons = [
      { id: 'aiBtn', text: 'AI 对战', type: 'primary', withGlow: true },
      { id: 'dailyBtn', text: '每日挑战', type: 'secondary' },
      { id: 'historyBtn', text: '历史记录', type: 'secondary' },
      { id: 'settingsBtn', text: '设置', type: 'ghost' }
    ]

    const cardContentHeight = buttons.length * btnHeight + (buttons.length - 1) * btnGap
    const cardHeight = cardPadding * 2 + cardContentHeight

    // 计算卡片位置（垂直居中偏上）
    const cardY = safeTop + safeHeight * 0.35 - cardHeight / 2

    // 构建元素配置
    this.elements = {
      title: { x: centerX, y: titleY },
      subtitle: { x: centerX, y: subtitleY },
      card: { x: cardX, y: cardY, w: cardWidth, h: cardHeight },
      buttons: []
    }

    // 计算按钮位置
    let currentY = cardY + cardPadding
    buttons.forEach((btn) => {
      this.elements.buttons.push({
        id: btn.id,
        x: cardX + cardPadding,
        y: currentY,
        w: btnWidth,
        h: btnHeight,
        text: btn.text,
        type: btn.type,
        withGlow: btn.withGlow || false
      })
      currentY += btnHeight + btnGap
    })

    // 底部统计和版本
    this.elements.stats = { x: centerX, y: safeBottom - spacing.xxl }
    this.elements.version = { x: centerX, y: safeBottom - spacing.lg }
  }

  update(deltaTime) {
    this.animationOffset += deltaTime * 0.002
    this.breathOffset += deltaTime * 0.003

    // 标题弹跳动画
    this.titleBounce = Math.sin(this.animationOffset * 2) * 3
  }

  render(renderer) {
    const game = globalThis.getGame()
    const theme = renderer.currentTheme
    const { width, height } = renderer
    const stats = game.storageManager.getStats()

    // 绘制渐变背景
    renderer.drawGradientBackground()

    // 获取 UIKit 实例
    const ui = renderer.ui

    // 绘制标题（使用渐变文字）
    const titleY = this.elements.title.y + this.titleBounce
    ui.drawGradientText('数字对决', this.elements.title.x, titleY, {
      fontSize: 36,
      fontWeight: 'bold',
      gradient: [theme.accentLight, theme.accent]
    })

    // 绘制副标题
    renderer.drawText('PRO', this.elements.subtitle.x, this.elements.subtitle.y, {
      fontSize: 18,
      color: theme.textMuted,
      align: 'center',
      bold: true
    })

    // 绘制玻璃态卡片容器
    const card = this.elements.card
    ui.drawGlassCard(card.x, card.y, card.w, card.h, {
      fill: this.theme.glass.bg,
      stroke: this.theme.glass.border,
      radius: Theme.borderRadius.lg,
      highlight: true,
      shadow: true
    })

    // 绘制按钮
    this.elements.buttons.forEach(btn => {
      const isPressed = this.pressedButton === btn.id

      if (btn.type === 'primary') {
        // 主按钮 - 带呼吸灯效果
        let withGlow = btn.withGlow
        if (withGlow && !isPressed) {
          // 计算呼吸强度
          const breathIntensity = (Math.sin(this.breathOffset) + 1) / 2
          const glowAlpha = 0.15 + breathIntensity * 0.25
          const glowRadius = 15 + breathIntensity * 10

          // 绘制发光背景（通过renderer.drawGlow）
          renderer.drawGlow(btn.x - 5, btn.y - 5, btn.w + 10, btn.h + 10, theme.accent, glowAlpha, glowRadius)
        }

        ui.drawPrimaryButton(btn.x, btn.y, btn.w, btn.h, btn.text, {
          pressed: isPressed,
          withGlow: false // 已经手动处理发光
        })
      } else if (btn.type === 'secondary') {
        ui.drawSecondaryButton(btn.x, btn.y, btn.w, btn.h, btn.text, {
          pressed: isPressed
        })
      } else if (btn.type === 'ghost') {
        ui.drawGhostButton(btn.x, btn.y, btn.w, btn.h, btn.text, {
          pressed: isPressed
        })
      }
    })

    // 绘制底部统计
    const statsY = this.elements.stats.y
    const winRate = stats.totalGames > 0 ? Math.round(stats.wins / stats.totalGames * 100) : 0

    renderer.drawText(`${stats.totalGames || 0} 场对战`, this.elements.stats.x - 60, statsY, {
      fontSize: 12,
      color: theme.textMuted,
      align: 'center'
    })

    renderer.drawText(`${winRate}% 胜率`, this.elements.stats.x, statsY, {
      fontSize: 14,
      color: theme.textSecondary,
      align: 'center',
      bold: true
    })

    const streakText = stats.winStreak > 0 ? `${stats.winStreak} 连胜` : '最高连胜'
    renderer.drawText(streakText, this.elements.stats.x + 60, statsY, {
      fontSize: 12,
      color: theme.textMuted,
      align: 'center'
    })

    // 绘制版本号
    renderer.drawText(`v${game.GameConfig.version}`, this.elements.version.x, this.elements.version.y, {
      fontSize: 11,
      color: theme.textMuted,
      align: 'center'
    })
  }

  handleInput(events) {
    const game = globalThis.getGame()

    events.forEach(event => {
      if (event.type === 'tap') {
        this.pressedButton = null
        this.elements.buttons.forEach(btn => {
          if (game.inputManager.hitTest(event, btn.x, btn.y, btn.w, btn.h)) {
            game.audioManager.vibrate('short')
            this.onButtonClick(btn.id)
          }
        })
      } else if (event.type === 'swipe') {
        this.pressedButton = null
      }
    })

    // 检测触摸按下状态
    if (game.inputManager.touchStart) {
      let found = false
      this.elements.buttons.forEach(btn => {
        if (game.inputManager.hitTest(game.inputManager.touchStart, btn.x, btn.y, btn.w, btn.h)) {
          this.pressedButton = btn.id
          found = true
        }
      })
      if (!found) this.pressedButton = null
    }
  }

  onButtonClick(id) {
    const game = globalThis.getGame()

    switch (id) {
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
      case 'settingsBtn':
        this.sceneManager.switchTo('settings')
        break
    }
  }
}

module.exports = MenuScene
