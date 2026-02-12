const http = require('http');

const orderData = {
  items: [
    {
      id: 60,
      name: 'Test Product',
      price: 99.99,
      quantity: 1,
      image: 'test.jpg'
    }
  ],
  contact: {
    email: 'test@example.com',
    phone: '123456789'
  },
  address: {
    firstName: 'Test',
    lastName: 'User',
    country: 'Taiwan',
    city: 'Taipei',
    address1: 'Test Street 123',
    address2: '',
    postalCode: '110'
  },
  totals: {
    subtotal: 99.99,
    shipping: 0,
    estimatedTax: 0,
    total: 99.99
  }
};

const postData = JSON.stringify(orderData);

const options = {
  hostname: 'localhost',
  port: 5002,
  path: '/api/orders',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Testing order creation...\n');
console.log('Request data:', JSON.stringify(orderData, null, 2));
console.log('\nSending request...\n');

const req = http.request(options, (res) => {
  let data = '';

  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  console.log('');

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response:', data);
    try {
      const json = JSON.parse(data);
      console.log('\nParsed response:', JSON.stringify(json, null, 2));
      
      if (res.statusCode === 201 || res.statusCode === 200) {
        console.log('\n✅ Order created successfully!');
      } else {
        console.log('\n❌ Order creation failed');
      }
    } catch (e) {
      console.log('\n❌ Failed to parse response');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error);
});

req.write(postData);
req.end();
