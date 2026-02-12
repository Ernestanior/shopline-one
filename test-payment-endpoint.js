const mysql = require('mysql2/promise');
require('dotenv').config();

async function testPaymentEndpoint() {
  const db = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'shop_dev',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'shop'
  });

  try {
    console.log('Checking backend server status...\n');

    // Check if server is running
    const fetch = require('node-fetch');
    try {
      const response = await fetch('http://localhost:5002/api/categories');
      console.log('✓ Backend server is running on port 5002');
      console.log(`  Response status: ${response.status}\n`);
    } catch (error) {
      console.log('❌ Backend server is NOT running on port 5002');
      console.log('   Please start the server with: node server/index.js\n');
      return;
    }

    // Check database for unpaid orders
    console.log('Checking database for unpaid orders...');
    const [orders] = await db.execute(
      "SELECT id, order_number, user_id, payment_status FROM orders WHERE payment_status = 'unpaid' LIMIT 3"
    );

    if (orders.length === 0) {
      console.log('✓ No unpaid orders found in database\n');
      
      // Check for paid orders
      const [paidOrders] = await db.execute(
        "SELECT id, order_number, payment_status FROM orders WHERE payment_status = 'paid' LIMIT 3"
      );
      
      if (paidOrders.length > 0) {
        console.log('Found paid orders:');
        paidOrders.forEach(o => {
          console.log(`  - Order ${o.order_number}: ${o.payment_status}`);
        });
      }
    } else {
      console.log(`Found ${orders.length} unpaid order(s):\n`);
      orders.forEach(o => {
        console.log(`  Order ID: ${o.id}`);
        console.log(`  Order Number: ${o.order_number}`);
        console.log(`  User ID: ${o.user_id || 'guest'}`);
        console.log(`  Payment Status: ${o.payment_status}`);
        console.log('');
      });

      console.log('To test payment update, you can:');
      console.log('1. Make sure backend server is running (node server/index.js)');
      console.log('2. Make sure frontend is running (npm start in client folder)');
      console.log('3. Login to the website');
      console.log('4. Go to Account > Orders');
      console.log('5. Click "查看" on an unpaid order');
      console.log('6. Click "立即支付" button');
      console.log('7. Refresh this test to verify the status changed to "paid"');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.end();
  }
}

testPaymentEndpoint();
