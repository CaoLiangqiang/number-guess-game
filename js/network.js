/**
 * 网络通信模块
 * 数字对决 Pro - WebSocket 客户端
 */

class WebSocketClient {
    constructor() {
        this.ws = null;
        this.handlers = {};
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000;
    }

    // 连接到 WebSocket 服务器
    connect(url) {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(url);
                
                this.ws.onopen = () => {
                    console.log('WebSocket connected');
                    this.reconnectAttempts = 0;
                    resolve(true);
                };

                this.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.handleMessage(data);
                    } catch (e) {
                        console.error('Failed to parse message:', e);
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    reject(error);
                };

                this.ws.onclose = () => {
                    console.log('WebSocket closed');
                    this.attemptReconnect(url);
                };
            } catch (e) {
                reject(e);
            }
        });
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
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            setTimeout(() => {
                this.connect(url).catch(() => {});
            }, this.reconnectDelay * this.reconnectAttempts);
        }
    }

    // 关闭连接
    close() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    // 检查连接状态
    isConnected() {
        return this.ws && this.ws.readyState === WebSocket.OPEN;
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