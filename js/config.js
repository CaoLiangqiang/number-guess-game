/**
 * 游戏配置模块
 * 数字对决 Pro - 环境检测与配置
 */

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
        github_pages: 'wss://number-guess-game-bl5r.onrender.com',
        netlify: 'wss://number-guess-game-bl5r.onrender.com',
        production: 'wss://number-guess-game-bl5r.onrender.com'
    },
    
    // 获取当前环境的WebSocket地址
    getWsServer() {
        return this.wsServers[this.environment] || this.wsServers.production;
    },
    
    // 游戏设置
    gameSettings: {
        maxReconnectAttempts: 5,
        heartbeatInterval: 1000,
        turnTimeout: 60, // 回合超时时间（秒）
        roomCodeLength: 6
    },

    // 版本信息
    version: '2.2.1',
    commitHash: '91050ae'
};

// 调试日志开关（生产环境自动关闭）
const DEBUG = GameConfig.environment === 'development';

function debugLog(...args) {
    if (DEBUG) {
        console.log('[NPG]', ...args);
    }
}

function errorLog(...args) {
    console.error('[NPG]', ...args);
}

// 导出配置供其他模块使用
window.GameConfig = GameConfig;
window.DEBUG = DEBUG;
window.debugLog = debugLog;
window.errorLog = errorLog;

// CommonJS 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameConfig, DEBUG, debugLog, errorLog };
}