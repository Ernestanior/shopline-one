/**
 * Cloudflare Workers Entry Point
 * E-commerce API using Hono framework
 */

import { Hono } from 'hono';
import { createCorsMiddleware, corsCheck } from './middleware/cors';
import { authMiddleware } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/error';
import { authRoutes } from './routes/auth';
import { productRoutes } from './routes/products';
import { cartRoutes } from './routes/cart';
import { orderRoutes } from './routes/orders';
import { userRoutes } from './routes/user';
import { adminRoutes } from './routes/admin';
import { publicRoutes } from './routes/public';
import type { Env } from './types/env';

const app = new Hono<{ Bindings: Env }>();

// Global middleware - CORS must be first
app.use('*', async (c, next) => {
  const corsMiddleware = createCorsMiddleware(c.env);
  return corsMiddleware(c, next);
});

// Handle OPTIONS requests early
app.options('*', (c) => {
  return c.text('', 204);
});

app.use('*', corsCheck);
app.use('*', authMiddleware);

// Health check
app.get('/', (c) => {
  return c.json({
    name: 'E-commerce API',
    version: '1.0.0',
    status: 'healthy'
  });
});

// API routes
app.route('/api/auth', authRoutes);
app.route('/api/products', productRoutes);
app.route('/api/cart', cartRoutes);
app.route('/api/orders', orderRoutes);
app.route('/api/user', userRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api', publicRoutes);

// Error handlers
app.notFound(notFoundHandler);
app.onError(errorHandler);

export default app;
