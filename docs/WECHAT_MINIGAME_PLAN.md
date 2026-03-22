# 数字对决 Pro - 微信小游戏现状与开发计划

**更新时间**: 2026-03-22  
**基线版本**: `main@11c0c8c`  
**当前结论**: `main` 分支已经把 `miniprogram/` 改造成微信小游戏工程，并且可以继续作为后续开发主线。

## 当前状态

- 小游戏入口已经落在 [miniprogram/game.js](/C:/Users/Admin/.codex/worktrees/6c4a-main-sync/miniprogram/game.js) 和 [miniprogram/game.json](/C:/Users/Admin/.codex/worktrees/6c4a-main-sync/miniprogram/game.json)。
- 仓库根目录的 [project.config.json](/C:/Users/Admin/.codex/worktrees/6c4a-main-sync/project.config.json) 已将 `gameRoot` 和 `miniprogramRoot` 指向 `miniprogram/`，所以可以直接导入仓库根目录调试。
- `miniprogram/` 目录下也保留了单独的 [miniprogram/project.config.json](/C:/Users/Admin/.codex/worktrees/6c4a-main-sync/miniprogram/project.config.json)，因此单独导入该目录也可以。
- 当前小游戏已具备基础 Canvas 引擎、场景管理、单机 AI 对战、历史记录、设置页和新手引导。

## 已落地能力

### 小游戏运行时

- [miniprogram/js/engine/renderer.js](/C:/Users/Admin/.codex/worktrees/6c4a-main-sync/miniprogram/js/engine/renderer.js)
  - Canvas 2D 渲染
  - 主题色、按钮、数字格、历史项绘制
- [miniprogram/js/engine/scene.js](/C:/Users/Admin/.codex/worktrees/6c4a-main-sync/miniprogram/js/engine/scene.js)
  - 场景注册、切换、输入分发
- [miniprogram/js/engine/input.js](/C:/Users/Admin/.codex/worktrees/6c4a-main-sync/miniprogram/js/engine/input.js)
  - 点击与长按输入事件
- [miniprogram/js/engine/storage.js](/C:/Users/Admin/.codex/worktrees/6c4a-main-sync/miniprogram/js/engine/storage.js)
  - 本地设置、战绩、历史缓存

### 单机玩法

- [miniprogram/js/core/game.js](/C:/Users/Admin/.codex/worktrees/6c4a-main-sync/miniprogram/js/core/game.js)
  - 出题、输入校验、反馈计算、时间格式化
- [miniprogram/js/core/ai.js](/C:/Users/Admin/.codex/worktrees/6c4a-main-sync/miniprogram/js/core/ai.js)
  - AI 候选集、筛选、猜测策略
- [miniprogram/js/scenes/game.js](/C:/Users/Admin/.codex/worktrees/6c4a-main-sync/miniprogram/js/scenes/game.js)
  - AI 对战主流程
  - 历史记录展示
  - 结果页跳转

### 已有场景

- [miniprogram/js/scenes/menu.js](/C:/Users/Admin/.codex/worktrees/6c4a-main-sync/miniprogram/js/scenes/menu.js)
- [miniprogram/js/scenes/game.js](/C:/Users/Admin/.codex/worktrees/6c4a-main-sync/miniprogram/js/scenes/game.js)
- [miniprogram/js/scenes/result.js](/C:/Users/Admin/.codex/worktrees/6c4a-main-sync/miniprogram/js/scenes/result.js)
- [miniprogram/js/scenes/settings.js](/C:/Users/Admin/.codex/worktrees/6c4a-main-sync/miniprogram/js/scenes/settings.js)
- [miniprogram/js/scenes/history.js](/C:/Users/Admin/.codex/worktrees/6c4a-main-sync/miniprogram/js/scenes/history.js)
- [miniprogram/js/scenes/guide.js](/C:/Users/Admin/.codex/worktrees/6c4a-main-sync/miniprogram/js/scenes/guide.js)

## 当前主要缺口

### 玩法定义还不统一

- README 仍把玩法写成“数字可重复”，见 [README.md](/C:/Users/Admin/.codex/worktrees/6c4a-main-sync/README.md)。
- 小游戏引导和 AI 对战实现却按“数字不重复、首位不为 0”处理，见 [miniprogram/js/scenes/guide.js](/C:/Users/Admin/.codex/worktrees/6c4a-main-sync/miniprogram/js/scenes/guide.js) 和 [miniprogram/js/scenes/game.js](/C:/Users/Admin/.codex/worktrees/6c4a-main-sync/miniprogram/js/scenes/game.js)。
- 这意味着产品规则、前端文案、AI 候选集当前仍存在定义冲突。

### 联网与服务端仍是占位

- [miniprogram/game.js](/C:/Users/Admin/.codex/worktrees/6c4a-main-sync/miniprogram/game.js) 中的 `wsServer` 和 `apiServer` 还是 `your-server.com` 占位。
- 目前小游戏场景里没有大厅、房间、匹配、重连、排行榜、个人中心等正式联机链路。
- 菜单里的“每日挑战”按钮当前只是切到同一个游戏场景，并没有独立服务端能力。

### 资源和平台能力未补齐

- `assets/images` 和 `assets/sounds` 目前基本还是占位目录。
- 分享图路径已经预留，但实际素材和分享落地链路还没有补齐。
- 登录态、用户信息、微信分享回流、审核素材都还没有完整接入。

### 自动化验证仍偏少

- 现有 Jest 主要覆盖 H5 逻辑。
- 小游戏运行时、存储和入口初始化此前没有对应的自动化测试。

## 推荐开发顺序

### 阶段 1: 稳定单机基线

- 统一玩法定义
- 明确是否允许重复数字
- 统一 README、引导文案、规则模块、AI 模块
- 补齐小游戏核心测试
- 补齐基础资源和分享素材

### 阶段 2: 完成小游戏首发闭环

- 完善菜单、结果页、设置页的交互细节
- 增加音效预加载与异常兜底
- 补齐历史记录展示边界情况
- 完成真机适配和性能检查

### 阶段 3: 接入微信能力

- `wx.login`
- 服务端 `code2Session`
- 用户标识绑定
- 分享、邀请、回流入口

### 阶段 4: 联机与社交

- 好友房间
- 快速匹配
- 断线重连
- 排行榜
- 每日挑战正式服务化

## 当前建议

- 继续以 `main@11c0c8c` 的 `miniprogram/` 作为小游戏主线。
- 不再把根目录实验骨架继续并入主线，避免出现两套小游戏入口并存。
- 下一轮优先做“玩法定义统一 + 小游戏自动化测试 + 资源补齐”，再进入登录和联机迁移。

## 调试说明

### 方式一

- 微信开发者工具导入仓库根目录
- 使用 [project.config.json](/C:/Users/Admin/.codex/worktrees/6c4a-main-sync/project.config.json)

### 方式二

- 微信开发者工具直接导入 [miniprogram](/C:/Users/Admin/.codex/worktrees/6c4a-main-sync/miniprogram)
- 使用 [miniprogram/project.config.json](/C:/Users/Admin/.codex/worktrees/6c4a-main-sync/miniprogram/project.config.json)
