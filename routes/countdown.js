const express = require('express');
const { db } = require('../db/init');

const router = express.Router();

// 获取所有倒计时事件
router.get('/', (req, res) => {
  const query = `
    SELECT * FROM countdown_events 
    WHERE is_active = 1 
    ORDER BY sort_order ASC, created_at DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: '获取倒计时事件失败' });
    }
    res.json(rows);
  });
});

// 创建新倒计时事件
router.post('/', (req, res) => {
  const { title, description, target_date, icon } = req.body;

  if (!title || !target_date) {
    return res.status(400).json({ error: '标题和目标日期不能为空' });
  }

  // 验证日期格式
  const targetDateTime = new Date(target_date);
  if (isNaN(targetDateTime.getTime())) {
    return res.status(400).json({ error: '无效的日期格式' });
  }

  // 获取当前最大的排序值
  db.get('SELECT MAX(sort_order) as max_order FROM countdown_events', (err, result) => {
    if (err) {
      return res.status(500).json({ error: '获取排序信息失败' });
    }
    
    const nextOrder = (result.max_order || 0) + 1;
    
    db.run(
      'INSERT INTO countdown_events (title, description, target_date, icon, sort_order) VALUES (?, ?, ?, ?, ?)',
      [title, description, target_date, icon || 'far fa-calendar-alt', nextOrder],
      function(err) {
        if (err) {
          return res.status(500).json({ error: '创建倒计时事件失败' });
        }
        res.status(201).json({ message: '倒计时事件创建成功', id: this.lastID });
      }
    );
  });
});

// 更新排序
router.put('/reorder', (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: '无效的排序数据' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    let completed = 0;
    let hasError = false;
    
    items.forEach((item, index) => {
      if (hasError) return;
      
      db.run(
        'UPDATE countdown_events SET sort_order = ? WHERE id = ?',
        [item.sort_order, item.id],
        function(err) {
          if (err) {
            hasError = true;
            db.run('ROLLBACK');
            return res.status(500).json({ error: '更新排序失败' });
          }
          
          completed++;
          if (completed === items.length) {
            db.run('COMMIT');
            res.json({ message: '排序更新成功' });
          }
        }
      );
    });
  });
});

// 更新倒计时事件
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, target_date, icon } = req.body;

  if (!title || !target_date) {
    return res.status(400).json({ error: '标题和目标日期不能为空' });
  }

  // 验证日期格式
  const targetDateTime = new Date(target_date);
  if (isNaN(targetDateTime.getTime())) {
    return res.status(400).json({ error: '无效的日期格式' });
  }

  db.run(
    'UPDATE countdown_events SET title = ?, description = ?, target_date = ?, icon = ? WHERE id = ?',
    [title, description, target_date, icon || 'far fa-calendar-alt', id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '更新倒计时事件失败' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: '倒计时事件不存在' });
      }
      res.json({ message: '倒计时事件更新成功' });
    }
  );
});

// 删除倒计时事件
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.run('UPDATE countdown_events SET is_active = 0 WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: '删除倒计时事件失败' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: '倒计时事件不存在' });
    }
    res.json({ message: '倒计时事件删除成功' });
  });
});

// 切换倒计时事件状态
router.patch('/:id/toggle', (req, res) => {
  const { id } = req.params;

  db.get('SELECT is_active FROM countdown_events WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: '查询倒计时事件失败' });
    }
    if (!row) {
      return res.status(404).json({ error: '倒计时事件不存在' });
    }

    const newStatus = row.is_active ? 0 : 1;
    
    db.run('UPDATE countdown_events SET is_active = ? WHERE id = ?', [newStatus, id], function(err) {
      if (err) {
        return res.status(500).json({ error: '更新倒计时事件状态失败' });
      }
      res.json({ message: '倒计时事件状态更新成功', is_active: newStatus });
    });
  });
});

module.exports = router;
