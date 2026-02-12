/**
 * 检查前后端服务器状态
 */

const http = require('http');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkServer(name, url, port) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: '/',
      method: 'GET',
      timeout: 2000
    };

    const req = http.request(options, (res) => {
      log(`✓ ${name} 运行正常 (${url})`, 'green');
      resolve(true);
    });

    req.on('error', () => {
      log(`✗ ${name} 未运行 (${url})`, 'red');
      resolve(false);
    });

    req.on('timeout', () => {
      log(`✗ ${name} 响应超时 (${url})`, 'red');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function main() {
  console.log('\n' + '='.repeat(60));
  log('服务器状态检查', 'cyan');
  console.log('='.repeat(60) + '\n');

  const backendRunning = await checkServer(
    '后端服务器',
    'http://localhost:5002',
    5002
  );

  const frontendRunning = await checkServer(
    '前端服务器',
    'http://localhost:3001',
    3001
  );

  console.log('\n' + '='.repeat(60));
  log('检查结果', 'cyan');
  console.log('='.repeat(60) + '\n');

  if (backendRunning && frontendRunning) {
    log('✓ 所有服务器运行正常', 'green');
    log('\n可以开始测试！', 'green');
    log('\n手动测试指南: test-account-manual.md', 'yellow');
    log('自动化测试: node test-account-system.js', 'yellow');
  } else {
    log('✗ 部分服务器未运行', 'red');
    log('\n请启动服务器：', 'yellow');
    
    if (!backendRunning) {
      log('  后端: node server/index.js', 'yellow');
    }
    
    if (!frontendRunning) {
      log('  前端: cd client && npm start', 'yellow');
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

main();
