// 主题管理服务
class ThemeService {
    constructor() {
        this.themeToggle = null;
        this.darkIcon = null;
        this.lightIcon = null;
    }

    init() {
        this.themeToggle = document.getElementById('theme-toggle');
        this.darkIcon = document.getElementById('theme-toggle-dark-icon');
        this.lightIcon = document.getElementById('theme-toggle-light-icon');

        if (!this.themeToggle || !this.darkIcon || !this.lightIcon) {
            console.warn('Theme toggle elements not found');
            return;
        }

        // 检查本地存储或系统偏好
        this.applyInitialTheme();
        this.setupEventListeners();
    }

    applyInitialTheme() {
        const isDark = localStorage.getItem('theme') === 'dark' || 
            (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);

        if (isDark) {
            this.setDarkMode();
        } else {
            this.setLightMode();
        }
    }

    setDarkMode() {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        this.darkIcon.classList.add('hidden');
        this.lightIcon.classList.remove('hidden');
    }

    setLightMode() {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        this.darkIcon.classList.remove('hidden');
        this.lightIcon.classList.add('hidden');
    }

    toggle() {
        if (document.documentElement.classList.contains('dark')) {
            this.setLightMode();
        } else {
            this.setDarkMode();
        }
    }

    setupEventListeners() {
        this.themeToggle.addEventListener('click', () => {
            this.toggle();
        });

        // 监听系统主题变化
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                if (e.matches) {
                    this.setDarkMode();
                } else {
                    this.setLightMode();
                }
            }
        });
    }
}

// 创建全局主题服务实例
// 创建全局主题服务实例（防止重复创建）
if (!window.themeService) {
    window.themeService = new ThemeService();
} else {
    console.log('ThemeService实例已存在，跳过重复创建');
}
