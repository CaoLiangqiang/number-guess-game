# 数字对决 Pro - WebSocket 服务器
FROM node:18-alpine

WORKDIR /app

# 复制 package 文件
COPY server/package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制服务器代码
COPY server/*.js ./

# 暴露端口
EXPOSE 8080

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=8080

# 启动服务器
CMD ["node", "server.js"]