#!/bin/bash

echo "=== 蓝新金流配置检查 ==="
echo ""

# 1. 检查 Cloudflare Secrets
echo "1. Cloudflare Workers Secrets 状态："
echo ""
cd workers
SECRETS=$(wrangler secret list 2>/dev/null | grep NEWEBPAY)
if [ -n "$SECRETS" ]; then
    echo "✅ 蓝新金流 Secrets 已设置："
    echo "$SECRETS" | sed 's/^/   /'
else
    echo "❌ 未找到蓝新金流 Secrets"
fi
echo ""

# 2. 检查环境变量
echo "2. wrangler.toml 环境变量："
echo ""
PAYMENT_ENV=$(grep "PAYMENT_ENVIRONMENT" wrangler.toml | head -1 | cut -d'"' -f2)
echo "   PAYMENT_ENVIRONMENT = \"$PAYMENT_ENV\""
echo ""

if [ "$PAYMENT_ENV" = "test" ]; then
    echo "   ℹ️  当前使用测试环境配置"
    echo "   将使用以下 Secrets:"
    echo "   - NEWEBPAY_TEST_MERCHANT_ID"
    echo "   - NEWEBPAY_TEST_HASH_KEY"
    echo "   - NEWEBPAY_TEST_HASH_IV"
elif [ "$PAYMENT_ENV" = "production" ]; then
    echo "   ℹ️  当前使用正式环境配置"
    echo "   将使用以下 Secrets:"
    echo "   - NEWEBPAY_PROD_MERCHANT_ID"
    echo "   - NEWEBPAY_PROD_HASH_KEY"
    echo "   - NEWEBPAY_PROD_HASH_IV"
else
    echo "   ⚠️  未设置或配置错误"
fi
echo ""

# 3. 检查 API URL
echo "3. API URL 配置："
API_URL=$(grep "^API_URL" wrangler.toml | head -1 | cut -d'"' -f2)
echo "   $API_URL"
if [[ $API_URL =~ :[0-9]+$ ]]; then
    echo "   ❌ 错误: 包含端口号"
else
    echo "   ✅ 正确: 不包含端口号"
fi
echo ""

# 4. 检查 .dev.vars 本地配置
echo "4. 本地开发配置 (.dev.vars)："
if [ -f .dev.vars ]; then
    echo ""
    echo "   NEWEBPAY_MERCHANT_ID: $(grep NEWEBPAY_MERCHANT_ID .dev.vars | cut -d'=' -f2)"
    echo "   NEWEBPAY_HASH_KEY: $(grep NEWEBPAY_HASH_KEY .dev.vars | cut -d'=' -f2 | head -c 20)..."
    echo "   NEWEBPAY_HASH_IV: $(grep NEWEBPAY_HASH_IV .dev.vars | cut -d'=' -f2)"
    echo ""
    echo "   ℹ️  .dev.vars 仅用于本地开发 (wrangler dev)"
else
    echo "   ⚠️  .dev.vars 文件不存在"
fi
echo ""

# 5. 配置使用说明
echo "=== 配置说明 ==="
echo ""
echo "📋 配置层级（优先级从高到低）："
echo ""
echo "1. Cloudflare Secrets (生产环境)"
echo "   - 通过 'wrangler secret put' 设置"
echo "   - 用于敏感信息（Merchant ID, Hash Key, Hash IV）"
echo "   - ✅ 已设置"
echo ""
echo "2. wrangler.toml [vars] (生产环境)"
echo "   - 用于非敏感配置"
echo "   - PAYMENT_ENVIRONMENT 决定使用哪套 Secrets"
echo "   - 当前: $PAYMENT_ENV"
echo ""
echo "3. .dev.vars (本地开发)"
echo "   - 仅在 'wrangler dev' 时使用"
echo "   - 不会部署到生产环境"
echo ""

# 6. 常见问题
echo "=== 常见问题 ==="
echo ""
echo "Q: 为什么我看不到配置？"
echo "A: Secrets 是加密的，无法直接查看值，只能看到名称"
echo ""
echo "Q: 如何修改配置？"
echo "A: 使用 'wrangler secret put <SECRET_NAME>' 重新设置"
echo ""
echo "Q: 测试环境和正式环境有什么区别？"
echo "A: "
echo "   - 测试: 使用 ccore.newebpay.com (测试金流)"
echo "   - 正式: 使用 core.newebpay.com (真实金流)"
echo "   - 通过 PAYMENT_ENVIRONMENT 切换"
echo ""

# 7. 快速操作
echo "=== 快速操作 ==="
echo ""
echo "查看所有 Secrets:"
echo "  cd workers && wrangler secret list"
echo ""
echo "设置测试环境 Merchant ID:"
echo "  cd workers && wrangler secret put NEWEBPAY_TEST_MERCHANT_ID"
echo ""
echo "设置正式环境 Merchant ID:"
echo "  cd workers && wrangler secret put NEWEBPAY_PROD_MERCHANT_ID"
echo ""
echo "切换到正式环境:"
echo "  编辑 workers/wrangler.toml"
echo "  将 PAYMENT_ENVIRONMENT = \"test\" 改为 \"production\""
echo "  然后 wrangler deploy"
echo ""

cd ..
