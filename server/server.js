/**
 * 数字对决 Pro - WebSocket服务器
 * 支持双人实时联机对战 - Redis版本
 */

const WebSocket = require('ws');
const http = require('http');
const redis = require('redis');

// 配置
const PORT = process.env.PORT || 8080;
const HEARTBEAT_INTERVAL = 30000; // 30秒心跳检测
const ROOM_CLEANUP_INTERVAL = 60000; // 60秒清理空房间
const ROOM_TTL = 3600; // 房间数据在Redis中的过期时间（秒）
const TURN_TIMEOUT = 60000; // 60秒回合超时

// 实例ID（用于识别不同的服务器实例）
const INSTANCE_ID = process.env.RENDER_INSTANCE_ID || 'local-' + Date.now();
const SERVER_VERSION = '1.1.0';

// Redis客户端
let redisClient = null;
let redisConnected = false;

// 本地存储（用于存储WebSocket连接，无法序列化到Redis）
const rooms = new Map(); // roomCode -> Room
const clients = new Map(); // ws -> ClientInfo

// 初始化Redis
async function initRedis() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
        console.log('未配置REDIS_URL，使用内存存储模式');
        return false;
    }

    try {
        redisClient = redis.createClient({
            url: redisUrl,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        console.log('Redis重连次数过多，放弃连接');
                        return new Error('Redis重连失败');
                    }
                    return Math.min(retries * 100, 3000);
                }
            }
        });

        redisClient.on('error', (err) => {
            console.error('Redis错误:', err);
            redisConnected = false;
        });

        redisClient.on('connect', () => {
            console.log('Redis已连接');
            redisConnected = true;
        });

        await redisClient.connect();
        return true;
    } catch (error) {
        console.error('Redis连接失败:', error);
        redisClient = null;
        return false;
    }
}

// 随机匹配队列
const matchQueue = []; // 等待匹配的玩家队列
const MATCH_TIMEOUT = 60000; // 匹配等待超时时间（60秒）

/**
 * 处理随机匹配请求
 * 1. 检查队列中是否有等待中的玩家
 * 2. 如果有，匹配成功，创建房间
 * 3. 如果没有，加入等待队列
 */
async function handleRandomMatch(ws, message) {
    const { playerId } = message;
    console.log('随机匹配请求:', playerId, '当前队列长度:', matchQueue.length);
    
    // 检查玩家是否已在队列中
    const existingIndex = matchQueue.findIndex(m => m.playerId === playerId);
    if (existingIndex !== -1) {
        ws.send(JSON.stringify({
            type: 'error',
            message: '已在匹配队列中'
        }));
        return;
    }
    
    // 查找可匹配的玩家（不在同一房间的玩家）
    let matchedPlayer = null;
    for (let i = 0; i < matchQueue.length; i++) {
        const queued = matchQueue[i];
        // 检查玩家是否仍然在线
        const isOnline = Array.from(clients.values()).some(c => c.playerId === queued.playerId && c.ws.readyState === 1);
        if (isOnline && queued.playerId !== playerId) {
            matchedPlayer = queued;
            matchQueue.splice(i, 1); // 从队列中移除
            break;
        }
    }
    
    if (matchedPlayer) {
        // 找到匹配，创建房间
        const roomCode = generateRoomCode();
        const room = new Room(roomCode, playerId);
        room.addPlayer(playerId, ws);
        room.addPlayer(matchedPlayer.playerId, matchedPlayer.ws);
        room.isWaiting = false;
        rooms.set(roomCode, room);
        
        // 保存到Redis
        if (redisConnected) {
            await room.syncToRedis();
        }
        
        // 通知两个玩家
        ws.send(JSON.stringify({
            type: 'random_match_found',
            roomCode: roomCode,
            isHost: true
        }));
        
        matchedPlayer.ws.send(JSON.stringify({
            type: 'random_match_found',
            roomCode: roomCode,
            isHost: false
        }));
        
        console.log('随机匹配成功:', roomCode, playerId, matchedPlayer.playerId);
    } else {
        // 没有匹配，加入队列
        matchQueue.push({ playerId, ws, timestamp: Date.now() });
        ws.send(JSON.stringify({
            type: 'random_match_waiting',
            message: '等待对手加入...'
        }));
        console.log('加入匹配队列:', playerId);
        
        // 设置超时自动离开队列
        setTimeout(() => {
            const index = matchQueue.findIndex(m => m.playerId === playerId);
            if (index !== -1) {
                matchQueue.splice(index, 1);
                ws.send(JSON.stringify({
                    type: 'random_match_timeout',
                    message: '未找到对手，请重试'
                }));
                console.log('匹配超时:', playerId);
            }
        }, MATCH_TIMEOUT);
    }
}

/**
 * 处理取消随机匹配请求
 */
async function handleCancelRandomMatch(ws, message) {
    const { playerId } = message;
    const index = matchQueue.findIndex(m => m.playerId === playerId);
    
    if (index !== -1) {
        matchQueue.splice(index, 1);
        ws.send(JSON.stringify({
            type: 'random_match_cancelled',
            message: '已取消匹配'
        }));
        console.log('取消匹配:', playerId);
    }
}

// Redis房间数据操作
const RoomStore = {
    // 保存房间到Redis
    async save(roomCode, roomData) {
        if (!redisClient || !redisConnected) return false;
        try {
            await redisClient.setEx(
                `room:${roomCode}`,
                ROOM_TTL,
                JSON.stringify(roomData)
            );
            return true;
        } catch (error) {
            console.error('保存房间到Redis失败:', error);
            return false;
        }
    },

    // 从Redis获取房间
    async get(roomCode) {
        if (!redisClient || !redisConnected) return null;
        try {
            const data = await redisClient.get(`room:${roomCode}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('从Redis获取房间失败:', error);
            return null;
        }
    },

    // 删除房间
    async delete(roomCode) {
        if (!redisClient || !redisConnected) return false;
        try {
            await redisClient.del(`room:${roomCode}`);
            return true;
        } catch (error) {
            console.error('删除Redis房间失败:', error);
            return false;
        }
    },

    // 获取所有房间（用于调试）
    async getAll() {
        if (!redisClient || !redisConnected) return [];
        try {
            const keys = await redisClient.keys('room:*');
            if (keys.length === 0) return [];
            const values = await redisClient.mGet(keys);
            return values.map((v, i) => ({
                code: keys[i].replace('room:', ''),
                data: JSON.parse(v)
            }));
        } catch (error) {
            console.error('获取所有Redis房间失败:', error);
            return [];
        }
    }
};

// 房间类
class Room {
    constructor(code, hostId) {
        this.code = code;
        this.hostId = hostId;
        this.guestId = null;
        this.hostWs = null;
        this.guestWs = null;
        this.hostSecret = null;
        this.guestSecret = null;
        this.hostReady = false;
        this.guestReady = false;
        this.gameState = 'waiting'; // waiting, playing, ended
        this.currentPlayer = null;
        this.turn = 0;
        this.hostSteps = 0;
        this.guestSteps = 0;
        this.history = [];
        this.createdAt = Date.now();
        this.instanceId = INSTANCE_ID; // 记录创建房间的实例ID
        this.turnTimer = null; // 回合计时器
        this.turnStartTime = null; // 回合开始时间
    }

    // 序列化为可存储的数据（排除WebSocket连接）
    toJSON() {
        return {
            code: this.code,
            hostId: this.hostId,
            guestId: this.guestId,
            hostSecret: this.hostSecret,
            guestSecret: this.guestSecret,
            hostReady: this.hostReady,
            guestReady: this.guestReady,
            gameState: this.gameState,
            currentPlayer: this.currentPlayer,
            turn: this.turn,
            hostSteps: this.hostSteps,
            guestSteps: this.guestSteps,
            history: this.history,
            createdAt: this.createdAt,
            instanceId: this.instanceId
        };
    }

    // 从JSON数据恢复
    static fromJSON(data) {
        const room = new Room(data.code, data.hostId);
        Object.assign(room, data);
        room.hostWs = null;
        room.guestWs = null;
        return room;
    }

    // 同步到Redis
    async syncToRedis() {
        await RoomStore.save(this.code, this.toJSON());
    }

    // 从Redis同步
    async syncFromRedis() {
        const data = await RoomStore.get(this.code);
        if (data) {
            const wsMap = {
                hostWs: this.hostWs,
                guestWs: this.guestWs
            };
            Object.assign(this, data);
            this.hostWs = wsMap.hostWs;
            this.guestWs = wsMap.guestWs;
            return true;
        }
        return false;
    }

    // 添加玩家
    addPlayer(playerId, ws) {
        if (this.hostId === playerId) {
            this.hostWs = ws;
            return 'host';
        } else if (!this.guestId) {
            this.guestId = playerId;
            this.guestWs = ws;
            return 'guest';
        }
        return null;
    }

    // 移除玩家
    removePlayer(playerId) {
        if (this.hostId === playerId) {
            this.hostWs = null;
            this.hostReady = false;
        } else if (this.guestId === playerId) {
            this.guestWs = null;
            this.guestReady = false;
        }
    }

    // 设置准备状态
    async setReady(playerId, secret) {
        if (this.hostId === playerId) {
            this.hostSecret = secret;
            this.hostReady = true;
        } else if (this.guestId === playerId) {
            this.guestSecret = secret;
            this.guestReady = true;
        }

        // 同步到Redis
        await this.syncToRedis();

        // 双方都准备好，开始游戏
        if (this.hostReady && this.guestReady) {
            this.gameState = 'playing';
            this.currentPlayer = Math.random() < 0.5 ? this.hostId : this.guestId;
            this.turn = 1;
            this.turnStartTime = Date.now();
            // 启动回合计时器
            this.startTurnTimer();
            await this.syncToRedis();
            return true;
        }
        return false;
    }

    // 获取对手ID
    getOpponentId(playerId) {
        return playerId === this.hostId ? this.guestId : this.hostId;
    }

    // 获取对手的WebSocket
    getOpponentWs(playerId) {
        return playerId === this.hostId ? this.guestWs : this.hostWs;
    }

    // 获取玩家的WebSocket
    getPlayerWs(playerId) {
        return playerId === this.hostId ? this.hostWs : this.guestWs;
    }

    // 获取对手的秘密数字
    getOpponentSecret(playerId) {
        return playerId === this.hostId ? this.guestSecret : this.hostSecret;
    }

    // 切换回合
    async switchTurn() {
        // 清除之前的计时器
        if (this.turnTimer) {
            clearTimeout(this.turnTimer);
            this.turnTimer = null;
        }
        
        this.currentPlayer = this.getOpponentId(this.currentPlayer);
        this.turn++;
        this.turnStartTime = Date.now();
        
        // 启动新的回合计时器
        this.startTurnTimer();
        
        await this.syncToRedis();
    }
    
    // 启动回合计时器
    startTurnTimer() {
        if (this.turnTimer) {
            clearTimeout(this.turnTimer);
        }
        
        const room = this;
        this.turnTimer = setTimeout(async () => {
            await this.handleTurnTimeout();
        }, TURN_TIMEOUT);
    }
    
    // 处理回合超时
    async handleTurnTimeout() {
        if (this.gameState !== 'playing') return;
        
        const timeoutPlayer = this.currentPlayer;
        const winner = this.getOpponentId(timeoutPlayer);
        
        console.log('回合超时:', this.code, '超时玩家:', timeoutPlayer, '获胜者:', winner);
        
        // 广播超时信息
        this.broadcast({
            type: 'turn_timeout',
            timeoutPlayer,
            winner,
            message: `玩家 ${timeoutPlayer} 回合超时（60秒），对手获胜`
        });
        
        // 结束游戏
        this.gameState = 'ended';
        
        if (this.turnTimer) {
            clearTimeout(this.turnTimer);
            this.turnTimer = null;
        }
        
        await this.syncToRedis();
    }
    
    // 清除回合计时器
    clearTurnTimer() {
        if (this.turnTimer) {
            clearTimeout(this.turnTimer);
            this.turnTimer = null;
        }
    }

    // 记录步数
    async incrementSteps(playerId) {
        if (playerId === this.hostId) {
            this.hostSteps++;
        } else {
            this.guestSteps++;
        }
        await this.syncToRedis();
    }

    // 添加历史记录
    async addHistory(playerId, guess, feedback) {
        this.history.push({
            turn: this.turn,
            playerId,
            guess,
            feedback,
            timestamp: Date.now()
        });
        await this.syncToRedis();
    }

    // 广播消息给所有玩家
    broadcast(message, excludePlayerId = null) {
        const msg = JSON.stringify(message);
        if (this.hostWs && this.hostId !== excludePlayerId) {
            this.hostWs.send(msg);
        }
        if (this.guestWs && this.guestId !== excludePlayerId) {
            this.guestWs.send(msg);
        }
    }

    // 发送消息给指定玩家
    sendTo(playerId, message) {
        const ws = this.getPlayerWs(playerId);
        if (ws) {
            ws.send(JSON.stringify(message));
        }
    }

    // 检查是否为空房间
    isEmpty() {
        return !this.hostWs && !this.guestWs;
    }

    // 获取房间信息（用于返回给客户端）
    getInfo() {
        return {
            code: this.code,
            hostId: this.hostId,
            guestId: this.guestId,
            hostReady: this.hostReady,
            guestReady: this.guestReady,
            gameState: this.gameState,
            currentPlayer: this.currentPlayer,
            turn: this.turn,
            hostSteps: this.hostSteps,
            guestSteps: this.guestSteps
        };
    }
}

// 计算匹配度
function calculateMatch(guess, target) {
    let match = 0;
    for (let i = 0; i < 4; i++) {
        if (guess[i] === target[i]) {
            match++;
        }
    }
    return match;
}

// 生成房间号
function generateRoomCode() {
    const chars = '0123456789ABCDEF';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

// 创建HTTP服务器
const server = http.createServer((req, res) => {
    // 健康检查端点
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            version: SERVER_VERSION,
            instanceId: INSTANCE_ID,
            redisConnected: redisConnected,
            rooms: rooms.size,
            connections: clients.size,
            uptime: process.uptime()
        }));
        return;
    }

    // 默认响应
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`数字对决 Pro - WebSocket服务器运行中\n版本: ${SERVER_VERSION}\n实例: ${INSTANCE_ID}\n`);
});

// 创建WebSocket服务器
const wss = new WebSocket.Server({ server });

// 处理连接
wss.on('connection', (ws, req) => {
    console.log('新连接:', req.socket.remoteAddress, '实例:', INSTANCE_ID);

    // 存储客户端信息
    clients.set(ws, {
        playerId: null,
        roomCode: null,
        lastPing: Date.now()
    });

    // 发送欢迎消息
    ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to Number Guess Pro server',
        instanceId: INSTANCE_ID,
        version: SERVER_VERSION,
        timestamp: Date.now()
    }));

    // 处理消息
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            handleMessage(ws, message);
        } catch (error) {
            console.error('消息解析错误:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid message format'
            }));
        }
    });

    // 处理关闭
    ws.on('close', () => {
        handleDisconnect(ws);
    });

    // 处理错误
    ws.on('error', (error) => {
        console.error('WebSocket错误:', error);
    });
});

// 处理消息
async function handleMessage(ws, message) {
    const client = clients.get(ws);
    if (!client) return;

    // 更新最后活动时间
    client.lastPing = Date.now();

    // AMP-002: 处理批量消息
    if (message.type === 'batch' && Array.isArray(message.messages)) {
        console.log(`[AMP-002] 收到批量消息，包含 ${message.messages.length} 条消息`);
        for (const msg of message.messages) {
            msg._batchTimestamp = message.timestamp;
            await handleMessage(ws, msg);
        }
        return;
    }

    switch (message.type) {
        case 'ping':
            ws.send(JSON.stringify({
                type: 'pong',
                timestamp: message.timestamp
            }));
            break;

        case 'create_room':
            await handleCreateRoom(ws, message);
            break;

        case 'join_room':
            await handleJoinRoom(ws, message);
            break;

        case 'leave_room':
            await handleLeaveRoom(ws, message);
            break;

        case 'player_ready':
            await handlePlayerReady(ws, message);
            break;

        case 'submit_guess':
            await handleSubmitGuess(ws, message);
            break;

        case 'request_rematch':
            await handleRematch(ws, message);
            break;

        case 'random_match':
            await handleRandomMatch(ws, message);
            break;

        case 'cancel_random_match':
            await handleCancelRandomMatch(ws, message);
            break;

        default:
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Unknown message type: ' + message.type
            }));
    }
}

// 处理创建房间
async function handleCreateRoom(ws, message) {
    const { roomCode, playerId } = message;
    
    console.log('创建房间请求:', roomCode, '玩家:', playerId, '实例:', INSTANCE_ID);
    console.log('当前本地房间数:', rooms.size);
    console.log('Redis连接状态:', redisConnected);

    // 检查本地内存
    if (rooms.has(roomCode)) {
        console.log('房间已存在（本地）:', roomCode);
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Room already exists'
        }));
        return;
    }

    // 检查Redis
    if (redisConnected) {
        const existingRoom = await RoomStore.get(roomCode);
        if (existingRoom) {
            console.log('房间已存在（Redis）:', roomCode);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Room already exists'
            }));
            return;
        }
    }

    const room = new Room(roomCode, playerId);
    room.addPlayer(playerId, ws);
    rooms.set(roomCode, room);

    // 保存到Redis
    if (redisConnected) {
        await room.syncToRedis();
        console.log('房间已保存到Redis:', roomCode);
    }

    const client = clients.get(ws);
    client.playerId = playerId;
    client.roomCode = roomCode;

    ws.send(JSON.stringify({
        type: 'room_created',
        room: room.getInfo()
    }));

    console.log('房间创建成功:', roomCode, '玩家:', playerId, '实例:', INSTANCE_ID);
}

// 处理加入房间
async function handleJoinRoom(ws, message) {
    const { roomCode, playerId } = message;
    
    console.log('加入房间请求:', roomCode, '玩家:', playerId, '实例:', INSTANCE_ID);
    console.log('当前本地房间数:', rooms.size);
    console.log('可用本地房间:', Array.from(rooms.keys()));

    let room = rooms.get(roomCode);

    // 如果本地没有，尝试从Redis获取
    if (!room && redisConnected) {
        console.log('本地无房间，尝试从Redis获取:', roomCode);
        const roomData = await RoomStore.get(roomCode);
        if (roomData) {
            console.log('从Redis恢复房间:', roomCode);
            room = Room.fromJSON(roomData);
            rooms.set(roomCode, room);
        }
    }

    if (!room) {
        console.log('房间未找到:', roomCode);
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Room not found'
        }));
        return;
    }

    // 同步最新数据
    if (redisConnected) {
        await room.syncFromRedis();
    }

    const role = room.addPlayer(playerId, ws);
    if (!role) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Room is full'
        }));
        return;
    }

    const client = clients.get(ws);
    client.playerId = playerId;
    client.roomCode = roomCode;

    // 保存到Redis
    if (redisConnected) {
        await room.syncToRedis();
    }

    // 通知加入者
    ws.send(JSON.stringify({
        type: 'room_joined',
        room: room.getInfo(),
        role
    }));

    // 通知房主
    if (room.hostWs && room.hostId !== playerId) {
        room.hostWs.send(JSON.stringify({
            type: 'player_joined',
            playerId
        }));
    }

    console.log('玩家加入成功:', playerId, '房间:', roomCode, '角色:', role);
}

// 处理离开房间
async function handleLeaveRoom(ws, message) {
    const { roomCode, playerId } = message;
    const room = rooms.get(roomCode);

    if (room) {
        room.removePlayer(playerId);

        // 同步到Redis
        if (redisConnected) {
            await room.syncToRedis();
        }

        // 通知对手
        const opponentWs = room.getOpponentWs(playerId);
        if (opponentWs) {
            opponentWs.send(JSON.stringify({
                type: 'player_left',
                playerId
            }));
        }

        // 如果房间空了，删除房间
        if (room.isEmpty()) {
            rooms.delete(roomCode);
            if (redisConnected) {
                await RoomStore.delete(roomCode);
            }
            console.log('房间删除:', roomCode);
        }
    }

    const client = clients.get(ws);
    if (client) {
        client.roomCode = null;
    }
}

// 处理玩家准备
async function handlePlayerReady(ws, message) {
    const { roomCode, playerId, secret } = message;
    
    console.log('玩家准备:', roomCode, '玩家:', playerId, '实例:', INSTANCE_ID);

    let room = rooms.get(roomCode);

    // 如果本地没有，尝试从Redis获取
    if (!room && redisConnected) {
        const roomData = await RoomStore.get(roomCode);
        if (roomData) {
            room = Room.fromJSON(roomData);
            rooms.set(roomCode, room);
        }
    }

    if (!room) {
        console.log('准备时房间未找到:', roomCode);
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Room not found'
        }));
        return;
    }

    // 同步最新数据
    if (redisConnected) {
        await room.syncFromRedis();
    }

    // 验证秘密数字格式
    if (!secret || secret.length !== 4 || !/^\d{4}$/.test(secret)) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid secret number format'
        }));
        return;
    }

    const gameStarted = await room.setReady(playerId, secret);
    
    console.log('玩家准备完成:', playerId, '游戏开始:', gameStarted);
    console.log('房间状态:', room.getInfo());

    // 广播准备状态
    room.broadcast({
        type: 'player_ready',
        playerId,
        room: room.getInfo()
    });

    // 如果游戏开始，广播游戏开始消息
    if (gameStarted) {
        console.log('广播游戏开始消息');
        room.broadcast({
            type: 'game_start',
            firstPlayer: room.currentPlayer,
            room: room.getInfo()
        });
        console.log('游戏开始:', roomCode, '先手:', room.currentPlayer);
    }
}

// 处理提交猜测
async function handleSubmitGuess(ws, message) {
    const { roomCode, playerId, guess } = message;
    
    let room = rooms.get(roomCode);

    // 如果本地没有，尝试从Redis获取
    if (!room && redisConnected) {
        const roomData = await RoomStore.get(roomCode);
        if (roomData) {
            room = Room.fromJSON(roomData);
            rooms.set(roomCode, room);
        }
    }

    if (!room) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Room not found'
        }));
        return;
    }

    // 同步最新数据
    if (redisConnected) {
        await room.syncFromRedis();
    }

    // 验证游戏状态
    if (room.gameState !== 'playing') {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Game is not in playing state'
        }));
        return;
    }

    // 验证回合
    if (room.currentPlayer !== playerId) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Not your turn'
        }));
        return;
    }

    // 验证猜测格式
    if (!guess || guess.length !== 4 || !/^\d{4}$/.test(guess)) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid guess format'
        }));
        return;
    }

    // 计算反馈
    const opponentSecret = room.getOpponentSecret(playerId);
    const feedback = calculateMatch(guess, opponentSecret);

    // 记录历史
    await room.addHistory(playerId, guess, feedback);
    await room.incrementSteps(playerId);

    // 广播猜测结果
    room.broadcast({
        type: 'guess_result',
        playerId,
        guess,
        feedback,
        room: room.getInfo()
    });

    console.log('猜测:', roomCode, '玩家:', playerId, '猜测:', guess, '反馈:', feedback);

    // 检查是否获胜
    if (feedback === 4) {
        room.gameState = 'ended';
        room.clearTurnTimer(); // 清除回合计时器
        await room.syncToRedis();
        room.broadcast({
            type: 'game_over',
            winner: playerId,
            room: room.getInfo(),
            history: room.history
        });
        console.log('游戏结束:', roomCode, '获胜者:', playerId);
    } else {
        // 切换回合
        await room.switchTurn();
        room.broadcast({
            type: 'turn_change',
            currentPlayer: room.currentPlayer,
            turn: room.turn,
            room: room.getInfo()
        });
    }
}

// 处理再来一局
async function handleRematch(ws, message) {
    const { roomCode, playerId } = message;
    const room = rooms.get(roomCode);

    if (!room) return;

    // 重置游戏状态
    room.gameState = 'waiting';
    room.hostReady = false;
    room.guestReady = false;
    room.hostSecret = null;
    room.guestSecret = null;
    room.hostSteps = 0;
    room.guestSteps = 0;
    room.history = [];
    room.turn = 0;
    room.currentPlayer = null;

    await room.syncToRedis();

    room.broadcast({
        type: 'rematch_requested',
        playerId,
        room: room.getInfo()
    });
}

// 处理断开连接
async function handleDisconnect(ws) {
    const client = clients.get(ws);
    if (!client) return;

    const { playerId, roomCode } = client;

    if (roomCode && playerId) {
        const room = rooms.get(roomCode);
        if (room) {
            room.removePlayer(playerId);

            // 同步到Redis
            if (redisConnected) {
                await room.syncToRedis();
            }

            // 通知对手
            const opponentWs = room.getOpponentWs(playerId);
            if (opponentWs) {
                opponentWs.send(JSON.stringify({
                    type: 'player_disconnected',
                    playerId,
                    message: 'Opponent disconnected'
                }));
            }

            // 如果房间空了，延迟删除（允许重连）
            if (room.isEmpty()) {
                setTimeout(async () => {
                    if (room.isEmpty()) {
                        rooms.delete(roomCode);
                        if (redisConnected) {
                            await RoomStore.delete(roomCode);
                        }
                        console.log('房间删除:', roomCode);
                    }
                }, 30000); // 30秒后删除
            }
        }
    }

    clients.delete(ws);
    console.log('连接断开:', playerId, '实例:', INSTANCE_ID);
}

// 心跳检测 + 长时间断线判定
setInterval(async () => {
    const now = Date.now();
    for (const [ws, client] of clients) {
        if (now - client.lastPing > HEARTBEAT_INTERVAL) {
            const { playerId, roomCode } = client;
            console.log('心跳超时，关闭连接:', playerId, '房间:', roomCode);
            
            // 查找房间并判定对方获胜
            if (roomCode) {
                const room = rooms.get(roomCode);
                if (room && room.gameState === 'playing') {
                    // 获取对手ID
                    const opponentId = room.getOpponentId(playerId);
                    const opponentWs = room.getOpponentWs(opponentId);
                    
                    // 游戏结束，断线方判负
                    room.gameState = 'ended';
                    room.clearTurnTimer(); // 清除回合计时器
                    if (redisConnected) {
                        await room.syncToRedis();
                    }
                    
                    // 通知房间内所有人
                    room.broadcast({
                        type: 'game_over',
                        winner: opponentId,
                        reason: 'opponent_disconnected',
                        message: '对方网络断开，您获胜',
                        room: room.getInfo(),
                        history: room.history
                    });
                    
                    console.log('游戏结束（断线）:', roomCode, '获胜者:', opponentId, '原因: 对方网络断开');
                    
                    // 如果对手在线，发送获胜通知
                    if (opponentWs && opponentWs.readyState === WebSocket.OPEN) {
                        opponentWs.send(JSON.stringify({
                            type: 'opponent_disconnected',
                            message: '对方网络断开，您获胜',
                            gameOver: true
                        }));
                    }
                }
            }
            
            ws.terminate();
            clients.delete(ws);
        }
    }
}, HEARTBEAT_INTERVAL);

// 清理空房间
setInterval(async () => {
    const now = Date.now();
    for (const [code, room] of rooms) {
        // 删除超过1小时的空房间
        if (room.isEmpty() && now - room.createdAt > 3600000) {
            rooms.delete(code);
            if (redisConnected) {
                await RoomStore.delete(code);
            }
            console.log('清理旧房间:', code);
        }
    }
}, ROOM_CLEANUP_INTERVAL);

// 启动服务器
async function startServer() {
    // 初始化Redis
    await initRedis();

    server.listen(PORT, () => {
        console.log('='.repeat(60));
        console.log('数字对决 Pro - WebSocket服务器');
        console.log('='.repeat(60));
        console.log('版本:', SERVER_VERSION);
        console.log('实例ID:', INSTANCE_ID);
        console.log('Redis连接:', redisConnected ? '已连接' : '未连接');
        console.log('服务器地址: ws://localhost:' + PORT);
        console.log('健康检查: http://localhost:' + PORT + '/health');
        console.log('='.repeat(60));
    });
}

// 启动
startServer();

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    wss.close(() => {
        server.close(() => {
            process.exit(0);
        });
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, closing server...');
    wss.close(() => {
        server.close(() => {
            process.exit(0);
        });
    });
});
