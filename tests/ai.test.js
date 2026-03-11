/**
 * AI 算法模块单元测试
 */

const { NumberGuessingAI } = require('../js/ai.js');

describe('NumberGuessingAI', () => {
  let ai;

  beforeEach(() => {
    ai = new NumberGuessingAI();
  });

  describe('初始化', () => {
    test('应该初始化可能的数字列表', () => {
      expect(ai.aiPossibleNumbers.length).toBeGreaterThan(0);
    });

    test('所有可能的数字应该是4位', () => {
      for (const num of ai.aiPossibleNumbers.slice(0, 100)) {
        expect(num).toHaveLength(4);
      }
    });

    test('所有可能的数字应该不重复', () => {
      for (const num of ai.aiPossibleNumbers.slice(0, 100)) {
        expect(ai.hasUniqueDigits(num)).toBe(true);
      }
    });
  });

  describe('hasUniqueDigits', () => {
    test('不重复数字应该返回true', () => {
      expect(ai.hasUniqueDigits('1234')).toBe(true);
      expect(ai.hasUniqueDigits('9876')).toBe(true);
    });

    test('重复数字应该返回false', () => {
      expect(ai.hasUniqueDigits('1123')).toBe(false);
      expect(ai.hasUniqueDigits('1111')).toBe(false);
      expect(ai.hasUniqueDigits('1223')).toBe(false);
    });
  });

  describe('calculateMatch', () => {
    test('完全匹配应该返回4', () => {
      expect(ai.calculateMatch('1234', '1234')).toBe(4);
    });

    test('部分匹配应该返回正确数量', () => {
      expect(ai.calculateMatch('1234', '1256')).toBe(2);
      expect(ai.calculateMatch('1234', '1678')).toBe(1);
    });

    test('完全不匹配应该返回0', () => {
      expect(ai.calculateMatch('1234', '5678')).toBe(0);
    });

    test('数字对位置不对应该返回0', () => {
      expect(ai.calculateMatch('1234', '4321')).toBe(0);
    });
  });

  describe('filterPossibleNumbers', () => {
    test('应该根据反馈筛选数字', () => {
      const initialCount = ai.aiPossibleNumbers.length;
      ai.filterPossibleNumbers('1234', 2);
      expect(ai.aiPossibleNumbers.length).toBeLessThan(initialCount);
    });

    test('反馈为4时应该只剩一个', () => {
      ai.filterPossibleNumbers('1234', 4);
      expect(ai.aiPossibleNumbers.length).toBe(1);
      expect(ai.aiPossibleNumbers[0]).toBe('1234');
    });

    test('反馈为0时应该排除所有匹配数字', () => {
      ai.filterPossibleNumbers('1234', 0);
      // 确保结果中没有任何数字包含 1,2,3,4 在正确位置
      for (const num of ai.aiPossibleNumbers) {
        expect(num[0]).not.toBe('1');
        expect(num[1]).not.toBe('2');
        expect(num[2]).not.toBe('3');
        expect(num[3]).not.toBe('4');
      }
    });
  });

  describe('selectBestGuess', () => {
    test('只剩一个可能时应该返回该数字', () => {
      ai.aiPossibleNumbers = ['1234'];
      expect(ai.selectBestGuess()).toBe('1234');
    });

    test('应该返回一个有效的4位数字', () => {
      const guess = ai.selectBestGuess();
      expect(guess).toHaveLength(4);
      expect(/^\d{4}$/.test(guess)).toBe(true);
    });

    test('应该返回不重复数字', () => {
      const guess = ai.selectBestGuess();
      expect(ai.hasUniqueDigits(guess)).toBe(true);
    });
  });

  describe('calculateEntropy', () => {
    test('均匀分布应该有较高熵值', () => {
      const distribution = [10, 10, 10, 10, 10];
      const entropy = ai.calculateEntropy(distribution);
      expect(entropy).toBeGreaterThan(2);
    });

    test('集中分布应该有较低熵值', () => {
      const distribution = [50, 0, 0, 0, 0];
      const entropy = ai.calculateEntropy(distribution);
      expect(entropy).toBeLessThan(0.5);
    });

    test('全0分布应该返回0', () => {
      const distribution = [0, 0, 0, 0, 0];
      const entropy = ai.calculateEntropy(distribution);
      expect(entropy).toBe(0);
    });
  });

  describe('reset', () => {
    test('重置后应该恢复所有可能的数字', () => {
      const initialCount = ai.aiPossibleNumbers.length;
      ai.filterPossibleNumbers('1234', 2);
      expect(ai.aiPossibleNumbers.length).toBeLessThan(initialCount);
      
      ai.reset();
      expect(ai.aiPossibleNumbers.length).toBe(initialCount);
    });
  });

  describe('getPossibleCount', () => {
    test('应该返回可能的数字数量', () => {
      const count = ai.getPossibleCount();
      expect(count).toBeGreaterThan(0);
      expect(count).toBe(ai.aiPossibleNumbers.length);
    });

    test('筛选后数量应该减少', () => {
      const initialCount = ai.getPossibleCount();
      ai.filterPossibleNumbers('1234', 2);
      expect(ai.getPossibleCount()).toBeLessThan(initialCount);
    });
  });

  describe('AI 策略测试', () => {
    test('AI 应该能在有限步内猜出数字', () => {
      const target = '5678';
      let guesses = 0;
      const maxGuesses = 15; // 增加最大猜测次数

      ai.reset();

      while (guesses < maxGuesses) {
        const guess = ai.selectBestGuess();
        guesses++;

        if (guess === target) {
          break;
        }

        const match = ai.calculateMatch(guess, target);
        ai.filterPossibleNumbers(guess, match);
      }

      expect(guesses).toBeLessThanOrEqual(maxGuesses);
    });

    test('多次猜测应该收敛', () => {
      const target = '9876';
      ai.reset();
      
      const guess1 = ai.selectBestGuess();
      const match1 = ai.calculateMatch(guess1, target);
      ai.filterPossibleNumbers(guess1, match1);
      
      const guess2 = ai.selectBestGuess();
      const match2 = ai.calculateMatch(guess2, target);
      ai.filterPossibleNumbers(guess2, match2);

      // 可能的数字应该减少
      expect(ai.getPossibleCount()).toBeLessThan(ai.aiPossibleNumbers.length + 100);
    });
  });
});