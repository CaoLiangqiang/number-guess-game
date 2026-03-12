# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2025-03-13

### Added
- 联机对战功能 - WebSocket 服务器支持多人实时对战
- PWA 支持 - 可安装到主屏幕，支持离线游玩
- AI 对手使用 Minimax + 信息熵算法
- 移动端响应式设计优化
- 游戏重连机制

### Fixed
- 修复内存泄漏问题
- 优化 WebSocket 重连逻辑
- 修复 E2E 测试问题
- 修复 PWA 安装提示问题

### Security
- 升级 jest-environment-jsdom 修复安全漏洞

## [2.0.0] - 2025-02-XX

### Added
- 全新 UI 设计
- 单机人机对战模式
- 游戏设置界面
- 音效和动画效果

## [1.0.0] - 2025-01-XX

### Added
- 基础游戏逻辑
- 数字推理对战玩法
- 简单的 UI 界面

---

[2.1.0]: https://github.com/CaoLiangqiang/number-guess-game/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/CaoLiangqiang/number-guess-game/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/CaoLiangqiang/number-guess-game/releases/tag/v1.0.0