/**
 * AI 算法模块
 * 数字对决 Pro - Minimax + 信息熵 AI
 * 
 * NGG-003: AI 算法优化
 * - 使用信息熵算法自动选择最佳开局猜测
 * - 支持不同位数的游戏（3-5位）
 * - 预计算最佳开局猜测以提高性能
 */

class NumberGuessingAI {
    constructor(digitCount = 4) {
        this.digitCount = digitCount;
        this.aiPossibleNumbers = [];
        this.guessHistory = [];
        this.initializePossibleNumbers();
        
        // NGG-003: 预计算的最佳开局猜测（信息熵最优）
        // 对于 Bulls and Cows 游戏，包含重复数字的开局更优
        // 因为可以获得更多位置信息
        this.optimalOpenings = {
            3: '012',   // 3位: 无重复数字最佳开局
            4: '0011',  // 4位: 两个重复数字最优（Knuth算法推荐）
            5: '00112'  // 5位: 两个重复数字最优
        };
    }

    // 初始化所有可能的数字
    initializePossibleNumbers() {
        this.aiPossibleNumbers = [];
        const maxNum = Math.pow(10, this.digitCount);
        
        for (let i = 0; i < maxNum; i++) {
            const num = i.toString().padStart(this.digitCount, '0');
            // 对于4位游戏，要求数字不重复；其他位数允许更灵活的策略
            if (this.digitCount === 4) {
                if (this.hasUniqueDigits(num)) {
                    this.aiPossibleNumbers.push(num);
                }
            } else {
                // 对于非标准位数，使用更宽松的规则
                this.aiPossibleNumbers.push(num);
            }
        }
        
        this.guessHistory = [];
    }

    // 检查数字是否各位都不相同
    hasUniqueDigits(num) {
        const digits = num.split('');
        return new Set(digits).size === this.digitCount;
    }

    // 计算猜测数字与目标数字的匹配结果
    calculateMatch(guess, target) {
        let correct = 0;
        for (let i = 0; i < this.digitCount; i++) {
            if (guess[i] === target[i]) {
                correct++;
            }
        }
        return correct;
    }

    // 根据反馈筛选可能的数字
    filterPossibleNumbers(guess, feedback) {
        this.aiPossibleNumbers = this.aiPossibleNumbers.filter(possible => {
            return this.calculateMatch(guess, possible) === feedback;
        });
    }

    /**
     * NGG-003: 选择最佳开局猜测
     * 根据信息熵计算最优开局，或使用预计算的开局
     * @returns {string} 最佳开局猜测
     */
    selectOpeningGuess() {
        // 如果有预计算的最佳开局，使用它
        if (this.optimalOpenings[this.digitCount]) {
            return this.optimalOpenings[this.digitCount];
        }
        
        // 否则，使用 Minimax 计算最佳开局
        // 对于第一次猜测，我们选择能最大化信息熵的猜测
        return this.selectBestGuess(true);
    }

    /**
     * NGG-003: 使用 Minimax + 信息熵算法选择最佳猜测
     * @param {boolean} isOpening - 是否为开局猜测
     * @returns {string} 最佳猜测
     */
    selectBestGuess(isOpening = false) {
        if (this.aiPossibleNumbers.length === 1) {
            return this.aiPossibleNumbers[0];
        }

        // NGG-003: 如果是开局且没有历史，使用预计算的最佳开局
        if (isOpening && this.guessHistory.length === 0 && this.optimalOpenings[this.digitCount]) {
            return this.optimalOpenings[this.digitCount];
        }

        let bestGuess = this.aiPossibleNumbers[0];
        let minMaxSize = Infinity;
        let maxEntropy = -Infinity;
        
        // 根据可能数字数量调整候选集大小
        const candidateSize = this.aiPossibleNumbers.length <= 100 
            ? this.aiPossibleNumbers.length 
            : Math.min(50, Math.ceil(this.aiPossibleNumbers.length / 10));
            
        const candidates = this.aiPossibleNumbers.length <= 100 
            ? this.aiPossibleNumbers 
            : this.generateSampleCandidates(candidateSize);

        for (let i = 0; i < Math.min(candidates.length, candidateSize); i++) {
            const guess = candidates[i];
            const distribution = new Array(this.digitCount + 1).fill(0);

            for (const possible of this.aiPossibleNumbers) {
                const match = this.calculateMatch(guess, possible);
                distribution[match]++;
            }

            const maxBucket = Math.max(...distribution);
            const entropy = this.calculateEntropy(distribution);
            
            // NGG-003: 综合考虑最大分桶大小和信息熵
            // 最小化最大分桶（减少最坏情况）+ 最大化信息熵
            const score = maxBucket - entropy * 0.1; // 信息熵作为调节因子

            if (score < minMaxSize) {
                minMaxSize = score;
                bestGuess = guess;
                maxEntropy = entropy;
            }
        }

        // 如果最佳猜测不在可能列表中且列表较小，选择第一个可能数字
        if (!this.aiPossibleNumbers.includes(bestGuess) && this.aiPossibleNumbers.length < 6) {
            bestGuess = this.aiPossibleNumbers[0];
        }

        return bestGuess;
    }

    // 生成候选样本
    generateSampleCandidates(sampleSize = 50) {
        const step = Math.max(1, Math.ceil(this.aiPossibleNumbers.length / sampleSize));
        const samples = [];
        for (let i = 0; i < this.aiPossibleNumbers.length; i += step) {
            samples.push(this.aiPossibleNumbers[i]);
        }
        return samples;
    }

    // 计算信息熵
    calculateEntropy(distribution) {
        let entropy = 0;
        const total = distribution.reduce((a, b) => a + b, 0);
        for (const count of distribution) {
            if (count > 0) {
                const p = count / total;
                entropy -= p * Math.log2(p);
            }
        }
        return entropy;
    }

    /**
     * NGG-003: 记录猜测历史
     * @param {string} guess - 猜测的数字
     * @param {number} feedback - 反馈结果（正确位置数）
     */
    recordGuess(guess, feedback) {
        this.guessHistory.push({ guess, feedback });
    }

    /**
     * NGG-003: 重置 AI（支持不同位数）
     * @param {number} digitCount - 数字位数
     */
    reset(digitCount = null) {
        if (digitCount !== null) {
            this.digitCount = digitCount;
        }
        this.initializePossibleNumbers();
    }

    // 获取可能数字的数量
    getPossibleCount() {
        return this.aiPossibleNumbers.length;
    }
    
    /**
     * NGG-003: 获取当前位数
     */
    getDigitCount() {
        return this.digitCount;
    }
    
    /**
     * NGG-003: 获取猜测历史
     */
    getHistory() {
        return [...this.guessHistory];
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NumberGuessingAI };
}