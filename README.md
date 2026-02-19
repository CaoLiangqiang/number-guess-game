# 数字对决 Pro

[![PWA](https://img.shields.io/badge/PWA-Ready-blue)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> 一款基于 H5 的数字推理对战游戏，支持单机人机对战和双人实时联机对战。

## 🎮 游戏简介

**数字对决 Pro** 是一款考验逻辑推理能力的数字猜谜游戏：

- 玩家选择一个 4 位数字（0-9 可重复）
- 与对手轮流猜测对方的数字
- 根据"位置和数字都对"的个数反馈进行推理
- 先猜中对方数字者获胜！

### 游戏特色

| 特色 | 说明 |
|------|------|
| 🤖 AI 对战 | 使用 Minimax + 信息熵算法，可视化展示 AI 思考过程 |
| 👥 联机对战 | 支持好友房间、实时对战、断线重连、弱网适配 |
| 📱 PWA 支持 | 可安装到主屏幕，离线也能玩单机模式 |
| 🎨 精美 UI | 深色主题设计，流畅动画效果 |

## 🚀 快速开始

### 在线体验

访问以下链接即可开始游戏：

```
https://你的用户名.gitee.io/number-guess/
```

### 本地运行

```bash
# 克隆仓库
git clone https://github.com/yourusername/number-guess.git
cd number-guess

# 启动本地服务器
python -m http.server 8080

# 浏览器访问
open http://localhost:8080
```

## 📱 PWA 安装指南

### Android (Chrome)

1. 使用 Chrome 浏览器访问游戏链接
2. 底部会自动弹出"安装数字对决 Pro"提示
3. 点击"安装"按钮
4. 应用将添加到主屏幕

### iOS (Safari)

1. 使用 Safari 浏览器访问游戏链接
2. 点击底部分享按钮
3. 选择"添加到主屏幕"
4. 点击"添加"

### 桌面端 (Chrome/Edge)

1. 访问游戏链接
2. 地址栏右侧会出现安装图标
3. 点击"安装数字对决 Pro"

## 🎯 游戏模式

### 人机对战 (PVC)

- 与 AI 进行对战
- AI 使用 Minimax 算法 + 信息熵计算
- 支持查看 AI 思考过程
- **无需网络**，随时随地可玩

### 双人联机 (PVP)

- 创建房间，生成 6 位房间号
- 好友输入房间号加入对战
- 实时同步游戏状态
- 支持断线重连

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| Vanilla JS (ES6+) | 前端框架 |
| Tailwind CSS | 样式方案 |
| WebSocket | 实时通信 |
| Service Worker | 离线缓存 |
| Web App Manifest | PWA 配置 |

## 📁 项目结构

```
number-guess/
├── index.html              # 主游戏文件
├── manifest.json           # PWA 配置文件
├── service-worker.js       # Service Worker
├── offline.html            # 离线页面
├── icons/                  # 应用图标
├── server/                 # 联机服务器
│   ├── server.js
│   └── package.json
├── docs/                   # 文档
│   └── DEPLOY_GUIDE.md
└── README.md               # 本文件
```

## 🌐 部署方案

### 个人项目（推荐）

**Gitee Pages** - 免费、稳定、国内访问快

1. 注册 Gitee 账号
2. 创建仓库并上传代码
3. 开启 Gitee Pages 服务
4. 获得访问链接

### 企业项目

| 平台 | 适用场景 | 费用 |
|------|----------|------|
| 阿里云 OSS+CDN | 企业级项目 | ¥20-30/月 |
| 腾讯云 COS+CDN | 微信生态项目 | ¥20-30/月 |
| 华为云 OBS+CDN | 政企项目 | ¥20-30/月 |

## 🧪 测试

### 手动测试

| 测试项 | 微信 | Safari | Chrome |
|--------|------|--------|--------|
| 人机模式 | ✅ | ✅ | ✅ |
| 联机模式 | ✅ | ✅ | ✅ |
| PWA 安装 | N/A | ✅ | ✅ |
| 离线功能 | N/A | ✅ | ✅ |

### Lighthouse 审计

```bash
# 在 Chrome DevTools 中运行
# 1. 打开游戏页面
# 2. 按 F12 打开 DevTools
# 3. 切换到 Lighthouse 标签
# 4. 选择"PWA"类别
# 5. 点击"Analyze page load"
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可

[MIT](LICENSE) © 数字对决 Pro

---

<p align="center">
  用 ❤️ 和 🧠 制作
</p>
