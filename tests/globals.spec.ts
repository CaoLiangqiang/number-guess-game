import { test, expect } from '@playwright/test';

const SERVER_URL = 'https://111.229.83.216';

// 配置忽略HTTPS错误（自签名证书）
test.use({ ignoreHTTPSErrors: true });

test('检查全局变量', async ({ page }) => {
  page.on('console', msg => {
    console.log('浏览器日志:', msg.text());
  });

  await page.goto(SERVER_URL);
  await page.waitForLoadState('load');
  await page.waitForTimeout(2000);

  const globals = await page.evaluate(() => {
    return {
      WebSocketClient: typeof window.WebSocketClient,
      RoomManager: typeof window.RoomManager,
      game: typeof window.game,
      GameConfig: typeof window.GameConfig,
      debugLog: typeof window.debugLog
    };
  });

  console.log('全局变量类型:', globals);

  // 检查 network.js 是否加载成功
  const networkLoaded = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    return scripts.map(s => s.getAttribute('src'));
  });
  console.log('加载的脚本:', networkLoaded);
});