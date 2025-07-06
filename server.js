const express = require('express');
const cors = require('cors');
const path = require('path');
const { db, initDatabase } = require('./db/init');

const app = express();
const PORT = process.env.PORT || 3002;

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

// 启动服务器
async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
  }
}

startServer();
