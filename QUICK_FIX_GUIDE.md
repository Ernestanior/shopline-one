# 快速修复指南 - 最后2个小调整

## 🎯 需要手动更新的内容

所有CSS已经完成！只需要在 `client/src/pages/Home.tsx` 中做2个小调整。

---

## 1️⃣ Testimonials - 添加星级和头像

### 位置
文件：`client/src/pages/Home.tsx`
行数：约444-472行
搜索：`testimonial-card`

### 需要更新的3个卡片

#### 卡片1 - A. Lin
**查找这段代码：**
```tsx
<div className="testimonial-card">
  <div className="testimonial-quote">"The finish is unreal. It's the kind of tool you want to keep on your desk."</div>
  <div className="testimonial-meta">
    <span className="testimonial-name">A. Lin</span>
    <span className="testimonial-sep">—</span>
    <span className="testimonial-role">Productivity</span>
  </div>
</div>
```

**替换为：**
```tsx
<div className="testimonial-card">
  <div className="testimonial-stars">★★★★★</div>
  <div className="testimonial-quote">"The finish is unreal. It's the kind of tool you want to keep on your desk."</div>
  <div className="testimonial-meta">
    <div className="testimonial-avatar">AL</div>
    <div>
      <div className="testimonial-name">A. Lin</div>
      <div className="testimonial-role">Productivity</div>
    </div>
  </div>
</div>
```

#### 卡片2 - Y. Chen
**查找这段代码：**
```tsx
<div className="testimonial-card">
  <div className="testimonial-quote">"Minimal but not boring. Everything feels considered."</div>
  <div className="testimonial-meta">
    <span className="testimonial-name">Y. Chen</span>
    <span className="testimonial-sep">—</span>
    <span className="testimonial-role">Home & Lifestyle</span>
  </div>
</div>
```

**替换为：**
```tsx
<div className="testimonial-card">
  <div className="testimonial-stars">★★★★★</div>
  <div className="testimonial-quote">"Minimal but not boring. Everything feels considered."</div>
  <div className="testimonial-meta">
    <div className="testimonial-avatar">YC</div>
    <div>
      <div className="testimonial-name">Y. Chen</div>
      <div className="testimonial-role">Home & Lifestyle</div>
    </div>
  </div>
</div>
```

#### 卡片3 - S. Wu
**查找这段代码：**
```tsx
<div className="testimonial-card">
  <div className="testimonial-quote">"Fits perfectly in my everyday carry. Quality is better than expected."</div>
  <div className="testimonial-meta">
    <span className="testimonial-name">S. Wu</span>
    <span className="testimonial-sep">—</span>
    <span className="testimonial-role">Mobility</span>
  </div>
</div>
```

**替换为：**
```tsx
<div className="testimonial-card">
  <div className="testimonial-stars">★★★★★</div>
  <div className="testimonial-quote">"Fits perfectly in my everyday carry. Quality is better than expected."</div>
  <div className="testimonial-meta">
    <div className="testimonial-avatar">SW</div>
    <div>
      <div className="testimonial-name">S. Wu</div>
      <div className="testimonial-role">Mobility</div>
    </div>
  </div>
</div>
```

---

## 2️⃣ Value Cards - 添加图标

### 位置
文件：`client/src/pages/Home.tsx`
行数：约410-428行
搜索：`value-card`

### 需要更新的3个卡片

#### 卡片1 - Material-first
**在这行之前：**
```tsx
<div className="value-title">Material-first</div>
```

**添加：**
```tsx
<div className="value-icon">✨</div>
```

**完整代码应该是：**
```tsx
<div className="value-card">
  <div className="value-icon">✨</div>
  <div className="value-title">Material-first</div>
  <div className="value-text">Clean finishes, durable builds, and a tactile feel you'll notice every day.</div>
</div>
```

#### 卡片2 - Made to carry
**在这行之前：**
```tsx
<div className="value-title">Made to carry</div>
```

**添加：**
```tsx
<div className="value-icon">🎒</div>
```

**完整代码应该是：**
```tsx
<div className="value-card">
  <div className="value-icon">🎒</div>
  <div className="value-title">Made to carry</div>
  <div className="value-text">Slim profiles and purposeful form factors—easy to take, easy to keep.</div>
</div>
```

#### 卡片3 - Designed to last
**在这行之前：**
```tsx
<div className="value-title">Designed to last</div>
```

**添加：**
```tsx
<div className="value-icon">♾️</div>
```

**完整代码应该是：**
```tsx
<div className="value-card">
  <div className="value-icon">♾️</div>
  <div className="value-title">Designed to last</div>
  <div className="value-text">Timeless aesthetics with long-term usability. Less clutter, more calm.</div>
</div>
```

---

## ✅ 完成后

1. 保存文件
2. 刷新浏览器
3. 检查效果：
   - ⭐ Testimonials应该显示金色星星
   - 👤 Testimonials应该显示紫色渐变头像圆圈
   - ✨ Value cards应该显示emoji图标

---

## 🎨 预期效果

### Testimonials
- 顶部：金色5星评分（★★★★★）
- 中间：引用文字
- 底部：紫色渐变头像圆圈 + 姓名和角色（垂直排列）

### Value Cards
- 顶部：大号emoji图标（32px）
- 中间：粗体标题
- 底部：描述文字

---

## 💡 提示

如果你使用VS Code：
1. 按 `Cmd+F`（Mac）或 `Ctrl+F`（Windows）打开搜索
2. 搜索 `testimonial-card` 或 `value-card`
3. 逐个更新

所有CSS样式已经准备好，只需要更新HTML结构即可！
