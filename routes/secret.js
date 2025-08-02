const express = require('express');
const { hasSecretKey, setSecretKey, verifySecretKey, generateSessionToken, requireAuth, validateSessionToken } = require('../middleware/auth');

const router = express.Router();

// 检查是否已设置密钥
router.get('/check', async (req, res) => {
  try {
    const exists = await hasSecretKey();
    res.json({ hasSecretKey: exists });
  } catch (error) {
    console.error('检查密钥失败:', error);
    res.status(500).json({ error: '检查密钥失败' });
  }
});

// 设置新密钥（仅在未设置时允许）
router.post('/setup', async (req, res) => {
  try {
    const { secretKey } = req.body;
    
    if (!secretKey || secretKey.length < 6) {
      return res.status(400).json({ error: '密钥长度不能少于6位' });
    }
    
    // 检查是否已经设置过密钥
    const exists = await hasSecretKey();
    if (exists) {
      return res.status(400).json({ error: '密钥已经设置过了' });
    }
    
    await setSecretKey(secretKey);
    res.json({ message: '密钥设置成功' });
  } catch (error) {
    console.error('设置密钥失败:', error);
    res.status(500).json({ error: '设置密钥失败' });
  }
});

// 验证密钥
router.post('/verify', async (req, res) => {
  try {
    const { secretKey } = req.body;
    
    if (!secretKey) {
      return res.status(400).json({ error: '请提供密钥' });
    }
    
    const isValid = await verifySecretKey(secretKey);
      if (isValid) {
      // 生成会话token
      const managedToken = generateSessionToken();
      res.setHeader('x-session-token', managedToken);
      
      res.json({ 
        message: '密钥验证成功',
        authenticated: true 
      });
    } else {
      res.status(403).json({ error: '密钥无效' });
    }
  } catch (error) {
    console.error('验证密钥失败:', error);
    res.status(500).json({ error: '验证密钥失败' });
  }
});

// 更改密钥
router.post('/change', async (req, res) => {
  try {
    const { currentSecretKey, newSecretKey } = req.body;
    
    if (!currentSecretKey || !newSecretKey) {
      return res.status(400).json({ error: '请提供当前密钥和新密钥' });
    }
    
    if (newSecretKey.length < 6) {
      return res.status(400).json({ error: '新密钥长度不能少于6位' });
    }
    
    // 验证当前密钥
    const isValid = await verifySecretKey(currentSecretKey);
    if (!isValid) {
      return res.status(403).json({ error: '当前密钥无效' });
    }
    
    // 更新密钥
    await setSecretKey(newSecretKey);
    
    // 生成新的会话token
    const managedToken = generateSessionToken();
    res.setHeader('x-session-token', managedToken);
    
    res.json({ message: '密钥更改成功' });
  } catch (error) {
    console.error('更改密钥失败:', error);
    res.status(500).json({ error: '更改密钥失败' });
  }
});

// 重置密钥（删除现有密钥）
router.post('/reset', async (req, res) => {  try {
    const { db } = require('../db/init');
    
    // 删除密钥记录
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM secret_keys', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    res.json({ message: '密钥已重置' });
  } catch (error) {
    console.error('重置密钥失败:', error);
    res.status(500).json({ error: '重置密钥失败' });
  }
});

module.exports = router;
