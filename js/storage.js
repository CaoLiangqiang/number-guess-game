/**
 * 本地存储模块
 * 数字对决 Pro - localStorage 封装
 */

const StorageManager = {
    // 游戏统计
    GAME_STATS_KEY: 'gameStats',

    // 获取游戏统计
    getGameStats() {
        const stats = localStorage.getItem(this.GAME_STATS_KEY);
        if (stats) {
            return JSON.parse(stats);
        }
        return { wins: 0, losses: 0, totalGames: 0 };
    },

    // 保存游戏结果
    saveGameResult(winner) {
        const stats = this.getGameStats();
        stats.totalGames++;
        if (winner === 'player') {
            stats.wins++;
        } else {
            stats.losses++;
        }
        localStorage.setItem(this.GAME_STATS_KEY, JSON.stringify(stats));
        return stats;
    },

    // 获取胜率
    getWinRate() {
        const stats = this.getGameStats();
        if (stats.totalGames === 0) return 0;
        return Math.round((stats.wins / stats.totalGames) * 100);
    },

    // 清空统计
    clearStats() {
        localStorage.removeItem(this.GAME_STATS_KEY);
    },

    // 设置项
    setItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
            return false;
        }
    },

    // 获取项
    getItem(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : defaultValue;
        } catch (e) {
            console.error('Failed to read from localStorage:', e);
            return defaultValue;
        }
    },

    // 移除项
    removeItem(key) {
        localStorage.removeItem(key);
    },

    // 清空所有
    clear() {
        localStorage.clear();
    }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StorageManager };
}