# 部署指南 (Deployment Guide)

## 问题原因
你看到旧的类别（Mobility, Productivity, Sanctuary, Savoriness）是因为：
1. 后端API返回的是旧的类别数据
2. 浏览器缓存了旧的前端代码

## 解决步骤

### 步骤 1: 更新后端代码

已更新的文件：
- ✅ `server/validators.js` - 验证器现在只接受 'ebooks'
- ✅ `workers/src/routes/products.ts` - API返回新的类别
- ✅ `workers/src/routes/public.ts` - 公共API返回新的类别

### 步骤 2: 重新部署后端

如果你使用的是 Cloudflare Workers:
```bash
cd workers
npm run deploy
```

如果你使用的是 Node.js 服务器:
```bash
# 重启服务器
pm2 restart all
# 或
npm run start
```

### 步骤 3: 清理并重新构建前端

```bash
cd client

# 清理旧的构建文件
rm -rf build
rm -rf node_modules/.cache

# 重新构建
npm run build
```

### 步骤 4: 部署前端

上传 `client/build` 文件夹到你的服务器或CDN

### 步骤 5: 清除缓存

1. **清除CDN缓存**（如果使用）
   - Cloudflare: 在Dashboard中点击 "Purge Everything"
   - 其他CDN: 查看相应文档

2. **清除浏览器缓存**
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`
   - 或者使用无痕模式测试

### 步骤 6: 验证部署

1. 打开浏览器开发者工具 (F12)
2. 转到 Network 标签
3. 刷新页面
4. 检查 `/api/categories` 请求的响应
5. 应该看到：
```json
[
  {
    "id": "ebooks",
    "name": "E-books",
    "description": "Technical guides and learning resources"
  }
]
```

## 快速部署脚本

使用提供的 `deploy.sh` 脚本：

```bash
chmod +x deploy.sh
./deploy.sh
```

## 常见问题

### Q: 我已经部署了，但还是看到旧的类别
A: 
1. 确认后端已重启
2. 强制刷新浏览器 (Ctrl+Shift+R)
3. 清除CDN缓存
4. 尝试无痕模式

### Q: API返回404错误
A: 检查后端服务器是否正常运行

### Q: 页面显示空白
A: 
1. 检查浏览器控制台的错误信息
2. 确认所有文件都已正确上传
3. 检查服务器配置（需要支持SPA路由）

## 数据库更新（如果需要）

如果你的数据库中有旧的产品数据，需要更新它们的类别：

```sql
-- 将所有产品的类别更新为 'ebooks'
UPDATE products SET category = 'ebooks';

-- 或者删除所有旧产品，重新添加
DELETE FROM products;
```

## 检查清单

- [ ] 后端代码已更新
- [ ] 后端已重新部署/重启
- [ ] 前端代码已清理并重新构建
- [ ] 前端已上传到服务器
- [ ] CDN缓存已清除
- [ ] 浏览器缓存已清除
- [ ] API返回正确的类别数据
- [ ] 导航栏显示 "E-books" 而不是旧类别

## 联系支持

如果问题仍然存在，请检查：
1. 浏览器控制台的错误信息
2. 网络请求的响应数据
3. 服务器日志
