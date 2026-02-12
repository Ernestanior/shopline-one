/**
 * 产品图片设置脚本
 * 使用现有图片创建产品图片库
 */

const fs = require('fs');
const path = require('path');

// 配置
const SOURCE_DIR = path.join(__dirname, 'client/public/images');
const PRODUCTS_DIR = path.join(__dirname, 'client/public/images/products');

// 现有的产品图片
const existingImages = {
  productivity: [
    'zenlet-2.jpg',
    'zenlet-3.jpg',
    'memo-x.jpg',
    'tool-card.jpg',
    'coinslide.jpg',
    'productivity.jpg'
  ],
  mobility: [
    'mobility.jpg',
    'zenlet-2.jpg',
    'tool-card.jpg'
  ],
  sanctuary: [
    'sanctuary.jpg',
    'memo-x.jpg'
  ],
  savoriness: [
    'savoriness.jpg'
  ]
};

// 创建产品目录
function setupDirectories() {
  const categories = ['productivity', 'mobility', 'sanctuary', 'savoriness'];
  
  categories.forEach(category => {
    const categoryDir = path.join(PRODUCTS_DIR, category);
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
      console.log(`✅ 创建目录: ${categoryDir}`);
    }
  });
}

// 复制图片到产品目录
function copyImages() {
  let totalCopied = 0;

  Object.keys(existingImages).forEach(category => {
    const images = existingImages[category];
    const categoryDir = path.join(PRODUCTS_DIR, category);

    images.forEach((imageName, index) => {
      const sourcePath = path.join(SOURCE_DIR, imageName);
      const destPath = path.join(categoryDir, `${category}-${index + 1}.jpg`);

      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`✅ 复制: ${imageName} -> ${category}/${category}-${index + 1}.jpg`);
        totalCopied++;
      } else {
        console.log(`⚠️  源文件不存在: ${imageName}`);
      }
    });
  });

  return totalCopied;
}

// 生成产品数据配置
function generateProductConfig() {
  const config = {
    productivity: [],
    mobility: [],
    sanctuary: [],
    savoriness: []
  };

  Object.keys(existingImages).forEach(category => {
    const imageCount = existingImages[category].length;
    
    for (let i = 1; i <= imageCount; i++) {
      config[category].push({
        image: `/images/products/${category}/${category}-${i}.jpg`,
        name: `${category.charAt(0).toUpperCase() + category.slice(1)} Product ${i}`,
        price: (Math.random() * 80 + 20).toFixed(2)
      });
    }
  });

  const configPath = path.join(__dirname, 'product-images-config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`\n✅ 生成配置文件: ${configPath}`);
  
  return config;
}

// 主函数
function main() {
  console.log('🚀 开始设置产品图片...\n');

  // 1. 创建目录
  setupDirectories();
  console.log('');

  // 2. 复制图片
  const copiedCount = copyImages();
  console.log(`\n📊 总共复制了 ${copiedCount} 张图片`);

  // 3. 生成配置
  const config = generateProductConfig();
  
  console.log('\n📁 图片目录结构:');
  Object.keys(config).forEach(category => {
    console.log(`  ${category}: ${config[category].length} 张图片`);
  });

  console.log('\n✨ 设置完成！');
  console.log('\n📝 下一步：');
  console.log('1. 检查 client/public/images/products/ 目录');
  console.log('2. 查看 product-images-config.json 配置文件');
  console.log('3. 运行 node update-product-data.js 更新产品数据');
}

// 运行
try {
  main();
} catch (error) {
  console.error('❌ 错误:', error.message);
  process.exit(1);
}
