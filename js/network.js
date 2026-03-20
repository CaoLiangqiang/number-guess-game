/**
 * 网络通信模块
 * 数字对决 Pro - WebSocket 客户端
 */

// 使用统一的日志系统（从 config.js 导出）
// 如果 window.debugLog 不存在（独立运行），则回退到本地实现
const debugLog = typeof window !== 'undefined' && window.debugLog 
    ? window.debugLog 
    : (...args) => {
        const DEBUG = typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost';
        if (DEBUG) console.log('[NPG]', ...args);
    };

const errorLog = typeof window !== 'undefined' && window.errorLog 
    ? window.errorLog 
    : (...args) => console.error('[NPG]', ...args);

class WebSocketClient {
    constructor() {
        this.ws = null;
        this.handlers = {};
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000;
        
        // NPG-01: 断线超时判定
        this.disconnectTime = null;
        this.disconnectTimeout = 30000; // 30秒超时
        this.disconnectTimer = null;
        this.onDisconnectTimeout = null; // 超时回调
        
        // NPG-02: 弱网消息合并
        this.pendingMessages = [];
        this.messageBatchDelay = 500; // 500ms 内合并消息
        this.messageBatchTimer = null;
        this.messageQueue = []; // 消息队列
        
        // 心跳检测
        this.heartbeatInterval = null;
        this.heartbeatIntervalMs = 5000; // 5秒心跳间隔 (NGG-003: 从1秒优化为5秒)
        this.lastPongTime = null;
        this.missedHeartbeats = 0;
        this.maxMissedHeartbeats = 3; // 最大丢失心跳数
    }

    // 连接到 WebSocket 服务器
    connect(url) {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(url);
                
                this.ws.onopen = () => {
                    debugLog('WebSocket connected');
                    this.reconnectAttempts = 0;
                    // NPG-01: 连接成功后停止断线超时计时器
                    this.stopDisconnectTimer();
                    // 启动心跳检测
                    this.startHeartbeat();
                    resolve(true);
                };

                this.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        // 处理 pong 响应
                        if (data.type === 'pong') {
                            this.lastPongTime = Date.now();
                            this.missedHeartbeats = 0;
                            return;
                        }
                        this.handleMessage(data);
                    } catch (e) {
                        errorLog('Failed to parse message:', e);
                    }
                };

                this.ws.onerror = (error) => {
                    errorLog('WebSocket error:', error);
                    reject(error);
                };

                this.ws.onclose = () => {
                    debugLog('WebSocket closed');
                    // 停止心跳
                    this.stopHeartbeat();
                    // NPG-01: 记录断开时间并启动超时判定
                    this.disconnectTime = Date.now();
                    this.startDisconnectTimer();
                    this.attemptReconnect(url);
                };
            } catch (e) {
                reject(e);
            }
        });
    }

    // 启动心跳检测
    startHeartbeat() {
        this.lastPongTime = Date.now();
        this.missedHeartbeats = 0;
        
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        
        this.heartbeatInterval = setInterval(() => {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                this.stopHeartbeat();
                return;
            }
            
            // 发送 ping
            try {
                this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
                this.missedHeartbeats++;
                
                // 检查是否丢失过多心跳
                if (this.missedHeartbeats > this.maxMissedHeartbeats) {
                    debugLog('Too many missed heartbeats, closing connection');
                    this.stopHeartbeat();
                    this.ws.close();
                }
            } catch (e) {
                errorLog('Heartbeat send error:', e);
            }
        }, this.heartbeatIntervalMs);
    }

    // 停止心跳检测
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        this.missedHeartbeats = 0;
    }

    // NPG-01: 启动断线超时计时器
    startDisconnectTimer() {
        if (this.disconnectTimer) {
            clearTimeout(this.disconnectTimer);
        }
        
        this.disconnectTimer = setTimeout(() => {
            if (this.disconnectTime && !this.isConnected()) {
                const elapsed = Date.now() - this.disconnectTime;
                debugLog(`Connection lost for ${elapsed}ms - triggering timeout判定`);
                if (this.onDisconnectTimeout) {
                    this.onDisconnectTimeout(elapsed);
                }
            }
        }, this.disconnectTimeout);
    }

    // NPG-01: 停止断线超时计时器
    stopDisconnectTimer() {
        if (this.disconnectTimer) {
            clearTimeout(this.disconnectTimer);
            this.disconnectTimer = null;
        }
        this.disconnectTime = null;
    }

    // NPG-01: 设置断线超时回调
    setOnDisconnectTimeout(callback) {
        this.onDisconnectTimeout = callback;
    }

    // NPG-02: 批量发送消息
    sendBatch(type, payload) {
        // 添加到待发送队列
        this.pendingMessages.push({ type, payload, timestamp: Date.now() });
        
        // 如果没有批量定时器，启动一个
        if (!this.messageBatchTimer) {
            this.messageBatchTimer = setTimeout(() => {
                this.flushMessageBatch();
            }, this.messageBatchDelay);
        }
    }

    // NPG-02: 刷新消息批次
    flushMessageBatch() {
        if (this.pendingMessages.length === 0) {
            this.messageBatchTimer = null;
            return;
        }

        // 合并消息
        const batchedPayload = {
            messages: [...this.pendingMessages],
            batchCount: this.pendingMessages.length,
            batchTime: Date.now()
        };

        // 发送合并后的消息
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ 
                type: 'batch_messages', 
                payload: batchedPayload 
            }));
            debugLog(`Sent batch of ${this.pendingMessages.length} messages`);
        }

        // 清空待发送队列
        this.pendingMessages = [];
        this.messageBatchTimer = null;
    }

    // NPG-02: 发送消息（支持合并）
    sendWithBatching(type, payload, useBatching = false) {
        if (useBatching) {
            this.sendBatch(type, payload);
        } else {
            return this.send(type, payload);
        }
    }

    // 处理接收到的消息
    handleMessage(data) {
        const { type, payload } = data;
        if (this.handlers[type]) {
            this.handlers[type](payload);
        }
    }

    // 注册消息处理器
    on(type, handler) {
        this.handlers[type] = handler;
    }

    // 移除消息处理器
    off(type) {
        delete this.handlers[type];
    }

    // 发送消息
    send(type, payload) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type, payload }));
            return true;
        }
        return false;
    }

    // 尝试重连
    attemptReconnect(url) {
        // 检查时间窗口和全局重连限制
        const now = Date.now();
        if (!this.reconnectWindowStart) {
            this.reconnectWindowStart = now;
        } else if (now - this.reconnectWindowStart > 60000) {
            // 超过1分钟，重置计数
            this.totalReconnectCount = 0;
            this.reconnectAttempts = 0;
            this.reconnectWindowStart = now;
        }

        // 初始化全局重连计数
        if (this.totalReconnectCount === undefined) {
            this.totalReconnectCount = 0;
            this.maxTotalReconnects = 20;
        }

        // 检查全局限制
        if (this.totalReconnectCount >= this.maxTotalReconnects) {
            errorLog('Reached maximum total reconnect attempts');
            return;
        }

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.totalReconnectCount++;
            debugLog(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            setTimeout(() => {
                this.connect(url).catch(() => {});
            }, this.reconnectDelay * this.reconnectAttempts);
        }
    }

    // 关闭连接
    close() {
        // 停止心跳
        this.stopHeartbeat();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    // 检查连接状态
    isConnected() {
        return !!(this.ws && this.ws.readyState === WebSocket.OPEN);
    }
}

// 房间管理器
class RoomManager {
    constructor() {
        this.playerId = this.generatePlayerId();
        this.wsClient = null;
        this.roomCode = null;
    }

    generatePlayerId() {
        return 'player_' + Math.random().toString(36).substr(2, 9);
    }

    setWebSocketClient(wsClient) {
        this.wsClient = wsClient;
    }

    createRoom(roomCode) {
        this.roomCode = roomCode;
        this.wsClient.send('create_room', { roomCode, playerId: this.playerId });
    }

    joinRoom(roomCode) {
        this.roomCode = roomCode;
        this.wsClient.send('join_room', { roomCode, playerId: this.playerId });
    }

    sendGameAction(action, data) {
        this.wsClient.send('game_action', { roomCode: this.roomCode, playerId: this.playerId, action, data });
    }

    leaveRoom() {
        if (this.roomCode && this.wsClient) {
            this.wsClient.send('leave_room', { roomCode: this.roomCode, playerId: this.playerId });
            this.roomCode = null;
        }
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WebSocketClient, RoomManager };
}