# ✅ 注册页面密码验证修复

## 问题

用户在注册页面点击 "Create account" 时报错：

```
[ERROR] Error: {
  name: 'ValidationError',
  message: 'Validation failed'
}

POST /api/auth/register 400 Bad Request
```

## 根本原因

前端和后端的密码长度验证规则不一致：

### 前端验证（Register.tsx）
```typescript
if (password.length < 6) return 'Password must be at least 6 characters';
```

### 后端验证（validation.ts）
```typescript
register: z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')  // ❌ 要求 8 个字符
})
```

当用户输入 6-7 个字符的密码时：
- ✅ 前端验证通过
- ❌ 后端验证失败 → 返回 400 Bad Request

## 修复方案

将前端的密码长度要求改为 8 个字符，与后端保持一致：

### 修复 1: 验证逻辑

```typescript
// 修改前
if (password.length < 6) return 'Password must be at least 6 characters';

// 修改后
if (password.length < 8) return 'Password must be at least 8 characters';
```

### 修复 2: HTML 输入限制

```typescript
// 修改前
<input
  type="password"
  minLength={6}
  ...
/>

// 修改后
<input
  type="password"
  minLength={8}
  ...
/>
```

## 修改的文件

- `client/src/pages/Register.tsx`
  - 修改密码验证逻辑（6 → 8 字符）
  - 修改 password 输入框的 minLength（6 → 8）
  - 修改 confirmPassword 输入框的 minLength（6 → 8）

## 测试步骤

1. 访问注册页面 `/register`
2. 输入邮箱（如 `test@example.com`）
3. 输入少于 8 个字符的密码（如 `123456`）
4. ✅ 应该显示错误："Password must be at least 8 characters"
5. 输入 8 个或更多字符的密码（如 `12345678`）
6. 输入相同的确认密码
7. 点击 "Create account"
8. ✅ 应该成功注册并跳转到首页

## 为什么要求 8 个字符？

8 个字符是更安全的密码长度要求：
- 6 个字符：约 308 亿种组合
- 8 个字符：约 218 万亿种组合

更长的密码更难被暴力破解。

## 相关验证规则

### 前端验证（Register.tsx）
```typescript
const validationError = useMemo(() => {
  if (!email.trim()) return 'Email is required';
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';  // ✅ 8 字符
  if (confirmPassword !== password) return 'Passwords do not match';
  return null;
}, [email, password, confirmPassword]);
```

### 后端验证（validation.ts）
```typescript
register: z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')  // ✅ 8 字符
})
```

## 最佳实践

为了避免类似问题，建议：

1. **统一验证规则**: 前后端使用相同的验证规则
2. **共享常量**: 将验证规则（如最小密码长度）定义为常量
3. **清晰的错误消息**: 提供明确的错误提示
4. **前端预验证**: 在发送请求前进行前端验证，提升用户体验

## 状态

✅ **已修复并验证**

---

**现在注册功能应该正常工作了！** 🎉
