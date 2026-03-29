# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.4.24] - 2026-03-29

### Added
- 微信小游戏设置页新增累计总用时和总猜测次数统计
- 微信小游戏历史页新增清空记录与二次确认流程
- 浏览器版微信小游戏预览壳，支持场景预设、视口切换和 PNG 导出

### Changed
- 微信小游戏 AI 思考区补充预计耗时提示，主菜单 AI 按钮增加呼吸灯效果
- 版本信息统一由 `package.json` 驱动，并同步到前端、服务端、小游戏入口与仓库文档
- 文档职责重新收敛，按产品说明、架构、小游戏交付、API 和部署拆分维护

### Fixed
- 微信小游戏渲染器补齐 `alpha` 支持，透明度相关文本和图形绘制与场景用法保持一致

### Removed
- 移除 `.claude/`、`docs/superpowers/` 和 WeChat DevTools 私有配置等过程文件/本地文件

## [2.4.0] - 2026-03-28

### Changed
- 游戏规则与网页版对齐
  - 允许数字重复（如 `1122`、`0000`）
  - 允许首位数字为 `0`
  - 反馈格式改为“正确位置数”（如 `📍 2/4` 表示 4 位中有 2 位位置正确）
- UI 安全区域布局优化，所有元素在手机安全区域内居中显示
- 结果页显示新最佳记录的达成日期

### Fixed
- 修复小游戏 AI 算法对新规则的适配问题
- 修复键盘数字禁用逻辑中的重复检测问题

## [2.3.0] - 2026-03-23

### Added
- 微信小游戏版本正式发布
  - Canvas 2D 原生渲染引擎
  - 场景管理系统（菜单、游戏、结果、设置、历史、引导）
  - 完整的单机 AI 对战功能
  - 历史记录滚动支持
  - 按钮按下视觉反馈

### Fixed
- 修复 AI 开局猜测规则问题
- 修复 `GameScene.sceneManager` 未初始化的安全问题
- 修复输入管理器长按事件重复绑定问题
- 修复历史记录场景缺少 `module.exports` 的问题

### Changed
- README 更新为双平台产品说明

## [2.2.3] - 2026-03-22

### Fixed
- 修复联机模式下猜测历史重复显示的问题

## [2.2.2] - 2026-03-22

### Fixed
- 修复不同难度下终端输出显示硬编码 `/4` 的问题
- 添加 Safari/iOS WebSocket 连接超时检测和友好错误提示
- 解决 Safari 因自签名 SSL 证书静默拒绝连接的问题

### Docs
- 清理冗余文档，合并重复内容

## [2.2.1] - 2026-03-22

### Added
- GitHub Actions 自动化测试流程
- 断线超时处理
- 弱网消息合并
- 腾讯云服务器部署支持

### Changed
- Service Worker 缓存配置优化
- 房间号改为纯数字格式（6 位）
- 版本显示优化

### Fixed
- 修复 WebSocket 消息处理变量冲突
- 修复房间创建按钮无响应问题
- 修复服务器版本显示不更新问题

## [2.2.0] - 2026-03-16

### Changed
- UI 设计重构，引入 Lucide Icons 图标系统
- CSS 模块化，提取样式到 `css/styles.css`
- AI 思考面板优化，新增进度条可视化
- 按钮系统标准化
- 数字输入组件增强
- 新增页面过渡动画和微交互动画

### Removed
- 删除过时设计文档和开发过程文件

## [2.1.0] - 2026-03-13

### Added
- 联机对战功能
- PWA 支持
- AI 对手
- 版本管理功能
- 移动端适配和重连机制

### Fixed
- 修复内存泄漏与重连逻辑问题
- 修复 Jest 和 Playwright 测试配置冲突

### Security
- 移除不必要的调试日志

## [2.0.0] - 2026-03-01

### Added
- 全新 UI 设计
- 单机 AI 对战模式
- 游戏设置界面
- 音效和动画效果
- PWA 基础能力

## [1.0.0] - 2025-12-01

### Added
- 基础数字猜谜游戏
- 单机人机对战
- 双人本地对战

---

[2.4.24]: https://github.com/CaoLiangqiang/number-guess-game/compare/v2.4.0...v2.4.24
[2.4.0]: https://github.com/CaoLiangqiang/number-guess-game/compare/v2.3.0...v2.4.0
[2.3.0]: https://github.com/CaoLiangqiang/number-guess-game/compare/v2.2.3...v2.3.0
[2.2.3]: https://github.com/CaoLiangqiang/number-guess-game/compare/v2.2.2...v2.2.3
[2.2.2]: https://github.com/CaoLiangqiang/number-guess-game/compare/v2.2.1...v2.2.2
[2.2.1]: https://github.com/CaoLiangqiang/number-guess-game/compare/v2.2.0...v2.2.1
[2.2.0]: https://github.com/CaoLiangqiang/number-guess-game/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/CaoLiangqiang/number-guess-game/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/CaoLiangqiang/number-guess-game/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/CaoLiangqiang/number-guess-game/releases/tag/v1.0.0
