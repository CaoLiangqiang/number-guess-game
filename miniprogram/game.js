/**
 * 数字对决 Pro - 微信小游戏入口
 * 游戏主循环、场景管理、全局状态
 */

// 引入核心模块
const { generateSecretNumber, validateInputStrict, calculateHint, formatTime } = require('./js/core/game')
const { NumberGuessingAI } = require('./js/core/ai')

// 引擎模块
const Renderer = require('./js/engine/renderer')
const SceneManager = require('./js/engine/scene')
const InputManager = require('./js/engine/input')
const AudioManager = require('./js/engine/audio')
const StorageManager = require('./js/engine/storage')

// 游戏配置
const GameConfig = {
  name: '数字对决 Pro',
  version: '2.3.40',
  fps: 60,
  canvasWidth: 375,
  canvasHeight: 667,
  wsServer: 'wss://your-server.com',
  apiServer: 'https://your-server.com'
}

// 游戏状态
const gameState = {
  settings: {
    difficulty: 4,
    soundEnabled: true,
    vibrationEnabled: true,
    vibrationIntensity: 'medium',  // 'light' | 'medium' | 'heavy'
    theme: 'dark',
    transitionEffect: 'fade',  // 'fade' | 'slide' | 'scale'
    colorScheme: 'default',  // 'default' | 'colorblind'
    aiAnimationSpeed: 'normal',  // 'slow' | 'normal' | 'fast' | 'skip'
    skipDifficultyConfirm: false  // 跳过难度切换确认对话框
  },
  stats: {
    totalGames: 0,
    wins: 0,
    winStreak: 0,
    maxWinStreak: 0
  },
  userInfo: null,
  isLoggedIn: false
}

// 全局对象（通过 globalThis 访问，避免循环依赖）
globalThis.__game__ = {
  GameConfig,
  gameState,
  core: {
    generateSecretNumber,
    validateInputStrict,
    calculateHint,
    formatTime,
    NumberGuessingAI
  },
  // 管理器（初始化后设置）
  renderer: null,
  sceneManager: null,
  inputManager: null,
  audioManager: null,
  storageManager: null,

  // 获取器
  getRenderer: () => globalThis.__game__.renderer,
  getSceneManager: () => globalThis.__game__.sceneManager,
  getInputManager: () => globalThis.__game__.inputManager,
  getAudioManager: () => globalThis.__game__.audioManager,
  getStorageManager: () => globalThis.__game__.storageManager
}

// 全局访问函数
globalThis.getGame = () => globalThis.__game__

/**
 * 初始化游戏
 */
function init() {
  const game = globalThis.__game__

  // 获取画布
  const canvas = wx.createCanvas()
  const ctx = canvas.getContext('2d')

  // 设置画布尺寸
  const { windowWidth, windowHeight, pixelRatio } = wx.getSystemInfoSync()
  canvas.width = windowWidth * pixelRatio
  canvas.height = windowHeight * pixelRatio

  // 初始化管理器
  game.renderer = new Renderer(ctx, windowWidth, windowHeight, pixelRatio)
  game.sceneManager = new SceneManager()
  game.inputManager = new InputManager(canvas)
  game.audioManager = new AudioManager()
  game.storageManager = new StorageManager()

  // 加载用户数据
  loadUserData()

  // 注册场景（此时管理器已初始化）
  registerScenes()

  // 跳转到主菜单
  game.sceneManager.switchTo('menu')

  // 监听窗口尺寸变化
  wx.onWindowResize(() => {
    const info = wx.getSystemInfoSync()
    canvas.width = info.windowWidth * info.pixelRatio
    canvas.height = info.windowHeight * info.pixelRatio
    if (game.renderer) {
      game.renderer.resize(info.windowWidth, info.windowHeight, info.pixelRatio)
    }
  })

  // 启动游戏循环
  gameLoop()
}

/**
 * 加载用户数据
 */
function loadUserData() {
  const game = globalThis.__game__
  const savedSettings = game.storageManager.get('settings')
  if (savedSettings) {
    gameState.settings = { ...gameState.settings, ...savedSettings }
  }

  const savedStats = game.storageManager.get('stats')
  if (savedStats) {
    gameState.stats = { ...gameState.stats, ...savedStats }
  }

  // 同步设置到管理器
  if (game.audioManager) {
    game.audioManager.setEnabled(gameState.settings.soundEnabled)
    game.audioManager.setVibrationEnabled(gameState.settings.vibrationEnabled !== false)
    game.audioManager.setVibrationIntensity(gameState.settings.vibrationIntensity || 'medium')
  }

  // 同步配色方案到渲染器
  if (game.renderer) {
    game.renderer.setColorScheme(gameState.settings.colorScheme || 'default')
  }
}

/**
 * 保存用户数据
 */
function saveUserData() {
  const game = globalThis.__game__
  game.storageManager.set('settings', gameState.settings)
  game.storageManager.set('stats', gameState.stats)
}

/**
 * 注册所有场景
 */
function registerScenes() {
  const game = globalThis.__game__

  const MenuScene = require('./js/scenes/menu')
  const GameScene = require('./js/scenes/game')
  const ResultScene = require('./js/scenes/result')
  const SettingsScene = require('./js/scenes/settings')
  const HistoryScene = require('./js/scenes/history')
  const GuideScene = require('./js/scenes/guide')

  game.sceneManager.register('menu', new MenuScene())
  game.sceneManager.register('game', new GameScene())
  game.sceneManager.register('result', new ResultScene())
  game.sceneManager.register('settings', new SettingsScene())
  game.sceneManager.register('history', new HistoryScene())
  game.sceneManager.register('guide', new GuideScene())
}

/**
 * 游戏主循环
 */
let lastTime = 0
function gameLoop(timestamp = 0) {
  const deltaTime = timestamp - lastTime
  lastTime = timestamp

  // 更新
  update(deltaTime)

  // 渲染
  render()

  // 下一帧
  requestAnimationFrame(gameLoop)
}

/**
 * 更新逻辑
 */
function update(deltaTime) {
  const game = globalThis.__game__

  // 处理输入
  const events = game.inputManager.getEvents()
  game.sceneManager.handleInput(events)

  // 更新当前场景
  game.sceneManager.update(deltaTime)
}

/**
 * 渲染画面
 */
function render() {
  const game = globalThis.__game__
  game.renderer.clear()
  game.sceneManager.render(game.renderer)
}

// 导出保存函数（供场景调用）
globalThis.__game__.saveUserData = saveUserData

// 注册分享功能
wx.onShareAppMessage(() => {
  return {
    title: '数字对决 Pro - 来挑战我的推理极限！',
    path: '/pages/index/index',
    imageUrl: 'assets/images/share.png'
  }
})

// 全局错误处理
wx.onError((error) => {
  console.error('[Game Error]', error)
})

// 内存警告处理
wx.onMemoryWarning(() => {
  console.warn('[Game] Memory warning received')
})

// 启动游戏
init()