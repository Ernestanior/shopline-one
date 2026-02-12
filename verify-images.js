/**
 * 验证所有产品图片是否存在
 */

const fs = require('fs');
const path = require('path');

// 读取server/index.js中的产品数据
const serverFile = fs.readFileSync(path.join(__dirname, 'server/index.js'), 'utf8');
const productsMatch = serverFile.match(/const products = \[([\s\S]*?)\];/);

if (!productsMatch) {
  console.log('❌ 无法找到产品数据');
  process.exit(1);
}

// 提取所有图片路径
const imagePathRegex = /"image":\s*"([^"]*)"/g;
const imagePaths = [];
let match;

while ((match = imagePathRegex.exec(productsMatch[0])) !== null) {
  imagePaths.push(match[1]);
}

console.log('🔍 验证产品图片...\n');
console.log(`📊 总共 ${imagePaths.length} 个产品\n`);

let missingCount = 0;
let existingCount = 0;
const missingImages = [];

imagePaths.forEach((imagePath, index) => {
  const fullPath = path.join(__dirname, 'client/public', imagePath);
  
  if (fs.existsSync(fullPath)) {
    existingCount++;
  } else {
    missingCount++;
    missingImages.push({ index: index + 1, path: imagePath });
  }
});

console.log(`✅ 存在的图片: ${existingCount}`);
console.log(`❌ 缺失的图片: ${missingCount}\n`);

if (missingCount > 0) {
  console.log('⚠️  缺失的图片列表：');
  missingImages.forEach(({ index, path }) => {
    console.log(`  ${index}. ${path}`);
  });
  console.log('\n💡 建议：运行 node download-free-stock-images.js 下载更多图片');
} else {
  console.log('🎉 所有产品图片都存在！');
  console.log('\n📝 下一步：');
  console.log('1. 重启服务器: cd server && npm start');
  console.log('2. 刷新浏览器查看产品');
}

// 按类别统计
console.log('\n📊 按类别统计：');
const categories = {};
imagePaths.forEach(imagePath => {
  const category = imagePath.split('/')[3]; // /images/products/[category]/...
  categories[category] = (categories[category] || 0) + 1;
});

Object.keys(categories).forEach(category => {
  console.log(`  ${category}: ${categories[category]} 个产品`);
});
