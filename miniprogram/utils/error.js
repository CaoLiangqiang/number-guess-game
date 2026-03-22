/**
 * 错误处理模块
 * 统一处理和展示错误信息
 */

/**
 * 错误码定义
 */
const ErrorCodes = {
  // 客户端错误 1000-1999
  ROOM_NOT_FOUND: 1001,
  PLAYER_LEFT: 1002,
  INVALID_INPUT: 1003,

  // 服务端错误 2000-1999
  SERVER_ERROR: 2001,
  DATABASE_ERROR: 2002,

  // 游戏逻辑错误 3000-3999
  GAME_STARTED: 3001,
  NOT_YOUR_TURN: 3002,
  GAME_ENDED: 3003,

  // 认证错误 4000-4999
  NOT_LOGGED_IN: 4001,
  TOKEN_EXPIRED: 4002,
  PERMISSION_DENIED: 4003
}

/**
 * 错误消息映射
 */
const ErrorMessages = {
  [ErrorCodes.ROOM_NOT_FOUND]: '房间不存在或已过期',
  [ErrorCodes.PLAYER_LEFT]: '对手已离开房间',
  [ErrorCodes.INVALID_INPUT]: '输入格式不正确',
  [ErrorCodes.SERVER_ERROR]: '服务器开小差了，请稍后重试',
  [ErrorCodes.DATABASE_ERROR]: '数据操作失败',
  [ErrorCodes.GAME_STARTED]: '游戏已经开始',
  [ErrorCodes.NOT_YOUR_TURN]: '不是你的回合',
  [ErrorCodes.GAME_ENDED]: '游戏已结束',
  [ErrorCodes.NOT_LOGGED_IN]: '请先登录',
  [ErrorCodes.TOKEN_EXPIRED]: '登录已过期，请重新登录',
  [ErrorCodes.PERMISSION_DENIED]: '没有权限执行此操作'
}

/**
 * 获取错误消息
 * @param {number|string} code - 错误码或错误消息
 * @returns {string}
 */
function getErrorMessage(code) {
  if (typeof code === 'string') return code
  return ErrorMessages[code] || '操作失败，请稍后重试'
}

/**
 * 显示错误提示
 * @param {number|string} code - 错误码或错误消息
 * @param {object} options - 选项
 */
function showError(code, options = {}) {
  const message = getErrorMessage(code)
  const { title = '提示', duration = 2000 } = options

  wx.showToast({
    title: message,
    icon: 'none',
    duration
  })

  // 认证错误跳转登录
  if (code === ErrorCodes.NOT_LOGGED_IN || code === ErrorCodes.TOKEN_EXPIRED) {
    setTimeout(() => {
      wx.switchTab({
        url: '/pages/index/index'
      })
    }, duration)
  }
}

/**
 * 显示成功提示
 * @param {string} message
 */
function showSuccess(message) {
  wx.showToast({
    title: message,
    icon: 'success',
    duration: 1500
  })
}

/**
 * 显示加载中
 * @param {string} title
 */
function showLoading(title = '加载中...') {
  wx.showLoading({
    title,
    mask: true
  })
}

/**
 * 隐藏加载
 */
function hideLoading() {
  wx.hideLoading()
}

/**
 * 确认对话框
 * @param {string} title
 * @param {string} content
 * @returns {Promise<boolean>}
 */
function confirm(title, content) {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      success: (res) => {
        resolve(res.confirm)
      },
      fail: () => {
        resolve(false)
      }
    })
  })
}

/**
 * 处理API错误
 * @param {Error} error
 * @param {object} options
 */
function handleApiError(error, options = {}) {
  console.error('[API Error]', error)

  // 网络错误
  if (error.errMsg && error.errMsg.includes('request:fail')) {
    showError('网络连接失败，请检查网络设置', options)
    return
  }

  // Token过期
  if (error.message === 'TOKEN_EXPIRED') {
    showError(ErrorCodes.TOKEN_EXPIRED)
    return
  }

  // 其他错误
  showError(error.message || '操作失败', options)
}

module.exports = {
  ErrorCodes,
  ErrorMessages,
  getErrorMessage,
  showError,
  showSuccess,
  showLoading,
  hideLoading,
  confirm,
  handleApiError
}