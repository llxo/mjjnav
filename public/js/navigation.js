// 导航卡片管理服务
class NavigationService {
    constructor() {
        this.items = [];
        this.isEditMode = false;
        this.currentEditId = null;
        this.sortableInstance = null;
        
        // DOM 元素
        this.cardGrid = null;
        this.loadingIndicator = null;
        this.emptyState = null;
        this.modal = null;
        this.modalTitle = null;
        this.cardForm = null;
        this.addCardBtn = null;
        this.closeModalBtn = null;
        this.cancelBtn = null;
        this.deleteCardBtn = null;
        
        // 表单元素
        this.cardIdInput = null;
        this.cardTitleInput = null;
        this.cardDescriptionInput = null;
        this.cardUrlInput = null;
        this.cardIconInput = null;
        this.iconPreview = null;
        
        // 尝试尽早加载DOM元素和导航项
        this._tryEarlyInit();
    }
    
    _tryEarlyInit() {
        // 如果DOM已经加载完成，立即初始化DOM元素和加载导航项
        if (document.readyState !== 'loading') {
            this._earlyInitDOMElements();
            this._earlyLoadItems();
        } else {
            // 否则等待DOM内容加载完成再初始化
            document.addEventListener('DOMContentLoaded', () => {
                this._earlyInitDOMElements();
                this._earlyLoadItems();
            });
        }
    }
    
    _earlyInitDOMElements() {
        // 只初始化显示导航项所必需的DOM元素
        this.cardGrid = document.getElementById('card-grid');
        this.loadingIndicator = document.getElementById('loading-indicator');
        this.emptyState = document.getElementById('empty-state');
    }
    
    async _earlyLoadItems() {
        try {
            // 如果ApiService已经可用，使用它来加载导航项
            if (window.apiService) {
                this.showLoading();
                this.items = await window.apiService.getItems(false);
                this.renderItems();
            } else {
                // 否则直接使用fetch API加载导航项
                this.showLoading();
                const response = await fetch('/api/items');
                if (response.ok) {
                    this.items = await response.json();
                    this.renderItems();
                }
            }
        } catch (error) {
            console.error('提前加载导航项失败:', error);
            // 错误处理会在完整初始化时再次尝试
        } finally {
            this.hideLoading();
        }
    }

    init() {
        this.initDOMElements();
        this.setupEventListeners();
        // 如果尚未加载导航项，才进行加载
        if (this.items.length === 0) {
            this.loadItems();
        } else {
            // 如果已经加载，只需要设置排序功能
            this.setupSortable();
        }
    }    initDOMElements() {
        this.cardGrid = document.getElementById('card-grid');
        this.loadingIndicator = document.getElementById('loading-indicator');
        this.emptyState = document.getElementById('empty-state');
        this.modal = document.getElementById('card-modal');
        this.modalTitle = document.getElementById('modal-title');
        this.cardForm = document.getElementById('card-form');
        this.addCardBtn = document.getElementById('add-card-btn');
        this.closeModalBtn = document.getElementById('close-modal-btn');
        this.cancelBtn = document.getElementById('cancel-btn');
        this.deleteCardBtn = document.getElementById('delete-card-btn');
        
        this.cardIdInput = document.getElementById('card-id');
        this.cardTitleInput = document.getElementById('card-title');
        this.cardDescriptionInput = document.getElementById('card-description');
        this.cardUrlInput = document.getElementById('card-url');
        this.cardIconInput = document.getElementById('card-icon');
        this.iconPreview = document.getElementById('icon-preview');
    }    setupEventListeners() {
        if (this.addCardBtn) {
            this.addCardBtn.addEventListener('click', () => this.openAddModal());
        }
        
        if (this.closeModalBtn) {
            this.closeModalBtn.addEventListener('click', () => this.closeModal());
        }
          // 添加鼠标滚轮事件来水平滚动图标列表
        const iconContainer = document.getElementById('icon-examples');
        if (iconContainer) {
            iconContainer.addEventListener('wheel', (e) => {
                if (e.deltaY !== 0) {
                    e.preventDefault(); // 阻止默认垂直滚动
                    const scrollAmount = e.deltaY > 0 ? 160 : -160; // 根据滚动方向确定滚动量
                    iconContainer.scrollBy({
                        left: scrollAmount,
                        behavior: 'smooth'
                    });
                }
            }, { passive: false }); // passive: false 允许阻止默认行为
        }
        
        // 添加右键菜单事件 - 在空白处右键时跳转到归档页面
        document.addEventListener('contextmenu', (e) => {            // 如果点击的不是卡片，且没有打开任何模态框，则跳转到归档页面
            if (!e.target.closest('.card-container') && !document.querySelector('.modal:not(.hidden)')) {
                e.preventDefault();
                window.location.href = '/archive';
            }
        });
        
        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => this.closeModal());
        }
          if (this.modal) {
        }
        
        if (this.cardForm) {
            this.cardForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }        if (this.deleteCardBtn) {
            this.deleteCardBtn.addEventListener('click', () => this.handleDelete());
        }
        
        if (this.cardIconInput) {
            this.cardIconInput.addEventListener('input', () => this.updateIconPreview());
        }        // 示例图标点击事件
        document.addEventListener('click', (e) => {
            if (e.target.closest('.icon-example-btn')) {
                const iconBtn = e.target.closest('.icon-example-btn');
                const iconClass = iconBtn.dataset.icon;
                if (this.cardIconInput) {
                    this.cardIconInput.value = iconClass;
                    this.updateIconPreview();
                }
            }            // 处理图标左右滚动
            if (e.target.closest('#scroll-icons-left')) {
                this.scrollIcons('left');
            }
            if (e.target.closest('#scroll-icons-right')) {
                this.scrollIcons('right');
            }
        });        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }    async loadItems(archived = false) {
        try {
            this.showLoading();
            this.items = await apiService.getItems(archived);
            this.renderItems();
        } catch (error) {
            console.error('加载导航项失败:', error);
            this.showEmptyState();
        } finally {
            this.hideLoading();
        }
    }    renderItems() {
        if (!this.cardGrid) return;
        
        if (!this.items || this.items.length === 0) {
            this.showEmptyState();
            return;
        }
        
        this.hideEmptyState();
        this.cardGrid.innerHTML = '';
        
        this.items.forEach((item, index) => {
            const cardElement = this.createCardElement(item, index);
            this.cardGrid.appendChild(cardElement);
        });
        
        // 应用淡入动画
        const cards = this.cardGrid.querySelectorAll('.card-container');
        cards.forEach((card, index) => {
            card.classList.add('fade-in', `fade-in-delay-${Math.min(index + 1, 6)}`);
        });
        
        // 重新初始化排序功能
        this.setupSortable();
    }

    createCardElement(item, index) {
        const cardContainer = document.createElement('div');
        cardContainer.className = 'card-container';
        cardContainer.dataset.id = item.id;
        
        cardContainer.innerHTML = `
            <div class="card-grab-handle">
                <i class="fas fa-grip-vertical"></i>
            </div>
            <div class="relative group">
                <a href="${item.url}" target="_blank" rel="noopener noreferrer"
                   class="group block bg-card-light dark:bg-card-dark rounded-xl shadow-sm hover:shadow-lg dark:hover:shadow-gray-700/50 border border-transparent hover:border-primary-light/30 dark:hover:border-primary-dark/30 p-6 pr-12 transition-all duration-300 transform hover:-translate-y-1">
                    <div class="flex items-center space-x-4">
                        <div class="flex-shrink-0 text-primary-light dark:text-primary-dark text-2xl">
                            <i class="${item.icon || 'fas fa-link'} w-8 h-8"></i>
                        </div>
                        <div class="flex-1">
                            <h3 class="text-lg font-semibold text-text-light dark:text-text-dark group-hover:text-primary-light dark:group-hover:text-primary-dark transition-colors">
                                ${Utils.escapeHtml(item.title)}
                            </h3>
                            <p class="text-sm text-muted-light dark:text-muted-dark mt-1">
                                ${Utils.escapeHtml(item.description)}
                            </p>
                        </div>
                    </div>
                </a>
                <button onclick="navigationService.openEditModal(${item.id})" 
                        class="edit-card-btn absolute bottom-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-white dark:bg-gray-700 shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 text-muted-light dark:text-muted-dark hover:text-primary-light dark:hover:text-primary-dark hover:bg-gray-50 dark:hover:bg-gray-600 hover:scale-110">
                    <i class="fas fa-edit text-xs"></i>
                </button>
            </div>
        `;
        
        return cardContainer;
    }    openAddModal() {
        // 检查认证后再打开模态框
        if (window.secretKeyManager) {
            window.secretKeyManager.checkAuthenticationForAction(() => {
                this.doOpenAddModal();
            });
        } else {
            this.doOpenAddModal();
        }
    }

    doOpenAddModal() {
        if (!this.modal || !this.modalTitle || !this.deleteCardBtn) return;
        
        this.isEditMode = false;
        this.currentEditId = null;
        this.modalTitle.textContent = '添加新卡片';
        this.deleteCardBtn.classList.add('hidden');
        this.resetForm();
        this.showModal();
    }    openEditModal(id) {
        // 检查认证后再打开编辑模态框
        if (window.secretKeyManager) {
            window.secretKeyManager.checkAuthenticationForAction(() => {
                this.doOpenEditModal(id);
            });
        } else {
            this.doOpenEditModal(id);
        }
    }

    doOpenEditModal(id) {
        if (!this.modal || !this.modalTitle || !this.deleteCardBtn) return;
        
        const item = this.items.find(item => item.id === id);
        if (!item) return;
        
        this.isEditMode = true;
        this.currentEditId = id;
        this.modalTitle.textContent = '编辑卡片';
        this.deleteCardBtn.classList.remove('hidden');
        
        // 填充表单
        if (this.cardIdInput) this.cardIdInput.value = item.id;
        if (this.cardTitleInput) this.cardTitleInput.value = item.title;
        if (this.cardDescriptionInput) this.cardDescriptionInput.value = item.description;
        if (this.cardUrlInput) this.cardUrlInput.value = item.url;
        if (this.cardIconInput) this.cardIconInput.value = item.icon || '';
        this.updateIconPreview();
        
        this.showModal();
    }

    showModal() {
        if (!this.modal) return;
        this.modal.classList.remove('hidden');
        this.modal.querySelector('.bg-card-light').classList.add('modal-enter');
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
            if (this.cardTitleInput) this.cardTitleInput.focus();
        }, 100);
    }

    closeModal() {
        if (!this.modal) return;
        this.modal.classList.add('hidden');
        document.body.style.overflow = '';
        this.resetForm();
    }

    resetForm() {
        if (this.cardForm) this.cardForm.reset();
        if (this.cardIdInput) this.cardIdInput.value = '';
        this.updateIconPreview();
    }    async handleFormSubmit(e) {
        e.preventDefault();
        
        if (!this.cardTitleInput || !this.cardDescriptionInput || !this.cardUrlInput) {
            NotificationService.error('表单元素未找到');
            return;
        }
        
        const formData = {
            title: this.cardTitleInput.value.trim(),
            description: this.cardDescriptionInput.value.trim(),
            url: this.cardUrlInput.value.trim(),
            icon: this.cardIconInput ? this.cardIconInput.value.trim() || 'fas fa-link' : 'fas fa-link'
        };
        
        if (!formData.title || !formData.description || !formData.url) {
            NotificationService.error('请填写所有必填字段');
            return;
        }
        
        try {
            if (this.isEditMode) {
                // 更新服务器上的数据
                const updatedItem = await apiService.updateItem(this.currentEditId, formData);
                // 更新本地数据
                const itemIndex = this.items.findIndex(item => item.id === this.currentEditId);
                if (itemIndex !== -1) {
                    this.items[itemIndex] = { ...this.items[itemIndex], ...formData };
                    // 立即更新UI
                    this.updateCardElement(this.items[itemIndex]);
                }
                NotificationService.success('卡片更新成功');
            } else {                // 创建新卡片
                const newItem = await apiService.createItem(formData);
                // 添加到本地数据
                if (newItem && newItem.id) {
                    // 将服务器返回的对象添加到数组
                    this.items.push(newItem);
                    // 立即更新UI
                    // 使用完整渲染来确保DOM中包含正确的ID和URL
                    this.renderItems();
                }
                NotificationService.success('卡片创建成功');
            }
            
            this.closeModal();
        } catch (error) {
            // 错误已在apiService中处理
        }
    }    async handleDelete() {
        if (!this.currentEditId) {
            NotificationService.error('无法删除：未选择要删除的项目');
            return;
        }
        
        // 使用自定义确认对话框
        const confirmed = await showConfirm({
            title: '确认删除',
            message: '确定要删除这个导航项吗？此操作不可撤销。',
            confirmText: '删除',
            cancelText: '取消'
        });
        
        if (!confirmed) {
            return;
        }
        
        try {
            await apiService.deleteItem(this.currentEditId);
            NotificationService.success('卡片删除成功');
            this.closeModal();
            
            // 从本地数据中移除
            const itemIndex = this.items.findIndex(item => item.id === this.currentEditId);
            if (itemIndex !== -1) {
                this.items.splice(itemIndex, 1);
                
                // 从DOM中移除
                const cardElement = this.cardGrid.querySelector(`.card-container[data-id="${this.currentEditId}"]`);
                if (cardElement) {
                    // 添加淡出动画
                    cardElement.classList.add('fade-out');
                    // 等待动画完成后移除元素
                    setTimeout(() => {
                        cardElement.remove();
                        
                        // 如果没有导航项，显示空状态
                        if (this.items.length === 0) {
                            this.showEmptyState();
                        }
                    }, 300);
                }
            }
        } catch (error) {
            console.error('Delete error:', error);
            NotificationService.error('删除失败: ' + error.message);
        }
    }

    updateIconPreview() {
        if (!this.iconPreview || !this.cardIconInput) return;
        const iconValue = this.cardIconInput.value.trim() || 'fas fa-link';
        this.iconPreview.innerHTML = `<i class="${iconValue}"></i>`;
    }    scrollIcons(direction) {
        const iconsContainer = document.getElementById('icon-examples');
        if (!iconsContainer) return;
        
        const iconWidth = 40; // 图标按钮宽度 + 间距
        const visibleIcons = Math.floor(iconsContainer.offsetWidth / iconWidth);
        const scrollAmount = iconWidth * Math.max(4, Math.floor(visibleIcons / 1.5)); // 一次滚动更多图标
        const currentScrollLeft = iconsContainer.scrollLeft;
        
        if (direction === 'left') {
            iconsContainer.scrollTo({
                left: Math.max(0, currentScrollLeft - scrollAmount),
                behavior: 'smooth'
            });
        } else if (direction === 'right') {
            iconsContainer.scrollTo({
                left: currentScrollLeft + scrollAmount,
                behavior: 'smooth'
            });
        }
    }

    showLoading() {
        if (this.loadingIndicator) this.loadingIndicator.classList.remove('hidden');
        if (this.cardGrid) this.cardGrid.classList.add('hidden');
        if (this.emptyState) this.emptyState.classList.add('hidden');
    }    hideLoading() {
        if (this.loadingIndicator) this.loadingIndicator.classList.add('hidden');
        // 只有在有导航项时才显示卡片网格，否则显示空状态
        if (this.items && this.items.length > 0) {
            this.hideEmptyState();
        } else {
            this.showEmptyState();
        }
    }

    showEmptyState() {
        if (this.emptyState) this.emptyState.classList.remove('hidden');
        if (this.cardGrid) this.cardGrid.classList.add('hidden');
    }

    hideEmptyState() {
        if (this.emptyState) this.emptyState.classList.add('hidden');
        if (this.cardGrid) this.cardGrid.classList.remove('hidden');
    }    createArchiveIndicator() {
        // 如果已存在则移除
        const existingIndicator = document.getElementById('archive-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // 创建归档区域指示器
        const archiveIndicator = document.createElement('div');
        archiveIndicator.id = 'archive-indicator';
        archiveIndicator.className = 'fixed top-0 left-0 w-full bg-primary-light dark:bg-primary-dark bg-opacity-80 dark:bg-opacity-80 text-white text-center py-4 z-50 transform -translate-y-full transition-transform duration-300';
        archiveIndicator.innerHTML = '<i class="fas fa-archive mr-2"></i>拖放至此归档';
        
        document.body.appendChild(archiveIndicator);
    }    showArchiveIndicator() {
        const indicator = document.getElementById('archive-indicator');
        if (indicator) {
            indicator.classList.add('translate-y-0');
            indicator.classList.remove('-translate-y-full');
        }
    }
    
    hideArchiveIndicator() {
        const indicator = document.getElementById('archive-indicator');
        if (indicator) {
            indicator.classList.remove('translate-y-0');
            indicator.classList.add('-translate-y-full');
            indicator.classList.remove('active');
        }
    }
    
    setupSortable() {
        if (!this.cardGrid || typeof Sortable === 'undefined') return;
        
        // 销毁之前的实例
        if (this.sortableInstance) {
            this.sortableInstance.destroy();
        }
        
        // 创建归档区域指示器
        this.createArchiveIndicator();
        
        this.sortableInstance = new Sortable(this.cardGrid, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            handle: '.card-grab-handle',
            onStart: (evt) => {
                document.querySelectorAll('.edit-card-btn').forEach(btn => {
                    btn.style.display = 'none';
                });
                // 显示归档区域指示器
                this.showArchiveIndicator();
                this.draggedItemId = evt.item.dataset.id;
            },
            onMove: (evt) => {
                // 检测是否拖到了屏幕上方（距离顶部小于 80px）
                const mouseY = evt.originalEvent.clientY;
                const archiveIndicator = document.getElementById('archive-indicator');
                
                if (mouseY < 80) {
                    archiveIndicator.classList.add('active');
                } else {
                    archiveIndicator.classList.remove('active');
                }
                
                return true; // 允许移动
            },                onEnd: async (evt) => {
                document.querySelectorAll('.edit-card-btn').forEach(btn => {
                    btn.style.display = '';
                });
                
                // 隐藏归档区域指示器
                this.hideArchiveIndicator();
                
                // 判断是否要归档（鼠标释放位置是否在屏幕上方）
                const mouseY = evt.originalEvent.clientY;
                if (mouseY < 80 && this.draggedItemId) {
                    // 归档该项目
                    const itemIndex = this.items.findIndex(item => item.id == this.draggedItemId);
                    if (itemIndex !== -1) {
                        const item = this.items[itemIndex];
                        try {
                            await apiService.updateItemArchiveStatus(item.id, true);
                            NotificationService.success('已将 ' + item.title + ' 归档');
                            
                            // 从本地数据中移除
                            this.items.splice(itemIndex, 1);
                            
                            // 从DOM中移除
                            const cardElement = this.cardGrid.querySelector(`.card-container[data-id="${item.id}"]`);
                            if (cardElement) {
                                // 添加淡出动画
                                cardElement.classList.add('fade-out');
                                // 等待动画完成后移除元素
                                setTimeout(() => {
                                    cardElement.remove();
                                    // 检查是否已经没有卡片了
                                    if (this.items.length === 0) {
                                        this.showEmptyState();
                                    }
                                }, 300);
                            }
                        } catch (error) {
                            console.error('归档失败:', error);
                        }
                    }
                } else if (evt.oldIndex !== evt.newIndex) {
                    // 正常的排序变动
                    const movedItem = this.items.splice(evt.oldIndex, 1)[0];
                    this.items.splice(evt.newIndex, 0, movedItem);
                    await this.updateSortOrder();
                }
                
                this.draggedItemId = null;
            }
        });
    }

    async updateSortOrder() {
        try {
            const items = this.items.map((item, index) => ({
                id: item.id,
                sort_order: index + 1
            }));
            
            await apiService.reorderItems(items);
            NotificationService.success('排序已保存');
        } catch (error) {
            console.error('更新排序失败:', error);
            NotificationService.error('排序保存失败');
            await this.loadItems();
        }
    }

    updateCardElement(item) {
        if (!this.cardGrid) return;
        
        // 查找对应卡片的DOM元素
        const cardElement = this.cardGrid.querySelector(`.card-container[data-id="${item.id}"]`);
        if (!cardElement) return;
        
        // 更新卡片内容
        const titleElement = cardElement.querySelector('h3');
        const descriptionElement = cardElement.querySelector('p');
        const iconElement = cardElement.querySelector('.flex-shrink-0 i');
        const linkElement = cardElement.querySelector('a');
        
        if (titleElement) titleElement.textContent = item.title;
        if (descriptionElement) descriptionElement.textContent = item.description;
        if (iconElement) {
            iconElement.className = '';
            iconElement.className = `${item.icon || 'fas fa-link'} w-8 h-8`;
        }
        if (linkElement) linkElement.href = item.url;
    }
}

// 创建全局导航服务实例
window.navigationService = new NavigationService();
