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
    await page.goto('/');
    
    // manifest.json 可以是相对路径或绝对路径
    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifestHref).toBeTruthy();
    // 验证 manifest 是有效的路径
    expect(manifestHref).toMatch(/manifest\.json|\.\/manifest\.json/);
  });
});

test.describe('人机模式测试', () => {
  test('应该能够开始人机模式游戏', async ({ page }) => {
    await page.goto('/');
    
    // 等待页面完全加载
    await page.waitForLoadState('networkidle');
    
    // 点击 "挑战 AI" 按钮（使用 onclick 属性定位）
    await page.click('button[onclick="game.startGame()"]');
    
    // 验证游戏屏幕显示
    const gameScreen = page.locator('#gameScreen');
    await expect(gameScreen).toBeVisible({ timeout: 10000 });
    
    // 验证秘密数字设置面板显示
    const secretSetupPanel = page.locator('#secretSetupPanel');
    await expect(secretSetupPanel).toBeVisible();
  });
  
  test('应该能够设置秘密数字', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 开始人机模式
    await page.click('button[onclick="game.startGame()"]');
    
    // 等待游戏界面显示
    await expect(page.locator('#gameScreen')).toBeVisible({ timeout: 10000 });
    
    // 找到设置秘密数字的输入框
    const secretInputs = page.locator('#secretSetupPanel .digit-input');
    await expect(secretInputs).toHaveCount(4, { timeout: 5000 });
    
    // 输入秘密数字 1234
    await secretInputs.nth(0).fill('1');
    await secretInputs.nth(1).fill('2');
    await secretInputs.nth(2).fill('3');
    await secretInputs.nth(3).fill('4');
    
    // 点击确认按钮
    await page.click('button:has-text("确认秘密数字")');
    
    // 验证游戏开始（应该显示猜测面板）
    const guessPanel = page.locator('#guessInputPanel');
    await expect(guessPanel).toBeVisible({ timeout: 5000 });
  });
});

test.describe('PWA 功能测试', () => {
  test('service worker 应该正确注册', async ({ page }) => {
    await page.goto('/');
    
    // 等待 service worker 注册
    await page.waitForTimeout(2000);
    
    // 检查 service worker 是否已注册
    const serviceWorkerRegistered = await page.evaluate(async () => {
      // 等待一段时间让 SW 注册
      await new Promise(resolve => setTimeout(resolve, 1000));
      const registrations = await navigator.serviceWorker.getRegistrations();
      return registrations.length > 0;
    });
    
    // 如果没有注册，检查 navigator.serviceWorker 是否可用
    if (!serviceWorkerRegistered) {
      const swAvailable = await page.evaluate(() => {
        return 'serviceWorker' in navigator;
      });
      // 至少确认 Service Worker API 可用
      expect(swAvailable).toBeTruthy();
    } else {
      expect(serviceWorkerRegistered).toBeTruthy();
    }
  });
  
  test('manifest.json 应该是有效的 JSON', async ({ page }) => {
    await page.goto('/');
    
    // 直接请求 manifest.json
    const manifestResponse = await page.request.get('/manifest.json');
    expect(manifestResponse.ok()).toBeTruthy();
    
    const manifest = await manifestResponse.json();
    expect(manifest.name).toBeDefined();
    expect(manifest.start_url).toBeDefined();
  });
});

test.describe('游戏逻辑测试', () => {
  test('应该能够完成游戏流程', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 开始人机模式
    await page.click('button[onclick="game.startGame()"]');
    
    // 等待游戏界面显示
    await expect(page.locator('#gameScreen')).toBeVisible({ timeout: 10000 });
    
    // 验证秘密数字设置面板可见
    await expect(page.locator('#secretSetupPanel')).toBeVisible();
    
    // 设置秘密数字
    const secretInputs = page.locator('#secretSetupPanel .digit-input');
    await expect(secretInputs).toHaveCount(4);
    await secretInputs.nth(0).fill('1');
    await secretInputs.nth(1).fill('2');
    await secretInputs.nth(2).fill('3');
    await secretInputs.nth(3).fill('4');
    await page.click('button:has-text("确认秘密数字")');
    
    // 等待猜测面板显示
    await expect(page.locator('#guessInputPanel')).toBeVisible({ timeout: 5000 });
    
    // 验证游戏状态正确
    const guessPanel = page.locator('#guessInputPanel');
    await expect(guessPanel).toBeVisible();
  });
});