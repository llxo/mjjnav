// 归档页面管理服务
class ArchiveService {
    constructor() {
        this.items = [];
        this.selectedItem = null;
        
        // DOM 元素
        this.cardGrid = null;
        this.loadingIndicator = null;
        this.emptyState = null;
        this.contextMenu = null;
        this.unarchiveButton = null;
    }

    init() {
        this.initDOMElements();
        this.setupEventListeners();
        this.loadItems();
    }

    initDOMElements() {
        this.cardGrid = document.getElementById('card-grid');
        this.loadingIndicator = document.getElementById('loading-indicator');
        this.emptyState = document.getElementById('empty-state');
        this.contextMenu = document.getElementById('context-menu');
        this.unarchiveButton = document.getElementById('unarchive-item');
    }    setupEventListeners() {
        // 右键菜单事件 - 阻止所有默认右键菜单
        document.addEventListener('contextmenu', (e) => {
            // 总是阻止默认右键菜单
            e.preventDefault();
            
            // 检查是否点击了归档卡片
            const cardElement = e.target.closest('.archive-card');
            if (cardElement) {
                this.showContextMenu(e, cardElement);
            } else {
                // 在空白处右键时，如果没有打开任何模态框，则跳转到首页
                if (!e.target.closest('.modal') && !document.querySelector('.modal:not(.hidden)')) {
                    window.location.href = '/';
                }
            }
        });
        
        // 点击其他地方时隐藏右键菜单
        document.addEventListener('click', () => {
            this.hideContextMenu();
        });
        
        // 取消归档按钮事件
        if (this.unarchiveButton) {
            this.unarchiveButton.addEventListener('click', () => this.unarchiveItem());
        }
        
        // ESC键隐藏右键菜单
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideContextMenu();
            }
        });
    }

    async loadItems() {
        try {
            this.showLoading();
            this.items = await apiService.getItems(true); // 获取已归档的项目
            this.renderItems();
        } catch (error) {
            console.error('加载归档项失败:', error);
            this.showEmptyState();
        } finally {
            this.hideLoading();
        }
    }

    renderItems() {
        if (!this.cardGrid) return;
        
        if (this.items.length === 0) {
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
        const cards = this.cardGrid.querySelectorAll('.archive-card');
        cards.forEach((card, index) => {
            card.classList.add('fade-in', `fade-in-delay-${Math.min(index + 1, 6)}`);
        });
    }

    createCardElement(item) {
        const cardContainer = document.createElement('div');
        cardContainer.className = 'archive-card';
        cardContainer.dataset.id = item.id;
        
        cardContainer.innerHTML = `
            <a href="${item.url}" target="_blank" rel="noopener noreferrer"
               class="block bg-card-light dark:bg-card-dark rounded-lg shadow-sm hover:shadow-md dark:hover:shadow-gray-700/50 border border-transparent hover:border-primary-light/30 dark:hover:border-primary-dark/30 overflow-hidden transition-all">
                <div class="archive-card-content flex items-center space-x-3">
                    <div class="flex-shrink-0 text-primary-light dark:text-primary-dark">
                        <i class="${item.icon || 'fas fa-link'}"></i>
                    </div>
                    <div class="flex-1">
                        <h3 class="archive-card-title font-medium text-text-light dark:text-text-dark">
                            ${Utils.escapeHtml(item.title)}
                        </h3>
                        <p class="archive-card-description text-muted-light dark:text-muted-dark">
                            ${Utils.escapeHtml(item.description)}
                        </p>
                    </div>
                </div>
            </a>
        `;
        
        return cardContainer;
    }    showContextMenu(event, element) {
        if (!this.contextMenu) return;
        
        // 存储选中的项目
        const itemId = element.dataset.id;
        this.selectedItem = this.items.find(item => item.id == itemId);
        
        // 如果找不到对应项目，则不显示菜单
        if (!this.selectedItem) {
            console.warn('无法找到ID为 ' + itemId + ' 的归档项');
            return;
        }
        
        // 高亮显示选中的卡片
        document.querySelectorAll('.archive-card').forEach(card => {
            card.classList.remove('archive-card-selected');
        });
        element.classList.add('archive-card-selected');
        
        // 显示右键菜单
        this.contextMenu.style.display = 'block';
        
        // 计算位置，确保菜单在可视区域内
        const x = Math.min(event.clientX, window.innerWidth - this.contextMenu.offsetWidth);
        const y = Math.min(event.clientY, window.innerHeight - this.contextMenu.offsetHeight);
        
        this.contextMenu.style.left = `${x}px`;
        this.contextMenu.style.top = `${y}px`;
        this.contextMenu.classList.remove('hidden');
    }    hideContextMenu() {
        if (this.contextMenu) {
            this.contextMenu.classList.add('hidden');
            this.contextMenu.style.display = 'none'; // 确保完全隐藏
        }
        
        // 移除卡片选中状态
        document.querySelectorAll('.archive-card').forEach(card => {
            card.classList.remove('archive-card-selected');
        });
        
        // 在短暂延迟后清除选中项，以防止在处理点击事件时过早清除
        setTimeout(() => {
            this.selectedItem = null;
        }, 100);
    }async unarchiveItem() {
        if (!this.selectedItem) {
            NotificationService.error('未选择要取消归档的项目');
            return;
        }
        
        try {
            // 检查认证后再取消归档
            if (window.secretKeyManager) {
                window.secretKeyManager.checkAuthenticationForAction(async () => {
                    await this.doUnarchiveItem();
                });
            } else {
                await this.doUnarchiveItem();
            }
        } catch (error) {
            console.error('取消归档失败:', error);
            NotificationService.error('取消归档失败: ' + (error.message || '未知错误'));
        }
    }
      async doUnarchiveItem() {
        try {
            if (!this.selectedItem) {
                throw new Error('未选择要取消归档的项目');
            }
            
            const itemTitle = this.selectedItem.title || '项目'; // 防止 title 为 null 或 undefined
            await apiService.updateItemArchiveStatus(this.selectedItem.id, false);
            NotificationService.success('已将 ' + itemTitle + ' 取消归档');
            this.hideContextMenu();
            await this.loadItems();
        } catch (error) {
            console.error('取消归档错误详情:', error);
            NotificationService.error('取消归档失败: ' + (error.message || '未知错误'));
        }
    }

    showLoading() {
        if (this.loadingIndicator) this.loadingIndicator.classList.remove('hidden');
        if (this.cardGrid) this.cardGrid.classList.add('hidden');
        if (this.emptyState) this.emptyState.classList.add('hidden');
    }

    hideLoading() {
        if (this.loadingIndicator) this.loadingIndicator.classList.add('hidden');
        if (this.cardGrid) this.cardGrid.classList.remove('hidden');
    }

    showEmptyState() {
        if (this.emptyState) this.emptyState.classList.remove('hidden');
        if (this.cardGrid) this.cardGrid.classList.add('hidden');
    }

    hideEmptyState() {
        if (this.emptyState) this.emptyState.classList.add('hidden');
        if (this.cardGrid) this.cardGrid.classList.remove('hidden');
    }
}

// 初始化归档服务
document.addEventListener('DOMContentLoaded', () => {
    // 手动应用当前存储的主题设置（以防主题服务初始化失败）
    const isDark = localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    
    // 初始化主题服务
    if (window.themeService) {
        window.themeService.init();
    }
    
    // 监听存储变化，以便同步多个标签页之间的主题
    window.addEventListener('storage', (event) => {
        if (event.key === 'theme') {
            const isDark = event.newValue === 'dark';
            if (isDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    });
    
    // 初始化归档服务
    window.archiveService = new ArchiveService();
    window.archiveService.init();
});
