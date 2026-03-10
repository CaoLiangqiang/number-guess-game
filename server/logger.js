/**
 * 日志工具 - 数字对决 Pro
 * 生产环境可集成 Winston 等专业日志库
 */

const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

// 默认日志级别（生产环境只记录 WARN 和 ERROR）
const DEFAULT_LEVEL = process.env.NODE_ENV === 'production' ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;

const logger = {
    level: DEFAULT_LEVEL,
    
    _format(level, ...args) {
        const timestamp = new Date().toISOString();
        return [`[${timestamp}] [${level}]`, ...args];
    },
    
    debug(...args) {
        if (this.level <= LOG_LEVELS.DEBUG) {
            console.log(...this._format('DEBUG', ...args));
        }
    },
    
    info(...args) {
        if (this.level <= LOG_LEVELS.INFO) {
            console.log(...this._format('INFO', ...args));
        }
    },
    
    warn(...args) {
        if (this.level <= LOG_LEVELS.WARN) {
            console.warn(...this._format('WARN', ...args));
        }
    },
    
    error(...args) {
        if (this.level <= LOG_LEVELS.ERROR) {
            console.error(...this._format('ERROR', ...args));
        }
    }
};

module.exports = logger;