// 密钥认证管理
class SecretKeyManager {
    constructor() {
        this.sessionToken = localStorage.getItem('sessionToken');
        this.hasSecretKey = null;
        this.init();
    }    async init() {
        try {
            console.log('SecretKeyManager 初始化开始');
            
            // 检查是否已设置密钥
            await this.checkSecretKeyExists();
            console.log('密钥存在检查完成，结果:', this.hasSecretKey);
              // 如果没有设置密钥，强制显示设置界面
            if (!this.hasSecretKey) {
                console.log('强制显示密钥设置界面');
                this.showSetupModal();
                // 阻止页面其他功能的初始化
                this.blockPageInteraction();
            } else {
                console.log('密钥已设置，需要验证');
                // 检查会话是否有效，无效则要求验证
                if (this.sessionToken) {
                    // 尝试验证当前会话token
                    const isValid = await this.checkAuthentication();
                    if (isValid) {
                        console.log('会话有效，允许正常使用');
                        this.unblockPageInteraction();
                    } else {
                        console.log('会话无效，需要重新验证');
                        // 在这里不需要特别操作，因为checkAuthentication会自动显示验证界面
                    }                } else {
                    console.log('无会话token，显示验证界面');
                    // 显示验证界面并阻止页面交互
                    this.showAuthModal();
                    this.blockPageInteraction();
                }
            }
        } catch (error) {
            console.error('初始化密钥管理失败:', error);
            // 出错时也强制显示设置界面
            this.showSetupModal();
            this.blockPageInteraction();
        }
    }

    async checkSecretKeyExists() {
        try {
            const response = await fetch('/api/secret/check');
            const data = await response.json();
            this.hasSecretKey = data.hasSecretKey;
            return this.hasSecretKey;
        } catch (error) {
            console.error('检查密钥失败:', error);
            return false;
        }
    }    async checkAuthentication(showModal = true) {
        // 如果有会话token，检查是否仍然有效
        if (this.sessionToken) {
            try {
                const response = await fetch('/api/items', {
                    headers: {
                        'x-session-token': this.sessionToken
                    }
                });
                
                if (response.ok) {
                    // 会话有效，返回
                    return true;
                } else {
                    // 会话无效，清除token
                    this.clearSession();
                }
            } catch (error) {
                console.error('检查认证失败:', error);
                this.clearSession();
            }
        }
        
        // 如果需要显示验证界面，则显示
        if (showModal) {
            this.showAuthModal();
        }
        return false;
    }    // 检查认证状态，如果未认证则显示认证界面
    async checkAuthenticationForAction(callback) {
        try {
            // 如果没有设置密钥，允许操作（初始化阶段）
            if (!this.hasSecretKey) {
                await this.checkSecretKeyExists();
                if (!this.hasSecretKey) {
                    return callback();
                }
            }
            
            // 修改操作不需要认证，直接执行回调
            // 根据需求：修改操作不需要认证，只有首次加载需要认证
            return callback();
        } catch (error) {
            console.error('认证检查失败:', error);
            return callback(); // 即使出错也允许执行
        }
    }

    // 显示认证界面并在成功后执行回调
    showAuthModalWithCallback(callback) {
        // 移除可能存在的旧模态框
        const oldModal = document.querySelector('.secret-auth-modal');
        if (oldModal) {
            oldModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'modal show secret-auth-modal';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">访问验证</h5>
                    </div>
                    <div class="modal-body">
                        <p>请输入访问密钥来继续操作：</p>
                        <div class="form-group">
                            <label for="authSecretKey">密钥:</label>
                            <input type="password" class="form-control" id="authSecretKey" 
                                   placeholder="输入您的密钥" onkeypress="if(event.key==='Enter') secretKeyManager.authenticateAndExecute()">
                        </div>
                        <div id="authError" class="alert alert-danger d-none"></div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="secretKeyManager.cancelAuthAndExecute()">
                            取消
                        </button>
                        <button type="button" class="btn btn-primary" onclick="secretKeyManager.authenticateAndExecute()">
                            验证
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // 保存回调函数
        this.pendingCallback = callback;
        
        // 自动聚焦输入框
        setTimeout(() => {
            document.getElementById('authSecretKey').focus();
        }, 100);
    }

    async authenticateAndExecute() {
        const secretKey = document.getElementById('authSecretKey').value;
        const errorDiv = document.getElementById('authError');

        if (!secretKey) {
            this.showError(errorDiv, '请输入密钥');
            return;
        }

        try {
            const response = await fetch('/api/secret/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ secretKey })
            });

            const data = await response.json();

            if (response.ok) {
                // 验证成功，保存会话token
                const sessionToken = response.headers.get('x-session-token');
                if (sessionToken) {
                    localStorage.setItem('sessionToken', sessionToken);
                    this.sessionToken = sessionToken;
                }
                
                // 移除认证模态框
                const modal = document.querySelector('.secret-auth-modal');
                if (modal) {
                    modal.remove();
                }
                
                // 执行回调
                if (this.pendingCallback) {
                    this.pendingCallback();
                    this.pendingCallback = null;
                }
                
                if (window.NotificationService) {
                    NotificationService.show('验证成功！', 'success');
                }
            } else {
                this.showError(errorDiv, data.error || '验证失败');
            }
        } catch (error) {
            console.error('验证密钥失败:', error);
            this.showError(errorDiv, '验证失败，请重试');
        }
    }

    // 取消认证
    cancelAuthAndExecute() {
        const modal = document.querySelector('.secret-auth-modal');
        if (modal) {
            modal.remove();
        }
        this.pendingCallback = null;
    }    showSetupModal() {
        // 移除可能存在的旧模态框
        const oldModal = document.querySelector('.secret-setup-modal');
        if (oldModal) {
            oldModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'secret-auth-modal secret-setup-modal';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-key" style="margin-right: 8px;"></i>
                            设置访问密钥
                        </h5>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info" style="margin-bottom: 20px;">
                            <i class="fas fa-info-circle" style="margin-right: 8px;"></i>
                            为了保护您的导航数据，需要设置一个访问密钥。请妥善保管您的密钥。
                        </div>
                        <div class="form-group">
                            <label for="setupSecretKey">请输入密钥（至少6位）:</label>
                            <input type="password" class="form-control" id="setupSecretKey" 
                                   placeholder="输入您的密钥" onkeypress="if(event.key==='Enter') document.getElementById('confirmSecretKey').focus()">
                        </div>
                        <div class="form-group">
                            <label for="confirmSecretKey">确认密钥:</label>
                            <input type="password" class="form-control" id="confirmSecretKey" 
                                   placeholder="再次输入密钥" onkeypress="if(event.key==='Enter') secretKeyManager.setupSecretKey()">
                        </div>
                        <div id="setupError" class="alert alert-danger d-none"></div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" onclick="secretKeyManager.setupSecretKey()">
                            <i class="fas fa-check" style="margin-right: 8px;"></i>
                            设置密钥
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // 自动聚焦第一个输入框
        setTimeout(() => {
            document.getElementById('setupSecretKey').focus();
        }, 100);
    }

    showAuthModal() {
        // 移除可能存在的旧模态框
        const oldModal = document.querySelector('.secret-auth-modal');
        if (oldModal) {
            oldModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'modal show secret-auth-modal';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">访问验证</h5>
                    </div>
                    <div class="modal-body">
                        <p>请输入访问密钥来继续使用：</p>                        <div class="form-group">
                            <label for="authSecretKey">密钥:</label>
                            <input type="password" class="form-control" id="authSecretKey" 
                                   placeholder="输入您的密钥" onkeypress="if(event.key==='Enter') secretKeyManager.authenticateSecretKey()">
                        </div>
                        <div id="authError" class="alert alert-danger d-none"></div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" onclick="secretKeyManager.authenticateSecretKey()">
                            验证
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // 自动聚焦输入框
        setTimeout(() => {
            document.getElementById('authSecretKey').focus();
        }, 100);
    }

    async setupSecretKey() {
        const secretKey = document.getElementById('setupSecretKey').value;
        const confirmKey = document.getElementById('confirmSecretKey').value;
        const errorDiv = document.getElementById('setupError');

        if (!secretKey || secretKey.length < 6) {
            this.showError(errorDiv, '密钥长度不能少于6位');
            return;
        }

        if (secretKey !== confirmKey) {
            this.showError(errorDiv, '两次输入的密钥不一致');
            return;
        }

        try {
            const response = await fetch('/api/secret/setup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ secretKey })
            });

            const data = await response.json();            if (response.ok) {
                // 设置成功，移除模态框并验证
                document.querySelector('.secret-setup-modal').remove();
                this.hasSecretKey = true;
                
                // 解除页面阻止
                this.unblockPageInteraction();
                
                // 验证密钥并保存会话token
                await this.verifySecretKey(secretKey);
                
                if (window.NotificationService) {
                    NotificationService.show('密钥设置成功！', 'success');
                }
            } else {
                this.showError(errorDiv, data.error || '设置失败');
            }
        } catch (error) {
            console.error('设置密钥失败:', error);
            this.showError(errorDiv, '设置失败，请重试');
        }
    }

    async authenticateSecretKey() {
        const secretKey = document.getElementById('authSecretKey').value;
        const errorDiv = document.getElementById('authError');

        if (!secretKey) {
            this.showError(errorDiv, '请输入密钥');
            return;
        }

        try {
            await this.verifySecretKey(secretKey);
        } catch (error) {
            console.error('验证密钥失败:', error);
            this.showError(errorDiv, '验证失败，请重试');
        }
    }    async verifySecretKey(secretKey) {
        const response = await fetch('/api/secret/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ secretKey })
        });

        const data = await response.json();        if (response.ok) {
            // 验证成功，保存会话token
            const sessionToken = response.headers.get('x-session-token');
            if (sessionToken) {
                localStorage.setItem('sessionToken', sessionToken);
                this.sessionToken = sessionToken;
            }
            
            // 移除认证模态框
            const modal = document.querySelector('.secret-auth-modal');
            if (modal) {
                modal.remove();
            }
            
            // 解除页面阻止（如果存在）
            this.unblockPageInteraction();
            
            // 刷新页面数据
            if (window.app && window.app.loadNavigationItems) {
                window.app.loadNavigationItems();
            }
            
            if (window.NotificationService) {
                NotificationService.show('验证成功！', 'success');
            }
        } else {
            const errorDiv = document.getElementById('authError');
            if (errorDiv) {
                this.showError(errorDiv, data.error || '验证失败');
            }
        }
    }

    showError(errorDiv, message) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('d-none');
        setTimeout(() => {
            errorDiv.classList.add('d-none');
        }, 5000);
    }

    clearSession() {
        localStorage.removeItem('sessionToken');
        this.sessionToken = null;
    }

    // 获取当前会话token用于API调用
    getSessionToken() {
        return this.sessionToken;
    }

    // 阻止页面交互
    blockPageInteraction() {
        // 创建遮罩层阻止用户操作
        if (!document.getElementById('secret-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'secret-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                z-index: 999;
                display: flex;
                align-items: center;
                justify-content: center;
                backdrop-filter: blur(5px);
            `;
            
            const message = document.createElement('div');
            message.style.cssText = `
                color: white;
                text-align: center;
                font-size: 18px;
                padding: 20px;
            `;
            message.innerHTML = `
                <i class="fas fa-lock" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                <p>请先设置访问密钥</p>
            `;
            
            overlay.appendChild(message);
            document.body.appendChild(overlay);
        }
    }

    // 解除页面交互阻止
    unblockPageInteraction() {
        const overlay = document.getElementById('secret-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
}

// 全局实例
let secretKeyManager;

// 立即创建实例
secretKeyManager = new SecretKeyManager();
window.secretKeyManager = secretKeyManager;
