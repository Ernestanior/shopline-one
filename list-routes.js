// 临时脚本：列出 Express 应用中的所有路由
const express = require('express');

// 模拟加载 server/index.js 的路由
console.log('检查 server/index.js 中的路由定义...\n');

const fs = require('fs');
const content = fs.readFileSync('server/index.js', 'utf8');

// 查找所有 app.METHOD 定义
const routePattern = /app\.(get|post|put|patch|delete|use)\(['"`]([^'"`]+)['"`]/g;
const routes = [];
let match;

while ((match = routePattern.exec(content)) !== null) {
  routes.push({
    method: match[1].toUpperCase(),
    path: match[2]
  });
}

console.log(`找到 ${routes.length} 个路由定义:\n`);

// 按方法分组
const grouped = {};
routes.forEach(r => {
  if (!grouped[r.method]) grouped[r.method] = [];
  grouped[r.method].push(r.path);
});

Object.keys(grouped).sort().forEach(method => {
  console.log(`${method}:`);
  grouped[method].forEach(path => {
    console.log(`  ${path}`);
  });
  console.log('');
});

// 特别检查支付端点
const paymentRoute = routes.find(r => r.path.includes('payment'));
if (paymentRoute) {
  console.log(`✓ 支付端点已定义: ${paymentRoute.method} ${paymentRoute.path}`);
} else {
  console.log('✗ 未找到支付端点定义');
}

const deleteOrderRoute = routes.find(r => r.method === 'DELETE' && r.path.includes('/api/user/orders/:id'));
if (deleteOrderRoute) {
  console.log(`✓ 删除订单端点已定义: ${deleteOrderRoute.method} ${deleteOrderRoute.path}`);
} else {
  console.log('✗ 未找到删除订单端点定义');
}
