// 全面测试前端后端所有功能
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5002';
let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// 测试辅助函数
async function test(name, fn) {
  try {
    await fn();
    testResults.passed++;
    testResults.tests.push({ name, status: '✅ PASS' });
    console.log(`✅ ${name}`);
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name, status: '❌ FAIL', error: error.message });
    console.log(`❌ ${name}: ${error.message}`);
  }
}

async function apiCall(url, options = {}) {
  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  const contentType = response.headers.get('content-type');
  let data = null;
  
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }
  
  return { response, data, status: response.status, ok: response.ok };
}

// 测试套件
async function runTests() {
  console.log('='.repeat(60));
  console.log('开始全面测试');
  console.log('='.repeat(60));
  console.log();

  // ==================== 公共API测试 ====================
  console.log('📦 公共API测试');
  console.log('-'.repeat(60));

  await test('获取产品列表', async () => {
    const { ok, data } = await apiCall('/api/products');
    if (!ok) throw new Error('请求失败');
    if (!Array.isArray(data)) throw new Error('返回数据不是数组');
    if (data.length === 0) throw new Error('产品列表为空');
  });

  await test('获取分类列表', async () => {
    const { ok, data } = await apiCall('/api/categories');
    if (!ok) throw new Error('请求失败');
    if (!Array.isArray(data)) throw new Error('返回数据不是数组');
  });

  await test('Newsletter订阅 - 新邮箱', async () => {
    const email = `test${Date.now()}@example.com`;
    const { ok, data } = await apiCall('/api/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
    if (!ok) throw new Error(`请求失败: ${JSON.stringify(data)}`);
    if (!data.success) throw new Error('订阅失败');
  });

  await test('Newsletter订阅 - 重复邮箱', async () => {
    const email = 'duplicate@example.com';
    // 第一次订阅
    await apiCall('/api/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
    // 第二次订阅（应该返回已订阅）
    const { ok, data } = await apiCall('/api/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
    if (!ok) throw new Error('请求失败');
    if (!data.success) throw new Error('应该返回成功');
  });

  await test('Newsletter订阅 - 缺少邮箱', async () => {
    const { status } = await apiCall('/api/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({})
    });
    if (status !== 400) throw new Error('应该返回400错误');
  });

  await test('联系表单提交', async () => {
    const { ok, data } = await apiCall('/api/contact', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message content'
      })
    });
    if (!ok) throw new Error(`请求失败: ${JSON.stringify(data)}`);
    if (!data.success) throw new Error('提交失败');
  });

  await test('联系表单 - 缺少必填字段', async () => {
    const { status } = await apiCall('/api/contact', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test User'
        // 缺少email和message
      })
    });
    if (status !== 400) throw new Error('应该返回400错误');
  });

  console.log();

  // ==================== 认证API测试 ====================
  console.log('🔐 认证API测试');
  console.log('-'.repeat(60));

  let authCookie = '';
  const testEmail = `testuser${Date.now()}@example.com`;
  const testPassword = 'password123';

  await test('用户注册 - 新用户', async () => {
    const { ok, data, response } = await apiCall('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    if (!ok) throw new Error(`注册失败: ${JSON.stringify(data)}`);
    if (!data.user) throw new Error('未返回用户信息');
    if (!data.user.email) throw new Error('用户信息不完整');
    
    // 保存cookie
    const cookies = response.headers.raw()['set-cookie'];
    if (cookies) {
      authCookie = cookies.map(c => c.split(';')[0]).join('; ');
    }
  });

  await test('用户注册 - 重复邮箱', async () => {
    const { status } = await apiCall('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    if (status !== 400) throw new Error('应该返回400错误');
  });

  await test('用户登录 - 正确凭证', async () => {
    const { ok, data, response } = await apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    if (!ok) throw new Error(`登录失败: ${JSON.stringify(data)}`);
    if (!data.user) throw new Error('未返回用户信息');
    
    // 更新cookie
    const cookies = response.headers.raw()['set-cookie'];
    if (cookies) {
      authCookie = cookies.map(c => c.split(';')[0]).join('; ');
    }
  });

  await test('用户登录 - 错误密码', async () => {
    const { status } = await apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: 'wrongpassword'
      })
    });
    if (status !== 401) throw new Error('应该返回401错误');
  });

  await test('获取当前用户信息', async () => {
    const { ok, data } = await apiCall('/api/auth/me', {
      headers: {
        Cookie: authCookie
      }
    });
    if (!ok) throw new Error('请求失败');
    if (!data.user) throw new Error('未返回用户信息');
    if (data.user.email !== testEmail) throw new Error('用户信息不匹配');
  });

  await test('用户登出', async () => {
    const { ok } = await apiCall('/api/auth/logout', {
      method: 'POST',
      headers: {
        Cookie: authCookie
      }
    });
    if (!ok) throw new Error('登出失败');
  });

  console.log();

  // ==================== 管理员API测试 ====================
  console.log('👑 管理员API测试');
  console.log('-'.repeat(60));

  let adminCookie = '';

  await test('管理员登录', async () => {
    const { ok, data, response } = await apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });
    if (!ok) throw new Error(`登录失败: ${JSON.stringify(data)}`);
    if (!data.user) throw new Error('未返回用户信息');
    if (!data.user.is_admin) throw new Error('不是管理员账号');
    
    const cookies = response.headers.raw()['set-cookie'];
    if (cookies) {
      adminCookie = cookies.map(c => c.split(';')[0]).join('; ');
    }
  });

  await test('获取管理员统计数据', async () => {
    const { ok, data } = await apiCall('/api/admin/stats', {
      headers: { Cookie: adminCookie }
    });
    if (!ok) throw new Error('请求失败');
    if (!data.users) throw new Error('缺少用户统计');
    if (!data.products) throw new Error('缺少产品统计');
    if (!data.orders) throw new Error('缺少订单统计');
  });

  await test('获取用户列表', async () => {
    const { ok, data } = await apiCall('/api/admin/users', {
      headers: { Cookie: adminCookie }
    });
    if (!ok) throw new Error('请求失败');
    if (!Array.isArray(data.users)) throw new Error('返回数据格式错误');
  });

  await test('获取产品列表（管理员）', async () => {
    const { ok, data } = await apiCall('/api/admin/products', {
      headers: { Cookie: adminCookie }
    });
    if (!ok) throw new Error('请求失败');
    if (!Array.isArray(data.products)) throw new Error('返回数据格式错误');
  });

  await test('获取订单列表', async () => {
    const { ok, data } = await apiCall('/api/admin/orders', {
      headers: { Cookie: adminCookie }
    });
    if (!ok) throw new Error('请求失败');
    if (!Array.isArray(data.orders)) throw new Error('返回数据格式错误');
  });

  await test('获取反馈列表', async () => {
    const { ok, data } = await apiCall('/api/admin/feedback', {
      headers: { Cookie: adminCookie }
    });
    if (!ok) throw new Error('请求失败');
    if (!Array.isArray(data.feedback)) throw new Error('返回数据格式错误');
  });

  await test('获取订阅者列表', async () => {
    const { ok, data } = await apiCall('/api/admin/subscribers', {
      headers: { Cookie: adminCookie }
    });
    if (!ok) throw new Error('请求失败');
    if (!Array.isArray(data.subscribers)) throw new Error('返回数据格式错误');
  });

  let testProductId;
  await test('添加新产品', async () => {
    const { ok, data } = await apiCall('/api/admin/products', {
      method: 'POST',
      headers: { Cookie: adminCookie },
      body: JSON.stringify({
        name: 'Test Product',
        category: 'productivity',
        price: 99.99,
        description: 'Test product description',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
        stock: 100,
        status: 'available',
        featured: 0
      })
    });
    if (!ok) throw new Error(`添加失败: ${JSON.stringify(data)}`);
    if (!data.product) throw new Error('未返回产品信息');
    testProductId = data.product.id;
  });

  await test('更新产品', async () => {
    if (!testProductId) throw new Error('没有测试产品ID');
    const { ok, data } = await apiCall(`/api/admin/products/${testProductId}`, {
      method: 'PUT',
      headers: { Cookie: adminCookie },
      body: JSON.stringify({
        name: 'Updated Test Product',
        category: 'productivity',
        price: 89.99,
        description: 'Updated description',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
        stock: 50,
        status: 'available',
        featured: 1
      })
    });
    if (!ok) throw new Error(`更新失败: ${JSON.stringify(data)}`);
  });

  await test('删除产品', async () => {
    if (!testProductId) throw new Error('没有测试产品ID');
    const { ok } = await apiCall(`/api/admin/products/${testProductId}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie }
    });
    if (!ok) throw new Error('删除失败');
  });

  console.log();

  // ==================== 订单API测试 ====================
  console.log('🛒 订单API测试');
  console.log('-'.repeat(60));

  await test('创建订单', async () => {
    // 先获取一个真实的产品ID
    const { data: products } = await apiCall('/api/products');
    if (!Array.isArray(products) || products.length === 0) {
      throw new Error('没有可用的产品');
    }
    
    const testProduct = products[0];
    
    const { ok, data } = await apiCall('/api/orders', {
      method: 'POST',
      headers: { Cookie: authCookie },
      body: JSON.stringify({
        items: [
          { 
            id: testProduct.id, 
            name: testProduct.name, 
            price: parseFloat(testProduct.price), 
            quantity: 2, 
            image: testProduct.image 
          }
        ],
        contact: {
          email: testEmail,
          phone: '+886123456789'
        },
        address: {
          firstName: 'Test',
          lastName: 'User',
          country: 'Taiwan',
          city: 'Taipei',
          address1: '123 Test St',
          address2: '',
          postalCode: '10001'
        },
        totals: {
          subtotal: parseFloat(testProduct.price) * 2,
          shipping: 0,
          estimatedTax: 0,
          total: parseFloat(testProduct.price) * 2
        }
      })
    });
    if (!ok) throw new Error(`创建订单失败: ${JSON.stringify(data)}`);
    if (!data.order) throw new Error('未返回订单信息');
  });

  console.log();

  // ==================== 测试总结 ====================
  console.log('='.repeat(60));
  console.log('测试总结');
  console.log('='.repeat(60));
  console.log(`总测试数: ${testResults.passed + testResults.failed}`);
  console.log(`✅ 通过: ${testResults.passed}`);
  console.log(`❌ 失败: ${testResults.failed}`);
  console.log(`通过率: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2)}%`);
  console.log();

  if (testResults.failed > 0) {
    console.log('失败的测试:');
    testResults.tests
      .filter(t => t.status.includes('FAIL'))
      .forEach(t => {
        console.log(`  ❌ ${t.name}: ${t.error}`);
      });
    console.log();
  }

  console.log('='.repeat(60));
  
  // 返回退出码
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// 运行测试
runTests().catch(error => {
  console.error('测试运行失败:', error);
  process.exit(1);
});
