#!/bin/bash

# Comprehensive API Test Script
# Tests all major API endpoints

API_URL="http://localhost:8787"
COOKIE_FILE="/tmp/test_cookies.txt"

echo "🧪 Starting Comprehensive API Tests..."
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0.32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Helper function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5
    
    echo -n "Testing: $name... "
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" -b $COOKIE_FILE)
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" \
            -b $COOKIE_FILE -c $COOKIE_FILE)
    fi
    
    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $status)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Expected $expected_status, got $status)"
        echo "Response: $body"
        ((FAILED++))
        return 1
    fi
}

echo "1️⃣  Health Check"
echo "----------------"
test_endpoint "Health check" "GET" "/" "" "200"
echo ""

echo "2️⃣  Public Endpoints (No Auth Required)"
echo "---------------------------------------"
test_endpoint "Get products" "GET" "/api/products" "" "200"
test_endpoint "Get categories" "GET" "/api/categories" "" "200"
test_endpoint "Get product by ID" "GET" "/api/products/1" "" "200"
echo ""

echo "3️⃣  Authentication"
echo "------------------"
# Register new user
EMAIL="testuser_$(date +%s)@example.com"
test_endpoint "Register user" "POST" "/api/auth/register" \
    "{\"email\":\"$EMAIL\",\"password\":\"password123\",\"name\":\"Test User\"}" "200"

# Login
test_endpoint "Login" "POST" "/api/auth/login" \
    "{\"email\":\"$EMAIL\",\"password\":\"password123\"}" "200"

# Get current user
test_endpoint "Get current user" "GET" "/api/auth/me" "" "200"
echo ""

echo "4️⃣  Cart Operations"
echo "-------------------"
test_endpoint "Get cart" "GET" "/api/cart" "" "200"
test_endpoint "Add to cart" "POST" "/api/cart" \
    "{\"product_id\":1,\"quantity\":2}" "200"
test_endpoint "Get cart items" "GET" "/api/cart/items" "" "200"
test_endpoint "Update cart item" "PUT" "/api/cart/items/1" \
    "{\"quantity\":3}" "200"
echo ""

echo "5️⃣  User Profile"
echo "----------------"
test_endpoint "Get profile" "GET" "/api/user/profile" "" "200"
test_endpoint "Update profile" "PUT" "/api/user/profile" \
    "{\"first_name\":\"John\",\"last_name\":\"Doe\",\"phone\":\"+1234567890\"}" "200"
echo ""

echo "6️⃣  User Addresses"
echo "------------------"
test_endpoint "Get addresses" "GET" "/api/user/addresses" "" "200"
test_endpoint "Create address" "POST" "/api/user/addresses" \
    "{\"first_name\":\"John\",\"last_name\":\"Doe\",\"address1\":\"123 Main St\",\"city\":\"New York\",\"country\":\"USA\",\"postal_code\":\"10001\",\"is_default\":true}" "200"
test_endpoint "Get addresses again" "GET" "/api/user/addresses" "" "200"
echo ""

echo "7️⃣  Payment Methods"
echo "-------------------"
test_endpoint "Get payment methods" "GET" "/api/user/payment-methods" "" "200"
test_endpoint "Create payment method" "POST" "/api/user/payment-methods" \
    "{\"card_type\":\"Visa\",\"card_last4\":\"4242\",\"card_holder_name\":\"John Doe\",\"expiry_month\":12,\"expiry_year\":2025,\"is_default\":true}" "200"
echo ""

echo "8️⃣  Orders"
echo "----------"
test_endpoint "Get user orders" "GET" "/api/user/orders" "" "200"
test_endpoint "Create order" "POST" "/api/orders" \
    "{\"items\":[{\"id\":1,\"name\":\"Test Product\",\"price\":29.99,\"quantity\":1}],\"contact\":{\"email\":\"$EMAIL\"},\"address\":{\"firstName\":\"John\",\"lastName\":\"Doe\",\"address1\":\"123 Main St\",\"city\":\"New York\",\"country\":\"USA\",\"postal_code\":\"10001\"},\"totals\":{\"subtotal\":29.99,\"tax\":2.40,\"shipping\":5.00,\"total\":37.39}}" "200"
test_endpoint "Get user orders after creation" "GET" "/api/user/orders" "" "200"
echo ""

echo "9️⃣  Public Forms"
echo "----------------"
test_endpoint "Submit feedback" "POST" "/api/contact" \
    "{\"name\":\"Test User\",\"email\":\"test@example.com\",\"subject\":\"Test\",\"message\":\"This is a test message\"}" "200"
test_endpoint "Subscribe to newsletter" "POST" "/api/newsletter/subscribe" \
    "{\"email\":\"newsletter@example.com\"}" "200"
echo ""

echo "🔟 Admin Endpoints (Login as admin first)"
echo "-----------------------------------------"
# Login as admin
curl -s -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"admin123"}' \
    -c $COOKIE_FILE > /dev/null

test_endpoint "Get admin stats" "GET" "/api/admin/stats" "" "200"
test_endpoint "Get all users" "GET" "/api/admin/users" "" "200"
test_endpoint "Get all products (admin)" "GET" "/api/admin/products" "" "200"
test_endpoint "Get all orders (admin)" "GET" "/api/admin/orders" "" "200"
test_endpoint "Get feedback" "GET" "/api/admin/feedback" "" "200"
test_endpoint "Get subscribers" "GET" "/api/admin/subscribers" "" "200"
echo ""

echo "======================================"
echo "📊 Test Results"
echo "======================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
