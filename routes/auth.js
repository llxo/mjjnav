const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db } = require('../db/init');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('错误: 未设置JWT_SECRET环境变量，请在.env文件中设置此变量');
  process.exit(1);
}

// 用户登录
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }

    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    try {
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: '密码错误' });
      }

      const token = jwt.sign(
        { userId: user.id, username: user.username, isAdmin: user.is_admin },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ token, user: { id: user.id, username: user.username, isAdmin: user.is_admin } });
    } catch (error) {
      res.status(500).json({ error: '登录失败' });
    }
  });
});

// 用户注册
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)',
      [username, hashedPassword, 0],
      function(err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT') {
            return res.status(400).json({ error: '用户名已存在' });
          }
          return res.status(500).json({ error: '数据库错误' });
        }

        res.status(201).json({ message: '用户注册成功', userId: this.lastID });
      }
    );
  } catch (error) {
    res.status(500).json({ error: '注册失败' });
  }
});

module.exports = router;
