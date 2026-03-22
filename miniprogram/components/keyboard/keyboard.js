// components/keyboard/keyboard.js
Component({
  properties: {
    // 已使用的数字（禁用状态）
    disabledDigits: {
      type: Array,
      value: []
    },
    // 高亮的数字
    highlightDigits: {
      type: Array,
      value: []
    },
    // 是否可以提交
    canSubmit: {
      type: Boolean,
      value: false
    },
    // 数字位数
    digitCount: {
      type: Number,
      value: 4
    }
  },

  data: {
    rows: [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['0']
    ]
  },

  methods: {
    onTapKey(e) {
      const digit = e.currentTarget.dataset.digit
      if (this.properties.disabledDigits.includes(digit)) return
      this.triggerEvent('input', { digit })
    },

    onTapDelete() {
      this.triggerEvent('delete')
    },

    onTapSubmit() {
      if (this.properties.canSubmit) {
        this.triggerEvent('submit')
      }
    }
  }
})