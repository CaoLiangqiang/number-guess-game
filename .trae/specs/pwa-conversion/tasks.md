# PWA 改造任务列表

## 任务依赖关系

```
任务1 (Manifest和图标)
    │
    ├──► 任务2 (Service Worker基础)
    │       │
    │       ├──► 任务3 (离线缓存策略)
    │       │       │
    │       │       └──► 任务6 (缓存更新机制)
    │       │
    │       └──► 任务5 (离线状态检测)
    │
    └──► 任务4 (安装提示组件)

任务7 (文档清理) - 可并行执行

任务8 (测试验证) - 依赖任务1-6完成
```

---

## 任务详情

### 任务1: 创建 manifest.json 和应用图标
**描述**: 创建独立的 Web App Manifest 文件和一套完整的 PWA 图标
**优先级**: 高
**预计时间**: 1小时

- [ ] SubTask 1.1: 创建 manifest.json 文件
  - 配置 name: "数字对决 Pro"
  - 配置 short_name: "数字对决"
  - 配置 start_url: "."
  - 配置 display: "standalone"
  - 配置 theme_color 和 background_color: "#0f172a"
  - 配置 icons 数组（引用图标文件路径）
  - 添加 description 和 categories

- [ ] SubTask 1.2: 生成 PWA 图标集
  - 创建 48x48, 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512 尺寸图标
  - 图标设计：使用应用主题色（#0f172a）背景，白色"#"符号
  - 保存到 icons/ 目录

- [ ] SubTask 1.3: 更新 index.html manifest 引用
  - 移除 Base64 编码的内联 manifest
  - 添加 `<link rel="manifest" href="/manifest.json">`
  - 添加 Apple Touch Icon 引用

**验证标准**:
- manifest.json 可以通过浏览器直接访问
- Chrome DevTools Application > Manifest 显示所有配置正确
- 图标文件存在且可以被访问

---

### 任务2: 实现 Service Worker 基础框架
**描述**: 创建 Service Worker 文件并实现基础生命周期管理
**优先级**: 高
**预计时间**: 2小时
**依赖**: 任务1

- [ ] SubTask 2.1: 创建 service-worker.js 文件
  - 定义 CACHE_NAME 和 CACHE_VERSION
  - 实现 install 事件监听
  - 实现 activate 事件监听
  - 实现 fetch 事件监听（基础框架）

- [ ] SubTask 2.2: 在 index.html 中注册 Service Worker
  - 添加注册脚本到页面底部
  - 处理注册成功/失败回调
  - 确保注册失败不影响页面正常运行

- [ ] SubTask 2.3: 实现 Service Worker 调试日志
  - 在 install/activate 事件中输出控制台日志
  - 便于开发调试

**验证标准**:
- Chrome DevTools Application > Service Workers 显示已注册
- 控制台显示 Service Worker 注册成功日志
- 刷新页面后 Service Worker 处于激活状态

---

### 任务3: 实现离线缓存策略
**描述**: 实现核心资源的缓存策略，支持离线访问
**优先级**: 高
**预计时间**: 2小时
**依赖**: 任务2

- [ ] SubTask 3.1: 定义核心资源列表
  - /index.html
  - /manifest.json
  - /icons/ 目录下所有图标
  - 离线回退页面 /offline.html

- [ ] SubTask 3.2: 实现安装时缓存（Install 阶段）
  - 在 install 事件中打开缓存
  - 使用 cache.addAll() 缓存核心资源
  - 处理缓存失败情况

- [ ] SubTask 3.3: 实现缓存优先策略（Fetch 阶段）
  - 优先从缓存返回匹配请求
  - 缓存未命中时发起网络请求
  - 网络请求成功后更新缓存

- [ ] SubTask 3.4: 实现离线回退
  - 当网络和缓存都不可用时返回 offline.html
  - 确保离线页面有基本样式和返回提示

- [ ] SubTask 3.5: 处理外部 CDN 资源
  - 对 Tailwind CSS 和字体使用 stale-while-revalidate 策略
  - 实现跨域资源缓存（CORS）

**验证标准**:
- Chrome DevTools Network 面板显示资源从 Service Worker 返回
- Application > Cache Storage 显示缓存内容
- 离线状态下刷新页面，应用仍可正常运行

---

### 任务4: 实现 PWA 安装提示组件
**描述**: 创建安装提示 UI，引导用户将应用添加到主屏幕
**优先级**: 中
**预计时间**: 1.5小时
**依赖**: 任务1

- [ ] SubTask 4.1: 监听 beforeinstallprompt 事件
  - 阻止默认的迷你信息栏
  - 保存 install 事件以便后续使用

- [ ] SubTask 4.2: 创建安装提示 UI 组件
  - 设计底部弹出提示条样式
  - 包含应用图标、名称、描述
  - 提供"立即安装"和"稍后"按钮

- [ ] SubTask 4.3: 实现 iOS 安装引导
  - 检测 iOS Safari 浏览器
  - 显示"添加到主屏幕"操作指引
  - 使用步骤图示说明（点击分享按钮 -> 添加到主屏幕）

- [ ] SubTask 4.4: 实现安装状态管理
  - 使用 localStorage 记录用户是否已安装
  - 已安装用户不再显示提示
  - 提供"不再询问"选项

- [ ] SubTask 4.5: 处理 appinstalled 事件
  - 监听应用安装完成事件
  - 隐藏安装提示
  - 记录安装状态

**验证标准**:
- Android Chrome 访问时显示安装提示
- 点击"立即安装"触发系统安装对话框
- iOS Safari 显示特定的安装引导
- 安装完成后不再显示提示

---

### 任务5: 实现离线状态检测
**描述**: 检测网络状态变化并更新 UI
**优先级**: 高
**预计时间**: 1小时
**依赖**: 无（可与任务2并行）

- [ ] SubTask 5.1: 创建网络状态检测模块
  - 监听 online/offline 事件
  - 使用 navigator.onLine 获取初始状态
  - 提供 isOnline() 工具函数

- [ ] SubTask 5.2: 创建网络状态提示 UI
  - 设计顶部状态提示条
  - 离线时显示红色"离线模式"提示
  - 在线时显示绿色"已连接"提示（可自动隐藏）

- [ ] SubTask 5.3: 联机模式离线阻止
  - 修改"双人联机"按钮点击处理
  - 离线时显示提示"联机模式需要网络连接"
  - 提供"检查网络"和"游玩单机模式"选项

- [ ] SubTask 5.4: 游戏内网络状态提示
  - 在游戏界面显示网络状态指示器
  - 联机模式下网络断开时提示

**验证标准**:
- 断开网络时显示离线提示
- 恢复网络时提示消失
- 离线时点击"双人联机"显示正确提示
- 单机模式离线时仍可正常游玩

---

### 任务6: 实现缓存更新机制
**描述**: 实现 Service Worker 更新检测和激活机制
**优先级**: 中
**预计时间**: 1.5小时
**依赖**: 任务3

- [ ] SubTask 6.1: 实现版本控制
  - 使用 CACHE_VERSION 管理缓存版本
  - 每次更新时递增版本号

- [ ] SubTask 6.2: 实现旧缓存清理
  - 在 activate 事件中清理旧版本缓存
  - 只保留当前版本的缓存

- [ ] SubTask 6.3: 实现更新检测
  - 监听 Service Worker 更新事件
  - 检测到新版本时显示更新提示

- [ ] SubTask 6.4: 创建更新提示 UI
  - 设计"有新版本可用"提示条
  - 提供"立即更新"按钮
  - 点击后跳过等待，激活新 Service Worker

- [ ] SubTask 6.5: 实现 skipWaiting 逻辑
  - 在 Service Worker 中调用 self.skipWaiting()
  - 确保新版本立即生效

**验证标准**:
- 修改 Service Worker 后检测到更新
- 显示更新提示 UI
- 点击更新后应用使用新版本
- 旧缓存被正确清理

---

### 任务7: 文档清理和整理
**描述**: 清理项目中的冗余文档和临时文件
**优先级**: 低
**预计时间**: 1小时
**依赖**: 无（可与其他任务并行）

- [ ] SubTask 7.1: 分析现有文档
  - 审查 design_doc.md 内容
  - 审查 AGENTS.md 内容
  - 审查 server/DEPLOY_GUIDE.md 内容

- [ ] SubTask 7.2: 更新 AGENTS.md
  - 添加 PWA 相关信息
  - 更新项目结构说明
  - 移除过时信息

- [ ] SubTask 7.3: 创建精简版设计文档
  - 将 design_doc.md 精简为核心内容
  - 保留架构图和关键设计决策
  - 移除未实现的详细设计

- [ ] SubTask 7.4: 整理 server 目录
  - 保留 server.js 和 package.json
  - 移动 DEPLOY_GUIDE.md 到 docs/ 目录或标记为归档

- [ ] SubTask 7.5: 创建项目根目录说明文件
  - 可选：创建 README.md（如果用户需要）
  - 包含项目简介、PWA安装说明、目录结构

**验证标准**:
- 文档内容准确反映当前项目状态
- 无重复或过时的文档
- 目录结构清晰

---

### 任务8: PWA 功能测试验证
**描述**: 全面测试 PWA 各项功能
**优先级**: 高
**预计时间**: 2小时
**依赖**: 任务1-6

- [ ] SubTask 8.1: Lighthouse 审计
  - 运行 Chrome DevTools Lighthouse
  - 检查 PWA 分类得分 >= 90
  - 修复所有失败项

- [ ] SubTask 8.2: 安装测试
  - Android Chrome: 验证安装提示和安装流程
  - iOS Safari: 验证手动添加到主屏幕
  - Desktop Chrome: 验证地址栏安装按钮

- [ ] SubTask 8.3: 离线功能测试
  - 验证离线状态下可启动应用
  - 验证单机模式可正常游玩
  - 验证联机模式正确提示需要网络

- [ ] SubTask 8.4: 缓存测试
  - 验证资源从 Service Worker 缓存返回
  - 验证缓存更新机制正常工作
  - 验证旧缓存被清理

- [ ] SubTask 8.5: 跨浏览器测试
  - Chrome (Android/Desktop)
  - Safari (iOS)
  - Edge (Desktop)

**验证标准**:
- Lighthouse PWA 得分 >= 90
- 所有主要浏览器安装流程正常
- 离线功能按预期工作
- 所有测试用例通过

---

## 执行顺序建议

### 阶段1: 基础 PWA 功能（任务1-3）
1. 任务1: Manifest 和图标
2. 任务2: Service Worker 基础
3. 任务3: 离线缓存策略

### 阶段2: 用户体验优化（任务4-6）
4. 任务4: 安装提示（可与阶段1并行）
5. 任务5: 离线状态检测（可与阶段1并行）
6. 任务6: 缓存更新机制

### 阶段3: 收尾工作（任务7-8）
7. 任务7: 文档清理（可与前面任务并行）
8. 任务8: 测试验证

---

## 风险与注意事项

1. **Service Worker 作用域**: 确保 Service Worker 注册在正确的作用域
2. **HTTPS 要求**: PWA 功能需要 HTTPS（localhost 开发环境除外）
3. **缓存策略**: 避免过度缓存导致更新不及时
4. **存储限制**: 注意浏览器缓存存储配额限制
5. **兼容性**: iOS Safari 对 PWA 支持有限，需要特殊处理
