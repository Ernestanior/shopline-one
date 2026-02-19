/**
 * Rate Limiter Middleware
 * 
 * Implements user-based rate limiting to prevent abuse of payment endpoints.
 * Limits requests to 10 per minute per user.
 * Requirements: 15.5, 15.6
 */

import { Context, Next } from 'hono';
import { createLogger } from '../utils/logger';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store for rate limiting
// In production, consider using Cloudflare KV or Durable Objects
const rateLimitStore = new Map<string, RateLimitEntry>();

// Logger instance
const logger = createLogger();

/**
 * Rate limiter middleware factory
 * 
 * @param config - Rate limit configuration
 * @returns Hono middleware function
 */
export function rateLimiter(config: RateLimitConfig = { maxRequests: 10, windowMs: 60000 }) {
  return async (c: Context, next: Next) => {
    // Get user identifier (IP address or user ID)
    const userId = getUserIdentifier(c);
    
    if (!userId) {
      // If we can't identify the user, allow the request but log it
      console.warn('Rate limiter: Unable to identify user');
      await next();
      return;
    }
    
    const now = Date.now();
    const entry = rateLimitStore.get(userId);
    
    // Clean up expired entries periodically
    if (Math.random() < 0.01) {
      cleanupExpiredEntries(now);
    }
    
    if (!entry || now > entry.resetAt) {
      // Create new entry or reset expired entry
      const newEntry = {
        count: 1,
        resetAt: now + config.windowMs,
      };
      rateLimitStore.set(userId, newEntry);
      
      // Add rate limit headers
      c.header('X-RateLimit-Limit', config.maxRequests.toString());
      c.header('X-RateLimit-Remaining', (config.maxRequests - 1).toString());
      c.header('X-RateLimit-Reset', newEntry.resetAt.toString());
      
      await next();
      return;
    }
    
    if (entry.count >= config.maxRequests) {
      // Rate limit exceeded - log security event
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      
      logger.warn('Rate limit exceeded', {
        userId,
        path: c.req.path,
        method: c.req.method,
        count: entry.count,
        limit: config.maxRequests,
        retryAfter,
      });
      
      // Log to security events table if database is available
      const db = c.env?.DB;
      if (db) {
        try {
          await db
            .prepare(
              `INSERT INTO payment_security_logs 
              (event_type, ip_address, user_agent, request_data, created_at)
              VALUES (?, ?, ?, ?, ?)`
            )
            .bind(
              'rate_limit',
              c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || null,
              c.req.header('user-agent') || null,
              JSON.stringify({ userId, path: c.req.path, count: entry.count }),
              new Date().toISOString()
            )
            .run();
        } catch (error) {
          logger.error('Failed to log security event', { error });
        }
      }
      
      return c.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter,
        },
        429,
        {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': entry.resetAt.toString(),
        }
      );
    }
    
    // Increment counter
    entry.count++;
    rateLimitStore.set(userId, entry);
    
    // Add rate limit headers
    c.header('X-RateLimit-Limit', config.maxRequests.toString());
    c.header('X-RateLimit-Remaining', (config.maxRequests - entry.count).toString());
    c.header('X-RateLimit-Reset', entry.resetAt.toString());
    
    await next();
  };
}

/**
 * Get user identifier for rate limiting
 * Prefers authenticated user ID, falls back to IP address
 */
function getUserIdentifier(c: Context): string | null {
  // Try to get authenticated user ID from context
  const user = c.get('user');
  if (user && user.id) {
    return `user:${user.id}`;
  }
  
  // Fall back to IP address
  const ip = c.req.header('cf-connecting-ip') || 
             c.req.header('x-forwarded-for') || 
             c.req.header('x-real-ip');
  
  if (ip) {
    return `ip:${ip}`;
  }
  
  return null;
}

/**
 * Clean up expired entries from the rate limit store
 */
function cleanupExpiredEntries(now: number): void {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Reset rate limit for a specific user (useful for testing)
 */
export function resetRateLimit(userId: string): void {
  rateLimitStore.delete(userId);
}

/**
 * Get current rate limit status for a user
 */
export function getRateLimitStatus(userId: string): RateLimitEntry | null {
  return rateLimitStore.get(userId) || null;
}
