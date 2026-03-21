import { test, expect } from '@playwright/test';

const SERVER_URL = 'https://111.229.83.216';

// 配置忽略HTTPS错误（自签名证书）
test.use({ ignoreHTTPSErrors: true });

test.describe('创建房间测试', () => {
  test('完整创建房间流程', async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.text().includes('WebSocket') || msg.text().includes('createRoom')) {
        console.log('日志:', msg.text());
      }
    });

    await page.goto(SERVER_URL);
    await page.waitForLoadState('load');
    await page.waitForTimeout(1000);

    // 点击双人联机
    console.log('点击双人联机...');
    await page.locator('button:has-text("双人联机")').click();
    await page.waitForTimeout(500);

    // 等待联机大厅显示
    await expect(page.locator('#multiplayerLobby')).toBeVisible();
    console.log('联机大厅已显示');

    // 点击创建房间
    console.log('点击创建房间...');
    const createBtn = page.locator('#createRoomSection button').first();
    await createBtn.click();

    // 等待WebSocket连接和房间创建
    await page.waitForTimeout(3000);

    // 检查是否进入了等待房间
    const waitingRoomVisible = await page.locator('#waitingRoom').isVisible().catch(() => false);
    console.log('等待房间可见:', waitingRoomVisible);

    // 检查房间号是否显示
    const roomCode = await page.locator('#displayRoomCode').textContent().catch(() => '未找到');
    console.log('房间号:', roomCode);

    // 截图
    await page.screenshot({ path: 'test-results/create-room-debug.png', fullPage: true });
  });
});