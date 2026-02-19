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
import { payment } from './routes/payment';
import type { Env } from './types/env';
import { handleScheduled } from './cron/expire-payments';

const app = new Hono<{ Bindings: Env }>();

// Global middleware - Permissive CORS for debugging
app.use('*', async (c, next) => {
  const origin = c.req.header('origin');
  const method = c.req.method;
  
  // For POST to /test-direct, return immediately
  if (method === 'POST' && c.req.path === '/test-direct') {
    return new Response(
      JSON.stringify({ message: 'Intercepted in middleware', origin }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Credentials': 'true',
        }
      }
    );
  }
  
  // Always allow the origin if present
  if (origin) {
    c.header('Access-Control-Allow-Origin', origin);
  } else {
    c.header('Access-Control-Allow-Origin', '*');
  }
  
  c.header('Access-Control-Allow-Credentials', 'true');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  c.header('Access-Control-Expose-Headers', 'Content-Length, X-Request-Id');
  c.header('Access-Control-Max-Age', '86400');
  c.header('Vary', 'Origin');
  
  await next();
  
  // Set again after processing
  if (origin) {
    c.header('Access-Control-Allow-Origin', origin);
  }
  c.header('Access-Control-Allow-Credentials', 'true');
});

// Handle OPTIONS requests early - must return proper CORS headers
app.options('*', async (c) => {
  // CORS headers are already set by createCorsMiddleware
  // Just return 204
  return c.text('', 204);
});

// Disable all middleware for debugging
// app.use('*', corsCheck);
// app.use('*', authMiddleware);

// Health check
app.get('/', (c) => {
  return c.json({
    name: 'E-commerce API',
    version: '1.0.0',
    status: 'healthy'
  });
});

// Test endpoint for CORS - bypass all middleware
app.post('/test-direct', async (c) => {
  const origin = c.req.header('origin');
  return new Response(
    JSON.stringify({ message: 'Direct response', origin }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    }
  );
});

// API routes
app.route('/api/auth', authRoutes);
app.route('/api/products', productRoutes);
app.route('/api/cart', cartRoutes);
app.route('/api/orders', orderRoutes);
app.route('/api/user', userRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/payment', payment);
app.route('/api', publicRoutes);

// Error handlers
app.notFound(notFoundHandler);
app.onError(errorHandler);

// Export the scheduled handler for cron triggers
export { handleScheduled as scheduled };

export default app;
