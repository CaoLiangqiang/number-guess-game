(function (global) {
  const PRESET_DEFINITIONS = {
    menu: {
      label: 'Menu',
      scene: 'menu'
    },
    settings: {
      label: 'Settings',
      scene: 'settings'
    },
    history: {
      label: 'History',
      scene: 'history'
    },
    guide: {
      label: 'Guide',
      scene: 'guide'
    },
    'game-ai': {
      label: 'Game (AI)',
      scene: 'game',
      params: { mode: 'ai' }
    },
    'game-daily': {
      label: 'Game (Daily)',
      scene: 'game',
      params: { mode: 'daily' }
    },
    'result-win': {
      label: 'Result (Win)',
      scene: 'result',
      params: {
        isWin: true,
        secretNumber: '5280',
        turns: 5,
        duration: 68,
        mode: 'ai',
        isRecordBroken: true,
        isNewBestTurns: true,
        isNewBestDuration: true
      }
    },
    'result-lose': {
      label: 'Result (Lose)',
      scene: 'result',
      params: {
        isWin: false,
        secretNumber: '8042',
        turns: 10,
        duration: 141,
        mode: 'daily',
        dailyDate: '2026-03-29'
      }
    }
  };

  function createHistoryRecords() {
    return [
      { difficulty: 4, turns: 5, duration: 68, isWin: true, mode: 'ai', secretNumber: '5280', guessHistory: [] },
      { difficulty: 4, turns: 7, duration: 95, isWin: true, mode: 'daily', secretNumber: '8042', guessHistory: [] },
      { difficulty: 5, turns: 10, duration: 141, isWin: false, mode: 'ai', secretNumber: '19357', guessHistory: [] }
    ];
  }

  function createPreviewSeedManager(options) {
    const settings = options || {};
    const wx = settings.wx;

    if (!wx) {
      throw new Error('Preview seed manager requires wx');
    }

    function baseSettings() {
      return {
        difficulty: 4,
        soundEnabled: true,
        vibrationEnabled: true,
        vibrationIntensity: 'medium',
        theme: 'dark',
        transitionEffect: 'fade',
        colorScheme: 'default',
        aiAnimationSpeed: 'normal',
        skipDifficultyConfirm: false
      };
    }

    function baseStats() {
      return {
        totalGames: 12,
        wins: 8,
        winStreak: 3,
        maxWinStreak: 5
      };
    }

    function detailedUserStats() {
      return {
        totalGames: 12,
        wins: 8,
        winStreak: 3,
        maxWinStreak: 5,
        maxWinStreakDate: '2026-03-28T09:00:00.000Z',
        bestTurns: { 4: 5, 5: 7 },
        bestTurnsDates: { 4: '2026-03-28T09:00:00.000Z', 5: '2026-03-27T09:00:00.000Z' },
        bestDurations: { 4: 68, 5: 120 },
        bestDurationDates: { 4: '2026-03-28T09:00:00.000Z', 5: '2026-03-27T09:00:00.000Z' }
      };
    }

    function apply(name) {
      const preset = PRESET_DEFINITIONS[name];
      if (!preset) {
        throw new Error('Unknown preview preset: ' + name);
      }

      wx.clearStorageSync();
      wx.setStorageSync('settings', baseSettings());
      wx.setStorageSync('stats', baseStats());
      wx.setStorageSync('userStats', detailedUserStats());
      wx.setStorageSync('gameHistory', createHistoryRecords());
      wx.setStorageSync('dailyChallengeResults', {
        '2026-03-28': { turns: 7, duration: 95, difficulty: 4, completedAt: '2026-03-28T10:00:00.000Z' },
        '2026-03-29': { turns: 6, duration: 88, difficulty: 4, completedAt: '2026-03-29T10:00:00.000Z' }
      });
      wx.setStorageSync('helpShown', true);

      return preset;
    }

    return {
      apply: apply,
      list: function () {
        return Object.keys(PRESET_DEFINITIONS).map(function (key) {
          return {
            name: key,
            label: PRESET_DEFINITIONS[key].label,
            scene: PRESET_DEFINITIONS[key].scene,
            params: PRESET_DEFINITIONS[key].params || {}
          };
        });
      },
      get: function (name) {
        return PRESET_DEFINITIONS[name] || null;
      }
    };
  }

  const api = {
    PRESET_DEFINITIONS: PRESET_DEFINITIONS,
    createPreviewSeedManager: createPreviewSeedManager
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.MiniprogramPreviewSeedData = api;
})(typeof window !== 'undefined' ? window : globalThis);
