# seedlight.tech 域名配置步骤

## 🎯 目标
将 seedlight.tech 从 Bluehost 指向 Cloudflare Pages 项目（shopline-one.pages.dev）

## ⏱️ 预计时间
- 配置时间：10 分钟
- 生效时间：5-30 分钟

---

## 第一步：在 Cloudflare Pages 添加自定义域名

### 1.1 登录 Cloudflare Dashboard
访问：https://dash.cloudflare.com

### 1.2 进入你的 Pages 项目
1. 点击左侧菜单 **Workers & Pages**
2. 找到并点击 **shopline-one** 项目

### 1.3 添加自定义域名
1. 点击 **Custom domains** 标签
2. 点击 **Set up a custom domain** 按钮
3. 输入：`seedlight.tech`
4. 点击 **Continue**

### 1.4 记录 Cloudflare 提供的信息
Cloudflare 会显示需要配置的 DNS 记录，通常是：
- **CNAME 记录**指向 `shopline-one.pages.dev`

**保持这个页面打开**，我们稍后需要验证。

---

## 第二步：在 Bluehost 配置 DNS

### 2.1 登录 Bluehost
访问：https://my.bluehost.com

### 2.2 进入域名管理
1. 在控制面板中找到 **Domains** 或 **域名**
2. 找到 **seedlight.tech**
3. 点击域名旁边的 **Manage** 或 **管理**

### 2.3 进入 DNS 设置
1. 找到 **DNS** 或 **Advanced DNS** 标签
2. 点击进入 DNS 管理页面

### 2.4 配置根域名（seedlight.tech）

#### 选项 A：如果 Bluehost 支持根域名 CNAME（推荐）

**删除或禁用现有的 A 记录：**
- 找到 Host 为 `@` 或 `seedlight.tech` 的 A 记录
- 点击删除或禁用

**添加新的 CNAME 记录：**
```
Type: CNAME
Host: @ (或留空，或 seedlight.tech)
Points to: shopline-one.pages.dev
TTL: 自动 (或 3600)
```

#### 选项 B：如果不支持根域名 CNAME（使用 A 记录）

如果 Bluehost 不允许根域名使用 CNAME，需要使用 A 记录。

**先在 Cloudflare 获取 IP 地址：**
1. 返回 Cloudflare Pages 的 Custom domains 页面
2. 如果显示需要 A 记录，Cloudflare 会提供 IP 地址

**在 Bluehost 添加 A 记录：**
```
Type: A
Host: @ (或留空)
Points to: [Cloudflare 提供的 IP 地址]
TTL: 自动 (或 3600)
```

### 2.5 配置 www 子域名（可选但推荐）

**添加 www 的 CNAME 记录：**
```
Type: CNAME
Host: www
Points to: shopline-one.pages.dev
TTL: 自动 (或 3600)
```

这样用户访问 www.seedlight.tech 也能正常工作。

### 2.6 保存更改
点击 **Save** 或 **Add Record** 保存所有 DNS 配置。

---

## 第三步：等待 DNS 传播

### 3.1 DNS 传播时间
- 通常：5-30 分钟
- 最长：24-48 小时

### 3.2 检查 DNS 传播状态

**方法 1：使用在线工具**
访问：https://dnschecker.org
- 输入：`seedlight.tech`
- 查看全球各地的 DNS 解析结果

**方法 2：使用命令行（macOS/Linux）**
```bash
# 查询域名解析
nslookup seedlight.tech

# 或使用 dig
dig seedlight.tech

# 查询 CNAME 记录
dig seedlight.tech CNAME
```

**期望结果：**
- 应该看到指向 `shopline-one.pages.dev` 的 CNAME 记录
- 或者看到 Cloudflare 的 IP 地址

---

## 第四步：在 Cloudflare 验证域名

### 4.1 返回 Cloudflare Pages
回到 Cloudflare Dashboard 的 Custom domains 页面

### 4.2 等待验证
- Cloudflare 会自动检测 DNS 配置
- 状态会从 **Pending** 变为 **Active**
- 这个过程可能需要几分钟

### 4.3 SSL 证书自动配置
- Cloudflare 会自动为 seedlight.tech 配置免费的 SSL 证书
- 证书通常在域名激活后几分钟内就绪
- 你会看到 SSL 状态变为 **Active**

---

## 第五步：测试域名

### 5.1 访问网站
在浏览器中访问：
- https://seedlight.tech
- https://www.seedlight.tech（如果配置了 www）

### 5.2 检查 HTTPS
- 浏览器地址栏应该显示 🔒 锁图标
- 证书应该是由 Cloudflare 签发的

### 5.3 测试网站功能
- [ ] 首页正常加载
- [ ] 图片和样式正常显示
- [ ] 导航链接正常工作
- [ ] 登录/注册功能正常
- [ ] API 请求正常（检查浏览器控制台）

---

## 第六步：更新项目配置

域名生效后，需要更新项目中的配置。

### 6.1 更新 Workers API 的 CORS 配置

编辑 `workers/wrangler.toml`：

```toml
# 生产环境配置
[env.production.vars]
ALLOWED_ORIGINS = "https://seedlight.tech,https://www.seedlight.tech"
```

### 6.2 更新前端环境变量

编辑 `client/.env.production`：

```env
REACT_APP_API_URL=https://ecommerce-api.你的cloudflare账号.workers.dev
```

### 6.3 重新部署

```bash
# 1. 部署 Workers API（更新 CORS 配置）
cd workers
npx wrangler deploy --env production

# 2. 重新构建并部署前端
cd ../client
npm run build
npx wrangler pages deploy build
```

---

## 第七步：设置域名重定向（可选）

如果你同时配置了根域名和 www，建议设置重定向规则。

### 7.1 在 Cloudflare Pages 设置重定向

1. 在 shopline-one 项目中，进入 **Settings** 标签
2. 找到 **Redirects** 或 **Rules** 部分
3. 添加重定向规则：

**将 www 重定向到根域名：**
```
Source: https://www.seedlight.tech/*
Destination: https://seedlight.tech/$1
Status: 301 (Permanent)
```

或者

**将根域名重定向到 www：**
```
Source: https://seedlight.tech/*
Destination: https://www.seedlight.tech/$1
Status: 301 (Permanent)
```

---

## 常见问题排查

### ❌ 问题 1：DNS 配置后访问域名显示 404

**可能原因：**
- DNS 还在传播中
- Cloudflare 还没有验证域名

**解决方法：**
1. 等待 10-30 分钟
2. 清除浏览器缓存
3. 使用无痕模式访问
4. 检查 Cloudflare Pages 中域名状态是否为 Active

### ❌ 问题 2：显示 SSL 证书错误

**可能原因：**
- SSL 证书还在配置中

**解决方法：**
1. 等待 5-10 分钟让 SSL 证书生效
2. 在 Cloudflare Pages 的 Custom domains 中检查 SSL 状态
3. 如果超过 1 小时还没生效，尝试删除域名重新添加

### ❌ 问题 3：网站显示但 API 请求失败

**可能原因：**
- CORS 配置没有更新
- API 地址配置错误

**解决方法：**
1. 检查浏览器控制台的错误信息
2. 确认已更新 `workers/wrangler.toml` 中的 ALLOWED_ORIGINS
3. 确认已重新部署 Workers API
4. 检查 `client/.env.production` 中的 API_URL 是否正确

### ❌ 问题 4：Bluehost 不允许根域名使用 CNAME

**解决方法：**
使用 A 记录代替 CNAME：
1. 在 Cloudflare Pages 查看提供的 IP 地址
2. 在 Bluehost 添加 A 记录指向该 IP

---

## 验证清单

配置完成后，请逐项检查：

- [ ] seedlight.tech 可以正常访问
- [ ] www.seedlight.tech 可以正常访问（如果配置了）
- [ ] HTTPS 正常工作（浏览器显示锁图标）
- [ ] 网站所有页面正常加载
- [ ] 图片和静态资源正常显示
- [ ] 登录/注册功能正常
- [ ] 购物车功能正常
- [ ] API 请求正常（无 CORS 错误）
- [ ] 在不同设备和浏览器上测试正常

---

## 回滚方案

如果配置后出现问题，可以快速回滚：

### 方法 1：在 Bluehost 改回原 DNS 配置
1. 登录 Bluehost
2. 进入 seedlight.tech 的 DNS 管理
3. 删除新添加的 CNAME 记录
4. 恢复原来的 A 记录配置
5. 等待 5-30 分钟生效

### 方法 2：在 Cloudflare 暂时禁用域名
1. 登录 Cloudflare Pages
2. 进入 Custom domains
3. 删除 seedlight.tech
4. 网站会恢复使用 shopline-one.pages.dev

---

## 下一步

域名配置完成后，你可能还想：

1. **配置邮件服务**
   - 如果需要使用 @seedlight.tech 的邮箱
   - 在 Bluehost 的 DNS 中保留 MX 记录

2. **设置网站分析**
   - 添加 Google Analytics
   - 配置 Cloudflare Web Analytics

3. **优化性能**
   - 在 Cloudflare 中启用缓存规则
   - 配置 CDN 加速

4. **添加支付功能**
   - 按照之前创建的台湾支付网关规格文档实现

---

## 需要帮助？

如果在配置过程中遇到问题：

1. 检查 Cloudflare Pages 的状态页面
2. 查看 Bluehost 的 DNS 配置是否正确
3. 使用 dnschecker.org 检查 DNS 传播
4. 随时告诉我遇到的具体错误信息

祝配置顺利！🚀
