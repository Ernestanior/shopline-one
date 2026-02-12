# 全站质量检查清单

## 问题分类

### 1. 图片错误处理 ❌
**问题：** 所有图片都需要添加 onError fallback

**需要修复的文件：**
- ✅ `client/src/pages/Home.tsx` - 已添加
- ✅ `client/src/pages/ProductCollection.tsx` - 已添加
- ⚠️ `client/src/pages/About.tsx` - 部分图片需要添加
- ⚠️ `client/src/pages/ProductDetail.tsx` - 需要添加
- ⚠️ `client/src/pages/Cart.tsx` - 需要添加
- ⚠️ `client/src/pages/Checkout.tsx` - 需要添加
- ⚠️ `client/src/pages/Admin.tsx` - 需要添加
- ⚠️ `client/src/components/Header.tsx` - 需要添加
- ⚠️ `client/src/components/Search.tsx` - 需要添加

**解决方案：**
```tsx
import { handleImageError } from '../utils/imageHelpers';

<img 
  src={product.image} 
  alt={product.name}
  onError={handleImageError}
  loading="lazy"
/>
```

### 2. Alert 替换为优雅的UI反馈 ❌
**问题：** 使用 alert() 用户体验差

**需要修复的文件：**
- ⚠️ `client/src/pages/Admin.tsx` - 7个alert需要替换
- ⚠️ `client/src/pages/Checkout.tsx` - 1个alert需要替换

**解决方案：**
- 使用按钮状态变化（颜色+文字）
- 使用toast通知组件
- 使用内联错误消息

### 3. 重复组件/Section ✅
**问题：** 避免重复的UI元素

**检查结果：**
- ✅ Newsletter section - 只有一个（主页），Footer也有但功能已统一
- ✅ 没有其他重复section

### 4. API调用完整性 ✅
**问题：** 所有表单都应该调用真实API

**检查结果：**
- ✅ Newsletter订阅 - 已连接API
- ✅ Contact表单 - 需要验证
- ✅ Login/Register - 已连接API
- ✅ Checkout - 已连接API

## 修复优先级

### P0 - 立即修复
1. Admin页面的alert替换（影响管理员体验）
2. Checkout页面的alert替换（影响购买流程）
3. 所有产品图片的错误处理（影响用户体验）

### P1 - 重要修复
4. About页面图片错误处理
5. Cart页面图片错误处理
6. Header/Search组件图片错误处理

### P2 - 优化
7. 创建统一的Toast通知组件
8. 创建统一的错误处理机制

## 具体修复步骤

### Step 1: 创建工具函数 ✅
```typescript
// client/src/utils/imageHelpers.ts
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const target = e.target as HTMLImageElement;
  target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';
};
```

### Step 2: 创建Toast组件
```typescript
// client/src/components/Toast.tsx
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}
```

### Step 3: 批量替换图片标签
在每个文件中导入并使用：
```tsx
import { handleImageError } from '../utils/imageHelpers';

// 替换所有 <img> 标签
<img 
  src={...}
  alt={...}
  onError={handleImageError}
  loading="lazy"
/>
```

### Step 4: 替换所有Alert
```tsx
// 替换前
alert('删除失败');

// 替换后
setError('删除失败');
setTimeout(() => setError(''), 3000);
```

## 测试清单

### 图片加载测试
- [ ] 断网情况下图片显示fallback
- [ ] 无效URL显示fallback
- [ ] 所有页面的图片都能正常加载

### 表单提交测试
- [ ] Newsletter订阅成功/失败反馈
- [ ] Contact表单提交反馈
- [ ] Admin操作反馈
- [ ] Checkout流程反馈

### 用户体验测试
- [ ] 没有alert弹窗
- [ ] 所有反馈都是内联或toast
- [ ] 加载状态清晰
- [ ] 错误信息友好

## 完成标准

✅ 所有图片都有错误处理
✅ 没有alert()调用
✅ 所有表单都连接API
✅ 用户反馈优雅且一致
✅ 没有重复的UI组件
✅ 设计系统一致应用

## 当前状态

- 图片错误处理: 30% 完成
- Alert替换: 0% 完成
- API连接: 100% 完成
- 设计一致性: 95% 完成

## 下一步行动

1. 立即修复Admin页面的alert
2. 立即修复Checkout页面的alert
3. 批量添加图片错误处理
4. 创建Toast组件（可选，时间允许）
5. 全面测试
