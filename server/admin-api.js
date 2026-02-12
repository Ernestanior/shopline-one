/**
 * 管理后台API路由
 */

const express = require('express');
const router = express.Router();

// 中间件：验证管理员权限
async function requireAdmin(req, res, next) {
  try {
    console.log('requireAdmin middleware - user:', req.user);
    const { db, user } = req;
    
    if (!user || !user.id) {
      console.log('requireAdmin: No user found');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [rows] = await db.execute(
      'SELECT is_admin FROM users WHERE id = ?',
      [user.id]
    );

    console.log('requireAdmin: User admin status:', rows[0]);

    if (!rows[0] || !rows[0].is_admin) {
      console.log('requireAdmin: User is not admin');
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    console.log('requireAdmin: Access granted');
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================== 用户管理 ====================

// 获取所有用户
router.get('/users', requireAdmin, async (req, res) => {
  try {
    console.log('Admin /users endpoint called');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    let query = 'SELECT id, email, is_admin, created_at, updated_at FROM users';
    let countQuery = 'SELECT COUNT(*) as total FROM users';
    const params = [];

    if (search) {
      query += ' WHERE email LIKE ?';
      countQuery += ' WHERE email LIKE ?';
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    
    console.log('Query params:', { params, limit, offset, types: { limit: typeof limit, offset: typeof offset } });
    const [users] = await req.db.execute(query, params);
    const [countResult] = await req.db.execute(countQuery, params);

    res.json({
      users,
      total: countResult[0].total,
      page,
      limit
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// 更新用户管理员状态
router.patch('/users/:id/admin', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_admin } = req.body;

    await req.db.execute(
      'UPDATE users SET is_admin = ? WHERE id = ?',
      [is_admin ? 1 : 0, id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Update user admin status error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// 删除用户
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // 不能删除自己
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    await req.db.execute('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ==================== 商品管理 ====================

// 获取所有商品
router.get('/products', requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const category = req.query.category || '';
    const search = req.query.search || '';
    const status = req.query.status || '';
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM products WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM products WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      countQuery += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND name LIKE ?';
      countQuery += ' AND name LIKE ?';
      params.push(`%${search}%`);
    }

    if (status) {
      query += ' AND status = ?';
      countQuery += ' AND status = ?';
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    
    const [products] = await req.db.execute(query, params);
    const [countResult] = await req.db.execute(countQuery, params);

    res.json({
      products,
      total: countResult[0].total,
      page,
      limit
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// 创建商品
router.post('/products', requireAdmin, async (req, res) => {
  try {
    const { name, category, price, description, image, stock, featured, status } = req.body;

    const [result] = await req.db.execute(
      `INSERT INTO products (name, category, price, description, image, stock, featured, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, category, price, description, image, stock || 0, featured ? 1 : 0, status || 'available']
    );

    const productId = result.insertId;
    res.json({ 
      success: true, 
      product: { 
        id: productId,
        name,
        category,
        price,
        description,
        image,
        stock: stock || 0,
        featured: featured ? 1 : 0,
        status: status || 'available'
      }
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// 更新商品
router.put('/products/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, description, image, stock, featured, status } = req.body;

    await req.db.execute(
      `UPDATE products 
       SET name = ?, category = ?, price = ?, description = ?, image = ?, 
           stock = ?, featured = ?, status = ?
       WHERE id = ?`,
      [name, category, price, description, image, stock, featured ? 1 : 0, status, id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// 删除商品
router.delete('/products/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await req.db.execute('DELETE FROM products WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ==================== 订单管理 ====================

// 获取所有订单
router.get('/orders', requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status || '';
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    let query = `
      SELECT o.*, u.email as user_email,
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as items_count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND o.status = ?';
      countQuery += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (o.order_number LIKE ? OR o.shipping_name LIKE ? OR o.shipping_email LIKE ?)';
      countQuery += ' AND (order_number LIKE ? OR shipping_name LIKE ? OR shipping_email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY o.created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    
    const [orders] = await req.db.execute(query, params);
    const [countResult] = await req.db.execute(countQuery, params);

    res.json({
      orders,
      total: countResult[0].total,
      page,
      limit
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// 获取订单详情
router.get('/orders/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [orders] = await req.db.execute(
      `SELECT o.*, u.email as user_email
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`,
      [id]
    );

    if (!orders[0]) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const [items] = await req.db.execute(
      'SELECT * FROM order_items WHERE order_id = ?',
      [id]
    );

    res.json({
      ...orders[0],
      items
    });
  } catch (error) {
    console.error('Get order detail error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// 更新订单状态
router.patch('/orders/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, payment_status } = req.body;

    const updates = [];
    const params = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }

    if (payment_status) {
      updates.push('payment_status = ?');
      params.push(payment_status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    params.push(id);

    await req.db.execute(
      `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// 删除订单
router.delete('/orders/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await req.db.execute('DELETE FROM orders WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// ==================== 统计数据 ====================

router.get('/stats', requireAdmin, async (req, res) => {
  try {
    // 用户统计
    const [userStats] = await req.db.execute(
      'SELECT COUNT(*) as total, SUM(is_admin) as admins FROM users'
    );

    // 商品统计
    const [productStats] = await req.db.execute(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN featured = 1 THEN 1 ELSE 0 END) as featured
       FROM products`
    );

    // 订单统计
    const [orderStats] = await req.db.execute(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(total_amount) as total_revenue
       FROM orders`
    );

    // 今日订单
    const [todayOrders] = await req.db.execute(
      `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
       FROM orders
       WHERE DATE(created_at) = CURDATE()`
    );

    // 反馈统计
    const [feedbackStats] = await req.db.execute(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
       FROM feedback`
    );

    // 订阅统计
    const [subscriberStats] = await req.db.execute(
      `SELECT COUNT(*) as total FROM newsletter_subscribers WHERE status = 'active'`
    );

    res.json({
      users: userStats[0],
      products: productStats[0],
      orders: orderStats[0],
      today: todayOrders[0],
      feedback: feedbackStats[0],
      subscribers: subscriberStats[0]
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// ==================== 反馈管理 ====================

// 获取所有反馈
router.get('/feedback', requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status || '';
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM feedback WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM feedback WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      countQuery += ' AND status = ?';
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    
    const [feedback] = await req.db.execute(query, params);
    const [countResult] = await req.db.execute(countQuery, params);

    res.json({
      feedback,
      total: countResult[0].total,
      page,
      limit
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// 更新反馈状态
router.patch('/feedback/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await req.db.execute(
      'UPDATE feedback SET status = ? WHERE id = ?',
      [status, id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Update feedback status error:', error);
    res.status(500).json({ error: 'Failed to update feedback' });
  }
});

// 删除反馈
router.delete('/feedback/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await req.db.execute('DELETE FROM feedback WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete feedback error:', error);
    res.status(500).json({ error: 'Failed to delete feedback' });
  }
});

// ==================== 订阅管理 ====================

// 获取所有订阅者
router.get('/subscribers', requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const query = `SELECT * FROM newsletter_subscribers ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    const countQuery = 'SELECT COUNT(*) as total FROM newsletter_subscribers';
    
    const [subscribers] = await req.db.execute(query);
    const [countResult] = await req.db.execute(countQuery);

    res.json({
      subscribers,
      total: countResult[0].total,
      page,
      limit
    });
  } catch (error) {
    console.error('Get subscribers error:', error);
    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
});

// 删除订阅者
router.delete('/subscribers/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await req.db.execute('DELETE FROM newsletter_subscribers WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete subscriber error:', error);
    res.status(500).json({ error: 'Failed to delete subscriber' });
  }
});

module.exports = { router, requireAdmin };
