/**
 * 修复 burst 目录中的图片
 * 下载真实的图片替换HTML占位符
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const BURST_DIR = path.join(__dirname, 'client/public/images/burst');

// 需要替换的图片及其对应的Unsplash URL
const imagesToFix = {
  'hero-minimal-workspace.jpg': 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80',
  'hero-organized-workspace.jpg': 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1200&q=80',
  'hero-working-from-home.jpg': 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=1200&q=80',
  'product-coffee-ready-travel.jpg': 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80',
  'product-flatlay-notebooks.jpg': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
  'product-gold-shelf-plant.jpg': 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&q=80',
  'product-laptop-white-desk.jpg': 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80'
};

// 下载图片
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(filepath);
        downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
      } else {
        file.close();
        fs.unlinkSync(filepath);
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      reject(err);
    });
  });
}

// 主函数
async function main() {
  console.log('🔧 修复 burst 目录中的图片...\n');

  let successCount = 0;
  let failCount = 0;

  for (const [filename, url] of Object.entries(imagesToFix)) {
    const filepath = path.join(BURST_DIR, filename);
    
    // 检查文件是否需要替换
    if (fs.existsSync(filepath)) {
      const stats = fs.statSync(filepath);
      if (stats.size < 10000) { // 小于10KB的文件可能是HTML
        console.log(`📥 下载: ${filename}`);
        try {
          await downloadImage(url, filepath);
          console.log(`  ✅ 成功\n`);
          successCount++;
        } catch (error) {
          console.log(`  ❌ 失败: ${error.message}\n`);
          failCount++;
        }
        
        // 延迟避免请求过快
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        console.log(`⏭️  跳过: ${filename} (已存在有效图片)`);
      }
    } else {
      console.log(`📥 下载: ${filename}`);
      try {
        await downloadImage(url, filepath);
        console.log(`  ✅ 成功\n`);
        successCount++;
      } catch (error) {
        console.log(`  ❌ 失败: ${error.message}\n`);
        failCount++;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log('✨ 完成！');
  console.log(`📊 成功: ${successCount} 张`);
  console.log(`📊 失败: ${failCount} 张`);
  
  if (successCount > 0) {
    console.log('\n📝 下一步：');
    console.log('1. 刷新浏览器');
    console.log('2. 检查mega menu中的图片是否显示');
  }
}

main().catch(console.error);
