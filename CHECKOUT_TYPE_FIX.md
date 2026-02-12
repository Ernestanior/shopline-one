# ✅ Checkout 类型定义修复

## 问题

支付成功后，页面显示 TypeScript 编译错误：

```
ERROR in src/pages/Checkout.tsx:375:11

TS2322: Type 'number | null' is not assignable to type 'number'.
Type 'null' is not assignable to type 'number'.

  373 |         const payload: LastOrder = {
  374 |           id: orderNumber,
> 375 |           orderId: orderId,
      |           ^^^^^^^
  376 |           createdAt: new Date().toISOString(),
  377 |           items: cartItems,
```

## 根本原因

`LastOrder` 类型定义中 `orderId` 字段被定义为 `number`，但实际代码中 `orderId` 可能是 `null`：

```typescript
// 代码中
const orderId = result.order?.id || null;  // 可能是 null

// 类型定义
type LastOrder = {
  orderId: number;  // ❌ 不允许 null
  // ...
};
```

当 API 响应中没有 `order.id` 时，`orderId` 会是 `null`，导致类型不匹配。

## 修复方案

将 `orderId` 字段类型改为 `number | null`：

```typescript
// 修改前
type LastOrder = {
  id: string;
  orderId: number;  // ❌ 只允许 number
  // ...
};

// 修改后
type LastOrder = {
  id: string;
  orderId: number | null;  // ✅ 允许 number 或 null
  // ...
};
```

## 修改的文件

- `client/src/pages/Checkout.tsx` - 修改 `LastOrder` 类型定义

## 为什么 orderId 可能是 null？

在订单创建过程中：

```typescript
const result = await apiFetch('/api/orders', { ... });
const orderId = result.order?.id || null;  // 如果 API 没有返回 id，则为 null
```

虽然正常情况下 API 应该返回 `order.id`，但为了代码的健壮性，我们允许 `orderId` 为 `null`。

## 状态

✅ **已修复**

---

**TypeScript 编译错误已解决！** 🎉
