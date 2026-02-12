const mysql = require('mysql2/promise');
require('dotenv').config();

async function debugPaymentIssue() {
  const db = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'shop_dev',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'shop'
  });

  try {
    console.log('Debugging payment update issue...\n');

    // Get an unpaid order
    const [orders] = await db.execute(
      `SELECT o.id, o.order_number, o.user_id, o.payment_status, u.email
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.payment_status = 'unpaid'
       LIMIT 1`
    );

    if (orders.length === 0) {
      console.log('No unpaid orders found');
      return;
    }

    const order = orders[0];
    console.log('Found unpaid order:');
    console.log(`  Order ID: ${order.id}`);
    console.log(`  Order Number: ${order.order_number}`);
    console.log(`  User ID: ${order.user_id || 'NULL (guest order)'}`);
    console.log(`  User Email: ${order.email || 'N/A'}`);
    console.log(`  Payment Status: ${order.payment_status}\n`);

    if (!order.user_id) {
      console.log('⚠️  This is a GUEST order (user_id is NULL)');
      console.log('   The payment API requires authentication (req.user)');
      console.log('   Guest orders cannot update payment status through the API\n');
      console.log('Solution: Only logged-in users can update payment status');
      console.log('         Guest orders will remain unpaid in this demo\n');
      return;
    }

    // Try to update the payment status directly in database
    console.log('Attempting to update payment status in database...');
    await db.execute(
      "UPDATE orders SET payment_status = 'paid' WHERE id = ?",
      [order.id]
    );

    // Verify
    const [updated] = await db.execute(
      'SELECT payment_status FROM orders WHERE id = ?',
      [order.id]
    );

    console.log(`Updated payment status: ${updated[0].payment_status}`);
    
    if (updated[0].payment_status === 'paid') {
      console.log('✓ Database update successful!\n');
      console.log('If the frontend still shows "unpaid", the issue is:');
      console.log('1. API endpoint not working (check server logs)');
      console.log('2. Authentication issue (user not logged in)');
      console.log('3. Frontend not calling the correct API');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.end();
  }
}

debugPaymentIssue();
