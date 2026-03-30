# 微信小游戏交付说明

**版本**: v2.4.31
**更新日期**: 2026-03-29

---

## 1. 正式交付的产品形态

微信小游戏当前交付的是一个以单机推理体验为核心的原生 Canvas 2D 小游戏。

### 玩家可见场景

| 场景 | 作用 | 当前状态 |
|------|------|----------|
| 场景 | 作用 | 当前状态 |
|------|------|----------|
| 主菜单 | 进入 AI 对战、每日挑战、设置、历史、引导 | 已交付 |
| 游戏场景 | 核心猜谜流程、AI 思考展示、暂停、帮助 | 已交付 |
| 结果页 | 胜负结果、破纪录提示、分享反馈、成就徽章 | 已交付 |
| 设置页 | 难度、音效、振动、配色、AI 速度、统计、胜率图 | 已交付 |
| 历史页 | 战绩列表、滚动浏览、清空确认 | 已交付 |
| 引导页 | 新手说明与规则讲解 | 已交付 |

### 当前正式功能

- AI 对战
- 每日挑战及统计面板
- 本地战绩和统计、胜率环形图
- 帮助说明和暂停流程
- 历史记录浏览与清空
- 设置项持久化
- 游戏音效系统
- 成就徽章（闪电通关、连胜、首次胜利、速度之星、完美通关）

当前不把微信小游戏作为双人联机正式端口，联机能力仍由 H5 Web 承载。

---

## 2. 当前版本的关键用户体验

### 规则

- 支持 `3/4/5` 位数字
- 允许重复数字
- 允许首位为 `0`
- 反馈以“正确位置数”展示

### AI 体验

- AI 思考过程可视化
- 展示剩余候选数量
- 展示预计耗时
- 支持慢速、正常、快速、跳过
- 主菜单 AI 按钮带呼吸灯效果

### 统计与记录

- 总场次、胜率、连胜、最佳回合、最佳用时
- 设置页新增：
  - 总用时
  - 总猜测次数
- 历史页支持清空记录，并包含二次确认

---

## 3. 实际实现方式

### 入口与生命周期

- 入口文件：`miniprogram/game.js`
- 统一在入口中创建 `Renderer`、`SceneManager`、`InputManager`、`AudioManager`、`StorageManager`
- 全局 `gameState` 保存运行期状态，scene 通过管理器切换

### 规则与 AI

- `miniprogram/js/core/game.js`
  - 生成谜底
  - 验证输入
  - 计算匹配结果
  - 生成每日挑战谜题
- `miniprogram/js/core/ai.js`
  - AI 开局策略
  - 候选过滤
  - 最佳猜测选择

### 引擎层

- `miniprogram/js/engine/renderer.js`
  - Canvas 基础绘制
  - 按钮、卡片、发光、文本等 UI 原语
- `miniprogram/js/engine/scene.js`
  - 场景注册、切换、更新、渲染
- `miniprogram/js/engine/input.js`
  - 触摸事件归一化
- `miniprogram/js/engine/audio.js`
  - 音效与振动
- `miniprogram/js/engine/storage.js`
  - 设置和统计持久化
  - 历史记录、每日挑战结果、本地聚合统计

### 场景层

- `menu.js`：主菜单和模式入口
- `game.js`：游戏主循环、AI 展示、帮助、暂停、每日挑战
- `result.js`：结算和破纪录反馈
- `settings.js`：设置与统计
- `history.js`：历史记录、滚动和清空确认
- `guide.js`：引导说明

---

## 4. 本版本新增与收口项

### v2.4.24

- 设置页新增总猜测次数统计

### v2.4.23

- 设置页新增总用时统计

### v2.4.22

- 历史页新增清空记录和确认流程

### v2.4.21

- AI 思考进度条新增预计耗时提示

### v2.4.20

- 主菜单 AI 对战按钮新增呼吸灯效果

---

## 5. 验收与开发辅助

### 正式验收环境

### 正式验收环境

- 微信开发者工具
- 真机调试和提审前检查

### 浏览器辅助验收

仓库新增了浏览器预览壳：

- 入口：`miniprogram-preview.html`
- 能力：
  - 启动小游戏真实入口
  - 一键切换常见场景
  - 切换移动端视口
  - 导出 PNG 截图

它的作用是让研发和设计可以更快发现 UI 问题，但不替代微信容器中的最终确认。

---

## 6. 当前发布边界

- 正式面向玩家的小游戏版本为单机 AI / 每日挑战产品
- H5 与小游戏共用同一套规则口径，但运行时和渲染层不同
- 浏览器预览壳仅作为研发资产保留在仓库中，不属于玩家端发布包

---

## 7. 开发路线

### P6 - 新功能探索
- [x] 历史记录页面清空功能 ✅ v2.4.22
- [x] 设置页显示游戏总用时统计 ✅ v2.4.23
- [x] 设置页显示总猜测次数统计 ✅ v2.4.24
- [x] 数字输入框长按清空功能 ✅ v2.4.25
- [x] 闪电通关成就徽章 ✅ v2.4.26
- [x] 连胜成就徽章 ✅ v2.4.27
- [x] 游戏音效系统 ✅ v2.4.28
- [x] 胜率环形图可视化 ✅ v2.4.29
- [x] 每日挑战统计面板 ✅ v2.4.30

### P7 - 下一轮优化建议
- [x] 更多成就徽章类型 ✅ v2.4.31
- [ ] 云端排行榜功能
- [ ] 游戏数据同步

---

## 8. Automation Iteration Log (2026-03-30)

### Settings Scene Scroll Support (v2.4.25)
- [x] Single-task delivery: settings scene vertical scroll support for small screens
- [x] Added scroll state variables and physics (inertia, bounce) - reference: history.js
- [x] Added safeArea handling for notch/home indicator
- [x] Added scroll indicator
- [x] All 109 Jest tests passed

### Product Review Notes
1. P1: Settings scene vertical scroll ✅ DONE
2. P2: Unify safe-area handling in guide/history/settings scenes - remaining work
3. P3: Add history scrolling/paging in game scene - remaining work

### Technical Notes
- Scroll implementation follows history.js pattern
- scrollOffset, scrollVelocity, friction (0.95), bounceStiffness (0.1)
- isVisible() function for virtual rendering optimization
- handleInput converted to use scroll-adjusted Y coordinates

### Next Iteration Recommendations
- Add E2E test environment (Playwright browser setup)
- Unify safeArea handling across all scenes
- Consider extracting scroll logic to reusable mixin/engine component

---
## 9. Automation Iteration Log (2026-03-30 continued)

### SafeArea Unification (v2.4.32)
- [x] Added safeArea support to guide.js
- [x] Added safeArea support to history.js
- [x] All scenes now use safeArea for button positioning (settings already had it)
- [x] All 17 Jest tests passed
- [x] Headless screenshots verified: guide/history buttons properly positioned

### Product Review Notes (2026-03-30)
1. P1: Settings scene vertical scroll ✅ DONE (v2.4.25)
2. P2: Unify safe-area handling in guide/history/settings ✅ DONE (v2.4.32)
3. P3: Add history scrolling/paging in game scene - remaining work

### UI Analysis from Screenshots
- menu: Breathing glow effect on AI button working correctly
- settings: Scroll indicator visible, content fits in viewport
- history: Clear confirmation dialog centered, buttons above safe bottom
- guide: Page navigation buttons positioned above safe bottom
- game: Input area and history panel layout correct
- result: Achievement badges and share buttons well positioned

### Next Iteration Recommendations
- P3: Add guess history scrolling/paging in game scene for long games
- Consider extracting safeArea logic to a reusable Scene mixin
- Add swipe gesture support for page navigation in guide scene

---
## 10. Automation Iteration Log (2026-03-30 continued)

### Game Scene History Scroll Support (v2.4.33)
- [x] Added historyScrollOffset, historyScrollVelocity, historyIsScrolling state
- [x] Added updateHistoryScrollPhysics() with inertia and bounce
- [x] Added getMaxHistoryScrollOffset() for dynamic content calculation
- [x] Modified renderHistory() to use scroll offset and render only visible items
- [x] Added renderHistoryScrollIndicator() for scroll position feedback
- [x] Added swipe/touchstart/touchend handling for history section scrolling
- [x] All 17 Jest tests passed
- [x] Headless screenshots verified: game scene renders correctly

### Product Review Notes (2026-03-30)
1. P1: Settings scene vertical scroll ✅ DONE (v2.4.25)
2. P2: Unify safe-area handling in guide/history/settings ✅ DONE (v2.4.32)
3. P3: Game scene history scrolling ✅ DONE (v2.4.33)

### Technical Implementation Details
- Scroll physics: friction=0.95, bounceStiffness=0.1 (same as history.js)
- Item height: 48px, gap: 8px
- Virtual rendering: only render visible items based on startIndex/endIndex
- Scroll indicator shows position and fades when not scrolling

### Next Iteration Recommendations
- Consider extracting scroll logic to reusable ScrollableView mixin
- Add scroll-to-bottom when new guess is added
- P4: Extract scroll logic to engine component for reusability

---
## 11. Automation Iteration Log (2026-03-30 continued)

### Auto-scroll to Bottom on New Guess (v2.4.34)
- [x] Added scrollHistoryToBottom() method
- [x] Called in submitGuess() after adding new guess to history
- [x] Improves UX by automatically showing the latest guess
- [x] All 17 Jest tests passed
- [x] Headless screenshots verified

### Product Review Notes (2026-03-30)
- P1-P3 core tasks all completed ✅
- Small UX improvements continue to polish the experience
- Auto-scroll ensures users always see their latest guess

### Technical Details
- scrollHistoryToBottom() sets scrollOffset to maxScrollOffset
- Resets scrollVelocity to 0 for smooth instant positioning
- Only applies to user guesses (AI guesses shown separately in AI section)

### Next Iteration Recommendations
- P4: Extract scroll logic to reusable ScrollableView mixin
- Consider adding smooth animation for auto-scroll
- Review result scene for achievement badge positioning

---
## 12. Automation Iteration Log (2026-03-30 continued)

### New Guess Highlight Animation (v2.4.35)
- [x] Added newGuessHighlightTime state for tracking highlight duration
- [x] Highlight lasts 800ms and fades out smoothly
- [x] Renders accent color border and background on latest guess item
- [x] Only shows when the new guess is within visible scroll area
- [x] All 17 Jest tests passed
- [x] Headless screenshots verified

### Product Review Notes (2026-03-30)
- Core P1-P3 tasks completed ✅
- UX improvements continue to polish the experience
- Highlight animation provides clear visual feedback for new guesses

### Technical Details
- newGuessHighlightDuration: 800ms
- Alpha fades linearly from 0.3 to 0
- Border uses accent color with 2px stroke
- Background uses accent color with fading alpha

### Next Iteration Recommendations
- Consider smooth scroll animation instead of instant jump
- P4: Extract scroll logic to reusable mixin
- Review animation performance on low-end devices

---
## 13. Automation Iteration Log (2026-03-30 continued)

### Smooth Scroll Animation (v2.4.36)
- [x] Added smooth scroll state variables (target, start, progress, duration)
- [x] Modified scrollHistoryToBottom() to start smooth animation
- [x] Added easeOutQuad() easing function for natural feel
- [x] Updates scroll position progressively in update()
- [x] Cancels smooth scroll on user touch/swipe interaction
- [x] All 17 Jest tests passed
- [x] Headless screenshots verified

### Product Review Notes (2026-03-30)
- Core P1-P3 tasks completed ✅
- UX improvements: highlight + smooth scroll enhance user experience
- Smooth scroll duration: 300ms with easeOutQuad easing

### Technical Details
- easeOutQuad: starts fast, slows down naturally
- Duration: 300ms (feels responsive but not jarring)
- User interaction cancels smooth scroll immediately
- Small distance (<10px) skips animation for responsiveness

### Next Iteration Recommendations
- P4: Extract scroll logic to reusable mixin for settings/history/game scenes
- Consider scroll-to-top button for long history lists
- Review performance on low-end devices

---
## 14. Automation Iteration Log (2026-03-30 continued)

### Scroll to Top Button (v2.4.37)
- [x] Added showScrollToTop state and scrollToTopThreshold (100px)
- [x] Added renderScrollToTopButton() method with circular button
- [x] Added scrollToTop() method with smooth scroll animation
- [x] Button shows when scroll offset > threshold
- [x] Tapping button smoothly scrolls to top
- [x] All 17 Jest tests passed
- [x] Headless screenshots verified

### Product Review Notes (2026-03-30)
- Scroll functionality fully polished with smooth animations
- Back-to-top button provides quick navigation for long games
- UX is now comparable to native apps

### Technical Details
- Button appears after scrolling 100px down
- Uses same smooth scroll animation (300ms, easeOutQuad)
- Circular button with up arrow icon
- Positioned in top-right of history section

### Next Iteration Recommendations
- P4: Extract scroll logic to reusable mixin
- Consider long-press on history item for details
- Review overall game UI for consistency

---
## 15. Automation Iteration Log (2026-03-30 continued)

### Button Radius Consistency Fix (v2.4.38)
- [x] Unified button radius to 8px (theme.js borderRadius.md)
- [x] Updated guide.js buttons: radius 12 → 8
- [x] Updated history.js buttons: radius 12/10 → 8
- [x] Updated result.js buttons: radius 10 → 8
- [x] All 17 Jest tests passed
- [x] Headless screenshots verified

### Product Review Notes (2026-03-30)
- UI consistency improved across all scenes
- Button styling now follows theme.js design tokens
- borderRadius.md (8px) used for all buttons

### Design Token Reference
- borderRadius.sm = 4px (tags, small buttons)
- borderRadius.md = 8px (buttons, inputs) ← now standard
- borderRadius.lg = 12px (cards)
- borderRadius.xl = 16px (dialogs)

### Next Iteration Recommendations
- P4: Extract scroll logic to reusable mixin
- Consider adding button hover/press animations
- Review card radius consistency across scenes

---
## 16. Automation Iteration Log (2026-03-30 continued)

### Card Radius Consistency Fix (v2.4.39)
- [x] Unified card radius to 12px (theme.js borderRadius.lg)
- [x] game.js AI section: 16px → 12px
- [x] guide.js content card: 16px → 12px
- [x] result.js answer/stats cards: 16px → 12px
- [x] Dialogs remain at 16px (borderRadius.xl) - correct
- [x] All 17 Jest tests passed
- [x] Headless screenshots verified

### Product Review Notes (2026-03-30)
- UI consistency further improved
- Card styling now follows theme.js design tokens
- borderRadius.lg (12px) for cards
- borderRadius.xl (16px) for dialogs/popups

### Design Token Reference
- borderRadius.sm = 4px (tags)
- borderRadius.md = 8px (buttons, inputs)
- borderRadius.lg = 12px (cards) ← now standard
- borderRadius.xl = 16px (dialogs, modals)

### Next Iteration Recommendations
- P4: Extract scroll logic to reusable mixin
- Review menu.js glass card implementation
- Consider adding subtle animations on scene transitions

---
## 17. Automation Iteration Log (2026-03-30 continued)

### Menu.js Glass Card Review (v2.4.40)
- [x] Reviewed menu.js glass card implementation
- [x] Verified radius uses Theme.borderRadius.lg (12px) ✅
- [x] Verified colors use theme.glass.bg/border/highlight ✅
- [x] Shadow and highlight effects correctly enabled ✅
- [x] Implementation follows theme.js design tokens
- [x] No changes needed - implementation is correct

### Product Review Notes (2026-03-30)
- UI consistency audit complete
- All design tokens properly used across scenes
- Glass card effect properly implemented with blur, shadow, and highlight

### Design Token Compliance Summary
- borderRadius.md (8px): All buttons ✅
- borderRadius.lg (12px): All cards ✅
- borderRadius.xl (16px): All dialogs ✅
- Glass effect: Properly uses glass.bg/border/highlight ✅

### Next Iteration Recommendations
- P4: Extract scroll logic to reusable mixin (large refactor)
- Consider scene transition animations
- Add loading states for async operations

---
## 18. Automation Iteration Log (2026-03-30 continued)

### Scene Transition Animation Review (v2.4.41)
- [x] Reviewed scene.js scene transition implementation
- [x] Feature already fully implemented:
  - Three transition effects: fade, slide, scale
  - Easing function for smooth animation
  - Input disabled during transition
  - Settings page has transition effect selector
- [x] Settings transition options: 🌫️ 淡入, ➡️ 滑动, 📐 缩放
- [x] All 17 Jest tests passed

### Product Review Notes (2026-03-30)
- Scene transition animation feature is complete and working
- Users can customize transition effect in settings
- Smooth transitions enhance user experience

### Feature Summary
- transition.duration: 250ms (optimized for responsiveness)
- transition.effect: fade (default) | slide | scale
- Easing: ease-in-out for natural feel
- Input blocked during transition to prevent accidental taps

### Next Iteration Recommendations
- P4: Extract scroll logic to reusable mixin
- Consider adding haptic feedback on scene transitions
- Review performance on low-end devices

---
## 19. Automation Iteration Log (2026-03-30 continued)

### Scene Transition Haptic Feedback (v2.4.42)
- [x] Added triggerTransitionVibration() method to scene.js
- [x] Short vibration on scene switch for tactile feedback
- [x] Respects user vibration setting (disabled if vibration off)
- [x] All 17 Jest tests passed
- [x] Headless screenshots verified

### Product Review Notes (2026-03-30)
- Haptic feedback enhances scene transition experience
- Consistent with button press vibration pattern
- Users can disable in settings if unwanted

### Technical Details
- Vibration triggered in performSceneSwitch()
- Checks game.audioManager availability
- Respects gameState.settings.vibration setting
- Uses 'short' vibration type for quick feedback

### Next Iteration Recommendations
- P4: Extract scroll logic to reusable mixin
- Review memory usage during long play sessions

---
## 21. Automation Iteration Log (2026-03-30 continued)

### Guide Scene Button Press Feedback (v2.4.44)
- [x] Added pressedItem state variable to guide.js
- [x] Added press state detection in handleInput()
- [x] Render passes pressed parameter to drawButton()
- [x] Visual feedback on prev/next button press
- [x] All 109 Jest tests passed
- [x] Headless screenshots verified: all scenes render correctly

### Product Review Notes (2026-03-30)
- Button press feedback now consistent across most scenes
- guide.js joins menu.js, settings.js, history.js, game.js with press feedback
- result.js still needs press feedback implementation

### Technical Details
- pressedItem tracks 'prev' or 'next' button being pressed
- touchStart detection sets pressedItem
- tap event clears pressedItem and triggers action
- swipe event clears pressedItem
- drawButton receives pressed: true/false option

### UI Analysis from Screenshots
- menu: Primary button breathing glow, layout optimized
- settings: Scroll indicator visible, toggle settings aligned
- history: List items render correctly, clear dialog centered
- guide: Page navigation buttons with press feedback ✅
- game: Input area and history scroll work smoothly
- result: Achievement badges and share buttons positioned well

### Next Iteration Recommendations
- P5: Add button press feedback to result.js
- Consider swipe gesture for page navigation in guide scene
- Unify press animation transition effects across all scenes

---
## 20. Automation Iteration Log (2026-03-30 continued)

### Scene Transition Sound Effects (v2.4.43)
- [x] Added playTransition() method to audio.js
- [x] Added triggerTransitionSound() method to scene.js
- [x] Sound effect plays on scene switch for audio feedback
- [x] Respects user soundEnabled setting (disabled if sound off)
- [x] All 109 Jest tests passed
- [x] Headless screenshots verified: all scenes render correctly

### Product Review Notes (2026-03-30)
- Scene transition now has both haptic and audio feedback
- Sound effect: 500Hz + 600Hz dual-tone melody (40ms duration)
- Soft, pleasant transition sound - not intrusive
- Paired with vibration for complete sensory feedback
- Users can disable in settings if unwanted

### Technical Details
- playTransition() uses playMelody([500, 600], 40)
- Higher frequency than key press (800Hz) for distinction
- Short duration (40ms) keeps it snappy
- Called in performSceneSwitch() alongside vibration

### UI Analysis from Screenshots
- menu: AI button breathing glow working correctly
- settings: Sound toggle visible, scroll indicator showing
- history: Clear confirmation dialog centered properly
- guide: Page navigation buttons above safe bottom
- game: Input area and history panel layout correct
- result: Achievement badges and share buttons positioned well

### Next Iteration Recommendations
- P4: Extract scroll logic to reusable mixin
- Consider adding loading states for async operations
- Review performance on low-end devices
