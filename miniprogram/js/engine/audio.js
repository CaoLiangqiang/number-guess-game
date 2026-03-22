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
    if (!this.enabled) return

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
   * 设置音效开关
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled
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
   * 震动反馈
   * @param {string} type - 'short' | 'long'
   */
  vibrate(type = 'short') {
    if (!this.enabled) return

    if (type === 'long') {
      wx.vibrateLong()
    } else {
      wx.vibrateShort({ type: 'medium' })
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