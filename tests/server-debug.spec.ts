import { test, expect } from '@playwright/test';

const SERVER_URL = 'http://111.229.83.216';

test.describe('服务器按钮测试', () => {
  test('检查game对象是否存在', async ({ page }) => {
    await page.goto(SERVER_URL);
    await page.waitForLoadState('load');

    const gameExists = await page.evaluate(() => {
      return typeof window.game !== 'undefined';
    });
    console.log('game对象存在:', gameExists);

    const gameType = await page.evaluate(() => {
      return typeof window.game;
    });
    console.log('game类型:', gameType);

    const setDifficultyExists = await page.evaluate(() => {
      return typeof window.game?.setDifficulty === 'function';
    });
    console.log('setDifficulty方法存在:', setDifficultyExists);

    const createRoomExists = await page.evaluate(() => {
      return typeof window.game?.createRoom === 'function';
    });
    console.log('createRoom方法存在:', createRoomExists);
  });

  test('难度按钮点击测试', async ({ page }) => {
    await page.goto(SERVER_URL);
    await page.waitForLoadState('load');
    await page.waitForTimeout(1000);

    // 检查按钮是否可见
    const diff3 = page.locator('#diff3');
    await expect(diff3).toBeVisible();

    // 获取点击前的类
    const beforeClass = await diff3.getAttribute('class');
    console.log('点击前class:', beforeClass);

    // 点击
    await diff3.click();
    await page.waitForTimeout(500);

    // 获取点击后的类
    const afterClass = await diff3.getAttribute('class');
    console.log('点击后class:', afterClass);

    // 检查是否包含selected
    const hasSelected = afterClass?.includes('selected');
    console.log('是否包含selected:', hasSelected);
  });

  test('创建房间按钮点击测试', async ({ page }) => {
    await page.goto(SERVER_URL);
    await page.waitForLoadState('load');
    await page.waitForTimeout(1000);

    // 点击双人联机进入大厅
    await page.locator('button:has-text("双人联机")').click();
    await page.waitForTimeout(500);

    // 检查是否进入联机大厅
    const lobbyVisible = await page.locator('#multiplayerLobby').isVisible();
    console.log('联机大厅可见:', lobbyVisible);

    // 点击创建房间
    const createBtn = page.locator('button:has-text("创建房间")');
    await expect(createBtn).toBeVisible();

    // 检查game.createRoom是否存在
    const createRoomExists = await page.evaluate(() => {
      return typeof window.game?.createRoom === 'function';
    });
    console.log('createRoom方法存在:', createRoomExists);

    await createBtn.click();
    await page.waitForTimeout(2000);

    // 检查是否有房间号显示
    const roomCodeVisible = await page.locator('#roomCodeDisplay').isVisible().catch(() => false);
    console.log('房间号显示:', roomCodeVisible);
  });

  test('浏览器控制台错误检查', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(SERVER_URL);
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    // 点击难度按钮
    await page.locator('#diff3').click();
    await page.waitForTimeout(500);

    // 点击双人联机
    await page.locator('button:has-text("双人联机")').click();
    await page.waitForTimeout(500);

    // 点击创建房间
    await page.locator('button:has-text("创建房间")').click();
    await page.waitForTimeout(1000);

    console.log('控制台错误:', errors);
  });
});