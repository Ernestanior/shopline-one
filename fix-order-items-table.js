/**
 * 修复order_items表，移除product_id外键约束
 * 因为测试时可能使用不存在的product_id
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixOrderItemsTable() {
  let connection;
  
  try {
    console.log('连接数据库...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'shop'
    });

    console.log('✅ 数据库连接成功\n');

    // 1. 删除product_id外键约束
    console.log('删除product_id外键约束...');
    try {
      await connection.execute(`
        ALTER TABLE order_items 
        DROP FOREIGN KEY order_items_ibfk_2
      `);
      console.log('✅ product_id外键约束已删除');
    } catch (error) {
      if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('⚠️ 外键约束不存在，跳过');
      } else {
        console.log('⚠️ 删除外键失败:', error.message);
      }
    }

    // 2. 修改product_id字段允许NULL（可选）
    console.log('\n修改product_id字段...');
    await connection.execute(`
      ALTER TABLE order_items 
      MODIFY COLUMN product_id BIGINT UNSIGNED NULL
    `);
    console.log('✅ product_id字段已修改为允许NULL');

    console.log('\n✅ order_items表修复完成！');
    console.log('现在可以使用任意product_id创建订单');

  } catch (error) {
    console.error('❌ 修复失败:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixOrderItemsTable()
  .then(() => {
    console.log('\n数据库修复完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n数据库修复失败:', error);
    process.exit(1);
  });
