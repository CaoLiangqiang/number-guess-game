/**
 * 场景管理器
 * 负责场景注册、切换、更新和渲染
 */

class SceneManager {
  constructor() {
    this.scenes = new Map()
    this.currentScene = null
    this.currentSceneName = ''
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
   * 切换到指定场景
   * @param {string} name - 场景名称
   * @param {object} params - 传递给场景的参数
   */
  switchTo(name, params = {}) {
    const scene = this.scenes.get(name)
    if (!scene) {
      console.error(`Scene "${name}" not found`)
      return
    }

    // 退出当前场景
    if (this.currentScene && this.currentScene.onExit) {
      this.currentScene.onExit()
    }

    // 进入新场景
    this.currentScene = scene
    this.currentSceneName = name

    if (scene.onEnter) {
      scene.onEnter(params)
    }
  }

  /**
   * 更新当前场景
   * @param {number} deltaTime - 距上一帧的时间（ms）
   */
  update(deltaTime) {
    if (this.currentScene && this.currentScene.update) {
      this.currentScene.update(deltaTime)
    }
  }

  /**
   * 渲染当前场景
   * @param {Renderer} renderer - 渲染器实例
   */
  render(renderer) {
    if (this.currentScene && this.currentScene.render) {
      this.currentScene.render(renderer)
    }
  }

  /**
   * 处理输入事件
   * @param {Array} events - 输入事件数组
   */
  handleInput(events) {
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
}

module.exports = SceneManager