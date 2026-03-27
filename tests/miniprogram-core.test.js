const {
  generateSecretNumber,
  validateInput,
  calculateMatch,
  isCorrect,
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

  test('validateInput allows duplicates and first digit 0 (v2.4.0 rules)', () => {
    expect(validateInput('0123', 4)).toEqual({ valid: true });
    expect(validateInput('0000', 4)).toEqual({ valid: true });
    expect(validateInput('12a4', 4)).toEqual({ valid: false, error: '请输入数字' });
    expect(validateInput('123', 4)).toEqual({ valid: false, error: '请输入4位数字' });
  });

  test('calculateMatch returns correct position count', () => {
    expect(calculateMatch('1234', '1256')).toBe(2);
    expect(calculateMatch('1234', '1234')).toBe(4);
    expect(calculateMatch('1234', '5678')).toBe(0);
    expect(calculateMatch('0000', '0000')).toBe(4);
    expect(isCorrect('1234', '1234')).toBe(true);
    expect(isCorrect('1234', '1243')).toBe(false);
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

    const result = storage.updateStats(true, 3, 4, 42);

    expect(storage.getGameHistory()).toHaveLength(1);
    expect(storage.getGameHistory()[0]).toMatchObject({
      mode: 'ai',
      difficulty: 4,
      turns: 3,
      duration: 42,
      isWin: true
    });
    expect(result.stats).toMatchObject({
      totalGames: 1,
      wins: 1,
      winStreak: 1,
      maxWinStreak: 1
    });
    expect(result.isRecordBroken).toBe(true);
    expect(result.isNewBestTurns).toBe(true);
    expect(result.isNewBestDuration).toBe(true);
    expect(result.stats.bestTurns[4]).toBe(3);
    expect(result.stats.bestDurations[4]).toBe(42);
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
  test('AI opening guesses use optimal strategy', () => {
    const ai3 = new NumberGuessingAI(3);
    const ai4 = new NumberGuessingAI(4);
    const ai5 = new NumberGuessingAI(5);

    const opening3 = ai3.selectOpeningGuess();
    const opening4 = ai4.selectOpeningGuess();
    const opening5 = ai5.selectOpeningGuess();

    // 预计算的最优开局
    expect(opening3).toBe('012');
    expect(opening4).toBe('0011');
    expect(opening5).toBe('00112');
  });

  test('AI opening guesses should pass validation', () => {
    const ai = new NumberGuessingAI(4);
    const opening = ai.selectOpeningGuess();

    const validation = validateInput(opening, 4);
    expect(validation.valid).toBe(true);
  });

  test('AI selectBestGuess should always return valid numbers', () => {
    const ai = new NumberGuessingAI(4);

    for (let i = 0; i < 5; i++) {
      const guess = ai.selectBestGuess();
      const validation = validateInput(guess, 4);
      expect(validation.valid).toBe(true);
    }
  });
});
