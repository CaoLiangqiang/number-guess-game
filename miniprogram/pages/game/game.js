// game.js - 游戏页面逻辑
const app = getApp()
const game = require('../../utils/game')
const { NumberGuessingAI } = require('../../utils/ai')

Page({
  data: {
    // 游戏配置
    mode: 'ai', // ai | daily | friend
    difficulty: 4,

    // 游戏状态
    secretNumber: '',
    currentInput: '',
    currentIndex: 0,
    history: [],
    turn: 0,
    usedDigits: [],
    timeElapsed: 0,
    formattedTime: '00:00',
    gameStarted: false,
    gameOver: false,

    // AI 相关
    ai: null,
    aiThinking: false,
    aiCandidateCount: 0,
    aiGuess: '',

    // 结果
    showResult: false,
    gameResult: {
      title: '',
      canRetry: true
    },

    // 键盘
    keyboardRows: [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['0']
    ],

    // 滚动定位
    scrollToItem: ''
  },

  timer: null,

  onLoad(options) {
    const { mode, difficulty } = options
    this.setData({
      mode: mode || 'ai',
      difficulty: parseInt(difficulty) || 4
    })

    this.initGame()
  },

  onUnload() {
    this.stopTimer()
  },

  // 初始化游戏
  initGame() {
    const { difficulty, mode } = this.data

    // 生成谜题
    const secretNumber = game.generateSecretNumber(difficulty, false)

    // 初始化AI
    let ai = null
    if (mode === 'ai') {
      ai = new NumberGuessingAI(difficulty)
    }

    this.setData({
      secretNumber,
      currentInput: '',
      currentIndex: 0,
      history: [],
      turn: 0,
      usedDigits: [],
      timeElapsed: 0,
      formattedTime: '00:00',
      gameStarted: false,
      gameOver: false,
      showResult: false,
      ai,
      aiThinking: false,
      aiCandidateCount: ai ? ai.getPossibleCount() : 0,
      aiGuess: ''
    })
  },

  // 开始计时
  startTimer() {
    if (this.timer) return

    this.timer = setInterval(() => {
      const timeElapsed = this.data.timeElapsed + 1
      this.setData({
        timeElapsed,
        formattedTime: game.formatTime(timeElapsed)
      })
    }, 1000)
  },

  // 停止计时
  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  },

  // 选择输入框位置
  selectDigitBox(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ currentIndex: index })
  },

  // 输入数字
  inputDigit(e) {
    if (this.data.gameOver) return

    const digit = e.currentTarget.dataset.digit
    const { currentInput, currentIndex, difficulty, usedDigits } = this.data

    // 检查是否已使用（严格模式不允许重复）
    if (usedDigits.includes(digit)) return

    // 开始计时
    if (!this.data.gameStarted) {
      this.setData({ gameStarted: true })
      this.startTimer()
    }

    // 更新输入
    let newInput = currentInput
    if (currentIndex < difficulty) {
      newInput = currentInput.slice(0, currentIndex) + digit + currentInput.slice(currentIndex + 1)
    }

    // 更新已使用的数字
    const newUsedDigits = [...usedDigits]
    if (currentInput[currentIndex] && !newInput.includes(currentInput[currentIndex])) {
      // 移除旧数字
      const oldIndex = newUsedDigits.indexOf(currentInput[currentIndex])
      if (oldIndex > -1) newUsedDigits.splice(oldIndex, 1)
    }
    if (!newUsedDigits.includes(digit)) {
      newUsedDigits.push(digit)
    }

    this.setData({
      currentInput: newInput,
      currentIndex: Math.min(currentIndex + 1, difficulty - 1),
      usedDigits: newUsedDigits
    })
  },

  // 删除数字
  deleteDigit() {
    if (this.data.gameOver) return

    const { currentInput, currentIndex, usedDigits } = this.data
    if (currentIndex === 0 && currentInput.length === 0) return

    const targetIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex
    const digitToRemove = currentInput[targetIndex]

    // 更新已使用数字
    const newUsedDigits = usedDigits.filter(d => d !== digitToRemove)

    // 清除该位数字
    const newInput = currentInput.slice(0, targetIndex) + '' + currentInput.slice(targetIndex + 1)

    this.setData({
      currentInput: newInput,
      currentIndex: targetIndex,
      usedDigits: newUsedDigits
    })
  },

  // 提交猜测
  submitGuess() {
    if (this.data.gameOver) return

    const { currentInput, difficulty, secretNumber, history, turn } = this.data

    // 验证输入
    const validation = game.validateInputStrict(currentInput, difficulty)
    if (!validation.valid) {
      wx.showToast({ title: validation.error, icon: 'none' })
      return
    }

    // 计算结果
    const result = game.calculateHint(secretNumber, currentInput)
    const newTurn = turn + 1

    // 添加到历史
    const newHistory = [...history, {
      guess: currentInput,
      hits: result.hits,
      blows: result.blows
    }]

    this.setData({
      history: newHistory,
      turn: newTurn,
      currentInput: '',
      currentIndex: 0,
      usedDigits: [],
      scrollToItem: `item-${newHistory.length - 1}`
    })

    // 检查是否获胜
    if (result.hits === difficulty) {
      this.handleWin()
      return
    }

    // AI回合
    if (this.data.mode === 'ai') {
      this.aiTurn()
    }
  },

  // AI回合
  aiTurn() {
    this.setData({ aiThinking: true })

    // 模拟AI思考延迟
    setTimeout(() => {
      const ai = this.data.ai

      // AI选择猜测
      const aiGuess = ai.selectBestGuess()
      const aiResult = game.calculateHint(this.data.secretNumber, aiGuess)

      // 更新AI状态
      ai.recordGuess(aiGuess, aiResult.hits)
      ai.filterPossibleNumbers(aiGuess, aiResult.hits)

      this.setData({
        aiGuess,
        aiCandidateCount: ai.getPossibleCount(),
        aiThinking: false
      })

      // 检查AI是否获胜
      if (aiResult.hits === this.data.difficulty) {
        this.handleLose()
      }
    }, 1000)
  },

  // 玩家获胜
  handleWin() {
    this.stopTimer()
    this.setData({
      gameOver: true,
      showResult: true,
      gameResult: {
        title: '🎉 恭喜获胜！',
        canRetry: true
      }
    })

    // 保存记录
    this.saveGameRecord(true)
  },

  // 玩家失败
  handleLose() {
    this.stopTimer()
    this.setData({
      gameOver: true,
      showResult: true,
      gameResult: {
        title: '😢 AI获胜',
        canRetry: true
      }
    })

    // 保存记录
    this.saveGameRecord(false)
  },

  // 保存游戏记录
  saveGameRecord(isWin) {
    const record = {
      mode: this.data.mode,
      difficulty: this.data.difficulty,
      turns: this.data.turn,
      duration: this.data.timeElapsed,
      isWin,
      playedAt: new Date().toISOString()
    }

    // 获取现有记录
    const history = wx.getStorageSync('gameHistory') || []
    history.unshift(record)

    // 只保留最近100条
    if (history.length > 100) history.pop()

    wx.setStorageSync('gameHistory', history)

    // 更新统计
    this.updateStats(isWin)
  },

  // 更新统计
  updateStats(isWin) {
    const stats = wx.getStorageSync('userStats') || {
      totalGames: 0,
      wins: 0,
      winStreak: 0,
      maxWinStreak: 0
    }

    stats.totalGames++
    if (isWin) {
      stats.wins++
      stats.winStreak++
      stats.maxWinStreak = Math.max(stats.maxWinStreak, stats.winStreak)
    } else {
      stats.winStreak = 0
    }

    wx.setStorageSync('userStats', stats)
  },

  // 返回首页
  goHome() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  // 再来一局
  restartGame() {
    this.initGame()
  }
})