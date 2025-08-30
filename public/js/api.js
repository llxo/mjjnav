// API 调用相关函数
class ApiService {
    constructor() {
        this.baseURL = '/api';
        // 移除预加载功能，等待验证通过后再加载数据
    }

    // 获取导航项
    async getItems(archived = false) {
        try {
            if (archived) {
                return await this.call(`/items?archived=true`, { method: 'GET' });
            } else {
                return await this.call('/items', { method: 'GET' });
            }
        } catch (error) {
            console.error('获取导航项失败:', error);
            throw error;
        }
    }

    async call(url, options = {}) {
        try {
            // 检查是否已通过验证（除了密钥检查相关的API）
            if (!window.isAuthenticated && !url.includes('/secret/')) {
                throw new Error('未通过身份验证');
            }
            
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
            if (window.NotificationService) {
                NotificationService.show('操作失败: ' + error.message, 'error');
            }
            throw error;
        }
    }    // 导航项相关API
    async createItem(data) {
        const result = await this.call('/items', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        // 后端只返回id和消息，我们需要构造完整的导航项对象
        if (result && result.id) {
            // 将提交的数据和返回的ID合并为一个完整的对象
            return { 
                ...data,
                id: result.id 
            };
        }
        return result;
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
    }    // 倒计时相关API
    async getCountdownEvents() {
        return this.call('/countdown');
    }async createCountdownEvent(data) {
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
    
    // 密钥管理相关API
    async checkSecretKeyExists() {
        // 密钥检查不需要验证
        const response = await fetch(this.baseURL + '/secret/check');
        return response.json();
    }
    
    async verifySecretKey(secretKey) {
        // 密钥验证不需要预先验证
        const response = await fetch(this.baseURL + '/secret/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ secretKey })
        });
        return { response, data: await response.json() };
    }
    
    async setupSecretKey(secretKey) {
        // 密钥设置不需要预先验证
        const response = await fetch(this.baseURL + '/secret/setup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ secretKey })
        });
        return { response, data: await response.json() };
    }
    
    async changeSecretKey(currentSecretKey, newSecretKey) {
        return this.call('/secret/change', {
            method: 'POST',
            body: JSON.stringify({ currentSecretKey, newSecretKey })
        });
    }
    
    async resetSecretKey() {
        return this.call('/secret/reset', {
            method: 'POST'
        });
    }
}

// 创建全局API服务实例（防止重复创建）
if (!window.apiService) {
    window.apiService = new ApiService();
} else {
    console.log('ApiService实例已存在，跳过重复创建');
}
