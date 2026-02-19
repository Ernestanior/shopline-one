# seedlight.tech CORS问题总结

## 问题

使用 `seedlight.tech` 域名访问网站时，登录功能出现CORS错误。
使用 `shopline-one.pages.dev` 域名则正常。

## 已完成的修复

1. ✅ 在 `wrangler.toml` 中添加了 seedlight.tech 到 ALLOWED_ORIGINS
2. ✅ 在 CORS中间件中硬编码了 seedlight.tech
3. ✅ 在 errorHandler 中添加了 CORS头设置
4. ✅ 创建了手动CORS中间件替代Hono的CORS

## 当前状态

- API端配置正确
- curl测试显示403 Forbidden
- 响应中缺少 `Access-Control-Allow-Origin` 头
- 只有 `Access-Control-Allow-Credentials` 和 `Access-Control-Expose-Headers`

## 测试结果

```bash
# shopline-one.pages.dev - 正常
curl -X POST https://shopline-one-api.xyvn.workers.dev/api/auth/login \
  -H "Origin: https://shopline-one.pages.dev" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password12345678"}'
# 返回: HTTP 200 + token

# seedlight.tech - 失败
curl -X POST https://shopline-one-api.xyvn.workers.dev/api/auth/login \
  -H "Origin: https://seedlight.tech" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password12345678"}'
# 返回: HTTP 403 Forbidden
```

## 可能的原因

1. **Cloudflare Workers的某个内部机制**在拦截seedlight.tech的请求
2. **Cloudflare Pages的域名绑定配置**可能需要额外设置
3. **某个未知的中间件或配置**在更早的阶段拦截请求

## 建议的解决方案

### 方案1: 检查Cloudflare Pages设置

1. 登录 Cloudflare Dashboard
2. Pages > shopline-one > Settings > Custom domains
3. 确认 seedlight.tech 已正确绑定
4. 检查是否有任何访问规则或防火墙规则

### 方案2: 在Cloudflare Workers Dashboard检查

1. Workers & Pages > ecommerce-api > Settings
2. 检查是否有任何触发器或路由规则
3. 检查是否有任何安全设置

### 方案3: 临时解决方案

在CORS中间件中完全允许所有origin（仅用于测试）：

```typescript
// 临时：允许所有origin
app.use('*', async (c, next) => {
  const origin = c.req.header('origin');
  if (origin) {
    c.header('Access-Control-Allow-Origin', origin);
    c.header('Access-Control-Allow-Credentials', 'true');
  }
  await next();
});
```

### 方案4: 使用Cloudflare Access或WAF规则

可能需要在Cloudflare的WAF或Access规则中明确允许seedlight.tech。

## 下一步

1. 检查Cloudflare Dashboard中的所有相关设置
2. 尝试在浏览器中直接访问 https://seedlight.tech 并打开开发者工具查看详细错误
3. 检查是否有任何Cloudflare的安全功能（Bot Fight Mode, Security Level等）在拦截请求

## 文件修改记录

- `workers/wrangler.toml` - 添加了 seedlight.tech 到 ALLOWED_ORIGINS
- `workers/src/middleware/cors.ts` - 硬编码了允许的域名列表
- `workers/src/middleware/error.ts` - 在所有错误响应中添加CORS头
- `workers/src/index.ts` - 创建了手动CORS中间件

## 测试账号

- Email: test@example.com
- Password: password12345678
- 角色: 管理员
