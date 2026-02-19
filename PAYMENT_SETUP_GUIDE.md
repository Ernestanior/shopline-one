# 台湾金流支付配置指南

## 问题：创建支付失败

如果你看到"创建支付失败"的错误，这是因为缺少支付网关的环境变量配置。

## 解决方案

### 1. 配置开发环境变量

我已经在 `workers/.dev.vars` 文件中添加了测试用的配置：

```bash
# NewebPay Test Configuration
NEWEBPAY_MERCHANT_ID=MS123456789
NEWEBPAY_HASH_KEY=abcdefghijklmnopqrstuvwxyz123456
NEWEBPAY_HASH_IV=1234567890123456
NEWEBPAY_API_URL=https://ccore.newebpay.com/MPG/mpg_gateway
NEWEBPAY_VERSION=2.0

# ECPay Test Configuration
ECPAY_MERCHANT_ID=2000132
ECPAY_HASH_KEY=5294y06JbISpM5x9
ECPAY_HASH_IV=v77hoKGq4kWxNNIS
ECPAY_API_URL=https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5
```

### 2. 重启后端服务器

**重要！** 修改 `.dev.vars` 后必须重启后端服务器才能生效：

```bash
cd workers
# 停止当前运行的服务器 (Ctrl+C)
npm run dev
```

### 3. 测试支付流程

1. 刷新浏览器
2. 重新进行结账流程
3. 选择支付网关和支付方式
4. 点击"前往支付"

现在应该能成功创建支付了！

## 注意事项

### 测试环境说明

上面配置的是**测试环境**的凭证：

- **NewebPay**: 使用示例测试凭证（需要替换为真实的测试凭证）
- **ECPay**: 使用ECPay官方提供的测试凭证

### 获取真实的测试凭证

#### NewebPay (蓝新金流)

1. 访问 [NewebPay测试环境](https://cwww.newebpay.com/)
2. 注册测试商户账号
3. 在商户后台获取：
   - Merchant ID (商店代号)
   - Hash Key
   - Hash IV

#### ECPay (绿界科技)

1. 访问 [ECPay测试环境](https://vendor-stage.ecpay.com.tw/)
2. 注册测试商户账号
3. 在商户后台获取：
   - Merchant ID (特店编号)
   - Hash Key
   - Hash IV

### 生产环境配置

在部署到生产环境前，需要：

1. 申请正式的商户账号
2. 获取生产环境的凭证
3. 使用 Cloudflare Workers Secrets 存储敏感信息：

```bash
wrangler secret put NEWEBPAY_MERCHANT_ID
wrangler secret put NEWEBPAY_HASH_KEY
wrangler secret put NEWEBPAY_HASH_IV
wrangler secret put ECPAY_MERCHANT_ID
wrangler secret put ECPAY_HASH_KEY
wrangler secret put ECPAY_HASH_IV
```

4. 在 `wrangler.toml` 中设置环境变量：

```toml
[vars]
PAYMENT_ENVIRONMENT = "production"
FRONTEND_URL = "https://your-domain.com"
API_URL = "https://api.your-domain.com"
```

## 测试支付

### 使用测试凭证

使用上面配置的测试凭证时：

- **NewebPay**: 需要使用NewebPay提供的测试卡号
- **ECPay**: 可以使用ECPay提供的测试卡号：`4311-9522-2222-2222`

### 测试流程

1. 选择支付网关（NewebPay或ECPay）
2. 选择支付方式（信用卡、ATM、超商等）
3. 点击"前往支付"
4. 在支付网关页面使用测试卡号完成支付
5. 返回网站查看支付结果

## 常见问题

### Q: 为什么还是显示"创建支付失败"？

A: 确保：
1. 已经修改了 `workers/.dev.vars` 文件
2. 已经重启了后端服务器
3. 环境变量格式正确（没有多余的空格或引号）

### Q: 可以跳过支付网关配置吗？

A: 不可以。台湾金流支付必须配置支付网关凭证才能工作。但你可以使用上面提供的测试凭证进行开发和测试。

### Q: 测试环境的支付会真的扣款吗？

A: 不会。测试环境的支付不会产生真实的金流交易，只是模拟支付流程。

## 下一步

配置完成后，你可以：

1. 测试完整的支付流程
2. 查看支付回调处理
3. 测试支付状态查询
4. 测试退款功能（需要管理员权限）

详细的API文档请参考 `workers/API_DOCUMENTATION.md`。
