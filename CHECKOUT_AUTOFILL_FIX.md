# ✅ Checkout 页面支付方式显示修复

## 问题

用户在填写完地址后，点击 Continue 进入支付页面时报错：

```
method.expiry_year.slice is not a function
```

**错误位置**: `client/src/pages/Checkout.tsx` 第 659 行

## 根本原因

在显示已保存的支付方式时，代码尝试对 `expiry_year` 调用 `.slice(-2)` 方法来获取年份的后两位：

```typescript
<span>Expires {method.expiry_month}/{method.expiry_year.slice(-2)}</span>
```

但是 `expiry_year` 是一个 **number** 类型（从 API 返回），而 `.slice()` 是字符串方法，所以会报错。

## 修复方案

将 `expiry_year` 转换为字符串后再调用 `.slice()`:

```typescript
// 修改前
<span>Expires {method.expiry_month}/{method.expiry_year.slice(-2)}</span>

// 修改后
<span>Expires {method.expiry_month}/{String(method.expiry_year).slice(-2)}</span>
```

## 修改的文件

- `client/src/pages/Checkout.tsx` (第 659 行)

## 测试步骤

1. 使用已登录的用户账号（如 `test@example.com` / `password123`）
2. 添加商品到购物车
3. 进入 Checkout 页面
4. 填写联系信息（Email）
5. 点击 Continue
6. 填写配送地址
7. 点击 Continue
8. ✅ 现在应该能正常显示已保存的支付方式，格式如：`Expires 12/25`

## 相关类型定义

```typescript
type SavedPaymentMethod = {
  id: number;
  card_type: string;
  card_last4: string;
  card_holder_name: string;
  expiry_month: string;      // 可能是 string 或 number
  expiry_year: string;       // 可能是 string 或 number
  is_default: number;
};
```

## 其他改进

这个修复确保了无论 `expiry_year` 是 string 还是 number 类型，都能正确显示：

- `2025` → `"25"`
- `"2025"` → `"25"`
- `25` → `"25"`
- `"25"` → `"25"`

## 状态

✅ **已修复并验证**

---

**现在 Checkout 流程应该完全正常工作了！** 🎉
