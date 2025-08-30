// 自定义确认对话框工具类
class CustomConfirm {
    constructor() {
        this.overlay = null;
        this.titleElement = null;
        this.messageElement = null;
        this.cancelBtn = null;
        this.confirmBtn = null;
        this.currentResolve = null;
        this.initElements();
        this.setupEventListeners();
    }

    initElements() {
        this.overlay = document.getElementById('custom-confirm-overlay');
        this.titleElement = document.getElementById('confirm-title');
        this.messageElement = document.getElementById('confirm-message');
        this.cancelBtn = document.getElementById('confirm-cancel');
        this.confirmBtn = document.getElementById('confirm-ok');
    }

    setupEventListeners() {
        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => this.handleCancel());
        }

        if (this.confirmBtn) {
            this.confirmBtn.addEventListener('click', () => this.handleConfirm());
        }        if (this.overlay) {
        }

        // ESC 键关闭对话框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay && this.overlay.classList.contains('show')) {
                this.handleCancel();
            }
        });
    }

    show(options = {}) {
        return new Promise((resolve) => {
            this.currentResolve = resolve;
            
            // 设置标题和消息
            if (this.titleElement) {
                this.titleElement.textContent = options.title || '确认操作';
            }
            if (this.messageElement) {
                this.messageElement.textContent = options.message || '您确定要执行此操作吗？';
            }
            
            // 设置按钮文本
            if (this.cancelBtn) {
                this.cancelBtn.textContent = options.cancelText || '取消';
            }
            if (this.confirmBtn) {
                this.confirmBtn.textContent = options.confirmText || '确定';
            }

            // 显示对话框
            if (this.overlay) {
                this.overlay.classList.add('show');
                document.body.style.overflow = 'hidden';
            }
        });
    }

    hide() {
        if (this.overlay) {
            this.overlay.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    handleCancel() {
        this.hide();
        if (this.currentResolve) {
            this.currentResolve(false);
            this.currentResolve = null;
        }
    }

    handleConfirm() {
        this.hide();
        if (this.currentResolve) {
            this.currentResolve(true);
            this.currentResolve = null;
        }
    }
}

// 创建全局实例
// 创建全局确认对话框实例（防止重复创建）
if (!window.customConfirm) {
    window.customConfirm = new CustomConfirm();
} else {
    console.log('CustomConfirm实例已存在，跳过重复创建');
}

// 提供便捷的调用方法
window.showConfirm = (options) => {
    return window.customConfirm.show(options);
};
