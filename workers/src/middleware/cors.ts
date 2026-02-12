/**
 * CORS Middleware
 * Handles Cross-Origin Resource Sharing configuration
 */

import { Context, Next } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from '../types/env';

/**
 * Create CORS middleware with allowed origins from environment
 */
export function createCorsMiddleware(env: Env) {
  const allowedOriginsStr = env.ALLOWED_ORIGINS || '';
  const allowedOrigins = allowedOriginsStr
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  return cors({
    origin: (origin) => {
      // Allow requests without origin (e.g., mobile apps, Postman)
      if (!origin) return '*';

      // In development, allow localhost on any port
      if (origin.match(/^https?:\/\/localhost(:\d+)?$/)) {
        return origin;
      }

      // Check if origin is in allowed list
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return origin;
      }

      // Reject other origins
      return null;
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: 86400 // 24 hours
  });
}

/**
 * Simple CORS check middleware for non-GET requests
 * Provides additional CSRF-like protection
 */
export async function corsCheck(c: Context<{ Bindings: Env }>, next: Next) {
  const method = c.req.method.toUpperCase();
  
  // Allow GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return next();
  }

  // For mutating requests, check origin
  const origin = c.req.header('origin');
  const allowedOriginsStr = c.env.ALLOWED_ORIGINS || '';
  const allowedOrigins = allowedOriginsStr
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  // Allow if no origin (same-origin or non-browser)
  if (!origin) {
    return next();
  }

  // Allow localhost in development
  if (origin.match(/^https?:\/\/localhost(:\d+)?$/)) {
    return next();
  }

  // Check if origin is allowed
  if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
    return next();
  }

  // Reject
  return c.json({ error: 'Forbidden' }, 403);
}
