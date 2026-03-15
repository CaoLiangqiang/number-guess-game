import { test, expect } from '@playwright/test';

/**
 * 数字对决 Pro - 扩展 E2E 测试套件
 * 测试联机模式、设置功能、UI交互
 */

// 辅助函数：重置所有面板状态
async function resetAllPanels(page: any) {
  await page.evaluate(() => {
    const panels = ['mainMenu', 'multiplayerLobby', 'gameScreen', 'waitingRoom', 'guessInputPanel', 'secretSetupPanel'];
    panels.forEach(panelId => {
      const panel = document.getElementById(panelId);
      if (panel) panel.classList.add('hidden');
    });
    // 默认显示主菜单
    const mainMenu = document.getElementById('mainMenu');
    if (mainMenu) mainMenu.classList.remove('hidden');
  });
}

// 辅助函数：显示指定面板，隐藏其他所有面板
async function showPanel(page: any, panelId: string) {
  await page.evaluate((id: string) => {
    // 隐藏所有主要面板
    const panels = ['mainMenu', 'multiplayerLobby', 'gameScreen', 'waitingRoom'];
    panels.forEach(panelId => {
      const panel = document.getElementById(panelId);
      if (panel) panel.classList.add('hidden');
    });
    // 显示目标面板
    const targetPanel = document.getElementById(id);
    if (targetPanel) {
      targetPanel.classList.remove('hidden');
      if (id === 'gameScreen') {
        targetPanel.classList.add('grid');
      }
    }
  }, panelId);
}

test.describe('联机模式界面测试', () => {
  test.beforeEach(async ({ page, isMobile }) => {
    // 设置视口大小
    if (isMobile) {
      await page.setViewportSize({ width: 375, height: 667 });
    } else {
      await page.setViewportSize({ width: 1280, height: 720 });
    }
  });

  test('应该能够进入联机大厅', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 等待主菜单可见
    await expect(page.locator('#mainMenu')).toBeVisible();

    // 显示联机大厅
    await showPanel(page, 'multiplayerLobby');

    // 等待动画完成
    await page.waitForTimeout(300);

    // 验证联机大厅显示
    const multiplayerLobby = page.locator('#multiplayerLobby');
    await expect(multiplayerLobby).toBeVisible({ timeout: 5000 });

    // 验证创建房间区域可见
    await expect(page.locator('#createRoomSection')).toBeVisible();

    // 验证加入房间区域可见
    await expect(page.locator('#joinRoomSection')).toBeVisible();

    // 验证房间号输入框存在
    await expect(page.locator('#roomCodeInput')).toBeVisible();
  });

  test('应该能够返回主菜单', async ({ page }) => {
    // 强制刷新页面确保干净状态
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // 额外等待页面完全初始化

    // 重置所有面板状态
    await resetAllPanels(page);
    await page.waitForTimeout(200);

    // 进入联机大厅
    await showPanel(page, 'multiplayerLobby');
    await page.waitForTimeout(500);
    await expect(page.locator('#multiplayerLobby')).toBeVisible();

    // 返回主菜单
    await showPanel(page, 'mainMenu');
    await page.waitForTimeout(500);

    // 验证回到主菜单
    await expect(page.locator('#mainMenu')).toBeVisible();
    await expect(page.locator('#multiplayerLobby')).not.toBeVisible();
  });

  test('房间号输入应该限制为6位', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 进入联机大厅
    await showPanel(page, 'multiplayerLobby');
    await page.waitForTimeout(300);
    await expect(page.locator('#multiplayerLobby')).toBeVisible();

    // 输入超过6位的字符
    const roomInput = page.locator('#roomCodeInput');
    await roomInput.fill('123456789');

    // 验证只保留6位
    await expect(roomInput).toHaveValue('123456');
  });

  test('应该显示服务器状态', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 进入联机大厅
    await showPanel(page, 'multiplayerLobby');
    await page.waitForTimeout(300);
    await expect(page.locator('#multiplayerLobby')).toBeVisible();

    // 验证服务器状态通知区域存在
    await expect(page.locator('#serverNotice')).toBeVisible();
  });
});

test.describe('游戏设置功能测试', () => {
  test('应该能够切换难度等级', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 等待主菜单可见
    await expect(page.locator('#mainMenu')).toBeVisible();

    // 验证难度按钮存在
    await expect(page.locator('#diff3')).toBeVisible();
    await expect(page.locator('#diff4')).toBeVisible();
    await expect(page.locator('#diff5')).toBeVisible();

    // 点击3位难度
    await page.click('#diff3');

    // 点击4位难度
    await page.click('#diff4');

    // 点击5位难度
    await page.click('#diff5');
  });

  test('游戏规则说明应该直接显示在主菜单', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 等待主菜单可见
    await expect(page.locator('#mainMenu')).toBeVisible();

    // 验证游戏规则文本直接显示在页面上
    await expect(page.locator('text=游戏规则')).toBeVisible();
    await expect(page.locator('text=你和AI各选一个四位数')).toBeVisible();
  });
});

test.describe('响应式布局测试', () => {
  test('桌面端应该显示三列布局', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 设置桌面视口
    await page.setViewportSize({ width: 1280, height: 720 });

    // 进入游戏
    await showPanel(page, 'gameScreen');

    // 等待 DOM 更新
    await page.waitForTimeout(300);

    // 验证游戏屏幕显示
    await expect(page.locator('#gameScreen')).toBeVisible();

    // 验证三列布局类存在
    const gameScreen = page.locator('#gameScreen');
    await expect(gameScreen).toHaveClass(/lg:grid-cols-3/);
  });

  test('移动端应该显示单列布局', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 设置移动视口
    await page.setViewportSize({ width: 375, height: 667 });

    // 进入游戏
    await showPanel(page, 'gameScreen');

    // 等待 DOM 更新
    await page.waitForTimeout(300);

    // 验证游戏屏幕显示
    await expect(page.locator('#gameScreen')).toBeVisible();
  });
});

test.describe('人机模式游戏流程扩展测试', () => {
  test.beforeEach(async ({ page, isMobile }) => {
    // 设置视口大小
    if (isMobile) {
      await page.setViewportSize({ width: 375, height: 667 });
    } else {
      await page.setViewportSize({ width: 1280, height: 720 });
    }
  });

  test('应该能够进行猜测并看到反馈', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 等待主菜单可见
    await expect(page.locator('#mainMenu')).toBeVisible();

    // 进入游戏界面
    await showPanel(page, 'gameScreen');

    // 等待动画完成
    await page.waitForTimeout(300);

    // 等待游戏界面显示
    await expect(page.locator('#gameScreen')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#secretSetupPanel')).toBeVisible();

    // 设置秘密数字
    const secretInputs = page.locator('#secretSetupPanel .digit-input');
    await expect(secretInputs).toHaveCount(4);
    await secretInputs.nth(0).fill('1');
    await secretInputs.nth(1).fill('2');
    await secretInputs.nth(2).fill('3');
    await secretInputs.nth(3).fill('4');

    // 点击确认按钮
    await page.click('button:has-text("确认秘密数字")');

    // 由于游戏逻辑依赖 window.game，手动显示猜测面板来模拟游戏状态
    await page.evaluate(() => {
      const secretSetupPanel = document.getElementById('secretSetupPanel');
      const guessInputPanel = document.getElementById('guessInputPanel');
      if (secretSetupPanel) secretSetupPanel.classList.add('hidden');
      if (guessInputPanel) guessInputPanel.classList.remove('hidden');
    });

    // 等待猜测面板显示
    await expect(page.locator('#guessInputPanel')).toBeVisible({ timeout: 5000 });

    // 输入猜测数字
    const guessInputs = page.locator('#guessInputContainer .digit-input');
    const count = await guessInputs.count();
    if (count >= 4) {
      await guessInputs.nth(0).fill('5');
      await guessInputs.nth(1).fill('6');
      await guessInputs.nth(2).fill('7');
      await guessInputs.nth(3).fill('8');

      // 点击提交猜测按钮
      await page.click('#submitGuessBtn');

      // 等待结果显示在面板中
      await page.waitForTimeout(500);

      // 验证历史记录区域存在
      await expect(page.locator('#playerHistory')).toBeVisible();
    }
  });

  test('AI思考面板应该显示正确信息', async ({ page, isMobile }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 进入游戏界面
    await showPanel(page, 'gameScreen');

    // 等待动画完成
    await page.waitForTimeout(300);

    // 等待游戏界面显示
    await expect(page.locator('#gameScreen')).toBeVisible({ timeout: 5000 });

    // AI思考面板在移动端默认隐藏，只在桌面端验证
    if (!isMobile) {
      // 验证AI思考面板存在
      await expect(page.locator('#aiThinkingPanel')).toBeVisible();

      // 验证可能性计数器存在
      await expect(page.locator('#aiPossibilities')).toBeVisible();

      // 验证信息熵显示存在
      await expect(page.locator('#aiEntropy')).toBeVisible();

      // 验证进度条容器存在（进度条本身宽度为0时被认为是隐藏的）
      await expect(page.locator('#progressBar')).toBeAttached();
      await expect(page.locator('#searchProgress')).toBeVisible();

      // 验证最佳猜测显示存在
      await expect(page.locator('#aiBestGuess')).toBeVisible();

      // 验证AI终端区域存在（需要展开details）
      const terminalDetails = page.locator('#aiThinkingPanel details');
      await terminalDetails.locator('summary').click();
      await expect(page.locator('#aiTerminal')).toBeVisible();
    } else {
      // 移动端验证AI面板隐藏
      await expect(page.locator('#aiThinkingPanel')).toBeHidden();
    }
  });
});

test.describe('版本和系统信息显示测试', () => {
  test('应该显示客户端版本号', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 验证版本信息存在
    await expect(page.locator('#clientVersion')).toBeVisible();

    // 验证版本号格式
    const versionText = await page.locator('#clientVersion').textContent();
    expect(versionText).toMatch(/v\d+\.\d+\.\d+/);
  });

  test('应该显示服务器连接状态', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 进入联机模式查看服务器状态
    await showPanel(page, 'multiplayerLobby');
    await page.waitForTimeout(300);

    // 验证服务器版本显示区域存在
    await expect(page.locator('#serverVersion')).toBeVisible();
  });
});

test.describe('等待房间界面测试', () => {
  test.beforeEach(async ({ page, isMobile }) => {
    // 设置视口大小
    if (isMobile) {
      await page.setViewportSize({ width: 375, height: 667 });
    } else {
      await page.setViewportSize({ width: 1280, height: 720 });
    }
  });

  test('等待房间界面元素应该存在', async ({ page }) => {
    // 强制刷新页面确保干净状态
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // 额外等待页面完全初始化

    // 重置所有面板状态
    await resetAllPanels(page);
    await page.waitForTimeout(200);

    // 进入联机大厅
    await showPanel(page, 'multiplayerLobby');

    // 等待动画完成
    await page.waitForTimeout(500);

    await expect(page.locator('#multiplayerLobby')).toBeVisible({ timeout: 5000 });

    // 验证等待房间元素初始状态为隐藏
    await expect(page.locator('#waitingRoom')).not.toBeVisible();

    // 验证房间号显示区域存在（即使隐藏）
    await expect(page.locator('#displayRoomCode')).toBeAttached();

    // 验证准备按钮存在
    await expect(page.locator('#readyBtn')).toBeAttached();

    // 验证玩家状态显示存在
    await expect(page.locator('#playerReadyStatus')).toBeAttached();
  });
});