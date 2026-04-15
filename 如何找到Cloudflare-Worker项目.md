# 如何在 Cloudflare Dashboard 找到你的 Worker 项目

## 项目信息

- **Worker 名称**: `ecommerce-api`
- **部署 URL**: `https://ecommerce-api.xyvn.workers.dev`
- **账号**: siyuananior@gmail.com

## 🔍 查找步骤

### 方法 1: 直接访问 Workers & Pages

1. **打开浏览器**，访问：
   ```
   https://dash.cloudflare.com/
   ```

2. **登录账号**：siyuananior@gmail.com

3. **点击左侧菜单**：
   - 找到并点击 **Workers & Pages**
   - 或者直接访问：https://dash.cloudflare.com/[你的账号ID]/workers-and-pages

4. **查找项目**：
   - 在列表中找到名为 **ecommerce-api** 的项目
   - 如果项目很多，使用搜索框搜索 "ecommerce"

5. **点击项目名称** 进入项目详情页

### 方法 2: 通过搜索

1. 登录 Cloudflare Dashboard
2. 使用顶部的搜索框
3. 输入 "ecommerce-api"
4. 在搜索结果中点击对应的 Worker

### 方法 3: 通过 URL 直接访问

如果你知道账号 ID，可以直接访问：
```
https://dash.cloudflare.com/[账号ID]/workers/services/view/ecommerce-api
```

## 📋 项目页面说明

进入项目后，你会看到以下标签：

### 1. Overview（概览）
- 显示部署状态
- 显示 Worker URL
- 显示请求统计

### 2. Deployments（部署）
- 查看部署历史
- 查看每次部署的详情
- 可以回滚到之前的版本

### 3. Settings（设置）
这里是最重要的配置页面：

#### Variables（变量）
- **Environment Variables**: 环境变量
  - 这里可以看到 `API_URL`、`PAYMENT_ENVIRONMENT` 等
  - 但看不到 Secrets（加密的）

#### Triggers（触发器）
- 查看 Cron 定时任务
- 你的项目有一个每小时运行的任务（支付过期检查）

#### Bindings（绑定）
- **D1 Database**: 数据库绑定
  - 绑定名称: `DB`
  - 数据库名称: `ecommerce-db`

### 4. Logs（日志）
- 实时查看 Worker 运行日志
- 调试问题时很有用

### 5. Metrics（指标）
- 查看请求量、错误率等统计数据

## 🔐 查看和管理 Secrets

Secrets（密钥）不会显示在 Dashboard 中，只能通过命令行管理：

### 查看已设置的 Secrets
```bash
cd workers
wrangler secret list
```

### 设置新的 Secret
```bash
cd workers
wrangler secret put NEWEBPAY_TEST_MERCHANT_ID
# 然后输入值
```

### 删除 Secret
```bash
cd workers
wrangler secret delete NEWEBPAY_TEST_MERCHANT_ID
```

## 🎯 你需要的配置位置

### 查看蓝新金流配置

1. **Secrets（命令行）**：
   ```bash
   cd workers
   wrangler secret list
   ```
   
   应该看到：
   - `NEWEBPAY_TEST_MERCHANT_ID`
   - `NEWEBPAY_TEST_HASH_KEY`
   - `NEWEBPAY_TEST_HASH_IV`
   - `NEWEBPAY_PROD_MERCHANT_ID`
   - `NEWEBPAY_PROD_HASH_KEY`
   - `NEWEBPAY_PROD_HASH_IV`

2. **环境变量（Dashboard）**：
   - Workers & Pages → ecommerce-api → Settings → Variables
   - 查看 `PAYMENT_ENVIRONMENT`（当前是 "test"）

### 修改配置

#### 修改环境变量（非敏感信息）
1. Dashboard → Settings → Variables
2. 点击 Edit variables
3. 修改后保存
4. 会自动触发重新部署

#### 修改 Secrets（敏感信息）
只能通过命令行：
```bash
cd workers
wrangler secret put NEWEBPAY_TEST_MERCHANT_ID
# 输入新值
```

## 🖼️ 截图参考

### Dashboard 主页
```
┌─────────────────────────────────────────┐
│ Cloudflare Dashboard                    │
├─────────────────────────────────────────┤
│ 左侧菜单:                                │
│  ├─ Overview                            │
│  ├─ Analytics                           │
│  ├─ DNS                                 │
│  ├─ SSL/TLS                             │
│  ├─ Workers & Pages  ← 点这里           │
│  └─ ...                                 │
└─────────────────────────────────────────┘
```

### Workers & Pages 页面
```
┌─────────────────────────────────────────┐
│ Workers & Pages                         │
├─────────────────────────────────────────┤
│ 搜索: [ecommerce-api        ] 🔍       │
├─────────────────────────────────────────┤
│ 项目列表:                                │
│                                         │
│ ┌─────────────────────────────────┐    │
│ │ ecommerce-api          Worker   │    │
│ │ https://ecommerce-api.xyvn...   │    │
│ │ Last deployed: 2 hours ago      │    │
│ └─────────────────────────────────┘    │
│                                         │
│ ┌─────────────────────────────────┐    │
│ │ shopline-one           Pages    │    │
│ │ https://seedlight.tech          │    │
│ └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### 项目设置页面
```
┌─────────────────────────────────────────┐
│ ecommerce-api                           │
├─────────────────────────────────────────┤
│ [Overview] [Deployments] [Settings] ... │
├─────────────────────────────────────────┤
│ Settings 左侧菜单:                       │
│  ├─ General                             │
│  ├─ Variables  ← 环境变量在这里          │
│  ├─ Triggers                            │
│  ├─ Bindings                            │
│  └─ ...                                 │
└─────────────────────────────────────────┘
```

## ❓ 常见问题

### Q1: 我看不到 ecommerce-api 项目

**可能原因**：
1. 使用了错误的账号登录
2. 项目在不同的账号下
3. 项目被删除了（不太可能，因为 API 还在运行）

**解决方法**：
1. 确认登录的是 siyuananior@gmail.com
2. 检查是否有多个 Cloudflare 账号
3. 运行 `wrangler whoami` 查看当前账号

### Q2: 我看到项目了，但找不到 Secrets

**答案**：Secrets 不会显示在 Dashboard 中，只能通过命令行查看列表（看不到值）。

### Q3: 如何确认这是正确的项目？

**验证方法**：
1. 查看 Worker URL 是否是 `https://ecommerce-api.xyvn.workers.dev`
2. 访问 `https://ecommerce-api.xyvn.workers.dev/api/products` 看是否返回商品数据
3. 查看 Bindings 中是否有 D1 数据库 `ecommerce-db`

### Q4: 我需要修改配置，应该在哪里改？

**配置类型**：

| 配置项 | 位置 | 如何修改 |
|--------|------|----------|
| API_URL | Dashboard Variables | 在线编辑 |
| PAYMENT_ENVIRONMENT | Dashboard Variables | 在线编辑 |
| NEWEBPAY_*_MERCHANT_ID | Secrets (命令行) | `wrangler secret put` |
| NEWEBPAY_*_HASH_KEY | Secrets (命令行) | `wrangler secret put` |
| NEWEBPAY_*_HASH_IV | Secrets (命令行) | `wrangler secret put` |

## 🚀 快速链接

- **Cloudflare Dashboard**: https://dash.cloudflare.com/
- **Workers & Pages**: https://dash.cloudflare.com/[账号ID]/workers-and-pages
- **Worker URL**: https://ecommerce-api.xyvn.workers.dev
- **前端 URL**: https://seedlight.tech

## 📞 需要帮助？

如果还是找不到项目，可以：

1. **运行命令查看账号信息**：
   ```bash
   cd workers
   wrangler whoami
   ```

2. **查看部署列表**：
   ```bash
   cd workers
   wrangler deployments list
   ```

3. **测试 Worker 是否运行**：
   ```bash
   curl https://ecommerce-api.xyvn.workers.dev/api/products
   ```

---

**创建时间**: 2026-02-23
**Worker 名称**: ecommerce-api
**部署 URL**: https://ecommerce-api.xyvn.workers.dev
