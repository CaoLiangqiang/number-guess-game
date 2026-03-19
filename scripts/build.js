#!/usr/bin/env node
/**
 * 生产环境构建脚本
 * 数字对决 Pro - Number Guess Game
 * 
 * 功能：
 * - 压缩 HTML、CSS、JS 文件
 * - 复制静态资源到 dist 目录
 * - 生成构建信息
 */

const fs = require('fs');
const path = require('path');

// 构建配置
const config = {
  srcDir: path.join(__dirname, '..'),
  distDir: path.join(__dirname, '..', 'dist'),
  files: {
    static: [
      'manifest.json',
      'sw.js',
      'favicon.ico',
      'README.md'
    ],
    dirs: [
      'assets',
      'sounds'
    ]
  }
};

// 颜色输出
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

function log(message, color = 'blue') {
  console.log(`${colors[color]}[Build]${colors.reset} ${message}`);
}

// 清理 dist 目录
function cleanDist() {
  if (fs.existsSync(config.distDir)) {
    fs.rmSync(config.distDir, { recursive: true });
  }
  fs.mkdirSync(config.distDir, { recursive: true });
  log('Cleaned dist directory', 'yellow');
}

// 创建目录结构
function createDirectories() {
  const dirs = ['css', 'js', 'assets', 'sounds'];
  dirs.forEach(dir => {
    const dirPath = path.join(config.distDir, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
  log('Created directory structure');
}

// 复制文件
function copyFile(src, dest) {
  const srcPath = path.join(config.srcDir, src);
  const destPath = path.join(config.distDir, dest);
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    return true;
  }
  return false;
}

// 复制目录
function copyDir(src, dest) {
  const srcPath = path.join(config.srcDir, src);
  const destPath = path.join(config.distDir, dest);
  
  if (fs.existsSync(srcPath)) {
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }
    
    const entries = fs.readdirSync(srcPath, { withFileTypes: true });
    entries.forEach(entry => {
      const srcEntry = path.join(srcPath, entry.name);
      const destEntry = path.join(destPath, entry.name);
      
      if (entry.isDirectory()) {
        copyDir(path.join(src, entry.name), path.join(dest, entry.name));
      } else {
        fs.copyFileSync(srcEntry, destEntry);
      }
    });
    return true;
  }
  return false;
}

// 压缩 JS 文件
function minifyJS() {
  const jsFiles = ['js/app.js', 'js/ai.js', 'js/network.js', 'js/sound.js'];
  const distPath = path.join(config.distDir, 'js', 'bundle.min.js');
  
  let combined = '';
  jsFiles.forEach(file => {
    const filePath = path.join(config.srcDir, file);
    if (fs.existsSync(filePath)) {
      combined += fs.readFileSync(filePath, 'utf8') + '\n';
    }
  });
  
  // 简单的压缩：移除注释和多余空白
  // 实际生产环境应该使用 terser 等专业工具
  const minified = combined
    .replace(/\/\*[\s\S]*?\*\//g, '')  // 移除多行注释
    .replace(/\/\/.*$/gm, '')          // 移除单行注释
    .replace(/\n\s*\n/g, '\n')         // 移除空行
    .trim();
  
  fs.writeFileSync(distPath, minified);
  const savedBytes = combined.length - minified.length;
  log(`Minified JS: saved ${savedBytes} bytes`, 'green');
}

// 压缩 CSS 文件
function minifyCSS() {
  const cssPath = path.join(config.srcDir, 'css', 'styles.css');
  const distPath = path.join(config.distDir, 'css', 'styles.min.css');
  
  if (fs.existsSync(cssPath)) {
    let css = fs.readFileSync(cssPath, 'utf8');
    
    // 简单的压缩
    const minified = css
      .replace(/\/\*[\s\S]*?\*\//g, '')  // 移除注释
      .replace(/\s+/g, ' ')              // 合并空白
      .replace(/\s*([{}:;,])\s*/g, '$1') // 移除符号周围空白
      .replace(/;}/g, '}')               // 移除最后的分号
      .trim();
    
    fs.writeFileSync(distPath, minified);
    const savedBytes = css.length - minified.length;
    log(`Minified CSS: saved ${savedBytes} bytes`, 'green');
  }
}

// 压缩 HTML 文件
function minifyHTML() {
  const htmlPath = path.join(config.srcDir, 'index.html');
  const distPath = path.join(config.distDir, 'index.html');
  
  if (fs.existsSync(htmlPath)) {
    let html = fs.readFileSync(htmlPath, 'utf8');
    
    // 更新资源引用路径
    html = html
      .replace(/css\/styles\.css/g, 'css/styles.min.css')
      .replace(/js\/app\.js/g, 'js/bundle.min.js');
    
    // 简单的压缩
    const minified = html
      .replace(/<!--[\s\S]*?-->/g, '')   // 移除注释
      .replace(/\s+/g, ' ')              // 合并空白
      .replace(/>\s+</g, '><')           // 移除标签间空白
      .trim();
    
    fs.writeFileSync(distPath, minified);
    log('Minified HTML', 'green');
  }
}

// 生成构建信息
function generateBuildInfo() {
  const buildInfo = {
    version: require('../package.json').version,
    buildTime: new Date().toISOString(),
    nodeVersion: process.version,
    environment: 'production'
  };
  
  fs.writeFileSync(
    path.join(config.distDir, 'build-info.json'),
    JSON.stringify(buildInfo, null, 2)
  );
  log(`Build info generated: v${buildInfo.version}`, 'green');
}

// 主构建流程
function build() {
  console.log('\n🚀 Starting production build...\n');
  
  const startTime = Date.now();
  
  // 1. 清理和创建目录
  cleanDist();
  createDirectories();
  
  // 2. 压缩文件
  minifyJS();
  minifyCSS();
  minifyHTML();
  
  // 3. 复制静态文件
  config.files.static.forEach(file => {
    if (copyFile(file, file)) {
      log(`Copied: ${file}`);
    }
  });
  
  // 4. 复制目录
  config.files.dirs.forEach(dir => {
    if (copyDir(dir, dir)) {
      log(`Copied directory: ${dir}`);
    }
  });
  
  // 5. 生成构建信息
  generateBuildInfo();
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n✅ Build completed in ${duration}s\n`);
  console.log(`📁 Output: ${config.distDir}`);
}

// 执行构建
build();