/**
 * Git 版本同步脚本
 * 以 package.json 为版本源，同步当前检出提交的版本相关文件
 *
 * 使用方法:
 * 1. 手动运行: node update-git-version.js
 * 2. 自动: 通过 .git/hooks/post-commit 钩子执行
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
        const packagePath = path.join(__dirname, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
        return packageJson.version || '0.0.0';
    } catch {
        return '0.0.0';
    }
}

function updateJsonVersion(filePath, version) {
    try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        let updated = false;

        if (content.version !== version) {
            content.version = version;
            updated = true;
        }

        if (content.packages && content.packages[''] && content.packages[''].version !== version) {
            content.packages[''].version = version;
            updated = true;
        }

        if (updated) {
            fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf-8');
            console.log(`✅ 已更新 ${path.basename(filePath)}`);
            return true;
        }

        console.log(`ℹ️ ${path.basename(filePath)} 已是最新`);
        return false;
    } catch (error) {
        console.error(`更新 ${filePath} 失败:`, error.message);
        return false;
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

    // 1. 更新 js/config.js 中的版本号和 commitHash
    const rootLockPath = path.join(__dirname, 'package-lock.json');
    updateJsonVersion(rootLockPath, version);

    // 2. 更新 js/config.js 中的版本号和 commitHash
    const configPath = path.join(__dirname, 'js', 'config.js');
    updateFile(configPath,
        [/version:\s*['"][\d.]+['"]/, /commitHash:\s*['"][a-f0-9]+['"]/],
        [`version: '${version}'`, `commitHash: '${commitHash}'`]
    );

    // 3. 更新 service-worker.js 中的 CACHE_VERSION
    const swPath = path.join(__dirname, 'service-worker.js');
    updateFile(swPath,
        [/CACHE_VERSION\s*=\s*['"][^'"]+['"]/],
        [`CACHE_VERSION = 'v${version}-${commitHash}'`]
    );

    // 4. 更新服务端版本信息
    const serverPackagePath = path.join(__dirname, 'server', 'package.json');
    updateJsonVersion(serverPackagePath, version);

    const serverLockPath = path.join(__dirname, 'server', 'package-lock.json');
    updateJsonVersion(serverLockPath, version);

    const serverEntryPath = path.join(__dirname, 'server', 'server.js');
    updateFile(serverEntryPath,
        [/const SERVER_VERSION = ['"][\d.]+['"]/],
        [`const SERVER_VERSION = '${version}'`]
    );

    // 5. 更新 miniprogram/game.js 中的版本号
    const miniprogramPath = path.join(__dirname, 'miniprogram', 'game.js');
    updateFile(miniprogramPath,
        [/version:\s*['"][\d.]+['"]/],
        [`version: '${version}'`]
    );

    // 6. 更新 README.md 中的版本徽章
    const readmePath = path.join(__dirname, 'README.md');
    updateFile(readmePath,
        [/\[!\[Version\]\(https:\/\/img\.shields\.io\/badge\/Version-[^)]+-purple\)\]\(\)/],
        [`[![Version](https://img.shields.io/badge/Version-${version}-purple)]()`]
    );

    // 7. 更新 CLAUDE.md 中的版本说明
    const claudePath = path.join(__dirname, 'CLAUDE.md');
    updateFile(claudePath,
        [/- Version:\s*[\d.]+/],
        [`- Version: ${version}`]
    );

    // 8. 更新 index.html 中的 COMMIT_HASH（如果存在）
    const indexPath = path.join(__dirname, 'index.html');
    updateFile(indexPath,
        [/COMMIT_HASH:\s*['"][a-f0-9]+['"]/],
        [`COMMIT_HASH: '${commitHash}'`]
    );

    console.log(`\n✨ 版本同步完成: ${commitHash}`);
}

main();
