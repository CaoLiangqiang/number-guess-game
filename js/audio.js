/**
 * 数字对决 Pro - 音效管理器
 * 使用 Web Audio API 生成音效，无需外部音频文件
 *
 * 特性：
 * - iOS Safari 兼容：自动解锁 AudioContext
 * - 微信浏览器兼容：处理音频策略
 * - 懒加载：首次用户交互时初始化
 */

class AudioManager {
    constructor() {
        this.enabled = true;
        this.volume = 0.5;
        this.context = null;
        this.initialized = false;
        this.unlocked = false;

        // iOS/微信检测
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        this.isWeChat = /MicroMessenger/i.test(navigator.userAgent);

        // 音效配置
        this.sounds = {
            hit: { frequency: 880, duration: 0.1, type: 'sine', decay: 0.1 },
            blow: { frequency: 440, duration: 0.15, type: 'triangle', decay: 0.2 },
            win: { frequencies: [523.25, 659.25, 783.99, 1046.50], duration: 0.15, type: 'sine' },
            lose: { frequencies: [392, 349.23, 329.63, 293.66], duration: 0.2, type: 'sine' },
            click: { frequency: 1000, duration: 0.05, type: 'square', decay: 0.05 },
            correct: { frequency: 1200, duration: 0.1, type: 'sine', decay: 0.1 },
            wrong: { frequency: 200, duration: 0.2, type: 'sawtooth', decay: 0.3 },
            notification: { frequencies: [880, 1100], duration: 0.1, type: 'sine' },
            countdown: { frequency: 600, duration: 0.08, type: 'sine' },
            success: { frequencies: [523.25, 659.25, 783.99], duration: 0.12, type: 'sine' },
            guess: { frequency: 660, duration: 0.08, type: 'sine', decay: 0.08 }
        };

        // 自动设置解锁监听
        this.setupUnlockListener();
    }

    /**
     * 设置 iOS/微信 解锁监听
     * 首次用户交互时解锁 AudioContext
     */
    setupUnlockListener() {
        if (!this.isIOS && !this.isWeChat) return;

        const unlock = () => {
            if (this.unlocked) return;
            this.unlockAudio();
            this.unlocked = true;
        };

        // iOS/微信需要用户交互才能播放音频
        const events = ['touchstart', 'touchend', 'click', 'keydown'];
        events.forEach(event => {
            document.addEventListener(event, unlock, { once: true, passive: true });
        });
    }

    /**
     * 解锁 iOS/微信 音频
     * 播放一个静音的缓冲区来解锁
     */
    unlockAudio() {
        if (!this.context) {
            this.init();
        }

        if (!this.context) return;

        try {
            // 创建一个静音的缓冲区并播放
            const buffer = this.context.createBuffer(1, 1, 22050);
            const source = this.context.createBufferSource();
            source.buffer = buffer;
            source.connect(this.context.destination);
            source.start(0);

            // 恢复 AudioContext
            if (this.context.state === 'suspended') {
                this.context.resume();
            }

            console.log('[AudioManager] 音频已解锁 (iOS/微信)');
        } catch (e) {
            console.warn('[AudioManager] 解锁音频失败:', e);
        }
    }

    /**
     * 初始化音频上下文（懒加载）
     */
    init() {
        if (this.initialized) return;

        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;

            // iOS 需要立即尝试恢复
            if (this.isIOS && this.context.state === 'suspended') {
                this.context.resume();
            }

            console.log('[AudioManager] 音频系统已初始化');
        } catch (e) {
            console.warn('[AudioManager] Web Audio API 不支持:', e);
            this.enabled = false;
        }
    }

    /**
     * 确保音频上下文已恢复
     */
    async ensureContext() {
        if (!this.context) {
            this.init();
        }

        if (this.context && this.context.state === 'suspended') {
            try {
                await this.context.resume();
            } catch (e) {
                // iOS/微信 可能需要用户交互
                console.warn('[AudioManager] 需要用户交互解锁音频');
            }
        }

        return this.context && this.context.state === 'running';
    }
    
    /**
     * 播放命中的音效
     */
    async playHit(count = 1) {
        if (!this.enabled) return;
        await this.ensureContext();
        
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                this.playTone(this.sounds.hit);
            }, i * 100);
        }
    }
    
    /**
     * 播放提示音效
     */
    async playBlow(count = 1) {
        if (!this.enabled) return;
        await this.ensureContext();
        
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                this.playTone(this.sounds.blow);
            }, i * 120);
        }
    }
    
    /**
     * 播放胜利音效
     */
    async playWin() {
        if (!this.enabled) return;
        await this.ensureContext();
        
        const sound = this.sounds.win;
        sound.frequencies.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone({ frequency: freq, duration: sound.duration, type: sound.type });
            }, i * 150);
        });
    }
    
    /**
     * 播放失败音效
     */
    async playLose() {
        if (!this.enabled) return;
        await this.ensureContext();
        
        const sound = this.sounds.lose;
        sound.frequencies.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone({ frequency: freq, duration: sound.duration, type: sound.type });
            }, i * 200);
        });
    }
    
    /**
     * 播放点击音效
     */
    async playClick() {
        if (!this.enabled) return;
        await this.ensureContext();
        this.playTone(this.sounds.click);
    }
    
    /**
     * 播放正确反馈音效
     */
    async playCorrect() {
        if (!this.enabled) return;
        await this.ensureContext();
        this.playTone(this.sounds.correct);
    }
    
    /**
     * 播放错误反馈音效
     */
    async playWrong() {
        if (!this.enabled) return;
        await this.ensureContext();
        this.playTone(this.sounds.wrong);
    }
    
    /**
     * 播放通知音效
     */
    async playNotification() {
        if (!this.enabled) return;
        await this.ensureContext();
        
        const sound = this.sounds.notification;
        sound.frequencies.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone({ frequency: freq, duration: sound.duration, type: sound.type });
            }, i * 100);
        });
    }
    
    /**
     * 播放倒计时音效
     */
    async playCountdown() {
        if (!this.enabled) return;
        await this.ensureContext();
        this.playTone(this.sounds.countdown);
    }
    
    /**
     * 播放猜测结果音效（根据命中和提示数量）
     */
    async playGuessResult(hits, blows) {
        if (!this.enabled) return;
        await this.ensureContext();
        
        if (hits > 0) {
            await this.playHit(hits);
        }
        
        if (blows > 0) {
            setTimeout(() => {
                this.playBlow(blows);
            }, hits * 100 + 50);
        }
    }
    
    /**
     * 播放单个音调
     */
    playTone(sound) {
        if (!this.context) return;
        
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);
        
        oscillator.type = sound.type || 'sine';
        oscillator.frequency.value = sound.frequency;
        
        const now = this.context.currentTime;
        const duration = sound.duration || 0.1;
        const decay = sound.decay || 0.1;
        
        gainNode.gain.setValueAtTime(this.volume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration + decay);
        
        oscillator.start(now);
        oscillator.stop(now + duration + decay);
    }
    
    /**
     * 设置音量
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }
    
    /**
     * 启用/禁用音效
     */
    toggle(enabled) {
        this.enabled = enabled;
    }
    
    /**
     * 触发震动反馈（如果设备支持）
     */
    vibrate(pattern = 'short') {
        if (!navigator.vibrate) return;
        
        const patterns = {
            short: 50,
            medium: 100,
            long: 200,
            hit: [50, 30, 50],
            win: [100, 50, 100, 50, 100],
            lose: [200, 100, 200],
            notification: [100, 50, 100]
        };
        
        navigator.vibrate(patterns[pattern] || patterns.short);
    }
    
    /**
     * 播放猜测结果震动反馈
     */
    vibrateResult(hits, blows) {
        if (!navigator.vibrate) return;

        const pattern = [];

        // 命中震动（强烈）
        for (let i = 0; i < hits; i++) {
            pattern.push(80, 40);
        }

        // 提示震动（轻微）
        for (let i = 0; i < blows; i++) {
            pattern.push(40, 30);
        }

        if (pattern.length > 0) {
            navigator.vibrate(pattern);
        }
    }

    /**
     * 播放成功音效（简短版）
     */
    async playSuccess() {
        if (!this.enabled) return;
        await this.ensureContext();

        const sound = this.sounds.success;
        sound.frequencies.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone({ frequency: freq, duration: sound.duration, type: sound.type });
            }, i * 100);
        });
    }

    /**
     * 播放猜测音效
     */
    async playGuess() {
        if (!this.enabled) return;
        await this.ensureContext();
        this.playTone(this.sounds.guess);
    }

    /**
     * 获取当前状态
     */
    getStatus() {
        return {
            enabled: this.enabled,
            initialized: this.initialized,
            unlocked: this.unlocked,
            contextState: this.context ? this.context.state : 'none',
            isIOS: this.isIOS,
            isWeChat: this.isWeChat
        };
    }
}

// 创建全局实例
const audioManager = new AudioManager();

// 浏览器全局导出
if (typeof window !== 'undefined') {
    window.audioManager = audioManager;
    window.AudioManager = AudioManager;
}

// CommonJS 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AudioManager, audioManager };
}