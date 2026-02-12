/**
 * Cart Routes
 * Shopping cart management
 */

import { Hono } from 'hono';
import { DatabaseService } from '../services/db.service';
import { requireAuth, getCurrentUser } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';
import { NotFoundError, ValidationError } from '../middleware/error';
import type { Env } from '../types/env';
import type { CartItemWithProduct } from '../types/models';

const cart = new Hono<{ Bindings: Env }>();

// All cart routes require authentication
cart.use('*', requireAuth);

// Get cart
cart.get('/', async (c) => {
  const user = getCurrentUser(c)!;
  const db = new DatabaseService(c.env.DB);

  const items = await db.query<CartItemWithProduct>(
    `SELECT ci.id, ci.product_id, ci.quantity, ci.created_at, ci.updated_at,
            p.name, p.price, p.image, p.status
     FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     WHERE ci.user_id = ?`,
    [user.id]
  );

  return c.json({ items });
});

// Add item to cart (also support POST /)
cart.post('/', validate(schemas.addToCart), async (c) => {
  const user = getCurrentUser(c)!;
  const { product_id, quantity } = c.get('validatedData');
  const db = new DatabaseService(c.env.DB);

  // Check if product exists
  const product = await db.queryOne(
    'SELECT id FROM products WHERE id = ? AND status = ?',
    [product_id, 'available']
  );

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  // Check if item already in cart
  const existing = await db.queryOne<{ id: number; quantity: number }>(
    'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
    [user.id, product_id]
  );

  if (existing) {
    // Update quantity
    await db.execute(
      'UPDATE cart_items SET quantity = quantity + ?, updated_at = datetime(\'now\') WHERE id = ?',
      [quantity, existing.id]
    );
  } else {
    // Insert new item
    await db.execute(
      'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
      [user.id, product_id, quantity]
    );
  }

  return c.json({ success: true });
});

// Update cart item quantity
cart.put('/items/:id', validate(schemas.updateCartItem), async (c) => {
  const user = getCurrentUser(c)!;
  const id = c.req.param('id');
  const { quantity } = c.get('validatedData');
  const db = new DatabaseService(c.env.DB);

  const result = await db.execute(
    'UPDATE cart_items SET quantity = ?, updated_at = datetime(\'now\') WHERE id = ? AND user_id = ?',
    [quantity, id, user.id]
  );

  if (db.getAffectedRows(result) === 0) {
    throw new NotFoundError('Cart item not found');
  }

  return c.json({ success: true });
});

// Delete cart item
cart.delete('/items/:id', async (c) => {
  const user = getCurrentUser(c)!;
  const id = c.req.param('id');
  const db = new DatabaseService(c.env.DB);

  const result = await db.execute(
    'DELETE FROM cart_items WHERE id = ? AND user_id = ?',
    [id, user.id]
  );

  if (db.getAffectedRows(result) === 0) {
    throw new NotFoundError('Cart item not found');
  }

  return c.json({ success: true });
});

// Clear cart
cart.delete('/', async (c) => {
  const user = getCurrentUser(c)!;
  const db = new DatabaseService(c.env.DB);

  await db.execute(
    'DELETE FROM cart_items WHERE user_id = ?',
    [user.id]
  );

  return c.json({ success: true });
});

export { cart as cartRoutes };
