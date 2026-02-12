/**
 * 修复orders表，允许游客结账
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixOrdersTable() {
  let connection;
  
  try {
    console.log('连接数据库...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'zenlet'
    });

    console.log('✅ 数据库连接成功\n');

    // 1. 删除外键约束
    console.log('删除外键约束...');
    try {
      await connection.execute(`
        ALTER TABLE orders 
        DROP FOREIGN KEY orders_ibfk_1
      `);
      console.log('✅ 外键约束已删除');
    } catch (error) {
      if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('⚠️ 外键约束不存在，跳过');
      } else {
        throw error;
      }
    }

    // 2. 修改user_id字段允许NULL
    console.log('\n修改user_id字段...');
    await connection.execute(`
      ALTER TABLE orders 
      MODIFY COLUMN user_id BIGINT UNSIGNED NULL
    `);
    console.log('✅ user_id字段已修改为允许NULL');

    // 3. 添加新的外键约束（允许NULL）
    console.log('\n添加新的外键约束...');
    try {
      await connection.execute(`
        ALTER TABLE orders 
        ADD CONSTRAINT fk_orders_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE SET NULL
      `);
      console.log('✅ 新的外键约束已添加');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('⚠️ 外键约束已存在，跳过');
      } else {
        throw error;
      }
    }

    console.log('\n✅ orders表修复完成！');
    console.log('现在支持游客结账（user_id可以为NULL）');

  } catch (error) {
    console.error('❌ 修复失败:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixOrdersTable()
  .then(() => {
    console.log('\n数据库修复完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n数据库修复失败:', error);
    process.exit(1);
  });
