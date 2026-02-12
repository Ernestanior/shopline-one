const axios = require('axios');

async function testAdminOrderAPI() {
  const baseURL = 'http://localhost:5002';
  
  console.log('Testing Admin Order Detail API...\n');
  
  // First, login as admin
  console.log('Step 1: Login as admin...');
  try {
    const loginRes = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'admin@xyvn.com',
      password: 'admin123'
    }, {
      withCredentials: true
    });
    
    console.log('✓ Login successful');
    console.log('User:', loginRes.data.user.email);
    console.log('Is Admin:', loginRes.data.user.is_admin);
    
    const cookies = loginRes.headers['set-cookie'];
    const cookieHeader = cookies ? cookies.join('; ') : '';
    
    // Get orders list
    console.log('\nStep 2: Get orders list...');
    const ordersRes = await axios.get(`${baseURL}/api/admin/orders`, {
      headers: {
        Cookie: cookieHeader
      },
      withCredentials: true
    });
    
    console.log('✓ Orders fetched:', ordersRes.data.orders.length, 'orders');
    
    if (ordersRes.data.orders.length > 0) {
      const firstOrder = ordersRes.data.orders[0];
      console.log('\nFirst order:');
      console.log('  ID:', firstOrder.id);
      console.log('  Order Number:', firstOrder.order_number);
      console.log('  User Email:', firstOrder.user_email);
      console.log('  Total:', firstOrder.total_amount);
      console.log('  Items Count:', firstOrder.items_count);
      
      // Get order detail
      console.log('\nStep 3: Get order detail for order ID:', firstOrder.id);
      const detailRes = await axios.get(`${baseURL}/api/admin/orders/${firstOrder.id}`, {
        headers: {
          Cookie: cookieHeader
        },
        withCredentials: true
      });
      
      console.log('✓ Order detail fetched');
      console.log('\nOrder Detail:');
      console.log('  Order Number:', detailRes.data.order_number);
      console.log('  Total Amount:', detailRes.data.total_amount);
      console.log('  Status:', detailRes.data.status);
      console.log('  Payment Status:', detailRes.data.payment_status);
      console.log('  Shipping Name:', detailRes.data.shipping_name);
      console.log('  Shipping Email:', detailRes.data.shipping_email);
      console.log('  Items:', detailRes.data.items ? detailRes.data.items.length : 0);
      
      if (detailRes.data.items && detailRes.data.items.length > 0) {
        console.log('\nOrder Items:');
        detailRes.data.items.forEach((item, idx) => {
          console.log(`  ${idx + 1}. ${item.product_name} x${item.quantity} - $${item.subtotal}`);
        });
      } else {
        console.log('\n⚠️  WARNING: No items in this order!');
      }
    } else {
      console.log('No orders found in database');
    }
    
  } catch (error) {
    console.error('✗ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testAdminOrderAPI();
