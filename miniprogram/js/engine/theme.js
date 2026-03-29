/**
 * 主题系统 - 统一的设计规范
 * 提供色彩、字体、间距、动画等设计令牌
 */

const Theme = {
  // 色彩系统
  colors: {
    // 深色主题（默认）
    dark: {
      // 背景渐变（从上到下的线性渐变）
      bgGradient: {
        start: '#0f172a',
        end: '#1e293b'
      },
      // 玻璃态卡片
      glass: {
        bg: 'rgba(30, 41, 59, 0.7)',
        border: 'rgba(255, 255, 255, 0.1)',
        highlight: 'rgba(255, 255, 255, 0.05)'
      },
      // 强调色（Indigo 系列）
      accent: {
        primary: '#6366f1',
        light: '#818cf8',
        dark: '#4f46e5',
        glow: 'rgba(99, 102, 241, 0.5)'
      },
      // 状态色
      status: {
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
      },
      // 文字层级
      text: {
        primary: '#f1f5f9',     // 标题、重要文字
        secondary: '#94a3b8',   // 正文
        muted: '#64748b',       // 辅助说明
        disabled: '#475569'     // 禁用状态
      },
      // 边框和分割线
      border: {
        light: 'rgba(255, 255, 255, 0.1)',
        medium: 'rgba(255, 255, 255, 0.2)',
        strong: 'rgba(255, 255, 255, 0.3)'
      }
    }
  },

  // 字体系统
  typography: {
    // 字体族（使用系统字体栈）
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: '"SF Mono", "Monaco", "Inconsolata", "Fira Code", monospace'
    },
    // 字号规范（基于 4px 基格）
    sizes: {
      h1: { size: 32, lineHeight: 40, weight: 'bold' },       // 页面标题
      h2: { size: 24, lineHeight: 32, weight: 'semibold' },   // 区块标题
      h3: { size: 20, lineHeight: 28, weight: 'semibold' },  // 小标题
      body: { size: 16, lineHeight: 24, weight: 'normal' },   // 正文
      caption: { size: 12, lineHeight: 16, weight: 'normal' } // 辅助文字
    }
  },

  // 间距系统（基于 4px 基格）
  spacing: {
    xs: 4,    // 极小间距
    sm: 8,    // 小间距
    md: 16,   // 中间距
    lg: 24,   // 大间距
    xl: 32,   // 极大间距
    xxl: 48   // 超大间距
  },

  // 圆角系统
  borderRadius: {
    sm: 4,    // 小圆角（标签、小按钮）
    md: 8,    // 中圆角（按钮、输入框）
    lg: 12,   // 大圆角（卡片）
    xl: 16,   // 超大圆角（弹窗）
    full: 9999 // 完全圆形
  },

  // 阴影系统
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)',
    lg: '0 8px 32px rgba(0, 0, 0, 0.4)',
    neon: '0 0 20px rgba(99, 102, 241, 0.5)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)'
  },

  // 动画系统
  animations: {
    // 缓动函数
    easing: {
      default: 'ease-out',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)'
    },
    // 时长规范
    duration: {
      fast: 150,    // 快速反馈（按钮按下）
      normal: 300,  // 正常过渡（场景切换）
      slow: 500     // 慢速动画（强调效果）
    },
    // 预定义动画
    keyframes: {
      fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
      slideUp: { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      pulse: { '0%, 100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.05)' } },
      breathe: { '0%, 100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)' }, '50%': { boxShadow: '0 0 40px rgba(99, 102, 241, 0.6)' } }
    }
  },

  // 辅助方法
  helpers: {
    // 获取当前主题颜色
    getColors() {
      return Theme.colors.dark
    },

    // 获取字体规范
    getTypography(size) {
      return Theme.typography.sizes[size] || Theme.typography.sizes.body
    },

    // 获取间距
    getSpacing(key) {
      return Theme.spacing[key] || Theme.spacing.md
    },

    // 计算亮度
    luminance(r, g, b) {
      const a = [r, g, b].map(v => {
        v /= 255
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
      })
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722
    }
  }
}

// 导出主题
module.exports = Theme

// 小程序模块注册
if (typeof registerModule === 'function') {
  registerModule('theme', Theme)
}
