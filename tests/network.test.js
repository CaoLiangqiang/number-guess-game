/**
 * 网络通信模块单元测试
 */

// Mock WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 0; // CONNECTING
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this.onclose = null;
  }

  static get OPEN() { return 1; }
  static get CONNECTING() { return 0; }
  static get CLOSED() { return 3; }

  send(data) {
    this.lastSentData = data;
  }

  close() {
    this.readyState = 3; // CLOSED
    if (this.onclose) this.onclose();
  }

  // 模拟连接成功
  simulateOpen() {
    this.readyState = 1; // OPEN
    if (this.onopen) this.onopen();
  }

  // 模拟接收消息
  simulateMessage(data) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) });
    }
  }

  // 模拟错误
  simulateError(error) {
    if (this.onerror) this.onerror(error);
  }

  // 模拟关闭
  simulateClose() {
    this.readyState = 3; // CLOSED
    if (this.onclose) this.onclose();
  }
}

// 在测试环境中替换 WebSocket
global.WebSocket = MockWebSocket;

const { WebSocketClient } = require('../js/network.js');

describe('WebSocketClient', () => {
  let client;

  beforeEach(() => {
    client = new WebSocketClient();
  });

  describe('连接功能', () => {
    test('应该能够创建连接', async () => {
      const connectPromise = client.connect('ws://localhost:8080');
      
      // 模拟连接成功
      setTimeout(() => {
        client.ws.simulateOpen();
      }, 10);

      const result = await connectPromise;
      expect(result).toBe(true);
    });

    test('连接成功后应该重置重连计数', async () => {
      client.reconnectAttempts = 3;
      const connectPromise = client.connect('ws://localhost:8080');
      
      setTimeout(() => {
        client.ws.simulateOpen();
      }, 10);

      await connectPromise;
      expect(client.reconnectAttempts).toBe(0);
    });
  });

  describe('消息处理', () => {
    beforeEach(async () => {
      const connectPromise = client.connect('ws://localhost:8080');
      setTimeout(() => {
        client.ws.simulateOpen();
      }, 10);
      await connectPromise;
    });

    test('应该能够发送消息', () => {
      const result = client.send('test', { data: 'hello' });
      expect(result).toBe(true);
      expect(client.ws.lastSentData).toBeDefined();
      
      const sentData = JSON.parse(client.ws.lastSentData);
      expect(sentData.type).toBe('test');
      expect(sentData.payload.data).toBe('hello');
    });

    test('未连接时发送消息应该返回false', () => {
      client.ws.readyState = 3; // CLOSED
      const result = client.send('test', { data: 'hello' });
      expect(result).toBe(false);
    });

    test('应该能够注册消息处理器', () => {
      const handler = jest.fn();
      client.on('test_event', handler);
      
      client.ws.simulateMessage({ type: 'test_event', payload: { data: 'test_data' } });
      
      expect(handler).toHaveBeenCalledWith({ data: 'test_data' });
    });

    test('应该能够处理多个处理器', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      client.on('event1', handler1);
      client.on('event2', handler2);
      
      client.ws.simulateMessage({ type: 'event1', payload: { data: 'data1' } });
      client.ws.simulateMessage({ type: 'event2', payload: { data: 'data2' } });
      
      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    test('应该能够移除消息处理器', () => {
      const handler = jest.fn();
      client.on('test_event', handler);
      client.off('test_event');
      
      client.ws.simulateMessage({ type: 'test_event', payload: { data: 'test_data' } });
      
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('断线超时功能', () => {
    test('连接断开后应该启动超时计时器', async () => {
      const connectPromise = client.connect('ws://localhost:8080');
      setTimeout(() => {
        client.ws.simulateOpen();
      }, 10);
      await connectPromise;

      // 模拟断开连接
      client.ws.simulateClose();

      expect(client.disconnectTime).toBeDefined();
      expect(client.disconnectTimer).not.toBeNull();
    });

    test('超时后应该调用超时回调', async () => {
      const timeoutCallback = jest.fn();
      client.onDisconnectTimeout = timeoutCallback;
      client.disconnectTimeout = 100; // 缩短超时时间用于测试

      const connectPromise = client.connect('ws://localhost:8080');
      setTimeout(() => {
        client.ws.simulateOpen();
      }, 10);
      await connectPromise;

      // 模拟断开连接
      client.ws.simulateClose();

      // 等待超时
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(timeoutCallback).toHaveBeenCalled();
    });
  });

  describe('重连机制', () => {
    test('重连次数不应该超过最大限制', () => {
      expect(client.maxReconnectAttempts).toBe(5);
    });

    test('重连延迟应该合理', () => {
      expect(client.reconnectDelay).toBeGreaterThanOrEqual(1000);
      expect(client.reconnectDelay).toBeLessThanOrEqual(10000);
    });
  });

  describe('消息队列', () => {
    test('应该有消息队列功能', () => {
      expect(client.messageQueue).toBeDefined();
      expect(Array.isArray(client.messageQueue)).toBe(true);
    });

    test('应该有待发送消息数组', () => {
      expect(client.pendingMessages).toBeDefined();
      expect(Array.isArray(client.pendingMessages)).toBe(true);
    });
  });

  describe('断开连接', () => {
    test('应该能够关闭连接', async () => {
      const connectPromise = client.connect('ws://localhost:8080');
      setTimeout(() => {
        client.ws.simulateOpen();
      }, 10);
      await connectPromise;

      client.close();
      expect(client.ws).toBeNull();
    });

    test('close 后 ws 应该为 null', async () => {
      const connectPromise = client.connect('ws://localhost:8080');
      setTimeout(() => {
        client.ws.simulateOpen();
      }, 10);
      await connectPromise;

      client.close();
      expect(client.ws).toBeNull();
    });
  });

  describe('连接状态检查', () => {
    test('未连接时 isConnected 应该返回 false', () => {
      // client.ws 为 null，应该返回 false
      expect(client.isConnected()).toBe(false);
    });

    test('连接后 isConnected 应该返回 true', async () => {
      const connectPromise = client.connect('ws://localhost:8080');
      setTimeout(() => {
        client.ws.simulateOpen();
      }, 10);
      await connectPromise;

      expect(client.isConnected()).toBe(true);
    });
  });
});

describe('网络工具函数', () => {
  test('断线超时时间应该是30秒', () => {
    const client = new WebSocketClient();
    expect(client.disconnectTimeout).toBe(30000);
  });

  test('消息合并延迟应该是500ms', () => {
    const client = new WebSocketClient();
    expect(client.messageBatchDelay).toBe(500);
  });
});