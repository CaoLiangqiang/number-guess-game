// storage.js - 本地存储工具
const STORAGE_KEYS = {
  USER_INFO: 'userInfo',
  USER_STATS: 'userStats',
  GAME_HISTORY: 'gameHistory',
  SETTINGS: 'settings',
  DAILY_CHALLENGE_DATE: 'dailyChallengeDate',
  DAILY_CHALLENGE_RESULT: 'dailyChallengeResult',
  GUIDE_COMPLETED: 'guide_completed'
}

/**
 * 保存数据到本地存储
 */
function save(key, data) {
  try {
    wx.setStorageSync(key, data)
    return true
  } catch (e) {
    console.error('存储失败:', e)
    return false
  }
}

/**
 * 从本地存储读取数据
 */
function load(key, defaultValue = null) {
  try {
    const data = wx.getStorageSync(key)
    return data || defaultValue
  } catch (e) {
    console.error('读取失败:', e)
    return defaultValue
  }
}

/**
 * 删除本地存储数据
 */
function remove(key) {
  try {
    wx.removeStorageSync(key)
    return true
  } catch (e) {
    console.error('删除失败:', e)
    return false
  }
}

/**
 * 清空所有本地存储
 */
function clear() {
  try {
    wx.clearStorageSync()
    return true
  } catch (e) {
    console.error('清空失败:', e)
    return false
  }
}

/**
 * 获取用户统计
 */
function getUserStats() {
  return load(STORAGE_KEYS.USER_STATS, {
    totalGames: 0,
    wins: 0,
    losses: 0,
    winStreak: 0,
    maxWinStreak: 0,
    avgSteps: 0,
    fastestWin: null
  })
}

/**
 * 保存用户统计
 */
function saveUserStats(stats) {
  return save(STORAGE_KEYS.USER_STATS, stats)
}

/**
 * 获取游戏历史
 */
function getGameHistory(limit = 20) {
  const history = load(STORAGE_KEYS.GAME_HISTORY, [])
  return history.slice(0, limit)
}

/**
 * 添加游戏记录
 */
function addGameRecord(record) {
  const history = load(STORAGE_KEYS.GAME_HISTORY, [])
  history.unshift(record)

  // 只保留最近100条
  if (history.length > 100) {
    history.pop()
  }

  return save(STORAGE_KEYS.GAME_HISTORY, history)
}

/**
 * 获取设置
 */
function getSettings() {
  return load(STORAGE_KEYS.SETTINGS, {
    theme: 'dark',
    soundEnabled: true,
    difficulty: 4
  })
}

/**
 * 保存设置
 */
function saveSettings(settings) {
  return save(STORAGE_KEYS.SETTINGS, settings)
}

/**
 * 检查每日挑战是否完成
 */
function isDailyChallengeCompleted() {
  const today = new Date().toISOString().split('T')[0]
  const completedDate = load(STORAGE_KEYS.DAILY_CHALLENGE_DATE)
  return completedDate === today
}

/**
 * 记录每日挑战完成
 */
function markDailyChallengeCompleted(result) {
  const today = new Date().toISOString().split('T')[0]
  save(STORAGE_KEYS.DAILY_CHALLENGE_DATE, today)
  save(STORAGE_KEYS.DAILY_CHALLENGE_RESULT, result)
}

/**
 * 获取每日挑战结果
 */
function getDailyChallengeResult() {
  return load(STORAGE_KEYS.DAILY_CHALLENGE_RESULT)
}

/**
 * 检查新手引导是否完成
 */
function isGuideCompleted() {
  return load(STORAGE_KEYS.GUIDE_COMPLETED, false)
}

/**
 * 标记新手引导完成
 */
function markGuideCompleted() {
  return save(STORAGE_KEYS.GUIDE_COMPLETED, true)
}

module.exports = {
  STORAGE_KEYS,
  save,
  load,
  remove,
  clear,
  getUserStats,
  saveUserStats,
  getGameHistory,
  addGameRecord,
  getSettings,
  saveSettings,
  isDailyChallengeCompleted,
  markDailyChallengeCompleted,
  getDailyChallengeResult,
  isGuideCompleted,
  markGuideCompleted
}