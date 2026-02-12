/**
 * Zenlet产品图片下载脚本
 * 
 * 使用说明：
 * 1. 安装依赖：npm install axios cheerio
 * 2. 运行脚本：node download-zenlet-images.js
 * 
 * 这个脚本会：
 * - 访问 Zenlet 的 productivity 页面
 * - 提取所有产品图片URL
 * - 下载图片到 client/public/images/products/ 目录
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const https = require('https');

// 配置
const ZENLET_URL = 'https://shop.zenlet.co/collections/productivity';
const OUTPUT_DIR = path.join(__dirname, 'client/public/images/products');
const CATEGORIES = ['productivity', 'mobility', 'sanctuary', 'savoriness'];

// 创建输出目录
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`✅ 创建目录: ${OUTPUT_DIR}`);
}

// 下载图片函数
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

// 从Zenlet网站提取产品图片
async function fetchZenletImages() {
  try {
    console.log(`🔍 正在访问: ${ZENLET_URL}`);
    const response = await axios.get(ZENLET_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const imageUrls = [];

    // 提取产品图片
    $('.product-card img, .product-item img, [class*="product"] img').each((i, elem) => {
      let src = $(elem).attr('src') || $(elem).attr('data-src');
      if (src) {
        // 处理相对URL
        if (src.startsWith('//')) {
          src = 'https:' + src;
        } else if (src.startsWith('/')) {
          src = 'https://shop.zenlet.co' + src;
        }
        
        // 过滤掉小图标和非产品图片
        if (src.includes('cdn.shopify.com') && !src.includes('icon') && !src.includes('logo')) {
          // 获取高质量版本
          src = src.replace(/_\d+x\d+/, '').replace(/\?.*$/, '') + '?width=800';
          imageUrls.push(src);
        }
      }
    });

    console.log(`✅ 找到 ${imageUrls.length} 张产品图片`);
    return [...new Set(imageUrls)]; // 去重
  } catch (error) {
    console.error('❌ 获取图片失败:', error.message);
    return [];
  }
}

// 主函数
async function main() {
  console.log('🚀 开始下载Zenlet产品图片...\n');

  const imageUrls = await fetchZenletImages();

  if (imageUrls.length === 0) {
    console.log('⚠️  没有找到图片，请检查网站结构是否改变');
    console.log('\n📝 备选方案：');
    console.log('1. 手动访问 https://shop.zenlet.co/collections/productivity');
    console.log('2. 右键点击产品图片 -> "在新标签页中打开图片"');
    console.log('3. 复制图片URL并添加到下面的数组中');
    console.log('4. 重新运行脚本\n');
    return;
  }

  console.log('📥 开始下载图片...\n');

  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    const filename = `product-${i + 1}.jpg`;
    const filepath = path.join(OUTPUT_DIR, filename);

    try {
      await downloadImage(url, filepath);
      console.log(`✅ [${i + 1}/${imageUrls.length}] 下载成功: ${filename}`);
    } catch (error) {
      console.log(`❌ [${i + 1}/${imageUrls.length}] 下载失败: ${filename} - ${error.message}`);
    }

    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n✨ 下载完成！');
  console.log(`📁 图片保存在: ${OUTPUT_DIR}`);
  console.log(`📊 成功下载: ${fs.readdirSync(OUTPUT_DIR).length} 张图片`);
}

// 运行
main().catch(console.error);
