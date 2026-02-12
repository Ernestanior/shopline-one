// 添加用户个人信息和地址表
const mysql = require('mysql2/promise');
require('dotenv').config();

async function addUserProfileTables() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'shop_dev',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'shop'
  });

  try {
    console.log('开始添加用户个人信息表...');

    // 用户个人信息表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ user_profiles 表创建成功');

    // 用户地址表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_addresses (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        label VARCHAR(50) DEFAULT 'default',
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(50),
        country VARCHAR(100) NOT NULL,
        city VARCHAR(100) NOT NULL,
        address1 VARCHAR(255) NOT NULL,
        address2 VARCHAR(255),
        postal_code VARCHAR(20) NOT NULL,
        is_default TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_default (user_id, is_default)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ user_addresses 表创建成功');

    // 用户支付方式表（存储卡号后4位，不存储完整信息）
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_payment_methods (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        card_type VARCHAR(50) NOT NULL,
        card_last4 VARCHAR(4) NOT NULL,
        card_holder_name VARCHAR(200) NOT NULL,
        expiry_month VARCHAR(2) NOT NULL,
        expiry_year VARCHAR(4) NOT NULL,
        is_default TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_default (user_id, is_default)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ user_payment_methods 表创建成功');

    console.log('\n✅ 所有表创建完成！');
  } catch (error) {
    console.error('❌ 错误:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

addUserProfileTables()
  .then(() => {
    console.log('\n数据库迁移完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('数据库迁移失败:', error);
    process.exit(1);
  });
