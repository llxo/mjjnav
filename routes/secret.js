const express = require('express');
const { hasSecretKey, setSecretKey, verifySecretKey, generateSessionToken } = require('../middleware/auth');

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

module.exports = router;
