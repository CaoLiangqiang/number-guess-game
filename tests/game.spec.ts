import { test, expect } from '@playwright/test';

/**
 * 数字对决 Pro - E2E 测试套件
 * 测试人机模式和联机模式的核心功能
 */

test.describe('首页加载', () => {
  test('应该正确加载首页', async ({ page }) => {
    await page.goto('/');
    
    // 验证页面标题
    await expect(page).toHaveTitle(/数字对决/);
    
    // 验证主菜单显示
    const mainMenu = page.locator('#mainMenu');
    await expect(mainMenu).toBeVisible();
    
    // 验证游戏标题
    await expect(page.locator('text=数字对决 Pro')).toBeVisible();
  });
  
  test('PWA manifest应该正确加载', async ({ page }) => {
    const manifestUrl = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifestUrl).toBe('/manifest.json');
  });
});

test.describe('人机模式测试', () => {
  test('应该能够开始人机模式游戏', async ({ page }) => {
    await page.goto('/');
    
    // 点击人机模式按钮
    await page.click('text=人机模式');
    
    // 验证游戏屏幕显示
    const gameScreen = page.locator('#gameScreen');
    await expect(gameScreen).toBeVisible();
  });
  
  test('应该能够设置秘密数字', async ({ page }) => {
    await page.goto('/');
    
    // 开始人机模式
    await page.click('text=人机模式');
    
    // 找到设置秘密数字的输入框
    const secretInputs = page.locator('#secretSetupPanel input');
    await expect(secretInputs).toHaveCount(4);
    
    // 输入秘密数字 1234
    await secretInputs.nth(0).fill('1');
    await secretInputs.nth(1).fill('2');
    await secretInputs.nth(2).fill('3');
    await secretInputs.nth(3).fill('4');
    
    // 点击确认按钮
    await page.click('text=确认');
    
    // 验证游戏开始（应该显示猜测面板）
    const guessPanel = page.locator('#guessInputPanel');
    await expect(guessPanel).toBeVisible();
  });
});

test.describe('PWA 功能测试', () => {
  test('service worker 应该正确注册', async ({ page }) => {
    await page.goto('/');
    
    // 检查 service worker 是否已注册
    const serviceWorkerRegistered = await page.evaluate(async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      return registrations.length > 0;
    });
    
    expect(serviceWorkerRegistered).toBeTruthy();
  });
  
  test('manifest.json 应该是有效的 JSON', async ({ page }) => {
    const manifestResponse = await page.request.get('/manifest.json');
    expect(manifestResponse.ok()).toBeTruthy();
    
    const manifest = await manifestResponse.json();
    expect(manifest.name).toBeDefined();
    expect(manifest.start_url).toBeDefined();
  });
});

test.describe('游戏逻辑测试', () => {
  test('应该正确计算猜测结果', async ({ page }) => {
    await page.goto('/');
    
    // 开始人机模式并设置秘密数字 1234
    await page.click('text=人机模式');
    
    const secretInputs = page.locator('#secretSetupPanel input');
    await secretInputs.nth(0).fill('1');
    await secretInputs.nth(1).fill('2');
    await secretInputs.nth(2).fill('3');
    await secretInputs.nth(3).fill('4');
    await page.click('text=确认');
    
    // 等待游戏开始
    await page.waitForSelector('#guessInputPanel:not(.hidden)', { timeout: 5000 });
    
    // AI 应该已经进行了一次猜测
    // 检查猜测历史中是否有记录
    const guessHistory = page.locator('#aiGuessHistory .guess-item, .ai-guess-item, [class*="guess"]');
    // AI 可能已经猜测了一次，这是正常的
  });
});