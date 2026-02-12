/**
 * 用户账户系统自动化测试 (Node.js版本)
 */

const http = require('http');

const BASE_URL = 'localhost';
const PORT = 5002;

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logTest(name) {
  log(`\n▶ ${name}`, 'blue');
}

function logSuccess(message) {
  log(`  ✓ ${message}`, 'green');
}

function logError(message) {
  log(`  ✗ ${message}`, 'red');
}

// 测试统计
let stats = {
  total: 0,
  passed: 0,
  failed: 0
};

// 存储测试数据
let testData = {
  sessionCookie: null,
  addressId: null,
  paymentMethodId: null
};

/**
 * 发送HTTP请求
 */
function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const postData = options.body ? JSON.stringify(options.body) : null;
    
    const reqOptions = {
      hostname: BASE_URL,
      port: PORT,
      path: path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    if (testData.sessionCookie) {
      reqOptions.headers['Cookie'] = testData.sessionCookie;
    }

    if (postData) {
      reqOptions.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(reqOptions, (res) => {
      let data = '';

      // 保存session cookie
      const setCookie = res.headers['set-cookie'];
      if (setCookie && !testData.sessionCookie) {
        testData.sessionCookie = setCookie[0].split(';')[0];
      }

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: { error: 'Invalid JSON' } });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postData) {
      req.write(postData);
    }

    req.end();
  });
}

/**
 * 测试用户注册
 */
async function testUserRegistration() {
  logTest('用户注册');
  stats.total++;

  try {
    const timestamp = Date.now();
    const email = `test_${timestamp}@example.com`;
    const password = 'Test123456';

    const { statusCode, data } = await request('/api/auth/register', {
      method: 'POST',
      body: { email, password }
    });

    if ((statusCode === 200 || statusCode === 201) && data.user) {
      logSuccess(`注册成功: ${email}`);
      logSuccess(`用户ID: ${data.user.id}`);
      stats.passed++;
      return true;
    } else if (statusCode === 400 && data.error && data.error.includes('already exists')) {
      // 邮箱已存在，尝试登录
      logSuccess(`用户已存在，尝试登录...`);
      const loginResult = await request('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      });
      if (loginResult.statusCode === 200 && loginResult.data.user) {
        logSuccess(`登录成功: ${email}`);
        stats.passed++;
        return true;
      }
      logError(`登录失败`);
      stats.failed++;
      return false;
    } else {
      logError(`注册失败 (${statusCode}): ${data.error || JSON.stringify(data)}`);
      stats.failed++;
      return false;
    }
  } catch (error) {
    logError(`注册异常: ${error.message}`);
    stats.failed++;
    return false;
  }
}

/**
 * 测试添加地址
 */
async function testAddAddress() {
  logTest('添加收货地址');
  stats.total++;

  try {
    const addressData = {
      label: 'home',
      first_name: '测试',
      last_name: '用户',
      phone: '+886912345678',
      country: 'Taiwan',
      city: 'Taipei',
      address1: '信义路五段7号',
      address2: '101大楼',
      postal_code: '110',
      is_default: 1
    };

    const { statusCode, data } = await request('/api/user/addresses', {
      method: 'POST',
      body: addressData
    });

    if (statusCode === 200 && data.success && data.id) {
      testData.addressId = data.id;
      logSuccess(`地址添加成功: ID ${testData.addressId}`);
      logSuccess(`地址: ${addressData.city}, ${addressData.address1}`);
      stats.passed++;
      return true;
    } else {
      logError(`添加地址失败 (${statusCode}): ${data.error || JSON.stringify(data)}`);
      stats.failed++;
      return false;
    }
  } catch (error) {
    logError(`添加地址异常: ${error.message}`);
    stats.failed++;
    return false;
  }
}

/**
 * 测试获取地址列表
 */
async function testGetAddresses() {
  logTest('获取地址列表');
  stats.total++;

  try {
    const { statusCode, data } = await request('/api/user/addresses');

    if (statusCode === 200 && Array.isArray(data.addresses)) {
      logSuccess(`获取成功: 共 ${data.addresses.length} 个地址`);
      
      if (data.addresses.length > 0) {
        const defaultAddr = data.addresses.find(a => a.is_default);
        if (defaultAddr) {
          logSuccess(`默认地址: ${defaultAddr.city}, ${defaultAddr.address1}`);
        }
      }
      
      stats.passed++;
      return true;
    } else {
      logError(`获取地址列表失败: ${data.error || '未知错误'}`);
      stats.failed++;
      return false;
    }
  } catch (error) {
    logError(`获取地址列表异常: ${error.message}`);
    stats.failed++;
    return false;
  }
}

/**
 * 测试添加支付方式
 */
async function testAddPaymentMethod() {
  logTest('添加支付方式');
  stats.total++;

  try {
    const paymentData = {
      card_type: 'visa',
      card_last4: '4242',
      card_holder_name: '测试用户',
      expiry_month: '12',
      expiry_year: '2028',
      is_default: 1
    };

    const { statusCode, data } = await request('/api/user/payment-methods', {
      method: 'POST',
      body: paymentData
    });

    if (statusCode === 200 && data.success && data.id) {
      testData.paymentMethodId = data.id;
      logSuccess(`支付方式添加成功: ID ${testData.paymentMethodId}`);
      logSuccess(`卡类型: ${paymentData.card_type.toUpperCase()}`);
      logSuccess(`卡号后4位: ${paymentData.card_last4}`);
      stats.passed++;
      return true;
    } else {
      logError(`添加支付方式失败 (${statusCode}): ${data.error || JSON.stringify(data)}`);
      stats.failed++;
      return false;
    }
  } catch (error) {
    logError(`添加支付方式异常: ${error.message}`);
    stats.failed++;
    return false;
  }
}

/**
 * 测试获取支付方式列表
 */
async function testGetPaymentMethods() {
  logTest('获取支付方式列表');
  stats.total++;

  try {
    const { statusCode, data } = await request('/api/user/payment-methods');

    if (statusCode === 200 && Array.isArray(data.payment_methods)) {
      logSuccess(`获取成功: 共 ${data.payment_methods.length} 个支付方式`);
      
      if (data.payment_methods.length > 0) {
        const defaultMethod = data.payment_methods.find(m => m.is_default);
        if (defaultMethod) {
          logSuccess(`默认支付方式: ${defaultMethod.card_type.toUpperCase()} ****${defaultMethod.card_last4}`);
        }
      }
      
      stats.passed++;
      return true;
    } else {
      logError(`获取支付方式列表失败: ${data.error || '未知错误'}`);
      stats.failed++;
      return false;
    }
  } catch (error) {
    logError(`获取支付方式列表异常: ${error.message}`);
    stats.failed++;
    return false;
  }
}

/**
 * 测试创建订单
 */
async function testCreateOrder() {
  logTest('创建订单');
  stats.total++;

  try {
    const orderData = {
      items: [
        {
          id: 1,
          name: '测试商品',
          price: 99.99,
          quantity: 2,
          image: 'https://example.com/image.jpg'
        }
      ],
      contact: {
        email: 'test@example.com',
        phone: '+886912345678'
      },
      address: {
        firstName: '测试',
        lastName: '用户',
        country: 'Taiwan',
        city: 'Taipei',
        address1: '信义路五段7号',
        address2: '101大楼',
        postalCode: '110'
      },
      totals: {
        subtotal: 199.98,
        shipping: 0,
        estimatedTax: 0,
        total: 199.98
      }
    };

    const { statusCode, data } = await request('/api/orders', {
      method: 'POST',
      body: orderData
    });

    if ((statusCode === 200 || statusCode === 201) && data.success && data.order) {
      logSuccess(`订单创建成功: ${data.order.orderNumber}`);
      logSuccess(`订单ID: ${data.order.id}`);
      logSuccess(`订单金额: $${orderData.totals.total}`);
      stats.passed++;
      return true;
    } else {
      logError(`创建订单失败 (${statusCode}): ${data.error || JSON.stringify(data)}`);
      stats.failed++;
      return false;
    }
  } catch (error) {
    logError(`创建订单异常: ${error.message}`);
    stats.failed++;
    return false;
  }
}

/**
 * 测试获取订单历史
 */
async function testGetOrders() {
  logTest('获取订单历史');
  stats.total++;

  try {
    const { statusCode, data } = await request('/api/user/orders');

    if (statusCode === 200 && Array.isArray(data.orders)) {
      logSuccess(`获取成功: 共 ${data.orders.length} 个订单`);
      
      if (data.orders.length > 0) {
        const latestOrder = data.orders[0];
        logSuccess(`最新订单: ${latestOrder.order_number}`);
        logSuccess(`订单状态: ${latestOrder.status}`);
        logSuccess(`订单金额: $${latestOrder.total_amount}`);
      }
      
      stats.passed++;
      return true;
    } else {
      logError(`获取订单历史失败: ${data.error || '未知错误'}`);
      stats.failed++;
      return false;
    }
  } catch (error) {
    logError(`获取订单历史异常: ${error.message}`);
    stats.failed++;
    return false;
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  logSection('用户账户系统自动化测试');
  log(`测试服务器: http://${BASE_URL}:${PORT}`, 'yellow');
  log(`开始时间: ${new Date().toLocaleString('zh-CN')}`, 'yellow');

  try {
    // 1. 用户注册
    logSection('1. 用户注册和认证');
    await testUserRegistration();

    // 2. 地址管理
    logSection('2. 地址管理功能');
    await testAddAddress();
    await testGetAddresses();

    // 3. 支付方式管理
    logSection('3. 支付方式管理功能');
    await testAddPaymentMethod();
    await testGetPaymentMethods();

    // 4. 订单管理
    logSection('4. 订单管理功能');
    await testCreateOrder();
    await testGetOrders();

  } catch (error) {
    logError(`测试执行异常: ${error.message}`);
    console.error(error);
  }

  // 输出测试报告
  printTestReport();
}

/**
 * 打印测试报告
 */
function printTestReport() {
  logSection('测试报告');
  
  console.log('\n测试统计:');
  log(`  总测试数: ${stats.total}`, 'cyan');
  log(`  通过: ${stats.passed}`, 'green');
  log(`  失败: ${stats.failed}`, stats.failed > 0 ? 'red' : 'reset');
  
  const passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(2) : 0;
  console.log(`\n通过率: ${passRate}%`);
  
  if (stats.failed === 0) {
    log('\n✓ 所有测试通过！', 'green');
  } else {
    log(`\n✗ ${stats.failed} 个测试失败`, 'red');
  }

  log(`\n结束时间: ${new Date().toLocaleString('zh-CN')}`, 'yellow');
  console.log('='.repeat(60) + '\n');
}

// 运行测试
runAllTests().catch(error => {
  logError(`测试运行失败: ${error.message}`);
  console.error(error);
  process.exit(1);
});
