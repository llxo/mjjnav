const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { db } = require('../db/init');
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('错误: 未设置JWT_SECRET环境变量，请在.env文件中设置此变量');
  process.exit(1);
}

// 生成密钥的哈希值
function hashSecretKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// 验证密钥
async function verifySecretKey(key) {
  return new Promise((resolve, reject) => {
    const keyHash = hashSecretKey(key);
    db.get(
      'SELECT id FROM secret_keys WHERE key_hash = ? AND is_active = 1',
      [keyHash],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(!!row);
        }
      }
    );
  });
}

// 检查是否已设置密钥
async function hasSecretKey() {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id FROM secret_keys WHERE is_active = 1 LIMIT 1',
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(!!row);
        }
      }
    );
  });
}

// 设置新密钥
async function setSecretKey(key) {
  return new Promise((resolve, reject) => {
    const keyHash = hashSecretKey(key);
    db.serialize(() => {
      // 先禁用所有现有密钥
      db.run('UPDATE secret_keys SET is_active = 0', (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        // 插入新密钥
        db.run(
          'INSERT INTO secret_keys (key_hash, is_active) VALUES (?, 1)',
          [keyHash],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve(this.lastID);
            }
          }
        );
      });
    });
  });
}

// JWT 验证中间件
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '缺少访问令牌' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '令牌无效或已过期' });
    }
    req.user = user;
    next();
  });
}

// 管理员权限验证中间件
function requireAdmin(req, res, next) {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
}

// 密钥认证中间件
function authenticateSecretKey(req, res, next) {
  const secretKey = req.headers['x-secret-key'] || req.body.secretKey;
  
  if (!secretKey) {
    return res.status(401).json({ error: '缺少密钥' });
  }

  verifySecretKey(secretKey)
    .then(isValid => {
      if (!isValid) {
        return res.status(403).json({ error: '密钥无效' });
      }
      next();
    })
    .catch(err => {
      console.error('密钥验证失败:', err);
      res.status(500).json({ error: '密钥验证失败' });
    });
}

// 会话认证中间件（基于localStorage或内存存储）
function sessionAuthenticate(req, res, next) {
  // 首先检查是否已经设置了密钥
  hasSecretKey()
    .then(exists => {
      if (!exists) {
        // 如果没有设置密钥，允许通过（用于初始设置）
        return next();
      }
      
      // 检查请求头中的会话token
      const sessionToken = req.headers['x-session-token'];
      const secretKey = req.headers['x-secret-key'];
      
      if (sessionToken && isValidSessionToken(sessionToken)) {
        // 有效的会话token，允许通过
        next();
      } else if (secretKey) {
        // 验证密钥
        verifySecretKey(secretKey)
          .then(isValid => {
            if (isValid) {
              // 生成新的会话token
              const newSessionToken = generateSessionToken();
              res.setHeader('x-session-token', newSessionToken);
              next();
            } else {
              res.status(403).json({ error: '密钥无效' });
            }
          })
          .catch(err => {
            console.error('密钥验证失败:', err);
            res.status(500).json({ error: '密钥验证失败' });
          });
      } else {
        res.status(401).json({ error: '需要密钥认证' });
      }
    })
    .catch(err => {
      console.error('检查密钥设置失败:', err);
      res.status(500).json({ error: '认证检查失败' });
    });
}

// 简单的会话token管理
const sessionTokens = new Map();
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24小时

function generateSessionToken() {
  const token = crypto.randomBytes(32).toString('hex');
  sessionTokens.set(token, {
    createdAt: Date.now(),
    lastUsed: Date.now()
  });
  return token;
}

function isValidSessionToken(token) {
  const session = sessionTokens.get(token);
  if (!session) return false;
  
  const now = Date.now();
  if (now - session.createdAt > SESSION_TIMEOUT) {
    sessionTokens.delete(token);
    return false;
  }
  
  // 更新最后使用时间
  session.lastUsed = now;
  return true;
}

// 清理过期的会话token
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessionTokens.entries()) {
    if (now - session.createdAt > SESSION_TIMEOUT) {
      sessionTokens.delete(token);
    }
  }
}, 60 * 60 * 1000); // 每小时清理一次

module.exports = { 
  authenticateToken, 
  requireAdmin, 
  authenticateSecretKey,
  hasSecretKey,
  setSecretKey,
  verifySecretKey,
  sessionAuthenticate,
  generateSessionToken
};
