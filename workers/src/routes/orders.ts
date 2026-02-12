/**
 * Order Routes
 * Order creation and management
 */

import { Hono } from 'hono';
import { DatabaseService } from '../services/db.service';
import { getCurrentUser } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';
import type { Env } from '../types/env';

const orders = new Hono<{ Bindings: Env }>();

// Create order (public - supports guest checkout)
orders.post('/', validate(schemas.createOrder), async (c) => {
  const user = getCurrentUser(c);
  const { items, contact, address, totals } = c.get('validatedData');
  const db = new DatabaseService(c.env.DB);

  // Generate order number
  const orderNumber = `XYVN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // Calculate total
  const totalAmount = totals?.total || items.reduce((sum: number, item: any) => 
    sum + (item.price * item.quantity), 0
  );

  // Create order and order items in a batch
  const queries = [
    {
      sql: `INSERT INTO orders (
        user_id, order_number, total_amount, status, payment_status,
        shipping_name, shipping_email, shipping_phone, shipping_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [
        user?.id || null,
        orderNumber,
        totalAmount,
        'pending',
        'unpaid',
        `${address.firstName} ${address.lastName}`,
        contact.email,
        contact.phone || '',
        JSON.stringify(address)
      ]
    }
  ];

  // Execute order creation
  const [orderResult] = await db.batch(queries);
  const orderId = db.getLastInsertId(orderResult);

  // Create order items
  const itemQueries = items.map((item: any) => ({
    sql: `INSERT INTO order_items (
      order_id, product_id, product_name, product_image, quantity, price, subtotal
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    params: [
      orderId,
      item.id,
      item.name,
      item.image || '',
      item.quantity,
      item.price,
      item.price * item.quantity
    ]
  }));

  await db.batch(itemQueries);

  return c.json({
    success: true,
    order: {
      id: orderId,
      orderNumber,
      totalAmount,
      status: 'pending'
    }
  }, 201);
});

export { orders as orderRoutes };
