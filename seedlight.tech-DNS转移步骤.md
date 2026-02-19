# seedlight.tech DNS 转移到 Cloudflare 详细步骤

## 📌 重要说明

**DNS Transfer ≠ 域名转移**

- ✅ 域名注册商：**还是 Bluehost**（域名续费还在 Bluehost）
- ✅ DNS 管理：转到 **Cloudflare**（只是改变 DNS 服务器）
- ✅ 域名所有权：**完全属于你**，随时可以改回去

这就像把你的通讯录从一个手机转到另一个手机，但手机号码还是你的。

---

## 🎯 完整操作步骤

### 第一步：将 seedlight.tech 添加到 Cloudflare

#### 1.1 登录 Cloudflare Dashboard
访问：https://dash.cloudflare.com

#### 1.2 添加站点
1. 点击右上角的 **Add a Site** 或 **添加站点**
2. 输入：`seedlight.tech`
3. 点击 **Continue** 或 **继续**

#### 1.3 选择计划
1. 选择 **Free** 免费计划（完全够用）
2. 点击 **Continue**

#### 1.4 Cloudflare 扫描 DNS 记录
- Cloudflare 会自动扫描你在 Bluehost 的现有 DNS 记录
- 等待扫描完成（通常 30 秒到 1 分钟）

#### 1.5 检查导入的 DNS 记录
1. Cloudflare 会显示扫描到的所有 DNS 记录
2. **仔细检查**这些记录是否正确
3. 如果有重要的记录（如邮件 MX 记录），确保它们都在列表中
4. 点击 **Continue**

---

### 第二步：更改 Nameservers（关键步骤）

#### 2.1 Cloudflare 显示 Nameservers

Cloudflare 会显示两个 nameserver 地址，类似这样：
```
alexa.ns.cloudflare.com
brad.ns.cloudflare.com
```

**⚠️ 重要：记下这两个地址，我们马上要用到！**

#### 2.2 登录 Bluehost
访问：https://my.bluehost.com

#### 2.3 进入域名管理
1. 在控制面板中找到 **Domains** 或**域名**
2. 找到 **seedlight.tech**
3. 点击域名旁边的 **Manage** 或**管理**

#### 2.4 找到 Nameservers 设置
1. 在域名管理页面中找到 **Nameservers** 部分
2. 可能显示为：
   - "Name Servers"
   - "DNS Nameservers"
   - "域名服务器"

#### 2.5 更改为 Custom Nameservers
1. 当前可能显示 "Bluehost Nameservers" 或类似选项
2. 选择 **Use Custom Nameservers** 或**使用自定义域名服务器**
3. 删除现有的 Bluehost nameservers
4. 输入 Cloudflare 提供的两个 nameserver：
   ```
   alexa.ns.cloudflare.com
   brad.ns.cloudflare.com
   ```
   （使用 Cloudflare 实际显示给你的地址）

#### 2.6 保存更改
1. 点击 **Save** 或**保存**
2. Bluehost 可能会显示警告，确认继续

---

### 第三步：等待 Nameserver 更改生效

#### 3.1 传播时间
- 通常：2-4 小时
- 最长：24-48 小时
- Cloudflare 会通过邮件通知你

#### 3.2 在 Cloudflare 检查状态
1. 返回 Cloudflare Dashboard
2. 选择 seedlight.tech
3. 查看顶部的状态提示
4. 状态会从 **Pending** 变为 **Active**

#### 3.3 检查 Nameserver 传播

**使用在线工具：**
访问：https://www.whatsmydns.net
- 输入：`seedlight.tech`
- 选择类型：`NS`（Nameserver）
- 查看全球各地的 nameserver 解析结果
- 应该看到 Cloudflare 的 nameservers

**使用命令行：**
```bash
# macOS/Linux
dig seedlight.tech NS

# 或
nslookup -type=NS seedlight.tech
```

---

### 第四步：在 Cloudflare 配置 DNS 记录

一旦 nameserver 生效，就可以配置 DNS 了。

#### 4.1 进入 DNS 管理
1. 在 Cloudflare Dashboard 中选择 seedlight.tech
2. 点击左侧菜单的 **DNS** → **Records**

#### 4.2 删除或修改现有记录

如果有指向旧网站的 A 记录或 CNAME 记录，需要删除或修改它们。

#### 4.3 添加指向 Cloudflare Pages 的记录

**为根域名添加 CNAME 记录：**
1. 点击 **Add record**
2. 配置如下：
   ```
   Type: CNAME
   Name: @ (或 seedlight.tech)
   Target: shopline-one.pages.dev
   Proxy status: Proxied (橙色云朵图标)
   TTL: Auto
   ```
3. 点击 **Save**

**为 www 子域名添加 CNAME 记录：**
1. 点击 **Add record**
2. 配置如下：
   ```
   Type: CNAME
   Name: www
   Target: shopline-one.pages.dev
   Proxy status: Proxied (橙色云朵图标)
   TTL: Auto
   ```
3. 点击 **Save**

**⚠️ 重要：确保 Proxy status 是 Proxied（橙色云朵），这样才能使用 Cloudflare 的 CDN 和安全功能。**

---

### 第五步：在 Cloudflare Pages 添加自定义域名

现在 DNS 已经在 Cloudflare 管理了，可以添加到 Pages 项目了。

#### 5.1 进入 Pages 项目
1. 在 Cloudflare Dashboard 中点击 **Workers & Pages**
2. 选择 **shopline-one** 项目

#### 5.2 添加自定义域名
1. 点击 **Custom domains** 标签
2. 点击 **Set up a custom domain**
3. 输入：`seedlight.tech`
4. 点击 **Continue**

#### 5.3 Cloudflare 自动配置
- 因为域名已经在 Cloudflare DNS 中，系统会自动配置
- 几秒钟后状态会变为 **Active**

#### 5.4 添加 www 域名（可选）
重复上述步骤，添加 `www.seedlight.tech`

---

### 第六步：配置 SSL/TLS

#### 6.1 进入 SSL/TLS 设置
1. 在 Cloudflare Dashboard 中选择 seedlight.tech
2. 点击左侧菜单的 **SSL/TLS**

#### 6.2 选择加密模式
选择 **Full** 或 **Full (strict)**：
- **Full**: 适合大多数情况
- **Full (strict)**: 更安全，但需要源服务器有有效证书

对于 Cloudflare Pages，选择 **Full** 即可。

#### 6.3 启用 Always Use HTTPS
1. 在 SSL/TLS 页面找到 **Edge Certificates**
2. 开启 **Always Use HTTPS**
3. 这样所有 HTTP 请求会自动重定向到 HTTPS

---

### 第七步：测试域名

#### 7.1 访问网站
在浏览器中访问：
- https://seedlight.tech
- https://www.seedlight.tech

#### 7.2 检查 SSL
- 浏览器地址栏应该显示 🔒 锁图标
- 点击锁图标查看证书详情
- 证书应该是由 Cloudflare 签发的

#### 7.3 测试网站功能
- [ ] 首页正常加载
- [ ] 图片和样式正常显示
- [ ] 导航链接正常工作
- [ ] 登录/注册功能正常
- [ ] API 请求正常

---

### 第八步：更新项目配置

#### 8.1 更新 Workers API 的 CORS 配置

编辑 `workers/wrangler.toml`：

```toml
# 生产环境配置
[env.production.vars]
ALLOWED_ORIGINS = "https://seedlight.tech,https://www.seedlight.tech"
```

#### 8.2 更新前端环境变量

编辑 `client/.env.production`：

```env
REACT_APP_API_URL=https://ecommerce-api.你的cloudflare账号.workers.dev
```

#### 8.3 重新部署

```bash
# 1. 部署 Workers API
cd workers
npx wrangler deploy --env production

# 2. 重新构建并部署前端
cd ../client
npm run build
npx wrangler pages deploy build
```

---

## 🎉 完成！

现在你的域名 seedlight.tech 已经：
- ✅ DNS 由 Cloudflare 管理（更快、更安全）
- ✅ 指向 Cloudflare Pages 项目
- ✅ 自动配置了免费 SSL 证书
- ✅ 享受 Cloudflare 的 CDN 加速和 DDoS 防护

---

## 💡 Cloudflare DNS 的优势

现在你的 DNS 由 Cloudflare 管理，你获得了：

1. **更快的 DNS 解析**：Cloudflare 是全球最快的 DNS 服务之一
2. **免费 CDN**：网站内容在全球 300+ 数据中心缓存
3. **DDoS 防护**：自动防御攻击
4. **免费 SSL**：自动续期的 SSL 证书
5. **分析工具**：免费的网站流量分析
6. **灵活的规则**：可以设置重定向、缓存规则等

---

## 🔄 如何改回去（回滚方案）

如果需要改回 Bluehost DNS：

1. 登录 Bluehost
2. 进入 seedlight.tech 的 Nameservers 设置
3. 改回 Bluehost 的 nameservers（通常是自动的）
4. 等待 2-24 小时传播

域名所有权始终是你的，随时可以改变 DNS 管理。

---

## ❓ 常见问题

### Q1: DNS Transfer 会影响域名续费吗？
**A:** 不会。域名续费还是在 Bluehost，只是 DNS 管理转到 Cloudflare。

### Q2: 邮件服务会受影响吗？
**A:** 不会。Cloudflare 会自动导入你的 MX 记录（邮件记录），邮件服务继续正常工作。

### Q3: 需要付费吗？
**A:** 不需要。Cloudflare 的免费计划完全够用，包括 CDN、SSL、DDoS 防护等。

### Q4: Nameserver 更改需要多久生效？
**A:** 通常 2-4 小时，最长 24-48 小时。Cloudflare 会发邮件通知你。

### Q5: 如果 Cloudflare 扫描不到我的 DNS 记录怎么办？
**A:** 可以手动添加。在 Cloudflare 的 DNS Records 页面点击 "Add record" 手动添加所有需要的记录。

---

## 📞 需要帮助？

如果在操作过程中遇到问题：

1. **Nameserver 不知道怎么改**：截图 Bluehost 的域名管理页面给我看
2. **DNS 记录不确定**：告诉我你的网站之前有什么功能（邮件、子域名等）
3. **配置后不生效**：使用 https://www.whatsmydns.net 检查传播状态

随时告诉我进展或遇到的问题！
