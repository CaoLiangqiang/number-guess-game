import { test, expect } from '@playwright/test';

const SERVER_URL = 'http://111.229.83.216';

test('捕获network.js错误', async ({ page }) => {
  const errors: string[] = [];
  const consoleErrors: string[] = [];

  page.on('pageerror', error => {
    errors.push(error.message);
    console.log('页面错误:', error.message);
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log('控制台错误:', msg.text());
    }
  });

  await page.goto(SERVER_URL);
  await page.waitForLoadState('load');
  await page.waitForTimeout(3000);

  // 手动执行 network.js 的关键部分
  const result = await page.evaluate(() => {
    try {
      // 检查网络模块是否被正确加载
      const networkScript = document.querySelector('script[src*="network.js"]');
      return {
        scriptLoaded: !!networkScript,
        scriptSrc: networkScript?.getAttribute('src')
      };
    } catch (e: any) {
      return { error: e.message };
    }
  });

  console.log('network.js加载情况:', result);
  console.log('页面错误列表:', errors);
  console.log('控制台错误列表:', consoleErrors);
});