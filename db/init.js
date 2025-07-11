const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 创建数据库连接
const isDocker = process.env.NODE_ENV === 'production' || process.env.DOCKER_ENV;
const dbDir = isDocker ? '/app/data' : path.join(__dirname, '../data');
const dbPath = path.join(dbDir, 'navigation.db');

// 确保数据目录存在
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

// 初始化数据库表
function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 创建分类表
      db.run(`CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);      // 创建导航项表
      db.run(`CREATE TABLE IF NOT EXISTS navigation_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        description TEXT,
        category_id INTEGER,
        icon TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )`);

      // 添加 sort_order 字段（如果不存在）
      db.run(`ALTER TABLE navigation_items ADD COLUMN sort_order INTEGER DEFAULT 0`, (err) => {
        // 忽略字段已存在的错误
        if (err && !err.message.includes('duplicate column name')) {
          console.warn('添加 sort_order 字段时出现警告:', err.message);
        }
      });      // 创建倒计时事件表
      db.run(`CREATE TABLE IF NOT EXISTS countdown_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        target_date DATETIME NOT NULL,
        icon TEXT DEFAULT 'far fa-calendar-alt',
        is_active BOOLEAN DEFAULT 1,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);

      // 创建用户表
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        is_admin BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);

      // 创建密钥配置表
      db.run(`CREATE TABLE IF NOT EXISTS secret_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key_hash TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('数据库表初始化完成');
          resolve();
        }
      });
    });
  });
}

module.exports = { db, initDatabase };
