

```markdown
# 数字对决 H5 - 技术设计文档

**版本**: v1.0.0  
**日期**: 2026-02-18  
**平台**: 微信H5 / 移动端浏览器 / PWA  
**架构**: Socket.io + Node.js + Vanilla JS  

---

## 目录

1. [产品设计文档（PRD）](#1-产品设计文档prd)
2. [软件实现方案](#2-软件实现方案)
3. [集成测试方案](#3-集成测试方案)
4. [部署与运维指南](#4-部署与运维指南)
5. [附录：核心代码结构](#5-附录核心代码结构)

---

## 1. 产品设计文档（PRD）

### 1.1 产品概述

| 项目 | 说明 |
|------|------|
| **产品名称** | 数字对决 H5 |
| **核心体验** | 微信内即开即玩，支持人机对战（离线）+ 在线对战（服务器中转） |
| **目标平台** | 微信内置浏览器、iOS Safari、Android Chrome |
| **用户画像** | 18-35岁，喜欢逻辑推理游戏，社交传播意愿强 |
| **核心卖点** | 无需下载、支持重复数字规则、AI可视化思考过程 |

### 1.2 功能架构

```text
├── 核心玩法层
│   ├── 人机对战（本地AI，无需网络）
│   └── 在线对战（Socket.io房间制，服务器中转）
├── 社交传播层
│   ├── 微信分享卡片（自定义标题/图片）
│   ├── 房间二维码生成
│   └── 邀请链接复制（自动携带房间ID参数）
└── 用户体验层
    ├── PWA离线支持（人机模式可离线玩）
    ├── 微信环境适配（虚拟键盘、返回键监听）
    ├── 断线重连机制
    └── AI思考过程可视化（终端风格UI）
```

1.3 用户流程

```mermaid
用户打开链接
    ↓
检测微信环境 → 显示"添加到桌面"提示
    ↓
主菜单
    ├── 人机对战 → 立即开始（本地计算）
    └── 创建房间 → 生成房间ID → 复制链接/二维码
        └── 好友打开链接 → 自动匹配 → 开始对战
```

1.4 技术约束与兼容策略

约束项	限制说明	解决方案	
微信X5内核	不支持WebRTC，限制部分JS API	使用Socket.io替代WebRTC，自动降级为HTTP轮询	
包大小限制	首屏加载<500KB	单HTML文件，Tailwind CDN按需加载，图片Base64编码	
存储限制	无本地文件系统权限	使用localStorage存储历史战绩和用户偏好	
分享限制	无法直接调起微信分享面板	使用JSSDK + 右上角菜单引导 + 复制链接兜底	
iOS键盘	聚焦输入框时页面缩放	设置font-size:16px禁止缩放，使用自定义数字键盘	

---

2. 软件实现方案

2.1 架构设计

```text
┌──────────────┐         WebSocket          ┌──────────────┐
│   客户端H5    │ ◄───────────────────────►  │  Node.js     │
│  (ES6+)      │    Glitch.com免费服务       │  信令服务器   │
│  TailwindCSS │                            │  Socket.io   │
└──────────────┘                            └──────────────┘
       │
       ├── AI引擎（Minimax本地运行，Web Worker可选）
       └── PWA Service Worker（离线缓存）
```

2.2 关键技术选型

模块	技术方案	选型理由	
网络通信	Socket.io-client v4.5+	微信兼容性好，自动降级HTTP轮询，支持房间概念	
信令服务器	Node.js + Socket.io	部署在Glitch，免费且国内可访问，支持持久化连接	
前端框架	Vanilla JS (ES6+)	单文件部署，无构建步骤，首屏加载快	
样式方案	Tailwind CSS (CDN)	原子化CSS，无需打包，压缩后体积小	
二维码	QRCode.js	纯前端生成，无需后端接口	
存储	localStorage	跨会话保存游戏统计和主题设置	
分享	微信JSSDK + Native Share	分层降级策略，最大化分享成功率	

2.3 服务器端实现（Glitch）

文件名: `server.js`

```javascript
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { 
  cors: { origin: "*" },
  pingTimeout: 60000,
  pingInterval: 25000
});

const rooms = new Map(); // 房间状态管理

io.on('connection', socket => {
  console.log('Client connected:', socket.id);
  
  // 创建房间
  socket.on('create-room', roomId => {
    rooms.set(roomId, { 
      host: socket.id, 
      guest: null, 
      hostReady: false, 
      guestReady: false,
      createdAt: Date.now()
    });
    socket.join(roomId);
    socket.roomId = roomId;
    socket.isHost = true;
    socket.emit('room-created', roomId);
  });
  
  // 加入房间
  socket.on('join-room', roomId => {
    const room = rooms.get(roomId);
    if (room && !room.guest) {
      room.guest = socket.id;
      socket.join(roomId);
      socket.roomId = roomId;
      socket.isHost = false;
      // 双方通知游戏开始
      io.to(roomId).emit('game-start');
    } else {
      socket.emit('error', { code: 'ROOM_FULL', message: '房间不存在或已满' });
    }
  });
  
  // 准备就绪
  socket.on('ready', roomId => {
    const room = rooms.get(roomId);
    if (!room) return;
    if (socket.isHost) room.hostReady = true;
    else room.guestReady = true;
    
    // 双方都准备就绪则开始
    if (room.hostReady && room.guestReady) {
      io.to(roomId).emit('game-ready');
    }
  });
  
  // 转发猜测
  socket.on('guess', ({roomId, guess}) => {
    socket.to(roomId).emit('opponent-guess', guess);
  });
  
  // 转发反馈
  socket.on('feedback', ({roomId, correct, guess}) => {
    socket.to(roomId).emit('guess-feedback', { correct, guess });
  });
  
  // 断线清理
  socket.on('disconnect', () => {
    if (socket.roomId) {
      socket.to(socket.roomId).emit('opponent-disconnect');
      rooms.delete(socket.roomId);
      console.log('Room cleaned:', socket.roomId);
    }
  });
});

// 健康检查
app.get('/', (req, res) => res.send('Number Game Server Running'));

server.listen(3000, () => console.log('Server running on port 3000'));
```

2.4 客户端关键实现

2.4.1 微信环境检测与适配

```javascript
class GameEnvironment {
  constructor() {
    this.isWechat = /MicroMessenger/i.test(navigator.userAgent);
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    this.init();
  }
  
  init() {
    if (this.isWechat) {
      this.showWechatTips();
      this.setupWechatShare();
    }
    // iOS键盘防缩放
    if (this.isIOS) {
      document.querySelectorAll('input').forEach(input => {
        input.addEventListener('focus', () => {
          window.scrollTo(0, 0);
          document.body.scrollTop = 0;
        });
      });
    }
  }
  
  setupWechatShare() {
    // 动态加载JSSDK
    const script = document.createElement('script');
    script.src = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js';
    script.onload = () => {
      // 需要后端配合签名（此处简化）
      wx.ready(() => {
        wx.updateAppMessageShareData({
          title: '来挑战我的推理极限！',
          desc: '我已经想好了4位数字，你敢来猜吗？',
          link: window.location.href,
          imgUrl: 'https://your-cdn.com/icon.png',
          success: () => console.log('Share success')
        });
      });
    };
    document.head.appendChild(script);
  }
}
```

2.4.2 AI算法实现（Minimax + 信息熵）

```javascript
class GameAI {
  constructor() {
    this.possibilities = [];
    this.lastGuess = '';
    this.init();
  }
  
  init() {
    // 生成0000-9999所有可能
    this.possibilities = Array.from({length: 10000}, (_, i) => 
      i.toString().padStart(4, '0')
    );
  }
  
  // 计算匹配度（位置和数字都对）
  calculateMatch(guess, target) {
    let correct = 0;
    for (let i = 0; i < 4; i++) {
      if (guess[i] === target[i]) correct++;
    }
    return correct;
  }
  
  // 过滤可能性空间
  filterPossibilities(guess, feedback) {
    const before = this.possibilities.length;
    this.possibilities = this.possibilities.filter(num => 
      this.calculateMatch(guess, num) === feedback
    );
    return {
      before,
      after: this.possibilities.length,
      reduction: ((1 - this.possibilities.length/before) * 100).toFixed(1)
    };
  }
  
  // Minimax选择策略
  selectBestGuess() {
    // 如果可能性少于100，精确计算；否则采样
    const sampleSize = this.possibilities.length < 100 ? 
      this.possibilities.length : 100;
    
    const samples = this.shuffle([...this.possibilities]).slice(0, sampleSize);
    let bestGuess = samples[0];
    let minMaxSize = Infinity;
    
    for (const candidate of samples) {
      // 计算该猜测的信息分布
      const distribution = new Array(5).fill(0);
      
      for (const possible of this.possibilities) {
        const match = this.calculateMatch(candidate, possible);
        distribution[match]++;
      }
      
      // 找出最坏情况（最大分组）
      const maxBucket = Math.max(...distribution);
      
      // 选择最坏情况最小的（Minimax）
      if (maxBucket < minMaxSize) {
        minMaxSize = maxBucket;
        bestGuess = candidate;
      }
    }
    
    return bestGuess;
  }
  
  // 开局策略（优化首步）
  getOpeningMove() {
    // 0011在重复数字规则下信息增益最佳
    return this.steps === 0 ? '0011' : this.selectBestGuess();
  }
  
  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
```

2.4.3 PWA离线支持

```javascript
// Service Worker 内联注册（简化版）
if ('serviceWorker' in navigator) {
  const swCode = `
    self.addEventListener('install', e => {
      self.skipWaiting();
      e.waitUntil(
        caches.open('number-game-v1').then(cache => {
          return cache.addAll([
            '/',
            'https://cdn.tailwindcss.com',
            'https://cdn.socket.io/4.5.4/socket.io.min.js'
          ]);
        })
      );
    });
    
    self.addEventListener('fetch', e => {
      e.respondWith(
        caches.match(e.request).then(response => {
          return response || fetch(e.request);
        })
      );
    });
  `;
  
  const blob = new Blob([swCode], {type: 'application/javascript'});
  const swUrl = URL.createObjectURL(blob);
  navigator.serviceWorker.register(swUrl);
}
```

---

3. 集成测试方案

3.1 测试矩阵

测试项	微信安卓	微信iOS	Safari	Chrome	Edge	
人机模式	✓	✓	✓	✓	✓	
创建房间	✓	✓	✓	✓	✓	
实时对战	✓	✓	✓	✓	✓	
断线重连	✓	✓	✓	✓	✓	
分享功能	✓	✓	✗	✗	✗	
PWA离线	✗	✗	✓	✓	✓	
后台恢复	✓	✓	✓	✓	✓	

3.2 关键测试用例（Test Cases）

TC001: 微信环境检测
前置条件: 在微信内打开应用

步骤:
1. 首次进入首页
2. 观察顶部提示条

预期结果: 显示"点击右上角在浏览器打开"提示，5秒后自动隐藏

通过标准: 提示显示完整，不影响操作

TC002: 人机对战流程
步骤:
1. 点击"挑战AI"
2. 输入秘密数字（如：7755）
3. 提交猜测（如：1234）
4. 观察AI响应

预期结果:
- AI在2秒内给出反馈（X/4）
- 历史记录正确显示
- AI终端显示思考过程

性能指标: AI计算耗时<500ms（10000可能性时）

TC003: 房间创建与加入
步骤:
1. A用户点击"创建房间"
2. 生成4位房间码和二维码
3. B用户通过链接进入（带?room=xxxx参数）
4. B点击加入

预期结果:
- 双方进入游戏界面
- 双方显示"游戏开始"
- 房主（Host）先手

TC004: 网络容错与重连
步骤:
1. 游戏中关闭WiFi/移动数据
2. 等待10秒
3. 恢复网络

预期结果:
- 显示"网络异常"提示
- 恢复后自动重连（可选实现）
- 或提示"对手断开"，返回首页

TC005: 输入边界测试
步骤:
1. 在数字输入框输入字母/符号
2. 输入超过1位数字（如：12）
3. 在iOS设备上聚焦输入框

预期结果:
- 非数字字符被过滤
- 超长输入自动截断（slice(0,1)）
- iOS页面不发生缩放

3.3 性能测试指标

指标	目标值	测试方法	
首屏加载时间	< 2s	Lighthouse / Chrome DevTools	
首包大小	< 500KB	Network面板	
AI响应时间（本地）	< 500ms	console.time	
网络延迟（PVP）	< 100ms	Ping测试	
同时在线房间数	100	压力测试（Socket.io并发）	

---

4. 部署与运维指南

4.1 服务器部署（Glitch）

步骤:
1. 注册 [glitch.com](https://glitch.com) 账号
2. 新建项目，选择"Hello Express"模板
3. 替换 `server.js` 为上述服务器代码
4. 在项目设置中获取项目URL（如 `https://number-game-signal.glitch.me`）
5. 更新客户端代码中的 `SERVER_URL` 常量

注意事项:
- Glitch免费版有睡眠机制（5分钟无请求会休眠），首次连接可能有3秒延迟
- 如需24小时在线，可使用 [UptimeRobot](https://uptimerobot.com) 每5分钟Ping一次保持唤醒

4.2 前端部署（Vercel/GitHub Pages）

方案A: Vercel（推荐）

```bash
# 1. 推送代码到GitHub
git init
git add .
git commit -m "Initial commit"
git push origin main

# 2. 导入Vercel
# 访问 vercel.com，导入GitHub仓库，自动部署
# 获得 https://your-game.vercel.app 域名
```

方案B: GitHub Pages
1. 仓库设置 → Pages → 选择main分支
2. 获得 `https://username.github.io/repo-name/` 链接
3. 注意：如果使用GitHub Pages，Socket.io服务器需支持CORS

4.3 微信分享优化

在HTML `<head>` 中添加Open Graph标签：

```html
<meta property="og:title" content="数字对决 - 来挑战我的推理极限">
<meta property="og:description" content="我已经想好了4位数字，你敢来猜吗？支持人机对战和好友联机！">
<meta property="og:image" content="https://your-cdn.com/share-cover.png">
<meta property="og:url" content="https://your-game.vercel.app">
<!-- 微信专用 -->
<meta name="wx:title" content="数字对决">
<meta name="wx:description" content="挑战最强AI或与好友实时对战">
```

4.4 运维监控

建议接入免费监控：

1. Sentry (错误监控): 
   
```html
   <script src="https://browser.sentry-cdn.com/7.x.x/bundle.min.js"></script>
   <script>Sentry.init({ dsn: 'your-dsn' });</script>
```

2. Google Analytics (访问统计):
   
```javascript
   gtag('event', 'game_start', { 'mode': 'pvc' });
   gtag('event', 'room_create', { 'room_id': roomId });
```

---

5. 附录：核心代码结构

5.1 项目文件结构

```text
number-game-h5/
├── index.html          # 主入口（单文件应用）
├── server.js           # Glitch服务器代码
├── README.md           # 本文档
└── assets/
    ├── icon-192.png    # PWA图标
    └── share-cover.png # 微信分享封面
```

5.2 关键类说明

类名	职责	核心方法	
`NumberGameH5`	游戏主控制器，状态管理	`startPVC()`, `createRoom()`, `makeGuess()`	
`GameAI`	AI逻辑，Minimax算法	`selectBestGuess()`, `filterPossibilities()`	
`GameEnvironment`	环境检测，微信适配	`isWechat`, `setupWechatShare()`	
`ConnectionManager`	Socket.io连接管理	`connect()`, `reconnect()`, `emit()`	

5.3 状态机定义

```javascript
const GameState = {
  IDLE: 'idle',        // 初始状态
  WAITING: 'waiting',  // 等待对手（PVP）
  SETUP: 'setup',      // 设置秘密数字
  PLAYING: 'playing',  // 游戏进行中
  ENDED: 'ended'       // 游戏结束
};

const TurnState = {
  MY_TURN: true,
  OPP_TURN: false
};
```

---

更新日志

- v1.0.0 (2026-02-18): 初始版本，支持微信H5、人机对战、PVP联机、PWA
- v1.1.0 (计划): 添加排行榜、战绩统计、AI难度选择

---

