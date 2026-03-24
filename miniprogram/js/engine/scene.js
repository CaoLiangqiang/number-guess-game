/**
 * 场景管理器
 * 负责场景注册、切换、更新和渲染
 * 支持场景切换过渡动画（淡入淡出、滑动、缩放）
 */

class SceneManager {
  constructor() {
    this.scenes = new Map()
    this.currentScene = null
    this.currentSceneName = ''

    // 过渡动画状态
    this.transition = {
      active: false,
      type: null,        // 'fadeOut' | 'fadeIn'
      effect: 'fade',    // 'fade' | 'slide' | 'scale'
      progress: 0,       // 0-1
      duration: 250,     // 过渡时长 (ms)
      pendingScene: null,
      pendingParams: null,
      overlayColor: 'rgba(15, 23, 42, 1)'  // 深色遮罩
    }
  }

  /**
   * 注册场景
   * @param {string} name - 场景名称
   * @param {object} scene - 场景实例
   */
  register(name, scene) {
    this.scenes.set(name, scene)
    scene.sceneManager = this
  }

  /**
   * 切换到指定场景（带过渡动画）
   * @param {string} name - 场景名称
   * @param {object} params - 传递给场景的参数
   * @param {object} options - 可选配置 { immediate: boolean, effect: 'fade'|'slide'|'scale' }
   */
  switchTo(name, params = {}, options = {}) {
    const scene = this.scenes.get(name)
    if (!scene) {
      console.error(`Scene "${name}" not found`)
      return
    }

    // 如果正在过渡中，忽略新的切换请求
    if (this.transition.active) {
      console.warn(`Transition in progress, ignoring switch to "${name}"`)
      return
    }

    // 如果是首次加载或指定立即切换，跳过动画
    if (!this.currentScene || options.immediate) {
      this.performImmediateSwitch(scene, params)
      return
    }

    // 设置过渡效果类型（优先使用传入参数，否则从设置获取）
    const defaultEffect = globalThis.getGame?.()?.gameState?.settings?.transitionEffect || 'fade'
    this.transition.effect = options.effect || defaultEffect

    // 开始淡出动画
    this.transition.active = true
    this.transition.type = 'fadeOut'
    this.transition.progress = 0
    this.transition.pendingScene = scene
    this.transition.pendingParams = params
  }

  /**
   * 立即切换场景（无动画）
   */
  performImmediateSwitch(scene, params) {
    // 退出当前场景
    if (this.currentScene && this.currentScene.onExit) {
      this.currentScene.onExit()
    }

    // 进入新场景
    this.currentScene = scene
    this.currentSceneName = this.getSceneName(scene)

    if (scene.onEnter) {
      scene.onEnter(params)
    }
  }

  /**
   * 更新当前场景和过渡动画
   * @param {number} deltaTime - 距上一帧的时间（ms）
   */
  update(deltaTime) {
    // 更新过渡动画
    if (this.transition.active) {
      this.updateTransition(deltaTime)
    }

    // 更新当前场景
    if (this.currentScene && this.currentScene.update) {
      this.currentScene.update(deltaTime)
    }
  }

  /**
   * 更新过渡动画状态
   */
  updateTransition(deltaTime) {
    const t = this.transition
    t.progress += deltaTime / t.duration

    if (t.type === 'fadeOut') {
      // 淡出完成，切换场景
      if (t.progress >= 1) {
        t.progress = 1
        this.performSceneSwitch()
        t.type = 'fadeIn'
        t.progress = 0
      }
    } else if (t.type === 'fadeIn') {
      // 淡入完成
      if (t.progress >= 1) {
        t.progress = 1
        t.active = false
        t.type = null
      }
    }
  }

  /**
   * 执行实际的场景切换
   */
  performSceneSwitch() {
    const t = this.transition

    // 退出当前场景
    if (this.currentScene && this.currentScene.onExit) {
      this.currentScene.onExit()
    }

    // 进入新场景
    this.currentScene = t.pendingScene
    this.currentSceneName = this.getSceneName(t.pendingScene)

    if (t.pendingScene.onEnter) {
      t.pendingScene.onEnter(t.pendingParams)
    }

    // 清理
    t.pendingScene = null
    t.pendingParams = null
  }

  /**
   * 获取场景名称
   */
  getSceneName(scene) {
    for (const [name, s] of this.scenes) {
      if (s === scene) return name
    }
    return ''
  }

  /**
   * 渲染当前场景和过渡遮罩
   * @param {Renderer} renderer - 渲染器实例
   */
  render(renderer) {
    // 渲染当前场景
    if (this.currentScene && this.currentScene.render) {
      this.currentScene.render(renderer)
    }

    // 渲染过渡遮罩
    if (this.transition.active) {
      this.renderTransitionOverlay(renderer)
    }
  }

  /**
   * 渲染过渡遮罩
   */
  renderTransitionOverlay(renderer) {
    const t = this.transition
    const { width, height } = renderer
    const effect = t.effect || 'fade'

    switch (effect) {
      case 'slide':
        this.renderSlideTransition(renderer, t, width, height)
        break
      case 'scale':
        this.renderScaleTransition(renderer, t, width, height)
        break
      case 'fade':
      default:
        this.renderFadeTransition(renderer, t, width, height)
        break
    }
  }

  /**
   * 渲染淡入淡出过渡
   */
  renderFadeTransition(renderer, t, width, height) {
    let alpha
    if (t.type === 'fadeOut') {
      alpha = this.easeInOut(t.progress)
    } else {
      alpha = 1 - this.easeInOut(t.progress)
    }
    const color = `rgba(15, 23, 42, ${alpha})`
    renderer.drawRect(0, 0, width, height, { fill: color })
  }

  /**
   * 渲染滑动过渡
   */
  renderSlideTransition(renderer, t, width, height) {
    const progress = this.easeInOut(t.progress)
    let offsetX

    if (t.type === 'fadeOut') {
      // 滑出：从 0 到 -width
      offsetX = -width * progress
    } else {
      // 滑入：从 width 到 0
      offsetX = width * (1 - progress)
    }

    // 绘制深色遮罩覆盖滑动区域
    const alpha = t.type === 'fadeOut' ? progress : (1 - progress)
    const color = `rgba(15, 23, 42, ${alpha})`
    renderer.drawRect(0, 0, width, height, { fill: color })
  }

  /**
   * 渲染缩放过渡
   */
  renderScaleTransition(renderer, t, width, height) {
    const progress = this.easeInOut(t.progress)
    let scale, alpha

    if (t.type === 'fadeOut') {
      // 缩小：从 1 到 0.8，透明度增加
      scale = 1 - 0.2 * progress
      alpha = progress
    } else {
      // 放大：从 0.8 到 1，透明度减少
      scale = 0.8 + 0.2 * progress
      alpha = 1 - progress
    }

    // 绘制深色遮罩
    const color = `rgba(15, 23, 42, ${alpha})`
    renderer.drawRect(0, 0, width, height, { fill: color })
  }

  /**
   * 缓动函数：ease-in-out
   */
  easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
  }

  /**
   * 处理输入事件（过渡期间禁用）
   * @param {Array} events - 输入事件数组
   */
  handleInput(events) {
    // 过渡期间禁用输入
    if (this.transition.active) {
      return
    }

    if (this.currentScene && this.currentScene.handleInput) {
      this.currentScene.handleInput(events)
    }
  }

  /**
   * 获取当前场景名
   */
  getCurrentSceneName() {
    return this.currentSceneName
  }

  /**
   * 是否正在过渡中
   */
  isTransitioning() {
    return this.transition.active
  }
}

module.exports = SceneManager