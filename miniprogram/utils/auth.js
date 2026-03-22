/**
 * 微信登录模块
 * 处理用户认证、token管理、用户信息获取
 */

const app = getApp()

/**
 * 微信登录流程
 * @returns {Promise<{openid: string, token: string}>}
 */
async function wxLogin() {
  try {
    // 1. 获取登录code
    const loginResult = await wxLoginAsync()

    // 2. 发送code到服务器换取openid和token
    const authResult = await loginWithCode(loginResult.code)

    // 3. 保存token和openid
    if (authResult.token && authResult.openid) {
      wx.setStorageSync('token', authResult.token)
      wx.setStorageSync('openid', authResult.openid)
      app.globalData.token = authResult.token
      app.globalData.openid = authResult.openid
    }

    return authResult
  } catch (error) {
    console.error('[Auth] 登录失败:', error)
    throw error
  }
}

/**
 * wx.login Promise封装
 */
function wxLoginAsync() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: resolve,
      fail: reject
    })
  })
}

/**
 * 发送code到服务器换取token
 * @param {string} code
 * @returns {Promise<{openid: string, token: string, userInfo?: object}>}
 */
async function loginWithCode(code) {
  // TODO: 替换为实际的服务器地址
  const serverUrl = app.globalData.gameConfig?.apiServer || 'https://your-server.com'

  try {
    const res = await wx.request({
      url: `${serverUrl}/api/login`,
      method: 'POST',
      data: { code },
      header: {
        'content-type': 'application/json'
      }
    })

    if (res.data.success) {
      return res.data.data
    } else {
      throw new Error(res.data.message || '登录失败')
    }
  } catch (error) {
    // 开发环境：返回模拟数据
    console.warn('[Auth] 服务器登录失败，使用模拟数据:', error)
    return {
      openid: `mock_openid_${Date.now()}`,
      token: `mock_token_${Date.now()}`,
      isNewUser: true
    }
  }
}

/**
 * 获取用户信息
 * 需要用户授权
 */
async function getUserProfile() {
  return new Promise((resolve, reject) => {
    wx.getUserProfile({
      desc: '用于展示用户昵称和头像',
      success: (res) => {
        const userInfo = res.userInfo
        // 保存用户信息
        wx.setStorageSync('userInfo', userInfo)
        app.globalData.userInfo = userInfo
        resolve(userInfo)
      },
      fail: reject
    })
  })
}

/**
 * 检查登录状态
 * @returns {boolean}
 */
function isLoggedIn() {
  const token = wx.getStorageSync('token')
  const openid = wx.getStorageSync('openid')
  return !!(token && openid)
}

/**
 * 获取当前用户信息
 * @returns {object|null}
 */
function getCurrentUser() {
  if (app.globalData.userInfo) {
    return app.globalData.userInfo
  }
  const userInfo = wx.getStorageSync('userInfo')
  if (userInfo) {
    app.globalData.userInfo = userInfo
  }
  return userInfo || null
}

/**
 * 获取token
 * @returns {string|null}
 */
function getToken() {
  return wx.getStorageSync('token') || app.globalData.token || null
}

/**
 * 获取openid
 * @returns {string|null}
 */
function getOpenId() {
  return wx.getStorageSync('openid') || app.globalData.openid || null
}

/**
 * 登出
 */
function logout() {
  wx.removeStorageSync('token')
  wx.removeStorageSync('openid')
  wx.removeStorageSync('userInfo')
  app.globalData.token = null
  app.globalData.openid = null
  app.globalData.userInfo = null
}

/**
 * 检查token是否过期
 * @returns {Promise<boolean>}
 */
async function checkTokenValid() {
  const token = getToken()
  if (!token) return false

  try {
    const serverUrl = app.globalData.gameConfig?.apiServer || 'https://your-server.com'
    const res = await wx.request({
      url: `${serverUrl}/api/check-token`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      }
    })
    return res.data.valid === true
  } catch (error) {
    console.error('[Auth] Token检查失败:', error)
    return false
  }
}

/**
 * 刷新token
 * @returns {Promise<string>}
 */
async function refreshToken() {
  const openid = getOpenId()
  if (!openid) {
    throw new Error('无法刷新token：用户未登录')
  }

  try {
    const serverUrl = app.globalData.gameConfig?.apiServer || 'https://your-server.com'
    const res = await wx.request({
      url: `${serverUrl}/api/refresh-token`,
      method: 'POST',
      data: { openid }
    })

    if (res.data.success && res.data.token) {
      const newToken = res.data.token
      wx.setStorageSync('token', newToken)
      app.globalData.token = newToken
      return newToken
    } else {
      throw new Error(res.data.message || '刷新token失败')
    }
  } catch (error) {
    console.error('[Auth] 刷新token失败:', error)
    // 刷新失败，重新登录
    return wxLogin()
  }
}

module.exports = {
  wxLogin,
  wxLoginAsync,
  loginWithCode,
  getUserProfile,
  isLoggedIn,
  getCurrentUser,
  getToken,
  getOpenId,
  logout,
  checkTokenValid,
  refreshToken
}