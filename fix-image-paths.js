/**
 * 修复图片路径问题
 * 重命名图片文件，确保连续编号
 */

const fs = require('fs');
const path = require('path');

const PRODUCTS_DIR = path.join(__dirname, 'client/public/images/products');

function fixImagePaths() {
  const categories = ['productivity', 'mobility', 'sanctuary', 'savoriness'];
  
  console.log('🔧 开始修复图片路径...\n');

  categories.forEach(category => {
    const categoryDir = path.join(PRODUCTS_DIR, category);
    
    if (!fs.existsSync(categoryDir)) {
      console.log(`⚠️  ${category}: 目录不存在`);
      return;
    }

    // 获取所有图片文件
    const files = fs.readdirSync(categoryDir)
      .filter(file => file.match(/\.(jpg|jpeg|png|webp)$/i))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/\d+/)?.[0] || '0');
        return numA - numB;
      });

    console.log(`📁 ${category}: 找到 ${files.length} 张图片`);

    // 重命名为连续编号
    files.forEach((file, index) => {
      const oldPath = path.join(categoryDir, file);
      const newName = `${category}-${index + 1}.jpg`;
      const newPath = path.join(categoryDir, newName);

      if (file !== newName) {
        // 先重命名为临时文件名，避免冲突
        const tempPath = path.join(categoryDir, `temp-${index + 1}.jpg`);
        fs.renameSync(oldPath, tempPath);
        console.log(`  📝 ${file} -> temp-${index + 1}.jpg`);
      }
    });

    // 再次重命名为最终文件名
    const tempFiles = fs.readdirSync(categoryDir)
      .filter(file => file.startsWith('temp-'))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/\d+/)?.[0] || '0');
        return numA - numB;
      });

    tempFiles.forEach((file, index) => {
      const oldPath = path.join(categoryDir, file);
      const newName = `${category}-${index + 1}.jpg`;
      const newPath = path.join(categoryDir, newName);
      fs.renameSync(oldPath, newPath);
      console.log(`  ✅ temp-${index + 1}.jpg -> ${newName}`);
    });

    console.log('');
  });

  console.log('✨ 图片路径修复完成！\n');
}

// 主函数
function main() {
  try {
    fixImagePaths();
    
    console.log('📝 下一步：');
    console.log('1. 运行: node update-product-data.js');
    console.log('2. 重启服务器');
    console.log('3. 刷新浏览器\n');
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

main();
