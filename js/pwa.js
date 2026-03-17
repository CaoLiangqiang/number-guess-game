/**
 * PWA 和网络管理模块
 * 数字对决 Pro - PWA安装、网络状态、Service Worker管理
 */

/**
 * PWA 安装管理器
 */
const PWAInstallManager = {
    deferredPrompt: null,
    isInstalled: false,
    
    init() {
        // 检查是否已安装
        if (window.matchMedia('(display-mode: standalone)').matches) {
            this.isInstalled = true;
            return;
        }
        
        // 监听安装提示
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            
            // 检查用户是否已拒绝
            const dismissed = localStorage.getItem('pwa_install_dismissed');
            const dismissedTime = dismissed ? parseInt(dismissed) : 0;
            const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
            
            // 只在用户超过7天未拒绝时显示
            if (daysSinceDismissed > 7) {
                setTimeout(() => this.showInstallPrompt(), 3000);
            }
        });
        
        // 监听安装完成
        window.addEventListener('appinstalled', () => {
            this.isInstalled = true;
            this.deferredPrompt = null;
            if (typeof debugLog === 'function') {
                debugLog('PWA 已安装');
            }
        });
        
        // iOS 检测
        this.detectIOS();
    },
    
    showInstallPrompt() {
        if (!this.deferredPrompt || this.isInstalled) return;
        
        const promptHTML = `
            <div id="pwa-install-prompt" style="
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(30, 41, 59, 0.95);
                backdrop-filter: blur(12px);
                border: 1px solid rgba(99, 102, 241, 0.3);
                border-radius: 16px;
                padding: 16px 20px;
                display: flex;
                align-items: center;
                gap: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                z-index: 9999;
                max-width: 340px;
                animation: slideUp 0.3s ease-out;
            ">
                <div style="font-size: 32px;">📱</div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: white; font-size: 14px; margin-bottom: 2px;">安装应用到桌面</div>
                    <div style="color: #94a3b8; font-size: 12px;">离线也能玩，更流畅</div>
                </div>
                <button id="pwa-install-btn" style="
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 14px;
                    cursor: pointer;
                    white-space: nowrap;
                ">安装</button>
                <button id="pwa-dismiss-btn" style="
                    background: transparent;
                    color: #94a3b8;
                    border: none;
                    padding: 8px;
                    cursor: pointer;
                    font-size: 18px;
                ">×</button>
            </div>
            <style>
                @keyframes slideUp {
                    from { transform: translateX(-50%) translateY(100px); opacity: 0; }
                    to { transform: translateX(-50%) translateY(0); opacity: 1; }
                }
            </style>
        `;
        
        this.hideInstallPrompt();
        document.body.insertAdjacentHTML('beforeend', promptHTML);
        
        document.getElementById('pwa-install-btn').addEventListener('click', () => this.install());
        document.getElementById('pwa-dismiss-btn').addEventListener('click', () => this.dismiss());
    },
    
    hideInstallPrompt() {
        const prompt = document.getElementById('pwa-install-prompt');
        if (prompt) prompt.remove();
    },
    
    async install() {
        if (!this.deferredPrompt) return;
        
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            if (typeof debugLog === 'function') debugLog('用户接受安装');
        } else {
            if (typeof debugLog === 'function') debugLog('用户拒绝安装');
            localStorage.setItem('pwa_install_dismissed', Date.now().toString());
        }
        
        this.deferredPrompt = null;
        this.hideInstallPrompt();
    },
    
    dismiss() {
        localStorage.setItem('pwa_install_dismissed', Date.now().toString());
        this.hideInstallPrompt();
    },
    
    detectIOS() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        
        if (isIOS && isSafari && !this.isInstalled) {
            this.showIOSInstallGuide();
        }
    },
    
    showIOSInstallGuide() {
        const dismissed = localStorage.getItem('pwa_ios_guide_dismissed');
        if (dismissed) return;
        
        const guideHTML = `
            <div id="pwa-ios-guide" style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(4px);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            ">
                <div style="
                    background: rgba(30, 41, 59, 0.95);
                    border: 1px solid rgba(99, 102, 241, 0.3);
                    border-radius: 20px;
                    padding: 32px;
                    max-width: 340px;
                    text-align: center;
                ">
                    <div style="font-size: 48px; margin-bottom: 16px;">📱</div>
                    <h3 style="color: white; margin-bottom: 16px; font-size: 20px;">添加到主屏幕</h3>
                    <p style="color: #94a3b8; margin-bottom: 24px; line-height: 1.6;">
                        点击 Safari 底部的 <span style="color: #6366f1; font-weight: 600;">分享按钮</span>，<br>
                        然后选择 <span style="color: #6366f1; font-weight: 600;">"添加到主屏幕"</span>
                    </p>
                    <div style="margin-bottom: 24px; font-size: 32px;">⬆️</div>
                    <button onclick="PWAInstallManager.dismissIOSGuide()" style="
                        background: linear-gradient(135deg, #6366f1, #8b5cf6);
                        color: white;
                        border: none;
                        padding: 12px 32px;
                        border-radius: 10px;
                        font-weight: 600;
                        font-size: 16px;
                        cursor: pointer;
                        width: 100%;
                    ">知道了</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', guideHTML);
    },
    
    dismissIOSGuide() {
        localStorage.setItem('pwa_ios_guide_dismissed', 'true');
        const guide = document.getElementById('pwa-ios-guide');
        if (guide) guide.remove();
    }
};

/**
 * 网络状态管理
 */
const NetworkManager = {
    isOnline: navigator.onLine,
    
    init() {
        this.updateStatus();
        
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateStatus();
            this.showStatusMessage('网络已恢复', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateStatus();
            this.showStatusMessage('进入离线模式，单机游戏仍可进行', 'warning');
        });
    },
    
    updateStatus() {
        this.isOnline = navigator.onLine;
        
        const indicator = document.getElementById('network-status-indicator');
        if (indicator) {
            indicator.style.background = this.isOnline ? '#22c55e' : '#ef4444';
            indicator.title = this.isOnline ? '在线' : '离线';
        }
    },
    
    showStatusMessage(message, type) {
        const existingToast = document.getElementById('network-toast');
        if (existingToast) existingToast.remove();
        
        const colors = {
            success: '#22c55e',
            warning: '#f59e0b',
            error: '#ef4444'
        };
        
        const toastHTML = `
            <div id="network-toast" style="
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: ${colors[type] || colors.success};
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: 500;
                z-index: 9999;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                animation: slideDown 0.3s ease-out;
            ">
                ${message}
            </div>
            <style>
                @keyframes slideDown {
                    from { transform: translateX(-50%) translateY(-50px); opacity: 0; }
                    to { transform: translateX(-50%) translateY(0); opacity: 1; }
                }
            </style>
        `;
        
        document.body.insertAdjacentHTML('beforeend', toastHTML);
        
        setTimeout(() => {
            const toast = document.getElementById('network-toast');
            if (toast) {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 0.3s';
                setTimeout(() => toast.remove(), 300);
            }
        }, 3000);
    },
    
    checkOnline() {
        return this.isOnline;
    }
};

/**
 * Service Worker 更新管理
 */
const SWUpdateManager = {
    registration: null,
    
    async init() {
        if (!('serviceWorker' in navigator)) {
            if (typeof debugLog === 'function') debugLog('浏览器不支持 Service Worker');
            return;
        }
        
        try {
            this.registration = await navigator.serviceWorker.register('/service-worker.js');
            if (typeof debugLog === 'function') debugLog('Service Worker 注册成功:', this.registration.scope);
            
            this.registration.addEventListener('updatefound', () => {
                const newWorker = this.registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        this.showUpdatePrompt();
                    }
                });
            });
            
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
                    this.showUpdatePrompt();
                }
            });
            
        } catch (error) {
            console.error('Service Worker 注册失败:', error);
        }
    },
    
    showUpdatePrompt() {
        const updateHTML = `
            <div id="sw-update-prompt" style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(30, 41, 59, 0.95);
                backdrop-filter: blur(12px);
                border: 1px solid rgba(99, 102, 241, 0.3);
                border-radius: 12px;
                padding: 16px 20px;
                display: flex;
                align-items: center;
                gap: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                z-index: 9999;
                max-width: 300px;
                animation: slideIn 0.3s ease-out;
            ">
                <div style="font-size: 24px;">🔄</div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: white; font-size: 14px; margin-bottom: 2px;">有新版本可用</div>
                    <div style="color: #94a3b8; font-size: 12px;">点击更新获取最新功能</div>
                </div>
                <button onclick="SWUpdateManager.update()" style="
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-weight: 600;
                    font-size: 13px;
                    cursor: pointer;
                ">更新</button>
            </div>
            <style>
                @keyframes slideIn {
                    from { transform: translateX(100px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            </style>
        `;
        
        const existing = document.getElementById('sw-update-prompt');
        if (existing) existing.remove();
        
        document.body.insertAdjacentHTML('beforeend', updateHTML);
    },
    
    update() {
        if (this.registration && this.registration.waiting) {
            this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        window.location.reload();
    }
};

/**
 * Git 提交版本管理
 */
const GitVersionManager = {
    init() {
        this.displayCommitHash();
    },
    
    displayCommitHash() {
        const commitElement = document.getElementById('gitCommit');
        const commitHash = window.GameConfig ? GameConfig.commitHash : 'c175a31';
        
        if (commitElement && commitHash) {
            commitElement.textContent = `提交: ${commitHash}`;
            commitElement.style.cursor = 'pointer';
            commitElement.addEventListener('click', () => {
                navigator.clipboard.writeText(commitHash).then(() => {
                    NetworkManager.showStatusMessage('提交编号已复制', 'success');
                }).catch(() => {
                    if (typeof debugLog === 'function') debugLog('Git 提交编号:', commitHash);
                });
            });
        }
    },
    
    getFullCommitInfo() {
        const config = window.GameConfig || {};
        return {
            hash: config.commitHash || 'c175a31',
            shortHash: (config.commitHash || 'c175a31').substring(0, 7),
            version: config.version || 'v2.2.0',
            buildTime: new Date().toISOString()
        };
    }
};

// 导出到全局
window.PWAInstallManager = PWAInstallManager;
window.NetworkManager = NetworkManager;
window.SWUpdateManager = SWUpdateManager;
window.GitVersionManager = GitVersionManager;

// CommonJS 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PWAInstallManager, NetworkManager, SWUpdateManager, GitVersionManager };
}