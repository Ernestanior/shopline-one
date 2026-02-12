/**
 * 从免费图库下载产品图片
 * 使用 Unsplash, Pexels, Pixabay 等免费图库
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'client/public/images/products');

// Unsplash 图片URL（高质量，无需API key的直接链接）
// 格式：https://images.unsplash.com/photo-[id]?w=800&q=80
const unsplashImages = {
  productivity: [
    // 钱包、笔记本、办公用品
    'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80', // 钱包
    'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80', // 笔记本
    'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80', // 办公桌
    'https://images.unsplash.com/photo-1606663889134-b1dedb5ed8b7?w=800&q=80', // 工具卡
    'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80', // 卡片收纳
    'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&q=80', // 桌面整理
    'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&q=80', // 笔筒
    'https://images.unsplash.com/photo-1600783245777-5478f73aca2f?w=800&q=80', // 线缆管理
    'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80', // 手机支架
    'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80', // 笔记本支架
    'https://images.unsplash.com/photo-1591290619762-c588f0e8e23f?w=800&q=80', // 无线充电器
    'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=800&q=80', // USB Hub
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80', // 键盘托盘
    'https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=800&q=80', // 显示器支架
    'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80', // 台灯
  ],
  
  mobility: [
    // 旅行用品、背包、收纳
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80', // 旅行钱包
    'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=800&q=80', // 护照夹
    'https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=800&q=80', // 行李牌
    'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&q=80', // 旅行包
    'https://images.unsplash.com/photo-1591290619762-c588f0e8e23f?w=800&q=80', // 充电宝
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80', // 旅行适配器
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80', // 颈枕
    'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&q=80', // 水瓶
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80', // 背包
    'https://images.unsplash.com/photo-1491637639811-60e2756cc1c7?w=800&q=80', // 斜挎包
    'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80', // 托特包
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80', // 行李袋
    'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&q=80', // 腰包
    'https://images.unsplash.com/photo-1491637639811-60e2756cc1c7?w=800&q=80', // 电脑包
    'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80', // 相机包
  ],
  
  sanctuary: [
    // 家居、香薰、装饰
    'https://images.unsplash.com/photo-1602874801006-e04b6d0c5c66?w=800&q=80', // 香薰机
    'https://images.unsplash.com/photo-1602874801006-e04b6d0c5c66?w=800&q=80', // 蜡烛
    'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&q=80', // 香炉
    'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80', // 精油
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80', // 冥想垫
    'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&q=80', // 瑜伽垫
    'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&q=80', // 毯子
    'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&q=80', // 抱枕
    'https://images.unsplash.com/photo-1564053489984-317bbd824340?w=800&q=80', // 茶具
    'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&q=80', // 咖啡杯
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80', // 花瓶
    'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&q=80', // 植物盆
    'https://images.unsplash.com/photo-1582037928769-181f2644ecb7?w=800&q=80', // 墙面艺术
    'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800&q=80', // 相框
    'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80', // 台灯
  ],
  
  savoriness: [
    // 食品、饮品、调味品
    'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80', // 咖啡豆
    'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800&q=80', // 茶叶
    'https://images.unsplash.com/photo-1511381939415-e44015466834?w=800&q=80', // 巧克力
    'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=800&q=80', // 零食盒
    'https://images.unsplash.com/photo-1596040033229-a0b3b83b2e4d?w=800&q=80', // 香料
    'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&q=80', // 橄榄油
    'https://images.unsplash.com/photo-1470119693884-47d3a1d1f180?w=800&q=80', // 蜂蜜
    'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=800&q=80', // 果酱
    'https://images.unsplash.com/photo-1508737027454-e6454ef45afd?w=800&q=80', // 坚果
    'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&q=80', // 干果
    'https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=800&q=80', // 麦片
    'https://images.unsplash.com/photo-1587334207976-c52be0a1c7c0?w=800&q=80', // 能量棒
    'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&q=80', // 爆米花
    'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&q=80', // 饼干
    'https://images.unsplash.com/photo-1548365328-8c6db3220e4c?w=800&q=80', // 糖果
  ]
};

// 创建目录
function createDirectories() {
  Object.keys(unsplashImages).forEach(category => {
    const dir = path.join(OUTPUT_DIR, category);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ 创建目录: ${category}/`);
    }
  });
}

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
        // 处理重定向
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
  console.log('🚀 开始从免费图库下载产品图片...\n');
  console.log('📸 图片来源：Unsplash (免费高质量图片库)\n');

  createDirectories();
  console.log('');

  let totalSuccess = 0;
  let totalFailed = 0;

  for (const [category, urls] of Object.entries(unsplashImages)) {
    console.log(`📥 下载 ${category} 类别图片 (${urls.length}张)...`);
    
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
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    console.log('');
  }

  console.log('✨ 下载完成！');
  console.log(`📊 成功: ${totalSuccess} 张`);
  console.log(`📊 失败: ${totalFailed} 张`);
  console.log(`📁 图片保存在: ${OUTPUT_DIR}`);
  
  console.log('\n📝 下一步：');
  console.log('1. 运行: node update-product-data.js');
  console.log('2. 重启服务器: cd server && npm start');
  console.log('3. 刷新浏览器查看新产品');
  
  if (totalSuccess > 0) {
    console.log('\n💡 提示：图片来自Unsplash，完全免费且无需署名！');
  }
}

main().catch(console.error);
