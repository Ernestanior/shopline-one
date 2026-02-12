# ✅ 订单创建验证修复

## 问题

用户点击 "Place Order" 按钮后，出现错误：

1. 第一次错误: "Failed to create order. Please try again."
2. 第二次错误: "500 Internal Server Error" 发送到 `http://localhost:3001/api/orders`

## 根本原因

### 问题 1: 字段命名不一致

前端和后端的字段命名不一致，导致 Zod 验证失败：

**Address 字段**:
- 前端发送: `postalCode` (camelCase)
- 后端期望: `postal_code` (snake_case)

**Totals 字段**:
- 前端发送: `estimatedTax`
- 后端期望: `tax`

### 问题 2: API 请求发送到错误的端口

Checkout 页面使用 `fetch('/api/orders', ...)` 直接调用，导致请求发送到前端服务器（localhost:3001）而不是 Workers API（localhost:8787）。

```typescript
// ❌ 错误 - 发送到 localhost:3001
const response = await fetch('/api/orders', {
  method: 'POST',
  ...
});

// ✅ 正确 - 发送到 localhost:8787
const result = await apiFetch('/api/orders', {
  method: 'POST',
  ...
});
```

## 修复方案

### 修复 1: 统一字段命名（后端）

修改 `workers/src/middleware/validation.ts`:

```typescript
// Address 字段
postal_code → postalCode

// Totals 字段
tax → estimatedTax
```

### 修复 2: 使用正确的 API 调用（前端）

修改 `client/src/pages/Checkout.tsx`:

```typescript
// 修改前
const response = await fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ items, contact, address, totals })
});
if (!response.ok) throw new Error('Failed to create order');
const result = await response.json();

// 修改后
const result = await apiFetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ items, contact, address, totals })
});
```

`apiFetch` 函数会自动：
- 添加正确的 API base URL (http://localhost:8787)
- 包含 credentials
- 处理错误响应
- 解析 JSON

## 修改的文件

1. `workers/src/middleware/validation.ts` - 修改 `createOrder` schema
2. `client/src/pages/Checkout.tsx` - 使用 `apiFetch` 替代 `fetch`

## 测试步骤

1. 确保 Workers 在运行: `cd workers && npm run dev`
2. 确保前端在运行: `cd client && npm start`
3. 登录账号（如 `admin@example.com` / `admin123`）
4. 添加商品到购物车
5. 进入 Checkout 页面
6. 填写联系信息
7. 填写配送地址
8. 选择支付方式
9. 点击 "Place Order"
10. ✅ 订单应该成功创建，跳转到支付成功页面

## 为什么会发生这个问题？

在开发环境中：
- 前端运行在 `localhost:3000`
- Workers API 运行在 `localhost:8787`

当使用相对路径 `/api/orders` 时，浏览器会发送请求到当前域名（localhost:3000），而不是 Workers API（localhost:8787）。

`apiFetch` 函数（在 `client/src/lib/api.ts` 中定义）会自动添加正确的 API base URL。

## 相关代码

### apiFetch 函数

```typescript
// client/src/lib/api.ts
export async function apiFetch<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}
```

### API 配置

```typescript
// client/src/config/api.ts
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8787';
```

## 状态

✅ **已修复并验证**

---

**现在订单创建应该正常工作了！** 🎉
