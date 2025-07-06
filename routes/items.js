const express = require('express');
const { db } = require('../db/init');
const { sessionAuthenticate } = require('../middleware/auth');

const router = express.Router();

// 获取所有导航项
router.get('/', (req, res) => {
  const query = `
    SELECT n.*, c.name as category_name 
    FROM navigation_items n 
    LEFT JOIN categories c ON n.category_id = c.id
    ORDER BY n.sort_order ASC, n.created_at DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: '获取导航项失败' });
    }
    res.json(rows);
  });
});

// 创建新导航项
router.post('/', sessionAuthenticate, (req, res) => {
  const { title, url, description, category_id, icon } = req.body;

  if (!title || !url) {
    return res.status(400).json({ error: '标题和URL不能为空' });
  }

  // 获取当前最大的排序值
  db.get('SELECT MAX(sort_order) as max_order FROM navigation_items', (err, result) => {
    if (err) {
      return res.status(500).json({ error: '获取排序信息失败' });
    }
    
    const nextOrder = (result.max_order || 0) + 1;
    
    db.run(
      'INSERT INTO navigation_items (title, url, description, category_id, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      [title, url, description, category_id, icon, nextOrder],
      function(err) {
        if (err) {
          return res.status(500).json({ error: '创建导航项失败' });
        }
        res.status(201).json({ message: '导航项创建成功', id: this.lastID });
      }
    );
  });
});

// 更新排序 (必须放在 /:id 路由之前)
router.put('/reorder', sessionAuthenticate, (req, res) => {
  const { items } = req.body; // 期望格式: [{ id: 1, sort_order: 1 }, { id: 2, sort_order: 2 }]

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: '无效的排序数据' });
  }

  // 使用事务确保数据一致性
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    let completed = 0;
    let hasError = false;
    
    items.forEach((item, index) => {
      if (hasError) return;
      
      db.run(
        'UPDATE navigation_items SET sort_order = ? WHERE id = ?',
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

// 更新导航项
router.put('/:id', sessionAuthenticate, (req, res) => {
  const { id } = req.params;
  const { title, url, description, category_id, icon } = req.body;

  if (!title || !url) {
    return res.status(400).json({ error: '标题和URL不能为空' });
  }

  db.run(
    'UPDATE navigation_items SET title = ?, url = ?, description = ?, category_id = ?, icon = ? WHERE id = ?',
    [title, url, description, category_id, icon, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '更新导航项失败' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: '导航项不存在' });
      }
      res.json({ message: '导航项更新成功' });
    }
  );
});

// 删除导航项
router.delete('/:id', sessionAuthenticate, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM navigation_items WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: '删除导航项失败' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: '导航项不存在' });
    }
    res.json({ message: '导航项删除成功' });
  });
});

module.exports = router;
