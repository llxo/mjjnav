// 主应用模块
class App {
    constructor() {
        this.services = {};
        this.initialized = false;
    }

    async init() {
        console.log('初始化应用...');
        
        // 等待DOM和模态框都加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.waitForModalsAndStart());
        } else {
            this.waitForModalsAndStart();
        }
    }

    waitForModalsAndStart() {
        // 检查模态框是否已加载
        const checkModals = () => {
            const cardModal = document.getElementById('card-modal');
            const countdownModal = document.getElementById('countdown-modal');
            
            if (cardModal && countdownModal) {
                console.log('模态框已加载，开始初始化服务...');
                this.start();
            } else {
                console.log('等待模态框加载...');
                setTimeout(checkModals, 100);
            }
        };
        
        checkModals();
    }

    start() {
        if (this.initialized) return;
        
        try {
            // 初始化各个服务
            this.initServices();
            this.initialized = true;
            
            console.log('应用初始化完成');
        } catch (error) {
            console.error('应用初始化失败:', error);
            if (window.NotificationService) {
                NotificationService.error('应用初始化失败，请刷新页面重试');
            }
        }
    }

    initServices() {
        // 初始化主题服务
        if (window.themeService) {
            themeService.init();
            this.services.theme = themeService;
        }

        // 初始化导航服务
        if (window.navigationService) {
            navigationService.init();
            this.services.navigation = navigationService;
        }

        // 初始化倒计时服务
        if (window.countdownService) {
            countdownService.init();
            this.services.countdown = countdownService;
        }

        // 设置全局错误处理
        this.setupGlobalErrorHandling();

        // 设置页面可见性变化处理
        this.setupVisibilityChange();
    }

    setupGlobalErrorHandling() {
        // 捕获未处理的Promise拒绝
        window.addEventListener('unhandledrejection', (event) => {
            console.error('未处理的Promise拒绝:', event.reason);
            NotificationService.error('发生了一个意外错误');
            event.preventDefault();
        });

        // 捕获全局错误
        window.addEventListener('error', (event) => {
            console.error('全局错误:', event.error);
            // 对于一些非关键性错误，不显示通知
            if (!event.filename.includes('extension')) {
                NotificationService.error('发生了一个意外错误');
            }
        });
    }

    setupVisibilityChange() {
        // 当页面变为可见时，刷新倒计时显示
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.services.countdown) {
                this.services.countdown.updateCountdownDisplay();
            }
        });
    }

    // 应用销毁时的清理工作
    destroy() {
        // 停止倒计时更新器
        if (this.services.countdown) {
            this.services.countdown.destroy();
        }

        // 清理其他资源
        Object.values(this.services).forEach(service => {
            if (service.destroy && typeof service.destroy === 'function') {
                service.destroy();
            }
        });
    }
}

// 创建并启动应用（防止重复创建）
if (!window.app) {
    const app = new App();
    app.init();
    
    // 将应用实例暴露到全局作用域（用于调试）
    window.app = app;
} else {
    console.log('应用实例已存在，跳过重复创建');
}

// 初始化图标容器的拖拽滚动功能
document.addEventListener('DOMContentLoaded', () => {
    const iconExamples = document.getElementById('icon-examples');
    if (iconExamples) {
        let isDown = false;
        let startX;
        let scrollLeft;
        
        iconExamples.addEventListener('mousedown', (e) => {
            isDown = true;
            iconExamples.classList.add('grabbing');
            startX = e.pageX - iconExamples.offsetLeft;
            scrollLeft = iconExamples.scrollLeft;
            e.preventDefault();
        });
        
        iconExamples.addEventListener('mouseleave', () => {
            isDown = false;
            iconExamples.classList.remove('grabbing');
        });
        
        iconExamples.addEventListener('mouseup', () => {
            isDown = false;
            iconExamples.classList.remove('grabbing');
        });
        
        iconExamples.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - iconExamples.offsetLeft;
            const walk = (x - startX) * 1.5; // 滚动速度倍数
            iconExamples.scrollLeft = scrollLeft - walk;
        });
    }
});

// 页面卸载时清理资源
window.addEventListener('beforeunload', () => {
    app.destroy();
});
