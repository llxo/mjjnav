// 密钥管理页面专用JS
class SecretManager {    constructor() {
        this.hasSecretKey = null;
        this.sessionToken = localStorage.getItem('sessionToken');
        
        // DOM元素
        this.changeSecretForm = null;
        this.currentSecretInput = null;
        this.newSecretInput = null;
        this.confirmNewSecretInput = null;
        this.changeSecretError = null;
        this.passwordToggles = null;
    }
    
    init() {
        this.initDomElements();
        this.setupEventListeners();
        this.setupPasswordToggles();
    }    initDomElements() {
        this.changeSecretForm = document.getElementById('change-secret-form');
        this.currentSecretInput = document.getElementById('current-secret');
        this.newSecretInput = document.getElementById('new-secret');
        this.confirmNewSecretInput = document.getElementById('confirm-new-secret');
        this.changeSecretError = document.getElementById('change-secret-error');
        this.passwordToggles = document.querySelectorAll('.toggle-password');
    }
      setupEventListeners() {
        if (this.changeSecretForm) {
            this.changeSecretForm.addEventListener('submit', (e) => this.handleChangeSecret(e));
        }
    }
    
    setupPasswordToggles() {
        this.passwordToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const button = e.currentTarget;
                const input = button.previousElementSibling;
                
                // 切换密码可见性
                if (input.type === 'password') {
                    input.type = 'text';
                    button.innerHTML = '<i class="fas fa-eye-slash"></i>';
                } else {
                    input.type = 'password';
                    button.innerHTML = '<i class="fas fa-eye"></i>';
                }
            });
        });
    }
      // 获取密钥状态的方法已移除，因为UI中不再显示密钥状态
    
    async handleChangeSecret(e) {
        e.preventDefault();
        
        // 重置错误消息
        this.showError('');
        
        const currentSecret = this.currentSecretInput.value;
        const newSecret = this.newSecretInput.value;
        const confirmNewSecret = this.confirmNewSecretInput.value;
        
        // 验证表单
        if (!currentSecret) {
            return this.showError('请输入当前密钥');
        }
        
        if (!newSecret) {
            return this.showError('请输入新密钥');
        }
        
        if (newSecret.length < 6) {
            return this.showError('新密钥长度不能少于6位');
        }
        
        if (newSecret !== confirmNewSecret) {
            return this.showError('两次输入的新密钥不一致');
        }
        
        try {
            // 显示加载状态
            this.setFormLoading(true);
            
            // 首先验证当前密钥
            const verifyResponse = await fetch('/api/secret/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ secretKey: currentSecret })
            });
            
            if (!verifyResponse.ok) {
                const errorData = await verifyResponse.json();
                return this.showError(errorData.error || '当前密钥验证失败');
            }
            
            // 更改密钥
            const changeResponse = await fetch('/api/secret/change', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-session-token': this.sessionToken
                },
                body: JSON.stringify({ 
                    currentSecretKey: currentSecret,
                    newSecretKey: newSecret
                })
            });
            
            if (!changeResponse.ok) {
                const errorData = await changeResponse.json();
                return this.showError(errorData.error || '更改密钥失败');
            }
            
            // 更新会话令牌
            const sessionToken = changeResponse.headers.get('x-session-token');
            if (sessionToken) {
                localStorage.setItem('sessionToken', sessionToken);
                this.sessionToken = sessionToken;
            }
            
            // 显示成功消息
            NotificationService.show('密钥更改成功', 'success');
            
            // 重置表单
            this.changeSecretForm.reset();
            
        } catch (error) {
            console.error('更改密钥失败:', error);
            this.showError('更改密钥失败，请重试');
        } finally {
            // 隐藏加载状态
            this.setFormLoading(false);
        }
    }
      // 重置密钥功能已移除
    
    showError(message) {
        if (!this.changeSecretError) return;
        
        if (message) {
            this.changeSecretError.textContent = message;
            this.changeSecretError.classList.remove('hidden');
        } else {
            this.changeSecretError.textContent = '';
            this.changeSecretError.classList.add('hidden');
        }
    }
    
    setFormLoading(isLoading) {
        if (!this.changeSecretForm) return;
        
        const inputs = this.changeSecretForm.querySelectorAll('input');
        const submitBtn = this.changeSecretForm.querySelector('button[type="submit"]');
        
        if (isLoading) {
            // 禁用表单
            inputs.forEach(input => input.disabled = true);
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>处理中...';
        } else {
            // 启用表单
            inputs.forEach(input => input.disabled = false);
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i>更新密钥';
        }
    }
}

// 创建全局实例
window.secretManager = new SecretManager();
