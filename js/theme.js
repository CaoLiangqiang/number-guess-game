/**
 * 主题管理器
 * 支持深色/浅色主题切换
 */

const ThemeManager = {
    // 主题类型
    THEMES: {
        DARK: 'dark',
        LIGHT: 'light'
    },
    
    // 默认主题
    defaultTheme: 'dark',
    
    // 当前主题
    currentTheme: null,
    
    // 存储 key
    STORAGE_KEY: 'theme-preference',
    
    /**
     * 初始化主题系统
     */
    init() {
        // 获取保存的主题或使用系统偏好
        this.currentTheme = this.getSavedTheme() || this.getSystemTheme();
        this.applyTheme(this.currentTheme);
        this.setupSystemThemeListener();
        
        // 更新主题切换按钮
        this.updateToggleButton();
        
        console.log(`[Theme] 初始化完成，当前主题: ${this.currentTheme}`);
    },
    
    /**
     * 获取保存的主题
     */
    getSavedTheme() {
        try {
            return localStorage.getItem(this.STORAGE_KEY);
        } catch (e) {
            return null;
        }
    },
    
    /**
     * 获取系统主题偏好
     */
    getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            return this.THEMES.LIGHT;
        }
        return this.THEMES.DARK;
    },
    
    /**
     * 监听系统主题变化
     */
    setupSystemThemeListener() {
        if (!window.matchMedia) return;
        
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            // 仅当用户未手动设置主题时才跟随系统
            if (!localStorage.getItem(this.STORAGE_KEY)) {
                const newTheme = e.matches ? this.THEMES.DARK : this.THEMES.LIGHT;
                this.applyTheme(newTheme);
            }
        });
    },
    
    /**
     * 应用主题
     */
    applyTheme(theme) {
        this.currentTheme = theme;
        
        // 更新 HTML 属性
        document.documentElement.setAttribute('data-theme', theme);
        
        // 更新 meta theme-color
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', theme === this.THEMES.LIGHT ? '#ffffff' : '#0f172a');
        }
        
        // 更新 class
        document.body.classList.remove('theme-dark', 'theme-light');
        document.body.classList.add(`theme-${theme}`);
        
        // 更新切换按钮图标
        this.updateToggleButton();
        
        // 触发自定义事件
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    },
    
    /**
     * 切换主题
     */
    toggle() {
        const newTheme = this.currentTheme === this.THEMES.DARK 
            ? this.THEMES.LIGHT 
            : this.THEMES.DARK;
        
        this.setTheme(newTheme);
    },
    
    /**
     * 设置指定主题
     */
    setTheme(theme) {
        // 保存到 localStorage
        try {
            localStorage.setItem(this.STORAGE_KEY, theme);
        } catch (e) {
            console.warn('[Theme] 无法保存主题偏好:', e);
        }
        
        this.applyTheme(theme);
        
        // 播放音效（如果有）
        if (window.audioManager?.enabled) {
            window.audioManager.playClick?.();
        }
        
        console.log(`[Theme] 已切换到 ${theme} 主题`);
    },
    
    /**
     * 更新切换按钮图标
     */
    updateToggleButton() {
        const toggleBtn = document.getElementById('themeToggle');
        const sunIcon = document.getElementById('sunIcon');
        const moonIcon = document.getElementById('moonIcon');
        
        if (!toggleBtn) return;
        
        const isDark = this.currentTheme === this.THEMES.DARK;
        
        // 更新图标显示
        if (sunIcon && moonIcon) {
            sunIcon.classList.toggle('hidden', isDark);
            moonIcon.classList.toggle('hidden', !isDark);
        }
        
        // 更新按钮提示
        toggleBtn.setAttribute('title', isDark ? '切换到浅色模式' : '切换到深色模式');
        toggleBtn.setAttribute('aria-label', isDark ? '切换到浅色模式' : '切换到深色模式');
    },
    
    /**
     * 获取当前主题
     */
    getTheme() {
        return this.currentTheme;
    },
    
    /**
     * 是否为深色主题
     */
    isDark() {
        return this.currentTheme === this.THEMES.DARK;
    }
};

// 导出全局对象
window.ThemeManager = ThemeManager;

// 自动初始化（在 DOM 加载后）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
} else {
    ThemeManager.init();
}