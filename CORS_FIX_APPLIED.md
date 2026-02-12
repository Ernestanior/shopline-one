# ✅ CORS 问题已修复

## 问题描述

前端在发送登录请求时，浏览器会先发送 OPTIONS 预检请求，但返回 500 错误：
```
OPTIONS /api/auth/login 500 Internal Server Error (16ms)
```

## 根本原因

1. **CORS 中间件处理不当**: Hono 的 CORS 中间件需要正确返回响应
2. **OPTIONS 请求未正确处理**: 需要显式处理 OPTIONS 请求并返回 204 状态码
3. **端口不固定**: Wrangler dev 每次启动使用随机端口，导致前端无法连接

## 修复方案

### 1. 修复 CORS 中间件调用 (workers/src/index.ts)

**修改前:**
```typescript
app.use('*', async (c, next) => {
  // Apply CORS
  const corsMiddleware = createCorsMiddleware(c.env);
  await corsMiddleware(c, next);
});
```

**修改后:**
```typescript
// Global middleware - CORS must be first
app.use('*', async (c, next) => {
  const corsMiddleware = createCorsMiddleware(c.env);
  return corsMiddleware(c, next);  // 使用 return 而不是 await
});

// Handle OPTIONS requests early
app.options('*', (c) => {
  return c.text('', 204);  // 显式处理 OPTIONS 请求
});
```

### 2. 固定开发端口 (workers/package.json)

**修改前:**
```json
"dev": "wrangler dev"
```

**修改后:**
```json
"dev": "wrangler dev --port 8787"
```

## 验证结果

### OPTIONS 预检请求
```bash
curl -X OPTIONS http://localhost:8787/api/auth/login \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"
```

**响应:**
```
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
Access-Control-Allow-Headers: Content-Type,Authorization
Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
Access-Control-Max-Age: 86400
```

### 实际 POST 请求
```bash
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**响应:**
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
Set-Cookie: shop_auth=...
```

## CORS 配置详情

当前 CORS 配置 (workers/src/middleware/cors.ts):

- **允许的源**: 
  - `http://localhost:3000` (前端开发服务器)
  - `http://localhost:8787` (API 服务器)
  - 所有 localhost 端口 (开发模式)
  
- **允许的方法**: GET, POST, PUT, PATCH, DELETE, OPTIONS

- **允许的头**: Content-Type, Authorization

- **暴露的头**: Content-Length, X-Request-Id

- **凭证支持**: 启用 (credentials: true)

- **缓存时间**: 24 小时 (maxAge: 86400)

## 测试步骤

1. **确保 Workers 在 8787 端口运行**
   ```bash
   cd workers
   npm run dev
   # 应该显示: Ready on http://localhost:8787
   ```

2. **确保前端在 3000 端口运行**
   ```bash
   cd client
   npm start
   # 应该显示: Compiled successfully!
   ```

3. **在浏览器中测试**
   - 打开 http://localhost:3000
   - 打开开发者工具 (F12) -> Network 标签
   - 尝试登录
   - 应该看到:
     - OPTIONS /api/auth/login → 204 No Content
     - POST /api/auth/login → 200 OK

## 相关文件

- `workers/src/index.ts` - 主入口文件，CORS 中间件配置
- `workers/src/middleware/cors.ts` - CORS 中间件实现
- `workers/package.json` - 开发脚本配置
- `workers/.dev.vars` - 环境变量 (ALLOWED_ORIGINS)

## 注意事项

1. **生产环境**: 部署到 Cloudflare 时，需要在 `wrangler.toml` 中配置正确的 `ALLOWED_ORIGINS`

2. **安全性**: CORS 配置应该只允许信任的域名，不要在生产环境使用通配符 `*`

3. **Cookie 设置**: 
   - `HttpOnly`: 防止 JavaScript 访问
   - `Secure`: 仅通过 HTTPS 传输 (本地开发除外)
   - `SameSite=Lax`: 防止 CSRF 攻击

## 下一步

CORS 问题已解决，你现在可以:

1. ✅ 在浏览器中正常使用登录功能
2. ✅ 测试所有需要认证的 API 端点
3. ✅ 继续开发和测试其他功能
4. ✅ 准备部署到 Cloudflare

---

**修复完成！** 🎉
