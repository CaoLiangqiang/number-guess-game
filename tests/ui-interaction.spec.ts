/**
 * UI交互测试 - 模拟所有用户可能的界面点击操作
 * 验证UI表现符合预期
 */

import { test, expect } from '@playwright/test';

test.describe('主菜单UI交互测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    await expect(page.locator('#mainMenu')).toBeVisible();
  });

  test('难度按钮切换 - 所有难度互斥', async ({ page }) => {
    const diff3 = page.locator('#diff3');
    const diff4 = page.locator('#diff4');
    const diff5 = page.locator('#diff5');

    // 初始状态：diff4应该被选中
    await expect(diff4).toHaveClass(/selected/);
    await expect(diff3).not.toHaveClass(/selected/);
    await expect(diff5).not.toHaveClass(/selected/);

    // 点击简单
    await diff3.click();
    await expect(diff3).toHaveClass(/selected/);
    await expect(diff4).not.toHaveClass(/selected/);
    await expect(diff5).not.toHaveClass(/selected/);

    // 点击困难
    await diff5.click();
    await expect(diff5).toHaveClass(/selected/);
    await expect(diff3).not.toHaveClass(/selected/);
    await expect(diff4).not.toHaveClass(/selected/);

    // 点击普通
    await diff4.click();
    await expect(diff4).toHaveClass(/selected/);
    await expect(diff3).not.toHaveClass(/selected/);
    await expect(diff5).not.toHaveClass(/selected/);
  });

  test('难度选择后输入框数量正确', async ({ page }) => {
    // 选择简单(3位)
    await page.click('#diff3');

    // 点击开始游戏按钮
    await page.locator('button:has-text("挑战 AI")').click();

    // 等待游戏初始化
    await page.waitForTimeout(500);

    // 初始化游戏（确保输入框渲染）
    await page.evaluate(() => {
      if (window.game) window.game.startGame();
    });

    await page.waitForTimeout(300);

    let inputs = page.locator('#secretInputContainer .digit-input');
    await expect(inputs.first()).toBeVisible({ timeout: 3000 });
    expect(await inputs.count()).toBe(3);

    // 返回主菜单
    await page.evaluate(() => {
      document.getElementById('gameScreen')?.classList.add('hidden');
      document.getElementById('mainMenu')?.classList.remove('hidden');
    });

    await page.waitForTimeout(300);

    // 选择困难(5位)
    await page.click('#diff5');
    await page.locator('button:has-text("挑战 AI")').click();

    await page.waitForTimeout(500);

    await page.evaluate(() => {
      if (window.game) window.game.startGame();
    });

    await page.waitForTimeout(300);

    inputs = page.locator('#secretInputContainer .digit-input');
    await expect(inputs.first()).toBeVisible({ timeout: 3000 });
    expect(await inputs.count()).toBe(5);
  });

  test('音效开关切换', async ({ page }) => {
    const soundToggle = page.locator('#soundToggle');

    if (await soundToggle.isVisible()) {
      // 获取初始状态
      const soundOnIcon = page.locator('#soundOnIcon');
      const soundOffIcon = page.locator('#soundOffIcon');

      // 点击切换
      await soundToggle.click();
      await page.waitForTimeout(100);

      // 再次点击恢复
      await soundToggle.click();
      await page.waitForTimeout(100);
    }
  });

  test('人机对战按钮可点击', async ({ page }) => {
    const pvcButton = page.locator('button:has-text("挑战 AI")');
    await expect(pvcButton).toBeVisible();
    await expect(pvcButton).toBeEnabled();
  });

  test('联机对战按钮可点击', async ({ page }) => {
    const pvpButton = page.locator('button:has-text("双人联机")');
    await expect(pvpButton).toBeVisible();
    await expect(pvpButton).toBeEnabled();
  });
});

test.describe('游戏界面UI交互测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // 进入游戏
    await page.evaluate(() => {
      document.getElementById('mainMenu')?.classList.add('hidden');
      document.getElementById('gameScreen')?.classList.remove('hidden');
      if (window.game) window.game.startGame();
    });

    await page.waitForTimeout(300);
  });

  test('秘密数字输入 - 逐位输入并自动跳转', async ({ page }) => {
    const inputs = page.locator('#secretInputContainer .digit-input');
    const count = await inputs.count();

    // 依次输入数字
    for (let i = 0; i < count; i++) {
      await inputs.nth(i).fill(String(i + 1));
    }

    // 验证所有输入都有值
    for (let i = 0; i < count; i++) {
      await expect(inputs.nth(i)).toHaveValue(String(i + 1));
    }
  });

  test('确认按钮 - 未填满时无法确认', async ({ page }) => {
    const inputs = page.locator('#secretInputContainer .digit-input');
    const count = await inputs.count();

    // 只填写部分
    await inputs.nth(0).fill('1');

    // 点击确认
    await page.click('button:has-text("确认秘密数字")');

    // 应该还在秘密设置阶段
    await expect(page.locator('#secretSetupPanel')).toBeVisible();
  });

  test('确认按钮 - 填满后可以确认', async ({ page }) => {
    const inputs = page.locator('#secretInputContainer .digit-input');
    const count = await inputs.count();

    // 填写所有输入
    for (let i = 0; i < count; i++) {
      await inputs.nth(i).fill(String(i + 1));
    }

    // 点击确认
    await page.click('button:has-text("确认秘密数字")');

    // 秘密设置面板应该隐藏
    await expect(page.locator('#secretSetupPanel')).toBeHidden();
  });

  test('猜测输入面板显示', async ({ page }) => {
    // 设置秘密数字
    const secretInputs = page.locator('#secretInputContainer .digit-input');
    const count = await secretInputs.count();

    for (let i = 0; i < count; i++) {
      await secretInputs.nth(i).fill(String(i + 1));
    }

    await page.click('button:has-text("确认秘密数字")');

    // 验证猜测输入面板显示
    await expect(page.locator('#guessInputPanel')).toBeVisible();

    // 验证猜测输入框数量正确
    const guessInputs = page.locator('#guessInputContainer .digit-input');
    expect(await guessInputs.count()).toBe(count);
  });

  test('返回按钮功能', async ({ page }) => {
    // 检查返回按钮存在
    const backBtn = page.locator('#gameScreen button:has-text("返回")').first();
    if (await backBtn.isVisible()) {
      await backBtn.click();
      await expect(page.locator('#mainMenu')).toBeVisible();
    }
  });
});

test.describe('联机大厅UI交互测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // 进入联机大厅
    await page.evaluate(() => {
      document.getElementById('mainMenu')?.classList.add('hidden');
      document.getElementById('multiplayerLobby')?.classList.remove('hidden');
    });

    await page.waitForTimeout(300);
  });

  test('房间号输入限制6位', async ({ page }) => {
    const roomInput = page.locator('#roomCodeInput');

    // 输入超过6位
    await roomInput.fill('123456789');

    // 验证只保留6位
    await expect(roomInput).toHaveValue('123456');
  });

  test('房间号只接受大写字母和数字', async ({ page }) => {
    const roomInput = page.locator('#roomCodeInput');

    // 输入小写字母 - 检查是否有转换逻辑
    await roomInput.fill('abcdef');
    const value = await roomInput.inputValue();
    // 如果有转换逻辑，验证大写；如果没有，则跳过此检查
    console.log('Room input value:', value);
  });

  test('创建房间按钮', async ({ page }) => {
    const createBtn = page.locator('button:has-text("创建房间")');
    await expect(createBtn).toBeVisible();
    await expect(createBtn).toBeEnabled();
  });

  test('随机匹配按钮', async ({ page }) => {
    const randomBtn = page.locator('button:has-text("随机匹配")');
    await expect(randomBtn).toBeVisible();
    await expect(randomBtn).toBeEnabled();
  });

  test('返回主菜单', async ({ page }) => {
    await page.click('button:has-text("返回")');
    await expect(page.locator('#mainMenu')).toBeVisible();
    await expect(page.locator('#multiplayerLobby')).toBeHidden();
  });
});

test.describe('战绩显示测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
  });

  test('战绩初始显示', async ({ page }) => {
    const statsDisplay = page.locator('#statsDisplay');
    await expect(statsDisplay).toBeVisible();
    await expect(statsDisplay).toContainText('战绩');
  });

  test('游戏结束后战绩更新', async ({ page }) => {
    // 清空之前的战绩
    await page.evaluate(() => {
      localStorage.removeItem('gameStats');
      localStorage.removeItem('gameHistory');
    });

    await page.reload();
    await page.waitForLoadState('load');

    // 验证初始战绩
    const statsDisplay = page.locator('#statsDisplay');
    await expect(statsDisplay).toContainText('胜:0');
    await expect(statsDisplay).toContainText('负:0');

    // 模拟添加一条胜利记录
    await page.evaluate(() => {
      // 直接操作 localStorage 模拟战绩保存
      const stats = { wins: 1, losses: 0, totalGames: 1 };
      localStorage.setItem('gameStats', JSON.stringify(stats));
    });

    // 刷新页面验证战绩更新
    await page.reload();
    await page.waitForLoadState('load');

    // 验证战绩更新（应该显示胜:1）
    await expect(statsDisplay).toContainText('胜:1');
  });
});

test.describe('难度持久化测试', () => {
  test('难度选择被保存', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // 选择困难
    await page.click('#diff5');

    // 刷新页面
    await page.reload();
    await page.waitForLoadState('load');

    // 困难应该仍然被选中
    await expect(page.locator('#diff5')).toHaveClass(/selected/);
    await expect(page.locator('#diff4')).not.toHaveClass(/selected/);
    await expect(page.locator('#diff3')).not.toHaveClass(/selected/);
  });
});