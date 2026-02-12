const fetch = require('node-fetch');

async function testPaymentAPI() {
  const baseURL = 'http://localhost:5002';
  
  console.log('Testing payment status update API...\n');

  try {
    // First, login to get authentication
    console.log('1. Logging in...');
    const loginResponse = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@xyvn.com',
        password: 'your_password_here'
      })
    });

    const cookies = loginResponse.headers.get('set-cookie');
    console.log('Login response:', loginResponse.status);
    
    if (!cookies) {
      console.log('❌ No authentication cookie received');
      console.log('Please update the email/password in this script');
      return;
    }

    // Get user's orders
    console.log('\n2. Fetching user orders...');
    const ordersResponse = await fetch(`${baseURL}/api/user/orders`, {
      headers: {
        'Cookie': cookies
      }
    });

    const ordersData = await ordersResponse.json();
    console.log('Orders found:', ordersData.orders?.length || 0);

    if (!ordersData.orders || ordersData.orders.length === 0) {
      console.log('❌ No orders found');
      return;
    }

    const unpaidOrder = ordersData.orders.find(o => o.payment_status === 'unpaid');
    
    if (!unpaidOrder) {
      console.log('✓ No unpaid orders found (all orders are paid)');
      return;
    }

    console.log(`\n3. Found unpaid order: ${unpaidOrder.order_number}`);
    console.log(`   Order ID: ${unpaidOrder.id}`);
    console.log(`   Payment Status: ${unpaidOrder.payment_status}`);

    // Update payment status
    console.log('\n4. Updating payment status to "paid"...');
    const updateResponse = await fetch(`${baseURL}/api/user/orders/${unpaidOrder.id}/payment`, {
      method: 'PATCH',
      headers: {
        'Cookie': cookies
      }
    });

    console.log('Update response status:', updateResponse.status);
    
    if (updateResponse.ok) {
      const updateData = await updateResponse.json();
      console.log('Update response:', updateData);
      
      // Verify the update
      console.log('\n5. Verifying update...');
      const verifyResponse = await fetch(`${baseURL}/api/user/orders/${unpaidOrder.id}`, {
        headers: {
          'Cookie': cookies
        }
      });
      
      const verifyData = await verifyResponse.json();
      console.log(`   Payment Status: ${verifyData.order.payment_status}`);
      
      if (verifyData.order.payment_status === 'paid') {
        console.log('\n✓ Payment status update successful!');
      } else {
        console.log('\n❌ Payment status was not updated');
      }
    } else {
      const errorText = await updateResponse.text();
      console.log('❌ Update failed:', errorText);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testPaymentAPI();
