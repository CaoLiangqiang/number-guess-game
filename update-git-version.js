/**
 * Git 版本更新脚本
 * 在每次提交前自动更新 index.html 中的 COMMIT_HASH
 * 
 * 使用方法:
 * 1. 手动运行: node update-git-version.js
 * 2. 添加到 git hooks: .git/hooks/pre-commit
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

function updateCommitHashInFile(filePath, commitHash) {
    try {
        let content = fs.readFileSync(filePath, 'utf-8');
        
        // 使用正则替换 COMMIT_HASH 的值
        const updatedContent = content.replace(
            /COMMIT_HASH:\s*['"][a-f0-9]+['"]/,
            `COMMIT_HASH: '${commitHash}'`
        );
        
        if (content !== updatedContent) {
            fs.writeFileSync(filePath, updatedContent, 'utf-8');
            console.log(`✅ 已更新 Git 提交哈希: ${commitHash}`);
            return true;
        } else {
            console.log('ℹ️ 提交哈希已是最新');
            return false;
        }
    } catch (error) {
        console.error('更新文件失败:', error.message);
        return false;
    }
}

function main() {
    const commitHash = getGitCommitHash();
    if (!commitHash) {
        process.exit(1);
    }
    
    const indexPath = path.join(__dirname, 'index.html');
    const updated = updateCommitHashInFile(indexPath, commitHash);
    
    if (updated) {
        console.log('\n提示: 文件已修改，请重新提交以包含更新后的版本号');
    }
}

main();
