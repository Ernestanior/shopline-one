const http = require('http');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', reject);
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function testAdminFlow() {
  console.log('🧪 测试管理员完整流程\n');
  
  // 1. 登录
  console.log('1️⃣  登录管理员账号...');
  const loginData = JSON.stringify({
    email: 'admin@xyvn.com',
    password: 'admin123'
  });
  
  const loginResponse = await makeRequest({
    hostname: 'localhost',
    port: 5002,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  }, loginData);
  
  console.log('   状态码:', loginResponse.statusCode);
  console.log('   响应:', loginResponse.body);
  
  const cookie = loginResponse.headers['set-cookie'];
  if (!cookie) {
    console.log('   ❌ 未获取到Cookie');
    return;
  }
  
  const authCookie = cookie[0].split(';')[0];
  console.log('   ✅ Cookie:', authCookie.substring(0, 50) + '...\n');
  
  // 2. 检查用户信息
  console.log('2️⃣  检查用户信息...');
  const meResponse = await makeRequest({
    hostname: 'localhost',
    port: 5002,
    path: '/api/auth/me',
    method: 'GET',
    headers: {
      'Cookie': authCookie
    }
  });
  
  console.log('   状态码:', meResponse.statusCode);
  console.log('   响应:', meResponse.body);
  
  const userData = JSON.parse(meResponse.body);
  if (userData.user && userData.user.is_admin) {
    console.log('   ✅ 用户是管理员\n');
  } else {
    console.log('   ❌ 用户不是管理员\n');
    return;
  }
  
  // 3. 访问管理员API - 统计数据
  console.log('3️⃣  获取统计数据...');
  const statsResponse = await makeRequest({
    hostname: 'localhost',
    port: 5002,
    path: '/api/admin/stats',
    method: 'GET',
    headers: {
      'Cookie': authCookie
    }
  });
  
  console.log('   状态码:', statsResponse.statusCode);
  console.log('   响应:', statsResponse.body.substring(0, 200) + '...\n');
  
  // 4. 访问管理员API - 用户列表
  console.log('4️⃣  获取用户列表...');
  const usersResponse = await makeRequest({
    hostname: 'localhost',
    port: 5002,
    path: '/api/admin/users',
    method: 'GET',
    headers: {
      'Cookie': authCookie
    }
  });
  
  console.log('   状态码:', usersResponse.statusCode);
  console.log('   响应:', usersResponse.body.substring(0, 200) + '...\n');
  
  // 5. 访问管理员API - 商品列表
  console.log('5️⃣  获取商品列表...');
  const productsResponse = await makeRequest({
    hostname: 'localhost',
    port: 5002,
    path: '/api/admin/products',
    method: 'GET',
    headers: {
      'Cookie': authCookie
    }
  });
  
  console.log('   状态码:', productsResponse.statusCode);
  console.log('   响应:', productsResponse.body.substring(0, 200) + '...\n');
  
  // 6. 访问管理员API - 订单列表
  console.log('6️⃣  获取订单列表...');
  const ordersResponse = await makeRequest({
    hostname: 'localhost',
    port: 5002,
    path: '/api/admin/orders',
    method: 'GET',
    headers: {
      'Cookie': authCookie
    }
  });
  
  console.log('   状态码:', ordersResponse.statusCode);
  console.log('   响应:', ordersResponse.body.substring(0, 200) + '...\n');
  
  console.log('✅ 测试完成！');
}

testAdminFlow().catch(console.error);
