// components/guide/guide.js
Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    }
  },

  data: {
    currentStep: 0,
    steps: [
      {
        icon: '🎮',
        title: '欢迎来到数字对决',
        description: '这是一个数字推理游戏，你需要猜出对手设定的神秘数字。'
      },
      {
        icon: '🔢',
        title: '猜测数字',
        description: '输入4位不重复的数字进行猜测，每位数字不能重复，第一位不能为0。',
        example: '例如：1234、5678、9012'
      },
      {
        icon: '💡',
        title: '理解提示',
        description: 'A表示数字和位置都正确，B表示数字正确但位置错误。',
        example: '谜题1234，猜测1564 → 结果：2A0B'
      },
      {
        icon: '🤖',
        title: 'AI对战',
        description: '你将与智能AI对战，比比看谁更快猜中对方的数字！'
      },
      {
        icon: '🏆',
        title: '准备开始',
        description: '现在你已经了解了规则，开始挑战吧！'
      }
    ],
    currentStepData: null
  },

  observers: {
    'currentStep': function(step) {
      this.setData({
        currentStepData: this.data.steps[step]
      })
    }
  },

  lifetimes: {
    attached() {
      this.setData({
        currentStepData: this.data.steps[0]
      })
    }
  },

  methods: {
    preventTouch() {
      // 阻止触摸穿透
    },

    nextStep() {
      const { currentStep, steps } = this.data

      if (currentStep < steps.length - 1) {
        this.setData({
          currentStep: currentStep + 1
        })
      } else {
        // 完成引导
        this.completeGuide()
      }
    },

    skip() {
      this.completeGuide()
    },

    completeGuide() {
      // 标记引导完成
      wx.setStorageSync('guide_completed', true)

      this.triggerEvent('complete')

      this.setData({
        visible: false,
        currentStep: 0
      })
    }
  }
})