import { test, expect } from '@playwright/test';

const SERVER_URL = 'https://111.229.83.216';

// 配置忽略HTTPS错误（自签名证书）
test.use({ ignoreHTTPSErrors: true });

test.describe('WebSocket连接测试', () => {
  test('检查WebSocket连接状态', async ({ page }) => {
    page.on('console', msg => {
      console.log('浏览器日志:', msg.text());
    });

    await page.goto(SERVER_URL);
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    // 检查配置
    const config = await page.evaluate(() => {
      return {
        environment: window.GameConfig?.environment,
        wsServer: window.GameConfig?.getWsServer?.()
      };
    });
    console.log('环境配置:', config);

    // 点击双人联机
    await page.locator('button:has-text("双人联机")').click();
    await page.waitForTimeout(2000);

    // 检查连接状态
    const connStatus = await page.locator('#connectionStatus').textContent().catch(() => '未找到');
    console.log('连接状态:', connStatus);

    // 检查WebSocket客户端
    const wsState = await page.evaluate(() => {
      const game = window.game as any;
      return {
        wsClientExists: !!game?.wsClient,
        wsConnected: game?.wsClient?.isConnected?.(),
        wsUrl: game?.wsClient?.serverUrl
      };
    });
    console.log('WebSocket状态:', wsState);

    // 尝试创建房间
    await page.locator('button:has-text("创建房间")').click();
    await page.waitForTimeout(3000);

    // 检查是否有错误提示
    const errorVisible = await page.locator('.text-red-400, .text-red-500, [class*="error"]').first().isVisible().catch(() => false);
    console.log('有错误提示:', errorVisible);

    // 检查房间号
    const roomCode = await page.locator('#roomCodeDisplay').textContent().catch(() => '未找到');
    console.log('房间号:', roomCode);
  });

  test('直接测试WebSocket连接', async ({ page }) => {
    await page.goto(SERVER_URL);
    await page.waitForLoadState('load');

    // 手动测试WebSocket
    const wsResult = await page.evaluate(async () => {
      return new Promise((resolve) => {
        try {
          const ws = new WebSocket('ws://111.229.83.216:8080');
          let result: any = { status: 'connecting' };

          ws.onopen = () => {
            result.status = 'connected';
            ws.close();
          };

          ws.onerror = (e) => {
            result.status = 'error';
            result.error = 'WebSocket error';
          };

          ws.onclose = () => {
            if (result.status === 'connecting') {
              result.status = 'closed';
            }
            resolve(result);
          };

          // 超时
          setTimeout(() => {
            if (result.status === 'connecting') {
              result.status = 'timeout';
              ws.close();
              resolve(result);
            }
          }, 5000);

          // 如果已连接，立即返回
          setTimeout(() => {
            if (result.status === 'connected') {
              resolve(result);
            }
          }, 100);
        } catch (e: any) {
          resolve({ status: 'exception', error: e.message });
        }
      });
    });

    console.log('WebSocket测试结果:', wsResult);
    expect(wsResult).toHaveProperty('status', 'connected');
  });
});