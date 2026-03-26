const {
  generateSecretNumber,
  validateInput,
  validateInputStrict,
  calculateHint,
  isCorrect,
  getHintMessage,
  formatTime
} = require('../miniprogram/js/core/game');
const StorageManager = require('../miniprogram/js/engine/storage');
const { NumberGuessingAI } = require('../miniprogram/js/core/ai');

describe('miniprogram core game rules', () => {
  let randomSpy;

  afterEach(() => {
    if (randomSpy) {
      randomSpy.mockRestore();
      randomSpy = null;
    }
  });

  test('generateSecretNumber supports duplicate and unique modes', () => {
    randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);

    const duplicateSecret = generateSecretNumber(4, true);
    const uniqueSecret = generateSecretNumber(4, false);

    expect(duplicateSecret).toBe('0000');
    expect(uniqueSecret).toHaveLength(4);
    expect(uniqueSecret[0]).not.toBe('0');
    expect(new Set(uniqueSecret.split('')).size).toBe(4);
  });

  test('validateInput and validateInputStrict enforce the current minigame rules', () => {
    expect(validateInput('0123', 4)).toEqual({ valid: true });
    expect(validateInput('12a4', 4)).toEqual({ valid: false, error: '🔢 请输入数字' });
    expect(validateInputStrict('0123', 4)).toEqual({
      valid: false,
      error: '⚠️ 第一位不能是0'
    });
    expect(validateInputStrict('1123', 4)).toEqual({
      valid: false,
      error: '🚫 数字不能重复'
    });
    expect(validateInputStrict('1234', 4)).toEqual({ valid: true });
  });

  test('calculateHint and formatting helpers return stable values', () => {
    expect(calculateHint('1234', '1256')).toEqual({ hits: 2, blows: 0 });
    expect(calculateHint('1234', '4321')).toEqual({ hits: 0, blows: 4 });
    expect(isCorrect('1234', '1234')).toBe(true);
    expect(isCorrect('1234', '1243')).toBe(false);
    expect(getHintMessage({ hits: 0, blows: 0 })).toBe('没有匹配的数字');
    expect(getHintMessage({ hits: 2, blows: 1 })).toBe('2A1B');
    expect(formatTime(125)).toBe('02:05');
  });
});

describe('miniprogram storage manager', () => {
  const originalWx = global.wx;

  beforeEach(() => {
    const store = new Map();

    global.wx = {
      setStorageSync: jest.fn((key, value) => store.set(key, value)),
      getStorageSync: jest.fn((key) => (store.has(key) ? store.get(key) : '')),
      removeStorageSync: jest.fn((key) => store.delete(key)),
      clearStorageSync: jest.fn(() => store.clear())
    };
  });

  afterEach(() => {
    global.wx = originalWx;
  });

  test('persists settings and reads from cache when available', () => {
    const storage = new StorageManager();

    expect(storage.set('settings', { difficulty: 5, soundEnabled: false })).toBe(true);
    expect(storage.get('settings')).toEqual({ difficulty: 5, soundEnabled: false });
    expect(global.wx.getStorageSync).not.toHaveBeenCalled();

    const reloadedStorage = new StorageManager();
    expect(reloadedStorage.get('settings')).toEqual({ difficulty: 5, soundEnabled: false });
    expect(global.wx.getStorageSync).toHaveBeenCalledWith('settings');
  });

  test('tracks history and user stats', () => {
    const storage = new StorageManager();

    storage.addGameRecord({
      mode: 'ai',
      difficulty: 4,
      turns: 3,
      duration: 42,
      isWin: true
    });

    const stats = storage.updateStats(true);

    expect(storage.getGameHistory()).toHaveLength(1);
    expect(storage.getGameHistory()[0]).toMatchObject({
      mode: 'ai',
      difficulty: 4,
      turns: 3,
      duration: 42,
      isWin: true
    });
    expect(stats).toMatchObject({
      totalGames: 1,
      wins: 1,
      winStreak: 1,
      maxWinStreak: 1
    });
  });

  test('supports remove and clear operations', () => {
    const storage = new StorageManager();

    storage.set('settings', { difficulty: 3 });
    expect(storage.remove('settings')).toBe(true);
    expect(storage.get('settings', null)).toBeNull();

    storage.set('gameHistory', [{ turns: 1 }]);
    expect(storage.clear()).toBe(true);
    expect(storage.getGameHistory()).toEqual([]);
  });
});

describe('miniprogram AI opening guess rules', () => {
  test('AI opening guesses should not start with 0', () => {
    const ai3 = new NumberGuessingAI(3);
    const ai4 = new NumberGuessingAI(4);
    const ai5 = new NumberGuessingAI(5);

    const opening3 = ai3.selectOpeningGuess();
    const opening4 = ai4.selectOpeningGuess();
    const opening5 = ai5.selectOpeningGuess();

    expect(opening3[0]).not.toBe('0');
    expect(opening4[0]).not.toBe('0');
    expect(opening5[0]).not.toBe('0');
  });

  test('AI opening guesses should have unique digits', () => {
    const ai = new NumberGuessingAI(4);
    const opening = ai.selectOpeningGuess();

    expect(new Set(opening.split('')).size).toBe(4);
  });

  test('AI opening guesses should pass strict validation', () => {
    const ai = new NumberGuessingAI(4);
    const opening = ai.selectOpeningGuess();

    const validation = validateInputStrict(opening, 4);
    expect(validation.valid).toBe(true);
  });

  test('AI selectBestGuess should always return valid numbers', () => {
    const ai = new NumberGuessingAI(4);

    for (let i = 0; i < 5; i++) {
      const guess = ai.selectBestGuess();
      const validation = validateInputStrict(guess, 4);
      expect(validation.valid).toBe(true);
    }
  });
});
