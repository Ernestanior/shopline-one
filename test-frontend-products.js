const http = require('http');

async function testFrontendAPI() {
  console.log('🧪 测试前端产品API\n');
  
  // 测试通过前端代理访问
  console.log('1️⃣  测试前端代理 (http://localhost:3001/api/products?category=productivity)');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/products?category=productivity',
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      console.log('   状态码:', res.statusCode);
      console.log('   响应头:', JSON.stringify(res.headers, null, 2));
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log('   产品数量:', Array.isArray(json) ? json.length : 'Not an array');
          
          if (Array.isArray(json) && json.length > 0) {
            console.log('   第一个产品:', JSON.stringify(json[0], null, 2));
            console.log('   ✅ 前端API工作正常！');
          } else {
            console.log('   ❌ 返回空数组或格式错误');
            console.log('   响应:', data.substring(0, 500));
          }
          resolve();
        } catch (error) {
          console.log('   ❌ JSON解析失败');
          console.log('   原始响应:', data.substring(0, 500));
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('   ❌ 请求失败:', error.message);
      reject(error);
    });
    
    req.end();
  });
}

// 测试后端API
async function testBackendAPI() {
  console.log('\n2️⃣  测试后端API (http://localhost:5002/api/products?category=productivity)');
  
  const options = {
    hostname: 'localhost',
    port: 5002,
    path: '/api/products?category=productivity',
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      console.log('   状态码:', res.statusCode);
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log('   产品数量:', Array.isArray(json) ? json.length : 'Not an array');
          
          if (Array.isArray(json) && json.length > 0) {
            console.log('   第一个产品:', JSON.stringify(json[0], null, 2));
            console.log('   ✅ 后端API工作正常！');
          } else {
            console.log('   ❌ 返回空数组或格式错误');
          }
          resolve();
        } catch (error) {
          console.log('   ❌ JSON解析失败');
          console.log('   原始响应:', data.substring(0, 500));
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('   ❌ 请求失败:', error.message);
      reject(error);
    });
    
    req.end();
  });
}

async function run() {
  try {
    await testBackendAPI();
    await testFrontendAPI();
    console.log('\n✅ 测试完成！');
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
  }
}

run();
