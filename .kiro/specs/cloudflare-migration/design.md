# Design Document: Cloudflare Migration

## Overview

本设计文档描述了将现有 Node.js + Express + MySQL 电商应用迁移到 Cloudflare 边缘平台的技术方案。迁移将采用以下技术栈：

- **前端**: React + TypeScript → Cloudflare Pages
- **后端**: Express.js → Cloudflare Workers + Hono
- **数据库**: MySQL → Cloudflare D1 (SQLite)
- **文件存储**: 本地文件系统 → Cloudflare R2
- **认证**: JWT (bcrypt → Web Crypto API)

迁移的核心目标是利用 Cloudflare 的全球边缘网络，提供更快的响应速度和更好的可扩展性，同时保持所有现有功能完整性。

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Global Network                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  Cloudflare      │         │  Cloudflare      │          │
│  │  Pages           │────────▶│  Workers         │          │
│  │  (React SPA)     │   API   │  (Hono)          │          │
│  └──────────────────┘         └────────┬─────────┘          │
│                                         │                     │
│                          ┌──────────────┼──────────────┐     │
│                          │              │              │     │
│                          ▼              ▼              ▼     │
│                    ┌─────────┐   ┌─────────┐   ┌─────────┐ │
│                    │   D1    │   │   R2    │   │  KV     │ │
│                    │Database │   │ Storage │   │ Store   │ │
│                    └─────────┘   └─────────┘   └─────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **用户请求** → Cloudflare Pages (静态资源)
2. **API 调用** → Cloudflare Workers (业务逻辑)
3. **数据查询** → D1 Database (SQLite)
4. **文件访问** → R2 Storage (对象存储)
5. **会话管理** → HTTP-only Cookies + JWT

### Technology Mapping

| 现有技术 | 迁移目标 | 原因 |
|---------|---------|------|
| Express.js | Hono | 轻量级，专为 Workers 优化 |
| MySQL | D1 (SQLite) | 边缘数据库，低延迟 |
| bcrypt | Web Crypto API | Workers 兼容的密码哈希 |
| 本地文件系统 | R2 | 分布式对象存储 |
| Node.js 运行时 | Workers 运行时 | 边缘计算，全球分布 |

## Components and Interfaces

### 1. Frontend (Cloudflare Pages)

#### 1.1 Build Configuration

```typescript
// 构建输出目录
BUILD_OUTPUT: client/build

// 环境变量
REACT_APP_API_URL: https://api.yourdomain.com
REACT_APP_ENV: production
```

#### 1.2 API Client Configuration

前端将通过环境变量配置 API 端点：

```typescript
// src/config/api.ts
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

export const apiClient = {
  baseURL: API_BASE_URL,
  credentials: 'include', // 支持 cookies
  headers: {
    'Content-Type': 'application/json'
  }
};
```

#### 1.3 Routing Configuration

Pages 需要配置 SPA 回退规则：

```toml
# _redirects 文件
/api/*  https://api.yourdomain.com/:splat  200
/*      /index.html  200
```

### 2. Backend (Cloudflare Workers + Hono)

#### 2.1 Project Structure

```
workers/
├── src/
│   ├── index.ts              # Worker 入口
│   ├── routes/
│   │   ├── auth.ts           # 认证路由
│   │   ├── products.ts       # 产品路由
│   │   ├── cart.ts           # 购物车路由
│   │   ├── orders.ts         # 订单路由
│   │   ├── user.ts           # 用户资料路由
│   │   ├── admin.ts          # 管理员路由
│   │   └── upload.ts         # 文件上传路由
│   ├── middleware/
│   │   ├── auth.ts           # 认证中间件
│   │   ├── cors.ts           # CORS 中间件
│   │   ├── error.ts          # 错误处理中间件
│   │   └── rateLimit.ts      # 速率限制中间件
│   ├── services/
│   │   ├── auth.service.ts   # 认证服务
│   │   ├── db.service.ts     # 数据库服务
│   │   └── storage.service.ts # R2 存储服务
│   └── types/
│       └── env.ts            # 环境类型定义
├── wrangler.toml             # Workers 配置
└── package.json
```

#### 2.2 Hono Application Setup

```typescript
// src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import { authRoutes } from './routes/auth';
import { productRoutes } from './routes/products';
import { cartRoutes } from './routes/cart';
import { orderRoutes } from './routes/orders';
import { userRoutes } from './routes/user';
import { adminRoutes } from './routes/admin';
import { uploadRoutes } from './routes/upload';
import { errorHandler } from './middleware/error';

type Bindings = {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
  JWT_SECRET: string;
  ALLOWED_ORIGINS: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// 全局中间件
app.use('*', cors({
  origin: (origin) => {
    const allowed = c.env.ALLOWED_ORIGINS.split(',');
    return allowed.includes(origin) ? origin : null;
  },
  credentials: true
}));

// 路由
app.route('/api/auth', authRoutes);
app.route('/api/products', productRoutes);
app.route('/api/cart', cartRoutes);
app.route('/api/orders', orderRoutes);
app.route('/api/user', userRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/upload', uploadRoutes);

// 错误处理
app.onError(errorHandler);

export default app;
```

#### 2.3 Database Binding

Workers 通过绑定访问 D1：

```typescript
// 查询示例
const products = await c.env.DB
  .prepare('SELECT * FROM products WHERE category = ?')
  .bind(category)
  .all();
```

#### 2.4 R2 Storage Binding

Workers 通过绑定访问 R2：

```typescript
// 上传文件
await c.env.R2_BUCKET.put(key, file, {
  httpMetadata: {
    contentType: file.type
  }
});

// 生成公共 URL
const publicUrl = `https://r2.yourdomain.com/${key}`;
```

### 3. Authentication System

#### 3.1 Password Hashing (Web Crypto API)

替代 bcrypt，使用 Web Crypto API：

```typescript
// services/auth.service.ts
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  // 使用 PBKDF2 进行密码哈希
  const key = await crypto.subtle.importKey(
    'raw',
    data,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    key,
    256
  );
  
  // 组合 salt 和 hash
  const hashArray = new Uint8Array(derivedBits);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);
  
  // 转换为 base64
  return btoa(String.fromCharCode(...combined));
}

async function verifyPassword(
  password: string, 
  hashedPassword: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  // 解码存储的哈希
  const combined = Uint8Array.from(
    atob(hashedPassword), 
    c => c.charCodeAt(0)
  );
  
  const salt = combined.slice(0, 16);
  const storedHash = combined.slice(16);
  
  // 重新计算哈希
  const key = await crypto.subtle.importKey(
    'raw',
    data,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    key,
    256
  );
  
  const computedHash = new Uint8Array(derivedBits);
  
  // 比较哈希
  return storedHash.every((byte, i) => byte === computedHash[i]);
}
```

#### 3.2 JWT Token Management

```typescript
// services/auth.service.ts
import { sign, verify } from 'hono/jwt';

async function issueToken(
  user: { id: number; email: string; is_admin: number },
  secret: string
): Promise<string> {
  return await sign(
    {
      sub: String(user.id),
      email: user.email,
      is_admin: user.is_admin,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    },
    secret
  );
}

async function verifyToken(
  token: string,
  secret: string
): Promise<any> {
  try {
    return await verify(token, secret);
  } catch {
    return null;
  }
}
```

#### 3.3 Cookie Management

```typescript
// middleware/auth.ts
function setAuthCookie(c: Context, token: string) {
  c.header(
    'Set-Cookie',
    `shop_auth=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`
  );
}

function clearAuthCookie(c: Context) {
  c.header(
    'Set-Cookie',
    'shop_auth=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0'
  );
}
```

#### 3.4 Authentication Middleware

```typescript
// middleware/auth.ts
export async function authMiddleware(c: Context, next: Next) {
  const token = getCookie(c, 'shop_auth');
  
  if (!token) {
    c.set('user', null);
    return next();
  }
  
  const payload = await verifyToken(token, c.env.JWT_SECRET);
  
  if (payload) {
    c.set('user', {
      id: parseInt(payload.sub),
      email: payload.email,
      is_admin: payload.is_admin
    });
  } else {
    c.set('user', null);
  }
  
  return next();
}

export function requireAuth(c: Context, next: Next) {
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  return next();
}

export function requireAdmin(c: Context, next: Next) {
  const user = c.get('user');
  
  if (!user || !user.is_admin) {
    return c.json({ error: 'Forbidden' }, 403);
  }
  
  return next();
}
```

### 4. File Upload System

#### 4.1 R2 Upload Handler

```typescript
// routes/upload.ts
import { Hono } from 'hono';

const upload = new Hono<{ Bindings: Bindings }>();

upload.post('/product-image', async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('image') as File;
  
  if (!file) {
    return c.json({ error: 'No file uploaded' }, 400);
  }
  
  // 验证文件类型
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: 'Only image files are allowed' }, 400);
  }
  
  // 验证文件大小 (5MB)
  if (file.size > 5 * 1024 * 1024) {
    return c.json({ error: 'File size exceeds 5MB limit' }, 400);
  }
  
  // 生成唯一文件名
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const ext = file.name.split('.').pop();
  const key = `products/product-${timestamp}-${random}.${ext}`;
  
  // 上传到 R2
  await c.env.R2_BUCKET.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type
    }
  });
  
  // 返回公共 URL
  const publicUrl = `https://r2.yourdomain.com/${key}`;
  
  return c.json({
    success: true,
    path: publicUrl,
    filename: key
  });
});

export { upload as uploadRoutes };
```

#### 4.2 R2 Public Access Configuration

R2 存储桶需要配置公共访问域名：

```bash
# 使用 wrangler 配置自定义域名
wrangler r2 bucket domain add <BUCKET_NAME> --domain r2.yourdomain.com
```

## Data Models

### Database Schema Migration (MySQL → D1/SQLite)

#### 数据类型映射

| MySQL 类型 | SQLite 类型 | 说明 |
|-----------|------------|------|
| BIGINT UNSIGNED | INTEGER | SQLite 使用动态类型 |
| VARCHAR(n) | TEXT | SQLite TEXT 无长度限制 |
| DECIMAL(10,2) | REAL | 浮点数存储 |
| TIMESTAMP | TEXT | ISO 8601 格式字符串 |
| TINYINT(1) | INTEGER | 0 或 1 |
| TEXT | TEXT | 相同 |
| JSON | TEXT | 存储为 JSON 字符串 |

#### Schema Definitions

##### 1. users 表

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_admin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_admin ON users(is_admin);
```

##### 2. products 表

```sql
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price REAL NOT NULL,
  description TEXT,
  image TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  featured INTEGER NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_featured ON products(featured);
```

##### 3. orders 表

```sql
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  order_number TEXT NOT NULL UNIQUE,
  total_amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  payment_method TEXT,
  shipping_address TEXT,
  shipping_name TEXT,
  shipping_email TEXT,
  shipping_phone TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
```

##### 4. order_items 表

```sql
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  quantity INTEGER NOT NULL,
  price REAL NOT NULL,
  subtotal REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
```

##### 5. cart_items 表

```sql
CREATE TABLE IF NOT EXISTS cart_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
```

##### 6. user_profiles 表

```sql
CREATE TABLE IF NOT EXISTS user_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
```

##### 7. user_addresses 表

```sql
CREATE TABLE IF NOT EXISTS user_addresses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  label TEXT NOT NULL DEFAULT 'default',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  address1 TEXT NOT NULL,
  address2 TEXT,
  postal_code TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX idx_user_addresses_is_default ON user_addresses(is_default);
```

##### 8. user_payment_methods 表

```sql
CREATE TABLE IF NOT EXISTS user_payment_methods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  card_type TEXT NOT NULL,
  card_last4 TEXT NOT NULL,
  card_holder_name TEXT NOT NULL,
  expiry_month INTEGER NOT NULL,
  expiry_year INTEGER NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_payment_methods_user_id ON user_payment_methods(user_id);
CREATE INDEX idx_user_payment_methods_is_default ON user_payment_methods(is_default);
```

##### 9. feedback 表

```sql
CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_created_at ON feedback(created_at);
```

##### 10. newsletter_subscribers 表

```sql
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX idx_newsletter_subscribers_status ON newsletter_subscribers(status);
```

### Database Service Layer

```typescript
// services/db.service.ts
export class DatabaseService {
  constructor(private db: D1Database) {}
  
  // 通用查询方法
  async query<T>(sql: string, params: any[] = []): Promise<T[]> {
    const stmt = this.db.prepare(sql);
    const bound = params.length > 0 ? stmt.bind(...params) : stmt;
    const result = await bound.all();
    return result.results as T[];
  }
  
  async queryOne<T>(sql: string, params: any[] = []): Promise<T | null> {
    const results = await this.query<T>(sql, params);
    return results.length > 0 ? results[0] : null;
  }
  
  async execute(sql: string, params: any[] = []): Promise<D1Result> {
    const stmt = this.db.prepare(sql);
    const bound = params.length > 0 ? stmt.bind(...params) : stmt;
    return await bound.run();
  }
  
  // 事务支持
  async transaction(queries: Array<{ sql: string; params: any[] }>) {
    const statements = queries.map(q => 
      this.db.prepare(q.sql).bind(...q.params)
    );
    return await this.db.batch(statements);
  }
}
```


## API Routes Design

### Route Structure

所有 API 路由将保持与现有系统相同的端点结构，确保前端无需大规模修改：

#### Authentication Routes (`/api/auth`)

```typescript
POST   /api/auth/register      # 用户注册
POST   /api/auth/login         # 用户登录
POST   /api/auth/logout        # 用户登出
GET    /api/auth/me            # 获取当前用户信息
```

#### Product Routes (`/api/products`)

```typescript
GET    /api/products           # 获取产品列表 (支持 ?category= 筛选)
GET    /api/products/:id       # 获取产品详情
```

#### Cart Routes (`/api/cart`)

```typescript
GET    /api/cart               # 获取购物车
POST   /api/cart/items         # 添加商品到购物车
PUT    /api/cart/items/:id     # 更新购物车项数量
DELETE /api/cart/items/:id     # 删除购物车项
DELETE /api/cart               # 清空购物车
```

#### Order Routes (`/api/orders`)

```typescript
POST   /api/orders             # 创建订单
```

#### User Routes (`/api/user`)

```typescript
GET    /api/user/profile                    # 获取用户资料
PUT    /api/user/profile                    # 更新用户资料
GET    /api/user/addresses                  # 获取地址列表
POST   /api/user/addresses                  # 添加地址
PUT    /api/user/addresses/:id              # 更新地址
DELETE /api/user/addresses/:id              # 删除地址
GET    /api/user/payment-methods            # 获取支付方式列表
POST   /api/user/payment-methods            # 添加支付方式
DELETE /api/user/payment-methods/:id        # 删除支付方式
GET    /api/user/orders                     # 获取订单列表
GET    /api/user/orders/:id                 # 获取订单详情
PATCH  /api/user/orders/:id/payment         # 更新支付状态
DELETE /api/user/orders/:id                 # 删除订单
```

#### Admin Routes (`/api/admin`)

```typescript
GET    /api/admin/products                  # 获取所有产品
POST   /api/admin/products                  # 创建产品
PUT    /api/admin/products/:id              # 更新产品
DELETE /api/admin/products/:id              # 删除产品
GET    /api/admin/orders                    # 获取所有订单
GET    /api/admin/orders/:id                # 获取订单详情
PUT    /api/admin/orders/:id                # 更新订单状态
GET    /api/admin/users                     # 获取用户列表
GET    /api/admin/feedback                  # 获取反馈列表
```

#### Upload Routes (`/api/upload`)

```typescript
POST   /api/upload/product-image            # 上传产品图片
```

#### Public Routes (`/api`)

```typescript
POST   /api/contact                         # 提交反馈
POST   /api/newsletter/subscribe            # 订阅新闻通讯
GET    /api/categories                      # 获取分类列表
```

### Route Implementation Example

```typescript
// routes/products.ts
import { Hono } from 'hono';
import { DatabaseService } from '../services/db.service';

const products = new Hono<{ Bindings: Bindings }>();

// 获取产品列表
products.get('/', async (c) => {
  const category = c.req.query('category');
  const db = new DatabaseService(c.env.DB);
  
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params: any[] = [];
  
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  
  sql += ' ORDER BY featured DESC, created_at DESC';
  
  const products = await db.query(sql, params);
  return c.json(products);
});

// 获取产品详情
products.get('/:id', async (c) => {
  const id = c.req.param('id');
  const db = new DatabaseService(c.env.DB);
  
  const product = await db.queryOne(
    'SELECT * FROM products WHERE id = ?',
    [id]
  );
  
  if (!product) {
    return c.json({ error: 'Product not found' }, 404);
  }
  
  return c.json(product);
});

export { products as productRoutes };
```

## Middleware Design

### 1. CORS Middleware

```typescript
// middleware/cors.ts
import { cors } from 'hono/cors';

export function corsMiddleware(allowedOrigins: string) {
  const origins = allowedOrigins.split(',').map(o => o.trim());
  
  return cors({
    origin: (origin) => {
      // 开发环境允许 localhost
      if (origin && origin.match(/^https?:\/\/localhost(:\d+)?$/)) {
        return origin;
      }
      
      return origins.includes(origin) ? origin : null;
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400
  });
}
```

### 2. Error Handler Middleware

```typescript
// middleware/error.ts
import { Context } from 'hono';

export function errorHandler(err: Error, c: Context) {
  console.error('Error:', err);
  
  // 验证错误
  if (err.name === 'ValidationError') {
    return c.json({ error: err.message }, 400);
  }
  
  // 认证错误
  if (err.name === 'UnauthorizedError') {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  // 权限错误
  if (err.name === 'ForbiddenError') {
    return c.json({ error: 'Forbidden' }, 403);
  }
  
  // 未找到错误
  if (err.name === 'NotFoundError') {
    return c.json({ error: 'Not found' }, 404);
  }
  
  // 数据库错误
  if (err.message.includes('SQLITE')) {
    return c.json({ error: 'Database error' }, 500);
  }
  
  // 默认错误
  return c.json({ error: 'Internal server error' }, 500);
}
```

### 3. Rate Limiting Middleware

```typescript
// middleware/rateLimit.ts
import { Context, Next } from 'hono';

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

export function rateLimit(config: RateLimitConfig) {
  return async (c: Context, next: Next) => {
    // 使用 KV 存储速率限制数据
    const ip = c.req.header('CF-Connecting-IP') || 'unknown';
    const key = `ratelimit:${ip}`;
    
    // 注意：这需要 KV 绑定
    // 简化实现，实际应使用 KV 存储
    
    return next();
  };
}
```

### 4. Validation Middleware

```typescript
// middleware/validation.ts
import { Context, Next } from 'hono';
import { z } from 'zod';

export function validate(schema: z.ZodSchema) {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();
      const validated = schema.parse(body);
      c.set('validatedData', validated);
      return next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return c.json({ 
          error: 'Validation failed', 
          details: err.errors 
        }, 400);
      }
      throw err;
    }
  };
}

// 使用示例
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

app.post('/api/auth/register', validate(registerSchema), async (c) => {
  const data = c.get('validatedData');
  // ...
});
```

## Deployment Configuration

### 1. wrangler.toml

```toml
name = "ecommerce-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# D1 数据库绑定
[[d1_databases]]
binding = "DB"
database_name = "ecommerce-db"
database_id = "<DATABASE_ID>"

# R2 存储桶绑定
[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "ecommerce-uploads"

# 环境变量
[vars]
ALLOWED_ORIGINS = "https://yourdomain.com,https://www.yourdomain.com"

# 密钥（使用 wrangler secret put）
# JWT_SECRET = "..."

# 路由配置
[routes]
pattern = "api.yourdomain.com/*"
zone_name = "yourdomain.com"

# 开发环境配置
[env.development]
name = "ecommerce-api-dev"

[[env.development.d1_databases]]
binding = "DB"
database_name = "ecommerce-db-dev"
database_id = "<DEV_DATABASE_ID>"

[[env.development.r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "ecommerce-uploads-dev"

[env.development.vars]
ALLOWED_ORIGINS = "http://localhost:3000"
```

### 2. Cloudflare Pages Configuration

```yaml
# .github/workflows/deploy-pages.yml (如果使用 GitHub Actions)
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd client
          npm ci
      
      - name: Build
        run: |
          cd client
          npm run build
        env:
          REACT_APP_API_URL: https://api.yourdomain.com
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: ecommerce-frontend
          directory: client/build
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

### 3. Environment Variables

#### Workers 环境变量

```bash
# 设置密钥
wrangler secret put JWT_SECRET

# 设置普通环境变量（在 wrangler.toml 中）
ALLOWED_ORIGINS = "https://yourdomain.com"
```

#### Pages 环境变量

在 Cloudflare Dashboard 中配置：

```
REACT_APP_API_URL = https://api.yourdomain.com
REACT_APP_ENV = production
```

### 4. Database Initialization Script

```typescript
// scripts/init-d1.ts
import { readFileSync } from 'fs';

const schema = readFileSync('./schema.sql', 'utf-8');
const statements = schema.split(';').filter(s => s.trim());

// 使用 wrangler d1 execute 执行
// wrangler d1 execute <DATABASE_NAME> --file=schema.sql
```

### 5. Seed Data Script

```typescript
// scripts/seed-d1.ts
const sampleProducts = [
  {
    name: 'Minimalist Notebook',
    category: 'productivity',
    price: 29.99,
    description: 'Premium paper notebook',
    image: '/images/products/productivity/productivity-1.jpg',
    stock: 50,
    featured: 1
  },
  // ... 更多产品
];

// 生成 SQL 插入语句
const insertStatements = sampleProducts.map(p => `
  INSERT INTO products (name, category, price, description, image, stock, featured, status)
  VALUES ('${p.name}', '${p.category}', ${p.price}, '${p.description}', '${p.image}', ${p.stock}, ${p.featured}, 'available');
`).join('\n');

// 保存到 seed.sql 并执行
// wrangler d1 execute <DATABASE_NAME> --file=seed.sql
```

## Migration Strategy

### Phase 1: 准备阶段

1. **创建 Cloudflare 账户和项目**
   - 注册 Cloudflare 账户
   - 创建新的 Workers 项目
   - 创建 Pages 项目

2. **创建 D1 数据库**
   ```bash
   wrangler d1 create ecommerce-db
   ```

3. **创建 R2 存储桶**
   ```bash
   wrangler r2 bucket create ecommerce-uploads
   ```

4. **配置自定义域名**
   - Workers: api.yourdomain.com
   - Pages: yourdomain.com
   - R2: r2.yourdomain.com

### Phase 2: 数据库迁移

1. **执行 Schema 创建**
   ```bash
   wrangler d1 execute ecommerce-db --file=schema.sql
   ```

2. **数据迁移**
   - 从 MySQL 导出数据
   - 转换数据格式（处理日期、JSON 等）
   - 导入到 D1

3. **验证数据完整性**
   - 检查记录数量
   - 验证外键关系
   - 测试查询性能

### Phase 3: Workers API 开发

1. **设置项目结构**
   ```bash
   npm create cloudflare@latest
   # 选择 "Hello World" Worker
   # 选择 TypeScript
   ```

2. **实现核心功能**
   - 认证系统
   - 产品 API
   - 购物车 API
   - 订单 API

3. **本地测试**
   ```bash
   wrangler dev
   ```

4. **部署到开发环境**
   ```bash
   wrangler deploy --env development
   ```

### Phase 4: 文件迁移

1. **上传现有图片到 R2**
   ```bash
   # 使用 wrangler 或 rclone 批量上传
   wrangler r2 object put ecommerce-uploads/products/image.jpg --file=./image.jpg
   ```

2. **更新数据库中的图片路径**
   ```sql
   UPDATE products 
   SET image = REPLACE(image, '/images/', 'https://r2.yourdomain.com/')
   WHERE image LIKE '/images/%';
   ```

### Phase 5: 前端调整

1. **更新 API 配置**
   ```typescript
   // src/config/api.ts
   export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.yourdomain.com';
   ```

2. **测试前端功能**
   - 用户注册/登录
   - 产品浏览
   - 购物车操作
   - 订单创建

3. **构建和部署**
   ```bash
   cd client
   npm run build
   wrangler pages deploy build --project-name=ecommerce-frontend
   ```

### Phase 6: 测试和验证

1. **功能测试**
   - 所有 API 端点
   - 认证流程
   - 文件上传
   - 订单流程

2. **性能测试**
   - 响应时间
   - 并发处理
   - 数据库查询性能

3. **安全测试**
   - CORS 配置
   - 认证验证
   - 输入验证
   - SQL 注入防护

### Phase 7: 上线和监控

1. **DNS 切换**
   - 更新 DNS 记录指向 Cloudflare
   - 配置 SSL/TLS

2. **监控设置**
   - Cloudflare Analytics
   - Workers 日志
   - 错误追踪

3. **回滚计划**
   - 保留旧系统作为备份
   - 准备快速回滚步骤

## Correctness Properties

*属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的正式声明。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

在进行正确性属性分析之前，我需要使用 prework 工具分析需求文档中的验收标准：


### Property Reflection

在生成正确性属性之前，我需要审查 prework 中识别的所有可测试属性，消除冗余：

**冗余分析**:

1. **密码哈希属性** (2.4, 5.2): 这两个属性都测试密码哈希功能，可以合并为一个 round-trip 属性
2. **JWT 验证属性** (2.3, 5.1, 5.3, 5.5): 这些属性都涉及 JWT 认证，可以合并为几个核心属性
3. **数据库 CRUD 属性**: 多个需求都涉及基本的 CRUD 操作，可以提取通用模式
4. **文件上传属性** (3.2, 3.3, 3.4, 8.7): 这些属性都涉及 R2 文件操作，可以合并

**保留的核心属性**:
- Schema 迁移正确性
- 数据类型转换正确性
- 密码哈希 round-trip
- JWT 认证流程
- API 端点兼容性
- 文件上传 round-trip
- CRUD 操作正确性
- 权限检查正确性
- 错误处理正确性
- 输入验证正确性

### Correctness Properties

基于 prework 分析和冗余消除，以下是核心正确性属性：

#### Property 1: Schema Migration Completeness
*For any* MySQL 数据库 schema，迁移到 D1 后，所有表、索引和外键约束都应该存在且结构正确
**Validates: Requirements 1.1, 1.3**

#### Property 2: Data Type Conversion Correctness
*For any* MySQL 数据类型，转换为 SQLite 数据类型后，应该能够存储和检索相同的数据值
**Validates: Requirements 1.2**

#### Property 3: Password Hash Round-Trip
*For any* 密码字符串，使用 Web Crypto API 哈希后，应该能够成功验证原始密码
**Validates: Requirements 2.4, 5.2**

#### Property 4: JWT Authentication Flow
*For any* 有效用户，登录后获得的 JWT token 应该能够通过验证并访问受保护的端点
**Validates: Requirements 2.3, 5.1, 5.3, 5.5**

#### Property 5: API Endpoint Compatibility
*For any* 现有 API 端点，新系统应该返回相同结构的响应数据
**Validates: Requirements 2.2**


#### Property 6: File Upload Round-Trip
*For any* 有效图片文件，上传到 R2 后，应该能够通过生成的 URL 访问并获取相同的文件内容
**Validates: Requirements 3.2, 3.3, 3.4**

#### Property 7: File Upload Validation
*For any* 无效文件（错误类型或超过大小限制），上传请求应该被拒绝并返回适当的错误消息
**Validates: Requirements 3.5**

#### Property 8: Cart Item Persistence
*For any* 购物车操作（添加、更新、删除），操作后查询购物车应该反映正确的状态
**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

#### Property 9: Order Creation Completeness
*For any* 有效订单数据，创建订单后，数据库应该包含订单记录和所有订单项
**Validates: Requirements 7.1**

#### Property 10: Product CRUD Operations
*For any* 产品数据，执行创建、读取、更新、删除操作后，数据库状态应该正确反映操作结果
**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**

#### Property 11: User Profile CRUD Operations
*For any* 用户资料数据，执行创建、读取、更新、删除操作后，数据库状态应该正确反映操作结果
**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

#### Property 12: Default Flag Uniqueness
*For any* 用户，设置默认地址或支付方式后，该用户应该只有一个项被标记为默认
**Validates: Requirements 9.5**

#### Property 13: Admin Permission Enforcement
*For any* 管理员端点，普通用户访问应该被拒绝，管理员访问应该被允许
**Validates: Requirements 5.6**

#### Property 14: Error Response Consistency
*For any* 错误情况，系统应该返回适当的 HTTP 状态码和包含错误信息的 JSON 响应
**Validates: Requirements 12.1, 12.3, 12.4**

#### Property 15: Input Validation Completeness
*For any* API 端点，提交无效输入应该被拒绝并返回详细的验证错误信息
**Validates: Requirements 12.4, 13.3**

#### Property 16: CORS Policy Enforcement
*For any* 跨域请求，只有来自允许列表中的源应该被接受，其他源应该被拒绝
**Validates: Requirements 13.1**

#### Property 17: SQL Injection Prevention
*For any* 用户输入，包含 SQL 注入尝试的输入应该被安全处理，不会导致数据库被破坏
**Validates: Requirements 13.3**

#### Property 18: Sensitive Data Protection
*For any* API 响应和日志，不应该包含密码、JWT 密钥等敏感信息
**Validates: Requirements 13.6**

#### Property 19: Database Query Optimization
*For any* 需要关联数据的查询，应该使用 JOIN 而不是 N+1 查询模式
**Validates: Requirements 14.3**

## Error Handling

### Error Types and Responses

系统将实现统一的错误处理机制，所有错误响应遵循一致的格式：

```typescript
interface ErrorResponse {
  error: string;           // 错误类型或简短描述
  message?: string;        // 详细错误消息
  details?: any;           // 额外的错误详情（如验证错误）
  code?: string;           // 错误代码
}
```

### Error Categories

#### 1. Validation Errors (400 Bad Request)

```typescript
// 示例：缺少必需字段
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Email is required"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

#### 2. Authentication Errors (401 Unauthorized)

```typescript
// 示例：无效的 token
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

#### 3. Authorization Errors (403 Forbidden)

```typescript
// 示例：权限不足
{
  "error": "Forbidden",
  "message": "Admin access required"
}
```

#### 4. Not Found Errors (404 Not Found)

```typescript
// 示例：资源不存在
{
  "error": "Not found",
  "message": "Product with id 123 not found"
}
```

#### 5. Conflict Errors (409 Conflict)

```typescript
// 示例：重复注册
{
  "error": "Email already registered",
  "message": "An account with this email already exists"
}
```

#### 6. Server Errors (500 Internal Server Error)

```typescript
// 示例：数据库错误
{
  "error": "Internal server error",
  "message": "Failed to process request"
}
```

### Error Handling Implementation

```typescript
// middleware/error.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(err: Error, c: Context) {
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: err.stack
  });
  
  if (err instanceof AppError) {
    return c.json({
      error: err.message,
      details: err.details
    }, err.statusCode);
  }
  
  // 数据库错误
  if (err.message.includes('SQLITE') || err.message.includes('D1')) {
    return c.json({
      error: 'Database error',
      message: 'Failed to process database operation'
    }, 500);
  }
  
  // 默认错误
  return c.json({
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  }, 500);
}
```

### Logging Strategy

```typescript
// 错误日志记录
function logError(error: Error, context: any) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    context: {
      path: context.req.path,
      method: context.req.method,
      user: context.get('user')?.id || 'anonymous'
    }
  };
  
  console.error(JSON.stringify(logEntry));
}
```


## Testing Strategy

### Dual Testing Approach

本项目将采用单元测试和属性测试相结合的方式，确保全面的测试覆盖：

- **单元测试**: 验证特定示例、边缘情况和错误条件
- **属性测试**: 验证跨所有输入的通用属性

两者是互补的，都是全面覆盖所必需的。

### Unit Testing

单元测试专注于：
- 特定示例，演示正确行为
- 组件之间的集成点
- 边缘情况和错误条件

**测试框架**: Vitest

**示例单元测试**:

```typescript
// tests/auth.test.ts
import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../src/services/auth.service';

describe('Authentication Service', () => {
  it('should hash and verify password correctly', async () => {
    const password = 'testPassword123';
    const hashed = await hashPassword(password);
    
    expect(hashed).not.toBe(password);
    expect(await verifyPassword(password, hashed)).toBe(true);
    expect(await verifyPassword('wrongPassword', hashed)).toBe(false);
  });
  
  it('should reject empty password', async () => {
    await expect(hashPassword('')).rejects.toThrow();
  });
  
  it('should handle special characters in password', async () => {
    const password = 'p@ssw0rd!#$%';
    const hashed = await hashPassword(password);
    expect(await verifyPassword(password, hashed)).toBe(true);
  });
});
```

### Property-Based Testing

属性测试专注于：
- 跨所有输入保持的通用属性
- 通过随机化实现全面的输入覆盖

**测试框架**: fast-check (JavaScript/TypeScript 的属性测试库)

**配置要求**:
- 每个属性测试最少 100 次迭代
- 每个测试必须引用其设计文档属性
- 标签格式: `Feature: cloudflare-migration, Property {number}: {property_text}`

**示例属性测试**:

```typescript
// tests/properties/auth.property.test.ts
import { describe, it } from 'vitest';
import { fc } from 'fast-check';
import { hashPassword, verifyPassword } from '../../src/services/auth.service';

describe('Property Tests: Authentication', () => {
  it('Property 3: Password Hash Round-Trip', async () => {
    // Feature: cloudflare-migration, Property 3: Password Hash Round-Trip
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 8, maxLength: 100 }),
        async (password) => {
          const hashed = await hashPassword(password);
          const isValid = await verifyPassword(password, hashed);
          return isValid === true;
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('Property 4: JWT Authentication Flow', async () => {
    // Feature: cloudflare-migration, Property 4: JWT Authentication Flow
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.integer({ min: 1, max: 1000000 }),
          email: fc.emailAddress(),
          is_admin: fc.integer({ min: 0, max: 1 })
        }),
        async (user) => {
          const token = await issueToken(user, 'test-secret');
          const payload = await verifyToken(token, 'test-secret');
          
          return (
            payload !== null &&
            payload.sub === String(user.id) &&
            payload.email === user.email
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

集成测试验证组件之间的交互：

```typescript
// tests/integration/api.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { unstable_dev } from 'wrangler';

describe('API Integration Tests', () => {
  let worker;
  
  beforeAll(async () => {
    worker = await unstable_dev('src/index.ts', {
      experimental: { disableExperimentalWarning: true }
    });
  });
  
  afterAll(async () => {
    await worker.stop();
  });
  
  it('should register and login user', async () => {
    // 注册
    const registerRes = await worker.fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testPassword123'
      })
    });
    
    expect(registerRes.status).toBe(201);
    const registerData = await registerRes.json();
    expect(registerData.user).toBeDefined();
    
    // 登录
    const loginRes = await worker.fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testPassword123'
      })
    });
    
    expect(loginRes.status).toBe(200);
    const loginData = await loginRes.json();
    expect(loginData.user.email).toBe('test@example.com');
  });
});
```

### End-to-End Testing

E2E 测试验证完整的用户流程：

```typescript
// tests/e2e/checkout.test.ts
import { test, expect } from '@playwright/test';

test('complete checkout flow', async ({ page }) => {
  // 访问首页
  await page.goto('https://yourdomain.com');
  
  // 浏览产品
  await page.click('text=Mobility');
  await expect(page).toHaveURL(/collections\/mobility/);
  
  // 添加到购物车
  await page.click('.product-card:first-child');
  await page.click('button:has-text("Add to Cart")');
  
  // 查看购物车
  await page.click('[aria-label="Cart"]');
  await expect(page.locator('.cart-item')).toHaveCount(1);
  
  // 结账
  await page.click('button:has-text("Checkout")');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="firstName"]', 'John');
  await page.fill('[name="lastName"]', 'Doe');
  await page.fill('[name="address1"]', '123 Main St');
  await page.fill('[name="city"]', 'New York');
  await page.fill('[name="postalCode"]', '10001');
  
  await page.click('button:has-text("Place Order")');
  
  // 验证订单创建
  await expect(page.locator('text=Order Confirmed')).toBeVisible();
});
```

### Performance Testing

性能测试验证系统在负载下的表现：

```typescript
// tests/performance/load.test.ts
import { check } from 'k6';
import http from 'k6/http';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // 逐渐增加到 20 用户
    { duration: '1m', target: 20 },   // 保持 20 用户
    { duration: '30s', target: 0 },   // 逐渐减少到 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% 的请求应在 500ms 内完成
  },
};

export default function () {
  const res = http.get('https://api.yourdomain.com/api/products');
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

### Test Coverage Goals

- **单元测试覆盖率**: 最少 80%
- **属性测试**: 每个核心属性至少一个测试
- **集成测试**: 覆盖所有主要 API 流程
- **E2E 测试**: 覆盖关键用户旅程

### Continuous Integration

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm test
      
      - name: Run property tests
        run: npm run test:properties
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Security Considerations

### 1. Authentication Security

- **密码哈希**: 使用 PBKDF2 with 100,000 iterations
- **JWT 密钥**: 使用强随机密钥，存储在 Workers Secrets 中
- **Token 过期**: JWT token 7 天后过期
- **Cookie 安全**: HttpOnly, Secure, SameSite=Lax

### 2. Input Validation

所有用户输入必须经过验证：

```typescript
// 使用 Zod 进行验证
const productSchema = z.object({
  name: z.string().min(1).max(255),
  category: z.enum(['mobility', 'productivity', 'sanctuary', 'savoriness']),
  price: z.number().positive().max(999999.99),
  description: z.string().max(5000).optional(),
  stock: z.number().int().min(0)
});
```

### 3. SQL Injection Prevention

使用参数化查询防止 SQL 注入：

```typescript
// ✅ 安全
const products = await db.prepare(
  'SELECT * FROM products WHERE category = ?'
).bind(category).all();

// ❌ 不安全
const products = await db.prepare(
  `SELECT * FROM products WHERE category = '${category}'`
).all();
```

### 4. CORS Configuration

严格的 CORS 策略：

```typescript
const allowedOrigins = [
  'https://yourdomain.com',
  'https://www.yourdomain.com'
];

// 开发环境允许 localhost
if (env.ENVIRONMENT === 'development') {
  allowedOrigins.push('http://localhost:3000');
}
```

### 5. Rate Limiting

防止 API 滥用：

```typescript
// 全局限制: 100 请求 / 15 分钟
// 认证端点: 5 请求 / 15 分钟
```

### 6. Content Security Policy

```typescript
app.use('*', async (c, next) => {
  await next();
  c.header('Content-Security-Policy', 
    "default-src 'self'; img-src 'self' https://r2.yourdomain.com"
  );
});
```

## Monitoring and Observability

### 1. Cloudflare Analytics

- 请求量和响应时间
- 错误率
- 地理分布

### 2. Custom Logging

```typescript
interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  context?: any;
}

function log(entry: LogEntry) {
  console.log(JSON.stringify(entry));
}
```

### 3. Error Tracking

集成错误追踪服务（如 Sentry）：

```typescript
import * as Sentry from '@sentry/cloudflare';

Sentry.init({
  dsn: env.SENTRY_DSN,
  environment: env.ENVIRONMENT
});
```

### 4. Performance Monitoring

监控关键指标：
- API 响应时间
- 数据库查询时间
- R2 上传/下载时间
- 错误率

## Rollback Strategy

### 1. 保留旧系统

在迁移完成并稳定运行至少 30 天后再关闭旧系统。

### 2. DNS 快速切换

使用 Cloudflare DNS，可以快速切换回旧系统：

```bash
# 切换到新系统
wrangler dns update yourdomain.com --type CNAME --content new-system

# 回滚到旧系统
wrangler dns update yourdomain.com --type A --content <OLD_IP>
```

### 3. 数据同步

在过渡期间，保持新旧系统数据同步：

```typescript
// 双写策略：同时写入 MySQL 和 D1
async function createOrder(orderData) {
  // 写入 D1
  const d1Result = await d1.execute(insertQuery, params);
  
  // 同时写入 MySQL（用于回滚）
  await mysql.execute(insertQuery, params);
  
  return d1Result;
}
```

### 4. 回滚检查清单

- [ ] 验证旧系统仍然可用
- [ ] 确认数据已同步
- [ ] 更新 DNS 记录
- [ ] 验证前端指向旧 API
- [ ] 监控错误率和性能
- [ ] 通知用户（如需要）

## Conclusion

本设计文档提供了将电商应用迁移到 Cloudflare 平台的完整技术方案。通过采用 D1、Workers 和 R2，系统将获得：

- **更快的全球访问速度**: 边缘计算和 CDN
- **更好的可扩展性**: 无服务器架构
- **更低的运维成本**: 托管服务
- **更高的可用性**: Cloudflare 的全球网络

迁移将分阶段进行，确保每个阶段都经过充分测试和验证，最小化风险。
