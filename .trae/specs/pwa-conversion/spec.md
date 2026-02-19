# 数字对决 Pro - PWA 改造规格文档

## Why

当前"数字对决 Pro"应用是一个纯前端H5游戏，虽然已具备基础的PWA元标签配置（如theme-color、apple-mobile-web-app-capable等），但尚未实现完整的PWA功能。通过PWA改造，用户可以将游戏安装到主屏幕，实现离线游玩（单机模式），获得更接近原生应用的体验，同时提升用户留存率和访问便捷性。

## 当前架构与PWA技术差距分析

### 1. 已具备的基础

| 项目 | 当前状态 | 说明 |
|------|----------|------|
| theme-color | ✅ 已配置 | `<meta name="theme-color" content="#0f172a">` |
| viewport | ✅ 已配置 | 支持移动端适配 |
| apple-mobile-web-app-capable | ✅ 已配置 | iOS添加到主屏幕支持 |
| manifest | ⚠️ 内联Base64 | 当前使用data URI，需要改为独立文件 |

### 2. 缺失的PWA核心功能

| 功能 | 缺失状态 | 重要性 |
|------|----------|--------|
| Web App Manifest | ❌ 需要独立manifest.json文件 | 高 |
| Service Worker | ❌ 未实现 | 高 |
| 离线缓存策略 | ❌ 未实现 | 高 |
| 安装提示 | ❌ 未实现 | 中 |
| 后台同步 | ❌ 未实现 | 低 |
| 推送通知 | ❌ 未实现 | 低 |

### 3. 技术挑战

- **联机模式依赖网络**: 联机对战模式需要WebSocket连接，无法完全离线运行
- **CDN资源依赖**: Tailwind CSS和字体依赖外部CDN，离线时需要本地回退
- **单文件架构**: 当前所有代码在index.html中，需要合理规划缓存策略

## What Changes

### ADDED
- **ADDED**: 独立的 `manifest.json` 文件，包含完整的PWA配置
- **ADDED**: `service-worker.js` 文件，实现离线缓存和更新管理
- **ADDED**: PWA安装提示组件，引导用户添加到主屏幕
- **ADDED**: 离线状态检测和提示UI
- **ADDED**: 应用图标集（多种尺寸：48x48, 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512）
- **ADDED**: 离线回退页面（当首次加载未完成时显示）

### MODIFIED
- **MODIFIED**: `index.html` 中的manifest引用，从Base64改为独立文件
- **MODIFIED**: 游戏逻辑适配离线状态（联机模式提示需要网络）
- **MODIFIED**: 网络请求添加离线缓存支持

### REMOVED
- **REMOVED**: 内联的Base64 manifest（替换为独立文件）

## Impact

- **Affected specs**: 应用安装、离线功能、网络状态处理
- **Affected code**: 
  - `index.html` - manifest引用和Service Worker注册
  - 新增 `manifest.json` - PWA配置
  - 新增 `service-worker.js` - 离线缓存逻辑
  - 新增 `icons/` 目录 - 应用图标
  - 新增 `offline.html` - 离线回退页面

## ADDED Requirements

### Requirement: Web App Manifest
The system SHALL provide a valid Web App Manifest file.

#### Scenario: Manifest文件配置
- **GIVEN** PWA应用需要被识别和安装
- **WHEN** 浏览器请求manifest.json
- **THEN** 返回包含以下内容的有效JSON：
  - name: "数字对决 Pro"
  - short_name: "数字对决"
  - start_url: "."
  - display: "standalone"
  - background_color: "#0f172a"
  - theme_color: "#0f172a"
  - icons: 包含所有必要尺寸的图标数组
  - description: "AI推理挑战数字游戏"
  - categories: ["games", "puzzle"]

### Requirement: Service Worker注册
The system SHALL register a Service Worker for offline support.

#### Scenario: Service Worker注册
- **GIVEN** 用户访问应用
- **WHEN** 页面加载完成
- **THEN** 注册service-worker.js
- **AND** 注册成功后在控制台输出日志
- **AND** 注册失败时不影响应用正常运行

### Requirement: 离线缓存策略
The system SHALL implement a caching strategy for offline functionality.

#### Scenario: 核心资源缓存
- **GIVEN** Service Worker已安装
- **WHEN** 首次访问应用
- **THEN** 缓存以下核心资源：
  - /index.html
  - /manifest.json
  - /icons/* (所有图标)
  - 外部CDN资源的本地回退（如Tailwind CSS）

#### Scenario: 缓存优先策略
- **GIVEN** 用户已访问过应用
- **WHEN** 再次访问（离线或在线）
- **THEN** 优先从缓存返回核心资源
- **AND** 后台检查更新并更新缓存

#### Scenario: 网络资源回退
- **GIVEN** 用户处于离线状态
- **WHEN** 请求外部CDN资源（如字体）
- **THEN** 返回本地缓存或系统默认字体
- **AND** 应用保持可用

### Requirement: 安装提示
The system SHALL prompt users to install the PWA.

#### Scenario: 显示安装提示
- **GIVEN** 浏览器支持PWA安装
- **WHEN** 满足安装条件（beforeinstallprompt事件触发）
- **THEN** 显示自定义安装提示UI
- **AND** 提供"立即安装"和"稍后"选项

#### Scenario: iOS安装引导
- **GIVEN** 用户使用的是iOS Safari
- **WHEN** 用户首次访问应用
- **THEN** 显示iOS特定的安装引导（添加到主屏幕说明）

### Requirement: 离线状态检测
The system SHALL detect and display network status.

#### Scenario: 网络状态变化
- **GIVEN** 应用正在运行
- **WHEN** 网络状态发生变化（在线/离线）
- **THEN** 显示状态提示条
- **AND** 离线时提示"单机模式可用，联机模式需要网络"

#### Scenario: 联机模式离线阻止
- **GIVEN** 用户处于离线状态
- **WHEN** 用户点击"双人联机"按钮
- **THEN** 显示提示"联机模式需要网络连接"
- **AND** 引导用户检查网络或游玩单机模式

### Requirement: 缓存更新机制
The system SHALL handle Service Worker updates gracefully.

#### Scenario: 新版本检测
- **GIVEN** 应用有新版本发布
- **WHEN** 用户访问应用
- **THEN** 后台下载新版本
- **AND** 显示"有新版本，点击更新"提示
- **AND** 用户确认后激活新版本

## MODIFIED Requirements

### Requirement: Manifest引用方式
**Current**: 使用Base64编码的内联manifest
```html
<link rel="manifest" href="data:application/json;base64,...">
```

**Modified**: 使用独立manifest文件
```html
<link rel="manifest" href="/manifest.json">
```

### Requirement: 联机模式网络检查
**Current**: 直接尝试连接WebSocket，失败后才提示

**Modified**: 先检查网络状态，离线时立即提示
- **GIVEN** 用户点击"双人联机"
- **WHEN** 检测到navigator.onLine为false
- **THEN** 立即显示离线提示，不发起WebSocket连接

## REMOVED Requirements

### Requirement: 内联Base64 Manifest
**Reason**: PWA要求manifest必须是独立可访问的JSON文件，Base64编码的内联manifest无法被浏览器正确识别和处理。
**Migration**: 创建独立的manifest.json文件，更新index.html中的引用。

## PWA测试验证流程

### 1. Lighthouse审计
- 运行Chrome DevTools Lighthouse
- 检查PWA分类得分是否达到90+
- 验证所有PWA检查项通过

### 2. 安装测试
- **Android Chrome**: 验证出现"添加到主屏幕"提示
- **iOS Safari**: 验证可以手动添加到主屏幕
- **Desktop Chrome**: 验证地址栏出现安装图标

### 3. 离线功能测试
- 断开网络连接
- 验证应用可以从主屏幕启动
- 验证单机模式可以正常游玩
- 验证联机模式正确提示需要网络

### 4. 缓存更新测试
- 修改代码并重新部署
- 验证旧版本仍能运行（从缓存）
- 验证更新提示出现
- 验证更新后使用新版本

## 开发里程碑与时间节点

| 阶段 | 任务 | 预计时间 | 依赖 |
|------|------|----------|------|
| 1 | 创建manifest.json和应用图标 | 1小时 | 无 |
| 2 | 实现Service Worker基础框架 | 2小时 | 阶段1 |
| 3 | 实现离线缓存策略 | 2小时 | 阶段2 |
| 4 | 实现安装提示组件 | 1.5小时 | 阶段1 |
| 5 | 实现离线状态检测 | 1小时 | 无 |
| 6 | 实现缓存更新机制 | 1.5小时 | 阶段3 |
| 7 | 文档清理和整理 | 1小时 | 无 |
| 8 | 测试验证 | 2小时 | 阶段1-6 |
| **总计** | | **12小时** | |

## 文档清理方案

### 需要移除的冗余文档

| 文件 | 原因 | 处理方式 |
|------|------|----------|
| `server/DEPLOY_GUIDE.md` | 与PWA改造无关，属于服务器部署文档 | 保留但移出主目录 |
| `design_doc.md` | 内容已过时，包含大量未实现的架构设计 | 更新为精简版 |
| `AGENTS.md` | 部分信息已过时 | 更新整合 |

### 需要保留的核心文档

| 文件 | 说明 |
|------|------|
| `index.html` | 主应用文件（需要修改） |
| `server/server.js` | 联机服务器代码 |
| `server/package.json` | 服务器依赖 |

### 文档整合计划

1. 将部署相关文档合并到单一文件
2. 更新README（如需要）包含PWA安装说明
3. 清理临时文件和过时说明
