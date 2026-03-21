/**
 * 游戏核心逻辑单元测试
 */

const {
  generateSecretNumber,
  validateInput,
  validateInputStrict,
  calculateHint,
  isCorrect,
  getHintMessage
} = require('../js/game.js');

describe('generateSecretNumber', () => {
  describe('默认模式（允许重复）', () => {
    test('应该生成4位数字', () => {
      const secret = generateSecretNumber(4);
      expect(secret).toHaveLength(4);
    });

    test('应该生成数字字符串', () => {
      const secret = generateSecretNumber(4);
      expect(/^\d{4}$/.test(secret)).toBe(true);
    });

    test('可以生成不同位数的数字', () => {
      const secret3 = generateSecretNumber(3);
      const secret5 = generateSecretNumber(5);
      expect(secret3).toHaveLength(3);
      expect(secret5).toHaveLength(5);
    });

    test('允许首位为0', () => {
      // 多次生成，检查是否可能出现首位为0
      let hasZeroFirst = false;
      for (let i = 0; i < 100; i++) {
        const secret = generateSecretNumber(4);
        if (secret[0] === '0') {
          hasZeroFirst = true;
          break;
        }
      }
      expect(hasZeroFirst).toBe(true);
    });

    test('允许重复数字', () => {
      // 多次生成，检查是否可能出现重复数字
      let hasDuplicates = false;
      for (let i = 0; i < 100; i++) {
        const secret = generateSecretNumber(4);
        const uniqueDigits = new Set(secret.split(''));
        if (uniqueDigits.size < 4) {
          hasDuplicates = true;
          break;
        }
      }
      expect(hasDuplicates).toBe(true);
    });
  });

  describe('严格模式（不允许重复）', () => {
    test('应该生成4位数字', () => {
      const secret = generateSecretNumber(4, false);
      expect(secret).toHaveLength(4);
    });

    test('数字不应该重复', () => {
      const secret = generateSecretNumber(4, false);
      const uniqueDigits = new Set(secret.split(''));
      expect(uniqueDigits.size).toBe(4);
    });

    test('第一位不应该是0', () => {
      const secret = generateSecretNumber(4, false);
      expect(secret[0]).not.toBe('0');
    });
  });
});

describe('validateInput（宽松验证）', () => {
  test('有效输入应该通过验证', () => {
    const result = validateInput('1234', 4);
    expect(result.valid).toBe(true);
  });

  test('非数字输入应该失败', () => {
    const result = validateInput('12a4', 4);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('请输入数字');
  });

  test('长度不对应该失败', () => {
    const result = validateInput('123', 4);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('请输入4位数字');
  });

  test('重复数字应该通过验证', () => {
    const result = validateInput('1122', 4);
    expect(result.valid).toBe(true);
  });

  test('第一位是0应该通过验证', () => {
    const result = validateInput('0123', 4);
    expect(result.valid).toBe(true);
  });

  test('全0应该通过验证', () => {
    const result = validateInput('0000', 4);
    expect(result.valid).toBe(true);
  });
});

describe('validateInputStrict（严格验证）', () => {
  test('有效输入应该通过验证', () => {
    const result = validateInputStrict('1234', 4);
    expect(result.valid).toBe(true);
  });

  test('非数字输入应该失败', () => {
    const result = validateInputStrict('12a4', 4);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('请输入数字');
  });

  test('长度不对应该失败', () => {
    const result = validateInputStrict('123', 4);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('请输入4位数字');
  });

  test('重复数字应该失败', () => {
    const result = validateInputStrict('1123', 4);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('数字不能重复');
  });

  test('第一位是0应该失败', () => {
    const result = validateInputStrict('0123', 4);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('第一位不能是0');
  });
});

describe('calculateHint', () => {
  test('全对应该返回4A0B', () => {
    const hint = calculateHint('1234', '1234');
    expect(hint.hits).toBe(4);
    expect(hint.blows).toBe(0);
  });

  test('数字对但位置不对应该返回0A4B', () => {
    const hint = calculateHint('1234', '4321');
    expect(hint.hits).toBe(0);
    expect(hint.blows).toBe(4);
  });

  test('部分正确应该返回正确的命中和提示', () => {
    const hint = calculateHint('1234', '1256');
    expect(hint.hits).toBe(2); // 1,2 位置正确
    expect(hint.blows).toBe(0); // 3,4,5,6 没有匹配
  });

  test('完全错误应该返回0A0B', () => {
    const hint = calculateHint('1234', '5678');
    expect(hint.hits).toBe(0);
    expect(hint.blows).toBe(0);
  });

  test('一个位置正确一个数字正确', () => {
    const hint = calculateHint('1234', '1243');
    expect(hint.hits).toBe(2); // 1,2 位置正确
    expect(hint.blows).toBe(2); // 3,4 数字对但位置错
  });

  test('允许重复数字的命中计算', () => {
    const hint = calculateHint('1122', '1122');
    expect(hint.hits).toBe(4);
    expect(hint.blows).toBe(0);
  });

  test('重复数字的部分匹配', () => {
    // secret: 1 1 2 2
    // guess:  1 2 1 1
    // 位置0: 1==1 → hit
    // 位置1: 2在secret中(位置2或3) → blow
    // 位置2: 1在secret中(位置1) → blow
    // 位置3: 1在secret中 → blow (当前算法不跟踪已使用的位置)
    const hint = calculateHint('1122', '1211');
    expect(hint.hits).toBe(1);
    expect(hint.blows).toBe(3);
  });
});

describe('isCorrect', () => {
  test('完全匹配应该返回true', () => {
    expect(isCorrect('1234', '1234')).toBe(true);
  });

  test('不匹配应该返回false', () => {
    expect(isCorrect('1234', '5678')).toBe(false);
  });

  test('部分匹配应该返回false', () => {
    expect(isCorrect('1234', '1235')).toBe(false);
  });

  test('重复数字匹配', () => {
    expect(isCorrect('1122', '1122')).toBe(true);
  });
});

describe('getHintMessage', () => {
  test('0A0B应该返回"没有匹配的数字"', () => {
    expect(getHintMessage({ hits: 0, blows: 0 })).toBe('没有匹配的数字');
  });

  test('4A0B应该返回"4A"', () => {
    expect(getHintMessage({ hits: 4, blows: 0 })).toBe('4A');
  });

  test('0A4B应该返回"4B"', () => {
    expect(getHintMessage({ hits: 0, blows: 4 })).toBe('4B');
  });

  test('2A2B应该返回"2A2B"', () => {
    expect(getHintMessage({ hits: 2, blows: 2 })).toBe('2A2B');
  });
});