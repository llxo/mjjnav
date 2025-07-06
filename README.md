# 服务器导航 🚀

一个基于 Node.js + SQLite 的现代化服务器导航页面，支持书签管理、倒计时功能和用户身份验证。

## ✨ 特性

- 🔐 **用户身份验证** - 支持用户注册、登录和权限管理
- 📱 **响应式设计** - 完美适配桌面和移动设备
- 🌙 **深色模式** - 支持明暗主题切换
- 📚 **书签管理** - 添加、编辑、删除和排序书签
- 🎯 **拖拽排序** - 支持书签拖拽重新排序
- ⏰ **倒计时功能** - 设置和管理重要事件倒计时
- 🎨 **现代化UI** - 使用 Tailwind CSS 构建的美观界面
- 💾 **数据持久化** - 使用 SQLite 数据库存储数据
- 🐳 **Docker支持** - 提供完整的 Docker 部署方案

## 🛠️ 技术栈

### 后端
- **Node.js** - JavaScript 运行时
- **Express** - Web 框架
- **SQLite3** - 轻量级数据库
- **bcrypt** - 密码加密
- **jsonwebtoken** - JWT 身份验证
- **cors** - 跨域资源共享

### 前端
- **HTML5** - 标记语言
- **Tailwind CSS** - 样式框架
- **Vanilla JavaScript** - 原生 JavaScript
- **Font Awesome** - 图标库
- **SortableJS** - 拖拽排序

## 🚀 快速开始

### 环境要求

- Node.js 18.0+
- npm 8.0+
- 或 Docker 环境

### 本地开发

1. **克隆仓库**
   ```bash
   git clone <repository-url>
   cd nav
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

4. **访问应用**
   ```
   http://localhost:3000
   ```

### 生产部署

1. **启动生产服务器**
   ```bash
   npm start
   ```

### Docker 部署

#### 使用 Docker Compose（推荐）

```bash
# 构建并启动容器
npm run docker:up

# 查看日志
npm run docker:logs

# 停止服务
npm run docker:down
```

#### 使用 Docker 命令

```bash
# 构建镜像
npm run docker:build

# 运行容器
npm run docker:run
```

## 📁 项目结构

```
nav/
├── server.js                 # 主服务器文件
├── package.json              # 项目依赖配置
├── Dockerfile               # Docker 配置
├── docker-compose.yml       # Docker Compose 配置
├── db/
│   └── init.js              # 数据库初始化
├── middleware/
│   └── auth.js              # 身份验证中间件
├── routes/
│   ├── auth.js              # 用户认证路由
│   ├── items.js             # 书签管理路由
│   └── countdown.js         # 倒计时路由
├── public/
│   ├── index.html           # 主页面
│   ├── modals.html          # 弹窗模板
│   ├── css/
│   │   └── main.css         # 自定义样式
│   └── js/
│       ├── app.js           # 主应用逻辑
│       ├── api.js           # API 接口
│       ├── navigation.js    # 导航功能
│       ├── countdown.js     # 倒计时功能
│       ├── theme.js         # 主题切换
│       └── utils.js         # 工具函数
└── data/
    └── navigation.db        # SQLite 数据库文件
```

## 🔧 配置说明

### 环境变量

| 变量名 | 默认值 | 描述 |
|--------|--------|------|
| `PORT` | `3000` | 服务器端口 |
| `NODE_ENV` | `development` | 运行环境 |

### 数据库配置

项目使用 SQLite 数据库，数据库文件位于 `data/navigation.db`。首次启动时会自动创建数据库和必要的表结构。

## 📚 API 接口

### 用户认证

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/profile` - 获取用户信息

### 书签管理

- `GET /api/items` - 获取书签列表
- `POST /api/items` - 添加书签
- `PUT /api/items/:id` - 更新书签
- `DELETE /api/items/:id` - 删除书签
- `PUT /api/items/reorder` - 重新排序书签

### 倒计时管理

- `GET /api/countdown` - 获取倒计时列表
- `POST /api/countdown` - 添加倒计时
- `PUT /api/countdown/:id` - 更新倒计时
- `DELETE /api/countdown/:id` - 删除倒计时

## 🎨 界面特性

### 主题切换
- 支持明暗主题自动切换
- 主题设置会自动保存到本地存储

### 响应式设计
- 移动端优先的响应式布局
- 支持各种屏幕尺寸和设备

### 拖拽排序
- 支持书签项目拖拽重新排序
- 实时保存排序结果

## 🚀 脚本命令

```bash
# 开发命令
npm run dev          # 启动开发服务器（nodemon）
npm start            # 启动生产服务器
npm test             # 运行测试（待实现）

# Docker 命令
npm run docker:build # 构建 Docker 镜像
npm run docker:run   # 运行 Docker 容器
npm run docker:up    # 启动 Docker Compose
npm run docker:down  # 停止 Docker Compose
npm run docker:logs  # 查看 Docker 日志
```

## 🔒 安全特性

- 密码使用 bcrypt 加密存储
- JWT Token 身份验证
- 防止 SQL 注入攻击
- CORS 跨域保护

## 📦 部署建议

### 生产环境

1. **使用 PM2 进程管理**
   ```bash
   npm install -g pm2
   pm2 start server.js --name nav-server
   ```

2. **配置 Nginx 反向代理**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

3. **SSL 证书配置**
   - 使用 Let's Encrypt 获取免费 SSL 证书
   - 配置 HTTPS 重定向

### Docker 生产部署

```bash
# 使用 Docker Compose 部署
docker-compose up -d

# 配置数据卷备份
docker run --rm -v nav_data:/data -v $(pwd):/backup alpine tar czf /backup/backup.tar.gz /data
```

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持

如果您遇到任何问题或有建议，请通过以下方式联系：

- 创建 [Issue](../../issues)
- 提交 [Pull Request](../../pulls)

## 🎉 致谢

感谢所有贡献者和开源项目：

- [Express](https://expressjs.com/) - Web 框架
- [SQLite](https://www.sqlite.org/) - 数据库
- [Tailwind CSS](https://tailwindcss.com/) - 样式框架
- [Font Awesome](https://fontawesome.com/) - 图标库
- [SortableJS](https://sortablejs.github.io/Sortable/) - 拖拽排序

---

⭐ 如果这个项目对您有帮助，请给个 Star！
