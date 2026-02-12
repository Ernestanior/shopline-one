#!/usr/bin/env node

/**
 * 数据库初始化脚本
 * 创建管理后台所需的所有表
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'shop_dev',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'shop'
};

async function initDatabase() {
  console.log('🗄️  开始初始化数据库...\n');
  
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功\n');

    // 1. 用户表 (已存在，但添加管理员字段)
    console.log('📋 创建/更新用户表...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        email VARCHAR(190) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_admin TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_users_email (email),
        KEY idx_is_admin (is_admin)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ 用户表创建完成\n');

    // 2. 商品表
    console.log('📋 创建商品表...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        description TEXT,
        image VARCHAR(500),
        status VARCHAR(50) NOT NULL DEFAULT 'available',
        featured TINYINT(1) NOT NULL DEFAULT 0,
        stock INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_category (category),
        KEY idx_status (status),
        KEY idx_featured (featured)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ 商品表创建完成\n');

    // 3. 订单表
    console.log('📋 创建订单表...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id BIGINT UNSIGNED NOT NULL,
        order_number VARCHAR(50) NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        payment_status VARCHAR(50) NOT NULL DEFAULT 'unpaid',
        payment_method VARCHAR(50),
        shipping_address TEXT,
        shipping_name VARCHAR(255),
        shipping_email VARCHAR(255),
        shipping_phone VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_order_number (order_number),
        KEY idx_user_id (user_id),
        KEY idx_status (status),
        KEY idx_payment_status (payment_status),
        KEY idx_created_at (created_at),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ 订单表创建完成\n');

    // 4. 订单项表
    console.log('📋 创建订单项表...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        order_id BIGINT UNSIGNED NOT NULL,
        product_id BIGINT UNSIGNED NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        product_image VARCHAR(500),
        quantity INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_order_id (order_id),
        KEY idx_product_id (product_id),
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ 订单项表创建完成\n');

    // 5. 购物车表
    console.log('📋 创建购物车表...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id BIGINT UNSIGNED NOT NULL,
        product_id BIGINT UNSIGNED NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_user_product (user_id, product_id),
        KEY idx_user_id (user_id),
        KEY idx_product_id (product_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ 购物车表创建完成\n');

    // 6. 用户反馈表
    console.log('📋 创建用户反馈表...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS feedback (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(500),
        message TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_status (status),
        KEY idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ 用户反馈表创建完成\n');

    // 7. 邮件订阅表
    console.log('📋 创建邮件订阅表...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        email VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_email (email),
        KEY idx_status (status),
        KEY idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ 邮件订阅表创建完成\n');

    // 8. 创建默认管理员账户
    console.log('👤 创建默认管理员账户...');
    const bcrypt = require('bcrypt');
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    await connection.execute(`
      INSERT IGNORE INTO users (email, password_hash, is_admin)
      VALUES ('admin@xyvn.com', ?, 1)
    `, [adminPassword]);
    console.log('✅ 管理员账户创建完成');
    console.log('   邮箱: admin@xyvn.com');
    console.log('   密码: admin123\n');

    // 9. 插入示例商品数据（如果表为空）
    console.log('📦 检查商品数据...');
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM products');
    
    if (rows[0].count === 0) {
      console.log('📦 插入示例商品数据...');
      
      const sampleProducts = [
        // Productivity
        { name: 'Minimalist Notebook', category: 'productivity', price: 29.99, description: 'Premium paper notebook for daily planning', image: '/images/products/productivity/productivity-1.jpg', stock: 50, featured: 1 },
        { name: 'Desk Organizer', category: 'productivity', price: 39.99, description: 'Keep your workspace tidy', image: '/images/products/productivity/productivity-2.jpg', stock: 30, featured: 1 },
        { name: 'Pen Set', category: 'productivity', price: 24.99, description: 'Smooth writing experience', image: '/images/products/productivity/productivity-3.jpg', stock: 100, featured: 0 },
        
        // Mobility
        { name: 'Slim Wallet', category: 'mobility', price: 49.99, description: 'Minimalist leather wallet', image: '/images/products/mobility/mobility-1.jpg', stock: 40, featured: 1 },
        { name: 'Card Holder', category: 'mobility', price: 34.99, description: 'Compact card organizer', image: '/images/products/mobility/mobility-2.jpg', stock: 60, featured: 1 },
        { name: 'Key Organizer', category: 'mobility', price: 19.99, description: 'Smart key management', image: '/images/products/mobility/mobility-3.jpg', stock: 80, featured: 0 },
        
        // Sanctuary
        { name: 'Ceramic Vase', category: 'sanctuary', price: 44.99, description: 'Elegant home decoration', image: '/images/products/sanctuary/sanctuary-1.jpg', stock: 25, featured: 1 },
        { name: 'Candle Set', category: 'sanctuary', price: 29.99, description: 'Aromatherapy candles', image: '/images/products/sanctuary/sanctuary-2.jpg', stock: 45, featured: 0 },
        { name: 'Plant Pot', category: 'sanctuary', price: 19.99, description: 'Modern ceramic pot', image: '/images/products/sanctuary/sanctuary-3.jpg', stock: 70, featured: 0 },
        
        // Savoriness
        { name: 'Coffee Mug', category: 'savoriness', price: 24.99, description: 'Premium ceramic mug', image: '/images/products/savoriness/savoriness-1.jpg', stock: 90, featured: 1 },
        { name: 'Tea Set', category: 'savoriness', price: 59.99, description: 'Complete tea ceremony set', image: '/images/products/savoriness/savoriness-2.jpg', stock: 20, featured: 0 },
        { name: 'Coaster Set', category: 'savoriness', price: 14.99, description: 'Wooden coasters', image: '/images/products/savoriness/savoriness-3.jpg', stock: 100, featured: 0 }
      ];

      for (const product of sampleProducts) {
        await connection.execute(`
          INSERT INTO products (name, category, price, description, image, stock, featured, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'available')
        `, [product.name, product.category, product.price, product.description, product.image, product.stock, product.featured]);
      }
      
      console.log(`✅ 已插入 ${sampleProducts.length} 个示例商品\n`);
    } else {
      console.log(`✅ 商品表已有 ${rows[0].count} 个商品\n`);
    }

    console.log('🎉 数据库初始化完成！\n');
    console.log('📊 创建的表:');
    console.log('   - users (用户表)');
    console.log('   - products (商品表)');
    console.log('   - orders (订单表)');
    console.log('   - order_items (订单项表)');
    console.log('   - cart_items (购物车表)');
    console.log('   - feedback (用户反馈表)');
    console.log('   - newsletter_subscribers (邮件订阅表)\n');
    
    console.log('👤 管理员账户:');
    console.log('   邮箱: admin@xyvn.com');
    console.log('   密码: admin123\n');
    
    console.log('🚀 下一步:');
    console.log('   1. 启动后端: npm start');
    console.log('   2. 启动前端: cd client && npm start');
    console.log('   3. 访问管理后台: http://localhost:3000/admin\n');

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    console.error('\n💡 请检查:');
    console.error('   1. MySQL服务是否运行');
    console.error('   2. .env文件中的数据库配置是否正确');
    console.error('   3. 数据库用户是否有足够的权限\n');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行初始化
initDatabase();
