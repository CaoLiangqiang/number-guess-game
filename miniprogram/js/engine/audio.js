/**
 * 音频管理器
 * 管理游戏音效和背景音乐
 */

class AudioManager {
  constructor() {
    this.sounds = new Map()
    this.bgm = null
    this.enabled = true
    this.bgmEnabled = false
    this.vibrationEnabled = true
    this.vibrationIntensity = 'medium'  // 'light' | 'medium' | 'heavy'

    // 音效开关（独立于振动）
    this.soundEnabled = true
  }

  /**
   * 预加载音效
   * @param {string} name - 音效名称
   * @param {string} src - 音频文件路径
   */
  preload(name, src) {
    const audio = wx.createInnerAudioContext()
    audio.src = src
    this.sounds.set(name, audio)
  }

  /**
   * 播放音效
   * @param {string} name - 音效名称
   */
  play(name) {
    if (!this.enabled || !this.soundEnabled) return

    const audio = this.sounds.get(name)
    if (audio) {
      audio.stop()
      audio.play()
    } else {
      // 如果没有预加载，临时创建
      const tempAudio = wx.createInnerAudioContext()
      tempAudio.src = `audio/${name}.mp3`
      tempAudio.play()
      tempAudio.onEnded(() => {
        tempAudio.destroy()
      })
    }
  }

  /**
   * 播放按键音
   */
  playKeyPress() {
    if (!this.enabled || !this.soundEnabled) return
    // 使用短促的提示音
    this.playBeep(800, 50)
  }

  /**
   * 播放删除音
   */
  playDelete() {
    if (!this.enabled || !this.soundEnabled) return
    this.playBeep(400, 80)
  }

  /**
   * 播放提交音
   */
  playSubmit() {
    if (!this.enabled || !this.soundEnabled) return
    this.playBeep(600, 100)
  }

  /**
   * 播放胜利音效
   */
  playWin() {
    if (!this.enabled || !this.soundEnabled) return
    // 胜利音效：上升音阶
    this.playMelody([523, 659, 784, 1047], 100)
  }

  /**
   * 播放失败音效
   */
  playLose() {
    if (!this.enabled || !this.soundEnabled) return
    // 失败音效：下降音调
    this.playMelody([400, 350, 300], 150)
  }

  /**
   * 播放获得徽章音效
   */
  playBadge() {
    if (!this.enabled || !this.soundEnabled) return
    // 徽章音效：闪亮音
    this.playMelody([880, 1100, 1320], 80)
  }

  /**
   * 使用Web Audio API播放蜂鸣音
   * @param {number} frequency - 频率
   * @param {number} duration - 持续时间(ms)
   */
  playBeep(frequency, duration) {
    try {
      const audioContext = wx.createWebAudioContext()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.type = 'sine'
      oscillator.frequency.value = frequency

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000)

      oscillator.start()
      oscillator.stop(audioContext.currentTime + duration / 1000)
    } catch (e) {
      // 静默失败
    }
  }

  /**
   * 播放旋律
   * @param {number[]} frequencies - 频率数组
   * @param {number} noteDuration - 每个音符持续时间(ms)
   */
  playMelody(frequencies, noteDuration) {
    try {
      const audioContext = wx.createWebAudioContext()

      frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.type = 'sine'
        oscillator.frequency.value = freq

        const startTime = audioContext.currentTime + index * noteDuration / 1000
        const endTime = startTime + noteDuration / 1000

        gainNode.gain.setValueAtTime(0.3, startTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, endTime)

        oscillator.start(startTime)
        oscillator.stop(endTime)
      })
    } catch (e) {
      // 静默失败
    }
  }

  /**
   * 设置音效开关
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled
    this.soundEnabled = enabled
  }

  /**
   * 设置声音开关（独立于振动）
   * @param {boolean} enabled
   */
  setSoundEnabled(enabled) {
    this.soundEnabled = enabled
  }

  /**
   * 播放背景音乐
   * @param {string} src - 音乐文件路径
   * @param {boolean} loop - 是否循环
   */
  playBGM(src, loop = true) {
    if (!this.bgmEnabled) return

    this.stopBGM()
    this.bgm = wx.createInnerAudioContext()
    this.bgm.src = src
    this.bgm.loop = loop
    this.bgm.play()
  }

  /**
   * 停止背景音乐
   */
  stopBGM() {
    if (this.bgm) {
      this.bgm.stop()
      this.bgm.destroy()
      this.bgm = null
    }
  }

  /**
   * 设置背景音乐开关
   * @param {boolean} enabled
   */
  setBGMEnabled(enabled) {
    this.bgmEnabled = enabled
    if (!enabled) {
      this.stopBGM()
    }
  }

  /**
   * 设置震动开关
   * @param {boolean} enabled
   */
  setVibrationEnabled(enabled) {
    this.vibrationEnabled = enabled
  }

  /**
   * 设置震动强度
   * @param {string} intensity - 'light' | 'medium' | 'heavy'
   */
  setVibrationIntensity(intensity) {
    this.vibrationIntensity = intensity
  }

  /**
   * 震动反馈
   * @param {string} type - 'short' | 'long'
   */
  vibrate(type = 'short') {
    if (!this.vibrationEnabled) return

    if (type === 'long') {
      wx.vibrateLong()
    } else {
      wx.vibrateShort({ type: this.vibrationIntensity })
    }
  }

  /**
   * 销毁所有音频
   */
  destroy() {
    this.stopBGM()
    this.sounds.forEach(audio => {
      audio.stop()
      audio.destroy()
    })
    this.sounds.clear()
  }
}

module.exports = AudioManager