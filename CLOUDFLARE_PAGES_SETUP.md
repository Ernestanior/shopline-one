# Cloudflare Pages 部署配置

## 问题
部署失败，错误信息：
```
npm error enoent Could not read package.json: Error: ENOENT: no such file or directory, open '/opt/buildhome/repo/package.json'
```

## 原因
这是一个 monorepo 项目，前端代码在 `client` 文件夹中，但 Cloudflare Pages 默认在根目录查找 `package.json`。

## 解决方案

### 方法 1: 在 Cloudflare Pages Dashboard 中配置（推荐）

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 Pages 项目设置
3. 找到 "Build & deployments" 设置
4. 配置以下选项：

   **Build configuration:**
   - Framework preset: `Create React App`
   - Build command: `npm run build`
   - Build output directory: `build`
   - Root directory: `client` ⬅️ **重要！设置为 client**
   
   **Environment variables:**
   - `NODE_VERSION`: `22`
   - `REACT_APP_API_URL`: `https://ecommerce-api.xyvn.workers.dev`

5. 保存并重新部署

### 方法 2: 使用配置文件

已创建 `.cloudflare-pages.json` 文件（但 Cloudflare Pages 可能不支持此文件）

### 方法 3: 使用 wrangler.toml（如果使用 Wrangler CLI）

在项目根目录创建 `wrangler.toml`:

```toml
name = "shopline-one-frontend"
pages_build_output_dir = "client/build"

[build]
command = "cd client && npm install && npm run build"
cwd = "/"

[build.upload]
format = "service-worker"
```

## 推荐配置

### Cloudflare Pages Dashboard 设置

```
Framework preset: Create React App
Build command: npm run build
Build output directory: build
Root directory (path to project): client
Node version: 22
```

### 环境变量

**Production:**
```
NODE_VERSION=22
REACT_APP_API_URL=https://ecommerce-api.xyvn.workers.dev
```

**Preview:**
```
NODE_VERSION=22
REACT_APP_API_URL=https://ecommerce-api.xyvn.workers.dev
```

## 验证步骤

1. 检查 Root directory 设置为 `client`
2. 检查 Build command 为 `npm run build`
3. 检查 Build output directory 为 `build`
4. 检查环境变量已设置
5. 触发新的部署

## 常见问题

### Q: 为什么不能在根目录添加 package.json？
A: 这是一个 monorepo，包含前端 (client) 和后端 (workers/server)，每个都有自己的 package.json。

### Q: 如何手动触发部署？
A: 
1. 在 Cloudflare Pages Dashboard 中点击 "Create deployment"
2. 或者推送代码到 GitHub 触发自动部署

### Q: 部署后还是失败怎么办？
A: 
1. 检查部署日志
2. 确认 Root directory 设置正确
3. 确认环境变量已设置
4. 尝试清除缓存并重新部署

## 部署流程

```bash
# 1. 提交代码
git add .
git commit -m "fix: configure Cloudflare Pages deployment"
git push origin main

# 2. Cloudflare Pages 会自动检测并部署
# 或者在 Dashboard 中手动触发部署
```

## 项目结构

```
shopline-one/
├── client/              ← 前端代码（React）
│   ├── package.json
│   ├── public/
│   └── src/
├── server/              ← Node.js 后端
│   └── package.json
├── workers/             ← Cloudflare Workers API
│   ├── package.json
│   └── wrangler.toml
└── README.md
```

## 成功部署的标志

部署日志应该显示：
```
✓ Cloning repository
✓ Installing dependencies (client/package.json)
✓ Building application
✓ Uploading build output
✓ Deployment complete
```

## 联系支持

如果问题仍然存在：
1. 检查 Cloudflare Pages 文档
2. 查看部署日志的完整错误信息
3. 确认 GitHub 仓库权限正确
