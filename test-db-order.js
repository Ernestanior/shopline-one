const mysql = require('mysql2/promise');
require('dotenv').config();

async function testOrderCreation() {
  let connection;
  
  try {
    console.log('连接数据库...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'shop'
    });

    console.log('✅ 数据库连接成功\n');

    const orderNumber = `TEST-${Date.now()}`;
    const address = {
      firstName: 'Test',
      lastName: 'User',
      country: 'Taiwan',
      city: 'Taipei',
      address1: 'Test St',
      postalCode: '110'
    };

    console.log('创建订单...');
    const [orderResult] = await connection.execute(
      `INSERT INTO orders (
        user_id, order_number, total_amount, status, payment_status,
        shipping_name, shipping_email, shipping_phone, shipping_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        null,
        orderNumber,
        99.99,
        'pending',
        'unpaid',
        'Test User',
        'test@example.com',
        '123456789',
        JSON.stringify(address)
      ]
    );

    console.log('✅ 订单创建成功!');
    console.log('订单ID:', orderResult.insertId);
    console.log('订单号:', orderNumber);

    const orderId = orderResult.insertId;

    console.log('\n创建订单项...');
    await connection.execute(
      `INSERT INTO order_items (
        order_id, product_id, product_name, product_image, quantity, price, subtotal
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        60,
        'Test Product',
        'test.jpg',
        1,
        99.99,
        99.99
      ]
    );

    console.log('✅ 订单项创建成功!');
    console.log('\n✅ 完整订单创建成功!');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error('错误代码:', error.code);
    console.error('SQL消息:', error.sqlMessage);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testOrderCreation();
