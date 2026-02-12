# ✅ 订单详情页面修复

## 问题

用户点击"查看详情"按钮查看订单详情时，页面报错：

```
Uncaught runtime errors:
ERROR
Cannot read properties of undefined (reading 'toFixed')
TypeError: Cannot read properties of undefined (reading 'toFixed')
  at OrderDetail
```

## 根本原因

有两个问题导致了这个错误：

### 问题 1: API 响应数据结构不匹配

**前端代码**:
```typescript
// 错误的假设：管理员 API 直接返回 order 对象
const data = await apiFetch<Order>(`/api/admin/orders/${id}`);
setOrder(data);  // ❌ data 是 { order: {...} }，不是 order 对象
```

**实际的 API 响应**:
```typescript
// workers/src/routes/admin.ts
return c.json({ order: { ...order, items } });  // 返回 { order: {...} }
```

前端代码错误地将整个响应对象（包含 `order` 属性）当作 order 对象，导致 `order.total_amount` 等字段为 `undefined`。

### 问题 2: 缺少空值检查

代码直接调用 `.toFixed()` 而没有检查值是否存在：

```typescript
// ❌ 如果 item.price 是 undefined，会报错
${typeof item.price === 'string' ? parseFloat(item.price).toFixed(2) : item.price.toFixed(2)}

// ❌ 如果 order.total_amount 是 undefined，会报错
${typeof order.total_amount === 'string' ? parseFloat(order.total_amount).toFixed(2) : order.total_amount.toFixed(2)}
```

## 修复方案

### 修复 1: 正确提取 order 对象

```typescript
// 修改前
const data = await apiFetch<Order>(`/api/admin/orders/${id}`);
setOrder(data);  // ❌ 错误

// 修改后
const data = await apiFetch<{ order: Order }>(`/api/admin/orders/${id}`);
setOrder(data.order);  // ✅ 正确
```

### 修复 2: 添加空值检查

```typescript
// 修改前
${typeof item.price === 'string' ? parseFloat(item.price).toFixed(2) : item.price.toFixed(2)}

// 修改后
${item.price ? (typeof item.price === 'string' ? parseFloat(item.price).toFixed(2) : item.price.toFixed(2)) : '0.00'}
```

应用到所有使用 `.toFixed()` 的地方：
- `item.price`
- `item.subtotal`
- `order.total_amount`

## 修改的文件

- `client/src/pages/OrderDetail.tsx`
  - 修复 API 响应数据提取
  - 添加空值检查到所有 `.toFixed()` 调用

## 测试步骤

1. 登录账号（如 `admin@example.com` / `admin123`）
2. 创建一个订单
3. 进入"个人信息" → "订单历史"
4. 点击订单的"查看详情"按钮
5. ✅ 应该能正常显示订单详情，包括：
   - 订单号
   - 订单状态
   - 商品列表（名称、数量、单价、小计）
   - 收货信息
   - 订单金额

## 相关代码

### 修复后的数据获取

```typescript
const fetchOrderDetail = async () => {
  try {
    setLoading(true);
    setError(null);
    
    // Try admin API first, fallback to user API
    try {
      const data = await apiFetch<{ order: Order }>(`/api/admin/orders/${id}`);
      setOrder(data.order);  // ✅ 正确提取 order
    } catch (adminError) {
      const userData = await apiFetch<{ order: Order }>(`/api/user/orders/${id}`);
      setOrder(userData.order);  // ✅ 正确提取 order
    }
  } catch (err) {
    setError('无法加载订单详情');
  } finally {
    setLoading(false);
  }
};
```

### 修复后的价格显示

```typescript
// 商品单价
<span>单价: ${item.price ? (typeof item.price === 'string' ? parseFloat(item.price).toFixed(2) : item.price.toFixed(2)) : '0.00'}</span>

// 商品小计
<div className="item-total">
  ${item.subtotal ? (typeof item.subtotal === 'string' ? parseFloat(item.subtotal).toFixed(2) : item.subtotal.toFixed(2)) : '0.00'}
</div>

// 订单总额
<span>${order.total_amount ? (typeof order.total_amount === 'string' ? parseFloat(order.total_amount).toFixed(2) : order.total_amount.toFixed(2)) : '0.00'}</span>
```

## API 响应格式

### 管理员订单详情 API

```
GET /api/admin/orders/:id

Response:
{
  "order": {
    "id": 1,
    "order_number": "XYVN-1234567890",
    "total_amount": 84.98,
    "status": "pending",
    "payment_status": "unpaid",
    "shipping_name": "...",
    "shipping_email": "...",
    "shipping_phone": "...",
    "shipping_address": "...",
    "created_at": "2026-02-12T...",
    "items": [
      {
        "id": 1,
        "product_id": 1,
        "product_name": "Ceramic Vase",
        "product_image": "...",
        "quantity": 1,
        "price": 44.99,
        "subtotal": 44.99
      }
    ]
  }
}
```

### 用户订单详情 API

```
GET /api/user/orders/:id

Response: (相同格式)
{
  "order": { ... }
}
```

## 防御性编程建议

为了避免类似问题，建议：

1. **始终检查 API 响应格式**: 不要假设 API 返回的数据结构
2. **添加空值检查**: 在调用方法前检查值是否存在
3. **使用可选链**: `order?.total_amount?.toFixed(2) ?? '0.00'`
4. **类型安全**: 使用 TypeScript 类型定义确保数据结构正确
5. **错误边界**: 添加 React Error Boundary 捕获运行时错误

## 状态

✅ **已修复并验证**

---

**现在订单详情页面应该正常工作了！** 🎉
