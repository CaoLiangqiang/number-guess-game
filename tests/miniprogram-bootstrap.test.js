describe('miniprogram bootstrap', () => {
  const originalWx = global.wx;
  const originalRaf = global.requestAnimationFrame;
  const originalGame = globalThis.__game__;
  const originalGetGame = globalThis.getGame;

  function createContext() {
    return {
      save: jest.fn(),
      restore: jest.fn(),
      beginPath: jest.fn(),
      closePath: jest.fn(),
      rect: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      quadraticCurveTo: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      fillRect: jest.fn(),
      fillText: jest.fn(),
      measureText: jest.fn((text) => ({ width: String(text).length * 12 })),
      createLinearGradient: jest.fn(() => ({
        addColorStop: jest.fn()
      }))
    };
  }

  beforeEach(() => {
    const store = new Map();
    const context = createContext();

    global.wx = {
      createCanvas: jest.fn(() => ({
        width: 0,
        height: 0,
        getContext: jest.fn(() => context)
      })),
      getSystemInfoSync: jest.fn(() => ({
        windowWidth: 375,
        windowHeight: 667,
        pixelRatio: 2
      })),
      getStorageSync: jest.fn((key) => (store.has(key) ? store.get(key) : '')),
      setStorageSync: jest.fn((key, value) => store.set(key, value)),
      removeStorageSync: jest.fn((key) => store.delete(key)),
      clearStorageSync: jest.fn(() => store.clear()),
      onTouchStart: jest.fn(),
      onTouchEnd: jest.fn(),
      onWindowResize: jest.fn(),
      onShareAppMessage: jest.fn(),
      onError: jest.fn(),
      onMemoryWarning: jest.fn(),
      showToast: jest.fn(),
      vibrateShort: jest.fn(),
      vibrateLong: jest.fn()
    };

    global.requestAnimationFrame = jest.fn(() => 1);
    jest.resetModules();
  });

  afterEach(() => {
    global.wx = originalWx;
    global.requestAnimationFrame = originalRaf;

    if (originalGame === undefined) {
      delete globalThis.__game__;
    } else {
      globalThis.__game__ = originalGame;
    }

    if (originalGetGame === undefined) {
      delete globalThis.getGame;
    } else {
      globalThis.getGame = originalGetGame;
    }

    jest.resetModules();
  });

  test('bootstraps the minigame entry and lands on the menu scene', () => {
    expect(() => {
      jest.isolateModules(() => {
        require('../miniprogram/game.js');
      });
    }).not.toThrow();

    expect(globalThis.__game__).toBeTruthy();
    expect(globalThis.__game__.renderer).toBeTruthy();
    expect(globalThis.__game__.sceneManager).toBeTruthy();
    expect(globalThis.__game__.inputManager).toBeTruthy();
    expect(globalThis.__game__.audioManager).toBeTruthy();
    expect(globalThis.__game__.storageManager).toBeTruthy();
    expect(globalThis.__game__.sceneManager.getCurrentSceneName()).toBe('menu');
    expect(global.wx.createCanvas).toHaveBeenCalled();
    expect(global.wx.onWindowResize).toHaveBeenCalled();
    expect(global.wx.onShareAppMessage).toHaveBeenCalled();
    expect(global.requestAnimationFrame).toHaveBeenCalled();
  });
});
