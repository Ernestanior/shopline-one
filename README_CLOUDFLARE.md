# E-Commerce on Cloudflare 🚀

现代化电商应用 - 运行在 Cloudflare 边缘网络

## 🌟 特性

- ⚡ **极速响应** - 边缘计算，全球低延迟
- 🌍 **全球分布** - 自动部署到 300+ 个城市
- 📈 **无限扩展** - 零配置自动扩展
- 🔒 **安全可靠** - 内置 DDoS 防护和 SSL
- 💰 **成本优化** - 慷慨的免费额度

## 🏗️ 技术栈

### 后端
- **Cloudflare Workers** - 边缘计算平台
- **Hono** - 轻量级 Web 框架
- **D1** - 全球分布的 SQLite 数据库
- **Web Crypto API** - 密码加密
- **Jose** - JWT 认证
- **Zod** - 输入验证

### 前端
- **React** + **TypeScript**
- **Cloudflare Pages** - 静态网站托管
- **全球 CDN** - 自动缓存和加速

### 存储
- **D1 Database** - 用户、产品、订单数据
- **R2 Storage** - 图片和文件存储（可选）

## 📦 项目结构

```
.
├── workers/                 # Cloudflare Workers API
│   ├── src/
│   │   ├── index.ts        # 主入口
│   │   ├── routes/         # API 路由
│   │   ├── middleware/     # 中间件
│   │   ├── services/       # 业务逻辑
│   │   ├── types/          # TypeScript 类型
│   │   └── tests/          # 测试文件
│   ├── schema.sql          # 数据库 schema
│   ├── seed.sql            # 示例数据
│   ├── wrangler.toml       # Workers 配置
│   └── package.json
│
├── client/                  # React 前端
│   ├── src/
│   ├── public/
│   ├── .env.development    # 开发环境变量
│   ├── .env.production     # 生产环境变量
│   └── package.json
│
├── QUICK_START_CLOUDFLARE.md      # 快速开始
├── DEPLOYMENT_GUIDE.md            # 详细部署指南
├── MIGRATION_STATUS.md            # 迁移状态
├── CLOUDFLARE_MIGRATION_COMPLETE.md  # 完成总结
└── README_CLOUDFLARE.md           # 本文件
```

## 🚀 快速开始

### 前提条件

- Node.js 18+
- Cloudflare 账户
- Wrangler CLI

### 1. 安装依赖

```bash
# macOS/Linux
./install-all.sh

# Windows
install-all.bat

# 或手动安装
cd workers && npm install
cd ../client && npm install
```

### 2. 安装 Wrangler

```bash
npm install -g wrangler
wrangler login
```

### 3. 创建数据库

```bash
wrangler d1 create ecommerce-db-dev
# 复制 database_id 到 workers/wrangler.toml
```

### 4. 初始化数据库

```bash
cd workers
wrangler d1 execute ecommerce-db-dev --file=./schema.sql
wrangler d1 execute ecommerce-db-dev --file=./seed.sql
```

### 5. 设置密钥

```bash
wrangler secret put JWT_SECRET --env development
# 输入一个强密钥
```

### 6. 本地测试

```bash
cd workers
npm run dev
```

访问 http://localhost:8787

### 7. 部署

```bash
# 部署 Workers
cd workers
npm run deploy:dev

# 部署 Pages
cd ../client
npm run build
npx wrangler pages deploy build --project-name=ecommerce-frontend
```

## 📚 文档

- **[快速开始](QUICK_START_CLOUDFLARE.md)** - 5分钟快速部署
- **[部署指南](DEPLOYMENT_GUIDE.md)** - 完整部署文档
- **[迁移状态](MIGRATION_STATUS.md)** - 项目进度和文件清单
- **[完成总结](CLOUDFLARE_MIGRATION_COMPLETE.md)** - 迁移成果

## 🎯 API 端点

### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/me` - 获取当前用户

### 产品
- `GET /api/products` - 获取产品列表
- `GET /api/products/:id` - 获取产品详情
- `GET /api/categories` - 获取分类列表

### 购物车
- `GET /api/cart` - 获取购物车
- `POST /api/cart/items` - 添加商品
- `PUT /api/cart/items/:id` - 更新数量
- `DELETE /api/cart/items/:id` - 删除商品
- `DELETE /api/cart` - 清空购物车

### 订单
- `POST /api/orders` - 创建订单
- `GET /api/user/orders` - 获取订单列表
- `GET /api/user/orders/:id` - 获取订单详情

### 用户资料
- `GET /api/user/profile` - 获取资料
- `PUT /api/user/profile` - 更新资料
- `GET /api/user/addresses` - 获取地址列表
- `POST /api/user/addresses` - 添加地址
- `PUT /api/user/addresses/:id` - 更新地址
- `DELETE /api/user/addresses/:id` - 删除地址

### 管理员
- `GET /api/admin/products` - 获取所有产品
- `POST /api/admin/products` - 创建产品
- `PUT /api/admin/products/:id` - 更新产品
- `DELETE /api/admin/products/:id` - 删除产品
- `GET /api/admin/orders` - 获取所有订单
- `PUT /api/admin/orders/:id` - 更新订单状态

### 公共
- `POST /api/contact` - 提交反馈
- `POST /api/newsletter/subscribe` - 订阅新闻

## 🧪 测试

```bash
cd workers

# 运行所有测试
npm test

# 运行测试并监听变化
npm run test:watch

# 类型检查
npm run type-check
```

## 📊 性能

### 响应时间
- **API**: < 50ms (边缘计算)
- **静态资源**: < 10ms (CDN 缓存)
- **数据库查询**: < 20ms (D1)

### 可扩展性
- **自动扩展**: 无需配置
- **并发请求**: 无限制
- **全球分布**: 300+ 个城市

### 成本
- **免费额度**: 
  - Workers: 100,000 请求/天
  - D1: 500万次读取/天
  - Pages: 无限请求

## 🔒 安全

- ✅ HTTPS 强制
- ✅ CORS 配置
- ✅ JWT 认证
- ✅ 密码加密 (PBKDF2)
- ✅ 输入验证
- ✅ SQL 注入防护
- ✅ DDoS 防护
- ✅ 速率限制

## 🛠️ 开发

### 本地开发

```bash
# 启动 Workers API
cd workers
npm run dev

# 启动前端（另一个终端）
cd client
npm start
```

### 查看日志

```bash
wrangler tail
```

### 数据库管理

```bash
# 查询数据
wrangler d1 execute ecommerce-db-dev --command="SELECT * FROM products"

# 导出数据
wrangler d1 export ecommerce-db-dev --output=backup.sql

# 导入数据
wrangler d1 execute ecommerce-db-dev --file=backup.sql
```

## 🐛 故障排除

### 数据库连接失败
检查 `wrangler.toml` 中的 `database_id` 是否正确

### JWT 错误
确保已设置 `JWT_SECRET`: `wrangler secret put JWT_SECRET --env development`

### CORS 错误
更新 `wrangler.toml` 中的 `ALLOWED_ORIGINS`

### 构建失败
```bash
rm -rf node_modules
npm install
```

## 📈 监控

在 Cloudflare Dashboard 查看：
- 请求量和响应时间
- 错误率
- 地理分布
- 数据库性能

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可

MIT License

## 🙏 致谢

- Cloudflare Workers
- Hono Framework
- React
- TypeScript

## 📞 支持

- 文档: [Cloudflare Docs](https://developers.cloudflare.com/)
- 社区: [Cloudflare Discord](https://discord.cloudflare.com/)
- 问题: [GitHub Issues](https://github.com/your-repo/issues)

---

**享受 Cloudflare 带来的强大性能！** 🚀

Made with ❤️ using Cloudflare Workers
