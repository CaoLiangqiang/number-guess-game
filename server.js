/**
 * 数字对决 Pro - Socket.io 信令服务器
 * 部署平台: Glitch.com (免费)
 * 用途: 微信环境下的联机对战中转
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { 
  cors: { 
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

// 房间状态管理
const rooms = new Map();

// 健康检查
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    service: '数字对决 Pro - Socket.io Server',
    version: '1.0.0',
    uptime: process.uptime(),
    activeRooms: rooms.size
  });
});

// 获取房间列表（管理员用）
app.get('/rooms', (req, res) => {
  const roomList = [];
  rooms.forEach((room, id) => {
    roomList.push({
      id,
      hostReady: room.hostReady,
      guestReady: room.guestReady,
      hasHost: !!room.host,
      hasGuest: !!room.guest,
      createdAt: room.createdAt
    });
  });
  res.json({ rooms: roomList, count: rooms.size });
});

io.on('connection', socket => {
  console.log('Client connected:', socket.id);
  
  // 创建房间
  socket.on('create-room', roomId => {
    console.log('Creating room:', roomId);
    
    // 清理已存在的旧房间（如果是同一个 socket）
    if (socket.roomId) {
      socket.leave(socket.roomId);
      rooms.delete(socket.roomId);
    }
    
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
    console.log('Room created:', roomId);
  });
  
  // 加入房间
  socket.on('join-room', roomId => {
    console.log('Joining room:', roomId, 'from:', socket.id);
    const room = rooms.get(roomId);
    
    if (!room) {
      socket.emit('error', { code: 'ROOM_NOT_FOUND', message: '房间不存在' });
      return;
    }
    
    if (room.guest) {
      socket.emit('error', { code: 'ROOM_FULL', message: '房间已满' });
      return;
    }
    
    room.guest = socket.id;
    socket.join(roomId);
    socket.roomId = roomId;
    socket.isHost = false;
    
    // 通知双方游戏开始
    io.to(roomId).emit('game-start');
    console.log('Game started in room:', roomId);
  });
  
  // 准备就绪
  socket.on('ready', roomId => {
    const room = rooms.get(roomId);
    if (!room) return;
    
    if (socket.isHost) {
      room.hostReady = true;
      socket.hostReady = true;
    } else {
      room.guestReady = true;
      socket.opponentReady = true;
    }
    
    console.log('Player ready in room:', roomId, 'Host:', room.hostReady, 'Guest:', room.guestReady);
    
    // 双方都准备就绪则通知
    if (room.hostReady && room.guestReady) {
      io.to(roomId).emit('game-ready');
      console.log('Game ready in room:', roomId);
    }
  });
  
  // 转发猜测
  socket.on('guess', ({roomId, guess}) => {
    socket.to(roomId).emit('opponent-guess', guess);
    console.log('Guess in room:', roomId, 'guess:', guess);
  });
  
  // 转发反馈
  socket.on('feedback', ({roomId, correct, guess}) => {
    socket.to(roomId).emit('guess-feedback', { correct, guess });
    console.log('Feedback in room:', roomId, 'correct:', correct);
  });
  
  // 游戏结束
  socket.on('game-over', ({roomId, winner, details}) => {
    socket.to(roomId).emit('game-over', { winner, details });
    console.log('Game over in room:', roomId, 'winner:', winner);
  });
  
  // 断线处理
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      
      // 通知对方对手断开
      socket.to(socket.roomId).emit('opponent-disconnect');
      
      // 清理房间
      rooms.delete(socket.roomId);
      console.log('Room cleaned:', socket.roomId);
    }
  });
});

// 定期清理过期房间（1小时未活动）
setInterval(() => {
  const now = Date.now();
  const timeout = 60 * 60 * 1000; // 1小时
  
  rooms.forEach((room, id) => {
    if (now - room.createdAt > timeout) {
      rooms.delete(id);
      console.log('Cleaned expired room:', id);
    }
  });
}, 10 * 60 * 1000); // 每10分钟检查一次

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 数字对决 Pro 服务器运行中...`);
  console.log(`📍 端口: ${PORT}`);
  console.log(`📅 ${new Date().toLocaleString('zh-CN')}`);
});
