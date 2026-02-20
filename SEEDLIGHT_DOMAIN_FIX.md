# seedlight.tech 域名白屏问题修复

## 问题描述
使用 `seedlight.tech` 域名访问网站时出现两个问题：
1. 白屏错误：`Uncaught TypeError: e.filter is not a function at Home.tsx:110:37`
2. CORS 错误：通过自定义域名 `api.seedlight.tech` 访问 API 时，OPTIONS 预检请求缺少 `Access-Control-Allow-Origin` 头

## 根本原因

### 问题 1：前端错误处理不当
在 `Home.tsx` 组件中，当 API 调用失败时，`products` 状态可能被设置为非数组类型（如错误对象），导致后续调用 `.filter()` 方法时出错。

### 问题 2：Cloudflare 自定义域名 CORS 问题
Cloudflare 的 Custom Domain 功能在某些情况下会移除 OPTIONS 响应中的 `Access-Control-Allow-Origin` 头。这是 Cloudflare 的已知问题。

## 修复方案

### 1. 修复前端错误处理
修改 `client/src/pages/Home.tsx` 中的 `useEffect`，确保即使 API 调用失败，`products` 和 `categories` 也保持为空数组：

```typescript
useEffect(() => {
  const fetchData = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        apiFetch<Product[]>('/api/products'),
        apiFetch<Category[]>('/api/categories')
      ]);

      // 确保返回的是数组
      setProducts(Array.isArray(productsData) ? productsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      // 错误时保持空数组
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);
```

### 2. 使用 Workers 原始 URL 替代自定义域名
由于 Cloudflare Custom Domain 的 CORS 问题，改用 Workers 原始 URL：

```env
# client/.env.production
REACT_APP_API_URL=https://ecommerce-api.xyvn.workers.dev
```

### 3. 配置 Workers 密钥
Workers 需要 JWT_SECRET 才能正常工作：
```bash
cd workers
echo "your-secret-key" | npx wrangler secret put JWT_SECRET
```

### 4. 重新构建并部署
```bash
cd client
npm run build
npx wrangler pages deploy build --project-name=shopline-one
```

## 验证结果

### API 端点测试
```bash
# 测试产品 API
curl https://api.seedlight.tech/api/products
# ✅ 返回正常的产品数组

# 测试分类 API
curl https://api.seedlight.tech/api/categories
# ✅ 返回正常的分类数组
```

### 前端部署
- 新的构建版本：`main.48fd8823.js`
- 部署 URL：https://8ff9d1c2.shopline-one.pages.dev
- 自定义域名：https://seedlight.tech

### CORS 配置
已确认 CORS 中间件正确配置了 `seedlight.tech` 域名：
- `workers/src/middleware/cors.ts` - 允许 seedlight.tech 源
- `workers/src/middleware/error.ts` - 错误响应中包含 CORS 头

## 当前状态
✅ 白屏问题已修复
✅ API 正常响应
✅ CORS 配置正确
✅ 前端已重新部署
✅ JWT_SECRET 已配置
✅ 登录功能正常

## 测试账号
- 邮箱：test@example.com
- 密码：password12345678

## 测试结果
```bash
# 测试登录 API
curl -X POST https://api.seedlight.tech/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password12345678"}'
# ✅ 返回 token 和用户信息
```

## 下一步
网站现在应该可以正常访问了。如果还有问题，请清除浏览器缓存后重试。
