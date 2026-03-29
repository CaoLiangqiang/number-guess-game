(function (global) {
  function createAudioContextStub() {
    const endedCallbacks = [];

    return {
      src: '',
      loop: false,
      play: function () {
        if (!this.loop) {
          endedCallbacks.forEach(function (callback) {
            callback();
          });
        }
      },
      stop: function () {},
      destroy: function () {},
      onEnded: function (callback) {
        endedCallbacks.push(callback);
      }
    };
  }

  function createWxShim(options) {
    const settings = options || {};
    const canvas = settings.canvas || document.createElement('canvas');
    const toastLog = [];
    const modalLog = [];
    const shareLog = [];
    const fileStore = new Map();
    const touchHandlers = { start: [], move: [], end: [] };
    const resizeHandlers = [];

    const state = {
      width: settings.width || 375,
      height: settings.height || 667,
      pixelRatio: settings.pixelRatio || global.devicePixelRatio || 1,
      chooseMessageFileHandler: null,
      shareAppMessageHandler: null,
      errorHandler: null,
      memoryWarningHandler: null
    };

    function applyCanvasSize() {
      canvas.width = state.width * state.pixelRatio;
      canvas.height = state.height * state.pixelRatio;
      canvas.style.width = state.width + 'px';
      canvas.style.height = state.height + 'px';
    }

    function getSystemInfo() {
      return {
        windowWidth: state.width,
        windowHeight: state.height,
        pixelRatio: state.pixelRatio,
        safeArea: {
          left: 0,
          top: 0,
          right: state.width,
          bottom: state.height,
          width: state.width,
          height: state.height
        }
      };
    }

    function readStorage(key) {
      const storageKey = 'miniprogram-preview:' + key;
      const raw = global.localStorage ? global.localStorage.getItem(storageKey) : null;
      return raw === null ? '' : JSON.parse(raw);
    }

    function writeStorage(key, value) {
      if (!global.localStorage) return;
      global.localStorage.setItem('miniprogram-preview:' + key, JSON.stringify(value));
    }

    function removeStorage(key) {
      if (!global.localStorage) return;
      global.localStorage.removeItem('miniprogram-preview:' + key);
    }

    function clearStorage() {
      if (!global.localStorage) return;
      const keys = [];
      for (let i = 0; i < global.localStorage.length; i++) {
        const key = global.localStorage.key(i);
        if (key && key.indexOf('miniprogram-preview:') === 0) {
          keys.push(key);
        }
      }
      keys.forEach(function (key) {
        global.localStorage.removeItem(key);
      });
    }

    function dispatchTouch(type, point) {
      const key = type.toLowerCase();
      const touch = {
        clientX: point.clientX,
        clientY: point.clientY
      };

      const event = key === 'end'
        ? { changedTouches: [touch], touches: [] }
        : { touches: [touch], changedTouches: [touch] };

      (touchHandlers[key] || []).forEach(function (handler) {
        handler(event);
      });
    }

    function setViewport(width, height, pixelRatio) {
      state.width = width;
      state.height = height;
      state.pixelRatio = pixelRatio || state.pixelRatio;
      applyCanvasSize();
      resizeHandlers.forEach(function (handler) {
        handler(getSystemInfo());
      });
    }

    applyCanvasSize();

    const wx = {
      env: {
        USER_DATA_PATH: '/preview-user-data'
      },
      createCanvas: function () {
        applyCanvasSize();
        return canvas;
      },
      createOffscreenCanvas: function (options) {
        const offscreen = document.createElement('canvas');
        offscreen.width = (options && options.width) || state.width;
        offscreen.height = (options && options.height) || state.height;
        return offscreen;
      },
      getSystemInfoSync: function () {
        return getSystemInfo();
      },
      onWindowResize: function (handler) {
        resizeHandlers.push(handler);
      },
      onTouchStart: function (handler) {
        touchHandlers.start.push(handler);
      },
      onTouchMove: function (handler) {
        touchHandlers.move.push(handler);
      },
      onTouchEnd: function (handler) {
        touchHandlers.end.push(handler);
      },
      getStorageSync: function (key) {
        return readStorage(key);
      },
      setStorageSync: function (key, value) {
        writeStorage(key, value);
      },
      removeStorageSync: function (key) {
        removeStorage(key);
      },
      clearStorageSync: function () {
        clearStorage();
      },
      showToast: function (options) {
        toastLog.push(options || {});
      },
      showModal: function (options) {
        modalLog.push(options || {});
        if (options && typeof options.success === 'function') {
          options.success({ confirm: true, cancel: false });
        }
      },
      createInnerAudioContext: function () {
        return createAudioContextStub();
      },
      vibrateShort: function () {
        if (global.navigator && typeof global.navigator.vibrate === 'function') {
          global.navigator.vibrate(30);
        }
      },
      vibrateLong: function () {
        if (global.navigator && typeof global.navigator.vibrate === 'function') {
          global.navigator.vibrate(80);
        }
      },
      onShareAppMessage: function (handler) {
        state.shareAppMessageHandler = handler;
      },
      onError: function (handler) {
        state.errorHandler = handler;
      },
      onMemoryWarning: function (handler) {
        state.memoryWarningHandler = handler;
      },
      shareAppMessage: function (options) {
        shareLog.push({ type: 'app', options: options || {} });
        if (options && typeof options.success === 'function') {
          options.success();
        }
      },
      shareFileMessage: function (options) {
        shareLog.push({ type: 'file', options: options || {} });
        if (options && typeof options.success === 'function') {
          options.success();
        }
      },
      getFileSystemManager: function () {
        return {
          writeFile: function (options) {
            fileStore.set(options.filePath, options.data);
            if (typeof options.success === 'function') {
              options.success();
            }
          },
          readFile: function (options) {
            if (!fileStore.has(options.filePath)) {
              if (typeof options.fail === 'function') {
                options.fail(new Error('File not found: ' + options.filePath));
              }
              return;
            }
            if (typeof options.success === 'function') {
              options.success(fileStore.get(options.filePath));
            }
          }
        };
      },
      chooseMessageFile: function (options) {
        if (typeof state.chooseMessageFileHandler === 'function') {
          state.chooseMessageFileHandler(options);
          return;
        }
        if (options && typeof options.fail === 'function') {
          options.fail(new Error('chooseMessageFile is not configured in preview mode'));
        }
      },
      canvasToTempFilePath: function (options) {
        try {
          const sourceCanvas = options.canvas || canvas;
          const dataUrl = sourceCanvas.toDataURL('image/png');
          if (typeof options.success === 'function') {
            options.success({ tempFilePath: dataUrl });
          }
        } catch (error) {
          if (typeof options.fail === 'function') {
            options.fail(error);
          }
        }
      }
    };

    return {
      wx: wx,
      canvas: canvas,
      dispatchTouch: dispatchTouch,
      getToasts: function () {
        return toastLog.slice();
      },
      getModals: function () {
        return modalLog.slice();
      },
      getShares: function () {
        return shareLog.slice();
      },
      getFiles: function () {
        return new Map(fileStore);
      },
      setViewport: setViewport,
      setChooseMessageFileHandler: function (handler) {
        state.chooseMessageFileHandler = handler;
      }
    };
  }

  function installGlobalWxShim(options) {
    const shim = createWxShim(options);
    global.wx = shim.wx;
    return shim;
  }

  const api = {
    createWxShim: createWxShim,
    installGlobalWxShim: installGlobalWxShim
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.MiniprogramPreviewWxShim = api;
})(typeof window !== 'undefined' ? window : globalThis);
