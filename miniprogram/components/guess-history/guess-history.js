// components/guess-history/guess-history.js
Component({
  properties: {
    // 历史记录数组
    history: {
      type: Array,
      value: []
    },
    // 标题
    title: {
      type: String,
      value: ''
    },
    // 空状态文字
    emptyText: {
      type: String,
      value: '暂无记录'
    },
    // 自动滚动到最新
    autoScroll: {
      type: Boolean,
      value: true
    }
  },

  data: {
    scrollToId: '',
    digitClass: ''
  },

  observers: {
    'history': function(history) {
      if (this.properties.autoScroll && history.length > 0) {
        this.setData({
          scrollToId: `item-${history.length - 1}`
        })
      }
    }
  },

  methods: {
    // 滚动到指定项
    scrollTo(index) {
      this.setData({
        scrollToId: `item-${index}`
      })
    }
  }
})