import { test, expect } from '@playwright/test';

/**
 * 数字对决 Pro - 界面截图测试
 * 验证关键页面的视觉呈现
 */

test.describe('主菜单截图测试', () => {
  test('主菜单桌面端视觉检查', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 等待主菜单可见
    await expect(page.locator('#mainMenu')).toBeVisible();

    // 截图主菜单
    await expect(page).toHaveScreenshot('main-menu-desktop.png', {
      fullPage: true
    });
  });

  test('主菜单移动端视觉检查', async ({ page }) => {
    // 设置移动视口
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 等待主菜单可见
    await expect(page.locator('#mainMenu')).toBeVisible();

    // 截图主菜单
    await expect(page).toHaveScreenshot('main-menu-mobile.png', {
      fullPage: true
    });
  });
});

test.describe('游戏界面截图测试', () => {
  test('游戏界面桌面端视觉检查', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 通过 JavaScript 直接显示游戏界面，隐藏所有其他界面
    await page.evaluate(() => {
      document.getElementById('mainMenu').classList.add('hidden');
      document.getElementById('multiplayerLobby').classList.add('hidden');
      document.getElementById('waitingRoom').classList.add('hidden');
      const gameScreen = document.getElementById('gameScreen');
      if (gameScreen) {
        gameScreen.classList.remove('hidden');
        gameScreen.classList.add('grid');
      }
    });

    // 等待 DOM 更新完成
    await page.waitForTimeout(500);

    // 等待游戏界面可见
    await expect(page.locator('#gameScreen')).toBeVisible();

    // 截图游戏界面
    await expect(page).toHaveScreenshot('game-screen-desktop.png', {
      fullPage: true
    });
  });

  test('游戏界面移动端视觉检查', async ({ page }) => {
    // 设置移动视口
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 通过 JavaScript 直接显示游戏界面，隐藏所有其他界面
    await page.evaluate(() => {
      document.getElementById('mainMenu').classList.add('hidden');
      document.getElementById('multiplayerLobby').classList.add('hidden');
      document.getElementById('waitingRoom').classList.add('hidden');
      const gameScreen = document.getElementById('gameScreen');
      if (gameScreen) {
        gameScreen.classList.remove('hidden');
        gameScreen.classList.remove('grid');
      }
    });

    // 等待 DOM 更新完成
    await page.waitForTimeout(500);

    // 等待游戏界面可见
    await expect(page.locator('#gameScreen')).toBeVisible();

    // 截图游戏界面
    await expect(page).toHaveScreenshot('game-screen-mobile.png', {
      fullPage: true
    });
  });
});

test.describe('联机大厅截图测试', () => {
  test('联机大厅桌面端视觉检查', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 通过 JavaScript 直接显示联机大厅，隐藏所有其他界面
    await page.evaluate(() => {
      document.getElementById('mainMenu').classList.add('hidden');
      document.getElementById('gameScreen').classList.add('hidden');
      document.getElementById('waitingRoom').classList.add('hidden');
      const multiplayerLobby = document.getElementById('multiplayerLobby');
      if (multiplayerLobby) multiplayerLobby.classList.remove('hidden');
    });

    // 等待 DOM 更新完成
    await page.waitForTimeout(500);

    // 等待联机大厅可见
    await expect(page.locator('#multiplayerLobby')).toBeVisible();

    // 截图联机大厅
    await expect(page).toHaveScreenshot('multiplayer-lobby-desktop.png', {
      fullPage: true
    });
  });

  test('联机大厅移动端视觉检查', async ({ page }) => {
    // 设置移动视口
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 通过 JavaScript 直接显示联机大厅，隐藏所有其他界面
    await page.evaluate(() => {
      document.getElementById('mainMenu').classList.add('hidden');
      document.getElementById('gameScreen').classList.add('hidden');
      document.getElementById('waitingRoom').classList.add('hidden');
      const multiplayerLobby = document.getElementById('multiplayerLobby');
      if (multiplayerLobby) multiplayerLobby.classList.remove('hidden');
    });

    // 等待 DOM 更新完成
    await page.waitForTimeout(500);

    // 等待联机大厅可见
    await expect(page.locator('#multiplayerLobby')).toBeVisible();

    // 截图联机大厅
    await expect(page).toHaveScreenshot('multiplayer-lobby-mobile.png', {
      fullPage: true
    });
  });
});

test.describe('关键元素存在性验证', () => {
  test('主菜单关键元素存在', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 验证标题
    await expect(page.locator('text=数字对决 Pro')).toBeVisible();

    // 验证难度选择
    await expect(page.locator('#diff3')).toBeVisible();
    await expect(page.locator('#diff4')).toBeVisible();
    await expect(page.locator('#diff5')).toBeVisible();

    // 验证游戏模式按钮
    await expect(page.locator('button:has-text("挑战 AI")')).toBeVisible();
    await expect(page.locator('button:has-text("双人联机")')).toBeVisible();

    // 验证游戏规则说明
    await expect(page.locator('text=游戏规则')).toBeVisible();

    // 验证版本号
    await expect(page.locator('#clientVersion')).toBeVisible();
  });

  test('游戏界面关键元素存在', async ({ page, isMobile }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 通过 JavaScript 直接显示游戏界面 - 先隐藏所有其他面板
    await page.evaluate(() => {
      const mainMenu = document.getElementById('mainMenu');
      const multiplayerLobby = document.getElementById('multiplayerLobby');
      const waitingRoom = document.getElementById('waitingRoom');
      const gameScreen = document.getElementById('gameScreen');
      if (mainMenu) mainMenu.classList.add('hidden');
      if (multiplayerLobby) multiplayerLobby.classList.add('hidden');
      if (waitingRoom) waitingRoom.classList.add('hidden');
      if (gameScreen) {
        gameScreen.classList.remove('hidden');
        gameScreen.classList.add('grid');
      }
    });

    // 验证游戏界面关键元素
    await expect(page.locator('#secretSetupPanel')).toBeVisible();

    // AI思考面板在移动端被隐藏，桌面端可见
    if (!isMobile) {
      await expect(page.locator('#aiThinkingPanel')).toBeVisible();
      await expect(page.locator('#aiPossibilities')).toBeVisible();
      await expect(page.locator('#aiEntropy')).toBeVisible();
      // 验证进度条和最佳猜测显示（进度条宽度为0时被认为是隐藏的）
      await expect(page.locator('#progressBar')).toBeAttached();
      await expect(page.locator('#aiBestGuess')).toBeVisible();
      // AI终端需要展开details才能看到
      const terminalDetails = page.locator('#aiThinkingPanel details');
      await terminalDetails.locator('summary').click();
      await expect(page.locator('#aiTerminal')).toBeVisible();
    }
  });

  test('联机大厅关键元素存在', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 通过 JavaScript 直接显示联机大厅 - 先隐藏所有其他面板
    await page.evaluate(() => {
      const mainMenu = document.getElementById('mainMenu');
      const gameScreen = document.getElementById('gameScreen');
      const waitingRoom = document.getElementById('waitingRoom');
      const multiplayerLobby = document.getElementById('multiplayerLobby');
      if (mainMenu) mainMenu.classList.add('hidden');
      if (gameScreen) gameScreen.classList.add('hidden');
      if (waitingRoom) waitingRoom.classList.add('hidden');
      if (multiplayerLobby) multiplayerLobby.classList.remove('hidden');
    });

    // 验证联机大厅关键元素
    await expect(page.locator('text=联机大厅')).toBeVisible();
    await expect(page.locator('#createRoomSection')).toBeVisible();
    await expect(page.locator('#joinRoomSection')).toBeVisible();
    await expect(page.locator('#roomCodeInput')).toBeVisible();
    await expect(page.locator('#serverNotice')).toBeVisible();
    await expect(page.locator('button:has-text("返回"):not(:has-text("大厅"))')).toBeVisible();
  });
});
