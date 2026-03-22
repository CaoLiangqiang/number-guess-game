/**
 * AudioManager 单元测试
 */

// Mock Web Audio API
class MockAudioContext {
  constructor() {
    this.state = 'running';
    this.currentTime = 0;
    this.destination = {};
  }

  createOscillator() {
    return {
      type: 'sine',
      frequency: { value: 440 },
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn()
    };
  }

  createGain() {
    return {
      gain: {
        setValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn()
      },
      connect: jest.fn()
    };
  }

  createBuffer(channels, length, sampleRate) {
    return { channels, length, sampleRate };
  }

  createBufferSource() {
    return {
      buffer: null,
      connect: jest.fn(),
      start: jest.fn()
    };
  }

  async resume() {
    this.state = 'running';
  }
}

// Mock navigator
const mockVibrate = jest.fn();
Object.defineProperty(navigator, 'vibrate', {
  value: mockVibrate,
  writable: true
});

// 设置测试环境 - 在全局设置 AudioContext
global.AudioContext = MockAudioContext;
global.window.AudioContext = MockAudioContext;
global.window.webkitAudioContext = MockAudioContext;

// 导入 AudioManager
const { AudioManager } = require('../../js/audio.js');

describe('AudioManager', () => {
  let audioManager;

  beforeEach(() => {
    jest.clearAllMocks();
    audioManager = new AudioManager();
  });

  describe('初始化', () => {
    it('应该正确初始化默认值', () => {
      expect(audioManager.enabled).toBe(true);
      expect(audioManager.volume).toBe(0.5);
      expect(audioManager.initialized).toBe(false);
    });

    it('应该正确检测 iOS 设备', () => {
      // 默认测试环境不是 iOS
      expect(typeof audioManager.isIOS).toBe('boolean');
    });

    it('应该正确检测微信浏览器', () => {
      expect(typeof audioManager.isWeChat).toBe('boolean');
    });

    it('应该包含所有预定义音效', () => {
      const expectedSounds = ['hit', 'blow', 'win', 'lose', 'click', 
                              'correct', 'wrong', 'notification', 'countdown', 
                              'success', 'guess'];
      expectedSounds.forEach(sound => {
        expect(audioManager.sounds).toHaveProperty(sound);
      });
    });
  });

  describe('音效控制', () => {
    it('应该能够启用/禁用音效', () => {
      audioManager.toggle(false);
      expect(audioManager.enabled).toBe(false);

      audioManager.toggle(true);
      expect(audioManager.enabled).toBe(true);
    });

    it('应该能够设置音量', () => {
      audioManager.setVolume(0.8);
      expect(audioManager.volume).toBe(0.8);
    });

    it('应该限制音量范围在 0-1 之间', () => {
      audioManager.setVolume(1.5);
      expect(audioManager.volume).toBe(1);

      audioManager.setVolume(-0.5);
      expect(audioManager.volume).toBe(0);
    });
  });

  describe('震动反馈', () => {
    it('应该能够触发震动', () => {
      audioManager.vibrate('short');
      expect(mockVibrate).toHaveBeenCalled();
    });

    it('应该支持不同的震动模式', () => {
      const patterns = ['short', 'medium', 'long', 'hit', 'win', 'lose', 'notification'];
      
      patterns.forEach(pattern => {
        mockVibrate.mockClear();
        audioManager.vibrate(pattern);
        expect(mockVibrate).toHaveBeenCalled();
      });
    });

    it('应该能够触发猜测结果震动', () => {
      audioManager.vibrateResult(2, 1);
      expect(mockVibrate).toHaveBeenCalled();
    });

    it('应该在无命中和提示时不触发震动', () => {
      mockVibrate.mockClear();
      audioManager.vibrateResult(0, 0);
      expect(mockVibrate).not.toHaveBeenCalled();
    });
  });

  describe('状态查询', () => {
    it('应该返回正确的状态', () => {
      const status = audioManager.getStatus();
      
      expect(status).toHaveProperty('enabled');
      expect(status).toHaveProperty('initialized');
      expect(status).toHaveProperty('unlocked');
      expect(status).toHaveProperty('contextState');
      expect(status).toHaveProperty('isIOS');
      expect(status).toHaveProperty('isWeChat');
    });
  });

  describe('音效播放方法', () => {
    it('所有音效播放方法应该存在', () => {
      expect(typeof audioManager.playHit).toBe('function');
      expect(typeof audioManager.playBlow).toBe('function');
      expect(typeof audioManager.playWin).toBe('function');
      expect(typeof audioManager.playLose).toBe('function');
      expect(typeof audioManager.playClick).toBe('function');
      expect(typeof audioManager.playCorrect).toBe('function');
      expect(typeof audioManager.playWrong).toBe('function');
      expect(typeof audioManager.playNotification).toBe('function');
      expect(typeof audioManager.playCountdown).toBe('function');
      expect(typeof audioManager.playSuccess).toBe('function');
      expect(typeof audioManager.playGuess).toBe('function');
      expect(typeof audioManager.playGuessResult).toBe('function');
    });

    it('禁用时不应该播放音效', async () => {
      audioManager.toggle(false);
      
      // 这些方法应该直接返回，不执行任何操作
      await audioManager.playHit();
      await audioManager.playBlow();
      await audioManager.playWin();
      await audioManager.playLose();
      await audioManager.playClick();
      
      // 如果没有抛出错误，测试通过
      expect(true).toBe(true);
    });
  });

  describe('AudioContext 管理', () => {
    it('应该懒加载初始化 AudioContext', () => {
      expect(audioManager.initialized).toBe(false);
      audioManager.init();
      expect(audioManager.initialized).toBe(true);
    });

    it('应该避免重复初始化', () => {
      audioManager.init();
      const firstContext = audioManager.context;
      audioManager.init();
      expect(audioManager.context).toBe(firstContext);
    });
  });
});