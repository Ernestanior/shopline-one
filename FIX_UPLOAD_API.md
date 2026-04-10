# 图片上传API修复

## 问题
生产环境中管理员上传产品图片失败，返回404错误：
```
Request URL: https://ecommerce-api.xyvn.workers.dev/api/upload/product-image
Status Code: 404 Not Found
```

## 原因
- 开发环境使用Node.js server (`server/index.js`)，有`/api/upload/product-image`端点
- 生产环境使用Cloudflare Workers API (`workers/`)，之前没有实现上传端点
- 前端已经配置使用环境变量`REACT_APP_API_URL`，但Workers API缺少对应的路由

## 解决方案

### 1. 创建上传路由 (`workers/src/routes/upload.ts`)
实现了`POST /api/upload/product-image`端点：
- 接受`multipart/form-data`格式的图片文件
- 验证文件类型（JPEG, PNG, GIF, WebP）
- 验证文件大小（最大5MB）
- 将图片转换为base64 data URL
- 返回可以直接存储在数据库中的data URL

### 2. 注册路由 (`workers/src/index.ts`)
- 导入`uploadRoutes`
- 注册到`/api/upload`路径
- 所有上传端点都需要管理员权限

### 3. 图片存储方式
使用base64 data URL格式存储图片：
```
data:image/jpeg;base64,/9j/4AAQSkZJRg...
```

优点：
- 无需额外配置R2存储桶
- 图片直接存储在D1数据库中
- 简单易用，适合小图片（电子书封面）

限制：
- 单个图片最大5MB
- 不适合大量或大尺寸图片

### 4. 未来优化（可选）
如果需要处理更多或更大的图片，可以启用R2存储：
1. 在Cloudflare Dashboard中创建R2存储桶
2. 取消注释`wrangler.toml`中的R2配置
3. 修改上传路由使用R2存储

## 部署
```bash
cd workers
npm run deploy
```

## 测试
1. 登录管理员账号
2. 进入产品管理页面
3. 创建或编辑产品
4. 上传图片
5. 验证图片成功上传并显示

## API端点
```
POST /api/upload/product-image
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

Body:
- image: File (JPEG, PNG, GIF, WebP, max 5MB)

Response:
{
  "success": true,
  "path": "data:image/jpeg;base64,...",
  "filename": "example.jpg",
  "size": 123456,
  "type": "image/jpeg"
}
```

## 相关文件
- `workers/src/routes/upload.ts` - 上传路由实现
- `workers/src/index.ts` - 路由注册
- `client/src/pages/Admin.tsx` - 前端上传逻辑
- `client/.env.production` - 生产环境API URL配置

## 部署状态
✅ 已部署到生产环境
- Worker: https://ecommerce-api.xyvn.workers.dev
- Version: 655304ca-b0f7-46f0-8a52-7a4fa3ecf1bd
- 部署时间: 2026-04-10
