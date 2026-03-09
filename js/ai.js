/**
 * AI 算法模块
 * 数字对决 Pro - Minimax + 信息熵 AI
 */

class NumberGuessingAI {
    constructor() {
        this.aiPossibleNumbers = [];
        this.initializePossibleNumbers();
    }

    // 初始化所有可能的4位数字（数字不重复）
    initializePossibleNumbers() {
        this.aiPossibleNumbers = [];
        for (let i = 0; i <= 9876; i++) {
            const num = i.toString().padStart(4, '0');
            if (this.hasUniqueDigits(num)) {
                this.aiPossibleNumbers.push(num);
            }
        }
    }

    // 检查数字是否各位都不相同
    hasUniqueDigits(num) {
        const digits = num.split('');
        return new Set(digits).size === 4;
    }

    // 计算猜测数字与目标数字的匹配结果
    calculateMatch(guess, target) {
        let correct = 0;
        for (let i = 0; i < 4; i++) {
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

    // 使用 Minimax + 信息熵算法选择最佳猜测
    selectBestGuess() {
        if (this.aiPossibleNumbers.length === 1) {
            return this.aiPossibleNumbers[0];
        }

        let bestGuess = this.aiPossibleNumbers[0];
        let minMaxSize = Infinity;
        let topChoices = [];
        const candidates = this.aiPossibleNumbers.length <= 100 
            ? this.aiPossibleNumbers 
            : this.generateSampleCandidates();

        for (let i = 0; i < Math.min(candidates.length, 50); i++) {
            const guess = candidates[i];
            const distribution = new Array(5).fill(0);

            for (const possible of this.aiPossibleNumbers) {
                const match = this.calculateMatch(guess, possible);
                distribution[match]++;
            }

            const maxBucket = Math.max(...distribution);
            const score = maxBucket;

            if (score < minMaxSize) {
                minMaxSize = score;
                bestGuess = guess;
            }

            if (i < 5) {
                topChoices.push({
                    guess: guess,
                    maxBucket: maxBucket,
                    entropy: this.calculateEntropy(distribution)
                });
            }
        }

        if (!this.aiPossibleNumbers.includes(bestGuess) && this.aiPossibleNumbers.length < 6) {
            bestGuess = this.aiPossibleNumbers[0];
        }

        return bestGuess;
    }

    // 生成候选样本
    generateSampleCandidates() {
        const step = Math.ceil(this.aiPossibleNumbers.length / 50);
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

    // 重置 AI
    reset() {
        this.initializePossibleNumbers();
    }

    // 获取可能数字的数量
    getPossibleCount() {
        return this.aiPossibleNumbers.length;
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NumberGuessingAI };
}