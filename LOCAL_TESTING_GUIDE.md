# 本地测试指南

在部署到 Cloudflare 之前，你可以在本地完整测试整个应用。

## 🚀 快速开始

### 1. 安装依赖

```bash
# 安装 Workers 依赖
cd workers
npm install

# 安装前端依赖
cd ../client
npm install

# 安装 Wrangler CLI（如果还没安装）
npm install -g wrangler
```

### 2. 创建本地数据库

Wrangler 会自动创建本地 SQLite 数据库用于开发。

```bash
cd workers

# 初始化本地数据库
wrangler d1 execute ecommerce-db-dev --local --file=./schema.sql

# 插入示例数据
wrangler d1 execute ecommerce-db-dev --local --file=./seed.sql
```

### 3. 设置本地环境变量

创建 `workers/.dev.vars` 文件：

```bash
cd workers
cat > .dev.vars << 'EOF'
JWT_SECRET=local-dev-secret-key-change-in-production
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8787
EOF
```

### 4. 启动 Workers API

```bash
cd workers
npm run dev
```

Workers API 将在 http://localhost:8787 运行

### 5. 启动前端（新终端）

```bash
cd client
npm start
```

前端将在 http://localhost:3000 运行

## 🧪 测试 API

### 使用 curl 测试

```bash
# 健康检查
curl http://localhost:8787/

# 获取产品列表
curl http://localhost:8787/api/products

# 获取分类
curl http://localhost:8787/api/categories

# 注册用户
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 登录
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt

# 获取当前用户（需要 cookie）
curl http://localhost:8787/api/auth/me \
  -b cookies.txt

# 获取购物车
curl http://localhost:8787/api/cart \
  -b cookies.txt
```

### 使用浏览器测试

1. 打开 http://localhost:3000
2. 注册新用户
3. 浏览产品
4. 添加到购物车
5. 创建订单

## 🔍 查看本地数据库

### 方法 1: 使用 Wrangler

```bash
cd workers

# 查询用户
wrangler d1 execute ecommerce-db-dev --local --command="SELECT * FROM users"

# 查询产品
wrangler d1 execute ecommerce-db-dev --local --command="SELECT * FROM products"

# 查询订单
wrangler d1 execute ecommerce-db-dev --local --command="SELECT * FROM orders"

# 查看表结构
wrangler d1 execute ecommerce-db-dev --local --command="SELECT name FROM sqlite_master WHERE type='table'"
```

### 方法 2: 使用 SQLite 客户端

本地数据库文件位于：`.wrangler/state/v3/d1/miniflare-D1DatabaseObject/`

```bash
# 安装 sqlite3（如果还没安装）
# macOS: brew install sqlite
# Ubuntu: sudo apt-get install sqlite3

# 连接到数据库
sqlite3 .wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite

# 在 SQLite shell 中
.tables                    # 查看所有表
SELECT * FROM products;    # 查询产品
.quit                      # 退出
```

## 🧪 运行测试

```bash
cd workers

# 运行所有测试
npm test

# 运行测试并监听变化
npm run test:watch

# 运行特定测试
npm test -- auth.password.test.ts
```

## 🐛 调试

### 查看 Workers 日志

Workers 的 console.log 会直接显示在终端中。

### 查看前端日志

打开浏览器开发者工具（F12）查看：
- Console: JavaScript 日志
- Network: API 请求和响应
- Application: Cookies 和存储

### 常见问题

#### 1. 数据库连接失败

**问题**: `Error: D1_ERROR: no such table: users`

**解决**:
```bash
cd workers
wrangler d1 execute ecommerce-db-dev --local --file=./schema.sql
```

#### 2. CORS 错误

**问题**: `Access to fetch at 'http://localhost:8787' from origin 'http://localhost:3000' has been blocked by CORS`

**解决**: 检查 `workers/.dev.vars` 中的 `ALLOWED_ORIGINS` 包含 `http://localhost:3000`

#### 3. JWT 错误

**问题**: `Unauthorized` 或 `Invalid token`

**解决**: 确保 `workers/.dev.vars` 中设置了 `JWT_SECRET`

#### 4. 端口被占用

**问题**: `Error: listen EADDRINUSE: address already in use :::8787`

**解决**:
```bash
# 查找占用端口的进程
lsof -i :8787

# 杀死进程
kill -9 <PID>

# 或使用不同端口
wrangler dev --port 8788
```

## 📊 测试场景

### 完整用户流程测试

1. **注册新用户**
   - 访问 http://localhost:3000
   - 点击注册
   - 填写邮箱和密码
   - 提交

2. **浏览产品**
   - 查看首页产品列表
   - 点击产品查看详情
   - 按分类筛选

3. **购物车操作**
   - 添加产品到购物车
   - 更新数量
   - 删除商品

4. **创建订单**
   - 进入购物车
   - 点击结账
   - 填写配送信息
   - 提交订单

5. **查看订单历史**
   - 进入用户中心
   - 查看订单列表
   - 查看订单详情

### 管理员功能测试

1. **创建管理员账户**
```bash
# 连接到本地数据库
wrangler d1 execute ecommerce-db-dev --local --command="UPDATE users SET is_admin = 1 WHERE email = 'test@example.com'"
```

2. **测试管理功能**
   - 登录管理员账户
   - 访问 /admin
   - 管理产品
   - 查看订单
   - 查看用户

## 🔄 重置本地数据

如果需要重新开始：

```bash
cd workers

# 删除本地数据库
rm -rf .wrangler/state

# 重新初始化
wrangler d1 execute ecommerce-db-dev --local --file=./schema.sql
wrangler d1 execute ecommerce-db-dev --local --file=./seed.sql
```

## 📝 开发工作流

### 推荐的开发流程

1. **启动开发服务器**
```bash
# 终端 1: Workers API
cd workers && npm run dev

# 终端 2: 前端
cd client && npm start
```

2. **修改代码**
   - Workers 代码修改会自动重载
   - 前端代码修改会自动刷新

3. **测试修改**
   - 在浏览器中测试功能
   - 查看终端日志
   - 运行自动化测试

4. **提交代码**
   - 确保所有测试通过
   - 提交到 Git

## 🎯 性能测试

### 使用 Apache Bench

```bash
# 安装 ab（如果需要）
# macOS: 已预装
# Ubuntu: sudo apt-get install apache2-utils

# 测试产品列表 API
ab -n 1000 -c 10 http://localhost:8787/api/products

# 测试注册 API
ab -n 100 -c 5 -p register.json -T application/json http://localhost:8787/api/auth/register
```

### 使用 wrk

```bash
# 安装 wrk
# macOS: brew install wrk
# Ubuntu: sudo apt-get install wrk

# 测试 API 性能
wrk -t4 -c100 -d30s http://localhost:8787/api/products
```

## 📱 移动端测试

### 在同一网络的移动设备上测试

1. **获取本机 IP**
```bash
# macOS
ipconfig getifaddr en0

# Linux
hostname -I | awk '{print $1}'
```

2. **更新 CORS 配置**
在 `workers/.dev.vars` 中添加你的 IP：
```
ALLOWED_ORIGINS=http://localhost:3000,http://192.168.1.100:3000
```

3. **在移动设备上访问**
```
http://192.168.1.100:3000
```

## ✅ 准备部署检查清单

在部署到 Cloudflare 之前，确保：

- [ ] 所有 API 端点正常工作
- [ ] 用户注册和登录功能正常
- [ ] 购物车功能正常
- [ ] 订单创建功能正常
- [ ] 管理员功能正常
- [ ] 前端正确连接到 API
- [ ] 没有 CORS 错误
- [ ] 没有控制台错误
- [ ] 所有测试通过

## 🚀 下一步

本地测试完成后，你可以：

1. 查看 `QUICK_START_CLOUDFLARE.md` 快速部署
2. 查看 `DEPLOYMENT_GUIDE.md` 详细部署步骤
3. 开始部署到 Cloudflare！

---

**祝测试顺利！** 🎉
