const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Unsplash API - 免费高质量图片
const UNSPLASH_ACCESS_KEY = 'your_key_here'; // 使用公开的图片URL

// 产品数据
const products = {
  productivity: [
    { name: 'Minimalist Notebook', price: 29.99, description: 'Premium paper notebook for daily planning and note-taking', image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&q=80' },
    { name: 'Desk Organizer', price: 39.99, description: 'Keep your workspace tidy with this elegant organizer', image: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&q=80' },
    { name: 'Pen Set', price: 24.99, description: 'Professional writing instruments for everyday use', image: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=800&q=80' },
    { name: 'Sticky Notes Pack', price: 12.99, description: 'Colorful sticky notes for quick reminders', image: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&q=80' },
    { name: 'Document Folder', price: 18.99, description: 'Organize your important documents', image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80' },
    { name: 'Desk Lamp', price: 49.99, description: 'Adjustable LED desk lamp for focused work', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80' },
    { name: 'Pencil Case', price: 15.99, description: 'Compact case for all your writing tools', image: 'https://images.unsplash.com/photo-1588075592446-265fd1e6e76f?w=800&q=80' },
    { name: 'Calendar Planner', price: 22.99, description: 'Monthly planner to organize your schedule', image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&q=80' },
    { name: 'Clipboard', price: 14.99, description: 'Sturdy clipboard for mobile note-taking', image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80' },
    { name: 'Stapler', price: 16.99, description: 'Heavy-duty stapler for office use', image: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80' },
    { name: 'Tape Dispenser', price: 13.99, description: 'Weighted tape dispenser for easy use', image: 'https://images.unsplash.com/photo-1625225233840-695456021cde?w=800&q=80' },
    { name: 'Paper Clips Box', price: 8.99, description: 'Assorted paper clips in various sizes', image: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&q=80' },
    { name: 'Ruler Set', price: 11.99, description: 'Precision rulers for accurate measurements', image: 'https://images.unsplash.com/photo-1588075592446-265fd1e6e76f?w=800&q=80' },
    { name: 'Highlighter Set', price: 9.99, description: 'Vibrant highlighters for marking text', image: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=800&q=80' },
    { name: 'Binder Clips', price: 7.99, description: 'Strong binder clips in multiple sizes', image: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80' },
  ],
  mobility: [
    { name: 'Slim Wallet', price: 34.99, description: 'Minimalist leather wallet with RFID protection', image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80' },
    { name: 'Card Holder', price: 19.99, description: 'Compact card holder for essentials', image: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&q=80' },
    { name: 'Key Organizer', price: 24.99, description: 'Smart key organizer to reduce bulk', image: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&q=80' },
    { name: 'Phone Stand', price: 16.99, description: 'Portable phone stand for hands-free viewing', image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80' },
    { name: 'Cable Organizer', price: 12.99, description: 'Keep your cables tangle-free', image: 'https://images.unsplash.com/photo-1625225233840-695456021cde?w=800&q=80' },
    { name: 'Travel Pouch', price: 28.99, description: 'Compact pouch for travel essentials', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80' },
    { name: 'Portable Charger', price: 39.99, description: 'High-capacity power bank', image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&q=80' },
    { name: 'Earbuds Case', price: 14.99, description: 'Protective case for wireless earbuds', image: 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=800&q=80' },
    { name: 'Passport Holder', price: 22.99, description: 'Leather passport holder for travelers', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80' },
    { name: 'Luggage Tag', price: 9.99, description: 'Durable luggage tag with privacy cover', image: 'https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=800&q=80' },
    { name: 'Money Clip', price: 18.99, description: 'Sleek money clip for minimalists', image: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&q=80' },
    { name: 'Coin Pouch', price: 13.99, description: 'Small pouch for loose change', image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80' },
    { name: 'Backpack Organizer', price: 26.99, description: 'Insert organizer for backpacks', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80' },
    { name: 'Sunglasses Case', price: 15.99, description: 'Hard case to protect your sunglasses', image: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=800&q=80' },
    { name: 'Watch Box', price: 32.99, description: 'Elegant box for watch storage', image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&q=80' },
  ],
  sanctuary: [
    { name: 'Ceramic Vase', price: 44.99, description: 'Handcrafted ceramic vase for flowers', image: 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=800&q=80' },
    { name: 'Scented Candle', price: 26.99, description: 'Natural soy candle with calming scent', image: 'https://images.unsplash.com/photo-1602874801006-e24aa9f9e22c?w=800&q=80' },
    { name: 'Throw Pillow', price: 32.99, description: 'Soft decorative pillow for comfort', image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&q=80' },
    { name: 'Wall Art Print', price: 38.99, description: 'Minimalist art print for your walls', image: 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800&q=80' },
    { name: 'Plant Pot', price: 22.99, description: 'Modern ceramic pot for indoor plants', image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&q=80' },
    { name: 'Blanket', price: 54.99, description: 'Cozy throw blanket for relaxation', image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&q=80' },
    { name: 'Picture Frame', price: 18.99, description: 'Elegant frame for your memories', image: 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800&q=80' },
    { name: 'Desk Clock', price: 29.99, description: 'Minimalist clock for your desk', image: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=800&q=80' },
    { name: 'Bookends', price: 34.99, description: 'Stylish bookends to organize shelves', image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80' },
    { name: 'Storage Basket', price: 28.99, description: 'Woven basket for home organization', image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&q=80' },
    { name: 'Mirror', price: 48.99, description: 'Round wall mirror with frame', image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=800&q=80' },
    { name: 'Coasters Set', price: 16.99, description: 'Set of 4 marble coasters', image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&q=80' },
    { name: 'Incense Holder', price: 14.99, description: 'Ceramic holder for incense sticks', image: 'https://images.unsplash.com/photo-1602874801006-e24aa9f9e22c?w=800&q=80' },
    { name: 'Decorative Tray', price: 24.99, description: 'Wooden tray for serving or display', image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&q=80' },
    { name: 'Cushion Cover', price: 19.99, description: 'Linen cushion cover in neutral tones', image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&q=80' },
  ],
  savoriness: [
    { name: 'Ceramic Mug', price: 18.99, description: 'Handmade ceramic mug for coffee or tea', image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&q=80' },
    { name: 'Bamboo Utensils', price: 22.99, description: 'Eco-friendly bamboo cutlery set', image: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=800&q=80' },
    { name: 'Glass Water Bottle', price: 24.99, description: 'Reusable glass bottle with sleeve', image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80' },
    { name: 'Lunch Box', price: 28.99, description: 'Stainless steel bento lunch box', image: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=800&q=80' },
    { name: 'Tea Infuser', price: 14.99, description: 'Stainless steel tea infuser', image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800&q=80' },
    { name: 'Cutting Board', price: 32.99, description: 'Wooden cutting board for kitchen', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80' },
    { name: 'Spice Jars Set', price: 26.99, description: 'Glass jars for spice storage', image: 'https://images.unsplash.com/photo-1596040033229-a0b3b7e8c5f8?w=800&q=80' },
    { name: 'Coffee Grinder', price: 44.99, description: 'Manual coffee grinder for fresh brew', image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80' },
    { name: 'Wine Opener', price: 16.99, description: 'Professional corkscrew wine opener', image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80' },
    { name: 'Salad Bowl', price: 29.99, description: 'Large wooden salad bowl', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80' },
    { name: 'Measuring Cups', price: 19.99, description: 'Stainless steel measuring cup set', image: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=800&q=80' },
    { name: 'Kitchen Towels', price: 15.99, description: 'Set of 3 linen kitchen towels', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80' },
    { name: 'Cheese Board', price: 36.99, description: 'Marble and wood cheese serving board', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80' },
    { name: 'Cocktail Shaker', price: 27.99, description: 'Stainless steel cocktail shaker set', image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80' },
    { name: 'Napkin Rings', price: 12.99, description: 'Set of 4 brass napkin rings', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80' },
  ]
};

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`   ✅ Downloaded: ${path.basename(filepath)}`);
          resolve();
        });
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirect
        downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
      } else {
        reject(new Error(`Failed to download: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function initProducts() {
  console.log('🚀 开始初始化产品数据...\n');
  
  // 创建数据库连接
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'shop_dev',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'shop'
  });
  
  // 清空现有产品
  console.log('1️⃣  清空现有产品...');
  await db.execute('DELETE FROM products');
  console.log('   ✅ 已清空\n');
  
  // 为每个分类创建产品
  for (const [category, items] of Object.entries(products)) {
    console.log(`2️⃣  处理分类: ${category}`);
    
    // 创建图片目录
    const imageDir = path.join(__dirname, 'client/public/images/products', category);
    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(imageDir, { recursive: true });
    }
    
    for (let i = 0; i < items.length; i++) {
      const product = items[i];
      const imageFilename = `${category}-${i + 1}.jpg`;
      const imagePath = path.join(imageDir, imageFilename);
      const imageUrl = `/images/products/${category}/${imageFilename}`;
      
      console.log(`   处理: ${product.name}`);
      
      // 下载图片
      try {
        await downloadImage(product.image, imagePath);
      } catch (error) {
        console.log(`   ⚠️  图片下载失败，使用占位符: ${error.message}`);
      }
      
      // 插入数据库
      const featured = i < 3 ? 1 : 0; // 前3个设为精选
      await db.execute(
        `INSERT INTO products (name, category, price, description, image, status, featured, stock)
         VALUES (?, ?, ?, ?, ?, 'available', ?, ?)`,
        [product.name, category, product.price, product.description, imageUrl, featured, 100]
      );
    }
    
    console.log(`   ✅ ${category} 完成 (${items.length}个产品)\n`);
  }
  
  // 统计
  const [result] = await db.execute('SELECT category, COUNT(*) as count FROM products GROUP BY category');
  console.log('📊 产品统计:');
  result.forEach(row => {
    console.log(`   ${row.category}: ${row.count}个产品`);
  });
  
  const [total] = await db.execute('SELECT COUNT(*) as total FROM products');
  console.log(`\n✅ 总计: ${total[0].total}个产品已初始化！`);
  
  await db.end();
}

initProducts().catch(console.error);
