/**
 * Admin Permission Enforcement Test
 * Property 13: Admin Permission Enforcement
 * Validates: Requirements 5.6
 * 
 * Tests that admin permissions are correctly enforced
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { Hono } from 'hono';
import { authMiddleware, requireAuth, requireAdmin, setAuthCookie } from '../middleware/auth';
import { issueToken } from '../services/auth.service';
import type { Env } from '../types/env';

describe('Feature: cloudflare-migration, Property 13: Admin Permission Enforcement', () => {
  let app: Hono<{ Bindings: Env }>;
  let mockEnv: Env;

  beforeEach(() => {
    mockEnv = {
      DB: {} as D1Database,
      R2_BUCKET: {} as R2Bucket,
      JWT_SECRET: 'test-secret-key',
      ALLOWED_ORIGINS: 'http://localhost:3000'
    };

    app = new Hono<{ Bindings: Env }>();
    
    // Setup middleware
    app.use('*', async (c, next) => {
      c.env = mockEnv;
      return next();
    });
    app.use('*', authMiddleware);

    // Public route
    app.get('/public', (c) => c.json({ message: 'public' }));
    
    // Protected route
    app.get('/protected', requireAuth, (c) => c.json({ message: 'protected' }));
    
    // Admin route
    app.get('/admin', requireAdmin, (c) => c.json({ message: 'admin' }));
  });

  describe('Public routes', () => {
    it('should allow access without authentication', async () => {
      const req = new Request('http://localhost/public');
      const res = await app.fetch(req, mockEnv);
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.message).toBe('public');
    });
  });

  describe('Protected routes', () => {
    it('should deny access without authentication', async () => {
      const req = new Request('http://localhost/protected');
      const res = await app.fetch(req, mockEnv);
      
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should allow access with valid token', async () => {
      const user = { id: 1, email: 'user@example.com', is_admin: 0 };
      const token = await issueToken(user, mockEnv.JWT_SECRET);
      
      const req = new Request('http://localhost/protected', {
        headers: {
          'Cookie': `shop_auth=${token}`
        }
      });
      
      const res = await app.fetch(req, mockEnv);
      expect(res.status).toBe(200);
    });

    it('should deny access with invalid token', async () => {
      const req = new Request('http://localhost/protected', {
        headers: {
          'Cookie': 'shop_auth=invalid-token'
        }
      });
      
      const res = await app.fetch(req, mockEnv);
      expect(res.status).toBe(401);
    });
  });

  describe('Admin routes', () => {
    it('should deny access without authentication', async () => {
      const req = new Request('http://localhost/admin');
      const res = await app.fetch(req, mockEnv);
      
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should deny access for non-admin users', async () => {
      const user = { id: 1, email: 'user@example.com', is_admin: 0 };
      const token = await issueToken(user, mockEnv.JWT_SECRET);
      
      const req = new Request('http://localhost/admin', {
        headers: {
          'Cookie': `shop_auth=${token}`
        }
      });
      
      const res = await app.fetch(req, mockEnv);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe('Forbidden');
    });

    it('should allow access for admin users', async () => {
      const admin = { id: 1, email: 'admin@example.com', is_admin: 1 };
      const token = await issueToken(admin, mockEnv.JWT_SECRET);
      
      const req = new Request('http://localhost/admin', {
        headers: {
          'Cookie': `shop_auth=${token}`
        }
      });
      
      const res = await app.fetch(req, mockEnv);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.message).toBe('admin');
    });
  });

  // Property-based test: Non-admin users should never access admin routes
  it('property: non-admin users should always be denied admin access', () => {
    fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }),
        fc.emailAddress(),
        async (id, email) => {
          const user = { id, email, is_admin: 0 };
          const token = await issueToken(user, mockEnv.JWT_SECRET);
          
          const req = new Request('http://localhost/admin', {
            headers: {
              'Cookie': `shop_auth=${token}`
            }
          });
          
          const res = await app.fetch(req, mockEnv);
          return res.status === 403;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property-based test: Admin users should always access admin routes
  it('property: admin users should always access admin routes', () => {
    fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }),
        fc.emailAddress(),
        async (id, email) => {
          const admin = { id, email, is_admin: 1 };
          const token = await issueToken(admin, mockEnv.JWT_SECRET);
          
          const req = new Request('http://localhost/admin', {
            headers: {
              'Cookie': `shop_auth=${token}`
            }
          });
          
          const res = await app.fetch(req, mockEnv);
          return res.status === 200;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property-based test: Authenticated users should access protected routes
  it('property: any authenticated user should access protected routes', () => {
    fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }),
        fc.emailAddress(),
        fc.constantFrom(0, 1),
        async (id, email, is_admin) => {
          const user = { id, email, is_admin };
          const token = await issueToken(user, mockEnv.JWT_SECRET);
          
          const req = new Request('http://localhost/protected', {
            headers: {
              'Cookie': `shop_auth=${token}`
            }
          });
          
          const res = await app.fetch(req, mockEnv);
          return res.status === 200;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property-based test: Unauthenticated requests should be denied
  it('property: requests without valid token should be denied', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom('/protected', '/admin'),
        fc.oneof(
          fc.constant(undefined),
          fc.constant(''),
          fc.constant('invalid-token'),
          fc.string({ minLength: 10, maxLength: 50 })
        ),
        async (path, token) => {
          const headers: Record<string, string> = {};
          if (token) {
            headers['Cookie'] = `shop_auth=${token}`;
          }
          
          const req = new Request(`http://localhost${path}`, { headers });
          const res = await app.fetch(req, mockEnv);
          
          return res.status === 401;
        }
      ),
      { numRuns: 100 }
    );
  });

  describe('Cookie management', () => {
    it('should set auth cookie with correct attributes', async () => {
      const testApp = new Hono<{ Bindings: Env }>();
      testApp.post('/login', async (c) => {
        const token = await issueToken(
          { id: 1, email: 'test@example.com', is_admin: 0 },
          c.env.JWT_SECRET
        );
        setAuthCookie(c, token);
        return c.json({ success: true });
      });

      const req = new Request('http://localhost/login', { method: 'POST' });
      const res = await testApp.fetch(req, mockEnv);
      
      const setCookieHeader = res.headers.get('Set-Cookie');
      expect(setCookieHeader).toBeTruthy();
      expect(setCookieHeader).toContain('shop_auth=');
      expect(setCookieHeader).toContain('HttpOnly');
      expect(setCookieHeader).toContain('Secure');
      expect(setCookieHeader).toContain('SameSite=Lax');
    });
  });
});
