/**
 * SVG 图标模块
 * 数字对决 Pro - 内联 SVG 图标系统
 * 
 * 不依赖外部 CDN，支持主题色切换
 */

const Icons = {
    // 图标 SVG 路径定义
    paths: {
        'bot': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4a2 2 0 012 2v1h2a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V9a2 2 0 012-2h2V6a2 2 0 012-2z M9 13h.01 M15 13h.01 M9 17h6"/>',
        'users': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75"/>',
        'user': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z"/>',
        'gamepad-2': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 11h4 M8 9v4 M15 12h.01 M18 10h.01 M17 32a2 2 0 01-2-2V14a2 2 0 012-2h10a2 2 0 012 2v16a2 2 0 01-2 2H17z M7 20h10a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2v-8a2 2 0 012-2z"/>',
        'bar-chart-3': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 20V10 M18 20V4 M6 20v-4"/>',
        'target': '<circle cx="12" cy="12" r="10" stroke-width="2"/><circle cx="12" cy="12" r="6" stroke-width="2"/><circle cx="12" cy="12" r="2" stroke-width="2"/>',
        'lightbulb': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 18h6 M10 22h4 M12 2a7 7 0 00-4 12.7V17a1 1 0 001 1h6a1 1 0 001-1v-2.3A7 7 0 0012 2z"/>',
        'check-circle': '<circle cx="12" cy="12" r="10" stroke-width="2"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4"/>',
        'hourglass': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3h14 M5 21h14 M6 3v4a6 6 0 006 6 6 6 0 006-6V3 M6 21v-4a6 6 0 016-6 6 6 0 016 6v4"/>',
        'brain': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.5a2.5 2.5 0 00-4.96-.46 2.5 2.5 0 00-1.98 3 2.5 2.5 0 00.47 4.38 2.5 2.5 0 004.47 1.73 M12 4.5a2.5 2.5 0 014.96-.46 2.5 2.5 0 011.98 3 2.5 2.5 0 01-.47 4.38 2.5 2.5 0 01-4.47 1.73 M12 4.5V19 M8 15h8"/>',
        'trophy': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 9H4.5a2.5 2.5 0 010-5H6 M18 9h1.5a2.5 2.5 0 000-5H18 M4 22h16 M10 22V12 M14 22V12 M6 4h12v5a6 6 0 01-12 0V4z"/>',
        'dice-5': '<rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.5" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.5" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>',
        'arrow-left': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 12H5 M12 19l-7-7 7-7"/>',
        'arrow-right': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14 M12 5l7 7-7 7"/>',
        'plus': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v14 M5 12h14"/>',
        'copy': '<rect x="9" y="9" width="13" height="13" rx="2" stroke-width="2"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>',
        'info': '<circle cx="12" cy="12" r="10" stroke-width="2"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 16v-4 M12 8h.01"/>',
        'volume-2': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5L6 9H2v6h4l5 4V5z M19.07 4.93a10 10 0 010 14.14 M15.54 8.46a5 5 0 010 7.07"/>',
        'volume-x': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5L6 9H2v6h4l5 4V5z M23 9l-6 6 M17 9l6 6"/>',
        'settings': '<circle cx="12" cy="12" r="3" stroke-width="2"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>',
        'refresh-cw': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0114.85-3.36L23 10 M1 14l4.64 4.36A9 9 0 0020.49 15"/>',
        'wifi': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12.55a11 11 0 0114.08 0 M1.42 9a16 16 0 0121.16 0 M8.53 16.11a6 6 0 016.95 0 M12 20h.01"/>',
        'wifi-off': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 1l22 22 M16.72 11.06A10.94 10.94 0 0119 12.55 M5.58 9.04A14.95 14.95 0 001 9 M8.53 16.11a6 6 0 016.95 0 M12 20h.01"/>',
        'zap': '<polygon stroke-width="2" points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
        'flame': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/>',
        'star': '<polygon stroke-width="2" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
        'heart': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>',
        'clock': '<circle cx="12" cy="12" r="10" stroke-width="2"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6l4 2"/>',
        'history': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8 M3 3v5h5 M12 7v5l4 2"/>',
        'x': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 6L6 18 M6 6l12 12"/>',
        'check': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 6L9 17l-5-5"/>',
        'chevron-down': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 9l6 6 6-6"/>',
        'chevron-up': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 15l-6-6-6 6"/>',
        'menu': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12h18 M3 6h18 M3 18h18"/>',
        'download': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3"/>',
        'share-2': '<circle cx="18" cy="5" r="3" stroke-width="2"/><circle cx="6" cy="12" r="3" stroke-width="2"/><circle cx="18" cy="19" r="3" stroke-width="2"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.59 13.51l6.83 3.98 M15.41 6.51l-6.82 3.98"/>',
        'external-link': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6 M15 3h6v6 M10 14L21 3"/>',
        'log-in': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4 M10 17l5-5-5-5 M15 12H3"/>',
        'log-out': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9"/>',
        'shield': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
        'award': '<circle cx="12" cy="8" r="7" stroke-width="2"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"/>',
        'trending-up': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6"/>',
        'trending-down': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M23 18l-9.5-9.5-5 5L1 6 M17 18h6v-6"/>',
        'activity': '<polyline stroke-linecap="round" stroke-linejoin="round" stroke-width="2" points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
        'sparkles': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>'
    },

    /**
     * 创建 SVG 图标元素
     * @param {string} name - 图标名称
     * @param {Object} options - 配置选项
     * @param {string} options.class - CSS 类名
     * @param {number} options.width - 宽度
     * @param {number} options.height - 高度
     * @param {string} options.color - 颜色
     * @param {string} options.strokeWidth - 描边宽度
     * @returns {string} SVG HTML 字符串
     */
    create(name, options = {}) {
        const path = this.paths[name];
        if (!path) {
            console.warn(`Icon "${name}" not found`);
            return '';
        }

        const {
            class: className = '',
            width = 24,
            height = 24,
            color = 'currentColor',
            strokeWidth
        } = options;

        const style = strokeWidth ? `stroke-width="${strokeWidth}"` : '';

        return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" class="${className}" ${style}>${path}</svg>`;
    },

    /**
     * 替换所有 <i data-lucide="..."> 标签为 SVG
     */
    replaceAll() {
        const icons = document.querySelectorAll('i[data-lucide]');
        icons.forEach(icon => {
            const name = icon.getAttribute('data-lucide');
            const className = icon.className;
            const width = icon.getAttribute('data-width') || undefined;
            const height = icon.getAttribute('data-height') || undefined;
            
            // 从 class 中提取尺寸
            const wMatch = className.match(/w-(\d+)/);
            const hMatch = className.match(/h-(\d+)/);
            
            const svg = this.create(name, {
                class: className,
                width: width || (wMatch ? parseInt(wMatch[1]) * 4 : 24),
                height: height || (hMatch ? parseInt(hMatch[1]) * 4 : 24)
            });
            
            if (svg) {
                icon.outerHTML = svg;
            }
        });
    },

    /**
     * 获取图标名称列表
     * @returns {string[]} 图标名称数组
     */
    getNames() {
        return Object.keys(this.paths);
    },

    /**
     * 检查图标是否存在
     * @param {string} name - 图标名称
     * @returns {boolean}
     */
    has(name) {
        return name in this.paths;
    }
};

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    Icons.replaceAll();
});

// 兼容 Lucide API
if (typeof window !== 'undefined') {
    window.lucide = {
        createIcons: () => Icons.replaceAll()
    };
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Icons };
}