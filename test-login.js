#!/usr/bin/env node

/**
 * 测试登录功能
 */

const http = require('http');

const API_BASE = 'http://localhost:5002';

function makeRequest(method, path, data = null, cookie = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3001'
      }
    };

    if (cookie) {
      options.headers['Cookie'] = cookie;
    }

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          const setCookie = res.headers['set-cookie'];
          resolve({ 
            status: res.statusCode, 
            data: json, 
            cookie: setCookie,
            headers: res.headers
          });
        } catch {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testLogin() {
  console.log('🧪 测试登录功能\n');

  try {
    // 1. 测试登录
    console.log('1️⃣  测试登录...');
    console.log('   邮箱: admin@xyvn.com');
    console.log('   密码: admin123\n');
    
    const loginResult = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@xyvn.com',
      password: 'admin123'
    });
    
    console.log('   状态码:', loginResult.status);
    console.log('   响应数据:', JSON.stringify(loginResult.data, null, 2));
    
    if (loginResult.status === 200) {
      console.log('   ✅ 登录成功！');
      
      if (loginResult.cookie) {
        console.log('   ✅ Cookie已设置:', loginResult.cookie[0].substring(0, 50) + '...');
      } else {
        console.log('   ⚠️  警告: 没有设置Cookie');
      }
      
      // 2. 测试获取用户信息
      console.log('\n2️⃣  测试获取用户信息...');
      const authCookie = loginResult.cookie ? loginResult.cookie[0] : null;
      
      if (authCookie) {
        const meResult = await makeRequest('GET', '/api/auth/me', null, authCookie);
        console.log('   状态码:', meResult.status);
        console.log('   用户信息:', JSON.stringify(meResult.data, null, 2));
        
        if (meResult.status === 200 && meResult.data.user) {
          console.log('   ✅ 获取用户信息成功！');
          
          if (meResult.data.user.is_admin !== undefined) {
            console.log('   ✅ is_admin字段存在:', meResult.data.user.is_admin);
          } else {
            console.log('   ⚠️  警告: is_admin字段缺失');
          }
        } else {
          console.log('   ❌ 获取用户信息失败');
        }
      }
      
      // 3. 测试CORS
      console.log('\n3️⃣  检查CORS配置...');
      if (loginResult.headers['access-control-allow-credentials']) {
        console.log('   ✅ Access-Control-Allow-Credentials:', loginResult.headers['access-control-allow-credentials']);
      } else {
        console.log('   ❌ 缺少 Access-Control-Allow-Credentials 头');
      }
      
      if (loginResult.headers['vary']) {
        console.log('   ✅ Vary:', loginResult.headers['vary']);
      }
      
    } else if (loginResult.status === 401) {
      console.log('   ❌ 登录失败: 用户名或密码错误');
      console.log('   💡 请检查数据库中是否有管理员账户');
      console.log('   💡 运行: node server/init-database.js');
    } else {
      console.log('   ❌ 登录失败:', loginResult.status);
      console.log('   错误信息:', loginResult.data);
    }
    
    console.log('\n✅ 测试完成！');
    
    console.log('\n📝 登录流程说明:');
    console.log('   1. 前端发送 POST /api/auth/login');
    console.log('   2. 后端验证用户名密码');
    console.log('   3. 后端设置 HttpOnly Cookie');
    console.log('   4. 前端自动携带 Cookie 访问其他API');
    console.log('   5. 后端从 Cookie 中验证用户身份\n');
    
    console.log('💡 如果前端登录失败，请检查:');
    console.log('   1. 后端是否运行在 http://localhost:5002');
    console.log('   2. 前端是否运行在 http://localhost:3001');
    console.log('   3. 浏览器控制台是否有CORS错误');
    console.log('   4. 浏览器控制台是否有网络错误');
    console.log('   5. Cookie是否被浏览器阻止\n');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('\n💡 请确保:');
    console.error('   1. 后端服务正在运行 (npm run server)');
    console.error('   2. 数据库已初始化 (node server/init-database.js)');
    console.error('   3. 端口 5002 未被占用\n');
    process.exit(1);
  }
}

// 运行测试
testLogin();
