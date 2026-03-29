describe('miniprogram preview runtime', () => {
  const originalGame = globalThis.__game__;
  const originalGetGame = globalThis.getGame;
  const originalWx = global.wx;
  const originalRaf = global.requestAnimationFrame;

  beforeEach(() => {
    jest.resetModules();
    document.body.innerHTML = '<div id="app"><canvas id="preview-canvas"></canvas></div>';

    Object.defineProperty(window, 'devicePixelRatio', {
      configurable: true,
      value: 2
    });

    const fakeContext = {
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      closePath: jest.fn(),
      rect: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      quadraticCurveTo: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      fillText: jest.fn(),
      measureText: jest.fn((text) => ({ width: String(text).length * 10 })),
      save: jest.fn(),
      restore: jest.fn(),
      createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
      roundRect: jest.fn()
    };

    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value: jest.fn(() => fakeContext)
    });

    Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
      configurable: true,
      value: jest.fn(() => 'data:image/png;base64,preview')
    });

    global.requestAnimationFrame = jest.fn(() => 1);
  });

  afterEach(() => {
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

    if (originalWx === undefined) {
      delete global.wx;
    } else {
      global.wx = originalWx;
    }

    global.requestAnimationFrame = originalRaf;
  });

  test('wx shim provides browser-backed canvas, storage, toast and touch helpers', () => {
    const { createWxShim } = require('../js/miniprogram-preview/wx-shim');

    const canvas = document.getElementById('preview-canvas');
    const shim = createWxShim({ canvas, width: 375, height: 667, pixelRatio: 2 });
    const wx = shim.wx;

    expect(wx.createCanvas()).toBe(canvas);
    expect(wx.getSystemInfoSync()).toEqual(expect.objectContaining({
      windowWidth: 375,
      windowHeight: 667,
      pixelRatio: 2
    }));

    wx.setStorageSync('stats', { wins: 3 });
    expect(wx.getStorageSync('stats')).toEqual({ wins: 3 });
    wx.removeStorageSync('stats');
    expect(wx.getStorageSync('stats')).toBe('');

    const touchSpy = jest.fn();
    wx.onTouchStart(touchSpy);
    shim.dispatchTouch('start', { clientX: 12, clientY: 34 });
    expect(touchSpy).toHaveBeenCalledWith(expect.objectContaining({
      touches: [expect.objectContaining({ clientX: 12, clientY: 34 })]
    }));

    wx.showToast({ title: 'preview ready', icon: 'success' });
    expect(shim.getToasts()).toEqual([
      expect.objectContaining({ title: 'preview ready', icon: 'success' })
    ]);
  });

  test('browser module loader resolves relative local modules with caching', async () => {
    const { createBrowserModuleLoader } = require('../js/miniprogram-preview/module-loader');

    const fetchText = jest.fn((url) => {
      const modules = {
        '/preview/entry.js': "const dep = require('./dep.js'); module.exports = { value: dep.value + 1 };",
        '/preview/dep.js': "module.exports = { value: 41 };"
      };

      if (!(url in modules)) {
        throw new Error(`Unexpected module: ${url}`);
      }

      return modules[url];
    });

    const loader = createBrowserModuleLoader({ fetchText });
    const first = await loader.require('/preview/entry.js');
    const second = await loader.require('/preview/entry.js');

    expect(first).toEqual({ value: 42 });
    expect(second).toBe(first);
    expect(fetchText).toHaveBeenCalledTimes(2);
  });

  test('preview app installs the shim and boots the mini program entry', async () => {
    const { createPreviewApp } = require('../js/miniprogram-preview/app');

    const canvas = document.getElementById('preview-canvas');
    const installGlobalWxShim = jest.fn(() => ({ wx: { __shim: true } }));
    const loader = {
      require: jest.fn(() => {
        globalThis.__game__ = {
          sceneManager: {
            getCurrentSceneName: () => 'menu'
          }
        };
      })
    };

    const app = createPreviewApp({
      canvas,
      installGlobalWxShim,
      loader
    });

    await app.boot();

    expect(installGlobalWxShim).toHaveBeenCalledWith(expect.objectContaining({ canvas }));
    expect(loader.require).toHaveBeenCalledWith('/miniprogram/game.js');
    expect(app.getGame()).toBe(globalThis.__game__);
  });

  test('preview seed manager populates sample data and screenshot export returns png data', () => {
    const { createWxShim } = require('../js/miniprogram-preview/wx-shim');
    const { createPreviewSeedManager } = require('../js/miniprogram-preview/seed-data');
    const { createPreviewApp } = require('../js/miniprogram-preview/app');

    const canvas = document.getElementById('preview-canvas');
    const shim = createWxShim({ canvas, width: 375, height: 667, pixelRatio: 2 });
    const app = createPreviewApp({
      canvas,
      installGlobalWxShim: () => shim,
      loader: {
        require: jest.fn(() => {
          globalThis.__game__ = {
            sceneManager: { getCurrentSceneName: () => 'menu' }
          };
        })
      }
    });

    app.boot();

    const seeds = createPreviewSeedManager({ wx: shim.wx });
    seeds.apply('history');

    expect(shim.wx.getStorageSync('gameHistory')).toEqual(expect.any(Array));
    expect(shim.wx.getStorageSync('gameHistory').length).toBeGreaterThan(0);
    expect(app.exportScreenshot()).toMatch(/^data:image\/png;base64,/);
  });

  test('preview app boots the real mini program entry to the menu scene', () => {
    const fs = require('fs');
    const path = require('path');
    const { createBrowserModuleLoader } = require('../js/miniprogram-preview/module-loader');
    const { installGlobalWxShim } = require('../js/miniprogram-preview/wx-shim');
    const { createPreviewApp } = require('../js/miniprogram-preview/app');

    const canvas = document.getElementById('preview-canvas');
    const loader = createBrowserModuleLoader({
      fetchText: (url) => {
        const filePath = path.join(process.cwd(), url.replace(/^\//, '').replace(/\//g, path.sep));
        return fs.readFileSync(filePath, 'utf8');
      }
    });

    const app = createPreviewApp({
      canvas,
      loader,
      installGlobalWxShim
    });

    app.boot();

    expect(app.getGame()).toBeTruthy();
    expect(app.getGame().sceneManager.getCurrentSceneName()).toBe('menu');
    expect(global.requestAnimationFrame).toHaveBeenCalled();
  });
});
