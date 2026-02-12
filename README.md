# 🛍️ XYVN 电商系统

一个功能完整的现代化电商平台，包含用户端官网和管理员后台。

## ✨ 特性

- 🔐 完整的用户认证系统（注册/登录/权限管理）
- 🛒 购物车系统（数据库持久化，跨设备同步）
- 📦 商品管理（CRUD、分类、库存、状态管理）
- 📋 订单管理（创建、查看、状态更新）
- 💬 用户反馈系统
- 📧 邮件订阅系统
- 👨‍💼 强大的管理后台
- 🎨 精美的响应式UI设计
- 🔒 安全的JWT认证 + Cookie会话

## 🚀 一键启动

### macOS / Linux

```bash
./start.sh
```

### Windows

```bash
start.bat
```

### 或使用 npm

```bash
npm start
```

## 📍 访问地址

启动后访问：

- **官网**: http://localhost:3001
- **管理后台**: http://localhost:3001/admin

### 默认管理员账户

```
邮箱: admin@xyvn.com
密码: admin123
```

## 🛠️ 技术栈

### 前端
- React 19 + TypeScript
- React Router 7
- CSS Modules

### 后端
- Node.js + Express
- MySQL
- JWT + bcrypt

## 📦 手动安装（可选）

如果一键启动失败，可以手动执行：

```bash
# 1. 安装依赖
npm install
cd client && npm install && cd ..

# 2. 配置环境变量（已配置好）
# 查看 .env 和 client/.env 文件

# 3. 初始化数据库
node server/init-database.js

# 4. 启动服务
npm run dev
```

## 🔧 端口配置

- **后端**: 5002
- **前端**: 3001

可以在 `.env` 和 `client/.env` 文件中修改。

## 📊 功能模块

### 用户端
- ✅ 商品浏览（分类、排序、筛选）
- ✅ 商品详情
- ✅ 购物车管理
- ✅ 多步骤结账流程
- ✅ 用户注册/登录
- ✅ 用户反馈
- ✅ 邮件订阅

### 管理端
- ✅ 仪表板统计
- ✅ 用户管理
- ✅ 商品管理（CRUD）
- ✅ 订单管理
- ✅ 反馈管理
- ✅ 订阅管理

## 🧪 测试

```bash
# 测试反馈和订阅系统
node test-feedback-system.js

# 测试新API
node test-new-apis.js
```

## 📚 文档

- `QUICK_START.md` - 快速启动指南
- `FINAL_SYSTEM_REPORT.md` - 完整系统报告
- `IMPROVEMENTS_SUMMARY.md` - 改进总结
- `SYSTEM_REVIEW_COMPLETE.md` - 系统Review报告

## 🗄️ 数据库

系统使用 MySQL 数据库，包含以下表：

- `users` - 用户表
- `products` - 商品表
- `orders` - 订单表
- `order_items` - 订单项表
- `cart_items` - 购物车表
- `feedback` - 反馈表
- `newsletter_subscribers` - 订阅表

数据库会在首次启动时自动初始化。

## 🔐 安全性

- ✅ 密码哈希存储（bcrypt）
- ✅ JWT Token认证
- ✅ HttpOnly Cookie（防XSS）
- ✅ SameSite Cookie（防CSRF）
- ✅ SQL注入防护（参数化查询）
- ✅ CORS配置

## 📝 环境变量

### 后端 (.env)
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=shop_dev
DB_PASSWORD=
DB_NAME=shop
PORT=5002
JWT_SECRET=xyvn_shop_secret_key_2026
```

### 前端 (client/.env)
```env
PORT=3001
REACT_APP_API_URL=http://localhost:5002
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT

---

**开发状态**: ✅ 完成并可用  
**版本**: 1.0.0  
**最后更新**: 2026-02-11
