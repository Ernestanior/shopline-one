// 测试所有API端点
const BASE_URL = 'http://localhost:5002';

async function testAPI(name, url, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const data = await response.json().catch(() => null);
    
    console.log(`✓ ${name}: ${response.status}`, data ? JSON.stringify(data).substring(0, 100) : '');
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    console.log(`✗ ${name}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('=== 测试所有API端点 ===\n');
  
  // 1. Newsletter订阅
  console.log('1. Newsletter订阅:');
  await testAPI('  订阅测试', '/api/newsletter/subscribe', {
    method: 'POST',
    body: JSON.stringify({ email: 'test@example.com' })
  });
  
  // 2. 联系表单
  console.log('\n2. 联系表单:');
  await testAPI('  提交联系', '/api/contact', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test User',
      email: 'test@example.com',
      subject: 'Test',
      message: 'Test message'
    })
  });
  
  // 3. 用户注册
  console.log('\n3. 用户注册:');
  const randomEmail = `test${Date.now()}@example.com`;
  await testAPI('  注册新用户', '/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: randomEmail,
      password: 'password123'
    })
  });
  
  // 4. 用户登录
  console.log('\n4. 用户登录:');
  const loginResult = await testAPI('  登录测试', '/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@example.com',
      password: 'admin123'
    })
  });
  
  // 5. 获取产品列表
  console.log('\n5. 产品API:');
  await testAPI('  获取产品', '/api/products');
  
  // 6. 获取分类
  console.log('\n6. 分类API:');
  await testAPI('  获取分类', '/api/categories');
  
  console.log('\n=== 测试完成 ===');
}

runTests().catch(console.error);
