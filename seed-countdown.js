const { db } = require('./db/init');

// 添加示例倒计时事件
const sampleCountdowns = [
    {
        title: '新年',
        description: '2025年新年倒计时',
        target_date: '2024-12-31 23:59:59',
        icon: 'fas fa-fireworks',
        sort_order: 1
    },
    {
        title: '春节',
        description: '2025年春节倒计时',
        target_date: '2025-01-29 00:00:00',
        icon: 'fas fa-dragon',
        sort_order: 2
    },
    {
        title: '项目截止日',
        description: '重要项目完成期限',
        target_date: '2025-08-15 18:00:00',
        icon: 'fas fa-flag-checkered',
        sort_order: 3
    }
];

console.log('开始插入示例倒计时数据...');

// 清空现有数据（可选）
db.run('DELETE FROM countdown_events', (err) => {
    if (err) {
        console.error('清空数据失败:', err);
        return;
    }
    
    console.log('已清空现有倒计时数据');
    
    // 插入示例数据
    let insertedCount = 0;
    sampleCountdowns.forEach(countdown => {
        db.run(
            'INSERT INTO countdown_events (title, description, target_date, icon, sort_order) VALUES (?, ?, ?, ?, ?)',
            [countdown.title, countdown.description, countdown.target_date, countdown.icon, countdown.sort_order],
            function(err) {
                if (err) {
                    console.error('插入数据失败:', err);
                } else {
                    console.log(`已插入倒计时: ${countdown.title}`);
                    insertedCount++;
                    
                    if (insertedCount === sampleCountdowns.length) {
                        console.log('所有示例倒计时数据插入完成！');
                        process.exit(0);
                    }
                }
            }
        );
    });
});
