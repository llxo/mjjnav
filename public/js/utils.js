// 工具函数
class Utils {
    // HTML转义
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 日期格式化
    static formatDate(date) {
        return new Date(date).toLocaleString('zh-CN');
    }

    // 获取本地时区的日期时间字符串（用于datetime-local输入）
    static getLocalDateTimeString(date) {
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }    // 计算时间差
    static getTimeDifference(targetDate) {
        const now = new Date();
        const target = new Date(targetDate);
        const diff = target.getTime() - now.getTime();
        
        if (diff <= 0) {
            return { expired: true, text: '已过期' };
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        let text;
        if (days > 0) {
            text = `${days}天`;
        } else {
            text = '不到1天';
        }
        
        return { expired: false, text, days };
    }

    // 防抖函数
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 节流函数
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// 添加到全局作用域
window.Utils = Utils;
