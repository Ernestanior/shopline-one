# Quick Start: Cloudflare Migration

快速开始指南 - 5分钟内启动你的 Cloudflare 电商应用

## 前提条件

- Node.js 18+
- Cloudflare 账户
- Wrangler CLI: `npm install -g wrangler`

## 步骤 1: 登录 Cloudflare

```bash
wrangler login
```

## 步骤 2: 创建数据库

```bash
# 创建 D1 数据库
wrangler d1 create ecommerce-db-dev

# 复制输出的 database_id
# 更新 workers/wrangler.toml 中的 YOUR_DEV_DATABASE_ID_HERE
```

## 步骤 3: 初始化数据库

```bash
cd workers

# 创建表结构
wrangler d1 execute ecommerce-db-dev --file=./schema.sql

# 插入示例数据
wrangler d1 execute ecommerce-db-dev --file=./seed.sql
```

## 步骤 4: 设置密钥

```bash
# 生成一个强密钥（或使用你自己的）
# 例如: openssl rand -base64 32

wrangler secret put JWT_SECRET --env development
# 输入你的密钥
```

## 步骤 5: 安装依赖

```bash
# Workers 后端
cd workers
npm install

# 前端（可选，如果要本地测试）
cd ../client
npm install
```

## 步骤 6: 本地测试

```bash
# 启动 Workers API
cd workers
npm run dev
```

访问 http://localhost:8787 测试 API

## 步骤 7: 部署到 Cloudflare

```bash
# 部署 Workers API
cd workers
npm run deploy:dev

# 记下部署的 URL，例如：
# https://ecommerce-api-dev.your-subdomain.workers.dev
```

## 步骤 8: 部署前端

```bash
cd client

# 更新 .env.production 中的 API URL
# REACT_APP_API_URL=https://ecommerce-api-dev.your-subdomain.workers.dev

# 构建
npm run build

# 部署到 Pages
npx wrangler pages deploy build --project-name=ecommerce-frontend
```

## 🎉 完成！

你的应用现在运行在 Cloudflare 的全球边缘网络上！

访问 Cloudflare Pages 给你的 URL 来查看你的应用。

## 常用命令

```bash
# 查看 Workers 日志
wrangler tail

# 查询数据库
wrangler d1 execute ecommerce-db-dev --command="SELECT * FROM products LIMIT 5"

# 重新部署
cd workers && npm run deploy:dev

# 查看部署列表
wrangler deployments list
```

## 测试 API

```bash
# 健康检查
curl https://your-worker-url.workers.dev/

# 获取产品列表
curl https://your-worker-url.workers.dev/api/products

# 注册用户
curl -X POST https://your-worker-url.workers.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 故障排除

### 问题: 数据库连接失败
**解决**: 检查 wrangler.toml 中的 database_id 是否正确

### 问题: JWT 错误
**解决**: 确保已设置 JWT_SECRET: `wrangler secret put JWT_SECRET --env development`

### 问题: CORS 错误
**解决**: 更新 wrangler.toml 中的 ALLOWED_ORIGINS

## 下一步

1. 配置自定义域名
2. 设置生产环境
3. 添加监控和告警
4. 查看完整文档: `DEPLOYMENT_GUIDE.md`

## 需要帮助？

- 查看 `DEPLOYMENT_GUIDE.md` 获取详细说明
- 查看 `MIGRATION_STATUS.md` 了解项目状态
- Cloudflare 文档: https://developers.cloudflare.com/
