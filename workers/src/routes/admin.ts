/**
 * Admin Routes
 * Admin-only product, order, user, and feedback management
 */

import { Hono } from 'hono';
import { DatabaseService } from '../services/db.service';
import { requireAdmin } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';
import { NotFoundError } from '../middleware/error';
import type { Env } from '../types/env';

const admin = new Hono<{ Bindings: Env }>();

// All admin routes require admin authentication
admin.use('*', requireAdmin);

// Product management
admin.get('/products', async (c) => {
  const db = new DatabaseService(c.env.DB);
  const products = await db.query('SELECT * FROM products ORDER BY created_at DESC');
  return c.json({ products });
});

admin.post('/products', validate(schemas.createProduct), async (c) => {
  const data = c.get('validatedData');
  const db = new DatabaseService(c.env.DB);

  const result = await db.execute(
    `INSERT INTO products (name, category, price, description, image, stock, featured, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      data.category,
      data.price,
      data.description || null,
      data.image || null,
      data.stock,
      data.featured,
      'available'
    ]
  );

  return c.json({ success: true, id: db.getLastInsertId(result) }, 201);
});

admin.put('/products/:id', validate(schemas.updateProduct), async (c) => {
  const id = c.req.param('id');
  const data = c.get('validatedData');
  const db = new DatabaseService(c.env.DB);

  // Build dynamic update query
  const updates: string[] = [];
  const params: any[] = [];

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      updates.push(`${key} = ?`);
      params.push(value);
    }
  });

  if (updates.length === 0) {
    return c.json({ success: true });
  }

  updates.push('updated_at = datetime(\'now\')');
  params.push(id);

  const result = await db.execute(
    `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
    params
  );

  if (db.getAffectedRows(result) === 0) {
    throw new NotFoundError('Product not found');
  }

  return c.json({ success: true });
});

admin.delete('/products/:id', async (c) => {
  const id = c.req.param('id');
  const db = new DatabaseService(c.env.DB);

  const result = await db.execute('DELETE FROM products WHERE id = ?', [id]);

  if (db.getAffectedRows(result) === 0) {
    throw new NotFoundError('Product not found');
  }

  return c.json({ success: true });
});

// Order management
admin.get('/orders', async (c) => {
  const db = new DatabaseService(c.env.DB);
  
  const orders = await db.query(
    `SELECT 
      o.*,
      u.email as user_email,
      COUNT(oi.id) as items_count
     FROM orders o
     LEFT JOIN users u ON o.user_id = u.id
     LEFT JOIN order_items oi ON o.id = oi.order_id
     GROUP BY o.id
     ORDER BY o.created_at DESC`
  );

  return c.json({ orders });
});

admin.get('/orders/:id', async (c) => {
  const id = c.req.param('id');
  const db = new DatabaseService(c.env.DB);

  const order = await db.queryOne('SELECT * FROM orders WHERE id = ?', [id]);

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  const items = await db.query('SELECT * FROM order_items WHERE order_id = ?', [id]);

  return c.json({ order: { ...order, items } });
});

admin.put('/orders/:id', async (c) => {
  const id = c.req.param('id');
  const { status, payment_status } = await c.req.json();
  const db = new DatabaseService(c.env.DB);

  const updates: string[] = [];
  const params: any[] = [];

  if (status) {
    updates.push('status = ?');
    params.push(status);
  }

  if (payment_status) {
    updates.push('payment_status = ?');
    params.push(payment_status);
  }

  if (updates.length === 0) {
    return c.json({ success: true });
  }

  updates.push('updated_at = datetime(\'now\')');
  params.push(id);

  const result = await db.execute(
    `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`,
    params
  );

  if (db.getAffectedRows(result) === 0) {
    throw new NotFoundError('Order not found');
  }

  return c.json({ success: true });
});

// User management
admin.get('/users', async (c) => {
  const db = new DatabaseService(c.env.DB);
  
  const users = await db.query(
    'SELECT id, email, is_admin, created_at FROM users ORDER BY created_at DESC'
  );

  return c.json({ users });
});

// Feedback management
admin.get('/feedback', async (c) => {
  const db = new DatabaseService(c.env.DB);
  
  const feedback = await db.query(
    'SELECT * FROM feedback ORDER BY created_at DESC'
  );

  return c.json({ feedback });
});

admin.patch('/feedback/:id/status', async (c) => {
  const id = c.req.param('id');
  const { status } = await c.req.json();
  const db = new DatabaseService(c.env.DB);

  const result = await db.execute(
    'UPDATE feedback SET status = ?, updated_at = datetime(\'now\') WHERE id = ?',
    [status, id]
  );

  if (db.getAffectedRows(result) === 0) {
    throw new NotFoundError('Feedback not found');
  }

  return c.json({ success: true });
});

admin.delete('/feedback/:id', async (c) => {
  const id = c.req.param('id');
  const db = new DatabaseService(c.env.DB);

  const result = await db.execute('DELETE FROM feedback WHERE id = ?', [id]);

  if (db.getAffectedRows(result) === 0) {
    throw new NotFoundError('Feedback not found');
  }

  return c.json({ success: true });
});

// Subscriber management
admin.get('/subscribers', async (c) => {
  const db = new DatabaseService(c.env.DB);
  
  const subscribers = await db.query(
    'SELECT * FROM newsletter_subscribers ORDER BY created_at DESC'
  );

  return c.json({ subscribers });
});

admin.delete('/subscribers/:id', async (c) => {
  const id = c.req.param('id');
  const db = new DatabaseService(c.env.DB);

  const result = await db.execute('DELETE FROM newsletter_subscribers WHERE id = ?', [id]);

  if (db.getAffectedRows(result) === 0) {
    throw new NotFoundError('Subscriber not found');
  }

  return c.json({ success: true });
});

// Stats endpoint
admin.get('/stats', async (c) => {
  const db = new DatabaseService(c.env.DB);

  // Get user stats
  const userStats = await db.queryOne(
    'SELECT COUNT(*) as total, SUM(is_admin) as admins FROM users'
  );

  // Get product stats
  const productStats = await db.queryOne(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
      SUM(featured) as featured
     FROM products`
  );

  // Get order stats
  const orderStats = await db.queryOne(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      COALESCE(SUM(total_amount), 0) as total_revenue
     FROM orders`
  );

  // Get today's stats
  const todayStats = await db.queryOne(
    `SELECT 
      COUNT(*) as count,
      COALESCE(SUM(total_amount), 0) as revenue
     FROM orders
     WHERE DATE(created_at) = DATE('now')`
  );

  // Get feedback stats
  const feedbackStats = await db.queryOne(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
     FROM feedback`
  );

  // Get subscriber stats
  const subscriberStats = await db.queryOne(
    `SELECT COUNT(*) as total FROM newsletter_subscribers WHERE status = 'active'`
  );

  return c.json({
    users: {
      total: userStats?.total || 0,
      admins: userStats?.admins || 0
    },
    products: {
      total: productStats?.total || 0,
      available: productStats?.available || 0,
      featured: productStats?.featured || 0
    },
    orders: {
      total: orderStats?.total || 0,
      pending: orderStats?.pending || 0,
      completed: orderStats?.completed || 0,
      total_revenue: orderStats?.total_revenue || 0
    },
    today: {
      count: todayStats?.count || 0,
      revenue: todayStats?.revenue || 0
    },
    feedback: {
      total: feedbackStats?.total || 0,
      pending: feedbackStats?.pending || 0
    },
    subscribers: {
      total: subscriberStats?.total || 0
    }
  });
});

// Order status update
admin.patch('/orders/:id/status', async (c) => {
  const id = c.req.param('id');
  const { status } = await c.req.json();
  const db = new DatabaseService(c.env.DB);

  const result = await db.execute(
    'UPDATE orders SET status = ?, updated_at = datetime(\'now\') WHERE id = ?',
    [status, id]
  );

  if (db.getAffectedRows(result) === 0) {
    throw new NotFoundError('Order not found');
  }

  return c.json({ success: true });
});

// Delete user
admin.delete('/users/:id', async (c) => {
  const id = c.req.param('id');
  const db = new DatabaseService(c.env.DB);

  const result = await db.execute('DELETE FROM users WHERE id = ?', [id]);

  if (db.getAffectedRows(result) === 0) {
    throw new NotFoundError('User not found');
  }

  return c.json({ success: true });
});

export { admin as adminRoutes };
