# Taiwan Payment Gateway - Deployment Guide

本文档提供台湾支付网关集成的完整部署指南，包括配置、测试和生产部署步骤。

## 目录

1. [前置要求](#前置要求)
2. [支付网关配置](#支付网关配置)
3. [环境变量设置](#环境变量设置)
4. [数据库迁移](#数据库迁移)
5. [测试流程](#测试流程)
6. [生产部署检查清单](#生产部署检查清单)
7. [故障排查](#故障排查)

---

## 前置要求

### 1. 账号注册

#### NewebPay (蓝新金流)
- 测试环境: https://cwww.newebpay.com/
- 生产环境: https://www.newebpay.com/
- 需要提供: 公司资料、银行账户信息

#### ECPay (绿界科技)
- 测试环境: https://vendor-stage.ecpay.com.tw/
- 生产环境: https://www.ecpay.com.tw/
- 需要提供: 公司资料、银行账户信息

### 2. 获取 API 凭证

从各支付网关的商户后台获取：
- Merchant ID (商店代号)
- Hash Key
- Hash IV

### 3. 开发工具

```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 验证登录
wrangler whoami
```

---

## 支付网关配置

### NewebPay 配置步骤

1. **登录商户后台**
   - 测试: https://cwww.newebpay.com/
   - 生产: https://www.newebpay.com/

2. **获取 API 凭证**
   - 进入「商店管理」→「API 串接」
   - 记录 Merchant ID、Hash Key、Hash IV

3. **设置回调 URL**
   - 返回网址 (ReturnURL): `https://your-domain.com/payment/return/{orderId}`
   - 通知网址 (NotifyURL): `https://your-api.workers.dev/api/payment/callback/newebpay`

4. **启用支付方式**
   - 信用卡 (CREDIT)
   - ATM 转账 (VACC)
   - 超商代码 (CVS)

### ECPay 配置步骤

1. **登录商户后台**
   - 测试: https://vendor-stage.ecpay.com.tw/
   - 生产: https://www.ecpay.com.tw/

2. **获取 API 凭证**
   - 进入「系统开发管理」→「系统介接设定」
   - 记录 Merchant ID、Hash Key、Hash IV

3. **设置回调 URL**
   - 返回网址 (ClientBackURL): `https://your-domain.com/payment/return/{orderId}`
   - 通知网址 (ReturnURL): `https://your-api.workers.dev/api/payment/callback/ecpay`

4. **启用支付方式**
   - 信用卡 (Credit)
   - ATM 转账 (ATM)
   - 超商代码 (CVS)
   - 超商条码 (BARCODE)

---

## 环境变量设置

### 1. 复制环境变量模板

```bash
cd workers
cp .env.example .env
```

### 2. 填写本地开发环境变量

编辑 `.env` 文件：

```bash
# 基础配置
PAYMENT_ENVIRONMENT=test
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:8787

# NewebPay 测试环境
NEWEBPAY_TEST_MERCHANT_ID=your_test_merchant_id
NEWEBPAY_TEST_HASH_KEY=your_test_hash_key
NEWEBPAY_TEST_HASH_IV=your_test_hash_iv

# ECPay 测试环境
ECPAY_TEST_MERCHANT_ID=your_test_merchant_id
ECPAY_TEST_HASH_KEY=your_test_hash_key
ECPAY_TEST_HASH_IV=your_test_hash_iv

# 安全密钥
JWT_SECRET=your_strong_random_secret
CSRF_SECRET=your_strong_random_secret
```

### 3. 设置 Cloudflare Workers Secrets

**重要**: 敏感信息应使用 Cloudflare Secrets，而不是环境变量。

```bash
# 设置 JWT Secret
wrangler secret put JWT_SECRET

# 设置 CSRF Secret
wrangler secret put CSRF_SECRET

# NewebPay 测试环境
wrangler secret put NEWEBPAY_TEST_MERCHANT_ID
wrangler secret put NEWEBPAY_TEST_HASH_KEY
wrangler secret put NEWEBPAY_TEST_HASH_IV

# NewebPay 生产环境
wrangler secret put NEWEBPAY_PROD_MERCHANT_ID --env production
wrangler secret put NEWEBPAY_PROD_HASH_KEY --env production
wrangler secret put NEWEBPAY_PROD_HASH_IV --env production

# ECPay 测试环境
wrangler secret put ECPAY_TEST_MERCHANT_ID
wrangler secret put ECPAY_TEST_HASH_KEY
wrangler secret put ECPAY_TEST_HASH_IV

# ECPay 生产环境
wrangler secret put ECPAY_PROD_MERCHANT_ID --env production
wrangler secret put ECPAY_PROD_HASH_KEY --env production
wrangler secret put ECPAY_PROD_HASH_IV --env production
```

### 4. 验证配置

```bash
# 列出所有 secrets
wrangler secret list

# 列出生产环境 secrets
wrangler secret list --env production
```

---

## 数据库迁移

### 1. 应用支付表迁移

```bash
cd workers

# 开发环境
wrangler d1 execute ecommerce-db-dev --file=./migrations/001_add_payment_tables.sql

# 生产环境
wrangler d1 execute ecommerce-db --file=./migrations/001_add_payment_tables.sql --env production
```

### 2. 验证表结构

```bash
# 查看表
wrangler d1 execute ecommerce-db-dev --command="SELECT name FROM sqlite_master WHERE type='table';"

# 查看 payment_transactions 表结构
wrangler d1 execute ecommerce-db-dev --command="PRAGMA table_info(payment_transactions);"
```

---

## 测试流程

### 1. 本地开发测试

```bash
# 启动开发服务器
cd workers
wrangler dev

# 在另一个终端启动前端
cd client
npm start
```

### 2. 单元测试

```bash
cd workers
npm test
```

### 3. 属性测试

```bash
# 运行所有属性测试
npm test -- --testPathPattern=property

# 运行特定属性测试
npm test -- payment.service.callback.property.test.ts
```

### 4. 集成测试

```bash
# 运行集成测试
npm test -- payment-routes.integration.test.ts
```

### 5. 手动测试流程

#### NewebPay 测试

1. 创建测试订单
2. 选择 NewebPay 作为支付网关
3. 选择支付方式（信用卡/ATM/超商）
4. 使用测试卡号完成支付
   - 测试卡号: 4000-2211-1111-1111
   - 有效期: 任意未来日期
   - CVV: 任意3位数字
5. 验证支付成功回调
6. 检查订单状态更新

#### ECPay 测试

1. 创建测试订单
2. 选择 ECPay 作为支付网关
3. 选择支付方式
4. 使用测试卡号完成支付
   - 测试卡号: 4311-9522-2222-2222
   - 有效期: 任意未来日期
   - CVV: 任意3位数字
5. 验证支付成功回调
6. 检查订单状态更新

### 6. 测试退款功能

1. 完成一笔成功的支付
2. 在管理后台找到该交易
3. 点击"退款"按钮
4. 输入退款金额和原因
5. 确认退款
6. 验证退款状态更新

---

## 生产部署检查清单

### 部署前检查

- [ ] **环境变量配置**
  - [ ] `PAYMENT_ENVIRONMENT` 设置为 `production`
  - [ ] `FRONTEND_URL` 设置为生产域名
  - [ ] `API_URL` 设置为生产 API 域名
  - [ ] `ENABLE_PAYMENT_DEBUG_LOGS` 设置为 `false`
  - [ ] `LOG_LEVEL` 设置为 `INFO` 或 `WARN`

- [ ] **Secrets 配置**
  - [ ] 所有生产环境 secrets 已设置
  - [ ] JWT_SECRET 使用强随机字符串
  - [ ] CSRF_SECRET 使用强随机字符串
  - [ ] 生产环境 API 凭证已验证

- [ ] **数据库**
  - [ ] 生产数据库迁移已应用
  - [ ] 数据库备份策略已设置

- [ ] **测试**
  - [ ] 所有单元测试通过
  - [ ] 所有属性测试通过
  - [ ] 集成测试通过
  - [ ] 在测试环境完成端到端测试

- [ ] **支付网关配置**
  - [ ] NewebPay 生产环境回调 URL 已设置
  - [ ] ECPay 生产环境回调 URL 已设置
  - [ ] 支付方式已启用
  - [ ] 商户信息已验证

- [ ] **安全**
  - [ ] CORS 配置正确
  - [ ] CSRF 保护已启用
  - [ ] 限流配置已设置
  - [ ] 敏感信息日志脱敏

- [ ] **监控**
  - [ ] 错误追踪已配置 (Sentry 等)
  - [ ] 日志聚合已设置
  - [ ] 告警规则已配置

### 部署步骤

1. **部署到生产环境**

```bash
# 部署 Workers
cd workers
wrangler deploy --env production

# 部署前端
cd client
npm run build
# 上传到 Cloudflare Pages 或其他托管服务
```

2. **验证部署**

```bash
# 检查 Worker 状态
wrangler tail --env production

# 测试 API 端点
curl https://your-api.workers.dev/health
```

3. **执行冒烟测试**

- [ ] 访问前端应用
- [ ] 创建测试订单（小金额）
- [ ] 完成支付流程
- [ ] 验证回调处理
- [ ] 检查订单状态
- [ ] 测试退款功能

### 部署后监控

- [ ] 监控错误率
- [ ] 检查支付成功率
- [ ] 验证回调处理时间
- [ ] 查看日志是否有异常

---

## 故障排查

### 常见问题

#### 1. 签名验证失败

**症状**: 回调被拒绝，日志显示 "Invalid signature"

**解决方案**:
- 验证 Hash Key 和 Hash IV 是否正确
- 检查签名算法实现
- 确认参数编码方式
- 查看网关文档确认签名规则

#### 2. 回调未收到

**症状**: 支付完成但订单状态未更新

**解决方案**:
- 检查回调 URL 是否可访问
- 验证网关后台回调 URL 配置
- 查看 Worker 日志
- 检查防火墙/安全组设置

#### 3. 金额不匹配

**症状**: 支付金额与订单金额不一致

**解决方案**:
- 确认金额单位（分 vs 元）
- 检查货币转换逻辑
- 验证订单金额计算

#### 4. 环境变量未生效

**症状**: 配置的环境变量无法读取

**解决方案**:
- 确认使用正确的环境 (`--env production`)
- 重新部署 Worker
- 检查 wrangler.toml 配置
- 验证 secrets 是否正确设置

### 调试技巧

#### 查看实时日志

```bash
# 开发环境
wrangler tail

# 生产环境
wrangler tail --env production
```

#### 查看数据库内容

```bash
# 查询交易记录
wrangler d1 execute ecommerce-db --command="SELECT * FROM payment_transactions ORDER BY created_at DESC LIMIT 10;"

# 查询回调日志
wrangler d1 execute ecommerce-db --command="SELECT * FROM payment_callbacks ORDER BY created_at DESC LIMIT 10;"
```

#### 测试 API 端点

```bash
# 测试支付创建
curl -X POST https://your-api.workers.dev/api/payment/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"orderId": "123", "gateway": "newebpay", "paymentMethod": "credit_card"}'

# 测试状态查询
curl https://your-api.workers.dev/api/payment/status/123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 支持和联系

如有问题，请联系：
- 技术支持: support@example.com
- 文档: https://docs.example.com
- GitHub Issues: https://github.com/your-repo/issues

---

## 更新日志

- 2024-01-01: 初始版本
- 添加 NewebPay 和 ECPay 集成
- 完整的测试和部署流程
