/**
 * Rate Limiter Unit Tests
 * 
 * Tests the rate limiting middleware functionality.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { rateLimiter, resetRateLimit, getRateLimitStatus } from '../middleware/rate-limiter';

describe('Rate Limiter Middleware', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    
    // Reset rate limits before each test
    resetRateLimit('ip:127.0.0.1');
    resetRateLimit('user:test-user');
  });

  describe('Normal Request Flow', () => {
    it('should allow requests within the limit', async () => {
      app.use('*', rateLimiter({ maxRequests: 10, windowMs: 60000 }));
      app.get('/test', (c) => c.json({ success: true }));

      // Make 5 requests (within limit)
      for (let i = 0; i < 5; i++) {
        const res = await app.request('/test', {
          headers: { 'cf-connecting-ip': '127.0.0.1' },
        });
        
        expect(res.status).toBe(200);
        expect(res.headers.get('X-RateLimit-Limit')).toBe('10');
        expect(parseInt(res.headers.get('X-RateLimit-Remaining') || '0')).toBeGreaterThan(0);
      }
    });

    it('should include rate limit headers in response', async () => {
      app.use('*', rateLimiter({ maxRequests: 10, windowMs: 60000 }));
      app.get('/test', (c) => c.json({ success: true }));

      const res = await app.request('/test', {
        headers: { 'cf-connecting-ip': '127.0.0.1' },
      });

      expect(res.headers.get('X-RateLimit-Limit')).toBe('10');
      expect(res.headers.get('X-RateLimit-Remaining')).toBeDefined();
      expect(res.headers.get('X-RateLimit-Reset')).toBeDefined();
    });

    it('should decrement remaining count with each request', async () => {
      app.use('*', rateLimiter({ maxRequests: 10, windowMs: 60000 }));
      app.get('/test', (c) => c.json({ success: true }));

      const res1 = await app.request('/test', {
        headers: { 'cf-connecting-ip': '127.0.0.1' },
      });
      const remaining1 = parseInt(res1.headers.get('X-RateLimit-Remaining') || '0');

      const res2 = await app.request('/test', {
        headers: { 'cf-connecting-ip': '127.0.0.1' },
      });
      const remaining2 = parseInt(res2.headers.get('X-RateLimit-Remaining') || '0');

      expect(remaining2).toBe(remaining1 - 1);
    });
  });

  describe('Rate Limit Exceeded', () => {
    it('should reject requests when limit is exceeded', async () => {
      app.use('*', rateLimiter({ maxRequests: 3, windowMs: 60000 }));
      app.get('/test', (c) => c.json({ success: true }));

      // Make 3 requests (at limit)
      for (let i = 0; i < 3; i++) {
        const res = await app.request('/test', {
          headers: { 'cf-connecting-ip': '127.0.0.1' },
        });
        expect(res.status).toBe(200);
      }

      // 4th request should be rejected
      const res = await app.request('/test', {
        headers: { 'cf-connecting-ip': '127.0.0.1' },
      });

      expect(res.status).toBe(429);
      const body = await res.json() as { error: string; retryAfter: number };
      expect(body.error).toBe('Too many requests');
      expect(body.retryAfter).toBeDefined();
    });

    it('should include Retry-After header when limit exceeded', async () => {
      app.use('*', rateLimiter({ maxRequests: 2, windowMs: 60000 }));
      app.get('/test', (c) => c.json({ success: true }));

      // Exhaust limit
      await app.request('/test', { headers: { 'cf-connecting-ip': '127.0.0.1' } });
      await app.request('/test', { headers: { 'cf-connecting-ip': '127.0.0.1' } });

      // Next request should be rejected with Retry-After
      const res = await app.request('/test', {
        headers: { 'cf-connecting-ip': '127.0.0.1' },
      });

      expect(res.status).toBe(429);
      expect(res.headers.get('Retry-After')).toBeDefined();
      expect(parseInt(res.headers.get('Retry-After') || '0')).toBeGreaterThan(0);
    });

    it('should set remaining count to 0 when limit exceeded', async () => {
      app.use('*', rateLimiter({ maxRequests: 2, windowMs: 60000 }));
      app.get('/test', (c) => c.json({ success: true }));

      // Exhaust limit
      await app.request('/test', { headers: { 'cf-connecting-ip': '127.0.0.1' } });
      await app.request('/test', { headers: { 'cf-connecting-ip': '127.0.0.1' } });

      // Next request should show 0 remaining
      const res = await app.request('/test', {
        headers: { 'cf-connecting-ip': '127.0.0.1' },
      });

      expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');
    });
  });

  describe('User Identification', () => {
    it('should use cf-connecting-ip header for identification', async () => {
      app.use('*', rateLimiter({ maxRequests: 2, windowMs: 60000 }));
      app.get('/test', (c) => c.json({ success: true }));

      // User 1 makes 2 requests
      await app.request('/test', { headers: { 'cf-connecting-ip': '192.168.1.1' } });
      await app.request('/test', { headers: { 'cf-connecting-ip': '192.168.1.1' } });

      // User 1's 3rd request should be rejected
      const res1 = await app.request('/test', {
        headers: { 'cf-connecting-ip': '192.168.1.1' },
      });
      expect(res1.status).toBe(429);

      // User 2 should still be able to make requests
      const res2 = await app.request('/test', {
        headers: { 'cf-connecting-ip': '192.168.1.2' },
      });
      expect(res2.status).toBe(200);
    });

    it('should use x-forwarded-for header as fallback', async () => {
      app.use('*', rateLimiter({ maxRequests: 2, windowMs: 60000 }));
      app.get('/test', (c) => c.json({ success: true }));

      await app.request('/test', { headers: { 'x-forwarded-for': '10.0.0.1' } });
      await app.request('/test', { headers: { 'x-forwarded-for': '10.0.0.1' } });

      const res = await app.request('/test', {
        headers: { 'x-forwarded-for': '10.0.0.1' },
      });
      expect(res.status).toBe(429);
    });

    it('should isolate rate limits between different users', async () => {
      app.use('*', rateLimiter({ maxRequests: 2, windowMs: 60000 }));
      app.get('/test', (c) => c.json({ success: true }));

      // Each user should have their own limit
      const res1 = await app.request('/test', { headers: { 'cf-connecting-ip': '1.1.1.1' } });
      const res2 = await app.request('/test', { headers: { 'cf-connecting-ip': '2.2.2.2' } });
      const res3 = await app.request('/test', { headers: { 'cf-connecting-ip': '3.3.3.3' } });

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res3.status).toBe(200);
    });
  });

  describe('Helper Functions', () => {
    it('should reset rate limit for a user', async () => {
      app.use('*', rateLimiter({ maxRequests: 2, windowMs: 60000 }));
      app.get('/test', (c) => c.json({ success: true }));

      // Exhaust limit
      await app.request('/test', { headers: { 'cf-connecting-ip': '127.0.0.1' } });
      await app.request('/test', { headers: { 'cf-connecting-ip': '127.0.0.1' } });

      // Should be rejected
      const res1 = await app.request('/test', {
        headers: { 'cf-connecting-ip': '127.0.0.1' },
      });
      expect(res1.status).toBe(429);

      // Reset limit
      resetRateLimit('ip:127.0.0.1');

      // Should be allowed again
      const res2 = await app.request('/test', {
        headers: { 'cf-connecting-ip': '127.0.0.1' },
      });
      expect(res2.status).toBe(200);
    });

    it('should get rate limit status for a user', async () => {
      app.use('*', rateLimiter({ maxRequests: 5, windowMs: 60000 }));
      app.get('/test', (c) => c.json({ success: true }));

      // Make a request
      await app.request('/test', { headers: { 'cf-connecting-ip': '127.0.0.1' } });

      // Check status
      const status = getRateLimitStatus('ip:127.0.0.1');
      expect(status).toBeDefined();
      expect(status?.count).toBe(1);
      expect(status?.resetAt).toBeGreaterThan(Date.now());
    });

    it('should return null for non-existent user', () => {
      const status = getRateLimitStatus('ip:non-existent');
      expect(status).toBeNull();
    });
  });
});
