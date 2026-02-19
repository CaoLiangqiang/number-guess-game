# 数字对决 Pro - WebSocket服务器部署指南

## 方案一：Render.com 免费部署（推荐）

Render.com 提供免费的WebSocket服务器托管，适合个人项目。

### 步骤1：注册Render账号

1. 访问 https://render.com
2. 点击 "Get Started for Free"
3. 使用GitHub账号登录（推荐，方便代码部署）

### 步骤2：创建GitHub仓库（如果还没有）

1. 访问 https://github.com/new
2. 仓库名称：`number-guess-server`
3. 设为公开仓库
4. 创建仓库

### 步骤3：上传服务器代码

将 `server` 文件夹中的代码上传到GitHub：

```bash
# 在 server 文件夹中执行
git init
git add .
git commit -m "Initial server code"
git remote add origin https://github.com/你的用户名/number-guess-server.git
git push -u origin main
```

### 步骤4：在Render创建Web Service

1. 登录 Render.com 控制台
2. 点击 "New" → "Web Service"
3. 选择 "Build and deploy from a Git repository"
4. 连接你的GitHub账号，选择 `number-guess-server` 仓库
5. 配置如下：

| 配置项 | 值 |
|--------|-----|
| Name | number-guess-server |
| Region | Singapore (Asia Pacific) |
| Branch | main |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Plan | Free |

6. **添加Redis（重要）**：
   - 在Render Dashboard中，点击 "New" → "Redis"
   - 选择 "New Redis"
   - 名称：`number-guess-redis`
   - Plan：选择 "Free"（或付费版以获得更好性能）
   - 点击 "Create Redis"
   - 创建完成后，复制 "Internal Redis URL"

7. **配置环境变量**：
   - 在Web Service的 "Environment" 标签页
   - 点击 "Add Environment Variable"
   - Key：`REDIS_URL`
   - Value：粘贴刚才复制的Redis URL（格式如：`redis://red-xxx:6379`）

8. 点击 "Create Web Service"

### 步骤5：获取服务器地址

部署完成后，Render会提供一个URL，例如：
```
https://number-guess-server.onrender.com
```

WebSocket地址为：
```
wss://number-guess-server.onrender.com
```

### 步骤6：更新前端配置

将获取到的WebSocket地址更新到前端代码中（见下文"更新前端配置"部分）。

---

## 方案二：Railway.app 免费部署

Railway.app 也提供免费额度，适合部署WebSocket服务器。

### 步骤1：注册Railway账号

1. 访问 https://railway.app
2. 使用GitHub账号登录

### 步骤2：创建项目

1. 点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 选择你的 `number-guess-server` 仓库

### 步骤3：配置部署

Railway会自动检测Node.js项目并配置部署，无需额外设置。

### 步骤4：获取域名

部署完成后，Railway会自动生成一个域名，例如：
```
number-guess-server.up.railway.app
```

WebSocket地址为：
```
wss://number-guess-server.up.railway.app
```

---

## 方案三：阿里云/腾讯云 VPS（付费）

如果需要更稳定的国内服务，可以购买云服务器。

### 推荐配置

| 配置项 | 建议 |
|--------|------|
| 服务器 | 阿里云ECS / 腾讯云CVM |
| 规格 | 1核1G 或 1核2G |
| 带宽 | 1Mbps |
| 系统 | Ubuntu 20.04 LTS |
| 费用 | 约￥50-100/月 |

### 部署步骤

1. 购买服务器后，通过SSH连接：
```bash
ssh root@你的服务器IP
```

2. 安装Node.js：
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. 上传代码并运行：
```bash
# 创建目录
mkdir -p /opt/number-guess-server
cd /opt/number-guess-server

# 上传代码（通过scp或git）
git clone https://github.com/你的用户名/number-guess-server.git .

# 安装依赖
npm install

# 启动服务（使用pm2保持运行）
npm install -g pm2
pm2 start server.js --name "number-guess-server"
pm2 startup
pm2 save
```

4. 配置Nginx（可选，用于HTTPS）：
```bash
sudo apt install nginx certbot python3-certbot-nginx

# 配置Nginx
sudo nano /etc/nginx/sites-available/number-guess-server
```

添加配置：
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

启用配置并申请SSL证书：
```bash
sudo ln -s /etc/nginx/sites-available/number-guess-server /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d your-domain.com
```

---

## 更新前端配置

获得WebSocket服务器地址后，需要更新前端代码：

### 步骤1：修改 index.html

找到 `GameConfig` 配置对象（约第605行），更新为：

```javascript
const GameConfig = {
    // 环境检测
    environment: (() => {
        const hostname = window.location.hostname;
        if (hostname.includes('github.io')) return 'github_pages';
        if (hostname.includes('netlify.app')) return 'netlify';
        if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) return 'development';
        return 'production';
    })(),
    
    // WebSocket服务器地址配置
    wsServers: {
        development: 'ws://localhost:8080',
        github_pages: 'wss://你的服务器地址',
        netlify: 'wss://你的服务器地址',
        production: 'wss://你的服务器地址'
    },
    
    // 获取当前环境的WebSocket地址
    getWsServer() {
        return this.wsServers[this.environment] || this.wsServers.production;
    },
    
    // 游戏设置
    gameSettings: {
        maxReconnectAttempts: 5,
        heartbeatInterval: 1000,
        turnTimeout: 60,
        roomCodeLength: 6
    }
};
```

### 步骤2：启用联机功能

找到联机大厅的HTML代码（约第260行），删除置灰样式：

**修改前：**
```html
<div class="mb-8 opacity-50 pointer-events-none" id="createRoomSection">
```

**修改后：**
```html
<div class="mb-8" id="createRoomSection">
```

**修改前：**
```html
<div class="bg-slate-800/50 rounded-2xl p-6 border border-white/5 opacity-50 pointer-events-none" id="joinRoomSection">
```

**修改后：**
```html
<div class="bg-slate-800/50 rounded-2xl p-6 border border-white/5" id="joinRoomSection">
```

### 步骤3：删除或隐藏提示信息

可以选择删除"联机功能即将推出"的提示，或者修改文字说明服务器已就绪。

---

## 测试联机功能

### 本地测试

1. 启动本地服务器：
```bash
cd server
npm install
npm start
```

2. 修改前端配置，将 development 地址改为 `ws://localhost:8080`

3. 启动前端：
```bash
python -m http.server 8081
```

4. 打开两个浏览器窗口，访问 http://localhost:8081

5. 测试创建房间、加入房间、游戏对战

### 线上测试

1. 部署完成后，访问你的GitHub Pages或Netlify地址
2. 点击"双人联机"
3. 创建房间，复制房间号
4. 在另一个浏览器（或让朋友）打开相同页面，加入房间
5. 测试完整游戏流程

---

## 常见问题

### Q: Render免费版有什么限制？
A: 
- 15分钟后无请求会休眠（首次连接可能需要等待30秒唤醒）
- 每月750小时免费额度
- 适合个人项目和小规模使用

### Q: 如何防止服务器休眠？
A: 可以设置定时ping服务，或使用付费版（$7/月）

### Q: WebSocket连接失败怎么办？
A:
1. 检查服务器地址是否正确
2. 确认使用 `wss://` 而不是 `ws://`（HTTPS页面必须使用WSS）
3. 查看浏览器控制台错误信息
4. 检查服务器日志

### Q: 国内访问慢怎么办？
A:
- 选择Render的Singapore区域
- 或使用阿里云/腾讯云国内服务器
- 或等待Render开通国内节点

---

## 下一步

1. 选择部署方案（推荐Render.com免费版）
2. 按照步骤部署服务器
3. 获取WebSocket地址
4. 更新前端配置
5. 测试联机功能
6. 提交代码并发布

有任何问题随时问我！
