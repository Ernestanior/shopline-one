#!/bin/bash

echo "🔍 CORS和登录问题诊断"
echo "================================"
echo ""

API_URL="https://shopline-one-api.xyvn.workers.dev"
FRONTEND_URL="https://shopline-one.pages.dev"

# 颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "📋 测试配置:"
echo "  API URL: $API_URL"
echo "  Frontend URL: $FRONTEND_URL"
echo ""

# 测试1: CORS预检
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试 1: CORS预检 (OPTIONS)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
CORS_RESPONSE=$(curl -s -X OPTIONS "$API_URL/api/auth/login" \
  -H "Origin: $FRONTEND_URL" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -i)

if echo "$CORS_RESPONSE" | grep -q "access-control-allow-origin"; then
    echo -e "${GREEN}✅ CORS预检通过${NC}"
    echo "$CORS_RESPONSE" | grep -i "access-control"
else
    echo -e "${RED}❌ CORS预检失败${NC}"
    echo "$CORS_RESPONSE"
fi
echo ""

# 测试2: 登录请求（错误密码）
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试 2: 登录请求（错误密码）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Origin: $FRONTEND_URL" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrongpassword"}' \
  -w "\nHTTP_CODE:%{http_code}" \
  -i)

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✅ API响应正常（401 Unauthorized）${NC}"
else
    echo -e "${YELLOW}⚠️  HTTP状态码: $HTTP_CODE${NC}"
fi

if echo "$LOGIN_RESPONSE" | grep -q "access-control-allow-origin"; then
    echo -e "${GREEN}✅ CORS头存在${NC}"
else
    echo -e "${RED}❌ 缺少CORS头${NC}"
fi
echo ""

# 测试3: 获取产品（无需认证）
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试 3: 获取产品列表（无需认证）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
PRODUCTS_RESPONSE=$(curl -s -X GET "$API_URL/api/products" \
  -H "Origin: $FRONTEND_URL" \
  -w "\nHTTP_CODE:%{http_code}")

HTTP_CODE=$(echo "$PRODUCTS_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ 产品API正常${NC}"
    PRODUCT_COUNT=$(echo "$PRODUCTS_RESPONSE" | grep -o '"id"' | wc -l)
    echo "   产品数量: $PRODUCT_COUNT"
else
    echo -e "${RED}❌ 产品API失败 (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# 测试4: 检查数据库用户
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试 4: 检查数据库用户"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd workers
USERS=$(npx wrangler d1 execute ecommerce-db --remote --command "SELECT id, email, is_admin FROM users" 2>/dev/null | grep -A 100 "│ id │")
if [ -n "$USERS" ]; then
    echo -e "${GREEN}✅ 数据库连接正常${NC}"
    echo "$USERS"
else
    echo -e "${RED}❌ 无法连接数据库${NC}"
fi
cd ..
echo ""

# 测试5: 检查环境变量
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试 5: 检查Wrangler配置"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ALLOWED_ORIGINS=$(grep "ALLOWED_ORIGINS" workers/wrangler.toml | head -1)
echo "配置的ALLOWED_ORIGINS:"
echo "  $ALLOWED_ORIGINS"
echo ""

# 测试6: 测试真实登录
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试 6: 尝试真实登录"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "请输入测试账号密码（或按Enter跳过）:"
read -p "Email [test@example.com]: " TEST_EMAIL
TEST_EMAIL=${TEST_EMAIL:-test@example.com}
read -sp "Password: " TEST_PASSWORD
echo ""

if [ -n "$TEST_PASSWORD" ]; then
    LOGIN_TEST=$(curl -s -X POST "$API_URL/api/auth/login" \
      -H "Origin: $FRONTEND_URL" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
      -w "\nHTTP_CODE:%{http_code}")
    
    HTTP_CODE=$(echo "$LOGIN_TEST" | grep "HTTP_CODE" | cut -d: -f2)
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅ 登录成功！${NC}"
        echo "$LOGIN_TEST" | grep -v "HTTP_CODE" | head -5
    else
        echo -e "${RED}❌ 登录失败 (HTTP $HTTP_CODE)${NC}"
        echo "$LOGIN_TEST" | grep -v "HTTP_CODE"
    fi
else
    echo "跳过真实登录测试"
fi
echo ""

# 总结
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 诊断总结"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "如果看到CORS错误，可能的原因："
echo "  1. ALLOWED_ORIGINS配置不正确"
echo "  2. 前端部署在不同的URL"
echo "  3. 浏览器缓存了旧的CORS策略"
echo ""
echo "解决方案："
echo "  1. 更新wrangler.toml中的ALLOWED_ORIGINS"
echo "  2. 重新部署Workers"
echo "  3. 清除浏览器缓存"
echo ""
echo "测试页面已创建: test-login.html"
echo "在浏览器中打开它来测试实际的CORS行为"
