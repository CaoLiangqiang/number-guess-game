/**
 * 设置场景
 * 完整的设置选项和游戏统计展示
 * 支持惯性滚动和边界回弹效果（适配小屏幕）
 */

class SettingsScene {
  constructor() {
    this.sceneManager = null
    this.elements = {}
    this.pressedItem = null
    this.showConfirm = false // 是否显示确认对话框
    this.showResetSuccess = false // 是否显示重置成功提示
    this.resetSuccessAnimTime = 0 // 重置成功动画时间

    // 过渡效果预览
    this.previewEffect = null  // 当前预览的效果
    this.previewAnimTime = 0   // 预览动画时间
    this.previewPhase = 0      // 预览阶段 (0: 入场, 1: 出场)

    // 详细说明 tooltip
    this.showTooltip = false
    this.tooltipText = ''
    this.tooltipY = 0

    // 滚动状态（参考 history.js 实现）
    this.scrollOffset = 0
    this.maxScrollOffset = 0
    this.scrollVelocity = 0
    this.isScrolling = false
    this.friction = 0.95
    this.bounceStiffness = 0.1
    this.lastTouchY = 0
    this.lastTouchTime = 0

    // 安全区域
    this.safeArea = null
    this.contentHeight = 0
  }

  // 设置项详细说明
  static SETTING_DESCRIPTIONS = {
    sound: '🔊 开启后游戏会播放音效，如点击、胜利等声音反馈。',
    vibration: '📳 开启后游戏会振动提示，如按键、胜利时振动反馈。',
    skipDifficultyConfirm: '⚡ 开启后在游戏中切换难度时不再弹出确认对话框，直接切换并重新开始。',
    colorScheme: '🎨 选择"色盲友好"可使用更适合色盲用户的颜色方案，用蓝/橙替代红/绿。',
    difficulty: '🎯 选择数字位数，位数越多游戏难度越高。3位最简单，5位最困难。',
    transition: '🔄 选择场景切换时的动画效果。淡入淡出柔和，滑动有方向感，缩放有聚焦感。',
    vibrationIntensity: '💫 调整振动的强度。轻柔适合安静环境，强烈反馈更明显。',
    aiAnimationSpeed: '🤖 调整AI思考时的动画速度。跳过可立即得到AI答案，适合熟悉游戏的玩家。'
  }

  onEnter() {
    this.calculateLayout()
    this.pressedItem = null
    this.scrollOffset = 0
    this.scrollVelocity = 0
  }

  onExit() {
    globalThis.getGame().saveUserData()
  }

  calculateLayout() {
    const game = globalThis.getGame()
    const { width, height } = game.renderer
    const centerX = width / 2

    // 获取安全区域（参考 menu.js/game.js 实现）
    try {
      const systemInfo = wx.getSystemInfoSync()
      this.safeArea = systemInfo.safeArea || { top: 0, bottom: height, left: 0, right: width }
    } catch (e) {
      this.safeArea = { top: 0, bottom: height, left: 0, right: width }
    }

    const safeTop = this.safeArea.top
    const safeBottom = this.safeArea.bottom
    const safeHeight = safeBottom - safeTop

    // 可滚动内容区域的起始Y坐标
    const scrollAreaY = safeTop + 80  // 标题区域高度
    const scrollAreaHeight = safeBottom - safeTop - 80 - 60  // 减去标题和底部按钮区域

    const itemHeight = 56
    const gap = 8
    const previewHeight = 68

    // 计算各设置项的位置（相对于滚动区域的偏移）
    const baseY = 0  // 基准偏移，用于计算滚动时的实际位置

    this.elements = {
      title: { x: centerX, y: safeTop + 40 },
      scrollArea: { y: scrollAreaY, h: scrollAreaHeight },
      // 设置项（使用相对于滚动区域的偏移）
      difficulty: { y: baseY + 0, h: itemHeight, options: [3, 4, 5] },
      transition: { y: baseY + itemHeight + gap, h: itemHeight, options: ['fade', 'slide', 'scale'], labels: ['🌫️ 淡入', '➡️ 滑动', '📐 缩放'] },
      transitionPreview: { y: baseY + (itemHeight + gap) * 2, h: previewHeight },
      sound: { y: baseY + (itemHeight + gap) * 2 + previewHeight + gap, h: itemHeight },
      vibration: { y: baseY + (itemHeight + gap) * 3 + previewHeight + gap, h: itemHeight },
      vibrationIntensity: { y: baseY + (itemHeight + gap) * 4 + previewHeight + gap, h: itemHeight, options: ['light', 'medium', 'heavy'], labels: ['🍃 轻', '💫 中', '💪 强'] },
      colorScheme: { y: baseY + (itemHeight + gap) * 5 + previewHeight + gap, h: itemHeight, options: ['default', 'colorblind'], labels: ['🎨 默认', '👁️ 色盲友好'] },
      aiAnimationSpeed: { y: baseY + (itemHeight + gap) * 6 + previewHeight + gap, h: itemHeight, options: ['slow', 'normal', 'fast', 'skip'], labels: ['🐢 慢速', '🚶 正常', '🏃 快速', '⏭️ 跳过'] },
      skipDifficultyConfirm: { y: baseY + (itemHeight + gap) * 7 + previewHeight + gap, h: itemHeight },
      // 统计区域
      statsTitle: { y: baseY + (itemHeight + gap) * 8 + previewHeight + gap + 16 },
      stats: { y: baseY + (itemHeight + gap) * 8 + previewHeight + gap + 48, h: 80 },
      // 难度平均对比
      difficultyStats: { y: baseY + (itemHeight + gap) * 8 + previewHeight + gap + 48 + 80 + gap + 8, h: 48 },
      // 每日挑战统计（动态计算高度）
      dailyChallengeStats: { y: baseY + (itemHeight + gap) * 8 + previewHeight + gap + 48 + 80 + gap + 8 + 48 + gap, h: 64 },
      // 三个按钮：重置、导入、导出
      resetBtn: { x: centerX - 185, y: baseY + (itemHeight + gap) * 8 + previewHeight + gap + 48 + 80 + gap + 8 + 48 + gap + 64 + gap + 8, w: 110, h: 36 },
      importBtn: { x: centerX - 55, y: baseY + (itemHeight + gap) * 8 + previewHeight + gap + 48 + 80 + gap + 8 + 48 + gap + 64 + gap + 8, w: 110, h: 36 },
      exportBtn: { x: centerX + 75, y: baseY + (itemHeight + gap) * 8 + previewHeight + gap + 48 + 80 + gap + 8 + 48 + gap + 64 + gap + 8, w: 110, h: 36 },
      // 关于信息
      about: { y: baseY + (itemHeight + gap) * 8 + previewHeight + gap + 48 + 80 + gap + 8 + 48 + gap + 64 + gap + 8 + 36 + gap + 16 },
      // 按钮（固定在底部）
      backBtn: { x: centerX - 80, y: safeBottom - 55, w: 160, h: 44, text: '◀ 返回' }
    }

    // 计算内容总高度
    this.contentHeight = this.elements.about.y + 60  // about区域包含版本号和版权信息

    // 计算最大滚动偏移
    this.maxScrollOffset = Math.max(0, this.contentHeight - scrollAreaHeight + 32)  // 留一些缓冲空间

    // 存储滚动区域基准Y坐标，用于渲染时计算实际位置
    this.scrollAreaBaseY = scrollAreaY
  }

  update(deltaTime) {
    // 更新重置成功提示动画
    if (this.showResetSuccess) {
      this.resetSuccessAnimTime += deltaTime
      // 1.5秒后自动消失
      if (this.resetSuccessAnimTime > 1500) {
        this.showResetSuccess = false
        this.resetSuccessAnimTime = 0
      }
    }

    // 更新过渡效果预览动画
    if (this.previewEffect) {
      this.previewAnimTime += deltaTime
      // 每个阶段 500ms，共 1000ms
      if (this.previewAnimTime > 1000) {
        this.previewEffect = null
        this.previewAnimTime = 0
        this.previewPhase = 0
      } else if (this.previewAnimTime > 500) {
        this.previewPhase = 1  // 出场阶段
      }
    }

    // 更新滚动物理效果
    this.updateScrollPhysics(deltaTime)
  }

  /**
   * 更新滚动物理效果（参考 history.js 实现）
   */
  updateScrollPhysics(deltaTime) {
    const dt = deltaTime / 16.67  // 标准化到 60fps

    // 如果正在触摸，不更新物理
    if (this.isScrolling) return

    // 如果显示对话框，不更新滚动
    if (this.showConfirm || this.showTooltip) return

    // 应用惯性滚动
    if (Math.abs(this.scrollVelocity) > 0.5) {
      this.scrollOffset += this.scrollVelocity * dt
      this.scrollVelocity *= this.friction

      // 边界检查
      if (this.scrollOffset < 0 || this.scrollOffset > this.maxScrollOffset) {
        this.scrollVelocity *= 0.5  // 撞墙减速
      }
    } else {
      this.scrollVelocity = 0
    }

    // 边界回弹
    if (this.scrollOffset < 0) {
      this.scrollOffset += (0 - this.scrollOffset) * this.bounceStiffness * dt
      if (Math.abs(this.scrollOffset) < 0.5) this.scrollOffset = 0
    } else if (this.scrollOffset > this.maxScrollOffset) {
      this.scrollOffset += (this.maxScrollOffset - this.scrollOffset) * this.bounceStiffness * dt
      if (Math.abs(this.scrollOffset - this.maxScrollOffset) < 0.5) {
        this.scrollOffset = this.maxScrollOffset
      }
    }
  }

  render(renderer) {
    const game = globalThis.getGame()
    const theme = renderer.currentTheme
    const { width, height } = renderer
    const settings = game.gameState.settings
    const stats = game.gameState.stats

    renderer.drawGradientBackground()

    // 标题（固定在顶部，不随滚动）
    renderer.drawText('⚙️ 设置', this.elements.title.x, this.elements.title.y, {
      fontSize: 28,
      color: theme.textPrimary,
      align: 'center',
      bold: true
    })

    // 滚动区域背景
    const scrollAreaY = this.elements.scrollArea.y
    const scrollAreaH = this.elements.scrollArea.h
    renderer.drawRect(12, scrollAreaY, width - 24, scrollAreaH, { fill: theme.bgSecondary, radius: 12, alpha: 0.3 })

    // 计算滚动后的实际Y坐标
    const scrollY = (elementY) => {
      return scrollAreaY + 8 + elementY - this.scrollOffset
    }

    // 检查元素是否在可见区域内
    const isVisible = (y, h) => {
      return y + h >= scrollAreaY && y <= scrollAreaY + scrollAreaH
    }

    // 难度设置
    const diffY = scrollY(this.elements.difficulty.y)
    if (isVisible(diffY, this.elements.difficulty.h)) {
      this.renderDifficultySetting(renderer, settings, theme, width, diffY)
    }

    // 过渡效果设置
    const transY = scrollY(this.elements.transition.y)
    if (isVisible(transY, this.elements.transition.h)) {
      this.renderTransitionSetting(renderer, settings, theme, width, transY)
    }

    // 过渡效果预览
    const previewY = scrollY(this.elements.transitionPreview.y)
    if (isVisible(previewY, this.elements.transitionPreview.h)) {
      this.renderTransitionPreview(renderer, theme, width, previewY)
    }

    // 音效设置
    const soundY = scrollY(this.elements.sound.y)
    if (isVisible(soundY, this.elements.sound.h)) {
      this.renderToggleSetting(renderer, '音效', settings.soundEnabled, { y: soundY, h: this.elements.sound.h }, theme, width, 'sound', '🔊 游戏中的声音反馈', '🔊')
    }

    // 震动设置
    const vibY = scrollY(this.elements.vibration.y)
    if (isVisible(vibY, this.elements.vibration.h)) {
      this.renderToggleSetting(renderer, '震动', settings.vibrationEnabled !== false, { y: vibY, h: this.elements.vibration.h }, theme, width, 'vibration', '📳 触觉反馈增强体验', '📳')
    }

    // 振动强度设置
    const vibIntY = scrollY(this.elements.vibrationIntensity.y)
    if (isVisible(vibIntY, this.elements.vibrationIntensity.h)) {
      this.renderVibrationIntensitySetting(renderer, settings, theme, width, vibIntY)
    }

    // 配色方案设置
    const colorY = scrollY(this.elements.colorScheme.y)
    if (isVisible(colorY, this.elements.colorScheme.h)) {
      this.renderColorSchemeSetting(renderer, settings, theme, width, colorY)
    }

    // AI 动画速度设置
    const aiSpeedY = scrollY(this.elements.aiAnimationSpeed.y)
    if (isVisible(aiSpeedY, this.elements.aiAnimationSpeed.h)) {
      this.renderAIAnimationSpeedSetting(renderer, settings, theme, width, aiSpeedY)
    }

    // 难度切换确认设置
    const skipDiffY = scrollY(this.elements.skipDifficultyConfirm.y)
    if (isVisible(skipDiffY, this.elements.skipDifficultyConfirm.h)) {
      this.renderToggleSetting(renderer, '切换难度不再提示', settings.skipDifficultyConfirm || false, { y: skipDiffY, h: this.elements.skipDifficultyConfirm.h }, theme, width, 'skipDifficultyConfirm', '⚡ 游戏中直接切换难度', '⚡')
    }

    // 统计区域标题
    const statsTitleY = scrollY(this.elements.statsTitle.y)
    if (isVisible(statsTitleY, 20)) {
      renderer.drawText('📊 游戏统计', 20, statsTitleY, {
        fontSize: 14,
        color: theme.textSecondary
      })
    }

    // 统计区域
    const statsY = scrollY(this.elements.stats.y)
    if (isVisible(statsY, this.elements.stats.h)) {
      this.renderStats(renderer, stats, theme, width, statsY)
    }

    // 难度统计对比
    const diffStatsY = scrollY(this.elements.difficultyStats.y)
    if (isVisible(diffStatsY, this.elements.difficultyStats.h)) {
      this.renderDifficultyStats(renderer, theme, width, diffStatsY)
    }

    // 每日挑战统计
    const dailyY = scrollY(this.elements.dailyChallengeStats.y)
    if (isVisible(dailyY, this.elements.dailyChallengeStats.h)) {
      this.renderDailyChallengeStats(renderer, theme, width, dailyY)
    }

    // 重置按钮
    const resetY = scrollY(this.elements.resetBtn.y)
    if (isVisible(resetY, this.elements.resetBtn.h)) {
      this.renderResetButton(renderer, theme, width, resetY)
    }

    // 导入按钮
    const importY = scrollY(this.elements.importBtn.y)
    if (isVisible(importY, this.elements.importBtn.h)) {
      this.renderImportButton(renderer, theme, width, importY)
    }

    // 导出按钮
    const exportY = scrollY(this.elements.exportBtn.y)
    if (isVisible(exportY, this.elements.exportBtn.h)) {
      this.renderExportButton(renderer, theme, width, exportY)
    }

    // 关于信息
    const aboutY = scrollY(this.elements.about.y)
    if (isVisible(aboutY, 60)) {
      this.renderAbout(renderer, theme, width, aboutY)
    }

    // 滚动指示器
    if (this.maxScrollOffset > 0) {
      this.renderScrollIndicator(renderer, scrollAreaY, scrollAreaH, width, theme)
    }

    // 返回按钮（固定在底部）
    renderer.drawButton(
      this.elements.backBtn.x,
      this.elements.backBtn.y,
      this.elements.backBtn.w,
      this.elements.backBtn.h,
      this.elements.backBtn.text,
      { type: 'primary', radius: 12 }
    )

    // 确认对话框
    this.renderConfirmDialog(renderer, theme, width, height)

    // 重置成功提示
    this.renderResetSuccessToast(renderer, theme, width, height)

    // 详细说明 tooltip
    this.renderTooltip(renderer, theme, width)
  }

  /**
   * 渲染滚动指示器
   */
  renderScrollIndicator(renderer, scrollAreaY, scrollAreaH, width, theme) {
    // 指示器高度根据内容比例计算
    const indicatorHeight = Math.max(30, (scrollAreaH / (this.maxScrollOffset + scrollAreaH)) * scrollAreaH)

    // 指示器位置
    let indicatorY = scrollAreaY + (this.scrollOffset / this.maxScrollOffset) * (scrollAreaH - indicatorHeight)

    // 边界回弹时指示器也跟随
    if (this.scrollOffset < 0) {
      indicatorY = scrollAreaY + (this.scrollOffset / this.maxScrollOffset) * (scrollAreaH - indicatorHeight) * 0.5
    } else if (this.scrollOffset > this.maxScrollOffset) {
      const overflow = this.scrollOffset - this.maxScrollOffset
      indicatorY = scrollAreaY + scrollAreaH - indicatorHeight - (overflow / this.maxScrollOffset) * (scrollAreaH - indicatorHeight) * 0.5
    }

    // 指示器透明度（滚动时更明显）
    const alpha = this.isScrolling || Math.abs(this.scrollVelocity) > 1 ? 1 : 0.5

    renderer.drawRect(width - 18, indicatorY, 4, indicatorHeight, {
      fill: `rgba(148, 163, 184, ${alpha})`,
      radius: 2
    })
  }

  /**
   * 渲染难度设置
   */
  renderDifficultySetting(renderer, settings, theme, width, diffY) {
    const diffH = this.elements.difficulty.h

    // 背景
    renderer.drawRect(20, diffY, width - 40, diffH, { fill: theme.bgSecondary, radius: 12 })

    // 标签（带图标）
    renderer.drawText('🎯 难度', 40, diffY + diffH / 2, {
      fontSize: 16,
      color: theme.textPrimary,
      baseline: 'middle'
    })

    // 选项
    const options = this.elements.difficulty.options
    const optWidth = 56
    const optGap = 8
    const totalWidth = options.length * optWidth + (options.length - 1) * optGap
    const optStartX = width - 32 - totalWidth

    options.forEach((opt, index) => {
      const x = optStartX + index * (optWidth + optGap)
      const isActive = settings.difficulty === opt
      const isPressed = this.pressedItem === `diff_${opt}`

      // 选项背景
      renderer.drawRect(x, diffY + 10, optWidth, diffH - 20, {
        fill: isActive ? theme.accent : (isPressed ? theme.bgCard : 'transparent'),
        radius: 8,
        stroke: !isActive ? theme.border : undefined,
        strokeWidth: 1
      })

      // 选项文字
      renderer.drawText(`🎯 ${opt}位`, x + optWidth / 2, diffY + diffH / 2, {
        fontSize: 14,
        color: isActive ? '#ffffff' : theme.textSecondary,
        align: 'center',
        baseline: 'middle',
        bold: isActive
      })
    })
  }

  /**
   * 渲染过渡效果设置
   */
  renderTransitionSetting(renderer, settings, theme, width, transY) {
    const elem = this.elements.transition
    const h = elem.h

    // 背景
    renderer.drawRect(20, transY, width - 40, h, { fill: theme.bgSecondary, radius: 12 })

    // 标签（带图标）
    renderer.drawText('🔄 过渡', 40, transY + h / 2, {
      fontSize: 16,
      color: theme.textPrimary,
      baseline: 'middle'
    })

    // 选项
    const options = elem.options
    const labels = elem.labels
    const optWidth = 56
    const optGap = 8
    const totalWidth = options.length * optWidth + (options.length - 1) * optGap
    const optStartX = width - 32 - totalWidth

    const currentEffect = settings.transitionEffect || 'fade'

    options.forEach((opt, index) => {
      const x = optStartX + index * (optWidth + optGap)
      const isActive = currentEffect === opt
      const isPressed = this.pressedItem === `trans_${opt}`

      // 选项背景
      renderer.drawRect(x, transY + 10, optWidth, h - 20, {
        fill: isActive ? theme.accent : (isPressed ? theme.bgCard : 'transparent'),
        radius: 8,
        stroke: !isActive ? theme.border : undefined,
        strokeWidth: 1
      })

      // 选项文字
      renderer.drawText(labels[index], x + optWidth / 2, transY + h / 2, {
        fontSize: 14,
        color: isActive ? '#ffffff' : theme.textSecondary,
        align: 'center',
        baseline: 'middle',
        bold: isActive
      })
    })
  }

  /**
   * 渲染过渡效果预览
   */
  renderTransitionPreview(renderer, theme, width, previewY) {
    const previewH = this.elements.transitionPreview.h

    // 预览背景
    renderer.drawRect(20, previewY, width - 40, previewH, { fill: theme.bgSecondary, radius: 12 })

    // 预览标签
    renderer.drawText('👁️ 预览', 40, previewY + 16, {
      fontSize: 12,
      color: theme.textMuted
    })

    // 预览演示卡片
    const cardW = 80
    const cardH = 32
    const cardX = width / 2 - cardW / 2
    const cardY = previewY + 20

    if (this.previewEffect) {
      // 正在预览
      this.renderPreviewCard(renderer, cardX, cardY, cardW, cardH, theme)
    } else {
      // 静态提示
      renderer.drawRect(cardX, cardY, cardW, cardH, { fill: theme.bgCard, radius: 8 })
      renderer.drawText('👆 点击选项预览', cardX + cardW / 2, cardY + cardH / 2, {
        fontSize: 12,
        color: theme.textMuted,
        align: 'center',
        baseline: 'middle'
      })
    }
  }

  /**
   * 渲染预览卡片（带动画）
   */
  renderPreviewCard(renderer, x, y, w, h, theme) {
    const progress = this.previewPhase === 0
      ? this.previewAnimTime / 500
      : 1 - (this.previewAnimTime - 500) / 500

    const clampedProgress = Math.max(0, Math.min(1, progress))

    switch (this.previewEffect) {
      case 'fade':
        // 淡入淡出
        const alpha = clampedProgress
        renderer.drawRect(x, y, w, h, {
          fill: `rgba(99, 102, 241, ${alpha})`,
          radius: 8
        })
        break

      case 'slide':
        // 滑动
        const slideOffset = (1 - clampedProgress) * w
        renderer.drawRect(x - slideOffset, y, w, h, {
          fill: theme.accent,
          radius: 8
        })
        break

      case 'scale':
        // 缩放
        const scale = 0.3 + clampedProgress * 0.7
        const scaledW = w * scale
        const scaledH = h * scale
        const scaledX = x + (w - scaledW) / 2
        const scaledY = y + (h - scaledH) / 2
        renderer.drawRect(scaledX, scaledY, scaledW, scaledH, {
          fill: theme.accent,
          radius: 8 * scale
        })
        break
    }
  }

  /**
   * 渲染开关设置
   */
  renderToggleSetting(renderer, label, isEnabled, element, theme, width, key, helpText = null, icon = null) {
    const y = element.y
    const h = element.h
    const isPressed = this.pressedItem === key

    // 背景
    renderer.drawRect(20, y, width - 40, h, { fill: theme.bgSecondary, radius: 12 })

    // 标签位置（有帮助文字时上移）
    const labelY = helpText ? y + h / 2 - 8 : y + h / 2

    // 图标和标签
    const labelText = icon ? `${icon}  ${label}` : label
    renderer.drawText(labelText, 40, labelY, {
      fontSize: 16,
      color: theme.textPrimary,
      baseline: 'middle'
    })

    // 帮助文字
    if (helpText) {
      const helpX = icon ? 60 : 40  // 有图标时缩进
      renderer.drawText(helpText, helpX, y + h / 2 + 10, {
        fontSize: 11,
        color: theme.textMuted,
        baseline: 'middle'
      })
    }

    // 开关
    const switchWidth = 48
    const switchHeight = 28
    const switchX = width - 40 - switchWidth
    const switchY = y + (h - switchHeight) / 2

    // 开关轨道
    renderer.drawRect(switchX, switchY, switchWidth, switchHeight, {
      fill: isEnabled ? theme.accent : theme.bgCard,
      radius: switchHeight / 2
    })

    // 开关把手
    const knobSize = 22
    const knobX = isEnabled ? switchX + switchWidth - knobSize - 3 : switchX + 3
    const knobY = switchY + (switchHeight - knobSize) / 2

    renderer.drawRect(knobX, knobY, knobSize, knobSize, {
      fill: '#ffffff',
      radius: knobSize / 2
    })
  }

  /**
   * 渲染振动强度设置
   */
  renderVibrationIntensitySetting(renderer, settings, theme, width, vibIntY) {
    const elem = this.elements.vibrationIntensity
    const h = elem.h

    // 背景
    renderer.drawRect(20, vibIntY, width - 40, h, { fill: theme.bgSecondary, radius: 12 })

    // 标签（带图标）
    renderer.drawText('💫 振动强度', 40, vibIntY + h / 2, {
      fontSize: 16,
      color: theme.textPrimary,
      baseline: 'middle'
    })

    // 选项
    const options = elem.options
    const labels = elem.labels
    const optWidth = 56
    const optGap = 8
    const totalWidth = options.length * optWidth + (options.length - 1) * optGap
    const optStartX = width - 32 - totalWidth

    const currentIntensity = settings.vibrationIntensity || 'medium'

    options.forEach((opt, index) => {
      const x = optStartX + index * (optWidth + optGap)
      const isActive = currentIntensity === opt
      const isPressed = this.pressedItem === `vibInt_${opt}`

      // 选项背景
      renderer.drawRect(x, vibIntY + 10, optWidth, h - 20, {
        fill: isActive ? theme.accent : (isPressed ? theme.bgCard : 'transparent'),
        radius: 8,
        stroke: !isActive ? theme.border : undefined,
        strokeWidth: 1
      })

      // 选项文字
      renderer.drawText(labels[index], x + optWidth / 2, vibIntY + h / 2, {
        fontSize: 14,
        color: isActive ? '#ffffff' : theme.textSecondary,
        align: 'center',
        baseline: 'middle',
        bold: isActive
      })
    })
  }

  /**
   * 渲染配色方案设置
   */
  renderColorSchemeSetting(renderer, settings, theme, width, colorY) {
    const elem = this.elements.colorScheme
    const h = elem.h

    // 背景
    renderer.drawRect(20, colorY, width - 40, h, { fill: theme.bgSecondary, radius: 12 })

    // 标签（带图标）
    renderer.drawText('🎨 配色', 40, colorY + h / 2 - 8, {
      fontSize: 16,
      color: theme.textPrimary,
      baseline: 'middle'
    })

    // 帮助文字
    renderer.drawText('🌈 切换颜色显示模式', 40, colorY + h / 2 + 10, {
      fontSize: 11,
      color: theme.textMuted,
      baseline: 'middle'
    })

    // 选项
    const options = elem.options
    const labels = elem.labels
    const optWidth = 72
    const optGap = 8
    const totalWidth = options.length * optWidth + (options.length - 1) * optGap
    const optStartX = width - 32 - totalWidth

    const currentScheme = settings.colorScheme || 'default'

    options.forEach((opt, index) => {
      const x = optStartX + index * (optWidth + optGap)
      const isActive = currentScheme === opt
      const isPressed = this.pressedItem === `color_${opt}`

      // 选项背景
      renderer.drawRect(x, colorY + 10, optWidth, h - 20, {
        fill: isActive ? theme.accent : (isPressed ? theme.bgCard : 'transparent'),
        radius: 8,
        stroke: !isActive ? theme.border : undefined,
        strokeWidth: 1
      })

      // 选项文字
      renderer.drawText(labels[index], x + optWidth / 2, colorY + h / 2, {
        fontSize: 14,
        color: isActive ? '#ffffff' : theme.textSecondary,
        align: 'center',
        baseline: 'middle',
        bold: isActive
      })
    })
  }

  /**
   * 渲染 AI 动画速度设置
   */
  renderAIAnimationSpeedSetting(renderer, settings, theme, width, aiSpeedY) {
    const elem = this.elements.aiAnimationSpeed
    const h = elem.h

    // 背景
    renderer.drawRect(20, aiSpeedY, width - 40, h, { fill: theme.bgSecondary, radius: 12 })

    // 标签（带图标）
    renderer.drawText('🤖 AI速度', 40, aiSpeedY + h / 2 - 12, {
      fontSize: 16,
      color: theme.textPrimary,
      baseline: 'middle'
    })

    // 预估时长
    const estimatedTime = this.getEstimatedGameTime(settings.aiAnimationSpeed || 'normal')
    renderer.drawText(estimatedTime, 40, aiSpeedY + h / 2 + 4, {
      fontSize: 11,
      color: theme.textMuted,
      baseline: 'middle'
    })

    // 历史平均回合数
    const avgTurns = this.getHistoricalAverageTurns(settings.difficulty || 4)
    if (avgTurns !== null) {
      renderer.drawText(`📊 历史平均: ${avgTurns}回合`, 40, aiSpeedY + h / 2 + 20, {
        fontSize: 10,
        color: theme.textMuted,
        baseline: 'middle'
      })
    }

    // 选项
    const options = elem.options
    const labels = elem.labels
    const optWidth = 48
    const optGap = 6
    const totalWidth = options.length * optWidth + (options.length - 1) * optGap
    const optStartX = width - 32 - totalWidth

    const currentSpeed = settings.aiAnimationSpeed || 'normal'

    options.forEach((opt, index) => {
      const x = optStartX + index * (optWidth + optGap)
      const isActive = currentSpeed === opt
      const isPressed = this.pressedItem === `aiSpeed_${opt}`

      // 选项背景
      renderer.drawRect(x, aiSpeedY + 10, optWidth, h - 20, {
        fill: isActive ? theme.accent : (isPressed ? theme.bgCard : 'transparent'),
        radius: 8,
        stroke: !isActive ? theme.border : undefined,
        strokeWidth: 1
      })

      // 选项文字
      renderer.drawText(labels[index], x + optWidth / 2, aiSpeedY + h / 2, {
        fontSize: 12,
        color: isActive ? '#ffffff' : theme.textSecondary,
        align: 'center',
        baseline: 'middle',
        bold: isActive
      })
    })
  }

  /**
   * 获取预估游戏时长
   * 根据难度和 AI 动画速度计算
   * 优先使用用户历史平均回合数
   */
  getEstimatedGameTime(speed) {
    const game = globalThis.getGame()
    const difficulty = game.gameState.settings.difficulty || 4

    // 优先使用用户历史平均回合数
    let avgRounds = this.getHistoricalAverageTurns(difficulty)

    // 无历史数据时使用默认值
    if (avgRounds === null) {
      const avgRoundsMap = {
        3: 4,   // 3位难度：平均约 4 回合
        4: 6,   // 4位难度：平均约 6 回合
        5: 8    // 5位难度：平均约 8 回合
      }
      avgRounds = avgRoundsMap[difficulty] || 6
    }

    const delayMap = {
      'slow': 2000,
      'normal': 1000,
      'fast': 500,
      'skip': 100
    }
    const delay = delayMap[speed] || 1000
    const totalMs = Math.round(avgRounds) * delay

    // 转换为秒
    const seconds = Math.round(totalMs / 1000)

    if (seconds < 1) {
      return '⏱️ 预计 <1秒/局'
    } else if (seconds < 60) {
      return `⏱️ 预计 ~${seconds}秒/局`
    } else {
      const minutes = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `⏱️ 预计 ~${minutes}分${secs}秒/局`
    }
  }

  /**
   * 获取历史平均回合数
   * @param {number} difficulty - 难度
   * @returns {number|null} 平均回合数，无数据返回 null
   */
  getHistoricalAverageTurns(difficulty) {
    const game = globalThis.getGame()
    return game.storageManager.getAverageTurns(difficulty)
  }

  /**
   * 渲染统计信息
   */
  renderStats(renderer, stats, theme, width, statsY) {
    const statsH = this.elements.stats.h
    const game = globalThis.getGame()

    // 统计卡片
    renderer.drawRect(20, statsY, width - 40, statsH, { fill: theme.bgSecondary, radius: 12 })

    // 计算胜率
    const winRate = stats.totalGames > 0
      ? Math.round(stats.wins / stats.totalGames * 100)
      : 0

    // 绘制胜率环形图
    const ringX = 60
    const ringY = statsY + statsH / 2
    const ringRadius = 28
    const lineWidth = 6

    // 环形图背景
    renderer.drawRingProgress(ringX, ringY, ringRadius, lineWidth, winRate / 100, theme.success, theme.bgCard)

    // 环形图中心文字
    renderer.drawText(`${winRate}%`, ringX, ringY - 8, {
      fontSize: 16,
      color: theme.textPrimary,
      align: 'center',
      baseline: 'middle',
      bold: true
    })
    renderer.drawText('胜率', ringX, ringY + 10, {
      fontSize: 10,
      color: theme.textMuted,
      align: 'center',
      baseline: 'middle'
    })

    // 统计项（右侧）
    const totalDuration = game.storageManager.getTotalDuration()
    const totalHours = Math.floor(totalDuration / 3600)
    const totalMins = Math.floor((totalDuration % 3600) / 60)
    const totalTimeStr = totalHours > 0 ? `${totalHours}时${totalMins}分` : `${totalMins}分`

    // 右侧统计项布局
    const rightStartX = 110
    const statItems = [
      { label: '🎮 总场次', value: stats.totalGames || 0 },
      { label: '⏱️ 总用时', value: totalTimeStr }
    ]

    const itemHeight = 32
    statItems.forEach((item, index) => {
      const itemY = statsY + 16 + index * itemHeight

      renderer.drawText(item.value, rightStartX, itemY, {
        fontSize: 18,
        color: theme.textPrimary,
        bold: true
      })

      renderer.drawText(item.label, rightStartX, itemY + 18, {
        fontSize: 11,
        color: theme.textMuted
      })
    })

    // 最高连胜日期（如果有）
    const fullStats = game.storageManager.getStats()

    // 平均回合数（当前难度）
    const currentDifficulty = game.gameState.settings.difficulty || 4
    const avgTurns = game.storageManager.getAverageTurns(currentDifficulty)
    const bestTurns = game.storageManager.getBestTurns(currentDifficulty)
    const avgDuration = game.storageManager.getAverageDuration(currentDifficulty)
    const infoY = statsY + statsH - 12

    // 构建信息行
    const infoParts = []
    // 总猜测次数
    const totalGuesses = game.storageManager.getTotalGuesses()
    if (totalGuesses > 0) {
      infoParts.push(`📊 ${totalGuesses}次猜测`)
    }
    if (avgTurns !== null) {
      infoParts.push(`📈 平均${avgTurns}回合`)
    }
    if (avgDuration !== null) {
      const minutes = Math.floor(avgDuration / 60)
      const seconds = avgDuration % 60
      const timeStr = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`
      infoParts.push(`⏱️ 平均${timeStr}`)
    }
    // 最佳回合数
    const bestTurnsDate = game.storageManager.getBestTurnsDate(currentDifficulty)
    if (bestTurns !== null) {
      if (bestTurnsDate) {
        const date = new Date(bestTurnsDate)
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`
        infoParts.push(`🏆 最佳${bestTurns}回合 (${dateStr})`)
      } else {
        infoParts.push(`🏆 最佳${bestTurns}回合`)
      }
    }
    // 最佳用时
    const bestDuration = game.storageManager.getBestDuration(currentDifficulty)
    const bestDurationDate = game.storageManager.getBestDurationDate(currentDifficulty)
    if (bestDuration !== null) {
      const bestMin = Math.floor(bestDuration / 60)
      const bestSec = bestDuration % 60
      const bestTimeStr = bestMin > 0 ? `${bestMin}分${bestSec}秒` : `${bestSec}秒`
      // 如果有日期，添加日期显示
      if (bestDurationDate) {
        const date = new Date(bestDurationDate)
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`
        infoParts.push(`⚡ 最佳${bestTimeStr} (${dateStr})`)
      } else {
        infoParts.push(`⚡ 最佳${bestTimeStr}`)
      }
    }
    if (fullStats.maxWinStreakDate && fullStats.maxWinStreak > 0) {
      const dateStr = this.formatStreakDate(fullStats.maxWinStreakDate)
      infoParts.push(`📅 ${dateStr}`)
    }

    if (infoParts.length > 0) {
      // 如果信息太多，分两行显示
      if (infoParts.length > 3) {
        const line1 = infoParts.slice(0, 2).join('  ·  ')
        const line2 = infoParts.slice(2, 4).join('  ·  ')
        const line3 = infoParts.slice(4).join('  ·  ')
        renderer.drawText(line1, width / 2, infoY - 20, {
          fontSize: 11,
          color: theme.textMuted,
          align: 'center'
        })
        renderer.drawText(line2, width / 2, infoY - 4, {
          fontSize: 11,
          color: theme.textMuted,
          align: 'center'
        })
        renderer.drawText(line3, width / 2, infoY + 12, {
          fontSize: 11,
          color: theme.textMuted,
          align: 'center'
        })
      } else if (infoParts.length > 2) {
        const line1 = infoParts.slice(0, 2).join('  ·  ')
        const line2 = infoParts.slice(2).join('  ·  ')
        renderer.drawText(line1, width / 2, infoY - 12, {
          fontSize: 11,
          color: theme.textMuted,
          align: 'center'
        })
        renderer.drawText(line2, width / 2, infoY + 4, {
          fontSize: 11,
          color: theme.textMuted,
          align: 'center'
        })
      } else {
        renderer.drawText(infoParts.join('  ·  '), width / 2, infoY, {
          fontSize: 11,
          color: theme.textMuted,
          align: 'center'
        })
      }
    }
  }

  /**
   * 格式化连胜记录日期
   * @param {string} isoDate - ISO 日期字符串
   * @returns {string} 格式化的日期
   */
  formatStreakDate(isoDate) {
    try {
      const date = new Date(isoDate)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const day = date.getDate()
      return `${year}年${month}月${day}日`
    } catch (e) {
      return ''
    }
  }

  /**
   * 渲染难度统计对比
   */
  renderDifficultyStats(renderer, theme, width, diffStatsY) {
    const game = globalThis.getGame()
    const elem = this.elements.difficultyStats
    const h = elem.h
    const currentDifficulty = game.gameState.settings.difficulty || 4

    // 获取各难度的平均回合数
    const avg3 = game.storageManager.getAverageTurns(3)
    const avg4 = game.storageManager.getAverageTurns(4)
    const avg5 = game.storageManager.getAverageTurns(5)

    // 如果没有任何历史数据，不显示
    if (avg3 === null && avg4 === null && avg5 === null) {
      // 清空点击区域
      this.elements.difficultyStatsAreas = []
      return
    }

    // 背景
    renderer.drawRect(20, diffStatsY, width - 40, h, { fill: theme.bgSecondary, radius: 12 })

    // 标题
    renderer.drawText('📈 各难度平均回合', 32, diffStatsY + h / 2, {
      fontSize: 12,
      color: theme.textMuted,
      baseline: 'middle'
    })

    // 各难度数据
    const difficulties = [
      { label: '🎯 3位', value: avg3, diff: 3 },
      { label: '🎯 4位', value: avg4, diff: 4 },
      { label: '🎯 5位', value: avg5, diff: 5 }
    ]

    const itemWidth = (width - 100) / 3
    const startX = 100

    // 存储点击区域
    this.elements.difficultyStatsAreas = []

    difficulties.forEach((diff, index) => {
      const x = startX + itemWidth * index
      const centerX = x + itemWidth / 2
      const isActive = currentDifficulty === diff.diff

      // 存储点击区域
      this.elements.difficultyStatsAreas.push({
        x: x,
        y: diffStatsY,
        w: itemWidth,
        h: h,
        difficulty: diff.diff
      })

      // 当前难度高亮背景
      if (isActive) {
        renderer.drawRect(x, diffStatsY + 4, itemWidth - 8, h - 8, {
          fill: theme.accent,
          radius: 8,
          alpha: 0.15
        })
      }

      if (diff.value !== null) {
        renderer.drawText(`${diff.value}`, centerX, diffStatsY + h / 2, {
          fontSize: 16,
          color: isActive ? theme.accent : theme.textPrimary,
          align: 'center',
          baseline: 'middle',
          bold: isActive
        })
        renderer.drawText(diff.label, centerX + 28, diffStatsY + h / 2, {
          fontSize: 11,
          color: isActive ? theme.accent : theme.textMuted,
          baseline: 'middle'
        })
      } else {
        renderer.drawText('－', centerX, diffStatsY + h / 2, {
          fontSize: 16,
          color: theme.textMuted,
          align: 'center',
          baseline: 'middle'
        })
        renderer.drawText(diff.label, centerX + 20, diffStatsY + h / 2, {
          fontSize: 11,
          color: theme.textMuted,
          baseline: 'middle'
        })
      }
    })
  }

  /**
   * 渲染每日挑战统计
   */
  renderDailyChallengeStats(renderer, theme, width, dailyY) {
    const game = globalThis.getGame()
    const dailyStats = game.storageManager.getDailyChallengeStats()
    const streak = game.storageManager.getDailyChallengeStreak()

    // 如果没有任何挑战记录，不显示
    if (dailyStats.totalDays === 0) return

    const h = this.elements.dailyChallengeStats.h

    // 背景
    renderer.drawRect(20, dailyY, width - 40, h, { fill: theme.bgSecondary, radius: 12 })

    // 标题
    renderer.drawText('🎯 每日挑战', 32, dailyY + 16, {
      fontSize: 12,
      color: theme.textMuted
    })

    // 统计项
    const stats = [
      { label: '🔥 连续', value: `${streak}天` },
      { label: '📊 完成', value: `${dailyStats.totalDays}天` }
    ]

    // 如果有最佳记录
    if (dailyStats.bestTurns !== null) {
      stats.push({ label: '⭐ 最佳', value: `${dailyStats.bestTurns}回合` })
    }

    const itemWidth = (width - 60) / stats.length
    stats.forEach((stat, index) => {
      const x = 30 + itemWidth * index + itemWidth / 2

      renderer.drawText(stat.value, x, dailyY + 30, {
        fontSize: 16,
        color: theme.textPrimary,
        align: 'center',
        bold: true
      })

      renderer.drawText(stat.label, x, dailyY + 50, {
        fontSize: 10,
        color: theme.textMuted,
        align: 'center'
      })
    })
  }

  /**
   * 渲染重置按钮
   */
  renderResetButton(renderer, theme, width, resetY) {
    const btn = this.elements.resetBtn
    const isPressed = this.pressedItem === 'reset'

    renderer.drawButton(btn.x, resetY, btn.w, btn.h, '🗑️ 重置数据', {
      radius: 8,
      fontSize: 14,
      pressed: isPressed
    })
  }

  /**
   * 渲染导出按钮
   */
  renderExportButton(renderer, theme, width, exportY) {
    const btn = this.elements.exportBtn
    const isPressed = this.pressedItem === 'export'

    renderer.drawButton(btn.x, exportY, btn.w, btn.h, '📤 导出数据', {
      radius: 8,
      fontSize: 14,
      pressed: isPressed
    })
  }

  /**
   * 渲染导入按钮
   */
  renderImportButton(renderer, theme, width, importY) {
    const btn = this.elements.importBtn
    const isPressed = this.pressedItem === 'import'

    renderer.drawButton(btn.x, importY, btn.w, btn.h, '📥 导入数据', {
      radius: 8,
      fontSize: 14,
      pressed: isPressed
    })
  }

  /**
   * 渲染关于信息
   */
  renderAbout(renderer, theme, width, aboutY) {
    const game = globalThis.getGame()

    renderer.drawText(`v${game.GameConfig.version}`, width / 2, aboutY, {
      fontSize: 12,
      color: theme.textMuted,
      align: 'center'
    })

    renderer.drawText('🎮 数字对决 Pro', width / 2, aboutY + 20, {
      fontSize: 12,
      color: theme.textMuted,
      align: 'center'
    })

    renderer.drawText('© 2026 数字对决团队', width / 2, aboutY + 40, {
      fontSize: 10,
      color: theme.textMuted,
      align: 'center'
    })
  }

  /**
   * 渲染确认对话框
   */
  renderConfirmDialog(renderer, theme, width, height) {
    if (!this.showConfirm) return

    // 半透明遮罩
    renderer.drawRect(0, 0, width, height, { fill: 'rgba(0,0,0,0.6)' })

    const dialogW = 280
    const dialogH = 160
    const dialogX = (width - dialogW) / 2
    const dialogY = (height - dialogH) / 2

    // 对话框背景
    renderer.drawRect(dialogX, dialogY, dialogW, dialogH, {
      fill: theme.bgSecondary,
      radius: 16
    })

    // 标题
    renderer.drawText('⚠️ 确认重置', width / 2, dialogY + 32, {
      fontSize: 18,
      color: theme.textPrimary,
      align: 'center',
      bold: true
    })

    // 提示文字
    renderer.drawText('⚠️ 确定要重置所有游戏统计数据吗？', width / 2, dialogY + 64, {
      fontSize: 14,
      color: theme.textSecondary,
      align: 'center'
    })

    renderer.drawText('⚡ 此操作不可撤销', width / 2, dialogY + 84, {
      fontSize: 12,
      color: theme.textMuted,
      align: 'center'
    })

    // 按钮
    const btnW = 100
    const btnH = 40
    const btnY = dialogY + dialogH - 56
    const cancelX = dialogX + 20
    const confirmX = dialogX + dialogW - btnW - 20

    // 取消按钮
    const cancelPressed = this.pressedItem === 'confirm_cancel'
    renderer.drawButton(cancelX, btnY, btnW, btnH, '✕ 取消', {
      radius: 10,
      fontSize: 14,
      pressed: cancelPressed
    })

    // 确认按钮
    const confirmPressed = this.pressedItem === 'confirm_ok'
    renderer.drawButton(confirmX, btnY, btnW, btnH, '✓ 确认', {
      type: 'primary',
      radius: 10,
      fontSize: 14,
      pressed: confirmPressed
    })
  }

  /**
   * 渲染重置成功提示
   */
  renderResetSuccessToast(renderer, theme, width, height) {
    if (!this.showResetSuccess) return

    // 计算透明度（淡入淡出）
    let alpha = 1
    const progress = this.resetSuccessAnimTime / 1500
    if (progress < 0.2) {
      // 淡入
      alpha = progress / 0.2
    } else if (progress > 0.8) {
      // 淡出
      alpha = (1 - progress) / 0.2
    }

    // 提示框
    const toastW = 200
    const toastH = 48
    const toastX = (width - toastW) / 2
    const toastY = height / 2 - 100

    // 背景
    renderer.drawRect(toastX, toastY, toastW, toastH, {
      fill: `rgba(16, 185, 129, ${alpha * 0.95})`,
      radius: 12
    })

    // 成功图标（简单的对勾）
    const iconX = toastX + 24
    const iconY = toastY + toastH / 2
    renderer.drawText('✓', iconX, iconY, {
      fontSize: 20,
      color: `rgba(255, 255, 255, ${alpha})`,
      align: 'center',
      baseline: 'middle',
      bold: true
    })

    // 文字
    renderer.drawText('✅ 重置成功', toastX + toastW / 2 + 10, iconY, {
      fontSize: 16,
      color: `rgba(255, 255, 255, ${alpha})`,
      align: 'center',
      baseline: 'middle'
    })
  }

  /**
   * 开始过渡效果预览
   * @param {string} effect - 过渡效果类型
   */
  startPreview(effect) {
    this.previewEffect = effect
    this.previewAnimTime = 0
    this.previewPhase = 0
  }

  /**
   * 显示重置确认对话框
   */
  showResetConfirm() {
    this.showConfirm = true
  }

  /**
   * 重置统计数据
   */
  resetStats() {
    const game = globalThis.getGame()
    game.gameState.stats = {
      totalGames: 0,
      wins: 0,
      winStreak: 0,
      maxWinStreak: 0
    }
    game.saveUserData()
    this.showConfirm = false
    this.showResetSuccess = true
    this.resetSuccessAnimTime = 0
  }

  handleInput(events) {
    const game = globalThis.getGame()
    const settings = game.gameState.settings
    const { width, height } = game.renderer

    events.forEach(event => {
      // 处理滚动事件
      if (event.type === 'swipe') {
        if (this.showConfirm || this.showTooltip) return  // 显示对话框时不处理滚动

        // 处理滚动区域内的滑动
        const scrollAreaY = this.elements.scrollArea.y
        const scrollAreaH = this.elements.scrollArea.h
        if (event.y >= scrollAreaY && event.y <= scrollAreaY + scrollAreaH) {
          this.scrollVelocity = event.dy
          this.scrollOffset = Math.max(-50, Math.min(this.maxScrollOffset + 50, this.scrollOffset - event.dy))
        }
        return
      }

      // 处理触摸开始/结束
      if (event.type === 'touchstart') {
        this.isScrolling = true
        this.scrollVelocity = 0
        this.lastTouchY = event.y
        this.lastTouchTime = Date.now()
        return
      }

      if (event.type === 'touchend') {
        this.isScrolling = false
        return
      }

      if (event.type === 'tap') {
        // 如果显示 tooltip，点击任意位置关闭
        if (this.showTooltip) {
          this.showTooltip = false
          return
        }

        // 如果显示确认对话框，优先处理对话框输入
        if (this.showConfirm) {
          this.handleConfirmDialogInput(event, game, width, height)
          return
        }

        this.pressedItem = null

        // 计算滚动后的实际Y坐标
        const scrollAreaY = this.elements.scrollArea.y
        const scrollY = (elementY) => {
          return scrollAreaY + 8 + elementY - this.scrollOffset
        }

        // 难度选择
        const options = this.elements.difficulty.options
        const optWidth = 56
        const optGap = 8
        const totalWidth = options.length * optWidth + (options.length - 1) * optGap
        const optStartX = width - 32 - totalWidth
        const diffY = scrollY(this.elements.difficulty.y)
        const diffH = this.elements.difficulty.h

        options.forEach((opt, index) => {
          const x = optStartX + index * (optWidth + optGap)
          if (game.inputManager.hitTest(event, x, diffY + 10, optWidth, diffH - 20)) {
            settings.difficulty = opt
            game.audioManager.playKeyPress()
            game.audioManager.vibrate('short')
          }
        })

        // 过渡效果选择
        const transElem = this.elements.transition
        const transOptions = transElem.options
        const transOptWidth = 56
        const transOptGap = 8
        const transTotalWidth = transOptions.length * transOptWidth + (transOptions.length - 1) * transOptGap
        const transOptStartX = width - 32 - transTotalWidth
        const transY = scrollY(this.elements.transition.y)
        const transH = transElem.h

        transOptions.forEach((opt, index) => {
          const x = transOptStartX + index * (transOptWidth + transOptGap)
          if (game.inputManager.hitTest(event, x, transY + 10, transOptWidth, transH - 20)) {
            settings.transitionEffect = opt
            game.audioManager.playKeyPress()
            game.audioManager.vibrate('short')
            this.startPreview(opt)
          }
        })

        // 音效开关
        const soundY = scrollY(this.elements.sound.y)
        const soundH = this.elements.sound.h
        if (game.inputManager.hitTest(event, 20, soundY, width - 40, soundH)) {
          settings.soundEnabled = !settings.soundEnabled
          game.audioManager.setEnabled(settings.soundEnabled)
          game.audioManager.playKeyPress()
          game.audioManager.vibrate('short')
        }

        // 震动开关
        const vibY = scrollY(this.elements.vibration.y)
        const vibH = this.elements.vibration.h
        if (game.inputManager.hitTest(event, 20, vibY, width - 40, vibH)) {
          settings.vibrationEnabled = settings.vibrationEnabled !== false ? false : true
          game.audioManager.setVibrationEnabled(settings.vibrationEnabled)
          game.audioManager.playKeyPress()
          if (settings.vibrationEnabled) {
            game.audioManager.vibrate('short')
          }
        }

        // 振动强度选择
        const vibIntElem = this.elements.vibrationIntensity
        const vibIntOptions = vibIntElem.options
        const vibIntOptWidth = 56
        const vibIntOptGap = 8
        const vibIntTotalWidth = vibIntOptions.length * vibIntOptWidth + (vibIntOptions.length - 1) * vibIntOptGap
        const vibIntOptStartX = width - 32 - vibIntTotalWidth
        const vibIntY = scrollY(this.elements.vibrationIntensity.y)
        const vibIntH = vibIntElem.h

        vibIntOptions.forEach((opt, index) => {
          const x = vibIntOptStartX + index * (vibIntOptWidth + vibIntOptGap)
          if (game.inputManager.hitTest(event, x, vibIntY + 10, vibIntOptWidth, vibIntH - 20)) {
            settings.vibrationIntensity = opt
            game.audioManager.setVibrationIntensity(opt)
            game.audioManager.playKeyPress()
            game.audioManager.vibrate('short')
          }
        })

        // 配色方案选择
        const colorElem = this.elements.colorScheme
        const colorOptions = colorElem.options
        const colorOptWidth = 72
        const colorOptGap = 8
        const colorTotalWidth = colorOptions.length * colorOptWidth + (colorOptions.length - 1) * colorOptGap
        const colorOptStartX = width - 32 - colorTotalWidth
        const colorY = scrollY(this.elements.colorScheme.y)
        const colorH = colorElem.h

        colorOptions.forEach((opt, index) => {
          const x = colorOptStartX + index * (colorOptWidth + colorOptGap)
          if (game.inputManager.hitTest(event, x, colorY + 10, colorOptWidth, colorH - 20)) {
            settings.colorScheme = opt
            game.renderer.setColorScheme(opt)
            game.audioManager.playKeyPress()
            game.audioManager.vibrate('short')
          }
        })

        // AI 动画速度选择
        const aiSpeedElem = this.elements.aiAnimationSpeed
        const aiSpeedOptions = aiSpeedElem.options
        const aiSpeedOptWidth = 48
        const aiSpeedOptGap = 6
        const aiSpeedTotalWidth = aiSpeedOptions.length * aiSpeedOptWidth + (aiSpeedOptions.length - 1) * aiSpeedOptGap
        const aiSpeedOptStartX = width - 32 - aiSpeedTotalWidth
        const aiSpeedY = scrollY(this.elements.aiAnimationSpeed.y)
        const aiSpeedH = aiSpeedElem.h

        aiSpeedOptions.forEach((opt, index) => {
          const x = aiSpeedOptStartX + index * (aiSpeedOptWidth + aiSpeedOptGap)
          if (game.inputManager.hitTest(event, x, aiSpeedY + 10, aiSpeedOptWidth, aiSpeedH - 20)) {
            settings.aiAnimationSpeed = opt
            game.audioManager.playKeyPress()
            game.audioManager.vibrate('short')
          }
        })

        // 难度切换确认开关
        const skipDiffY = scrollY(this.elements.skipDifficultyConfirm.y)
        const skipDiffH = this.elements.skipDifficultyConfirm.h
        if (game.inputManager.hitTest(event, 20, skipDiffY, width - 40, skipDiffH)) {
          settings.skipDifficultyConfirm = !settings.skipDifficultyConfirm
          globalThis.__game__.saveUserData()
          game.audioManager.vibrate('short')
        }

        // 难度统计区域点击切换（需要重新计算位置）
        const diffStatsY = scrollY(this.elements.difficultyStats.y)
        const diffStatsAreas = this.elements.difficultyStatsAreas || []
        diffStatsAreas.forEach(area => {
          // 使用滚动后的Y坐标
          const adjustedY = diffStatsY + (area.y - this.elements.difficultyStats.y - this.scrollOffset)
          if (game.inputManager.hitTest(event, area.x, area.y, area.w, area.h)) {
            if (settings.difficulty !== area.difficulty) {
              settings.difficulty = area.difficulty
              game.audioManager.playKeyPress()
              game.audioManager.vibrate('short')
            }
          }
        })

        // 返回按钮
        if (game.inputManager.hitTest(event, this.elements.backBtn.x, this.elements.backBtn.y, this.elements.backBtn.w, this.elements.backBtn.h)) {
          game.audioManager.playKeyPress()
          game.audioManager.vibrate('short')
          this.sceneManager.switchTo('menu')
        }

        // 重置按钮
        const resetBtn = this.elements.resetBtn
        const resetY = scrollY(resetBtn.y)
        if (game.inputManager.hitTest(event, resetBtn.x, resetY, resetBtn.w, resetBtn.h)) {
          game.audioManager.playKeyPress()
          game.audioManager.vibrate('short')
          this.showResetConfirm()
        }

        // 导出按钮
        const exportBtn = this.elements.exportBtn
        const exportY = scrollY(exportBtn.y)
        if (game.inputManager.hitTest(event, exportBtn.x, exportY, exportBtn.w, exportBtn.h)) {
          game.audioManager.playKeyPress()
          game.audioManager.vibrate('short')
          this.exportData()
        }

        // 导入按钮
        const importBtn = this.elements.importBtn
        const importY = scrollY(importBtn.y)
        if (game.inputManager.hitTest(event, importBtn.x, importY, importBtn.w, importBtn.h)) {
          game.audioManager.playKeyPress()
          game.audioManager.vibrate('short')
          this.importData()
        }
      }

      // 长按显示详细说明
      if (event.type === 'longpress') {
        this.handleLongPress(event, game, width)
      }

      // 触摸按下状态
      if (game.inputManager.touchStart) {
        // 如果显示确认对话框，处理对话框按钮按下状态
        if (this.showConfirm) {
          this.handleConfirmDialogPress(game, width, height)
          return
        }

        // 计算滚动后的实际Y坐标
        const scrollAreaY = this.elements.scrollArea.y
        const scrollY = (elementY) => {
          return scrollAreaY + 8 + elementY - this.scrollOffset
        }

        // 难度选项
        const options = this.elements.difficulty.options
        const optWidth = 56
        const optGap = 8
        const totalWidth = options.length * optWidth + (options.length - 1) * optGap
        const optStartX = width - 32 - totalWidth
        const diffY = scrollY(this.elements.difficulty.y)
        const diffH = this.elements.difficulty.h

        for (const opt of options) {
          const index = options.indexOf(opt)
          const x = optStartX + index * (optWidth + optGap)
          if (game.inputManager.hitTest(game.inputManager.touchStart, x, diffY + 10, optWidth, diffH - 20)) {
            this.pressedItem = `diff_${opt}`
            break
          }
        }

        // 过渡效果选项
        const transElem = this.elements.transition
        const transOptions = transElem.options
        const transOptWidth = 56
        const transOptGap = 8
        const transTotalWidth = transOptions.length * transOptWidth + (transOptions.length - 1) * transOptGap
        const transOptStartX = width - 32 - transTotalWidth
        const transY = scrollY(this.elements.transition.y)
        const transH = transElem.h

        for (const opt of transOptions) {
          const index = transOptions.indexOf(opt)
          const x = transOptStartX + index * (transOptWidth + transOptGap)
          if (game.inputManager.hitTest(game.inputManager.touchStart, x, transY + 10, transOptWidth, transH - 20)) {
            this.pressedItem = `trans_${opt}`
            break
          }
        }

        // 开关项
        const soundY = scrollY(this.elements.sound.y)
        const soundH = this.elements.sound.h
        if (game.inputManager.hitTest(game.inputManager.touchStart, 20, soundY, width - 40, soundH)) {
          this.pressedItem = 'sound'
        }

        const vibY = scrollY(this.elements.vibration.y)
        const vibH = this.elements.vibration.h
        if (game.inputManager.hitTest(game.inputManager.touchStart, 20, vibY, width - 40, vibH)) {
          this.pressedItem = 'vibration'
        }

        // 振动强度选项
        const vibIntElem = this.elements.vibrationIntensity
        const vibIntOptions = vibIntElem.options
        const vibIntOptWidth = 56
        const vibIntOptGap = 8
        const vibIntTotalWidth = vibIntOptions.length * vibIntOptWidth + (vibIntOptions.length - 1) * vibIntOptGap
        const vibIntOptStartX = width - 32 - vibIntTotalWidth
        const vibIntY = scrollY(this.elements.vibrationIntensity.y)
        const vibIntH = vibIntElem.h

        for (const opt of vibIntOptions) {
          const index = vibIntOptions.indexOf(opt)
          const x = vibIntOptStartX + index * (vibIntOptWidth + vibIntOptGap)
          if (game.inputManager.hitTest(game.inputManager.touchStart, x, vibIntY + 10, vibIntOptWidth, vibIntH - 20)) {
            this.pressedItem = `vibInt_${opt}`
            break
          }
        }

        // 配色方案选项
        const colorElem = this.elements.colorScheme
        const colorOptions = colorElem.options
        const colorOptWidth = 72
        const colorOptGap = 8
        const colorTotalWidth = colorOptions.length * colorOptWidth + (colorOptions.length - 1) * colorOptGap
        const colorOptStartX = width - 32 - colorTotalWidth
        const colorY = scrollY(this.elements.colorScheme.y)
        const colorH = colorElem.h

        for (const opt of colorOptions) {
          const index = colorOptions.indexOf(opt)
          const x = colorOptStartX + index * (colorOptWidth + colorOptGap)
          if (game.inputManager.hitTest(game.inputManager.touchStart, x, colorY + 10, colorOptWidth, colorH - 20)) {
            this.pressedItem = `color_${opt}`
            break
          }
        }

        // AI 动画速度选项
        const aiSpeedElem = this.elements.aiAnimationSpeed
        const aiSpeedOptions = aiSpeedElem.options
        const aiSpeedOptWidth = 48
        const aiSpeedOptGap = 6
        const aiSpeedTotalWidth = aiSpeedOptions.length * aiSpeedOptWidth + (aiSpeedOptions.length - 1) * aiSpeedOptGap
        const aiSpeedOptStartX = width - 32 - aiSpeedTotalWidth
        const aiSpeedY = scrollY(this.elements.aiAnimationSpeed.y)
        const aiSpeedH = aiSpeedElem.h

        for (const opt of aiSpeedOptions) {
          const index = aiSpeedOptions.indexOf(opt)
          const x = aiSpeedOptStartX + index * (aiSpeedOptWidth + aiSpeedOptGap)
          if (game.inputManager.hitTest(game.inputManager.touchStart, x, aiSpeedY + 10, aiSpeedOptWidth, aiSpeedH - 20)) {
            this.pressedItem = `aiSpeed_${opt}`
            break
          }
        }

        // 难度切换确认开关
        const skipDiffY = scrollY(this.elements.skipDifficultyConfirm.y)
        const skipDiffH = this.elements.skipDifficultyConfirm.h
        if (game.inputManager.hitTest(game.inputManager.touchStart, 20, skipDiffY, width - 40, skipDiffH)) {
          this.pressedItem = 'skipDifficultyConfirm'
        }

        // 重置按钮
        const resetBtn = this.elements.resetBtn
        const resetY = scrollY(resetBtn.y)
        if (game.inputManager.hitTest(game.inputManager.touchStart, resetBtn.x, resetY, resetBtn.w, resetBtn.h)) {
          this.pressedItem = 'reset'
        }

        // 导出按钮
        const exportBtn = this.elements.exportBtn
        const exportY = scrollY(exportBtn.y)
        if (game.inputManager.hitTest(game.inputManager.touchStart, exportBtn.x, exportY, exportBtn.w, exportBtn.h)) {
          this.pressedItem = 'export'
        }

        // 导入按钮
        const importBtn = this.elements.importBtn
        const importY = scrollY(importBtn.y)
        if (game.inputManager.hitTest(game.inputManager.touchStart, importBtn.x, importY, importBtn.w, importBtn.h)) {
          this.pressedItem = 'import'
        }
      }
    })
  }

  /**
   * 处理长按事件，显示详细说明
   */
  handleLongPress(event, game, width) {
    const descriptions = SettingsScene.SETTING_DESCRIPTIONS

    // 计算滚动后的实际Y坐标
    const scrollAreaY = this.elements.scrollArea.y
    const scrollY = (elementY) => {
      return scrollAreaY + 8 + elementY - this.scrollOffset
    }

    // 检测各设置项区域
    const checkAreas = [
      { key: 'difficulty', element: this.elements.difficulty },
      { key: 'transition', element: this.elements.transition },
      { key: 'sound', element: this.elements.sound },
      { key: 'vibration', element: this.elements.vibration },
      { key: 'vibrationIntensity', element: this.elements.vibrationIntensity },
      { key: 'colorScheme', element: this.elements.colorScheme },
      { key: 'aiAnimationSpeed', element: this.elements.aiAnimationSpeed },
      { key: 'skipDifficultyConfirm', element: this.elements.skipDifficultyConfirm }
    ]

    for (const area of checkAreas) {
      if (area.element && descriptions[area.key]) {
        const elem = area.element
        const actualY = scrollY(elem.y)
        if (game.inputManager.hitTest(event, 20, actualY, width - 40, elem.h)) {
          this.tooltipText = descriptions[area.key]
          this.tooltipY = actualY + elem.h + 4
          this.showTooltip = true
          game.audioManager.vibrate('short')
          return
        }
      }
    }
  }

  /**
   * 渲染详细说明 tooltip
   */
  renderTooltip(renderer, theme, width) {
    if (!this.showTooltip || !this.tooltipText) return

    const padding = 16
    const maxWidth = width - 80
    const lineHeight = 18
    const fontSize = 12

    // 计算文字换行
    const lines = this.wrapText(this.tooltipText, maxWidth, fontSize)
    const tooltipH = lines.length * lineHeight + padding * 2
    const tooltipX = 40
    const tooltipY = this.tooltipY

    // tooltip 背景
    renderer.drawRect(tooltipX, tooltipY, width - 80, tooltipH, {
      fill: theme.bgCard,
      radius: 8,
      stroke: theme.border,
      strokeWidth: 1
    })

    // tooltip 文字
    lines.forEach((line, index) => {
      renderer.drawText(line, tooltipX + padding, tooltipY + padding + index * lineHeight, {
        fontSize: fontSize,
        color: theme.textPrimary
      })
    })
  }

  /**
   * 文字换行处理
   */
  wrapText(text, maxWidth, fontSize) {
    const chars = text.split('')
    const lines = []
    let currentLine = ''
    const charWidth = fontSize * 0.6  // 中文字符宽度约为字体大小的 0.6

    for (const char of chars) {
      const testLine = currentLine + char
      const testWidth = testLine.length * charWidth

      if (testWidth > maxWidth && currentLine.length > 0) {
        lines.push(currentLine)
        currentLine = char
      } else {
        currentLine = testLine
      }
    }

    if (currentLine.length > 0) {
      lines.push(currentLine)
    }

    return lines
  }

  /**
   * 导出用户数据
   */
  exportData() {
    const game = globalThis.getGame()

    try {
      // 收集用户数据
      const exportData = {
        exportTime: new Date().toISOString(),
        version: game.GameConfig.version,
        settings: game.gameState.settings,
        stats: game.gameState.stats,
        history: game.storageManager.getGameHistory(100)
      }

      // 转换为 JSON 字符串
      const jsonStr = JSON.stringify(exportData, null, 2)

      // 写入临时文件
      const fs = wx.getFileSystemManager()
      const filePath = `${wx.env.USER_DATA_PATH}/game_data_${Date.now()}.json`

      fs.writeFile({
        filePath: filePath,
        data: jsonStr,
        encoding: 'utf8',
        success: () => {
          // 分享文件
          wx.shareFileMessage({
            filePath: filePath,
            success: () => {
              wx.showToast({ title: '📤 导出成功', icon: 'success' })
            },
            fail: (err) => {
              console.error('[Export] Share failed:', err)
              wx.showToast({ title: '📤 导出取消', icon: 'none' })
            }
          })
        },
        fail: (err) => {
          console.error('[Export] Write file failed:', err)
          wx.showToast({ title: '❌ 导出失败', icon: 'error' })
        }
      })
    } catch (err) {
      console.error('[Export] Export failed:', err)
      wx.showToast({ title: '❌ 导出失败', icon: 'error' })
    }
  }

  /**
   * 导入用户数据
   */
  importData() {
    const game = globalThis.getGame()

    try {
      // 选择文件
      wx.chooseMessageFile({
        count: 1,
        type: 'file',
        extension: ['json'],
        success: (res) => {
          const filePath = res.tempFiles[0].path
          const fs = wx.getFileSystemManager()

          // 读取文件
          fs.readFile({
            filePath: filePath,
            encoding: 'utf8',
            success: (data) => {
              try {
                const importData = JSON.parse(data)

                // 验证数据格式
                if (!this.validateImportData(importData)) {
                  wx.showToast({ title: '❌ 无效的数据格式', icon: 'error' })
                  return
                }

                // 导入设置
                if (importData.settings) {
                  game.gameState.settings = { ...game.gameState.settings, ...importData.settings }
                }

                // 导入统计
                if (importData.stats) {
                  game.gameState.stats = { ...game.gameState.stats, ...importData.stats }
                }

                // 导入历史记录
                if (importData.history && Array.isArray(importData.history)) {
                  importData.history.forEach(item => {
                    game.storageManager.saveGameHistory(item)
                  })
                }

                // 同步设置到管理器
                if (game.audioManager) {
                  game.audioManager.setEnabled(game.gameState.settings.soundEnabled)
                  game.audioManager.setVibrationEnabled(game.gameState.settings.vibrationEnabled !== false)
                  game.audioManager.setVibrationIntensity(game.gameState.settings.vibrationIntensity || 'medium')
                }

                // 同步配色方案
                if (game.renderer) {
                  game.renderer.setColorScheme(game.gameState.settings.colorScheme || 'default')
                }

                // 保存数据
                game.saveUserData()

                wx.showToast({ title: '📥 导入成功', icon: 'success' })
                console.log('[Import] Data imported successfully')
              } catch (parseErr) {
                console.error('[Import] Parse failed:', parseErr)
                wx.showToast({ title: '❌ 解析失败', icon: 'error' })
              }
            },
            fail: (err) => {
              console.error('[Import] Read file failed:', err)
              wx.showToast({ title: '❌ 读取失败', icon: 'error' })
            }
          })
        },
        fail: (err) => {
          console.error('[Import] Choose file failed:', err)
          wx.showToast({ title: '📥 取消导入', icon: 'none' })
        }
      })
    } catch (err) {
      console.error('[Import] Import failed:', err)
      wx.showToast({ title: '❌ 导入失败', icon: 'error' })
    }
  }

  /**
   * 验证导入数据格式
   * @param {Object} data - 导入的数据
   * @returns {boolean} 是否有效
   */
  validateImportData(data) {
    if (!data || typeof data !== 'object') return false

    // 至少包含一个有效字段
    const hasSettings = data.settings && typeof data.settings === 'object'
    const hasStats = data.stats && typeof data.stats === 'object'
    const hasHistory = Array.isArray(data.history)

    return hasSettings || hasStats || hasHistory
  }

  /**
   * 处理确认对话框点击
   */
  handleConfirmDialogInput(event, game, width, height) {
    const dialogW = 280
    const dialogH = 160
    const dialogX = (width - dialogW) / 2
    const dialogY = (height - dialogH) / 2
    const btnW = 100
    const btnH = 40
    const btnY = dialogY + dialogH - 56
    const cancelX = dialogX + 20
    const confirmX = dialogX + dialogW - btnW - 20

    // 取消按钮
    if (game.inputManager.hitTest(event, cancelX, btnY, btnW, btnH)) {
      game.audioManager.playKeyPress()
      game.audioManager.vibrate('short')
      this.showConfirm = false
      return
    }

    // 确认按钮
    if (game.inputManager.hitTest(event, confirmX, btnY, btnW, btnH)) {
      game.audioManager.vibrate('long')
      this.resetStats()
    }
  }

  /**
   * 处理确认对话框按钮按下状态
   */
  handleConfirmDialogPress(game, width, height) {
    const dialogW = 280
    const dialogH = 160
    const dialogX = (width - dialogW) / 2
    const dialogY = (height - dialogH) / 2
    const btnW = 100
    const btnH = 40
    const btnY = dialogY + dialogH - 56
    const cancelX = dialogX + 20
    const confirmX = dialogX + dialogW - btnW - 20

    this.pressedItem = null

    if (game.inputManager.hitTest(game.inputManager.touchStart, cancelX, btnY, btnW, btnH)) {
      this.pressedItem = 'confirm_cancel'
    }

    if (game.inputManager.hitTest(game.inputManager.touchStart, confirmX, btnY, btnW, btnH)) {
      this.pressedItem = 'confirm_ok'
    }
  }
}

module.exports = SettingsScene