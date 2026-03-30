/**
 * UI Kit - 极简风格组件库
 * 基于 Theme 设计系统，提供统一的UI组件绘制方法
 */

const Theme = require('./theme')

class UIKit {
  constructor(renderer) {
    this.renderer = renderer
    this.ctx = renderer.ctx
    this.pixelRatio = renderer.pixelRatio
    this.theme = Theme.helpers.getColors()
  }

  // ========== 基础绘制方法 ==========

  /**
   * 绘制玻璃态卡片
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {object} options - 可选参数
   */
  drawGlassCard(x, y, width, height, options = {}) {
    const { ctx, pixelRatio, theme } = this
    const scale = pixelRatio

    const opts = {
      fill: theme.glass.bg,
      stroke: theme.glass.border,
      radius: Theme.borderRadius.lg,
      highlight: true,
      shadow: true,
      ...options
    }

    ctx.save()

    // 绘制阴影
    if (opts.shadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
      ctx.shadowBlur = 20 * scale
      ctx.shadowOffsetY = 8 * scale
    }

    // 绘制主背景（圆角矩形）
    this._roundRect(x * scale, y * scale, width * scale, height * scale, opts.radius * scale)
    ctx.fillStyle = opts.fill
    ctx.fill()

    // 绘制边框
    ctx.strokeStyle = opts.stroke
    ctx.lineWidth = 1 * scale
    ctx.stroke()

    // 绘制顶部高光
    if (opts.highlight) {
      ctx.fillStyle = theme.glass.highlight
      ctx.beginPath()
      ctx.moveTo((x + opts.radius) * scale, (y + 1) * scale)
      ctx.lineTo((x + width - opts.radius) * scale, (y + 1) * scale)
      ctx.quadraticCurveTo((x + width) * scale, (y + 1) * scale, (x + width) * scale, (y + opts.radius) * scale)
      ctx.lineTo((x + width) * scale, (y + height * 0.3) * scale)
      ctx.lineTo(x * scale, (y + height * 0.3) * scale)
      ctx.lineTo(x * scale, (y + opts.radius) * scale)
      ctx.quadraticCurveTo(x * scale, (y + 1) * scale, (x + opts.radius) * scale, (y + 1) * scale)
      ctx.fill()
    }

    ctx.restore()
  }

  /**
   * 绘制主要按钮
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {string} text - 按钮文字
   * @param {object} options - 可选参数
   */
  drawPrimaryButton(x, y, width, height, text, options = {}) {
    const { ctx, pixelRatio, theme } = this
    const scale = pixelRatio

    const opts = {
      pressed: false,
      disabled: false,
      radius: Theme.borderRadius.md,
      withGlow: false,
      ...options
    }

    ctx.save()

    // 计算颜色
    let bgColor = theme.accent.primary
    let textColor = '#ffffff'

    if (opts.disabled) {
      bgColor = 'rgba(99, 102, 241, 0.4)'
      textColor = 'rgba(255, 255, 255, 0.5)'
    } else if (opts.pressed) {
      bgColor = theme.accent.dark
    }

    // 绘制发光效果
    if (opts.withGlow && !opts.disabled) {
      ctx.shadowColor = theme.accent.glow
      ctx.shadowBlur = 20 * scale
      ctx.shadowOffsetY = 0
    }

    // 绘制按钮背景
    this._roundRect(x * scale, y * scale, width * scale, height * scale, opts.radius * scale)
    ctx.fillStyle = bgColor
    ctx.fill()

    // 绘制顶部高光（增加立体感）
    if (!opts.pressed && !opts.disabled) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.beginPath()
      ctx.moveTo((x + opts.radius) * scale, y * scale)
      ctx.lineTo((x + width - opts.radius) * scale, y * scale)
      ctx.quadraticCurveTo((x + width) * scale, y * scale, (x + width) * scale, (y + opts.radius) * scale)
      ctx.lineTo((x + width) * scale, (y + height * 0.5) * scale)
      ctx.lineTo(x * scale, (y + height * 0.5) * scale)
      ctx.lineTo(x * scale, (y + opts.radius) * scale)
      ctx.quadraticCurveTo(x * scale, y * scale, (x + opts.radius) * scale, y * scale)
      ctx.fill()
    }

    // 绘制文字
    ctx.fillStyle = textColor
    ctx.font = `${opts.pressed ? '600' : '600'} ${16 * scale}px ${Theme.typography.fontFamily.sans}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, (x + width / 2) * scale, (y + height / 2 + (opts.pressed ? 1 : 0)) * scale)

    ctx.restore()
  }

  /**
   * 绘制次要按钮
   */
  drawSecondaryButton(x, y, width, height, text, options = {}) {
    const { ctx, pixelRatio, theme } = this
    const scale = pixelRatio

    const opts = {
      pressed: false,
      disabled: false,
      radius: Theme.borderRadius.md,
      ...options
    }

    ctx.save()

    // 计算颜色
    let bgColor = 'rgba(255, 255, 255, 0.1)'
    let borderColor = theme.border.light
    let textColor = theme.text.secondary

    if (opts.disabled) {
      bgColor = 'rgba(255, 255, 255, 0.05)'
      borderColor = 'rgba(255, 255, 255, 0.05)'
      textColor = theme.text.disabled
    } else if (opts.pressed) {
      bgColor = 'rgba(255, 255, 255, 0.15)'
      borderColor = theme.border.medium
    }

    // 绘制背景
    this._roundRect(x * scale, y * scale, width * scale, height * scale, opts.radius * scale)
    ctx.fillStyle = bgColor
    ctx.fill()

    // 绘制边框
    ctx.strokeStyle = borderColor
    ctx.lineWidth = 1 * scale
    ctx.stroke()

    // 绘制文字
    ctx.fillStyle = textColor
    ctx.font = `${opts.pressed ? '500' : '500'} ${14 * scale}px ${Theme.typography.fontFamily.sans}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, (x + width / 2) * scale, (y + height / 2 + (opts.pressed ? 1 : 0)) * scale)

    ctx.restore()
  }

  /**
   * 绘制幽灵按钮（纯文字）
   */
  drawGhostButton(x, y, width, height, text, options = {}) {
    const { ctx, pixelRatio, theme } = this
    const scale = pixelRatio

    const opts = {
      pressed: false,
      disabled: false,
      align: 'center',
      ...options
    }

    ctx.save()

    let textColor = theme.text.muted

    if (opts.disabled) {
      textColor = theme.text.disabled
    } else if (opts.pressed) {
      textColor = theme.text.secondary
    }

    // 绘制文字
    ctx.fillStyle = textColor
    ctx.font = `${opts.pressed ? '500' : '400'} ${14 * scale}px ${Theme.typography.fontFamily.sans}`
    ctx.textAlign = opts.align
    ctx.textBaseline = 'middle'

    const textX = opts.align === 'center' ? (x + width / 2) * scale : x * scale
    ctx.fillText(text, textX, (y + height / 2) * scale)

    ctx.restore()
  }

  /**
   * 绘制图标按钮（圆形）
   */
  drawIconButton(x, y, size, icon, options = {}) {
    const { ctx, pixelRatio, theme } = this
    const scale = pixelRatio

    const opts = {
      pressed: false,
      disabled: false,
      style: 'default', // 'default' | 'ghost' | 'primary'
      ...options
    }

    ctx.save()

    const radius = size / 2
    const centerX = x + radius
    const centerY = y + radius

    // 计算颜色
    let bgColor = 'rgba(255, 255, 255, 0.1)'
    let iconColor = theme.text.secondary

    if (opts.style === 'primary') {
      bgColor = opts.pressed ? theme.accent.dark : theme.accent.primary
      iconColor = '#ffffff'
    } else if (opts.style === 'ghost') {
      bgColor = 'transparent'
      iconColor = opts.pressed ? theme.text.secondary : theme.text.muted
    } else {
      // default
      if (opts.pressed) {
        bgColor = 'rgba(255, 255, 255, 0.15)'
        iconColor = theme.text.primary
      }
    }

    // 绘制圆形背景
    ctx.beginPath()
    ctx.arc(centerX * scale, centerY * scale, (radius - 2) * scale, 0, Math.PI * 2)
    ctx.fillStyle = bgColor
    ctx.fill()

    // 绘制图标（简化版 - 使用文字或简单图形）
    ctx.fillStyle = iconColor
    ctx.font = `${opts.pressed ? '600' : '500'} ${(size * 0.4) * scale}px ${Theme.typography.fontFamily.sans}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(icon, centerX * scale, (centerY + (opts.pressed ? 1 : 0)) * scale)

    ctx.restore()
  }

  /**
   * 绘制文字标签（Tag）
   */
  drawTag(x, y, text, options = {}) {
    const { ctx, pixelRatio, theme } = this
    const scale = pixelRatio

    const opts = {
      size: 'md', // 'sm' | 'md' | 'lg'
      variant: 'default', // 'default' | 'primary' | 'success' | 'warning' | 'error'
      ...options
    }

    ctx.save()

    // 计算尺寸
    const paddingX = opts.size === 'sm' ? 8 : opts.size === 'lg' ? 16 : 12
    const height = opts.size === 'sm' ? 20 : opts.size === 'lg' ? 32 : 24
    const fontSize = opts.size === 'sm' ? 10 : opts.size === 'lg' ? 14 : 12

    // 计算颜色
    const colors = {
      default: { bg: 'rgba(255, 255, 255, 0.1)', text: theme.text.secondary },
      primary: { bg: 'rgba(99, 102, 241, 0.2)', text: theme.accent.light },
      success: { bg: 'rgba(16, 185, 129, 0.2)', text: '#34d399' },
      warning: { bg: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24' },
      error: { bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171' }
    }
    const color = colors[opts.variant] || colors.default

    // 测量文字宽度
    ctx.font = `500 ${fontSize * scale}px ${Theme.typography.fontFamily.sans}`
    const textMetrics = ctx.measureText(text)
    const textWidth = textMetrics.width / scale
    const width = textWidth + paddingX * 2

    // 绘制背景
    const radius = height / 2
    this._roundRect(x * scale, y * scale, width * scale, height * scale, radius * scale)
    ctx.fillStyle = color.bg
    ctx.fill()

    // 绘制文字
    ctx.fillStyle = color.text
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, (x + width / 2) * scale, (y + height / 2) * scale)

    ctx.restore()

    // 返回实际宽度，便于布局计算
    return width
  }

  /**
   * 绘制分割线
   */
  drawDivider(x, y, width, options = {}) {
    const { ctx, pixelRatio, theme } = this
    const scale = pixelRatio

    const opts = {
      thickness: 1,
      style: 'solid', // 'solid' | 'dashed'
      color: theme.border.light,
      ...options
    }

    ctx.save()

    ctx.beginPath()
    ctx.moveTo(x * scale, y * scale)
    ctx.lineTo((x + width) * scale, y * scale)
    ctx.strokeStyle = opts.color
    ctx.lineWidth = opts.thickness * scale

    if (opts.style === 'dashed') {
      ctx.setLineDash([4 * scale, 4 * scale])
    }

    ctx.stroke()

    ctx.restore()
  }

  // ========== 复杂组件 ==========

  /**
   * 绘制带图标的列表项
   */
  drawListItem(x, y, width, height, text, options = {}) {
    const { ctx, pixelRatio, theme } = this
    const scale = pixelRatio

    const opts = {
      icon: null,
      detail: null,
      pressed: false,
      showArrow: false,
      ...options
    }

    ctx.save()

    // 绘制背景（按压效果）
    if (opts.pressed) {
      this._roundRect(x * scale, y * scale, width * scale, height * scale, 8 * scale)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.fill()
    }

    const contentX = x + 16
    const centerY = y + height / 2

    // 绘制图标
    if (opts.icon) {
      ctx.fillStyle = theme.accent.primary
      ctx.font = `500 ${16 * scale}px ${Theme.typography.fontFamily.sans}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(opts.icon, (contentX + 8) * scale, centerY * scale)
    }

    // 绘制主文字
    const textX = opts.icon ? contentX + 32 : contentX
    ctx.fillStyle = opts.pressed ? theme.text.primary : theme.text.secondary
    ctx.font = `500 ${16 * scale}px ${Theme.typography.fontFamily.sans}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, textX * scale, centerY * scale)

    // 绘制详情文字
    if (opts.detail) {
      const detailX = opts.showArrow ? x + width - 40 : x + width - 16
      ctx.fillStyle = theme.text.muted
      ctx.font = `400 ${14 * scale}px ${Theme.typography.fontFamily.sans}`
      ctx.textAlign = 'right'
      ctx.fillText(opts.detail, detailX * scale, centerY * scale)
    }

    // 绘制箭头
    if (opts.showArrow) {
      const arrowX = x + width - 24
      ctx.fillStyle = theme.text.muted
      ctx.font = `400 ${14 * scale}px ${Theme.typography.fontFamily.sans}`
      ctx.textAlign = 'center'
      ctx.fillText('›', arrowX * scale, centerY * scale)
    }

    ctx.restore()
  }

  /**
   * 绘制数字输入框
   */
  drawDigitInput(x, y, size, value, options = {}) {
    const { ctx, pixelRatio, theme } = this
    const scale = pixelRatio

    const opts = {
      focused: false,
      filled: false,
      error: false,
      success: false,
      ...options
    }

    ctx.save()

    // 计算颜色
    let borderColor = theme.border.light
    let bgColor = 'rgba(15, 23, 42, 0.6)'
    let textColor = theme.text.primary

    if (opts.error) {
      borderColor = theme.status.error
      bgColor = 'rgba(239, 68, 68, 0.1)'
    } else if (opts.success) {
      borderColor = theme.status.success
      bgColor = 'rgba(16, 185, 129, 0.1)'
    } else if (opts.focused) {
      borderColor = theme.accent.primary
      bgColor = 'rgba(99, 102, 241, 0.1)'
    } else if (opts.filled) {
      borderColor = theme.accent.light
    }

    // 绘制发光效果（聚焦状态）
    if (opts.focused) {
      ctx.shadowColor = theme.accent.glow
      ctx.shadowBlur = 15 * scale
      ctx.shadowOffsetY = 0
    }

    // 绘制背景
    this._roundRect(x * scale, y * scale, size * scale, size * scale, Theme.borderRadius.md * scale)
    ctx.fillStyle = bgColor
    ctx.fill()

    // 重置阴影
    ctx.shadowColor = 'transparent'

    // 绘制边框
    ctx.strokeStyle = borderColor
    ctx.lineWidth = 2 * scale
    ctx.stroke()

    // 绘制数字
    if (value !== null && value !== undefined && value !== '') {
      ctx.fillStyle = textColor
      ctx.font = `bold ${(size * 0.4) * scale}px ${Theme.typography.fontFamily.sans}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(value), (x + size / 2) * scale, (y + size / 2) * scale)
    }

    // 绘制光标（聚焦状态且为空）
    if (opts.focused && (value === null || value === undefined || value === '')) {
      const cursorX = (x + size / 2) * scale
      const cursorY1 = (y + size * 0.3) * scale
      const cursorY2 = (y + size * 0.7) * scale

      ctx.strokeStyle = theme.accent.primary
      ctx.lineWidth = 2 * scale
      ctx.beginPath()
      ctx.moveTo(cursorX, cursorY1)
      ctx.lineTo(cursorX, cursorY2)
      ctx.stroke()
    }

    ctx.restore()
  }

  /**
   * 绘制数字键盘按键
   */
  drawKey(x, y, size, label, options = {}) {
    const { ctx, pixelRatio, theme } = this
    const scale = pixelRatio

    const opts = {
      pressed: false,
      special: false, // 是否为特殊按键（删除、确认）
      variant: 'default', // 'default' | 'danger' | 'success'
      ...options
    }

    ctx.save()

    // 计算颜色
    let bgColor = 'rgba(255, 255, 255, 0.08)'
    let textColor = theme.text.primary
    let fontSize = size * 0.35

    if (opts.special) {
      if (opts.variant === 'danger') {
        bgColor = opts.pressed ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.2)'
        textColor = '#f87171'
      } else if (opts.variant === 'success') {
        bgColor = opts.pressed ? 'rgba(16, 185, 129, 0.4)' : 'rgba(16, 185, 129, 0.2)'
        textColor = '#34d399'
      } else {
        bgColor = opts.pressed ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.1)'
      }
      fontSize = size * 0.3
    } else if (opts.pressed) {
      bgColor = 'rgba(255, 255, 255, 0.15)'
    }

    // 绘制背景
    const radius = Theme.borderRadius.md
    this._roundRect(x * scale, y * scale, size * scale, size * scale, radius * scale)
    ctx.fillStyle = bgColor
    ctx.fill()

    // 绘制文字
    ctx.fillStyle = textColor
    ctx.font = `500 ${fontSize * scale}px ${Theme.typography.fontFamily.sans}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, (x + size / 2) * scale, (y + size / 2) * scale)

    ctx.restore()
  }

  // ========== 文字绘制 ==========

  /**
   * 绘制渐变文字
   * @param {string} text - 要绘制的文字
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {object} options - 可选参数
   */
  drawGradientText(text, x, y, options = {}) {
    const { ctx, pixelRatio, theme } = this
    const scale = pixelRatio

    const opts = {
      fontSize: 24,
      fontWeight: '600',
      align: 'center',
      baseline: 'middle',
      gradient: [theme.accent.light, theme.accent.primary],
      ...options
    }

    ctx.save()

    // 设置字体
    ctx.font = `${opts.fontWeight} ${opts.fontSize * scale}px ${Theme.typography.fontFamily.sans}`
    ctx.textAlign = opts.align
    ctx.textBaseline = opts.baseline

    // 测量文字宽度
    const textWidth = ctx.measureText(text).width

    // 创建渐变
    const gradientX = opts.align === 'center' ? x * scale - textWidth / 2 : x * scale
    const gradient = ctx.createLinearGradient(gradientX, y * scale, gradientX + textWidth, y * scale)

    // 设置渐变颜色
    if (Array.isArray(opts.gradient) && opts.gradient.length >= 2) {
      gradient.addColorStop(0, opts.gradient[0])
      gradient.addColorStop(1, opts.gradient[1])
    } else {
      gradient.addColorStop(0, theme.accent.light)
      gradient.addColorStop(1, theme.accent.primary)
    }

    // 绘制文字
    ctx.fillStyle = gradient
    ctx.fillText(text, x * scale, y * scale)

    ctx.restore()
  }

  // ========== 辅助方法 ==========

  /**
   * 绘制圆角矩形路径（私有方法）
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

  // ========== 便捷方法 ==========

  /**
   * 获取主题颜色
   */
  get colors() {
    return this.theme
  }

  /**
   * 获取间距
   */
  spacing(key) {
    return Theme.getSpacing(key)
  }

  /**
   * 获取圆角
   */
  radius(key) {
    return Theme.borderRadius[key] || Theme.borderRadius.md
  }
}

module.exports = { UIKit }

// 小程序模块注册
if (typeof registerModule === 'function') {
  registerModule('ui-kit', { UIKit })
}
