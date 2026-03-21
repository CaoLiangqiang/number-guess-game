import { test, expect } from '@playwright/test';

const SERVER_URL = 'http://111.229.83.216';

test.describe('服务器UI测试', () => {
  test('主页面加载', async ({ page }) => {
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

  test('挑战AI按钮点击', async ({ page }) => {
    await page.goto(SERVER_URL);
    await page.waitForLoadState('load');

    const pvcButton = page.locator('button:has-text("挑战 AI")');
    await expect(pvcButton).toBeVisible();
    await expect(pvcButton).toBeEnabled();
    await pvcButton.click();

    await page.waitForTimeout(1000);
    await expect(page.locator('#gameScreen')).toBeVisible({ timeout: 5000 });
  });

  test('双人联机按钮点击', async ({ page }) => {
    await page.goto(SERVER_URL);
    await page.waitForLoadState('load');

    const pvpButton = page.locator('button:has-text("双人联机")');
    await expect(pvpButton).toBeVisible();
    await expect(pvpButton).toBeEnabled();
    await pvpButton.click();

    await page.waitForTimeout(500);
    await expect(page.locator('#multiplayerLobby')).toBeVisible({ timeout: 3000 });
  });
});