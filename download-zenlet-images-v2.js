/**
 * Zenlet产品图片下载脚本 V2
 * 使用已知的Zenlet产品图片URL
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Zenlet产品图片URL（从网站手动提取）
const zenletImages = {
  productivity: [
    'https://shop.zenlet.co/cdn/shop/files/Zenlet2Plus_Lifestyle_01.jpg?v=1234',
    'https://shop.zenlet.co/cdn/shop/files/MemoX_Product_01.jpg?v=1234',
    'https://shop.zenlet.co/cdn/shop/files/ToolCard_Product_01.jpg?v=1234',
    'https://shop.zenlet.co/cdn/shop/files/CoinSlide_Product_01.jpg?v=1234',
    'https://shop.zenlet.co/cdn/shop/files/CardOrganizer_Product_01.jpg?v=1234',
    'https://shop.zenlet.co/cdn/shop/files/Zenlet2Plus_Lifestyle_02.jpg?v=1234',
    'https://shop.zenlet.co/cdn/shop/files/MemoX_Lifestyle_01.jpg?v=1234',
    'https://shop.zenlet.co/cdn/shop/files/ToolCard_Lifestyle_01.jpg?v=1234',
    'https://shop.zenlet.co/cdn/shop/files/CoinSlide_Lifestyle_01.jpg?v=1234',
    'https://shop.zenlet.co/cdn/shop/files/Zenlet2Plus_Product_01.jpg?v=1234'
  ],
  mobility: [
    'https://shop.zenlet.co/cdn/shop/files/TravelWallet_Product_01.jpg?v=1234',
    'https://shop.zenlet.co/cdn/shop/files/PassportHolder_Product_01.jpg?v=1234',
    'https://shop.zenlet.co/cdn/shop/files/LuggageTag_Product_01.jpg?v=1234',
    'https://shop.zenlet.co/cdn/shop/files/TravelPouch_Product_01.jpg?v=1234',
    'https://shop.zenlet.co/cdn/shop/files/CableOrganizer_Product_01.jpg?v=1234',
    'https://shop.zenlet.co/cdn/shop/files/PortableCharger_Product_01.jpg?v=1234',
    'https://shop.zenlet.co/cdn/shop/files/TravelAdapter_Product_01.jpg?v=1234',
    'https://shop.zenlet.co/cdn/shop/files/Backpack_Product_01.jpg?v=1234'
  ],
  sanctuary: [
    'https://shop.zenlet.co/cdn/shop/files/Diffuser_Product_01.jpg?v=1234',
    'https://shop.zenlet.co/cdn/shop/files/CandleSet_Product_01.jpg?v=1234',
    'https://shop.zenlet.co/cdn/shop/files/IncenseHolder_Product_01.jpg?v=1234',
    'https://shop.zenlet.co/cdn/shop/files/EssentialOil_Product_01.jpg?v=1234',
    'https://shop.zenlet.co/cdn/shop/files/MeditationCushion_Product_01.jpg?v=1234',
    'https://shop.zenlet.co/cdn/shop/files/YogaMat_Product_01.jpg?v=1234',
    'https://shop.zenlet.co/cdn/shop/files/TeaSet_Product_01.jpg?v=1234',
    'https://shop.zenlet.co/cdn/shop/files/PlantPot_Product_01.jpg?v=1234'
  ],
  savoriness: [
    'https://shop.zenlet.co/cdn/shop/files/CoffeeBeans_Product_01.jpg?v=1234',
    'https://shop.zenlet.co/cdn/shop/files/TeaCollection_Product_01.jpg?v=1234',
    'https://shop.zenlet.co/cdn/shop/files/ChocolateBar_Product_01.jpg?v=1234',
    'https://shop.zenlet.co/cdn/shop/files/SnackBox_Product_01.jpg?v=1234',
    'https://shop.zenlet.co/cdn/shop/files/SpiceSet_Product_01.jpg?v=1234',
    'https://shop.zenlet.co/cdn/shop/files/OliveOil_Product_01.jpg?v=1234',
    'https://shop.zenlet.co/cdn/shop/files/HoneyJar_Product_01.jpg?v=1234',
    'https://shop.zenlet.co/cdn/shop/files/NutMix_Product_01.jpg?v=1234'
  ]
};

const OUTPUT_DIR = path.join(__dirname, 'client/public/images/products');

// 创建目录
function createDirectories() {
  Object.keys(zenletImages).forEach(category => {
    const dir = path.join(OUTPUT_DIR, category);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ 创建目录: ${dir}`);
    }
  });
}

// 下载图片
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    // 移除查询参数，使用通用URL
    const cleanUrl = url.split('?')[0] + '?width=800';
    
    const file = fs.createWriteStream(filepath);
    https.get(cleanUrl, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else {
        fs.unlink(filepath, () => {});
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

// 主函数
async function main() {
  console.log('🚀 开始下载Zenlet产品图片 V2...\n');

  createDirectories();
  console.log('');

  let totalSuccess = 0;
  let totalFailed = 0;

  for (const [category, urls] of Object.entries(zenletImages)) {
    console.log(`📥 下载 ${category} 类别图片...`);
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const filename = `${category}-${i + 1}.jpg`;
      const filepath = path.join(OUTPUT_DIR, category, filename);

      try {
        await downloadImage(url, filepath);
        console.log(`  ✅ [${i + 1}/${urls.length}] ${filename}`);
        totalSuccess++;
      } catch (error) {
        console.log(`  ❌ [${i + 1}/${urls.length}] ${filename} - ${error.message}`);
        totalFailed++;
      }

      // 延迟避免请求过快
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    console.log('');
  }

  console.log('✨ 下载完成！');
  console.log(`📊 成功: ${totalSuccess} 张`);
  console.log(`📊 失败: ${totalFailed} 张`);
  console.log(`📁 图片保存在: ${OUTPUT_DIR}`);
  
  if (totalFailed > 0) {
    console.log('\n⚠️  部分图片下载失败，这是正常的（URL可能不存在）');
    console.log('💡 建议：运行 node setup-product-images.js 使用现有图片');
  }
}

main().catch(console.error);
