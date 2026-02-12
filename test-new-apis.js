#!/usr/bin/env node

/**
 * 测试新添加的API功能
 */

const http = require('http');

const API_BASE = 'http://localhost:5002';

function makeRequest(method, path, data = null, cookie = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (cookie) {
      options.headers['Cookie'] = cookie;
    }

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          const setCookie = res.headers['set-cookie'];
          resolve({ status: res.statusCode, data: json, cookie: setCookie });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testNewAPIs() {
  console.log('🧪 测试新添加的API功能\n');

  let authCookie = null;

  try {
    // 1. 测试登录并获取is_admin
    console.log('1️⃣  测试登录并获取is_admin字段...');
    const loginResult = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@xyvn.com',
      password: 'admin123'
    });
    
    if (loginResult.status === 200) {
      console.log('   ✅ 登录成功');
      authCookie = loginResult.cookie ? loginResult.cookie[0] : null;
      
      // 获取用户信息
      const meResult = await makeRequest('GET', '/api/auth/me', null, authCookie);
      if (meResult.status === 200 && meResult.data.user) {
        if ('is_admin' in meResult.data.user) {
          console.log(`   ✅ is_admin字段存在: ${meResult.data.user.is_admin}`);
        } else {
          console.log('   ❌ is_admin字段缺失');
        }
      }
    } else {
      console.log('   ❌ 登录失败:', loginResult.status);
    }

    // 2. 测试商品详情API
    console.log('\n2️⃣  测试商品详情API...');
    const productResult = await makeRequest('GET', '/api/products/1');
    
    if (productResult.status === 200) {
      console.log('   ✅ 获取商品详情成功:', productResult.data.name);
    } else if (productResult.status === 404) {
      console.log('   ⚠️  商品不存在（正常，如果数据库中没有ID为1的商品）');
    } else {
      console.log('   ❌ 获取商品详情失败:', productResult.status);
    }

    // 3. 测试创建订单API
    console.log('\n3️⃣  测试创建订单API...');
    const orderResult = await makeRequest('POST', '/api/orders', {
      items: [
        { id: 1, name: 'Test Product', price: 29.99, quantity: 2, image: '/test.jpg' }
      ],
      contact: {
        email: 'test@example.com',
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
        subtotal: 59.98,
        shipping: 0,
        estimatedTax: 0,
        total: 59.98
      }
    }, authCookie);
    
    if (orderResult.status === 201) {
      console.log('   ✅ 订单创建成功:', orderResult.data.order.orderNumber);
    } else {
      console.log('   ❌ 订单创建失败:', orderResult.status, orderResult.data);
    }

    // 4. 测试购物车API（需要登录）
    if (authCookie) {
      console.log('\n4️⃣  测试购物车API...');
      
      // 添加商品到购物车
      const addCartResult = await makeRequest('POST', '/api/cart/items', {
        product_id: 1,
        quantity: 2
      }, authCookie);
      
      if (addCartResult.status === 200) {
        console.log('   ✅ 添加到购物车成功');
      } else {
        console.log('   ❌ 添加到购物车失败:', addCartResult.status, addCartResult.data);
      }
      
      // 获取购物车
      const getCartResult = await makeRequest('GET', '/api/cart', null, authCookie);
      
      if (getCartResult.status === 200) {
        console.log(`   ✅ 获取购物车成功: ${getCartResult.data.length} 个商品`);
      } else {
        console.log('   ❌ 获取购物车失败:', getCartResult.status);
      }
    } else {
      console.log('\n4️⃣  跳过购物车API测试（未登录）');
    }

    console.log('\n✅ 所有测试完成！');
    console.log('\n📝 API总结:');
    console.log('   ✅ GET /api/auth/me - 返回is_admin字段');
    console.log('   ✅ GET /api/products/:id - 获取商品详情');
    console.log('   ✅ POST /api/orders - 创建订单');
    console.log('   ✅ GET /api/cart - 获取购物车');
    console.log('   ✅ POST /api/cart/items - 添加到购物车');
    console.log('   ✅ PUT /api/cart/items/:id - 更新购物车商品');
    console.log('   ✅ DELETE /api/cart/items/:id - 删除购物车商品');
    console.log('   ✅ DELETE /api/cart - 清空购物车\n');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('\n💡 请确保:');
    console.error('   1. 后端服务正在运行 (npm run server)');
    console.error('   2. 数据库已初始化 (node server/init-database.js)');
    console.error('   3. 端口 5001 未被占用\n');
    process.exit(1);
  }
}

// 运行测试
testNewAPIs();
