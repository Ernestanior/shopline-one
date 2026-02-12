# 🚀 Cloudflare 部署指南（中文版）

完整的 Cloudflare Pages + Workers + D1 部署流程。

## 📋 前置要求

1. ✅ Cloudflare 账号（免费即可）
2. ✅ Node.js 18+ 已安装
3. ✅ 已安装 Wrangler CLI：`npm install -g wrangler`

## 🎯 部署步骤

### 第一步：登录 Cloudflare

```bash
wrangler login
```

这会打开浏览器，登录你的 Cloudflare 账号并授权。

---

### 第二步：创建 D1 数据库

```bash
cd workers

# 创建生产数据库
wrangler d1 create ecommerce-db
```

**重要**：复制输出中的 `database_id`，例如：
```
✅ Successfully created DB 'ecommerce-db'
database_id = "abc123-def456-ghi789"
```

---

### 第三步：更新 wrangler.toml 配置

编辑 `workers/wrangler.toml`，找到这一行：

```toml
[[d1_databases]]
binding = "DB"
database_name = "ecommerce-db"
database_id = "YOUR_PROD_DATABASE_ID_HERE"  # ← 替换这里
```

将 `YOUR_PROD_DATABASE_ID_HERE` 替换为刚才复制的 `database_id`。

---

### 第四步：初始化数据库

```bash
# 创建表结构
wrangler d1 execute ecommerce-db --file=./schema.sql

# 导入测试数据（可选）
wrangler d1 execute ecommerce-db --file=./seed.sql
```

---

### 第五步：设置 JWT 密钥

```bash
# 生成一个随机密钥（复制输出）
openssl rand -base64 32

# 设置密钥
wrangler secret put JWT_SECRET
# 粘贴刚才生成的密钥，按回车
```

---

### 第六步：部署 Workers API

```bash
# 确保在 workers 目录
cd workers

# 安装依赖（如果还没安装）
npm install

# 部署到 Cloudflare
npm run deploy
```

**记录 Workers URL**，例如：
```
✅ Published ecommerce-api (1.23 sec)
   https://ecommerce-api.your-subdomain.workers.dev
```

---

### 第七步：创建管理员账号

```bash
# 注册一个管理员账号
curl -X POST https://ecommerce-api.your-subdomain.workers.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-strong-password"}'

# 将该用户设置为管理员
wrangler d1 execute ecommerce-db --command="UPDATE users SET is_admin = 1 WHERE email = 'admin@example.com'"
```

---

### 第八步：配置前端

#### 8.1 更新 API 地址

编辑 `client/.env.production`：

```env
REACT_APP_API_URL=https://ecommerce-api.your-subdomain.workers.dev
```

将 URL 替换为你的 Workers URL。

#### 8.2 构建前端

```bash
cd client
npm install
npm run build
```

---

### 第九步：部署前端到 Cloudflare Pages

#### 方法 A：使用 Wrangler（快速）

```bash
cd client
npx wrangler pages deploy build --project-name=ecommerce-frontend
```

#### 方法 B：使用 Git 集成（推荐）

1. **推送代码到 GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **在 Cloudflare Dashboard 中设置**
   - 访问：https://dash.cloudflare.com/
   - 点击 "Workers & Pages" → "Create application" → "Pages"
   - 连接你的 GitHub 仓库
   - 配置构建设置：
     - **构建命令**：`cd client && npm run build`
     - **构建输出目录**：`client/build`
     - **根目录**：`/`
   - 添加环境变量：
     - `REACT_APP_API_URL` = `https://ecommerce-api.your-subdomain.workers.dev`
   - 点击 "Save and Deploy"

3. **等待部署完成**（约 2-5 分钟）

**记录 Pages URL**，例如：
```
https://ecommerce-frontend.pages.dev
```

---

### 第十步：更新 CORS 配置

编辑 `workers/wrangler.toml`，找到：

```toml
[vars]
ALLOWED_ORIGINS = "http://localhost:3000"
```

改为：

```toml
[vars]
ALLOWED_ORIGINS = "https://ecommerce-frontend.pages.dev"
```

如果有多个域名，用逗号分隔：
```toml
ALLOWED_ORIGINS = "https://ecommerce-frontend.pages.dev,https://yourdomain.com"
```

重新部署 Workers：

```bash
cd workers
npm run deploy
```

---

## ✅ 测试部署

### 1. 测试 API

```bash
# 健康检查
curl https://ecommerce-api.your-subdomain.workers.dev/

# 获取产品列表
curl https://ecommerce-api.your-subdomain.workers.dev/api/products
```

### 2. 测试前端

访问你的 Pages URL：`https://ecommerce-frontend.pages.dev`

测试以下功能：
- ✅ 浏览产品
- ✅ 注册/登录
- ✅ 添加到购物车
- ✅ 创建订单
- ✅ 管理员面板（使用管理员账号登录）

---

## 🎨 配置自定义域名（可选）

### 为 Workers 配置域名

1. 在 Cloudflare Dashboard 中：
   - Workers & Pages → 选择你的 Worker
   - Settings → Triggers → Custom Domains
   - 添加域名：`api.yourdomain.com`

2. 更新前端环境变量：
   ```env
   REACT_APP_API_URL=https://api.yourdomain.com
   ```

3. 重新构建和部署前端

### 为 Pages 配置域名

1. 在 Cloudflare Dashboard 中：
   - Workers & Pages → 选择你的 Pages 项目
   - Custom domains → Add a custom domain
   - 添加域名：`yourdomain.com`

2. 更新 Workers CORS 配置：
   ```toml
   ALLOWED_ORIGINS = "https://yourdomain.com,https://www.yourdomain.com"
   ```

3. 重新部署 Workers

---

## 📊 查看日志和监控

### 查看 Workers 日志

```bash
cd workers
wrangler tail
```

### 查看数据库

```bash
# 查询用户数量
wrangler d1 execute ecommerce-db --command="SELECT COUNT(*) FROM users"

# 查询所有订单
wrangler d1 execute ecommerce-db --command="SELECT * FROM orders LIMIT 10"

# 备份数据库
wrangler d1 export ecommerce-db --output=backup.sql
```

### 在 Dashboard 中查看

访问 Cloudflare Dashboard：
- **Workers 分析**：Workers & Pages → 你的 Worker → Analytics
- **Pages 分析**：Workers & Pages → 你的 Pages 项目 → Analytics
- **D1 数据库**：Storage & Databases → D1

---

## 🔧 常见问题

### 问题 1：CORS 错误

**症状**：前端无法访问 API，浏览器控制台显示 CORS 错误

**解决方案**：
1. 检查 `workers/wrangler.toml` 中的 `ALLOWED_ORIGINS` 是否包含你的前端域名
2. 确保重新部署了 Workers：`cd workers && npm run deploy`

### 问题 2：401 Unauthorized

**症状**：登录后仍然显示未授权

**解决方案**：
1. 检查 JWT_SECRET 是否正确设置：`wrangler secret list`
2. 如果没有，重新设置：`wrangler secret put JWT_SECRET`

### 问题 3：数据库连接失败

**症状**：API 返回数据库错误

**解决方案**：
1. 检查 `wrangler.toml` 中的 `database_id` 是否正确
2. 验证数据库是否存在：`wrangler d1 list`
3. 检查表是否创建：`wrangler d1 execute ecommerce-db --command="SELECT name FROM sqlite_master WHERE type='table'"`

### 问题 4：图片无法显示

**症状**：产品图片显示为损坏的图标

**解决方案**：
1. 检查图片 URL 是否正确
2. 如果使用 R2，确保 bucket 已创建并配置了公共访问
3. 临时方案：使用外部图片 URL（如 Unsplash）

---

## 💰 费用说明

### 免费额度（足够小型项目使用）

- **Workers**：每天 100,000 次请求
- **Pages**：无限请求，每月 500 次构建
- **D1**：每天 500 万次读取，10 万次写入
- **总费用**：$0/月 🎉

### 超出免费额度后

- **Workers**：$5/月 + 每百万请求 $0.50
- **D1**：$5/月 + 按使用量计费
- **Pages**：免费（无限流量）

对于个人项目或小型电商，免费额度完全够用！

---

## 🎯 下一步

部署完成后，你可以：

1. ✅ 配置自定义域名
2. ✅ 设置 CI/CD 自动部署
3. ✅ 添加更多产品数据
4. ✅ 配置邮件通知
5. ✅ 添加支付集成（Stripe、PayPal 等）
6. ✅ 设置监控和告警

---

## 📚 有用的链接

- **Cloudflare Dashboard**：https://dash.cloudflare.com/
- **Cloudflare 文档**：https://developers.cloudflare.com/
- **Wrangler 文档**：https://developers.cloudflare.com/workers/wrangler/
- **D1 文档**：https://developers.cloudflare.com/d1/

---

## 🆘 需要帮助？

如果遇到问题：

1. 查看 Workers 日志：`wrangler tail`
2. 检查浏览器控制台错误
3. 查看 Cloudflare Dashboard 中的分析和日志
4. 参考详细的英文部署文档：`DEPLOYMENT_GUIDE.md`

---

**恭喜！🎉 你的电商网站现在已经部署到 Cloudflare 的全球边缘网络上了！**

你的网站现在拥有：
- ⚡ 超快的加载速度（全球 CDN）
- 🔒 自动 HTTPS 加密
- 🌍 全球可访问
- 💰 免费托管（在免费额度内）
- 📈 可扩展到百万用户

享受你的新网站吧！🚀
