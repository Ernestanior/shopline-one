const fetch = require('node-fetch');

async function testBackendAPI() {
  const backendURL = 'http://localhost:5002';
  
  console.log('Testing backend API endpoints...\n');

  try {
    // Test 1: Check if backend is running
    console.log('1. Testing backend server...');
    const healthResponse = await fetch(`${backendURL}/api/categories`);
    console.log(`   Status: ${healthResponse.status}`);
    
    if (healthResponse.status === 200) {
      console.log('   ✓ Backend server is running\n');
    } else {
      console.log('   ✗ Backend server returned error\n');
      return;
    }

    // Test 2: Check if payment endpoint exists
    console.log('2. Testing payment endpoint (without auth)...');
    const paymentResponse = await fetch(`${backendURL}/api/user/orders/1/payment`, {
      method: 'PATCH'
    });
    console.log(`   Status: ${paymentResponse.status}`);
    
    if (paymentResponse.status === 401) {
      console.log('   ✓ Endpoint exists (requires authentication)\n');
    } else if (paymentResponse.status === 404) {
      console.log('   ✗ Endpoint NOT FOUND - backend needs restart!\n');
      console.log('   Please restart backend server: node server/index.js\n');
      return;
    } else {
      console.log(`   ? Unexpected status: ${paymentResponse.status}\n`);
    }

    console.log('Backend API is properly configured.');
    console.log('\nIf frontend still shows 404:');
    console.log('1. Stop frontend dev server (Ctrl+C in client folder)');
    console.log('2. Restart frontend: npm start');
    console.log('3. Clear browser cache (Ctrl+Shift+R)');
    console.log('4. Try again');

  } catch (error) {
    console.error('Error:', error.message);
    console.log('\n✗ Backend server is NOT running');
    console.log('  Please start it: node server/index.js');
  }
}

testBackendAPI();
