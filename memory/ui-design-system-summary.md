# 小程序极简UI设计系统总结

## 概述

本设计系统为"数字对决 Pro"小程序提供统一的视觉规范和可复用的UI组件，实现从"简陋混乱"到"极简高级"的转变。

## 设计理念

### 核心原则
1. **减少装饰，强化内容** - 移除emoji，使用精致图标和文字
2. **统一玻璃态** - 所有卡片使用统一玻璃效果（半透明+模糊+边框高光）
3. **4px基格系统** - 间距、尺寸都遵循4的倍数
4. **有意义的动效** - 每个动画都服务用户体验
5. **深色优先** - 以深色主题为默认，确保对比度

### 视觉风格
- **现代极简** - 干净的线条，充足的留白
- **科技感** - 深色背景+霓虹强调色
- **高端质感** - 玻璃态+微妙阴影+平滑过渡

## 色彩系统

### 主色调
```javascript
// 深色渐变背景
bgGradient: ['#0f172a', '#1e293b']

// 强调色（Indigo系列）
accent: {
  primary: '#6366f1',  // 主按钮、高亮
  light: '#818cf8',    // 悬停状态
  dark: '#4f46e5',     // 按下状态
  glow: 'rgba(99, 102, 241, 0.5)'  // 发光效果
}
```

### 玻璃态效果
```javascript
glass: {
  bg: 'rgba(30, 41, 59, 0.7)',        // 背景色
  border: 'rgba(255, 255, 255, 0.1)',  // 边框色
  highlight: 'rgba(255, 255, 255, 0.05)' // 顶部高光
}
```

### 文字层级
```javascript
text: {
  primary: '#f1f5f9',     // 标题、重要文字
  secondary: '#94a3b8',  // 正文
  muted: '#64748b',      // 辅助说明
  disabled: '#475569'    // 禁用状态
}
```

### 状态色
```javascript
status: {
  success: '#10b981',  // 成功
  warning: '#f59e0b',  // 警告
  error: '#ef4444',    // 错误
  info: '#3b82f6'     // 信息
}
```

## 字体系统

### 字体族
```javascript
fontFamily: {
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  mono: '"SF Mono", "Monaco", "Inconsolata", "Fira Code", monospace'
}
```

### 字号规范（基于4px基格）
| 层级 | 字号 | 行高 | 字重 | 用途 |
|------|------|------|------|------|
| h1 | 32px | 40px | bold | 页面标题 |
| h2 | 24px | 32px | semibold | 区块标题 |
| h3 | 20px | 28px | semibold | 小标题 |
| body | 16px | 24px | normal | 正文 |
| caption | 12px | 16px | normal | 辅助文字 |

## 间距系统

基于 **4px 基格**：

```javascript
spacing: {
  xs: 4,     // 极小间距
  sm: 8,     // 小间距
  md: 16,    // 中间距
  lg: 24,    // 大间距
  xl: 32,    // 极大间距
  xxl: 48    // 超大间距
}
```

### 常用组合：
- 卡片内边距：`spacing.lg` (24px)
- 按钮间距：`spacing.md` (16px)
- 元素组间距：`spacing.xl` (32px)
- 页面边距：`spacing.lg` (24px)

## 圆角系统

```javascript
borderRadius: {
  sm: 4,    // 小圆角（标签、小按钮）
  md: 8,    // 中圆角（按钮、输入框）
  lg: 12,   // 大圆角（卡片）
  xl: 16,   // 超大圆角（弹窗）
  full: 9999 // 完全圆形
}
```

## 阴影系统

```javascript
shadows: {
  sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
  md: '0 4px 6px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)',
  lg: '0 8px 32px rgba(0, 0, 0, 0.4)',
  neon: '0 0 20px rgba(99, 102, 241, 0.5)',
  inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)'
}
```

## 动画系统

### 缓动函数
```javascript
easing: {
  default: 'ease-out',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)'
}
```

### 时长规范
```javascript
duration: {
  fast: 150,    // 快速反馈（按钮按下）
  normal: 300,  // 正常过渡（场景切换）
  slow: 500     // 慢速动画（强调效果）
}
```

### 预定义动画
- `fadeIn` - 淡入
- `slideUp` - 上滑进入
- `pulse` - 脉冲缩放
- `breathe` - 呼吸发光

## UI组件库

### 可用组件列表

| 组件 | 方法 | 说明 |
|------|------|------|
| 玻璃态卡片 | `ui.drawGlassCard(x, y, w, h, options)` | 半透明背景+边框+高光 |
| 主要按钮 | `ui.drawPrimaryButton(x, y, w, h, text, options)` | 渐变背景+发光+按压反馈 |
| 次要按钮 | `ui.drawSecondaryButton(x, y, w, h, text, options)` | 透明背景+边框 |
| 幽灵按钮 | `ui.drawGhostButton(x, y, w, h, text, options)` | 纯文字，无边框 |
| 图标按钮 | `ui.drawIconButton(x, y, size, icon, options)` | 圆形按钮 |
| 数字输入框 | `ui.drawDigitInput(x, y, size, value, options)` | 聚焦发光+状态 |
| 键盘按键 | `ui.drawKey(x, y, size, label, options)` | 多种变体 |
| 文字标签 | `ui.drawTag(x, y, text, options)` | 多色变体 |
| 分割线 | `ui.drawDivider(x, y, width, options)` | 实线/虚线 |
| 列表项 | `ui.drawListItem(x, y, w, h, text, options)` | 图标+详情+箭头 |

### 使用示例

```javascript
// 在场景的 render 方法中
render(renderer) {
  const ui = renderer.ui

  // 绘制玻璃态卡片
  ui.drawGlassCard(50, 100, 280, 400, {
    radius: 12,
    shadow: true
  })

  // 绘制主要按钮
  ui.drawPrimaryButton(70, 150, 240, 48, '开始游戏', {
    withGlow: true
  })

  // 绘制数字输入框
  ui.drawDigitInput(100, 250, 56, '5', {
    focused: true
  })
}
```

## 改造前后对比

### 主菜单场景

| 方面 | 改造前 | 改造后 |
|------|--------|--------|
| 按钮 | emoji + 文字 (`🤖 AI 对战`) | 纯文字 (`AI 对战`) |
| 容器 | 无 | 玻璃态卡片 |
| 标题 | 普通文字 | 渐变文字 |
| 间距 | 随意 (`btnGap = 52`) | 4px基格系统 |
| 主按钮 | 静态 | 呼吸灯发光效果 |
| 按压反馈 | 无 | 有 |

## 后续任务

### P0 - 核心场景
- [ ] 游戏场景 (game.js) - 数字输入、键盘、AI思考区
- [ ] 结果场景 (result.js) - 胜利/失败动画

### P1 - 辅助场景
- [ ] 设置场景 (settings.js) - 选项和统计
- [ ] 历史场景 (history.js) - 记录列表
- [ ] 引导场景 (guide.js) - 游戏规则

### P2 - 优化测试
- [ ] 预览壳测试
- [ ] 性能测试
- [ ] 响应式布局验证
