(function (global) {
  function createPreviewApp(options) {
    const settings = options || {};
    const canvas = settings.canvas || document.getElementById('preview-canvas');
    const controlsRoot = settings.controlsRoot || document.getElementById('preview-controls');
    const statusRoot = settings.statusRoot || document.getElementById('preview-status');
    const installGlobalWxShim = settings.installGlobalWxShim
      || (global.MiniprogramPreviewWxShim && global.MiniprogramPreviewWxShim.installGlobalWxShim);
    const loader = settings.loader
      || (global.MiniprogramPreviewLoader && global.MiniprogramPreviewLoader.createBrowserModuleLoader());
    const createPreviewSeedManager = settings.createPreviewSeedManager
      || (global.MiniprogramPreviewSeedData && global.MiniprogramPreviewSeedData.createPreviewSeedManager);

    if (!canvas) {
      throw new Error('Preview canvas not found');
    }

    if (!installGlobalWxShim) {
      throw new Error('Preview wx shim installer is unavailable');
    }

    if (!loader || typeof loader.require !== 'function') {
      throw new Error('Preview module loader is unavailable');
    }

    let shim = null;
    let pointerEventsBound = false;
    let seedManager = null;
    let controlsBound = false;

    function toTouchPoint(event) {
      const rect = canvas.getBoundingClientRect();
      return {
        clientX: event.clientX - rect.left,
        clientY: event.clientY - rect.top
      };
    }

    function bindPointerEvents() {
      if (pointerEventsBound) return;

      canvas.addEventListener('pointerdown', function (event) {
        if (shim) {
          shim.dispatchTouch('start', toTouchPoint(event));
        }
      });

      canvas.addEventListener('pointermove', function (event) {
        if (shim && (event.buttons || event.pressure > 0)) {
          shim.dispatchTouch('move', toTouchPoint(event));
        }
      });

      canvas.addEventListener('pointerup', function (event) {
        if (shim) {
          shim.dispatchTouch('end', toTouchPoint(event));
        }
      });

      canvas.addEventListener('pointercancel', function (event) {
        if (shim) {
          shim.dispatchTouch('end', toTouchPoint(event));
        }
      });

      pointerEventsBound = true;
    }

    function syncGameStateFromStorage() {
      const game = globalThis.__game__;
      if (!game || !game.storageManager || typeof game.storageManager.get !== 'function') return;

      const savedSettings = game.storageManager.get('settings');
      const savedStats = game.storageManager.get('stats');

      if (savedSettings) {
        game.gameState.settings = Object.assign({}, game.gameState.settings, savedSettings);
      }

      if (savedStats) {
        game.gameState.stats = Object.assign({}, game.gameState.stats, savedStats);
      }

      if (game.audioManager) {
        game.audioManager.setEnabled(game.gameState.settings.soundEnabled);
        game.audioManager.setVibrationEnabled(game.gameState.settings.vibrationEnabled !== false);
        game.audioManager.setVibrationIntensity(game.gameState.settings.vibrationIntensity || 'medium');
      }

      if (game.renderer) {
        game.renderer.setColorScheme(game.gameState.settings.colorScheme || 'default');
      }
    }

    function refreshCurrentSceneLayout() {
      const game = globalThis.__game__;
      const scene = game && game.sceneManager && game.sceneManager.currentScene;

      if (scene && typeof scene.calculateLayout === 'function') {
        scene.calculateLayout();
      }
    }

    function updateStatus(text) {
      if (!statusRoot) return;

      const game = globalThis.__game__;
      const sceneName = game && game.sceneManager ? game.sceneManager.getCurrentSceneName() : 'uninitialized';
      statusRoot.textContent = text || ('Current scene: ' + sceneName);
    }

    function applyPreset(name) {
      if (!seedManager) return null;

      const preset = seedManager.apply(name);
      syncGameStateFromStorage();

      if (preset.scene) {
        const game = globalThis.__game__;
        if (game && game.sceneManager && typeof game.sceneManager.switchTo === 'function') {
          game.sceneManager.switchTo(preset.scene, preset.params || {}, { immediate: true });
        }
      }

      refreshCurrentSceneLayout();
      updateStatus('Current scene: ' + (preset.scene || 'menu'));
      return preset;
    }

    function exportScreenshot() {
      return canvas.toDataURL('image/png');
    }

    function triggerDownload(filename, dataUrl) {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }

    function bindControls() {
      if (!controlsRoot || controlsBound || !seedManager) return;

      const presets = seedManager.list();

      controlsRoot.innerHTML = `
        <section class="preview-group">
          <label class="preview-label" for="preview-preset">Scene preset</label>
          <select id="preview-preset" class="preview-select">
            ${presets.map(function (preset) {
              return `<option value="${preset.name}">${preset.label}</option>`;
            }).join('')}
          </select>
          <button id="preview-apply" class="preview-button">Apply preset</button>
        </section>
        <section class="preview-group">
          <div class="preview-label">Viewport</div>
          <div class="preview-button-row">
            <button class="preview-button" data-viewport="375x667">iPhone 8</button>
            <button class="preview-button" data-viewport="390x844">iPhone 13</button>
            <button class="preview-button" data-viewport="430x932">Large</button>
          </div>
        </section>
        <section class="preview-group">
          <button id="preview-export" class="preview-button preview-button-primary">Export PNG</button>
        </section>
      `;

      const presetSelect = controlsRoot.querySelector('#preview-preset');
      const applyButton = controlsRoot.querySelector('#preview-apply');
      const exportButton = controlsRoot.querySelector('#preview-export');

      applyButton.addEventListener('click', function () {
        applyPreset(presetSelect.value);
      });

      exportButton.addEventListener('click', function () {
        const dataUrl = exportScreenshot();
        triggerDownload('miniprogram-preview.png', dataUrl);
      });

      controlsRoot.querySelectorAll('[data-viewport]').forEach(function (button) {
        button.addEventListener('click', function () {
          const parts = button.getAttribute('data-viewport').split('x');
          const width = Number(parts[0]);
          const height = Number(parts[1]);
          if (!Number.isNaN(width) && !Number.isNaN(height)) {
            if (shim) {
              shim.setViewport(width, height, global.devicePixelRatio || 1);
            }
            refreshCurrentSceneLayout();
            updateStatus();
          }
        });
      });

      controlsBound = true;
    }

    function boot() {
      shim = installGlobalWxShim({
        canvas: canvas,
        width: settings.width || 375,
        height: settings.height || 667,
        pixelRatio: settings.pixelRatio || global.devicePixelRatio || 1
      });

      bindPointerEvents();
      seedManager = createPreviewSeedManager ? createPreviewSeedManager({ wx: shim.wx }) : null;
      loader.require('/miniprogram/game.js');
      bindControls();
      if (seedManager) {
        applyPreset('menu');
      } else {
        updateStatus();
      }
      return globalThis.__game__;
    }

    return {
      boot: boot,
      getGame: function () {
        return globalThis.__game__;
      },
      getShim: function () {
        return shim;
      },
      setViewport: function (width, height, pixelRatio) {
        if (shim) {
          shim.setViewport(width, height, pixelRatio);
        }
        refreshCurrentSceneLayout();
        updateStatus();
      },
      switchScene: function (name, params, options) {
        const game = globalThis.__game__;
        if (game && game.sceneManager) {
          game.sceneManager.switchTo(name, params || {}, options || {});
        }
        updateStatus();
      },
      applyPreset: applyPreset,
      exportScreenshot: exportScreenshot,
      updateStatus: updateStatus,
      syncGameStateFromStorage: syncGameStateFromStorage,
      getSeedManager: function () {
        return seedManager;
      }
    };
  }

  function autoBoot() {
    const canvas = document.getElementById('preview-canvas');
    if (!canvas) return null;

    const app = createPreviewApp({ canvas: canvas });
    app.boot();
    global.MiniprogramPreview = app;
    return app;
  }

  const api = {
    createPreviewApp: createPreviewApp,
    autoBoot: autoBoot
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.MiniprogramPreviewApp = api;

  if (!(typeof module !== 'undefined' && module.exports) && typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', autoBoot, { once: true });
    } else {
      autoBoot();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
