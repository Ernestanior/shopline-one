# 支付认证问题诊断

## 错误信息

访问 `https://seedlight.tech/checkout/17` 点击"前往支付"时：
- **请求**: `POST https://ecommerce-api.xyvn.workers.dev/api/payment/create`
- **响应**: `{"error":"Unauthorized"}`
- **状态码**: 401

## 问题原因

支付创建 API 需要用户认证，但请求没有包含有效的认证 token。

## 🔍 诊断步骤

### 步骤 1: 检查是否已登录

1. 打开 https://seedlight.tech
2. 按 F12 打开开发者工具
3. 切换到 **Console** 标签
4. 输入并执行：
   ```javascript
   localStorage.getItem('auth_token')
   ```

**预期结果**：
- ✅ 如果返回一个长字符串（JWT token），说明已登录
- ❌ 如果返回 `null`，说明未登录

### 步骤 2: 检查 token 是否在请求中

1. 保持开发者工具打开
2. 切换到 **Network** 标签
3. 点击"前往支付"按钮
4. 找到 `/api/payment/create` 请求
5. 点击查看 **Headers**
6. 查找 **Request Headers** 中的 `Authorization`

**预期结果**：
- ✅ 应该有 `Authorization: Bearer eyJhbGc...`
- ❌ 如果没有这个 header，说明前端没有发送 token

### 步骤 3: 检查 token 是否有效

在 Console 中执行：
```javascript
fetch('https://ecommerce-api.xyvn.workers.dev/api/auth/me', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
  }
})
.then(r => r.json())
.then(data => console.log('User info:', data))
.catch(err => console.error('Auth failed:', err))
```

**预期结果**：
- ✅ 返回用户信息 `{id, email, name, ...}`
- ❌ 返回 `{error: "Unauthorized"}`，说明 token 无效或过期

## 🔧 解决方案

### 方案 1: 重新登录（最简单）

1. 访问 https://seedlight.tech/login
2. 输入账号密码登录
3. 登录成功后，会自动保存新的 token
4. 重新尝试支付

### 方案 2: 清除缓存后重新登录

如果登录后仍然有问题：

1. 打开开发者工具 Console
2. 执行：
   ```javascript
   localStorage.clear()
   ```
3. 刷新页面
4. 重新登录

### 方案 3: 检查 CORS 配置

如果 token 存在但请求失败，可能是 CORS 问题：

1. 查看 Network 标签中的请求
2. 检查是否有 CORS 错误（红色）
3. 查看 Console 是否有 CORS 相关错误信息

## 🐛 常见问题

### Q1: 我确定已经登录了，为什么还是 Unauthorized？

**可能原因**：
1. **Token 过期**：JWT token 有过期时间
2. **跨域问题**：Cookie 或 token 没有正确发送
3. **后端配置问题**：JWT_SECRET 不匹配

**解决方法**：
- 重新登录获取新 token
- 检查浏览器 Console 是否有错误信息

### Q2: localStorage 中有 token，但请求中没有 Authorization header

**可能原因**：
- 前端代码问题
- 浏览器安全策略阻止

**解决方法**：
1. 检查浏览器 Console 是否有错误
2. 尝试清除缓存后重新登录
3. 尝试使用无痕模式

### Q3: 每次刷新页面都需要重新登录

**可能原因**：
- localStorage 被清除
- Token 过期时间太短
- 浏览器设置阻止 localStorage

**解决方法**：
- 检查浏览器隐私设置
- 不要使用无痕模式
- 联系管理员检查 token 过期时间

## 🔍 技术细节

### 认证流程

1. **登录**：
   ```
   POST /api/auth/login
   Body: {email, password}
   Response: {token, user}
   ```

2. **保存 token**：
   ```javascript
   localStorage.setItem('auth_token', token)
   ```

3. **发送认证请求**：
   ```
   POST /api/payment/create
   Headers: {Authorization: Bearer <token>}
   ```

4. **后端验证**：
   - 解析 JWT token
   - 验证签名和过期时间
   - 提取用户信息

### Token 格式

JWT token 格式：
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsImlhdCI6MTcwOTQ1NjAwMCwiZXhwIjoxNzA5NTQyNDAwfQ.signature
```

包含三部分（用 `.` 分隔）：
1. Header（算法和类型）
2. Payload（用户信息和过期时间）
3. Signature（签名）

### 后端认证中间件

`workers/src/middleware/auth.ts` 中的 `requireAuth`：
```typescript
export const requireAuth: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid authorization header');
  }
  
  const token = authHeader.substring(7);
  const user = await verifyToken(token, c.env.JWT_SECRET);
  
  if (!user) {
    throw new UnauthorizedError('Invalid or expired token');
  }
  
  c.set('user', user);
  await next();
};
```

## 📋 快速检查清单

在支付前确认：

- [ ] 已登录账户（右上角显示用户名）
- [ ] localStorage 中有 `auth_token`
- [ ] Token 未过期（可以访问 `/api/auth/me`）
- [ ] 浏览器 Console 没有错误信息
- [ ] Network 标签中请求包含 `Authorization` header

## 🚀 快速修复命令

在浏览器 Console 中执行：

```javascript
// 1. 检查登录状态
console.log('Token:', localStorage.getItem('auth_token') ? '✅ 存在' : '❌ 不存在');

// 2. 测试认证
fetch('https://ecommerce-api.xyvn.workers.dev/api/auth/me', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
  }
})
.then(r => r.json())
.then(data => {
  if (data.error) {
    console.error('❌ 认证失败:', data.error);
    console.log('👉 请重新登录: https://seedlight.tech/login');
  } else {
    console.log('✅ 认证成功:', data);
  }
});

// 3. 如果需要，清除并重新登录
// localStorage.clear();
// window.location.href = '/login';
```

---

**创建时间**: 2026-02-23
**问题**: 支付创建返回 Unauthorized
**最可能原因**: 未登录或 token 过期
**快速解决**: 重新登录
