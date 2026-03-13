/**
 * 本地存储模块
 * 数字对决 Pro - localStorage 封装
 */

const StorageManager = {
    // 游戏统计
    GAME_STATS_KEY: 'gameStats',
    // 游戏记录历史
    GAME_HISTORY_KEY: 'gameHistory',
    // 最大保存记录数
    MAX_HISTORY_RECORDS: 50,

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

    // ========== 游戏记录历史 ==========

    /**
     * 获取游戏记录历史
     * @returns {Array} 游戏记录数组
     */
    getGameHistory() {
        const history = localStorage.getItem(this.GAME_HISTORY_KEY);
        if (history) {
            return JSON.parse(history);
        }
        return [];
    },

    /**
     * 添加游戏记录
     * @param {Object} record - 游戏记录对象
     * @param {string} record.mode - 游戏模式 ('ai' | 'online')
     * @param {string} record.result - 游戏结果 ('win' | 'lose')
     * @param {number} record.rounds - 回合数
     * @param {string} record.playerNumber - 玩家的秘密数字
     * @param {string} record.opponentNumber - 对手的秘密数字
     * @param {Array} record.guesses - 猜测历史
     * @param {number} record.duration - 游戏时长(秒)
     */
    addGameRecord(record) {
        const history = this.getGameHistory();
        
        // 添加时间戳
        const newRecord = {
            ...record,
            id: Date.now(),
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString('zh-CN'),
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        };
        
        // 添加到历史开头
        history.unshift(newRecord);
        
        // 限制记录数量
        if (history.length > this.MAX_HISTORY_RECORDS) {
            history.pop();
        }
        
        localStorage.setItem(this.GAME_HISTORY_KEY, JSON.stringify(history));
        return newRecord;
    },

    /**
     * 获取最近的游戏记录
     * @param {number} count - 获取数量
     * @returns {Array} 游戏记录数组
     */
    getRecentGames(count = 10) {
        const history = this.getGameHistory();
        return history.slice(0, count);
    },

    /**
     * 获取游戏统计摘要
     * @returns {Object} 统计摘要
     */
    getGameSummary() {
        const history = this.getGameHistory();
        const stats = this.getGameStats();
        
        // 计算连胜/连败
        let currentStreak = 0;
        let streakType = null;
        for (const record of history) {
            if (streakType === null) {
                streakType = record.result;
                currentStreak = 1;
            } else if (record.result === streakType) {
                currentStreak++;
            } else {
                break;
            }
        }
        
        // 计算平均回合数
        const avgRounds = history.length > 0 
            ? Math.round(history.reduce((sum, r) => sum + r.rounds, 0) / history.length)
            : 0;
        
        // 计算各模式胜率
        const aiGames = history.filter(r => r.mode === 'ai');
        const onlineGames = history.filter(r => r.mode === 'online');
        
        return {
            ...stats,
            winRate: this.getWinRate(),
            currentStreak,
            streakType,
            avgRounds,
            aiGames: aiGames.length,
            aiWins: aiGames.filter(r => r.result === 'win').length,
            onlineGames: onlineGames.length,
            onlineWins: onlineGames.filter(r => r.result === 'win').length,
            totalHistoryGames: history.length
        };
    },

    /**
     * 清空游戏历史
     */
    clearHistory() {
        localStorage.removeItem(this.GAME_HISTORY_KEY);
    },

    // ========== 通用方法 ==========

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