// API 调用相关函数
class ApiService {
    constructor() {
        this.baseURL = '/api';
        
        // 在实例化时尝试加载导航项，以提高页面加载速度
        this._prefetchItems();
        // 在实例化时尝试加载倒计时事件
        this._prefetchCountdownEvents();
    }

    _prefetchItems() {
        // 提前获取导航项数据并缓存
        this.itemsCache = fetch(this.baseURL + '/items')
            .then(response => response.json())
            .catch(error => {
                console.error('预加载导航项失败:', error);
                return []; // 失败时返回空数组
            });
    }
    
    // 预加载倒计时事件
    _prefetchCountdownEvents() {
        // 提前获取倒计时事件数据并缓存
        this.countdownEventsCache = fetch(this.baseURL + '/countdown')
            .then(response => response.json())
            .catch(error => {
                console.error('预加载倒计时事件失败:', error);
                return []; // 失败时返回空数组
            });
    }
    
    // 获取导航项的简化方法，优先使用缓存
    async getItems(archived = false) {
        try {
            if (archived) {
                // 对于归档项，仍然需要正常请求
                return await this.call(`/items?archived=true`, { method: 'GET' });
            } else if (this.itemsCache) {
                // 对于首页导航项，优先使用缓存
                return await this.itemsCache;
            } else {
                // 如果没有缓存，则正常请求
                return await this.call('/items', { method: 'GET' });
            }
        } catch (error) {
            console.error('获取导航项失败:', error);
            throw error;
        }
    }

    async call(url, options = {}) {
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
        try {
            if (this.countdownEventsCache) {
                // 优先使用缓存
                return await this.countdownEventsCache;
            } else {
                // 如果没有缓存，则正常请求
                return await this.call('/countdown');
            }
        } catch (error) {
            console.error('获取倒计时事件失败:', error);
            // 出错时尝试直接调用API
            return this.call('/countdown');
        }
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
        return this.call('/secret/check');
    }
    
    async verifySecretKey(secretKey) {
        return this.call('/secret/verify', {
            method: 'POST',
            body: JSON.stringify({ secretKey })
        });
    }
    
    async setupSecretKey(secretKey) {
        return this.call('/secret/setup', {
            method: 'POST',
            body: JSON.stringify({ secretKey })
        });
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

// 创建全局API服务实例
window.apiService = new ApiService();
