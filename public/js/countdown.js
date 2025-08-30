// 倒计时管理服务
class CountdownService {
    constructor() {
        this.events = [];
        this.isEditMode = false;
        this.currentEditId = null;
        this.updateTimer = null;
        
        // DOM 元素
        this.countdownContainer = null;
        this.manageCountdownBtn = null;
        this.countdownModal = null;
        this.countdownList = null;
        this.countdownForm = null;
        this.countdownIdInput = null;
        this.countdownTitleInput = null;
        this.countdownDateInput = null;
        this.countdownDescriptionInput = null;
        this.countdownIconInput = null;
        this.countdownIconPreview = null;
        this.closeCountdownModalBtn = null;
        this.cancelCountdownBtn = null;
        this.deleteCountdownBtn = null;
        
        // 尝试早期初始化
        this._tryEarlyInit();
    }
    
    _tryEarlyInit() {
        // 如果DOM已经加载完成，立即初始化倒计时容器并加载事件
        if (document.readyState !== 'loading') {
            this._earlyInitDOMElements();
            this._earlyLoadEvents();
        } else {
            // 否则等待DOM内容加载完成再初始化
            document.addEventListener('DOMContentLoaded', () => {
                this._earlyInitDOMElements();
                this._earlyLoadEvents();
            });
        }
    }
    
    _earlyInitDOMElements() {
        // 只初始化显示倒计时所必需的DOM元素
        this.countdownContainer = document.getElementById('countdown-container');
    }
    
    async _earlyLoadEvents() {
        if (!this.countdownContainer) return;
        
        try {
            // 如果ApiService已经可用，使用它来加载倒计时事件
            if (window.apiService) {
                console.log('提前加载倒计时事件...');
                this.events = await window.apiService.getCountdownEvents();
                this.renderEvents();
            }
        } catch (error) {
            console.error('提前加载倒计时事件失败:', error);
            // 错误处理会在完整初始化时再次尝试
        }
    }

    init() {
        this.initDOMElements();
        this.setupEventListeners();
        // 只有在早期加载没有成功获取事件时才重新加载
        if (!this.events || this.events.length === 0) {
            this.loadEvents();
        }
        this.startUpdateTimer();
    }

    initDOMElements() {
        this.countdownContainer = document.getElementById('countdown-container');
        this.manageCountdownBtn = document.getElementById('manage-countdown-btn');
        this.countdownModal = document.getElementById('countdown-modal');
        this.countdownList = document.getElementById('countdown-list');
        this.countdownForm = document.getElementById('countdown-form');
        this.countdownIdInput = document.getElementById('countdown-id');
        this.countdownTitleInput = document.getElementById('countdown-title');
        this.countdownDateInput = document.getElementById('countdown-date');
        this.countdownDescriptionInput = document.getElementById('countdown-description');
        this.countdownIconInput = document.getElementById('countdown-icon');
        this.countdownIconPreview = document.getElementById('countdown-icon-preview');
        this.closeCountdownModalBtn = document.getElementById('close-countdown-modal-btn');
        this.cancelCountdownBtn = document.getElementById('cancel-countdown-btn');
        this.deleteCountdownBtn = document.getElementById('delete-countdown-btn');
    }    setupEventListeners() {
        if (this.manageCountdownBtn) {
            this.manageCountdownBtn.addEventListener('click', () => this.openManageModal());
        }
        
        if (this.closeCountdownModalBtn) {
            this.closeCountdownModalBtn.addEventListener('click', () => this.closeModal());
        }
        
        if (this.cancelCountdownBtn) {
            this.cancelCountdownBtn.addEventListener('click', () => this.closeModal());
        }
          // 点击模态框外部区域不关闭
        if (this.countdownModal) {
        }
        
        if (this.countdownForm) {
            this.countdownForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }
        
        if (this.deleteCountdownBtn) {
            this.deleteCountdownBtn.addEventListener('click', () => this.handleDelete());
        }
          if (this.countdownIconInput) {
            this.countdownIconInput.addEventListener('input', () => this.updateIconPreview());
        }
        
        // 为日期输入添加验证
        if (this.countdownDateInput) {
            this.countdownDateInput.addEventListener('input', (e) => this.validateDateInput(e));
        }
    }    async loadEvents(retryCount = 0) {
        try {
            console.log('Loading countdown events...');
            this.events = await apiService.getCountdownEvents();
            console.log('Countdown events loaded:', this.events);
            this.renderEvents();
        } catch (error) {
            console.error('加载倒计时事件失败:', error);
            // 最多重试2次
            if (retryCount < 2) {
                console.log(`尝试重新加载倒计时事件 (${retryCount + 1}/2)...`);
                // 延迟500毫秒后重试
                setTimeout(() => {
                    this.loadEvents(retryCount + 1);
                }, 500);
            } else {
                // 所有重试都失败，显示空状态
                this.events = [];
                this.renderEvents();
            }
        }
    }

    renderEvents() {
        if (!this.countdownContainer) return;
        
        this.countdownContainer.innerHTML = '';
        
        if (this.events.length === 0) {
            this.countdownContainer.innerHTML = '<p class="text-muted-light dark:text-muted-dark">暂无倒计时事件</p>';
            return;
        }
        
        this.events.forEach((event, index) => {
            const countdownElement = this.createCountdownElement(event, index);
            this.countdownContainer.appendChild(countdownElement);
        });
        
        this.updateCountdownDisplay();
    }

    createCountdownElement(event, index) {
        const countdownDiv = document.createElement('div');
        countdownDiv.className = 'flex items-center';
        countdownDiv.dataset.id = event.id;
        
        countdownDiv.innerHTML = `
            <i class="${event.icon || 'far fa-calendar-alt'} mr-2 opacity-75"></i>
            <span class="font-medium mr-1">${Utils.escapeHtml(event.title)}:</span>
            <span class="timer-values" data-target="${event.target_date}">计算中...</span>
        `;
        
        return countdownDiv;
    }

    updateCountdownDisplay() {
        document.querySelectorAll('.timer-values').forEach(timerElement => {
            const targetDate = timerElement.dataset.target;
            if (!targetDate) return;
            
            const timeDiff = Utils.getTimeDifference(targetDate);
            timerElement.textContent = timeDiff.text;
            
            if (timeDiff.expired) {
                timerElement.classList.add('text-red-500');
            } else {
                timerElement.classList.remove('text-red-500');
            }
        });
    }    startUpdateTimer() {
        // 立即更新一次
        this.updateCountdownDisplay();
        
        // 每小时更新一次（因为只显示天数，不需要频繁更新）
        this.updateTimer = setInterval(() => {
            this.updateCountdownDisplay();
        }, 60 * 60 * 1000); // 1小时 = 60分钟 * 60秒 * 1000毫秒
    }

    stopUpdateTimer() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
    }    async openManageModal() {
        // 检查认证后再打开倒计时管理模态框
        if (window.secretKeyManager) {
            window.secretKeyManager.checkAuthenticationForAction(() => {
                this.doOpenManageModal();
            });
        } else {
            this.doOpenManageModal();
        }
    }

    async doOpenManageModal() {
        if (!this.countdownModal) {
            console.error('countdownModal not found');
            return;
        }
        
        console.log('Opening countdown manage modal');
        await this.loadEvents();
        this.renderList();
        this.resetForm();
        this.showModal();
    }

    renderList() {
        if (!this.countdownList) return;
        
        this.countdownList.innerHTML = '';
        
        if (this.events.length === 0) {
            this.countdownList.innerHTML = '<p class="text-center text-muted-light dark:text-muted-dark py-4">暂无倒计时事件</p>';
            return;
        }
        
        this.events.forEach(event => {
            const listItem = this.createListItem(event);
            this.countdownList.appendChild(listItem);
        });
    }    createListItem(event) {
        const listItem = document.createElement('div');
        listItem.className = 'flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mb-2';
        
        const targetDate = new Date(event.target_date);
        const timeDiff = Utils.getTimeDifference(event.target_date);
        
        listItem.innerHTML = `
            <div class="flex items-center space-x-3">
                <i class="${event.icon || 'far fa-calendar-alt'} text-primary-light dark:text-primary-dark"></i>
                <div>
                    <h5 class="font-medium text-text-light dark:text-text-dark">${Utils.escapeHtml(event.title)}</h5>
                    <p class="text-sm text-muted-light dark:text-muted-dark">
                        ${Utils.formatDate(event.target_date)} 
                        ${timeDiff.expired ? '<span class="text-red-500">(已过期)</span>' : ''}
                    </p>
                </div>
            </div>
            <div class="flex items-center space-x-2">
                <button onclick="countdownService.editEvent(${event.id})" class="text-primary-light dark:text-primary-dark hover:text-primary-600 dark:hover:text-primary-300 p-1 rounded transition-colors">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="countdownService.deleteEvent(${event.id})" class="countdown-delete-btn">
                    <i class="fas fa-trash mr-1"></i>删除
                </button>
            </div>
        `;
        
        return listItem;
    }

    showModal() {
        if (!this.countdownModal) return;
        this.countdownModal.classList.remove('hidden');
        this.countdownModal.querySelector('.bg-card-light').classList.add('modal-enter');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        if (!this.countdownModal) return;
        this.countdownModal.classList.add('hidden');
        document.body.style.overflow = '';
        this.resetForm();
    }

    resetForm() {
        if (this.countdownForm) this.countdownForm.reset();
        if (this.countdownIdInput) this.countdownIdInput.value = '';
        if (this.deleteCountdownBtn) this.deleteCountdownBtn.classList.add('hidden');
        this.isEditMode = false;
        this.currentEditId = null;
        this.updateIconPreview();
    }

    editEvent(id) {
        const event = this.events.find(e => e.id === id);
        if (!event) return;
        
        this.isEditMode = true;
        this.currentEditId = id;
        
        // 填充表单
        if (this.countdownIdInput) this.countdownIdInput.value = event.id;
        if (this.countdownTitleInput) this.countdownTitleInput.value = event.title;
        if (this.countdownDescriptionInput) this.countdownDescriptionInput.value = event.description || '';
        if (this.countdownIconInput) this.countdownIconInput.value = event.icon || '';
          // 转换日期格式用于 date 输入
        if (this.countdownDateInput) {
            const eventDate = new Date(event.target_date);
            // 格式化为 YYYY-MM-DD
            const year = eventDate.getFullYear();
            const month = String(eventDate.getMonth() + 1).padStart(2, '0');
            const day = String(eventDate.getDate()).padStart(2, '0');
            this.countdownDateInput.value = `${year}-${month}-${day}`;
        }
        
        if (this.deleteCountdownBtn) this.deleteCountdownBtn.classList.remove('hidden');
        this.updateIconPreview();
    }    async deleteEvent(id) {
        // 使用自定义确认对话框
        const confirmed = await showConfirm({
            title: '确认删除',
            message: '确定要删除这个倒计时事件吗？此操作不可撤销。',
            confirmText: '删除',
            cancelText: '取消'
        });
        
        if (!confirmed) {
            return;
        }
        
        try {
            await apiService.deleteCountdownEvent(id);
            NotificationService.success('倒计时事件删除成功');
            await this.loadEvents();
            this.renderList();
        } catch (error) {
            // 错误已在apiService中处理
        }
    }    async handleFormSubmit(e) {
        e.preventDefault();
        
        if (!this.countdownTitleInput || !this.countdownDateInput) {
            NotificationService.error('表单元素未找到');
            return;
        }
        
        // 检查必填字段
        if (!this.countdownTitleInput.value.trim()) {
            NotificationService.error('请输入事件标题');
            return;
        }
          if (!this.countdownDateInput.value) {
            NotificationService.error('请选择目标日期');
            return;
        }        // 验证日期格式
        let targetDateISO;
        try {
            const dateValue = this.countdownDateInput.value;
            
            // 验证日期格式 YYYY-MM-DD
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(dateValue)) {
                throw new Error('Invalid date format');
            }
            
            // 验证年份为4位数字
            const year = parseInt(dateValue.split('-')[0]);
            if (year < 1000 || year > 9999) {
                throw new Error('Year must be 4 digits');
            }
            
            const targetDate = new Date(dateValue);
            if (isNaN(targetDate.getTime())) {
                throw new Error('Invalid date');
            }
            // 设置为当天的23:59:59
            targetDate.setHours(23, 59, 59, 999);
            targetDateISO = targetDate.toISOString();
        } catch (error) {
            if (error.message === 'Year must be 4 digits') {
                NotificationService.error('年份必须为4位数字');
            } else {
                NotificationService.error('请输入有效的日期');
            }
            return;
        }
        
        const formData = {
            title: this.countdownTitleInput.value.trim(),
            description: this.countdownDescriptionInput ? this.countdownDescriptionInput.value.trim() : '',
            target_date: targetDateISO,
            icon: this.countdownIconInput ? this.countdownIconInput.value.trim() || 'far fa-calendar-alt' : 'far fa-calendar-alt'
        };
        
        try {
            if (this.isEditMode) {
                await apiService.updateCountdownEvent(this.currentEditId, formData);
                NotificationService.success('倒计时事件更新成功');
            } else {
                await apiService.createCountdownEvent(formData);
                NotificationService.success('倒计时事件创建成功');
            }
            
            this.resetForm();
            await this.loadEvents();
            this.renderList();
        } catch (error) {
            // 错误已在apiService中处理
        }
    }async handleDelete() {
        // 使用自定义确认对话框
        const confirmed = await showConfirm({
            title: '确认删除',
            message: '确定要删除这个倒计时事件吗？此操作不可撤销。',
            confirmText: '删除',
            cancelText: '取消'
        });
        
        if (!confirmed) {
            return;
        }
        
        try {
            await apiService.deleteCountdownEvent(this.currentEditId);
            NotificationService.success('倒计时事件删除成功');
            this.resetForm();
            await this.loadEvents();
            this.renderList();
        } catch (error) {
            // 错误已在apiService中处理
        }
    }    updateIconPreview() {
        if (!this.countdownIconPreview || !this.countdownIconInput) return;
        const iconValue = this.countdownIconInput.value.trim() || 'far fa-calendar-alt';
        this.countdownIconPreview.innerHTML = `<i class="${iconValue}"></i>`;
    }
    
    validateDateInput(e) {
        const input = e.target;
        const value = input.value;
        
        // 如果输入为空，不显示错误
        if (!value) {
            input.setCustomValidity('');
            return;
        }
        
        // 验证日期格式和年份
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(value)) {
            input.setCustomValidity('请输入正确的日期格式');
            return;
        }
        
        const year = parseInt(value.split('-')[0]);
        if (year < 1000 || year > 9999) {
            input.setCustomValidity('年份必须为4位数字');
            return;
        }
        
        // 验证是否为有效日期
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            input.setCustomValidity('请输入有效的日期');
            return;
        }
        
        // 清除自定义验证消息
        input.setCustomValidity('');
    }

    destroy() {
        this.stopUpdateTimer();
    }
}

// 创建全局倒计时服务实例
// 创建全局倒计时服务实例（防止重复创建）
if (!window.countdownService) {
    window.countdownService = new CountdownService();
} else {
    console.log('CountdownService实例已存在，跳过重复创建');
}
