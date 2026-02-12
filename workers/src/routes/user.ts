/**
 * User Routes
 * User profile, addresses, payment methods, and orders
 */

import { Hono } from 'hono';
import { DatabaseService } from '../services/db.service';
import { requireAuth, getCurrentUser } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';
import { NotFoundError } from '../middleware/error';
import type { Env } from '../types/env';

const user = new Hono<{ Bindings: Env }>();

// All user routes require authentication
user.use('*', requireAuth);

// Profile routes
user.get('/profile', async (c) => {
  const currentUser = getCurrentUser(c)!;
  const db = new DatabaseService(c.env.DB);

  const profile = await db.queryOne(
    'SELECT * FROM user_profiles WHERE user_id = ?',
    [currentUser.id]
  );

  return c.json({ profile });
});

user.put('/profile', validate(schemas.updateProfile), async (c) => {
  const currentUser = getCurrentUser(c)!;
  const { first_name, last_name, phone } = c.get('validatedData');
  const db = new DatabaseService(c.env.DB);

  // Check if profile exists
  const existing = await db.queryOne(
    'SELECT id FROM user_profiles WHERE user_id = ?',
    [currentUser.id]
  );

  if (existing) {
    await db.execute(
      'UPDATE user_profiles SET first_name = ?, last_name = ?, phone = ?, updated_at = datetime(\'now\') WHERE user_id = ?',
      [first_name, last_name, phone, currentUser.id]
    );
  } else {
    await db.execute(
      'INSERT INTO user_profiles (user_id, first_name, last_name, phone) VALUES (?, ?, ?, ?)',
      [currentUser.id, first_name, last_name, phone]
    );
  }

  return c.json({ success: true });
});

// Address routes
user.get('/addresses', async (c) => {
  const currentUser = getCurrentUser(c)!;
  const db = new DatabaseService(c.env.DB);

  const addresses = await db.query(
    'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
    [currentUser.id]
  );

  return c.json({ addresses });
});

user.post('/addresses', validate(schemas.createAddress), async (c) => {
  const currentUser = getCurrentUser(c)!;
  const data = c.get('validatedData');
  const db = new DatabaseService(c.env.DB);

  try {
    // If setting as default, unset other defaults
    if (data.is_default) {
      await db.execute(
        'UPDATE user_addresses SET is_default = 0 WHERE user_id = ?',
        [currentUser.id]
      );
    }

    const result = await db.execute(
      `INSERT INTO user_addresses (user_id, label, first_name, last_name, phone, country, city, address1, address2, postal_code, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        currentUser.id,
        data.label || 'Home',
        data.first_name,
        data.last_name,
        data.phone || null,
        data.country,
        data.city,
        data.address1,
        data.address2 || null,
        data.postal_code,
        data.is_default ? 1 : 0
      ]
    );

    return c.json({ success: true, id: db.getLastInsertId(result) });
  } catch (error) {
    console.error('Error creating address:', error);
    throw error;
  }
});

user.put('/addresses/:id', validate(schemas.createAddress), async (c) => {
  const currentUser = getCurrentUser(c)!;
  const id = c.req.param('id');
  const data = c.get('validatedData');
  const db = new DatabaseService(c.env.DB);

  // If setting as default, unset other defaults
  if (data.is_default) {
    await db.execute(
      'UPDATE user_addresses SET is_default = 0 WHERE user_id = ?',
      [currentUser.id]
    );
  }

  const result = await db.execute(
    `UPDATE user_addresses 
     SET label = ?, first_name = ?, last_name = ?, phone = ?, country = ?, city = ?, address1 = ?, address2 = ?, postal_code = ?, is_default = ?, updated_at = datetime('now')
     WHERE id = ? AND user_id = ?`,
    [
      data.label,
      data.first_name,
      data.last_name,
      data.phone,
      data.country,
      data.city,
      data.address1,
      data.address2,
      data.postal_code,
      data.is_default ? 1 : 0,
      id,
      currentUser.id
    ]
  );

  if (db.getAffectedRows(result) === 0) {
    throw new NotFoundError('Address not found');
  }

  return c.json({ success: true });
});

user.delete('/addresses/:id', async (c) => {
  const currentUser = getCurrentUser(c)!;
  const id = c.req.param('id');
  const db = new DatabaseService(c.env.DB);

  const result = await db.execute(
    'DELETE FROM user_addresses WHERE id = ? AND user_id = ?',
    [id, currentUser.id]
  );

  if (db.getAffectedRows(result) === 0) {
    throw new NotFoundError('Address not found');
  }

  return c.json({ success: true });
});

// Payment method routes
user.get('/payment-methods', async (c) => {
  const currentUser = getCurrentUser(c)!;
  const db = new DatabaseService(c.env.DB);

  const methods = await db.query(
    'SELECT * FROM user_payment_methods WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
    [currentUser.id]
  );

  return c.json({ payment_methods: methods });
});

user.post('/payment-methods', validate(schemas.createPaymentMethod), async (c) => {
  const currentUser = getCurrentUser(c)!;
  const data = c.get('validatedData');
  const db = new DatabaseService(c.env.DB);

  // If setting as default, unset other defaults
  if (data.is_default) {
    await db.execute(
      'UPDATE user_payment_methods SET is_default = 0 WHERE user_id = ?',
      [currentUser.id]
    );
  }

  const result = await db.execute(
    `INSERT INTO user_payment_methods (user_id, card_type, card_last4, card_holder_name, expiry_month, expiry_year, is_default)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      currentUser.id,
      data.card_type,
      data.card_last4,
      data.card_holder_name,
      data.expiry_month,
      data.expiry_year,
      data.is_default ? 1 : 0
    ]
  );

  return c.json({ success: true, id: db.getLastInsertId(result) });
});

user.delete('/payment-methods/:id', async (c) => {
  const currentUser = getCurrentUser(c)!;
  const id = c.req.param('id');
  const db = new DatabaseService(c.env.DB);

  const result = await db.execute(
    'DELETE FROM user_payment_methods WHERE id = ? AND user_id = ?',
    [id, currentUser.id]
  );

  if (db.getAffectedRows(result) === 0) {
    throw new NotFoundError('Payment method not found');
  }

  return c.json({ success: true });
});

// Order routes
user.get('/orders', async (c) => {
  const currentUser = getCurrentUser(c)!;
  const db = new DatabaseService(c.env.DB);

  const userOrders = await db.query(
    `SELECT o.*, COUNT(oi.id) as items_count
     FROM orders o
     LEFT JOIN order_items oi ON o.id = oi.order_id
     WHERE o.user_id = ?
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    [currentUser.id]
  );

  return c.json({ orders: userOrders });
});

user.get('/orders/:id', async (c) => {
  const currentUser = getCurrentUser(c)!;
  const id = c.req.param('id');
  const db = new DatabaseService(c.env.DB);

  const order = await db.queryOne(
    'SELECT * FROM orders WHERE id = ? AND user_id = ?',
    [id, currentUser.id]
  );

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  const items = await db.query(
    'SELECT * FROM order_items WHERE order_id = ?',
    [id]
  );

  return c.json({ order: { ...order, items } });
});

user.patch('/orders/:id/payment', async (c) => {
  const currentUser = getCurrentUser(c)!;
  const id = c.req.param('id');
  const db = new DatabaseService(c.env.DB);

  // Verify order belongs to user
  const order = await db.queryOne(
    'SELECT id FROM orders WHERE id = ? AND user_id = ?',
    [id, currentUser.id]
  );

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  await db.execute(
    'UPDATE orders SET payment_status = ?, updated_at = datetime(\'now\') WHERE id = ?',
    ['paid', id]
  );

  return c.json({ success: true, message: 'Payment status updated successfully' });
});

user.delete('/orders/:id', async (c) => {
  const currentUser = getCurrentUser(c)!;
  const id = c.req.param('id');
  const db = new DatabaseService(c.env.DB);

  // Verify order belongs to user
  const order = await db.queryOne(
    'SELECT id FROM orders WHERE id = ? AND user_id = ?',
    [id, currentUser.id]
  );

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Delete order items first
  await db.execute('DELETE FROM order_items WHERE order_id = ?', [id]);
  
  // Delete order
  await db.execute('DELETE FROM orders WHERE id = ?', [id]);

  return c.json({ success: true, message: 'Order deleted successfully' });
});

export { user as userRoutes };
