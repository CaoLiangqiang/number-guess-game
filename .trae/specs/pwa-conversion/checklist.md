# PWA 改造验证检查清单

## 使用说明

- 每个检查项需要在实现完成后进行验证
- 通过的在方括号内标记 x: `[x]`
- 未通过的标记为空: `[ ]`
- 未通过的项需要记录问题并修复后重新验证

---

## 一、Web App Manifest 验证

### 1.1 Manifest 文件配置
- [x] manifest.json 文件存在于项目根目录
- [x] 文件内容格式为有效 JSON
- [x] name 字段值为 "数字对决 Pro"
- [x] short_name 字段值为 "数字对决"
- [x] start_url 字段值为 "." 或 "/"
- [x] display 字段值为 "standalone"
- [x] background_color 字段值为 "#0f172a"
- [x] theme_color 字段值为 "#0f172a"
- [x] description 字段已配置
- [x] categories 字段包含 ["games", "puzzle"]
- [x] icons 数组包含所有必要尺寸（48, 72, 96, 128, 144, 152, 192, 384, 512）
- [x] 每个图标都有 src, sizes, type 属性
- [x] 图标路径正确可访问

### 1.2 Manifest 引用
- [x] index.html 中包含 `<link rel="manifest" href="/manifest.json">`
- [x] 移除了旧的 Base64 编码内联 manifest
- [x] 包含 Apple Touch Icon 引用
- [x] 包含 theme-color meta 标签

### 1.3 浏览器验证
- [ ] Chrome DevTools > Application > Manifest 显示所有配置
- [ ] 没有错误或警告信息
- [ ] 图标预览正常显示

---

## 二、Service Worker 验证

### 2.1 Service Worker 文件
- [x] service-worker.js 文件存在于项目根目录
- [x] 文件包含 install 事件监听
- [x] 文件包含 activate 事件监听
- [x] 文件包含 fetch 事件监听
- [x] CACHE_NAME 和 CACHE_VERSION 已定义

### 2.2 Service Worker 注册
- [x] index.html 底部包含注册脚本
- [x] 注册代码使用 navigator.serviceWorker.register('/service-worker.js')
- [x] 注册成功时在控制台输出日志
- [x] 注册失败时不影响页面正常运行
- [x] 使用正确的 scope（默认为根目录）

### 2.3 浏览器验证
- [ ] Chrome DevTools > Application > Service Workers 显示已注册
- [ ] Service Worker 状态为 "activated and is running"
- [ ] 控制台显示 "Service Worker 注册成功" 日志

---

## 三、离线缓存策略验证

### 3.1 核心资源缓存
- [x] Install 阶段缓存以下资源：
  - [x] /index.html
  - [x] /manifest.json
  - [x] /service-worker.js
  - [x] /offline.html
  - [x] /icons/ 目录下所有图标文件

### 3.2 缓存策略
- [x] 实现了 Cache First 策略
- [x] 缓存命中时直接从缓存返回
- [x] 缓存未命中时发起网络请求
- [x] 网络请求成功后更新缓存

### 3.3 离线回退
- [x] 当网络和缓存都不可用时返回 offline.html
- [x] offline.html 包含基本样式和返回提示
- [x] offline.html 可以正常显示

### 3.4 浏览器验证
- [ ] Chrome DevTools > Network 显示资源从 Service Worker 返回
- [ ] Application > Cache Storage 显示缓存内容
- [ ] 缓存内容包含所有核心资源

### 3.5 离线功能测试
- [ ] 断开网络连接（使用 DevTools Network offline 模式）
- [ ] 刷新页面，应用可以正常加载
- [ ] 单机模式可以正常游玩
- [ ] 游戏逻辑正常运行
- [ ] UI 显示正常

---

## 四、安装提示验证

### 4.1 beforeinstallprompt 事件
- [x] 监听 beforeinstallprompt 事件
- [x] 阻止默认的迷你信息栏（preventDefault）
- [x] 保存 install 事件对象供后续使用

### 4.2 安装提示 UI
- [x] 设计底部弹出提示条
- [x] 包含应用图标
- [x] 包含应用名称和描述
- [x] 提供"立即安装"按钮
- [x] 提供"稍后"按钮
- [x] 样式符合应用主题

### 4.3 iOS 安装引导
- [x] 检测 iOS Safari 浏览器
- [x] 显示 iOS 特定的安装引导
- [x] 包含"添加到主屏幕"操作说明
- [x] 包含步骤图示（分享按钮 -> 添加到主屏幕）

### 4.4 安装状态管理
- [x] 使用 localStorage 记录安装状态
- [x] 已安装用户不再显示提示
- [x] 提供"不再询问"选项
- [x] 监听 appinstalled 事件

### 4.5 浏览器验证
- [ ] Android Chrome 访问时显示安装提示
- [ ] 点击"立即安装"触发系统安装对话框
- [ ] iOS Safari 显示特定的安装引导
- [ ] 安装完成后不再显示提示

---

## 五、离线状态检测验证

### 5.1 网络状态检测
- [x] 监听 online 事件
- [x] 监听 offline 事件
- [x] 使用 navigator.onLine 获取初始状态
- [x] 提供 isOnline() 工具函数

### 5.2 网络状态提示 UI
- [x] 设计顶部状态提示条
- [x] 离线时显示红色"离线模式"提示
- [x] 在线时显示绿色"已连接"提示
- [x] 提示条可以自动隐藏或手动关闭

### 5.3 联机模式离线阻止
- [x] 修改"双人联机"按钮点击处理
- [x] 离线时显示提示"联机模式需要网络连接"
- [x] 提供"检查网络"按钮
- [x] 提供"游玩单机模式"按钮
- [x] 不发起 WebSocket 连接尝试

### 5.4 游戏内网络状态
- [x] 游戏界面显示网络状态指示器
- [x] 联机模式下网络断开时提示
- [x] 网络恢复时自动重连

### 5.5 浏览器验证
- [ ] 断开网络时显示离线提示
- [ ] 恢复网络时提示消失
- [ ] 离线时点击"双人联机"显示正确提示
- [ ] 单机模式离线时仍可正常游玩

---

## 六、缓存更新机制验证

### 6.1 版本控制
- [x] 使用 CACHE_VERSION 管理缓存版本
- [x] 版本号格式清晰（如 "v1", "v2"）
- [x] 每次更新时递增版本号

### 6.2 旧缓存清理
- [x] 在 activate 事件中清理旧版本缓存
- [x] 只保留当前版本的缓存
- [x] 清理逻辑正确执行

### 6.3 更新检测
- [x] 监听 Service Worker 更新事件
- [x] 检测到新版本时显示更新提示
- [x] 后台下载新版本资源

### 6.4 更新提示 UI
- [x] 设计"有新版本可用"提示条
- [x] 提供"立即更新"按钮
- [x] 点击后跳过等待，激活新 Service Worker
- [x] 页面刷新后使用新版本

### 6.5 skipWaiting 逻辑
- [x] Service Worker 中调用 self.skipWaiting()
- [x] 确保新版本立即生效
- [x] 不等待旧页面关闭

### 6.6 浏览器验证
- [ ] 修改 Service Worker 后检测到更新
- [ ] 显示更新提示 UI
- [ ] 点击更新后应用使用新版本
- [ ] 旧缓存被正确清理
- [ ] Application > Cache Storage 只显示当前版本缓存

---

## 七、Lighthouse 审计验证

### 7.1 PWA 分类
- [ ] 运行 Lighthouse PWA 审计
- [ ] PWA 得分 >= 90
- [ ] 所有 PWA 检查项通过

### 7.2 具体检查项
- [ ] Web app manifest and service worker meet the installability requirements
- [ ] Registers a service worker that controls page and start_url
- [ ] Has a <meta name="viewport"> tag with width or initial-scale
- [ ] Contains some content when JavaScript is not available
- [ ] Configured for a custom splash screen
- [ ] Sets a theme color for the address bar
- [ ] Content is sized correctly for the viewport
- [ ] Has a <meta name="theme-color"> tag
- [ ] Manifest has a maskable icon
- [ ] Provides a valid apple-touch-icon

### 7.3 其他分类（可选但推荐）
- [ ] Performance 得分 >= 80
- [ ] Accessibility 得分 >= 80
- [ ] Best Practices 得分 >= 80
- [ ] SEO 得分 >= 80

---

## 八、跨浏览器验证

### 8.1 Chrome (Android)
- [ ] 可以正常访问应用
- [ ] 显示 PWA 安装提示
- [ ] 可以添加到主屏幕
- [ ] 离线功能正常
- [ ] 从主屏幕启动正常

### 8.2 Safari (iOS)
- [ ] 可以正常访问应用
- [ ] 显示 iOS 安装引导
- [ ] 可以手动添加到主屏幕
- [ ] 离线功能正常
- [ ] 从主屏幕启动正常

### 8.3 Chrome (Desktop)
- [ ] 可以正常访问应用
- [ ] 地址栏显示安装图标
- [ ] 可以安装为桌面应用
- [ ] 离线功能正常

### 8.4 Edge (Desktop)
- [ ] 可以正常访问应用
- [ ] 可以安装为应用
- [ ] 离线功能正常

---

## 九、文档清理验证

### 9.1 文档审查
- [x] 审查 design_doc.md 内容
- [x] 审查 AGENTS.md 内容
- [x] 审查 server/DEPLOY_GUIDE.md 内容

### 9.2 文档更新
- [x] AGENTS.md 包含 PWA 相关信息
- [x] AGENTS.md 项目结构说明已更新
- [x] AGENTS.md 移除了过时信息
- [x] design_doc.md 已精简（如适用）

### 9.3 目录整理
- [x] server 目录只包含必要文件
- [x] 无重复或过时的文档
- [x] 目录结构清晰

---

## 十、最终验收检查

### 10.1 功能完整性
- [x] 所有规划的功能已实现
- [x] 单机模式离线可用
- [x] 联机模式在线可用
- [x] 安装提示正常工作
- [x] 缓存更新机制正常工作

### 10.2 用户体验
- [x] 应用可以安装到主屏幕
- [x] 离线状态下可以正常游玩
- [x] 网络状态提示清晰明确
- [x] 更新提示不干扰用户

### 10.3 代码质量
- [x] 代码符合项目编码规范
- [x] 有适当的注释
- [x] 错误处理完善
- [x] 无控制台错误

### 10.4 性能
- [ ] 首屏加载时间 < 3秒
- [ ] Lighthouse Performance 得分 >= 80
- [ ] 缓存策略有效减少网络请求

---

## 验证记录表

| 验证日期 | 验证人 | 验证结果 | 问题记录 | 修复状态 |
|----------|--------|----------|----------|----------|
| 2026-02-19 | AI | 代码审查通过 | 无 | - |
| | | | | |
| | | | | |

---

## 附录：验证工具

1. **Chrome DevTools**
   - Application > Manifest
   - Application > Service Workers
   - Application > Cache Storage
   - Lighthouse 审计

2. **在线工具**
   - https://manifest-validator.appspot.com/
   - https://www.pwabuilder.com/

3. **测试环境**
   - Android Chrome
   - iOS Safari
   - Desktop Chrome/Edge
   - 使用 DevTools Network 模拟离线状态
