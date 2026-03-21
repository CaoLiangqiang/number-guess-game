import { test, expect } from '@playwright/test';

const SERVER_URL = 'https://111.229.83.216';

// 配置忽略HTTPS错误
test.use({ ignoreHTTPSErrors: true });

test.describe('修复验证', () => {
  test('检查版本信息', async ({ page }) => {
    await page.goto(SERVER_URL);
    await page.waitForLoadState('load');

    // 检查版本显示
    const versionText = await page.locator('#clientVersion').textContent();
    console.log('版本显示:', versionText);

    // 检查环境配置
    const env = await page.evaluate(() => window.GameConfig?.environment);
    console.log('环境:', env);

    // 检查 WebSocket 地址
    const wsUrl = await page.evaluate(() => window.GameConfig?.getWsServer?.());
    console.log('WebSocket地址:', wsUrl);
  });

  test('创建房间测试', async ({ page }) => {
    page.on('console', msg => {
      console.log('浏览器日志:', msg.text());
    });

    await page.goto(SERVER_URL);
    await page.waitForLoadState('load');
    await page.waitForTimeout(1000);

    // 点击双人联机
    await page.locator('button:has-text("双人联机")').click();
    await page.waitForTimeout(500);
    await expect(page.locator('#multiplayerLobby')).toBeVisible();
    console.log('联机大厅已显示');

    // 点击创建房间
    await page.locator('#createRoomSection button').first().click();
    console.log('点击创建房间');

    await page.waitForTimeout(5000);

    // 检查等待房间是否显示
    const waitingRoomVisible = await page.locator('#waitingRoom').isVisible().catch(() => false);
    console.log('等待房间可见:', waitingRoomVisible);

    // 检查房间号
    const roomCode = await page.locator('#displayRoomCode').textContent().catch(() => '未找到');
    console.log('房间号:', roomCode);

    // 截图
    await page.screenshot({ path: 'test-results/fix-verification.png', fullPage: true });
  });
});