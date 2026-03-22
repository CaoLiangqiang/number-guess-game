// components/ai-terminal/ai-terminal.js
Component({
  properties: {
    // 是否正在思考
    thinking: {
      type: Boolean,
      value: false
    },
    // 思考文字
    thinkingText: {
      type: String,
      value: '分析中...'
    },
    // 日志数组
    logs: {
      type: Array,
      value: []
    },
    // 是否显示统计
    showStats: {
      type: Boolean,
      value: true
    },
    // 候选数量
    candidateCount: {
      type: Number,
      value: 0
    },
    // 信息熵
    entropy: {
      type: String,
      value: '0.00'
    }
  },

  methods: {
    // 添加日志
    addLog(message, type = 'info') {
      const logs = [...this.data.logs, {
        id: Date.now(),
        message,
        type
      }]
      this.setData({ logs })
    },

    // 清空日志
    clearLogs() {
      this.setData({ logs: [] })
    }
  }
})