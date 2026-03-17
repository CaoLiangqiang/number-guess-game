# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.1] - 2026-03-18

### Added
- 🔄 CI/CD 配置 - GitHub Actions 自动化测试流程
- ⏱️ 断线超时处理 - 实现断线提示和判定获胜选项 (NPG-01)
- 📡 弱网消息合并 - 优化弱网环境下的消息处理 (NPG-02)

### Changed
- Service Worker 缓存配置优化
- 外部 CDN 依赖风险评估文档更新

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