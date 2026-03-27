/**
 * 存储管理器
 * 处理本地数据持久化
 */

class StorageManager {
  constructor() {
    this.cache = new Map()
  }

  /**
   * 存储数据
   * @param {string} key - 键名
   * @param {any} value - 值
   */
  set(key, value) {
    try {
      wx.setStorageSync(key, value)
      this.cache.set(key, value)
      return true
    } catch (e) {
      console.error('[Storage] Set failed:', e)
      return false
    }
  }

  /**
   * 读取数据
   * @param {string} key - 键名
   * @param {any} defaultValue - 默认值
   * @returns {any}
   */
  get(key, defaultValue = null) {
    try {
      // 优先使用缓存
      if (this.cache.has(key)) {
        return this.cache.get(key)
      }

      const value = wx.getStorageSync(key)
      if (value !== '' && value !== null && value !== undefined) {
        this.cache.set(key, value)
        return value
      }
      return defaultValue
    } catch (e) {
      console.error('[Storage] Get failed:', e)
      return defaultValue
    }
  }

  /**
   * 删除数据
   * @param {string} key - 键名
   */
  remove(key) {
    try {
      wx.removeStorageSync(key)
      this.cache.delete(key)
      return true
    } catch (e) {
      console.error('[Storage] Remove failed:', e)
      return false
    }
  }

  /**
   * 清空所有数据
   */
  clear() {
    try {
      wx.clearStorageSync()
      this.cache.clear()
      return true
    } catch (e) {
      console.error('[Storage] Clear failed:', e)
      return false
    }
  }

  /**
   * 获取游戏历史记录
   * @param {number} limit - 限制数量
   */
  getGameHistory(limit = 50) {
    const history = this.get('gameHistory', [])
    return history.slice(0, limit)
  }

  /**
   * 添加游戏记录
   * @param {object} record - 游戏记录
   */
  addGameRecord(record) {
    const history = this.get('gameHistory', [])
    history.unshift({
      ...record,
      playedAt: new Date().toISOString()
    })

    // 只保留最近100条
    if (history.length > 100) {
      history.pop()
    }

    this.set('gameHistory', history)
  }

  /**
   * 更新用户统计
   * @param {boolean} isWin - 是否获胜
   * @param {number} turns - 回合数
   * @param {number} difficulty - 难度
   * @returns {object} 包含 stats 和 isRecordBroken
   */
  updateStats(isWin, turns = 0, difficulty = 4) {
    const stats = this.get('userStats', {
      totalGames: 0,
      wins: 0,
      winStreak: 0,
      maxWinStreak: 0,
      maxWinStreakDate: null,
      bestTurns: {}  // 按难度存储最佳回合数 { 3: 3, 4: 5, 5: 7 }
    })

    const oldMaxStreak = stats.maxWinStreak
    stats.totalGames++

    if (isWin) {
      stats.wins++
      stats.winStreak++
      if (stats.winStreak > stats.maxWinStreak) {
        stats.maxWinStreak = stats.winStreak
        stats.maxWinStreakDate = new Date().toISOString()
      }

      // 更新最佳回合数
      if (!stats.bestTurns) stats.bestTurns = {}
      const currentBest = stats.bestTurns[difficulty]
      if (!currentBest || turns < currentBest) {
        stats.bestTurns[difficulty] = turns
      }
    } else {
      stats.winStreak = 0
    }

    this.set('userStats', stats)

    // 检测是否打破了连胜记录
    const isRecordBroken = isWin && stats.maxWinStreak > oldMaxStreak

    // 检测是否刷新了最佳回合数记录
    const isNewBestTurns = isWin && stats.bestTurns[difficulty] === turns

    return { stats, isRecordBroken, isNewBestTurns }
  }

  /**
   * 获取用户统计
   */
  getStats() {
    return this.get('userStats', {
      totalGames: 0,
      wins: 0,
      winStreak: 0,
      maxWinStreak: 0,
      maxWinStreakDate: null,
      bestTurns: {},
      winRate: 0
    })
  }

  /**
   * 获取指定难度的最佳回合数
   * @param {number} difficulty - 难度
   * @returns {number|null} 最佳回合数，无数据返回 null
   */
  getBestTurns(difficulty) {
    const stats = this.get('userStats', { bestTurns: {} })
    return stats.bestTurns ? stats.bestTurns[difficulty] || null : null
  }

  /**
   * 获取指定难度的平均回合数
   * @param {number} difficulty - 难度
   * @returns {number|null} 平均回合数，无数据返回 null
   */
  getAverageTurns(difficulty) {
    const history = this.get('gameHistory', [])
    const filtered = history.filter(record => record.difficulty === difficulty && record.isWin)

    if (filtered.length === 0) {
      return null
    }

    const totalTurns = filtered.reduce((sum, record) => sum + record.turns, 0)
    return Math.round(totalTurns / filtered.length * 10) / 10  // 保留一位小数
  }

  /**
   * 获取指定难度的平均用时（秒）
   * @param {number} difficulty - 难度
   * @returns {number|null} 平均用时（秒），无数据返回 null
   */
  getAverageDuration(difficulty) {
    const history = this.get('gameHistory', [])
    const filtered = history.filter(record => record.difficulty === difficulty && record.isWin)

    if (filtered.length === 0) {
      return null
    }

    const totalDuration = filtered.reduce((sum, record) => sum + (record.duration || 0), 0)
    return Math.round(totalDuration / filtered.length)  // 返回整数秒
  }
}

module.exports = StorageManager