/**
 * 设置场景 - 极简风格重构版
 *
 * 设计规范：
 * - 玻璃态卡片容器
 * - iOS风格开关
 * - 环形进度统计
 * - 4px基格间距
 * - 统一列表项样式
 */

class SettingsScene {
  constructor() {
    this.sceneManager = null
    this.elements = {}
    this.pressedItem = null
    this.showConfirm = false
    this.showResetSuccess = false
    this.resetSuccessAnimTime = 0
    this.previewEffect = null
    this.previewAnimTime = 0
    this.previewPhase = 0
    this.showTooltip = false
    this.tooltipText = ''
    this.tooltipY = 0
    this.safeArea = null
    this.theme = null
    this.animationOffset = 0
  }

  // 设置项详细说明
  static SETTING_DESCRIPTIONS = {
    sound: '开启后游戏会播放音效，如点击、胜利等声音反馈。',
    vibration: '开启后游戏会振动提示，如按键、胜利时振动反馈。',
    skipDifficultyConfirm: '开启后在游戏中切换难度时不再弹出确认对话框，直接切换并重新开始。',
    colorScheme: '选择"色盲友好"可使用更适合色盲用户的颜色方案，用蓝/橙替代红/绿。',
    difficulty: '选择数字位数，位数越多游戏难度越高。3位最简单，5位最困难。',
    transition: '选择场景切换时的动画效果。淡入淡出柔和，滑动有方向感，缩放有聚焦感。',
    vibrationIntensity: '调整振动的强度。轻柔适合安静环境，强烈反馈更明显。',
    aiAnimationSpeed: '调整AI思考时的动画速度。跳过可立即得到AI答案，适合熟悉游戏的玩家。'
  }

  onEnter() {
    this.calculateLayout()
    this.pressedItem = null

    // 初始化主题
    const Theme = require('../engine/theme')
    this.theme = Theme.helpers.getColors()
  }

  onExit() {
    globalThis.getGame().saveUserData()
  }

  calculateLayout() {
    const game = globalThis.getGame()
    const { width, height } = game.renderer

    const systemInfo = wx.getSystemInfoSync()
    this.safeArea = systemInfo.safeArea || { top: 0, bottom: height, left: 0, right: width }

    const safeTop = this.safeArea.top
    const safeBottom = this.safeArea.bottom
    const safeLeft = this.safeArea.left
    const safeRight = this.safeArea.right
    const centerX = (safeLeft + safeRight) / 2

    // 4px基格
    const sp = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 }

    // 标题栏
    const titleY = safeTop + sp.xl
    const backBtnY = titleY

    // 设置列表区域
    const listCardX = safeLeft + sp.lg
    const listCardW = safeRight - safeLeft - sp.lg * 2
    const listCardPadding = sp.md
    const itemHeight = 56

    // 计算设置项
    const settings = this.getSettingsList()
    const listContentHeight = settings.length * itemHeight
    const listCardH = listCardPadding * 2 + listContentHeight + 80 // 额外空间给统计区域

    const listCardY = titleY + 40

    // 统计区域（在设置卡片底部）
    const statsY = listCardY + listCardH - 70

    this.elements = {
      safeArea: { top: safeTop, bottom: safeBottom, left: safeLeft, right: safeRight },
      title: { x: centerX, y: titleY },
      backBtn: { x: safeLeft + sp.md, y: backBtnY, w: 44, h: 44 },
      listCard: { x: listCardX, y: listCardY, w: listCardW, h: listCardH, padding: listCardPadding },
      itemHeight,
      settings,
      stats: { x: centerX, y: statsY },
      about: { x: centerX, y: safeBottom - sp.xl }
    }
  }

  getSettingsList() {
    const game = globalThis.getGame()
    const settings = game.gameState.settings

    return [
      { id: 'difficulty', type: 'select', label: '难度', value: `${settings.difficulty}位数字`, icon: '◎' },
      { id: 'sound', type: 'toggle', label: '音效', value: settings.soundEnabled, icon: '♪' },
      { id: 'vibration', type: 'toggle', label: '震动', value: settings.vibrationEnabled !== false, icon: '⌇' },
      { id: 'colorScheme', type: 'select', label: '配色方案', value: settings.colorScheme === 'colorblind' ? '色盲友好' : '默认', icon: '◈' },
      { id: 'transition', type: 'select', label: '过渡动画', value: this.getTransitionLabel(settings.transition), icon: '↻' }
    ]
  }

  getTransitionLabel(value) {
    const labels = { fade: '淡入淡出', slide: '滑动', scale: '缩放' }
    return labels[value] || '淡入淡出'
  }

  update(deltaTime) {
    this.animationOffset += deltaTime * 0.002

    if (this.showResetSuccess) {
      this.resetSuccessAnimTime += deltaTime
      if (this.resetSuccessAnimTime > 1500) {
        this.showResetSuccess = false
        this.resetSuccessAnimTime = 0
      }
    }

    if (this.previewEffect) {
      this.previewAnimTime += deltaTime
      if (this.previewAnimTime > 1000) {
        this.previewEffect = null
        this.previewAnimTime = 0
        this.previewPhase = 0
      } else if (this.previewAnimTime > 500) {
        this.previewPhase = 1
      }
    }
  }

  render(renderer) {
    const game = globalThis.getGame()
    const theme = renderer.currentTheme
    const { width, height } = game.renderer
    const ui = renderer.ui

    // 绘制渐变背景
    renderer.drawGradientBackground()

    // 绘制返回按钮
    const backBtn = this.elements.backBtn
    ui.drawIconButton(backBtn.x, backBtn.y, backBtn.w, '‹', {
      style: 'ghost',
      pressed: this.pressedItem === 'back'
    })

    // 绘制标题
    renderer.drawText('设置', this.elements.title.x, this.elements.title.y + 20, {
      fontSize: 20,
      color: theme.text.primary,
      align: 'center',
      bold: true
    })

    // 绘制设置列表卡片
    const card = this.elements.listCard
    ui.drawGlassCard(card.x, card.y, card.w, card.h, {
      radius: 12,
      shadow: true
    })

    // 绘制设置项
    let currentY = card.y + card.padding + 20
    this.elements.settings.forEach((setting, index) => {
      this.renderSettingItem(renderer, ui, theme, setting, currentY, card.w - card.padding * 2)
      currentY += this.elements.itemHeight

      // 绘制分割线（最后一项除外）
      if (index < this.elements.settings.length - 1) {
        ui.drawDivider(card.x + card.padding, currentY - 8, card.w - card.padding * 2, {
          color: 'rgba(255, 255, 255, 0.05)'
        })
      }
    })

    // 绘制底部关于信息
    renderer.drawText('数字对决 Pro', this.elements.about.x, this.elements.about.y, {
      fontSize: 14,
      color: theme.text.secondary,
      align: 'center'
    })

    renderer.drawText(`v${game.GameConfig.version}`, this.elements.about.x, this.elements.about.y + 20, {
      fontSize: 11,
      color: theme.text.muted,
      align: 'center'
    })
  }

  renderSettingItem(renderer, ui, theme, setting, y, width) {
    const card = this.elements.listCard
    const x = card.x + card.padding

    // 绘制图标（使用简洁符号替代emoji）
    const iconMap = {
      '◎': '◎', '♪': '♪', '⌇': '⌇', '◈': '◈', '↻': '↻'
    }
    const icon = iconMap[setting.icon] || '•'

    renderer.drawText(icon, x + 10, y + 28, {
      fontSize: 16,
      color: theme.accent.light,
      align: 'left'
    })

    // 绘制标签
    renderer.drawText(setting.label, x + 40, y + 28, {
      fontSize: 15,
      color: theme.text.secondary,
      align: 'left'
    })

    // 绘制控制器
    if (setting.type === 'toggle') {
      // iOS风格开关
      this.renderToggleSwitch(renderer, theme, x + width - 56, y + 12, setting.value)
    } else if (setting.type === 'select') {
      // 选择器
      renderer.drawText(setting.value, x + width - 16, y + 28, {
        fontSize: 13,
        color: theme.text.muted,
        align: 'right'
      })

      // 箭头
      renderer.drawText('›', x + width + 8, y + 28, {
        fontSize: 16,
        color: theme.text.muted,
        align: 'right'
      })
    }
  }

  renderToggleSwitch(renderer, theme, x, y, value) {
    const { ctx, pixelRatio } = renderer
    const scale = pixelRatio

    const width = 44
    const height = 24
    const radius = height / 2

    ctx.save()

    // 绘制背景
    this._roundRect(x * scale, y * scale, width * scale, height * scale, radius * scale)
    ctx.fillStyle = value ? theme.accent.primary : 'rgba(255, 255, 255, 0.2)'
    ctx.fill()

    // 绘制圆点
    const dotRadius = 10
    const dotX = value ? x + width - radius : x + radius
    const dotY = y + height / 2

    ctx.beginPath()
    ctx.arc(dotX * scale, dotY * scale, dotRadius * scale, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()

    // 绘制阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
    ctx.shadowBlur = 4 * scale
    ctx.shadowOffsetY = 2 * scale
    ctx.fill()

    ctx.restore()
  }

  _roundRect(x, y, w, h, r) {
    const { ctx } = renderer
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }

  // 其他方法（update, handleInput等）...
}

module.exports = SettingsScene
