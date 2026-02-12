/**
 * 用户账户系统自动化测试
 * 测试地址管理、支付方式管理和结账自动填充功能
 */

const BASE_URL = 'http://localhost:5002';

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

function logWarning(message) {
  log(`  ⚠ ${message}`, 'yellow');
}

// 测试统计
let stats = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0
};

// 存储测试数据
let testData = {
  userId: null,
  sessionCookie: null,
  addressId: null,
  paymentMethodId: null,
  orderId: null
};

/**
 * 发送HTTP请求
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (testData.sessionCookie) {
    headers['Cookie'] = testData.sessionCookie;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });

  // 保存session cookie
  const setCookie = response.headers.get('set-cookie');
  if (setCookie && !testData.sessionCookie) {
    testData.sessionCookie = setCookie.split(';')[0];
  }

  const data = await response.json();
  return { response, data };
}

/**
 * 测试用户注册
 */
async function testUserRegistration() {
  logTest('用户注册');
  stats.total++;

  try {
    const timestamp = Date.now();
    const email = `test_account_${timestamp}@example.com`;
    const password = 'Test123456';

    const { response, data } = await request('/api/register', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (response.ok && data.user) {
      testData.userId = data.user.id;
      logSuccess(`注册成功: ${email}`);
      logSuccess(`用户ID: ${testData.userId}`);
      stats.passed++;
      return true;
    } else {
      logError(`注册失败: ${data.error || '未知错误'}`);
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

    const { response, data } = await request('/api/user/addresses', {
      method: 'POST',
      body: JSON.stringify(addressData)
    });

    if (response.ok && data.address) {
      testData.addressId = data.address.id;
      logSuccess(`地址添加成功: ID ${testData.addressId}`);
      logSuccess(`地址: ${addressData.city}, ${addressData.address1}`);
      stats.passed++;
      return true;
    } else {
      logError(`添加地址失败: ${data.error || '未知错误'}`);
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
    const { response, data } = await request('/api/user/addresses');

    if (response.ok && Array.isArray(data.addresses)) {
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
 * 测试更新地址
 */
async function testUpdateAddress() {
  logTest('更新地址');
  stats.total++;

  if (!testData.addressId) {
    logWarning('跳过: 没有可更新的地址');
    stats.warnings++;
    return false;
  }

  try {
    const updateData = {
      label: 'work',
      first_name: '测试',
      last_name: '用户',
      phone: '+886987654321',
      country: 'Taiwan',
      city: 'Taipei',
      address1: '南京东路三段219号',
      address2: '办公室',
      postal_code: '105',
      is_default: 1
    };

    const { response, data } = await request(`/api/user/addresses/${testData.addressId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });

    if (response.ok) {
      logSuccess(`地址更新成功`);
      logSuccess(`新地址: ${updateData.city}, ${updateData.address1}`);
      stats.passed++;
      return true;
    } else {
      logError(`更新地址失败: ${data.error || '未知错误'}`);
      stats.failed++;
      return false;
    }
  } catch (error) {
    logError(`更新地址异常: ${error.message}`);
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

    const { response, data } = await request('/api/user/payment-methods', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });

    if (response.ok && data.payment_method) {
      testData.paymentMethodId = data.payment_method.id;
      logSuccess(`支付方式添加成功: ID ${testData.paymentMethodId}`);
      logSuccess(`卡类型: ${paymentData.card_type.toUpperCase()}`);
      logSuccess(`卡号后4位: ${paymentData.card_last4}`);
      stats.passed++;
      return true;
    } else {
      logError(`添加支付方式失败: ${data.error || '未知错误'}`);
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
    const { response, data } = await request('/api/user/payment-methods');

    if (response.ok && Array.isArray(data.payment_methods)) {
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

    const { response, data } = await request('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });

    if (response.ok && data.order) {
      testData.orderId = data.order.id;
      logSuccess(`订单创建成功: ${data.order.orderNumber}`);
      logSuccess(`订单ID: ${testData.orderId}`);
      logSuccess(`订单金额: $${orderData.totals.total}`);
      stats.passed++;
      return true;
    } else {
      logError(`创建订单失败: ${data.error || '未知错误'}`);
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
    const { response, data } = await request('/api/user/orders');

    if (response.ok && Array.isArray(data.orders)) {
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
 * 测试添加第二个地址
 */
async function testAddSecondAddress() {
  logTest('添加第二个地址（非默认）');
  stats.total++;

  try {
    const addressData = {
      label: 'other',
      first_name: '测试',
      last_name: '用户2',
      phone: '+886922222222',
      country: 'Taiwan',
      city: 'Kaohsiung',
      address1: '中正四路211号',
      address2: '',
      postal_code: '800',
      is_default: 0
    };

    const { response, data } = await request('/api/user/addresses', {
      method: 'POST',
      body: JSON.stringify(addressData)
    });

    if (response.ok && data.address) {
      logSuccess(`第二个地址添加成功: ID ${data.address.id}`);
      logSuccess(`地址: ${addressData.city}, ${addressData.address1}`);
      stats.passed++;
      return true;
    } else {
      logError(`添加第二个地址失败: ${data.error || '未知错误'}`);
      stats.failed++;
      return false;
    }
  } catch (error) {
    logError(`添加第二个地址异常: ${error.message}`);
    stats.failed++;
    return false;
  }
}

/**
 * 测试添加第二个支付方式
 */
async function testAddSecondPaymentMethod() {
  logTest('添加第二个支付方式（非默认）');
  stats.total++;

  try {
    const paymentData = {
      card_type: 'mastercard',
      card_last4: '5555',
      card_holder_name: '测试用户2',
      expiry_month: '06',
      expiry_year: '2027',
      is_default: 0
    };

    const { response, data } = await request('/api/user/payment-methods', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });

    if (response.ok && data.payment_method) {
      logSuccess(`第二个支付方式添加成功: ID ${data.payment_method.id}`);
      logSuccess(`卡类型: ${paymentData.card_type.toUpperCase()}`);
      stats.passed++;
      return true;
    } else {
      logError(`添加第二个支付方式失败: ${data.error || '未知错误'}`);
      stats.failed++;
      return false;
    }
  } catch (error) {
    logError(`添加第二个支付方式异常: ${error.message}`);
    stats.failed++;
    return false;
  }
}

/**
 * 测试删除地址
 */
async function testDeleteAddress() {
  logTest('删除地址');
  stats.total++;

  if (!testData.addressId) {
    logWarning('跳过: 没有可删除的地址');
    stats.warnings++;
    return false;
  }

  try {
    const { response, data } = await request(`/api/user/addresses/${testData.addressId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      logSuccess(`地址删除成功: ID ${testData.addressId}`);
      stats.passed++;
      return true;
    } else {
      logError(`删除地址失败: ${data.error || '未知错误'}`);
      stats.failed++;
      return false;
    }
  } catch (error) {
    logError(`删除地址异常: ${error.message}`);
    stats.failed++;
    return false;
  }
}

/**
 * 测试删除支付方式
 */
async function testDeletePaymentMethod() {
  logTest('删除支付方式');
  stats.total++;

  if (!testData.paymentMethodId) {
    logWarning('跳过: 没有可删除的支付方式');
    stats.warnings++;
    return false;
  }

  try {
    const { response, data } = await request(`/api/user/payment-methods/${testData.paymentMethodId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      logSuccess(`支付方式删除成功: ID ${testData.paymentMethodId}`);
      stats.passed++;
      return true;
    } else {
      logError(`删除支付方式失败: ${data.error || '未知错误'}`);
      stats.failed++;
      return false;
    }
  } catch (error) {
    logError(`删除支付方式异常: ${error.message}`);
    stats.failed++;
    return false;
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  logSection('用户账户系统自动化测试');
  log(`测试服务器: ${BASE_URL}`, 'yellow');
  log(`开始时间: ${new Date().toLocaleString('zh-CN')}`, 'yellow');

  try {
    // 1. 用户注册和登录
    logSection('1. 用户注册和认证');
    await testUserRegistration();

    // 2. 地址管理测试
    logSection('2. 地址管理功能');
    await testAddAddress();
    await testGetAddresses();
    await testUpdateAddress();
    await testAddSecondAddress();
    await testGetAddresses(); // 再次获取验证

    // 3. 支付方式管理测试
    logSection('3. 支付方式管理功能');
    await testAddPaymentMethod();
    await testGetPaymentMethods();
    await testAddSecondPaymentMethod();
    await testGetPaymentMethods(); // 再次获取验证

    // 4. 订单管理测试
    logSection('4. 订单管理功能');
    await testCreateOrder();
    await testGetOrders();

    // 5. 删除功能测试
    logSection('5. 删除功能测试');
    await testDeleteAddress();
    await testDeletePaymentMethod();

    // 最终验证
    logSection('6. 最终验证');
    await testGetAddresses();
    await testGetPaymentMethods();

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
  log(`  警告: ${stats.warnings}`, stats.warnings > 0 ? 'yellow' : 'reset');
  
  const passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(2) : 0;
  console.log(`\n通过率: ${passRate}%`);
  
  if (stats.failed === 0) {
    log('\n✓ 所有测试通过！', 'green');
  } else {
    log(`\n✗ ${stats.failed} 个测试失败`, 'red');
  }

  console.log('\n测试数据:');
  console.log(`  用户ID: ${testData.userId || 'N/A'}`);
  console.log(`  地址ID: ${testData.addressId || 'N/A'}`);
  console.log(`  支付方式ID: ${testData.paymentMethodId || 'N/A'}`);
  console.log(`  订单ID: ${testData.orderId || 'N/A'}`);

  log(`\n结束时间: ${new Date().toLocaleString('zh-CN')}`, 'yellow');
  console.log('='.repeat(60) + '\n');
}

// 运行测试
runAllTests().catch(error => {
  logError(`测试运行失败: ${error.message}`);
  console.error(error);
  process.exit(1);
});
