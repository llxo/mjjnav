// 加载环境变量
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { db, initDatabase } = require('./db/init');

const app = express();
const PORT = process.env.PORT || 721;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 路由
const authRoutes = require('./routes/auth');
const itemsRoutes = require('./routes/items');
const countdownRoutes = require('./routes/countdown');
const secretRoutes = require('./routes/secret');

app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/countdown', countdownRoutes);
app.use('/api/secret', secretRoutes);

// 首页路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 归档页面路由
app.get('/archive', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'archive.html'));
});

// 密钥管理页面路由
app.get('/secret', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'secret.html'));
});

// 验证必要的环境变量
function validateEnvironment() {
  if (!process.env.JWT_SECRET) {
    console.error('错误: JWT_SECRET环境变量未设置');
    console.error('请创建.env文件并设置JWT_SECRET，可参考.env.example文件');
    return false;
  }
  return true;
}

// 启动服务器
async function startServer() {
  try {
    // 验证环境变量
    if (!validateEnvironment()) {
      process.exit(1);
    }
    
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
  }
}

startServer();
