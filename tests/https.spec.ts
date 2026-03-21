import { test, expect } from '@playwright/test';

const SERVER_URL = 'https://111.229.83.216';

test.describe('HTTPS服务器测试', () => {
  test('主页面HTTPS访问', async ({ page }) => {
    await page.goto(SERVER_URL);
    await page.waitForLoadState('load');
    await expect(page.locator('#mainMenu')).toBeVisible();
  });

  test('难度按钮切换', async ({ page }) => {
    await page.goto(SERVER_URL);
    await page.waitForLoadState('load');

    const diff3 = page.locator('#diff3');
    const diff4 = page.locator('#diff4');
    const diff5 = page.locator('#diff5');

    await diff3.click();
    await expect(diff3).toHaveClass(/selected/);
    await expect(diff4).not.toHaveClass(/selected/);

    await diff5.click();
    await expect(diff5).toHaveClass(/selected/);
    await expect(diff3).not.toHaveClass(/selected/);
  });

  test('创建房间 - WSS连接', async ({ page }) => {
    page.on('console', msg => {
      if (msg.text().includes('WebSocket') || msg.text().includes('NPG')) {
        console.log('日志:', msg.text());
      }
    });

    await page.goto(SERVER_URL);
    await page.waitForLoadState('load');

    // 点击双人联机
    await page.locator('button:has-text("双人联机")').click();
    await page.waitForTimeout(500);
    await expect(page.locator('#multiplayerLobby')).toBeVisible();

    // 点击创建房间
    await page.locator('#createRoomSection button').first().click();
    await page.waitForTimeout(3000);

    // 验证房间创建成功
    await expect(page.locator('#waitingRoom')).toBeVisible();
    const roomCode = await page.locator('#displayRoomCode').textContent();
    console.log('房间号:', roomCode);
    expect(roomCode).toMatch(/^[0-9A-F]{6}$/);
  });
});