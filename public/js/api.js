// API 调用相关函数
class ApiService {
    constructor() {
        this.baseURL = '/api';
    }    async call(url, options = {}) {
        try {
            // 添加会话token到请求头
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers
            };
            
            // 如果有会话token，添加到请求头
            if (window.secretKeyManager && window.secretKeyManager.getSessionToken()) {
                headers['x-session-token'] = window.secretKeyManager.getSessionToken();
            }
            
            const response = await fetch(this.baseURL + url, {
                headers,
                ...options
            });
            
            // 检查是否返回了新的会话token
            const newSessionToken = response.headers.get('x-session-token');
            if (newSessionToken && window.secretKeyManager) {
                localStorage.setItem('sessionToken', newSessionToken);
                window.secretKeyManager.sessionToken = newSessionToken;
            }
            
            const data = await response.json();
              if (!response.ok) {
                // 如果是认证失败且是GET请求（首次加载），触发重新认证
                // 对于其他请求方法（如POST、PUT、DELETE等修改操作），不需要重新认证
                if ((response.status === 401 || response.status === 403) && options.method === 'GET') {
                    if (window.secretKeyManager) {
                        window.secretKeyManager.clearSession();
                        window.secretKeyManager.showAuthModal();
                    }
                }
                throw new Error(data.error || '请求失败');
            }
            
            return data;
        } catch (error) {
            console.error('API调用错误:', error);
            NotificationService.show('操作失败: ' + error.message, 'error');
            throw error;
        }
    }

    // 导航项相关API
    async getItems(archived = false) {
        return this.call(`/items?archived=${archived}`);
    }

    async createItem(data) {
        return this.call('/items', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateItem(id, data) {
        return this.call(`/items/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }    async deleteItem(id) {
        return this.call(`/items/${id}`, {
            method: 'DELETE'
        });
    }

    async reorderItems(items) {
        return this.call('/items/reorder', {
            method: 'PUT',
            body: JSON.stringify({ items })
        });
    }

    // 倒计时相关API
    async getCountdownEvents() {
        return this.call('/countdown');
    }    async createCountdownEvent(data) {
        return this.call('/countdown', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateCountdownEvent(id, data) {
        return this.call(`/countdown/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteCountdownEvent(id) {
        return this.call(`/countdown/${id}`, {
            method: 'DELETE'
        });
    }

    // 归档相关API
    async updateItemArchiveStatus(id, isArchived) {
        return this.call(`/items/${id}/archive`, {
            method: 'PUT',
            body: JSON.stringify({ is_archived: isArchived })
        });
    }
}

// 创建全局API服务实例
window.apiService = new ApiService();
