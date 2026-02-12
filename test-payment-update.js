const mysql = require('mysql2/promise');
require('dotenv').config();

async function testPaymentUpdate() {
  const db = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'shop_dev',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'shop'
  });

  try {
    console.log('Testing payment status update...\n');

    // Get an unpaid order
    const [orders] = await db.execute(
      "SELECT id, order_number, payment_status FROM orders WHERE payment_status = 'unpaid' LIMIT 1"
    );

    if (orders.length === 0) {
      console.log('No unpaid orders found in database');
      return;
    }

    const order = orders[0];
    console.log('Found unpaid order:');
    console.log(`  ID: ${order.id}`);
    console.log(`  Order Number: ${order.order_number}`);
    console.log(`  Payment Status: ${order.payment_status}\n`);

    // Update payment status
    console.log('Updating payment status to "paid"...');
    await db.execute(
      "UPDATE orders SET payment_status = 'paid' WHERE id = ?",
      [order.id]
    );

    // Verify update
    const [updated] = await db.execute(
      'SELECT id, order_number, payment_status FROM orders WHERE id = ?',
      [order.id]
    );

    console.log('\nAfter update:');
    console.log(`  ID: ${updated[0].id}`);
    console.log(`  Order Number: ${updated[0].order_number}`);
    console.log(`  Payment Status: ${updated[0].payment_status}`);

    if (updated[0].payment_status === 'paid') {
      console.log('\n✓ Payment status update successful!');
    } else {
      console.log('\n✗ Payment status update failed!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.end();
  }
}

testPaymentUpdate();
