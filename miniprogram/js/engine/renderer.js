/**
 * 渲染引擎 - Canvas 2D 渲染器
 * 负责绑定上下文、绘制基础图形、文字、按钮等
 */

class Renderer {
  constructor(ctx, width, height, pixelRatio) {
    this.ctx = ctx
    this.width = width
    this.height = height
    this.pixelRatio = pixelRatio

    // 主题颜色
    this.theme = {
      // 深色主题（默认）
      dark: {
        bg: '#0f172a',
        bgSecondary: '#1e293b',
        bgCard: '#334155',
        textPrimary: '#f1f5f9',
        textSecondary: '#94a3b8',
        textMuted: '#64748b',
        accent: '#6366f1',
        accentLight: '#818cf8',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        border: '#334155'
      },
      // 色盲友好主题（红绿色盲优化）
      // 使用蓝色表示成功，橙色表示错误
      colorblind: {
        bg: '#0f172a',
        bgSecondary: '#1e293b',
        bgCard: '#334155',
        textPrimary: '#f1f5f9',
        textSecondary: '#94a3b8',
        textMuted: '#64748b',
        accent: '#6366f1',
        accentLight: '#818cf8',
        success: '#3b82f6',   // 蓝色代替绿色（红绿色盲友好）
        warning: '#f59e0b',
        error: '#f97316',     // 橙色代替红色
        border: '#334155'
      }
    }

    this.currentTheme = this.theme.dark
  }

  /**
   * 设置配色方案
   * @param {string} scheme - 'default' | 'colorblind'
   */
  setColorScheme(scheme) {
    if (scheme === 'colorblind') {
      this.currentTheme = this.theme.colorblind
    } else {
      this.currentTheme = this.theme.dark
    }
  }

  /**
   * 调整画布尺寸
   */
  resize(width, height, pixelRatio) {
    this.width = width
    this.height = height
    this.pixelRatio = pixelRatio
  }

  /**
   * 清空画布
   */
  clear() {
    const { ctx, width, height, pixelRatio } = this
    ctx.fillStyle = this.currentTheme.bg
    ctx.fillRect(0, 0, width * pixelRatio, height * pixelRatio)
  }

  /**
   * 绘制矩形
   */
  drawRect(x, y, w, h, options = {}) {
    const { ctx, pixelRatio } = this
    const scale = pixelRatio

    ctx.save()

    if (options.radius) {
      this._roundRect(x * scale, y * scale, w * scale, h * scale, options.radius * scale)
    } else {
      ctx.beginPath()
      ctx.rect(x * scale, y * scale, w * scale, h * scale)
    }

    if (options.fill) {
      ctx.fillStyle = options.fill
      ctx.fill()
    }

    if (options.stroke) {
      ctx.strokeStyle = options.stroke
      ctx.lineWidth = (options.strokeWidth || 1) * scale
      ctx.stroke()
    }

    ctx.restore()
  }

  /**
   * 绘制圆角矩形路径
   */
  _roundRect(x, y, w, h, r) {
    const { ctx } = this
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

  /**
   * 绘制文字
   */
  drawText(text, x, y, options = {}) {
    const { ctx, pixelRatio } = this
    const scale = pixelRatio

    ctx.save()
    ctx.font = `${(options.fontSize || 14) * scale}px ${options.fontFamily || '-apple-system, sans-serif'}`
    ctx.fillStyle = options.color || this.currentTheme.textPrimary
    ctx.textAlign = options.align || 'left'
    ctx.textBaseline = options.baseline || 'top'

    if (options.bold) {
      ctx.font = `bold ${ctx.font}`
    }

    ctx.fillText(text, x * scale, y * scale)
    ctx.restore()
  }

  /**
   * 测量文字宽度
   */
  measureText(text, fontSize = 14) {
    const { ctx, pixelRatio } = this
    ctx.font = `${fontSize * pixelRatio}px -apple-system, sans-serif`
    return ctx.measureText(text).width / pixelRatio
  }

  /**
   * 绘制按钮
   */
  drawButton(x, y, w, h, text, options = {}) {
    const theme = this.currentTheme
    const isPrimary = options.type === 'primary'
    const isSecondary = options.type === 'secondary'
    const isDisabled = options.disabled
    const isPressed = options.pressed

    // 背景
    let bgColor = options.bg || theme.bgCard
    if (isPrimary) bgColor = theme.accent
    if (isDisabled) bgColor = theme.bgSecondary
    if (isPressed) bgColor = isPrimary ? '#4f46e5' : theme.bgSecondary

    this.drawRect(x, y, w, h, {
      fill: bgColor,
      radius: options.radius || 8,
      stroke: isSecondary ? theme.border : options.stroke,
      strokeWidth: isSecondary ? 1 : options.strokeWidth
    })

    // 文字
    let textColor = theme.textPrimary
    if (isDisabled) textColor = theme.textMuted
    else if (isPrimary) textColor = '#ffffff'
    if (isPressed && !isPrimary) textColor = theme.accent

    this.drawText(text, x + w / 2, y + h / 2, {
      fontSize: options.fontSize || 16,
      color: textColor,
      align: 'center',
      baseline: 'middle',
      bold: options.bold
    })
  }

  /**
   * 绘制输入框（数字格子）
   */
  drawDigitBox(x, y, size, digit, options = {}) {
    const theme = this.currentTheme
    const isActive = options.active
    const isFilled = digit !== undefined && digit !== ''

    // 边框
    let borderColor = theme.border
    if (isActive) borderColor = theme.accentLight
    else if (isFilled) borderColor = theme.accent

    this.drawRect(x, y, size, size, {
      fill: theme.bgSecondary,
      stroke: borderColor,
      strokeWidth: isActive ? 2 : 1,
      radius: options.radius || 8
    })

    // 数字
    if (isFilled) {
      this.drawText(digit, x + size / 2, y + size / 2, {
        fontSize: options.fontSize || 28,
        color: theme.textPrimary,
        align: 'center',
        baseline: 'middle',
        bold: true
      })
    }
  }

  /**
   * 绘制键盘按键
   */
  drawKey(x, y, w, h, label, options = {}) {
    const theme = this.currentTheme
    const isDisabled = options.disabled
    const isAction = options.type === 'action' || options.type === 'primary'
    const isPressed = options.pressed

    let bgColor = theme.bgCard
    if (isDisabled) bgColor = theme.bgSecondary
    if (options.type === 'primary') bgColor = theme.accent
    if (isPressed && !isDisabled) bgColor = options.type === 'primary' ? '#4f46e5' : theme.bgSecondary

    this.drawRect(x, y, w, h, {
      fill: bgColor,
      stroke: isDisabled ? theme.border : undefined,
      strokeWidth: 1,
      radius: options.radius || 6
    })

    let textColor = isDisabled ? theme.textMuted : (options.type === 'primary' ? '#ffffff' : theme.textPrimary)
    if (isPressed && !isDisabled && options.type !== 'primary') textColor = theme.accent
    this.drawText(label, x + w / 2, y + h / 2, {
      fontSize: options.fontSize || 20,
      color: textColor,
      align: 'center',
      baseline: 'middle',
      bold: isAction
    })
  }

  /**
   * 绘制历史记录项
   */
  drawHistoryItem(x, y, w, guess, hits, blows, options = {}) {
    const theme = this.currentTheme
    const digitSize = options.digitSize || 28
    const gap = 4
    const itemHeight = options.height || 48

    // 背景
    this.drawRect(x, y, w, itemHeight, {
      fill: theme.bgCard,
      radius: 8
    })

    // 数字格子
    const digitWidth = digitSize + gap
    const startX = x + 12
    for (let i = 0; i < guess.length; i++) {
      this.drawDigitBox(startX + i * digitWidth, y + (itemHeight - digitSize) / 2, digitSize, guess[i], {
        radius: 4,
        fontSize: 18
      })
    }

    // 结果
    const resultX = startX + guess.length * digitWidth + 16
    if (hits === 0 && blows === 0) {
      // 无匹配
      this.drawText('❌', resultX, y + itemHeight / 2, {
        fontSize: 16,
        color: theme.textMuted,
        baseline: 'middle'
      })
    } else if (hits === guess.length) {
      // 全中
      this.drawText('🎯', resultX, y + itemHeight / 2, {
        fontSize: 16,
        baseline: 'middle'
      })
    } else {
      // 部分命中
      const prefix = '📍 '
      if (hits > 0) {
        this.drawText(`${prefix}${hits}A`, resultX, y + itemHeight / 2, {
          fontSize: 16,
          color: theme.success,
          baseline: 'middle',
          bold: true
        })
      }
      if (blows > 0) {
        this.drawText(`${blows}B`, resultX + (hits > 0 ? 44 : 0), y + itemHeight / 2, {
          fontSize: 16,
          color: theme.warning,
          baseline: 'middle',
          bold: true
        })
      }
    }
  }

  /**
   * 绘制渐变背景
   */
  drawGradientBackground() {
    const { ctx, width, height, pixelRatio, currentTheme } = this
    const w = width * pixelRatio
    const h = height * pixelRatio

    const gradient = ctx.createLinearGradient(0, 0, w, h)
    gradient.addColorStop(0, '#0f172a')
    gradient.addColorStop(1, '#1e293b')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)
  }

  /**
   * 绘制分割线
   */
  drawDivider(x, y, w, options = {}) {
    const theme = this.currentTheme
    this.drawRect(x, y, w, options.height || 1, {
      fill: options.color || theme.border
    })
  }

  /**
   * 绘制波纹效果
   * @param {number} x - 波纹中心 X
   * @param {number} y - 波纹中心 Y
   * @param {number} radius - 当前半径
   * @param {number} alpha - 透明度 (0-1)
   * @param {string} color - 波纹颜色
   */
  drawRipple(x, y, radius, alpha, color = '#6366f1') {
    const { ctx, pixelRatio } = this
    const scale = pixelRatio

    ctx.save()
    ctx.beginPath()
    ctx.arc(x * scale, y * scale, radius * scale, 0, Math.PI * 2)
    ctx.fillStyle = color.replace(')', `, ${alpha})`).replace('rgb', 'rgba')

    // 如果是 hex 颜色，转换为 rgba
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16)
      const g = parseInt(color.slice(3, 5), 16)
      const b = parseInt(color.slice(5, 7), 16)
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
    }

    ctx.fill()
    ctx.restore()
  }
}

module.exports = Renderer