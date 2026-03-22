/**
 * 主题管理模块
 * 处理深色/浅色主题切换
 */

const app = getApp()

const THEMES = {
  DARK: 'dark',
  LIGHT: 'light'
}

/**
 * 获取当前主题
 * @returns {string}
 */
function getCurrentTheme() {
  return app.globalData.settings?.theme || 'dark'
}

/**
 * 切换主题
 * @returns {string} 新主题
 */
function toggleTheme() {
  const currentTheme = getCurrentTheme()
  const newTheme = currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK

  setTheme(newTheme)
  return newTheme
}

/**
 * 设置主题
 * @param {string} theme - 'dark' | 'light'
 */
function setTheme(theme) {
  // 更新全局设置
  if (app.saveSettings) {
    app.saveSettings({ theme })
  }

  // 保存到本地
  wx.setStorageSync('theme', theme)

  // 应用主题（需要页面配合）
  applyTheme(theme)
}

/**
 * 应用主题到页面
 * @param {string} theme
 */
function applyTheme(theme) {
  // 获取当前页面
  const pages = getCurrentPages()
  if (pages.length === 0) return

  const currentPage = pages[pages.length - 1]

  // 更新页面数据
  if (currentPage.setData) {
    currentPage.setData({
      theme,
      isDarkTheme: theme === THEMES.DARK
    })
  }

  // 设置导航栏颜色
  if (theme === THEMES.DARK) {
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#0f172a'
    })
  } else {
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: '#f8fafc'
    })
  }
}

/**
 * 初始化主题
 */
function initTheme() {
  const theme = getCurrentTheme()
  applyTheme(theme)
}

/**
 * 获取主题CSS变量
 * @param {string} theme
 * @returns {object}
 */
function getThemeVariables(theme) {
  const themes = {
    dark: {
      '--bg-primary': '#0f172a',
      '--bg-secondary': '#1e293b',
      '--bg-card': '#334155',
      '--bg-input': '#1e293b',
      '--text-primary': '#f1f5f9',
      '--text-secondary': '#94a3b8',
      '--text-muted': '#64748b',
      '--accent-primary': '#6366f1',
      '--accent-secondary': '#818cf8',
      '--success': '#10b981',
      '--warning': '#f59e0b',
      '--error': '#ef4444',
      '--border-color': '#334155'
    },
    light: {
      '--bg-primary': '#f8fafc',
      '--bg-secondary': '#e2e8f0',
      '--bg-card': '#ffffff',
      '--bg-input': '#f1f5f9',
      '--text-primary': '#1e293b',
      '--text-secondary': '#64748b',
      '--text-muted': '#94a3b8',
      '--accent-primary': '#4f46e5',
      '--accent-secondary': '#6366f1',
      '--success': '#059669',
      '--warning': '#d97706',
      '--error': '#dc2626',
      '--border-color': '#e2e8f0'
    }
  }

  return themes[theme] || themes.dark
}

/**
 * 判断是否为深色主题
 * @returns {boolean}
 */
function isDarkTheme() {
  return getCurrentTheme() === THEMES.DARK
}

module.exports = {
  THEMES,
  getCurrentTheme,
  setTheme,
  toggleTheme,
  applyTheme,
  initTheme,
  getThemeVariables,
  isDarkTheme
}