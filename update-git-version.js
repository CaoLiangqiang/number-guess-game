/**
 * Git 版本更新脚本
 * 在每次提交前自动更新所有版本相关文件
 *
 * 使用方法:
 * 1. 手动运行: node update-git-version.js
 * 2. 自动: 通过 .git/hooks/pre-commit 钩子执行
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getGitCommitHash() {
    try {
        return execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
    } catch (error) {
        console.error('获取 Git 提交哈希失败:', error.message);
        return null;
    }
}

function getVersion() {
    try {
        const configPath = path.join(__dirname, 'js', 'config.js');
        const content = fs.readFileSync(configPath, 'utf-8');
        const match = content.match(/version:\s*['"]([\d.]+)['"]/);
        return match ? match[1] : '2.2.1';
    } catch {
        return '2.2.1';
    }
}

function updateFile(filePath, patterns, replacements) {
    try {
        let content = fs.readFileSync(filePath, 'utf-8');
        let updated = false;

        for (let i = 0; i < patterns.length; i++) {
            const newContent = content.replace(patterns[i], replacements[i]);
            if (content !== newContent) {
                content = newContent;
                updated = true;
            }
        }

        if (updated) {
            fs.writeFileSync(filePath, content, 'utf-8');
            console.log(`✅ 已更新 ${path.basename(filePath)}`);
            return true;
        } else {
            console.log(`ℹ️ ${path.basename(filePath)} 已是最新`);
            return false;
        }
    } catch (error) {
        console.error(`更新 ${filePath} 失败:`, error.message);
        return false;
    }
}

function main() {
    const commitHash = getGitCommitHash();
    if (!commitHash) {
        process.exit(1);
    }

    const version = getVersion();
    console.log(`\n当前版本: ${version}`);
    console.log(`当前提交: ${commitHash}\n`);

    // 1. 更新 js/config.js 中的 commitHash
    const configPath = path.join(__dirname, 'js', 'config.js');
    updateFile(configPath,
        [/commitHash:\s*['"][a-f0-9]+['"]/],
        [`commitHash: '${commitHash}'`]
    );

    // 2. 更新 service-worker.js 中的 CACHE_VERSION
    const swPath = path.join(__dirname, 'service-worker.js');
    updateFile(swPath,
        [/CACHE_VERSION\s*=\s*['"][^'"]+['"]/],
        [`CACHE_VERSION = 'v${version}-${commitHash}'`]
    );

    // 3. 更新 index.html 中的 COMMIT_HASH（如果存在）
    const indexPath = path.join(__dirname, 'index.html');
    updateFile(indexPath,
        [/COMMIT_HASH:\s*['"][a-f0-9]+['"]/],
        [`COMMIT_HASH: '${commitHash}'`]
    );

    console.log(`\n✨ 版本同步完成: ${commitHash}`);
}

main();