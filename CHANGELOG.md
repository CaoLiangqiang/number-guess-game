# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.4.0] - 2026-03-28

### Changed
- 游戏规则与网页版对齐
  - 允许数字重复（如 1122, 0000）
  - 允许首位数字为 0
  - 反馈格式改为"正确位置数"（如 📍 2/4 表示 4 位中有 2 位正确）
- UI 安全区域布局优化，所有元素在手机安全区域内居中显示
- 结果页显示新最佳记录的达成日期

### Fixed
- 修复小游戏 AI 算法适配新规则（允许重复数字）
- 修复键盘数字禁用逻辑（移除重复检测）

## [2.3.0] - 2026-03-23

### Added
- 微信小游戏版本正式发布
  - Canvas 2D 原生渲染引擎
  - 场景管理系统（菜单、游戏、结果、设置、历史、引导）
  - 完整的单机 AI 对战功能
  - 历史记录滚动支持
  - 按钮按下视觉反馈
  - 96 项 UI 优化迭代（动画、图标、统计等）

### Fixed
- 修复 AI 开局猜测首位为 0 的规则违反问题
  - 将开局猜测从 `0123` 改为 `1023`
- 修复 GameScene.sceneManager 未初始化的安全问题
- 修复输入管理器长按事件重复绑定 bug
- 修复历史记录场景缺少 module.exports 导出

### Changed
- 更新 README.md 为双平台产品形态说明
- 清理冗余文档：
  - 删除 `docs/DEVELOPMENT_PLAN.md`（已过时）
  - 删除 `docs/MULTIPLAYER_REDESIGN.md`（已完成）
  - 删除 `docs/WECHAT_MINIGAME_PLAN.md`（已合并）
  - 删除 `AGENTS.md`（与 CLAUDE.md 合并）

## [2.2.3] - 2026-03-22

### Fixed
- 修复联机模式下猜测历史重复显示的问题
  - 原因：玩家猜测时先添加 '?' 结果，服务器返回后又添加实际反馈
  - 解决：服务器返回结果时更新已存在的历史记录而非新增

## [2.2.2] - 2026-03-22

### Fixed
- 修复不同难度（3/4/5位）下终端输出显示硬编码"/4"的问题
- 添加 Safari/iOS WebSocket 连接超时检测和友好错误提示
- 解决 Safari 因自签名 SSL 证书静默拒绝连接的问题

### Docs
- 清理冗余文档，合并重复内容
- 删除临时测试结果目录和开发过程文件
- 更新 README.md 为最终产品形态说明

## [2.2.1] - 2026-03-22

### Added
- 🔄 CI/CD 配置 - GitHub Actions 自动化测试流程
- ⏱️ 断线超时处理 - 实现断线提示和判定获胜选项 (NPG-01)
- 📡 弱网消息合并 - 优化弱网环境下的消息处理 (NPG-02)
- 🌐 腾讯云服务器部署支持 - 自定义环境检测

### Changed
- Service Worker 缓存配置优化
- 外部 CDN 依赖风险评估文档更新
- 房间号改为纯数字格式 (6位)
- 版本显示优化 - 显示客户端版本和服务器版本

### Fixed
- 修复 WebSocket 消息处理变量冲突
- 修复房间创建按钮无响应问题
- 修复服务器版本显示不更新问题

### Docs
- 删除过时的 TODO.md 和 ISSUE_TRACKER.md
- 更新架构文档和 API 文档

## [2.2.0] - 2026-03-16

### Changed
- UI 设计重构：引入 Lucide Icons 图标系统，替换内联 SVG
- CSS 模块化：提取样式到独立 css/styles.css 文件，建立 CSS 变量主题系统
- AI 思考面板优化：终端输出改为可折叠设计，新增搜索进度条可视化
- 按钮系统标准化：统一 primary/secondary/success/warning/danger 五种样式
- 数字输入组件增强：支持 focus/filled/error/success 状态样式
- 新增页面过渡动画和微交互动画效果

### Removed
- 删除过时的设计文档 design_doc.md（内容已合并至 README.md）
- 清理开发过程文件 (.trae/, DEVELOPMENT_PLAN.md 等)

## [2.1.0] - 2026-03-13

### Added
- 联机对战功能 - WebSocket 服务器支持多人实时对战
- PWA 支持完善 - 可安装、离线游玩
- 离线回退页面支持
- AI 对手 (Minimax + 信息熵算法)
- 版本管理功能
- 移动端响应式设计优化
- 游戏重连机制

### Fixed
- 修复内存泄漏和改进重连逻辑
- 修复 DEBUG 逻辑错误 - 仅在 localhost 启用调试
- 优化重连对话框文案
- 修复 Jest 和 Playwright 测试配置冲突
- 修复 PWA 安装提示问题

### Security
- 移除不必要的调试日志
- 升级 jest-environment-jsdom 修复安全漏洞

## [2.0.0] - 2026-03-01

### Added
- 全新 UI 设计
- 单机人机对战模式
- 游戏设置界面
- 音效和动画效果
- 重构项目结构
- 添加完整的测试覆盖
- 实现 PWA 基础功能

## [1.0.0] - 2025-12-01

### Added
- 基础数字猜谜游戏
- 单机人机对战
- 双人本地对战

---

[2.1.0]: https://github.com/CaoLiangqiang/number-guess-game/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/CaoLiangqiang/number-guess-game/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/CaoLiangqiang/number-guess-game/releases/tag/v1.0.0