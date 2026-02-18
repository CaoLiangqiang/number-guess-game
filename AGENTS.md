# 数字对决 Pro - 项目指南

> 本文档面向 AI 编程助手，用于快速了解本项目架构和开发规范。

## 项目概述

**数字对决 Pro** 是一款基于 H5 的数字推理单机游戏，专注于人机对战体验。

- **产品名称**: 数字对决 Pro
- **目标平台**: 微信内置浏览器、移动端浏览器（iOS Safari、Android Chrome）
- **核心玩法**: 玩家选一个4位数字（0-9可重复），与AI轮流猜测对方数字，根据"位置和数字都对"的个数反馈进行推理
- **AI特色**: 使用 Minimax + 信息熵算法，可视化展示 AI 思考过程

## 技术栈

| 模块 | 技术方案 | 说明 |
|------|----------|------|
| 前端框架 | Vanilla JS (ES6+) | 单文件应用，无构建步骤 |
| 样式方案 | Tailwind CSS (BootCDN) | 国内CDN加速 |
| 字体 | Google Fonts (Loli镜像) | 国内CDN镜像 |

## 项目结构

```
number-guess/
├── index.html          # 主游戏文件（完整单机版）
├── design_doc.md       # 国内部署方案文档
└── AGENTS.md           # 本文件
```

**重要**: 纯前端单机版，无需后端服务器。

## 国内CDN优化

本版本已针对国内网络环境进行优化：

| 资源 | CDN地址 |
|------|---------|
| Tailwind CSS | https://cdn.bootcdn.net/ajax/libs/tailwindcss/3.4.1/tailwind.min.js |
| Google Fonts | https://fonts.loli.net (国内镜像) |

## 部署方案

### 个人项目（推荐）

**Gitee Pages** - 免费、稳定、国内访问快

```bash
# 1. 注册Gitee账号 → 创建仓库 → 上传index.html
# 2. 仓库页面 → 服务 → Gitee Pages → 启动
# 3. 获得链接: https://你的用户名.gitee.io/number-guess/
```

### 企业项目

| 云服务商 | 适用场景 | 月费用 |
|----------|----------|--------|
| 阿里云 OSS+CDN | 企业项目、生态完善 | ￥20-30 |
| 腾讯云 COS+CDN | 微信生态项目 | ￥20-30 |
| 华为云 OBS+CDN | 政企项目、合规要求 | ￥20-30 |

### 域名备案

- 使用国内服务器/自定义域名需ICP备案
- 备案周期：5-20天
- 使用Gitee Pages默认域名无需备案

## 微信分享优化

HTML `<head>` 已添加 Open Graph 标签：

```html
<meta property="og:title" content="数字对决 Pro - 来挑战我的推理极限！">
<meta property="og:description" content="我已经想好了4位数字，你敢来猜吗？">
```

## 游戏模式

### 人机对战 (PVC)
- AI 使用 Minimax 算法 + 信息熵计算
- AI 思考过程在终端面板可视化展示
- AI 首步固定使用 "0011"（最优开局策略）
- **适用场景**: 离线、微信、所有浏览器，即开即玩

## 关键算法

### Minimax 选择策略

```javascript
selectMinimaxGuess() {
    // 从候选数字中，选择"最坏情况下剩余可能性最少"的数字
    // 计算每个候选的反馈分布，选择最大分组最小的
}
```

### 信息熵计算

```javascript
calculateEntropy(distribution) {
    // H = -Σ(p * log2(p))
    // 用于评估猜测的信息增益
}
```

### 匹配度计算

```javascript
calculateMatch(guess, target) {
    // 计算 guess 和 target 中"位置且数字都对"的个数
    // 例如: calculateMatch('1234', '1255') => 2
}
```

## 开发规范

### 代码风格
- 使用 ES6+ 语法（class、箭头函数、const/let）
- 方法命名使用 camelCase
- DOM 元素 ID 使用 kebab-case
- 类名使用 PascalCase

### 颜色主题

| 用途 | 颜色值 |
|------|--------|
| 主色调 | indigo-500 / indigo-600 |
| AI/对手色 | pink-500 / rose-600 |
| 成功色 | emerald-500 / teal-600 |
| 警告色 | yellow-500 / orange-600 |
| 背景色 | slate-900 (深色主题) |

### 终端输出样式

```javascript
// AI 终端日志类型
'header'    // 黄色粗体 - 轮次标题
'process'   // 蓝色 - 处理过程
'success'   // 绿色 - 成功信息
'decision'  // 紫色粗体 - 决策结果
'win'       // 粉色粗体大号 - 胜利
'player'    // 靛蓝色 - 玩家操作
'info'      // 灰色 - 普通信息
```

## 测试说明

手动测试矩阵：

| 测试项 | 微信安卓 | 微信iOS | Safari | Chrome |
|--------|----------|---------|--------|--------|
| 人机模式 | ✅ | ✅ | ✅ | ✅ |
| 输入验证 | ✅ | ✅ | ✅ | ✅ |
| AI响应 | ✅ | ✅ | ✅ | ✅ |

### 关键测试用例

1. **TC001**: 输入边界测试 - 非数字字符过滤、超长输入截断
2. **TC002**: AI 响应性能 - 10000 可能性时计算耗时 < 500ms
3. **TC003**: 游戏胜负判定

## 网络安全与合规

### 安全配置
- Content-Security-Policy 响应头
- HTTPS 强制跳转
- 防盗链配置

### 数据合规
- 纯前端应用，无用户数据存储
- 天然符合《网络安全法》和《数据安全法》
- 数据本地化存储（localStorage/IndexedDB）

## 版本历史

- **v1.2.0** (2026-02-18): 国内CDN优化，添加完整国内部署方案
- **v1.1.0** (2026-02-18): 微信H5适配版，添加 Socket.io 支持
- **v1.0.0** (2026-02-18): 初始版本，支持微信H5、人机对战、PVP联机
