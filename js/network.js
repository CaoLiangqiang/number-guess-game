/**
 * 网络通信模块
 * 数字对决 Pro - WebSocket 客户端
 */

// 使用统一的日志系统（从 config.js 导出）
// 使用不同变量名避免与 config.js 冲突
const netDebugLog = typeof window !== 'undefined' && window.debugLog
    ? window.debugLog
    : (...args) => {
        if (window.location && window.location.hostname === 'localhost') {
            console.log('[NPG]', ...args);
        }
    };

const netErrorLog = typeof window !== 'undefined' && window.errorLog
    ? window.errorLog
    : (...args) => console.error('[NPG]', ...args);

class WebSocketClient {
    constructor(serverUrl = null) {
        this.serverUrl = serverUrl;
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
        this.onReconnectStatus = null; // 重连状态回调

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

        // 网络质量
        this.networkQuality = 'good';
        this.pingHistory = [];

        // 全局重连限制
        this.totalReconnectCount = 0;
        this.maxTotalReconnects = 20;
        this.reconnectWindowStart = null;
        this.reconnectWindowDuration = 60000;
    }

    // 连接到 WebSocket 服务器
    connect(url = null) {
        // 支持无参数调用，使用构造时的serverUrl
        const targetUrl = url || this.serverUrl;
        if (!targetUrl) {
            return Promise.reject(new Error('No server URL provided'));
        }
        this.serverUrl = targetUrl;

        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(targetUrl);
                
                this.ws.onopen = () => {
                    netDebugLog('WebSocket connected');
                    // 通知重连成功
                    if (this.reconnectAttempts > 0 && this.onReconnectStatus) {
                        this.onReconnectStatus('success');
                    }
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
                        netErrorLog('Failed to parse message:', e);
                    }
                };

                this.ws.onerror = (error) => {
                    netErrorLog('WebSocket error:', error);
                    reject(error);
                };

                this.ws.onclose = () => {
                    netDebugLog('WebSocket closed');
                    // 停止心跳
                    this.stopHeartbeat();
                    // NPG-01: 记录断开时间并启动超时判定
                    this.disconnectTime = Date.now();
                    this.startDisconnectTimer();
                    this.attemptReconnect();
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

                // 更新网络质量
                this.updateNetworkQuality();

                // 检查是否丢失过多心跳
                if (this.missedHeartbeats > this.maxMissedHeartbeats) {
                    netDebugLog('Too many missed heartbeats, closing connection');
                    this.stopHeartbeat();
                    this.ws.close();
                }
            } catch (e) {
                netErrorLog('Heartbeat send error:', e);
            }
        }, this.heartbeatIntervalMs);
    }

    // 更新网络质量
    updateNetworkQuality() {
        const missed = this.missedHeartbeats;
        let quality = 'good';
        let label = '网络良好';
        let color = 'bg-green-400';

        if (missed >= 2) {
            quality = 'poor';
            label = '网络较差';
            color = 'bg-red-400';
        } else if (missed >= 1) {
            quality = 'fair';
            label = '网络一般';
            color = 'bg-yellow-400';
        }

        if (quality !== this.networkQuality) {
            this.networkQuality = quality;
            // 触发网络状态变化回调
            if (this.onNetworkQualityChange) {
                this.onNetworkQualityChange(quality, label, color);
            }
        }
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
                netDebugLog(`Connection lost for ${elapsed}ms - triggering timeout判定`);
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
            netDebugLog(`Sent batch of ${this.pendingMessages.length} messages`);
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
        const { type, payload, ...rest } = data;
        if (this.handlers[type]) {
            // 传递完整的数据对象（兼容 payload 和其他字段格式）
            this.handlers[type](payload !== undefined ? payload : rest);
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

    // 发送消息（支持两种调用方式）
    send(typeOrMessage, payload = null) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return false;
        }

        let message;
        if (typeof typeOrMessage === 'string') {
            // 方式1: send(type, payload)
            message = { type: typeOrMessage, payload };
        } else if (typeof typeOrMessage === 'object') {
            // 方式2: send({ type: '...', ... })
            message = typeOrMessage;
        } else {
            return false;
        }

        this.ws.send(JSON.stringify(message));
        return true;
    }

    // 尝试重连
    attemptReconnect(url = null) {
        const targetUrl = url || this.serverUrl;
        if (!targetUrl) return;

        // 检查时间窗口和全局重连限制
        const now = Date.now();
        if (!this.reconnectWindowStart) {
            this.reconnectWindowStart = now;
        } else if (now - this.reconnectWindowStart > this.reconnectWindowDuration) {
            // 超过时间窗口，重置计数
            this.totalReconnectCount = 0;
            this.reconnectAttempts = 0;
            this.reconnectWindowStart = now;
        }

        // 检查全局限制
        if (this.totalReconnectCount >= this.maxTotalReconnects) {
            netErrorLog('Reached maximum total reconnect attempts');
            if (this.onReconnectStatus) {
                this.onReconnectStatus('failed');
            }
            return;
        }

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.totalReconnectCount++;
            netDebugLog(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

            // 通知重连状态
            if (this.onReconnectStatus) {
                this.onReconnectStatus('reconnecting', this.reconnectAttempts, this.maxReconnectAttempts);
            }

            setTimeout(() => {
                this.connect(targetUrl).catch(() => {});
            }, this.reconnectDelay * this.reconnectAttempts);
        } else {
            // 单次重连次数达到上限
            if (this.onReconnectStatus) {
                this.onReconnectStatus('failed');
            }
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

// RoomManager 在 app.js 中定义，此处不再重复定义

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WebSocketClient };
}

// 浏览器全局导出
if (typeof window !== 'undefined') {
    window.WebSocketClient = WebSocketClient;
}