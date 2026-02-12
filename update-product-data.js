/**
 * 更新产品数据脚本
 * 扫描 client/public/images/products/ 目录
 * 自动生成产品数据并更新 server/index.js
 */

const fs = require('fs');
const path = require('path');

const PRODUCTS_DIR = path.join(__dirname, 'client/public/images/products');
const SERVER_FILE = path.join(__dirname, 'server/index.js');

// 产品名称模板
const productNames = {
  productivity: [
    'Smart Wallet', 'Memo Notebook', 'Tool Card', 'Coin Holder', 'Card Organizer',
    'Desk Organizer', 'Pen Holder', 'Cable Manager', 'Phone Stand', 'Laptop Stand',
    'Wireless Charger', 'USB Hub', 'Keyboard Tray', 'Monitor Stand', 'Desk Lamp',
    'Paper Clip Holder', 'Sticky Note Pad', 'Desk Calendar', 'File Organizer', 'Drawer Divider',
    'Pencil Case', 'Stapler Set', 'Tape Dispenser', 'Scissors Holder', 'Ruler Set',
    'Eraser Collection', 'Highlighter Set', 'Marker Organizer', 'Notebook Stand', 'Planner'
  ],
  mobility: [
    'Travel Wallet', 'Passport Holder', 'Luggage Tag', 'Travel Pouch', 'Cable Organizer',
    'Portable Charger', 'Travel Adapter', 'Neck Pillow', 'Eye Mask', 'Earplugs',
    'Water Bottle', 'Travel Mug', 'Backpack', 'Crossbody Bag', 'Tote Bag',
    'Duffle Bag', 'Sling Bag', 'Belt Bag', 'Laptop Bag', 'Camera Bag',
    'Toiletry Bag', 'Shoe Bag', 'Laundry Bag', 'Compression Bag', 'Packing Cube',
    'Travel Lock', 'Luggage Scale', 'Travel Mirror', 'First Aid Kit', 'Travel Pillow'
  ],
  sanctuary: [
    'Aromatherapy Diffuser', 'Candle Set', 'Incense Holder', 'Essential Oil', 'Room Spray',
    'Meditation Cushion', 'Yoga Mat', 'Blanket', 'Throw Pillow', 'Eye Pillow',
    'Tea Set', 'Coffee Mug', 'Coaster Set', 'Vase', 'Plant Pot',
    'Wall Art', 'Photo Frame', 'Mirror', 'Clock', 'Lamp',
    'Bookend', 'Shelf', 'Storage Box', 'Basket', 'Tray',
    'Rug', 'Curtain', 'Cushion Cover', 'Table Runner', 'Wall Hook'
  ],
  savoriness: [
    'Coffee Beans', 'Tea Collection', 'Chocolate Bar', 'Snack Box', 'Spice Set',
    'Olive Oil', 'Balsamic Vinegar', 'Honey Jar', 'Jam Set', 'Nut Mix',
    'Dried Fruit', 'Granola', 'Protein Bar', 'Energy Ball', 'Trail Mix',
    'Popcorn', 'Chips', 'Crackers', 'Cookies', 'Biscuits',
    'Candy', 'Gummies', 'Mints', 'Gum', 'Lollipop',
    'Hot Sauce', 'BBQ Sauce', 'Salsa', 'Dip', 'Spread'
  ]
};

// 产品描述模板
const descriptions = {
  productivity: 'Designed for focus and efficiency. Premium materials meet minimalist design.',
  mobility: 'Built for travel and everyday carry. Compact, durable, and functional.',
  sanctuary: 'Create your perfect space. Calm, comfort, and timeless aesthetics.',
  savoriness: 'Curated flavors for daily enjoyment. Quality ingredients, exceptional taste.'
};

// 扫描图片目录
function scanProductImages() {
  const products = {
    productivity: [],
    mobility: [],
    sanctuary: [],
    savoriness: []
  };

  Object.keys(products).forEach(category => {
    const categoryDir = path.join(PRODUCTS_DIR, category);
    
    if (fs.existsSync(categoryDir)) {
      const files = fs.readdirSync(categoryDir)
        .filter(file => file.match(/\.(jpg|jpeg|png|webp)$/i))
        .sort();
      
      products[category] = files;
      console.log(`✅ ${category}: 找到 ${files.length} 张图片`);
    } else {
      console.log(`⚠️  ${category}: 目录不存在`);
    }
  });

  return products;
}

// 生成产品数据
function generateProducts(imageData) {
  let productId = 1;
  const allProducts = [];

  Object.keys(imageData).forEach(category => {
    const images = imageData[category];
    const names = productNames[category];
    const description = descriptions[category];

    // 如果图片少于30张，循环使用
    for (let i = 0; i < 30; i++) {
      const imageIndex = i % images.length;
      const imagePath = `/images/products/${category}/${images[imageIndex]}`;
      const name = names[i] || `${category} Product ${i + 1}`;
      const price = (Math.random() * 70 + 19.99).toFixed(2);
      const featured = i < 3; // 前3个设为featured
      const status = Math.random() > 0.9 ? 'coming-soon' : 'available';

      allProducts.push({
        id: productId++,
        name,
        category,
        price: parseFloat(price),
        description,
        image: imagePath,
        status,
        featured
      });
    }
  });

  return allProducts;
}

// 更新server/index.js
function updateServerFile(products) {
  let content = fs.readFileSync(SERVER_FILE, 'utf8');

  // 生成产品数组代码
  const productsCode = `const products = ${JSON.stringify(products, null, 2)};`;

  // 查找并替换products数组
  const regex = /const products = \[[\s\S]*?\];/;
  
  if (regex.test(content)) {
    content = content.replace(regex, productsCode);
    fs.writeFileSync(SERVER_FILE, content, 'utf8');
    console.log('\n✅ 成功更新 server/index.js');
    return true;
  } else {
    console.log('\n⚠️  未找到products数组，请手动更新');
    
    // 保存到单独文件
    const outputFile = path.join(__dirname, 'generated-products.js');
    fs.writeFileSync(outputFile, productsCode, 'utf8');
    console.log(`📝 产品数据已保存到: ${outputFile}`);
    return false;
  }
}

// 主函数
function main() {
  console.log('🚀 开始更新产品数据...\n');

  // 1. 扫描图片
  const imageData = scanProductImages();
  
  const totalImages = Object.values(imageData).reduce((sum, arr) => sum + arr.length, 0);
  console.log(`\n📊 总共找到 ${totalImages} 张产品图片`);

  if (totalImages === 0) {
    console.log('\n❌ 没有找到产品图片！');
    console.log('请先运行以下命令之一：');
    console.log('  - node setup-product-images.js (使用现有图片)');
    console.log('  - node download-zenlet-images.js (下载新图片)');
    return;
  }

  // 2. 生成产品数据
  console.log('\n📝 生成产品数据...');
  const products = generateProducts(imageData);
  console.log(`✅ 生成了 ${products.length} 个产品`);

  // 按类别统计
  const stats = {};
  products.forEach(p => {
    stats[p.category] = (stats[p.category] || 0) + 1;
  });

  console.log('\n📊 产品分布：');
  Object.keys(stats).forEach(category => {
    console.log(`  ${category}: ${stats[category]} 个产品`);
  });

  // 3. 更新服务器文件
  console.log('\n📝 更新服务器文件...');
  updateServerFile(products);

  console.log('\n✨ 完成！');
  console.log('\n📝 下一步：');
  console.log('1. 重启服务器: npm start (在server目录)');
  console.log('2. 刷新浏览器查看新产品');
}

// 运行
try {
  main();
} catch (error) {
  console.error('❌ 错误:', error.message);
  console.error(error.stack);
  process.exit(1);
}
