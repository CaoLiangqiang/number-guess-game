// components/rank-item/rank-item.js
Component({
  properties: {
    // 排名
    rank: {
      type: Number,
      value: 0
    },
    // 头像
    avatar: {
      type: String,
      value: ''
    },
    // 昵称
    nickname: {
      type: String,
      value: ''
    },
    // 数值
    value: {
      type: [Number, String],
      value: 0
    },
    // 单位
    unit: {
      type: String,
      value: ''
    },
    // 附加信息
    extra: {
      type: String,
      value: ''
    },
    // 是否是当前用户
    isMe: {
      type: Boolean,
      value: false
    }
  }
})