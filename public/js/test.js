// 测试重构后的功能
console.log('开始测试重构后的功能...');

// 测试API服务
if (typeof apiService !== 'undefined') {
    console.log('✓ API服务加载成功');
} else {
    console.error('✗ API服务加载失败');
}

// 测试通知服务
if (typeof NotificationService !== 'undefined') {
    console.log('✓ 通知服务加载成功');
    // 测试通知
    setTimeout(() => {
        NotificationService.success('重构测试成功！');
    }, 1000);
} else {
    console.error('✗ 通知服务加载失败');
}

// 测试工具函数
if (typeof Utils !== 'undefined') {
    console.log('✓ 工具函数加载成功');
    // 测试HTML转义
    const testHTML = Utils.escapeHtml('<script>alert("test")</script>');
    if (testHTML.includes('&lt;script&gt;')) {
        console.log('✓ HTML转义功能正常');
    } else {
        console.error('✗ HTML转义功能异常');
    }
} else {
    console.error('✗ 工具函数加载失败');
}

// 测试主题服务
if (typeof themeService !== 'undefined') {
    console.log('✓ 主题服务加载成功');
} else {
    console.error('✗ 主题服务加载失败');
}

// 测试导航服务
if (typeof navigationService !== 'undefined') {
    console.log('✓ 导航服务加载成功');
} else {
    console.error('✗ 导航服务加载失败');
}

// 测试倒计时服务
if (typeof countdownService !== 'undefined') {
    console.log('✓ 倒计时服务加载成功');
} else {
    console.error('✗ 倒计时服务加载失败');
}

// 测试主应用
if (typeof app !== 'undefined') {
    console.log('✓ 主应用加载成功');
} else {
    console.error('✗ 主应用加载失败');
}

console.log('测试完成！');
