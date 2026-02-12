# 本地数据库信息

## 📍 数据库位置

你的本地数据库已经存在并正在运行！

**位置**: `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/`

这是 Wrangler 在本地开发时自动创建的 SQLite 数据库，不需要部署到 Cloudflare 就可以使用。

## 👤 测试账号

### 管理员账号 (Admin)
- **邮箱**: `admin@example.com`
- **密码**: `admin123`
- **权限**: 管理员 (is_admin = 1)
- **用途**: 访问管理面板 `/admin`

### 普通用户账号
- **邮箱**: `test@example.com`
- **密码**: `password123`
- **权限**: 普通用户 (is_admin = 0)
- **用途**: 测试普通用户功能

## 📊 当前数据库内容

### 用户表 (users)
```
┌────┬───────────────────┬──────────┐
│ id │ email             │ is_admin │
├────┼───────────────────┼──────────┤
│ 1  │ test@example.com  │ 0        │
│ 2  │ admin@example.com │ 1        │
└────┴───────────────────┴──────────┘
```

### 产品表 (products)
- **总数**: 20 个产品
- **分类**: 
  - productivity (生产力工具) - 5 个
  - mobility (移动配件) - 5 个
  - sanctuary (家居装饰) - 5 个
  - savoriness (餐饮用品) - 5 个

## 🔍 查看数据库

### 方法 1: 使用 Wrangler 命令

```bash
cd workers

# 查看所有用户
wrangler d1 execute ecommerce-db-dev --local --command="SELECT * FROM users"

# 查看所有产品
wrangler d1 execute ecommerce-db-dev --local --command="SELECT id, name, category, price FROM products"

# 查看所有订单
wrangler d1 execute ecommerce-db-dev --local --command="SELECT * FROM orders"

# 查看购物车
wrangler d1 execute ecommerce-db-dev --local --command="SELECT * FROM cart_items"
```

### 方法 2: 使用 SQLite 客户端

```bash
# 安装 sqlite3 (如果还没安装)
# macOS: brew install sqlite
# Ubuntu: sudo apt-get install sqlite3

# 连接到数据库
cd workers
sqlite3 .wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite

# 在 SQLite shell 中
.tables                           # 查看所有表
.schema users                     # 查看用户表结构
SELECT * FROM users;              # 查询所有用户
SELECT * FROM products LIMIT 5;   # 查询前5个产品
.quit                             # 退出
```

## 🧪 测试管理员功能

### 1. 登录管理员账号

在浏览器中访问 http://localhost:3000

1. 点击登录
2. 输入邮箱: `admin@example.com`
3. 输入密码: `admin123`
4. 点击登录

### 2. 访问管理面板

登录后，访问: http://localhost:3000/admin

你应该能看到管理面板，包括：
- 产品管理
- 订单管理
- 用户管理
- 反馈管理

### 3. 使用 curl 测试

```bash
# 登录获取 token
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  -c cookies.txt

# 访问管理员 API
curl http://localhost:8787/api/admin/users \
  -b cookies.txt

curl http://localhost:8787/api/admin/orders \
  -b cookies.txt
```

## 🔧 管理数据库

### 创建新的管理员账号

```bash
# 1. 先注册一个新用户
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"newadmin@example.com","password":"password123"}'

# 2. 将用户设置为管理员
cd workers
wrangler d1 execute ecommerce-db-dev --local --command="UPDATE users SET is_admin = 1 WHERE email = 'newadmin@example.com'"
```

### 重置数据库

如果需要清空所有数据并重新开始：

```bash
cd workers

# 删除本地数据库
rm -rf .wrangler/state

# 重新初始化
wrangler d1 execute ecommerce-db-dev --local --file=./schema.sql
wrangler d1 execute ecommerce-db-dev --local --file=./seed.sql

# 重新创建管理员账号
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

wrangler d1 execute ecommerce-db-dev --local --command="UPDATE users SET is_admin = 1 WHERE email = 'admin@example.com'"
```

### 修改用户密码

如果忘记密码，可以直接在数据库中更新（需要先注册一个新账号获取密码哈希）：

```bash
# 1. 注册一个临时账号获取新密码的哈希
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"temp@example.com","password":"newpassword123"}'

# 2. 查看新密码的哈希
wrangler d1 execute ecommerce-db-dev --local --command="SELECT password_hash FROM users WHERE email = 'temp@example.com'"

# 3. 复制哈希值，更新目标用户的密码
wrangler d1 execute ecommerce-db-dev --local --command="UPDATE users SET password_hash = '复制的哈希值' WHERE email = 'admin@example.com'"

# 4. 删除临时账号
wrangler d1 execute ecommerce-db-dev --local --command="DELETE FROM users WHERE email = 'temp@example.com'"
```

## 📝 数据库表结构

本地数据库包含以下表：

1. **users** - 用户表
2. **products** - 产品表
3. **categories** - 分类表
4. **cart_items** - 购物车项目
5. **orders** - 订单表
6. **order_items** - 订单项目
7. **addresses** - 地址表
8. **payment_methods** - 支付方式表
9. **feedback** - 反馈表
10. **newsletter_subscribers** - 订阅者表

## 🚀 本地 vs Cloudflare

### 本地数据库 (当前)
- **位置**: `.wrangler/state/v3/d1/`
- **类型**: SQLite
- **用途**: 开发和测试
- **数据**: 仅在本地，不会同步到云端
- **访问**: 通过 `wrangler d1 execute ... --local`

### Cloudflare D1 (部署后)
- **位置**: Cloudflare 云端
- **类型**: D1 (基于 SQLite)
- **用途**: 生产环境
- **数据**: 存储在 Cloudflare 边缘网络
- **访问**: 通过 `wrangler d1 execute ... --remote`

**重要**: 本地数据库和 Cloudflare D1 是完全独立的！部署到 Cloudflare 后需要重新初始化数据库。

## ✅ 快速测试清单

- [x] 本地数据库已创建
- [x] 产品数据已导入 (20 个产品)
- [x] 管理员账号已创建 (admin@example.com / admin123)
- [x] 普通用户账号已创建 (test@example.com / password123)
- [ ] 在浏览器中测试登录
- [ ] 访问管理面板
- [ ] 测试创建订单
- [ ] 测试购物车功能

## 🔐 安全提示

1. **仅用于开发**: 这些测试账号仅用于本地开发
2. **不要在生产环境使用**: 部署到 Cloudflare 后，使用强密码创建新的管理员账号
3. **密码哈希**: 所有密码都使用 Web Crypto API 进行哈希处理
4. **JWT Secret**: 本地使用的 JWT_SECRET 在 `.dev.vars` 文件中，生产环境需要使用 `wrangler secret` 设置

---

**现在你可以使用管理员账号登录并测试所有功能了！** 🎉
