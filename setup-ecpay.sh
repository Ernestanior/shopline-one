#!/bin/bash
# 绿界金流配置脚本

echo "========================================"
echo "  绿界金流 (ECPay) 配置"
echo "========================================"
echo ""

cd "$(dirname "$0")/workers"

echo "设置绿界测试环境密钥..."
echo ""

echo "1. 设置 ECPAY_TEST_MERCHANT_ID (商店代号: 3485651)"
echo "3485651" | npx wrangler secret put ECPAY_TEST_MERCHANT_ID

echo ""
echo "2. 设置 ECPAY_TEST_HASH_KEY"
echo "764nCKeKZROPxaQ0" | npx wrangler secret put ECPAY_TEST_HASH_KEY

echo ""
echo "3. 设置 ECPAY_TEST_HASH_IV"
echo "dWnsI6zBGZh1tjmN" | npx wrangler secret put ECPAY_TEST_HASH_IV

echo ""
echo "========================================"
echo "  配置完成！"
echo "========================================"
echo ""
echo "绿界测试环境 API: https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5"
echo ""
echo "支持的支付方式："
echo "  - 信用卡 (Credit)"
echo "  - ATM转账 (ATM)"
echo "  - 超商缴费 (CVS)"
echo "  - 条码缴费 (BARCODE)"
echo ""
echo "测试完成后，如需部署到生产环境，请设置："
echo "  - ECPAY_PROD_MERCHANT_ID"
echo "  - ECPAY_PROD_HASH_KEY"
echo "  - ECPAY_PROD_HASH_IV"
echo ""
echo "运行开发服务器测试:"
echo "  cd workers && npm run dev"
