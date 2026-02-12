const axios = require('axios');

async function debugOrderFrontend() {
  const baseURL = 'http://localhost:5002';
  
  console.log('Debugging Order Detail Issue...\n');
  
  try {
    // Login as admin
    console.log('Step 1: Login as admin...');
    const loginRes = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'admin@xyvn.com',
      password: 'admin123'
    }, {
      withCredentials: true
    });
    
    const cookies = loginRes.headers['set-cookie'];
    const cookieHeader = cookies ? cookies.join('; ') : '';
    console.log('✓ Logged in as:', loginRes.data.user.email);
    
    // Get orders list
    console.log('\nStep 2: Get orders list...');
    const ordersRes = await axios.get(`${baseURL}/api/admin/orders`, {
      headers: { Cookie: cookieHeader },
      withCredentials: true
    });
    
    console.log('✓ Found', ordersRes.data.orders.length, 'orders');
    
    if (ordersRes.data.orders.length === 0) {
      console.log('No orders to test with');
      return;
    }
    
    const testOrder = ordersRes.data.orders[0];
    console.log('\nTesting with order:', testOrder.id, '-', testOrder.order_number);
    
    // Test admin API
    console.log('\nStep 3: Test admin order detail API...');
    const adminRes = await axios.get(`${baseURL}/api/admin/orders/${testOrder.id}`, {
      headers: { Cookie: cookieHeader },
      withCredentials: true
    });
    
    console.log('✓ Admin API Response:');
    console.log('  Type:', typeof adminRes.data);
    console.log('  Has order_number:', !!adminRes.data.order_number);
    console.log('  Has items:', !!adminRes.data.items);
    console.log('  Items count:', adminRes.data.items ? adminRes.data.items.length : 0);
    console.log('  Keys:', Object.keys(adminRes.data).join(', '));
    
    // Check if response matches Order interface
    const requiredFields = [
      'id', 'order_number', 'total_amount', 'status', 'payment_status',
      'shipping_name', 'shipping_email', 'shipping_phone', 'shipping_address',
      'created_at', 'items'
    ];
    
    console.log('\nChecking required fields:');
    const missingFields = [];
    requiredFields.forEach(field => {
      const exists = field in adminRes.data;
      console.log(`  ${field}: ${exists ? '✓' : '✗'}`);
      if (!exists) missingFields.push(field);
    });
    
    if (missingFields.length > 0) {
      console.log('\n⚠️  Missing fields:', missingFields.join(', '));
    } else {
      console.log('\n✓ All required fields present');
    }
    
    // Check items structure
    if (adminRes.data.items && adminRes.data.items.length > 0) {
      console.log('\nChecking first item structure:');
      const item = adminRes.data.items[0];
      const itemFields = [
        'id', 'product_id', 'product_name', 'product_image',
        'quantity', 'price', 'subtotal'
      ];
      itemFields.forEach(field => {
        const exists = field in item;
        console.log(`  ${field}: ${exists ? '✓' : '✗'} (${typeof item[field]})`);
      });
    }
    
    // Full response for debugging
    console.log('\n=== FULL RESPONSE ===');
    console.log(JSON.stringify(adminRes.data, null, 2));
    
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

debugOrderFrontend();
