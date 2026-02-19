# 数字对决 Pro - 双人联机模式 Spec

## Why
当前项目仅支持单机人机对战模式，用户反馈希望增加与好友实时对战的功能。双人联机模式将大幅提升游戏的社交属性和可玩性，同时保持与现有单机模式一致的游戏规则和交互体验。

## What Changes
- **ADDED**: 双人联机模式入口和联机大厅界面
- **ADDED**: WebSocket客户端模块，支持实时通信
- **ADDED**: 好友房间系统（创建/加入房间）
- **ADDED**: 联机对战游戏界面（基于现有UI扩展）
- **ADDED**: 断线重连和弱网适配功能
- **MODIFIED**: 主菜单界面增加联机模式入口
- **MODIFIED**: 游戏核心逻辑支持单/双模式切换

## Impact
- Affected specs: 游戏模式选择、网络通信、状态同步
- Affected code: index.html, 新增网络模块、匹配模块

## ADDED Requirements

### Requirement: 联机模式入口
The system SHALL provide a multiplayer mode entry point in the main menu.

#### Scenario: 用户选择联机模式
- **GIVEN** 用户在主菜单界面
- **WHEN** 用户点击"双人联机"按钮
- **THEN** 系统显示联机大厅界面

### Requirement: 联机大厅
The system SHALL provide a lobby interface for room management.

#### Scenario: 创建房间
- **GIVEN** 用户在联机大厅
- **WHEN** 用户点击"创建房间"按钮
- **THEN** 系统生成6位房间号并进入等待房间界面
- **AND** 显示房间号、复制按钮、微信分享按钮

#### Scenario: 加入房间
- **GIVEN** 用户在联机大厅
- **WHEN** 用户输入6位房间号并点击"加入"
- **THEN** 系统验证房间号有效性
- **AND** 若房间存在且未满，用户进入该房间

### Requirement: WebSocket通信
The system SHALL establish WebSocket connection for real-time communication.

#### Scenario: 连接服务器
- **GIVEN** 用户进入联机模式
- **WHEN** 系统尝试连接WebSocket服务器
- **THEN** 连接成功后建立心跳机制（1秒间隔）
- **AND** 连接失败时显示错误提示并提供重试按钮

#### Scenario: 消息收发
- **GIVEN** WebSocket连接已建立
- **WHEN** 用户执行游戏操作（设置秘密数字、提交猜测）
- **THEN** 系统通过WebSocket发送消息到服务器
- **AND** 接收服务器广播的消息并更新UI

### Requirement: 游戏状态同步
The system SHALL synchronize game state between two players.

#### Scenario: 双方准备
- **GIVEN** 两名玩家在同一房间
- **WHEN** 双方都设置了秘密数字并点击准备
- **THEN** 游戏开始，随机决定先手玩家
- **AND** 双方同步显示游戏界面

#### Scenario: 回合切换
- **GIVEN** 游戏进行中
- **WHEN** 当前玩家提交猜测
- **THEN** 服务器计算反馈结果
- **AND** 广播给双方玩家更新UI
- **AND** 切换到对方回合

#### Scenario: 游戏结束
- **GIVEN** 一方玩家猜中对方数字
- **WHEN** 服务器验证猜测正确
- **THEN** 广播游戏结束消息
- **AND** 显示结算界面（双方秘密数字、步数统计）

### Requirement: 断线重连
The system SHALL handle network disconnection and reconnection.

#### Scenario: 短暂断线
- **GIVEN** 游戏进行中
- **WHEN** 玩家网络断开（<5秒）
- **THEN** 显示"网络不稳定，正在重连..."
- **AND** 自动尝试重连
- **AND** 重连成功后恢复游戏状态

#### Scenario: 长时间断线
- **GIVEN** 游戏进行中
- **WHEN** 玩家网络断开（>30秒）
- **THEN** 判定该玩家弃权
- **AND** 对方玩家获得胜利
- **AND** 显示结算界面

### Requirement: 弱网适配
The system SHALL adapt to poor network conditions.

#### Scenario: 网络质量检测
- **GIVEN** WebSocket连接已建立
- **WHEN** 系统检测网络延迟和丢包率
- **THEN** 根据网络质量调整心跳间隔
- **AND** 网络差时合并消息发送

## MODIFIED Requirements

### Requirement: 游戏核心逻辑
**Current**: 仅支持单机模式，AI作为对手
**Modified**: 支持单/双模式切换，对手可以是AI或真实玩家

#### Scenario: 模式切换
- **GIVEN** 游戏初始化
- **WHEN** 根据用户选择的模式
- **THEN** 单机模式：使用现有AI逻辑
- **AND** 联机模式：使用WebSocket通信，对手操作来自服务器

### Requirement: 主菜单界面
**Current**: 仅显示"挑战AI"按钮
**Modified**: 增加"双人联机"按钮入口

#### Scenario: 显示主菜单
- **GIVEN** 用户打开游戏
- **WHEN** 主菜单渲染完成
- **THEN** 显示两个主要按钮："挑战AI"和"双人联机"
- **AND** 保持现有UI风格和布局

## REMOVED Requirements
无移除功能
