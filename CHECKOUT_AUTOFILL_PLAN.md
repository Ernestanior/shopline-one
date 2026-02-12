# Checkout自动填充功能实现计划

## 目标
在结账页面为登录用户自动填充已保存的地址和支付信息

## 实现步骤

### 1. 修改Checkout.tsx
- 添加useAuth hook获取用户状态
- 添加useEffect在页面加载时获取用户地址
- 如果有默认地址，自动填充到表单
- 添加"使用已保存的地址"选择器
- 添加"保存此地址"复选框

### 2. 地址自动填充流程
```typescript
useEffect(() => {
  if (user) {
    // 获取用户地址
    fetchAddresses();
  }
}, [user]);

const fetchAddresses = async () => {
  const data = await apiFetch('/api/user/addresses');
  const defaultAddr = data.addresses.find(a => a.is_default);
  if (defaultAddr) {
    setAddress({
      firstName: defaultAddr.first_name,
      lastName: defaultAddr.last_name,
      country: defaultAddr.country,
      city: defaultAddr.city,
      address1: defaultAddr.address1,
      address2: defaultAddr.address2,
      postalCode: defaultAddr.postal_code
    });
    setContact(prev => ({ ...prev, phone: defaultAddr.phone }));
  }
};
```

### 3. 支付方式自动填充
```typescript
const fetchPaymentMethods = async () => {
  const data = await apiFetch('/api/user/payment-methods');
  const defaultMethod = data.payment_methods.find(m => m.is_default);
  if (defaultMethod) {
    setCard({
      cardNumber: `•••• •••• •••• ${defaultMethod.card_last4}`,
      nameOnCard: defaultMethod.card_holder_name,
      expiry: `${defaultMethod.expiry_month}/${defaultMethod.expiry_year}`,
      cvc: '•••'
    });
  }
};
```

### 4. UI改进
- 添加地址选择下拉框
- 添加"使用其他地址"按钮
- 添加"保存此地址供下次使用"复选框
- 支付方式选择器

## 简化方案（当前实现）

考虑到时间和复杂度，采用简化方案：
1. ✅ 用户可以正常结账（游客或登录用户）
2. ✅ 订单自动绑定到登录用户
3. ✅ 用户可以在Account页面查看订单历史
4. ⏳ 地址和支付方式管理（UI已完成，待添加表单）
5. ⏳ 结账时自动填充（下一阶段）

## 当前状态
- ✅ 数据库表结构完成
- ✅ 后端API完成
- ✅ Account页面UI完成
- ⏳ 地址/支付方式添加表单（待实现）
- ⏳ Checkout自动填充（待实现）

## 下一步
1. 创建地址添加/编辑模态框
2. 创建支付方式添加模态框
3. 在Checkout页面集成自动填充
4. 测试完整流程
