/**
 * 无头截图脚本 v5
 * 增加渲染等待时间，确保Canvas更新
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:8081';
const OUTPUT_DIR = path.join(__dirname, 'screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const SCENES = [
  { name: 'menu', label: '主菜单' },
  { name: 'settings', label: '设置页' },
  { name: 'history', label: '历史记录' },
  { name: 'guide', label: '新手引导' },
  { name: 'game', label: 'AI对战', params: { mode: 'ai' } },
  { name: 'result', label: '胜利结果', params: { isWin: true, secretNumber: '5280', turns: 5, duration: 68, mode: 'ai' } }
];

async function captureScreenshots() {
  console.log('🚀 启动无头浏览器截图...\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const results = [];

  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
    deviceScaleFactor: 2
  });

  const page = await context.newPage();

  try {
    console.log('  加载预览页面...');
    await page.goto(`${BASE_URL}/miniprogram-preview.html`, {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    console.log('  等待小游戏初始化...');
    await page.waitForTimeout(5000);

    // 验证游戏加载成功
    const gameState = await page.evaluate(() => {
      const game = window.__game__;
      if (!game) return { loaded: false };
      return {
        loaded: true,
        scene: game.sceneManager ? game.sceneManager.getCurrentSceneName() : 'N/A'
      };
    });
    console.log(`  游戏状态: ${JSON.stringify(gameState)}\n`);

    if (!gameState.loaded) {
      console.log('  ❌ 游戏未加载成功');
      return results;
    }

    for (const scene of SCENES) {
      try {
        console.log(`📷 ${scene.label}`);

        // 切换场景
        await page.evaluate((s) => {
          const game = window.__game__;
          if (game && game.sceneManager) {
            game.sceneManager.switchTo(s.name, s.params || {}, { immediate: true });
          }
        }, scene);

        // 等待场景切换和渲染
        await page.waitForTimeout(500);

        // 强制触发渲染帧
        await page.evaluate(() => {
          const game = window.__game__;
          if (game && game.sceneManager) {
            const scene = game.sceneManager.currentScene;
            if (scene && scene.render) {
              scene.render(game.renderer);
            }
          }
        });

        // 额外等待确保Canvas更新
        await page.waitForTimeout(1000);

        // 验证当前场景
        const currentScene = await page.evaluate(() => {
          const game = window.__game__;
          return game.sceneManager.getCurrentSceneName();
        });

        // 截取Canvas
        const filename = `mobile_${scene.name}.png`;
        const filepath = path.join(OUTPUT_DIR, filename);

        const canvas = await page.$('#preview-canvas');
        if (canvas) {
          await canvas.screenshot({ path: filepath, type: 'png' });
          const stats = fs.statSync(filepath);
          console.log(`  场景: ${currentScene}, 文件: ${filename} (${(stats.size / 1024).toFixed(1)} KB)`);

          results.push({
            scene: scene.label,
            currentScene,
            file: filename,
            path: filepath,
            size: stats.size
          });
        }

      } catch (error) {
        console.log(`  ❌ ${scene.label}: ${error.message}`);
      }
    }

  } catch (error) {
    console.log(`  ❌ 页面加载失败: ${error.message}`);
  }

  await context.close();
  await browser.close();

  return results;
}

captureScreenshots()
  .then(results => {
    console.log('\n📊 截图完成！');
    console.log('='.repeat(40));

    // 检查文件差异
    const crypto = require('crypto');
    console.log('\n文件MD5:');
    results.forEach(r => {
      const data = fs.readFileSync(r.path);
      const hash = crypto.createHash('md5').update(data).digest('hex').substring(0, 8);
      console.log(`  ${r.scene}: ${hash} (${(r.size / 1024).toFixed(1)} KB)`);
    });

    process.exit(0);
  })
  .catch(error => {
    console.error('截图失败:', error);
    process.exit(1);
  });