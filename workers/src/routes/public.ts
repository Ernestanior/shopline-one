/**
 * Public Routes
 * Contact/feedback and newsletter subscription
 */

import { Hono } from 'hono';
import { DatabaseService } from '../services/db.service';
import { validate, schemas } from '../middleware/validation';
import type { Env } from '../types/env';

const publicRoutes = new Hono<{ Bindings: Env }>();

// Submit feedback/contact
publicRoutes.post('/contact', validate(schemas.submitFeedback), async (c) => {
  const { name, email, subject, message } = c.get('validatedData');
  const db = new DatabaseService(c.env.DB);

  await db.execute(
    'INSERT INTO feedback (name, email, subject, message) VALUES (?, ?, ?, ?)',
    [name, email, subject || '', message]
  );

  return c.json({ success: true, message: 'Feedback submitted successfully' });
});

// Newsletter subscription
publicRoutes.post('/newsletter/subscribe', validate(schemas.subscribe), async (c) => {
  const { email } = c.get('validatedData');
  const db = new DatabaseService(c.env.DB);

  // Check if already subscribed
  const existing = await db.queryOne(
    'SELECT id FROM newsletter_subscribers WHERE email = ?',
    [email]
  );

  if (existing) {
    return c.json({ success: true, message: 'Already subscribed' });
  }

  await db.execute(
    'INSERT INTO newsletter_subscribers (email) VALUES (?)',
    [email]
  );

  return c.json({ success: true, message: 'Subscribed successfully' });
});

// Get categories
publicRoutes.get('/categories', (c) => {
  const categories = [
    { id: 'mobility', name: 'Mobility', description: 'Minimalist wallets and carry solutions' },
    { id: 'productivity', name: 'Productivity', description: 'Useful tools for daily tasks' },
    { id: 'sanctuary', name: 'Sanctuary', description: 'Home and lifestyle products' },
    { id: 'savoriness', name: 'Savoriness', description: 'Food and dining accessories' }
  ];

  return c.json(categories);
});

export { publicRoutes };
