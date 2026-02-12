const mysql = require('mysql2/promise');
require('dotenv').config();

async function testOrderDetailAPI() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ecommerce'
  });

  console.log('Testing Order Detail API...\n');

  // Get first order
  const [orders] = await db.execute('SELECT * FROM orders LIMIT 1');
  
  if (orders.length === 0) {
    console.log('No orders found in database');
    await db.end();
    return;
  }

  const order = orders[0];
  console.log('Order found:');
  console.log('  ID:', order.id);
  console.log('  Order Number:', order.order_number);
  console.log('  User ID:', order.user_id);
  console.log('  Total Amount:', order.total_amount);
  console.log('  Status:', order.status);
  console.log('  Payment Status:', order.payment_status);
  console.log('  Shipping Name:', order.shipping_name);
  console.log('  Shipping Email:', order.shipping_email);
  console.log('  Shipping Phone:', order.shipping_phone);
  console.log('  Shipping Address:', order.shipping_address);
  console.log('  Created At:', order.created_at);

  // Get order items
  const [items] = await db.execute(
    'SELECT * FROM order_items WHERE order_id = ?',
    [order.id]
  );

  console.log('\nOrder Items:');
  if (items.length === 0) {
    console.log('  No items found');
  } else {
    items.forEach((item, idx) => {
      console.log(`  Item ${idx + 1}:`);
      console.log('    ID:', item.id);
      console.log('    Product ID:', item.product_id);
      console.log('    Product Name:', item.product_name);
      console.log('    Product Image:', item.product_image);
      console.log('    Quantity:', item.quantity);
      console.log('    Price:', item.price);
      console.log('    Subtotal:', item.subtotal);
    });
  }

  // Check if user_id is NULL
  if (order.user_id === null) {
    console.log('\n⚠️  WARNING: This order has user_id = NULL (guest order)');
    console.log('The API endpoint /api/user/orders/:id requires authentication');
    console.log('and checks: WHERE id = ? AND user_id = ?');
    console.log('This will NOT work for guest orders!');
  }

  await db.end();
}

testOrderDetailAPI().catch(console.error);
