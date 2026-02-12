/**
 * Product Routes
 * Public product listing and details
 */

import { Hono } from 'hono';
import { DatabaseService } from '../services/db.service';
import { NotFoundError } from '../middleware/error';
import type { Env } from '../types/env';
import type { Product } from '../types/models';

const products = new Hono<{ Bindings: Env }>();

// Get all products
products.get('/', async (c) => {
  const category = c.req.query('category');
  const db = new DatabaseService(c.env.DB);

  let sql = 'SELECT * FROM products WHERE status = ?';
  const params: any[] = ['available'];

  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }

  sql += ' ORDER BY featured DESC, created_at DESC';

  const productList = await db.query<Product>(sql, params);

  return c.json(productList);
});

// Get product by ID
products.get('/:id', async (c) => {
  const id = c.req.param('id');
  const db = new DatabaseService(c.env.DB);

  const product = await db.queryOne<Product>(
    'SELECT * FROM products WHERE id = ?',
    [id]
  );

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  return c.json(product);
});

// Get categories
products.get('/categories/list', (c) => {
  const categories = [
    { id: 'mobility', name: 'Mobility', description: 'Minimalist wallets and carry solutions' },
    { id: 'productivity', name: 'Productivity', description: 'Useful tools for daily tasks' },
    { id: 'sanctuary', name: 'Sanctuary', description: 'Home and lifestyle products' },
    { id: 'savoriness', name: 'Savoriness', description: 'Food and dining accessories' }
  ];

  return c.json(categories);
});

export { products as productRoutes };
