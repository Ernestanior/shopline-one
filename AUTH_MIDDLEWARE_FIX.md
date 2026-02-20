# 认证中间件修复

## 问题描述
登录成功后，用户状态没有被保存。登录接口返回 200 和 token，但后续请求（如 `/api/auth/me`）返回 401 Unauthorized。

## 根本原因
在 `workers/src/index.ts` 中，**`authMiddleware` 被注释掉了**：

```typescript
// Disable all middleware for debugging
// app.use('*', corsCheck);
// app.use('*', authMiddleware);  // ← 这个被注释了！
```

这导致：
1. 所有请求的 `c.get('user')` 都是 `null`
2. JWT token 没有被解析和验证
3. 即使发送了正确的 token，服务器也无法识别用户身份

## 修复方案
启用 `authMiddleware`：

```typescript
// Apply auth middleware globally to parse tokens
app.use('*', authMiddleware);
```

## 认证机制说明
系统使用双重认证机制：

### 1. Cookie 认证（服务器端）
- Cookie 名称：`shop_auth`
- 设置：`HttpOnly; Secure; SameSite=None`
- 有效期：7 天
- 用途：传统的 session 认证

### 2. Bearer Token 认证（客户端）
- 存储位置：`localStorage.auth_token`
- 发送方式：`Authorization: Bearer <token>` header
- 用途：跨域 API 调用

### 认证流程
1. 用户登录 → 服务器返回 token
2. 前端保存 token 到 localStorage
3. 服务器设置 Cookie（可选，用于同域请求）
4. 后续请求：
   - 前端从 localStorage 读取 token
   - 添加到 `Authorization` header
   - `authMiddleware` 解析 token 并设置 `c.set('user', user)`

## 测试结果

### 修复前
```bash
curl -H "Authorization: Bearer <token>" https://ecommerce-api.xyvn.workers.dev/api/auth/me
# 返回: {"error":"Unauthorized","code":"UNAUTHORIZED"}
```

### 修复后
```bash
curl -H "Authorization: Bearer <token>" https://ecommerce-api.xyvn.workers.dev/api/auth/me
# 返回: {"user":{"id":2,"email":"test@example.com","is_admin":1}}
```

## 部署
```bash
cd workers
npx wrangler deploy
```

## 验证
1. 访问 https://seedlight.tech
2. 点击 Login
3. 使用测试账号登录：
   - Email: test@example.com
   - Password: password12345678
4. 登录后应该能看到用户信息（右上角显示邮箱）

## 注意事项
- `authMiddleware` 必须在所有路由之前应用
- 它会解析 Authorization header 和 Cookie 中的 token
- 如果 token 有效，会设置 `c.set('user', user)`
- 如果 token 无效或不存在，`user` 为 `null`（但不会返回错误）
- 需要认证的路由应该使用 `requireAuth` 或 `requireAdmin` 中间件
