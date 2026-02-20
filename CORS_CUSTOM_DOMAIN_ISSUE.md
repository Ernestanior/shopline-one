# Cloudflare 自定义域名 CORS 问题

## 问题描述
通过自定义域名 `api.seedlight.tech` 访问 API 时，OPTIONS 预检请求的响应中缺少 `Access-Control-Allow-Origin` 头，导致浏览器 CORS 检查失败。

## 测试结果

### 直接访问 Workers URL（正常）
```bash
curl -I -X OPTIONS https://ecommerce-api.xyvn.workers.dev/api/auth/me \
  -H "Origin: https://seedlight.tech"
  
# ✅ 包含 Access-Control-Allow-Origin: https://seedlight.tech
```

### 通过自定义域名访问（异常）
```bash
curl -I -X OPTIONS https://api.seedlight.tech/api/auth/me \
  -H "Origin: https://seedlight.tech"
  
# ❌ 缺少 Access-Control-Allow-Origin 头
```

## 根本原因
Cloudflare 的自定义域名（Custom Domain）功能可能在某些情况下会移除或修改 CORS 响应头。这是 Cloudflare 的已知问题。

## 临时解决方案

### 方案 1：使用 Workers 原始 URL
在前端配置中使用 Workers 的原始 URL 而不是自定义域名：

```env
# client/.env.production
REACT_APP_API_URL=https://ecommerce-api.xyvn.workers.dev
```

然后重新构建和部署前端：
```bash
cd client
npm run build
npx wrangler pages deploy build --project-name=shopline-one
```

### 方案 2：使用 Cloudflare Workers Routes
不使用 Custom Domain，而是在 Cloudflare Dashboard 中配置 Workers Routes：

1. 进入 Cloudflare Dashboard
2. 选择域名 `seedlight.tech`
3. 进入 Workers Routes
4. 添加路由：`api.seedlight.tech/*` → `ecommerce-api`

这种方式可能会正确保留 CORS 头。

### 方案 3：添加 Transform Rules
在 Cloudflare Dashboard 中添加 Transform Rules 来确保 CORS 头存在：

1. 进入 Cloudflare Dashboard
2. 选择域名 `seedlight.tech`
3. 进入 Rules → Transform Rules → Modify Response Header
4. 添加规则：
   - 条件：Hostname equals `api.seedlight.tech` AND Request Method equals `OPTIONS`
   - 操作：Set dynamic `Access-Control-Allow-Origin` to `http.request.headers["origin"][0]`

## 推荐方案
目前推荐使用**方案 1**（使用 Workers 原始 URL），因为：
1. 最简单，不需要额外配置
2. 立即生效
3. 不依赖 Cloudflare 的其他功能

## 后续行动
如果需要使用自定义域名，建议联系 Cloudflare 支持团队报告这个问题。
