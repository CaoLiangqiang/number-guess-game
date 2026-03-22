/**
 * API 调用模块
 * 封装与后端服务器的所有HTTP通信
 */

const { getToken } = require('./auth')

const app = getApp()

/**
 * 获取服务器地址
 */
function getServerUrl() {
  return app.globalData.gameConfig?.apiServer || 'https://your-server.com'
}

/**
 * 发起HTTP请求
 * @param {string} url - 请求路径
 * @param {object} options - 请求选项
 * @returns {Promise<any>}
 */
async function request(url, options = {}) {
  const {
    method = 'GET',
    data = {},
    header = {},
    needAuth = true
  } = options

  const serverUrl = getServerUrl()
  const token = getToken()

  const headers = {
    'content-type': 'application/json',
    ...header
  }

  if (needAuth && token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${serverUrl}${url}`,
      method,
      data,
      header: headers,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else if (res.statusCode === 401) {
          // Token过期，触发重新登录
          wx.removeStorageSync('token')
          reject(new Error('TOKEN_EXPIRED'))
        } else {
          reject(new Error(res.data.message || `请求失败: ${res.statusCode}`))
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '网络请求失败'))
      }
    })
  })
}

// ==================== 用户相关 API ====================

/**
 * 获取用户信息
 */
async function getUserInfo() {
  return request('/api/user/info')
}

/**
 * 更新用户信息
 */
async function updateUserInfo(userInfo) {
  return request('/api/user/update', {
    method: 'POST',
    data: userInfo
  })
}

/**
 * 获取用户统计数据
 */
async function getUserStats() {
  return request('/api/user/stats')
}

// ==================== 游戏记录 API ====================

/**
 * 保存游戏记录
 */
async function saveGameRecord(record) {
  return request('/api/game/save', {
    method: 'POST',
    data: record
  })
}

/**
 * 获取游戏历史
 */
async function getGameHistory(limit = 20, offset = 0) {
  return request('/api/game/history', {
    data: { limit, offset }
  })
}

// ==================== 每日挑战 API ====================

/**
 * 获取每日挑战题目
 */
async function getDailyChallenge() {
  return request('/api/daily-challenge/today')
}

/**
 * 提交每日挑战结果
 */
async function submitDailyChallenge(result) {
  return request('/api/daily-challenge/submit', {
    method: 'POST',
    data: result
  })
}

/**
 * 获取每日挑战排行榜
 */
async function getDailyRanking(date) {
  return request('/api/daily-challenge/ranking', {
    data: { date }
  })
}

// ==================== 排行榜 API ====================

/**
 * 获取排行榜
 * @param {string} type - 排行榜类型: winRate, winStreak, fastestWin
 */
async function getRanking(type, limit = 100) {
  return request('/api/ranking/list', {
    data: { type, limit }
  })
}

/**
 * 获取我的排名
 */
async function getMyRanking(type) {
  return request('/api/ranking/my', {
    data: { type }
  })
}

// ==================== 好友系统 API ====================

/**
 * 获取好友列表
 */
async function getFriendList() {
  return request('/api/friend/list')
}

/**
 * 添加好友
 */
async function addFriend(openid) {
  return request('/api/friend/add', {
    method: 'POST',
    data: { friendOpenid: openid }
  })
}

/**
 * 获取在线好友
 */
async function getOnlineFriends() {
  return request('/api/friend/online')
}

module.exports = {
  request,
  // 用户相关
  getUserInfo,
  updateUserInfo,
  getUserStats,
  // 游戏记录
  saveGameRecord,
  getGameHistory,
  // 每日挑战
  getDailyChallenge,
  submitDailyChallenge,
  getDailyRanking,
  // 排行榜
  getRanking,
  getMyRanking,
  // 好友系统
  getFriendList,
  addFriend,
  getOnlineFriends
}