/**
 * 历史记录场景
 * 支持惯性滚动和边界回弹效果
 */

class HistoryScene {
  constructor() {
    this.sceneManager = null
    this.history = []
    this.elements = {}
    this.scrollOffset = 0
    this.maxScrollOffset = 0
    this.itemHeight = 72
    this.itemGap = 8

    // 滚动状态
    this.scrollVelocity = 0
    this.isScrolling = false
    this.friction = 0.95  // 摩擦系数
    this.bounceStiffness = 0.1  // 回弹刚度

    // 触摸状态
    this.touchStartY = 0
    this.lastTouchY = 0
    this.lastTouchTime = 0
    this.touchVelocity = 0
  }

  onEnter() {
    const game = globalThis.getGame()
    this.history = game.storageManager.getGameHistory(100)
    this.scrollOffset = 0
    this.scrollVelocity = 0
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

    // 计算最大滚动偏移
    const totalContentHeight = this.history.length * (this.itemHeight + this.itemGap)
    const listHeight = this.elements.list.h
    this.maxScrollOffset = Math.max(0, totalContentHeight - listHeight + 16)
  }

  update(deltaTime) {
    // 更新滚动物理效果
    this.updateScrollPhysics(deltaTime)
  }

  /**
   * 更新滚动物理效果
   */
  updateScrollPhysics(deltaTime) {
    const dt = deltaTime / 16.67  // 标准化到 60fps

    // 如果正在触摸，不更新物理
    if (this.isScrolling) return

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

    renderer.drawGradientBackground()
    renderer.drawText('历史记录', this.elements.title.x, this.elements.title.y, { fontSize: 28, color: theme.textPrimary, align: 'center', bold: true })

    const listY = this.elements.list.y
    const listH = this.elements.list.h
    renderer.drawRect(12, listY, width - 24, listH, { fill: theme.bgSecondary, radius: 12 })

    // 裁剪区域外的内容
    if (this.history.length === 0) {
      renderer.drawText('暂无游戏记录', width / 2, listY + listH / 2, { fontSize: 16, color: theme.textMuted, align: 'center', baseline: 'middle' })
    } else {
      // 渲染可见项（带滚动偏移）
      const startIndex = Math.floor(this.scrollOffset / (this.itemHeight + this.itemGap))
      const endIndex = Math.min(
        this.history.length,
        startIndex + Math.ceil(listH / (this.itemHeight + this.itemGap)) + 2
      )

      for (let i = startIndex; i < endIndex; i++) {
        const item = this.history[i]
        const y = listY + 8 + i * (this.itemHeight + this.itemGap) - this.scrollOffset

        // 跳过超出可视区域的项目
        if (y + this.itemHeight < listY || y > listY + listH) continue

        // 渲染历史项卡片
        this.renderHistoryItem(renderer, item, y, width, theme)
      }

      // 滚动指示器
      if (this.maxScrollOffset > 0) {
        this.renderScrollIndicator(renderer, listY, listH, width, theme)
      }
    }

    renderer.drawButton(this.elements.backBtn.x, this.elements.backBtn.y, this.elements.backBtn.w, this.elements.backBtn.h, this.elements.backBtn.text, { radius: 12 })
  }

  /**
   * 渲染单个历史记录项
   */
  renderHistoryItem(renderer, item, y, width, theme) {
    const game = globalThis.getGame()

    renderer.drawRect(20, y, width - 40, this.itemHeight, { fill: theme.bgCard, radius: 8 })

    // 结果图标
    const icon = item.isWin ? '🎉' : '😢'
    renderer.drawText(icon, 36, y + 20, { fontSize: 20 })

    // 游戏信息（带图标）
    const diffText = `🎯 ${item.difficulty}位`
    const turnsText = `🔄 ${item.turns}回合`
    renderer.drawText(diffText, 72, y + 16, { fontSize: 14, color: theme.textPrimary, bold: true })
    renderer.drawText(turnsText, 140, y + 16, { fontSize: 14, color: theme.textSecondary })

    // 用时（带图标）
    renderer.drawText(`⏱️ ${game.core.formatTime(item.duration)}`, 72, y + 44, { fontSize: 12, color: theme.textMuted })

    // 日期
    const date = new Date(item.playedAt)
    const timeStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
    renderer.drawText(timeStr, width - 36, y + 28, { fontSize: 12, color: theme.textMuted, align: 'right', baseline: 'middle' })

    // 结果标签
    const resultText = item.isWin ? '胜利' : '失败'
    const resultColor = item.isWin ? theme.success : theme.error
    renderer.drawText(resultText, width - 36, y + 50, { fontSize: 11, color: resultColor, align: 'right' })
  }

  /**
   * 渲染滚动指示器
   */
  renderScrollIndicator(renderer, listY, listH, width, theme) {
    // 指示器高度根据内容比例计算
    const indicatorHeight = Math.max(30, (listH / (this.maxScrollOffset + listH)) * listH)

    // 指示器位置
    let indicatorY = listY + (this.scrollOffset / this.maxScrollOffset) * (listH - indicatorHeight)

    // 边界回弹时指示器也跟随
    if (this.scrollOffset < 0) {
      indicatorY = listY + (this.scrollOffset / this.maxScrollOffset) * (listH - indicatorHeight) * 0.5
    } else if (this.scrollOffset > this.maxScrollOffset) {
      const overflow = this.scrollOffset - this.maxScrollOffset
      indicatorY = listY + listH - indicatorHeight - (overflow / this.maxScrollOffset) * (listH - indicatorHeight) * 0.5
    }

    // 指示器透明度（滚动时更明显）
    const alpha = this.isScrolling || Math.abs(this.scrollVelocity) > 1 ? 1 : 0.5

    renderer.drawRect(width - 18, indicatorY, 4, indicatorHeight, {
      fill: `rgba(148, 163, 184, ${alpha})`,
      radius: 2
    })
  }

  handleInput(events) {
    const game = globalThis.getGame()

    events.forEach(event => {
      if (event.type === 'tap') {
        // 检查返回按钮
        if (game.inputManager.hitTest(event, this.elements.backBtn.x, this.elements.backBtn.y, this.elements.backBtn.w, this.elements.backBtn.h)) {
          game.audioManager.vibrate('short')
          this.sceneManager.switchTo('menu')
        }
      } else if (event.type === 'swipe') {
        // 处理列表滚动
        const listY = this.elements.list.y
        const listH = this.elements.list.h
        if (event.y >= listY && event.y <= listY + listH) {
          // 设置滚动速度
          this.scrollVelocity = event.dy
          this.scrollOffset = Math.max(-50, Math.min(this.maxScrollOffset + 50, this.scrollOffset - event.dy))
        }
      } else if (event.type === 'touchstart') {
        // 开始触摸
        this.isScrolling = true
        this.scrollVelocity = 0
        this.lastTouchY = event.y
        this.lastTouchTime = Date.now()
      } else if (event.type === 'touchend') {
        // 结束触摸，开始惯性滚动
        this.isScrolling = false
      }
    })
  }
}

module.exports = HistoryScene