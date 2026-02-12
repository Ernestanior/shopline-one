# 🚀 快速启动指南

## 📋 前置要求

- Node.js >= 14
- MySQL >= 5.7
- npm >= 6

## ⚡ 一键启动

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

脚本会自动：
1. ✅ 检查环境
2. ✅ 初始化数据库
3. ✅ 安装依赖
4. ✅ 启动后端（端口 5002）
5. ✅ 启动前端（端口 3001）

## 🎉 完成！

启动后访问：

- **官网**: http://localhost:3001
- **管理后台**: http://localhost:3001/admin

### 默认管理员账户
```
邮箱: admin@xyvn.com
密码: admin123
```

## 🧪 测试系统

运行测试脚本验证所有功能：

```bash
# 测试反馈和订阅系统
node test-feedback-system.js

# 测试新添加的API
node test-new-apis.js
```

## 🔧 端口配置

- **后端**: 5002
- **前端**: 3001

可以在以下文件中修改：
- 后端: `.env` 文件中的 `PORT`
- 前端: `client/.env` 文件中的 `PORT`

## 📚 更多信息

- 完整系统报告: `FINAL_SYSTEM_REPORT.md`
- 系统Review: `SYSTEM_REVIEW_COMPLETE.md`
- 反馈系统文档: `FEEDBACK_SYSTEM_COMPLETE.md`
- 改进总结: `IMPROVEMENTS_SUMMARY.md`

## 🔧 手动启动（可选）

如果一键启动失败，可以手动执行：

```bash
# 1. 初始化数据库
node server/init-database.js

# 2. 启动后端
npm run server

# 3. 启动前端（新终端）
cd client && npm start
```

## ❓ 常见问题

### 数据库连接失败？
确保MySQL服务正在运行，并且 `.env` 文件中的配置正确。

### 端口被占用？
修改 `.env` 和 `client/.env` 文件中的端口配置。

### 前端无法连接后端？
确保后端服务器正在运行在 `http://localhost:5002`

## 🎯 下一步

1. 浏览官网，查看商品
2. 注册账户或使用管理员账户登录
3. 添加商品到购物车
4. 完成结账流程
5. 访问管理后台查看订单

享受使用！🎉
