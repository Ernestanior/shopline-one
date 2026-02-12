#!/usr/bin/env node

/**
 * 测试用户反馈和订阅系统
 */

const http = require('http');

const API_BASE = 'http://localhost:5002';

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch {
          resolve({ status: res.statusCode, data: body });
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

async function testFeedbackSystem() {
  console.log('🧪 测试用户反馈和订阅系统\n');

  try {
    // 1. 测试提交反馈
    console.log('1️⃣  测试提交用户反馈...');
    const feedbackResult = await makeRequest('POST', '/api/contact', {
      name: 'Test User',
      email: 'test@example.com',
      subject: 'Test Feedback',
      message: 'This is a test feedback message.'
    });
    
    if (feedbackResult.status === 200) {
      console.log('   ✅ 反馈提交成功:', feedbackResult.data.message);
    } else {
      console.log('   ❌ 反馈提交失败:', feedbackResult.status, feedbackResult.data);
    }

    // 2. 测试邮件订阅
    console.log('\n2️⃣  测试邮件订阅...');
    const subscribeResult = await makeRequest('POST', '/api/newsletter/subscribe', {
      email: 'subscriber@example.com'
    });
    
    if (subscribeResult.status === 200) {
      console.log('   ✅ 订阅成功:', subscribeResult.data.message);
    } else {
      console.log('   ❌ 订阅失败:', subscribeResult.status, subscribeResult.data);
    }

    // 3. 测试重复订阅
    console.log('\n3️⃣  测试重复订阅...');
    const duplicateResult = await makeRequest('POST', '/api/newsletter/subscribe', {
      email: 'subscriber@example.com'
    });
    
    if (duplicateResult.status === 200) {
      console.log('   ✅ 重复订阅处理正确:', duplicateResult.data.message);
    } else {
      console.log('   ❌ 重复订阅处理失败:', duplicateResult.status, duplicateResult.data);
    }

    console.log('\n✅ 所有测试完成！');
    console.log('\n📝 下一步:');
    console.log('   1. 访问 http://localhost:3000/contact 提交反馈');
    console.log('   2. 访问 http://localhost:3000 订阅邮件');
    console.log('   3. 访问 http://localhost:3000/admin 查看管理后台');
    console.log('   4. 使用 admin@xyvn.com / admin123 登录管理后台\n');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('\n💡 请确保:');
    console.error('   1. 后端服务正在运行 (npm start)');
    console.error('   2. 数据库已初始化 (node server/init-database.js)');
    console.error('   3. 端口 5001 未被占用\n');
    process.exit(1);
  }
}

// 运行测试
testFeedbackSystem();
