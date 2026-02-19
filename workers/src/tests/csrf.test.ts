/**
 * CSRF Protection Unit Tests
 * 
 * Tests the CSRF token generation, verification, and middleware functionality.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { 
  generateCSRFToken, 
  verifyCSRFToken, 
  csrfProtection,
  attachCSRFToken 
} from '../middleware/csrf';

const TEST_SECRET = 'test-secret-key-12345';
const TEST_SESSION_ID = 'user-session-123';

describe('CSRF Protection', () => {
  describe('Token Generation and Verification', () => {
    it('should generate a valid CSRF token', async () => {
      const token = await generateCSRFToken(TEST_SECRET, TEST_SESSION_ID);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split(':').length).toBe(4);
    });

    it('should verify a valid token', async () => {
      const token = await generateCSRFToken(TEST_SECRET, TEST_SESSION_ID);
      const isValid = await verifyCSRFToken(token, TEST_SECRET, TEST_SESSION_ID);
      
      expect(isValid).toBe(true);
    });

    it('should reject token with wrong secret', async () => {
      const token = await generateCSRFToken(TEST_SECRET, TEST_SESSION_ID);
      const isValid = await verifyCSRFToken(token, 'wrong-secret', TEST_SESSION_ID);
      
      expect(isValid).toBe(false);
    });

    it('should reject token with wrong session ID', async () => {
      const token = await generateCSRFToken(TEST_SECRET, TEST_SESSION_ID);
      const isValid = await verifyCSRFToken(token, TEST_SECRET, 'wrong-session');
      
      expect(isValid).toBe(false);
    });

    it('should reject malformed token', async () => {
      const isValid = await verifyCSRFToken('invalid-token', TEST_SECRET, TEST_SESSION_ID);
      
      expect(isValid).toBe(false);
    });

    it('should reject expired token', async () => {
      const token = await generateCSRFToken(TEST_SECRET, TEST_SESSION_ID);
      
      // Wait 10ms to ensure some time has passed
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Verify with maxAge of 1ms (should be expired)
      const isValid = await verifyCSRFToken(token, TEST_SECRET, TEST_SESSION_ID, 1);
      
      expect(isValid).toBe(false);
    });

    it('should generate unique tokens', async () => {
      const token1 = await generateCSRFToken(TEST_SECRET, TEST_SESSION_ID);
      const token2 = await generateCSRFToken(TEST_SECRET, TEST_SESSION_ID);
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('CSRF Middleware', () => {
    let app: Hono;

    beforeEach(() => {
      app = new Hono();
    });

    it('should allow GET requests without CSRF token', async () => {
      app.use('*', csrfProtection({ secret: TEST_SECRET }));
      app.get('/test', (c) => c.json({ success: true }));

      const res = await app.request('/test');
      
      expect(res.status).toBe(200);
    });

    it('should allow HEAD requests without CSRF token', async () => {
      app.use('*', csrfProtection({ secret: TEST_SECRET }));
      app.get('/test', (c) => c.text(''));

      const res = await app.request('/test', { method: 'HEAD' });
      
      expect(res.status).toBe(200);
    });

    it('should allow OPTIONS requests without CSRF token', async () => {
      app.use('*', csrfProtection({ secret: TEST_SECRET }));
      app.on('OPTIONS', '/test', (c) => c.text(''));

      const res = await app.request('/test', { method: 'OPTIONS' });
      
      expect(res.status).toBe(200);
    });

    it('should reject POST request without CSRF token', async () => {
      // Mock user context first
      app.use('*', async (c, next) => {
        (c as any).set('user', { id: TEST_SESSION_ID });
        await next();
      });
      app.use('*', csrfProtection({ secret: TEST_SECRET }));
      app.post('/test', (c) => c.json({ success: true }));

      const res = await app.request('/test', { method: 'POST' });
      
      expect(res.status).toBe(403);
      const body = await res.json() as { error: string };
      expect(body.error).toBe('Forbidden');
    });

    it('should reject POST request without session', async () => {
      app.use('*', csrfProtection({ secret: TEST_SECRET }));
      app.post('/test', (c) => c.json({ success: true }));

      const res = await app.request('/test', { method: 'POST' });
      
      expect(res.status).toBe(401);
      const body = await res.json() as { error: string };
      expect(body.error).toBe('Unauthorized');
    });

    it('should accept POST request with valid CSRF token in header', async () => {
      const token = await generateCSRFToken(TEST_SECRET, TEST_SESSION_ID);

      app.use('*', async (c, next) => {
        (c as any).set('user', { id: TEST_SESSION_ID });
        await next();
      });
      app.use('*', csrfProtection({ secret: TEST_SECRET }));
      app.post('/test', (c) => c.json({ success: true }));

      const res = await app.request('/test', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': token,
        },
      });
      
      expect(res.status).toBe(200);
    });

    it('should reject POST request with invalid CSRF token', async () => {
      app.use('*', async (c, next) => {
        (c as any).set('user', { id: TEST_SESSION_ID });
        await next();
      });
      app.use('*', csrfProtection({ secret: TEST_SECRET }));
      app.post('/test', (c) => c.json({ success: true }));

      const res = await app.request('/test', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': 'invalid-token',
        },
      });
      
      expect(res.status).toBe(403);
    });

    it('should protect PUT requests', async () => {
      app.use('*', async (c, next) => {
        (c as any).set('user', { id: TEST_SESSION_ID });
        await next();
      });
      app.use('*', csrfProtection({ secret: TEST_SECRET }));
      app.put('/test', (c) => c.json({ success: true }));

      const res = await app.request('/test', { method: 'PUT' });
      
      expect(res.status).toBe(403);
    });

    it('should protect DELETE requests', async () => {
      app.use('*', async (c, next) => {
        (c as any).set('user', { id: TEST_SESSION_ID });
        await next();
      });
      app.use('*', csrfProtection({ secret: TEST_SECRET }));
      app.delete('/test', (c) => c.json({ success: true }));

      const res = await app.request('/test', { method: 'DELETE' });
      
      expect(res.status).toBe(403);
    });

    it('should protect PATCH requests', async () => {
      app.use('*', async (c, next) => {
        (c as any).set('user', { id: TEST_SESSION_ID });
        await next();
      });
      app.use('*', csrfProtection({ secret: TEST_SECRET }));
      app.patch('/test', (c) => c.json({ success: true }));

      const res = await app.request('/test', { method: 'PATCH' });
      
      expect(res.status).toBe(403);
    });
  });

  describe('Attach CSRF Token Middleware', () => {
    let app: Hono;

    beforeEach(() => {
      app = new Hono();
    });

    it('should attach CSRF token to response header', async () => {
      app.use('*', async (c, next) => {
        (c as any).set('user', { id: TEST_SESSION_ID });
        await next();
      });
      app.use('*', attachCSRFToken({ secret: TEST_SECRET }));
      app.get('/test', (c) => c.json({ success: true }));

      const res = await app.request('/test');
      
      expect(res.status).toBe(200);
      expect(res.headers.get('X-CSRF-Token')).toBeDefined();
    });

    it('should not attach token if no session', async () => {
      app.use('*', attachCSRFToken({ secret: TEST_SECRET }));
      app.get('/test', (c) => c.json({ success: true }));

      const res = await app.request('/test');
      
      expect(res.status).toBe(200);
      expect(res.headers.get('X-CSRF-Token')).toBeNull();
    });

    it('should set CSRF token as cookie when configured', async () => {
      app.use('*', async (c, next) => {
        (c as any).set('user', { id: TEST_SESSION_ID });
        await next();
      });
      app.use('*', attachCSRFToken({ 
        secret: TEST_SECRET,
        cookieName: 'csrf_token'
      }));
      app.get('/test', (c) => c.json({ success: true }));

      const res = await app.request('/test');
      
      expect(res.status).toBe(200);
      const setCookie = res.headers.get('Set-Cookie');
      expect(setCookie).toBeDefined();
      expect(setCookie).toContain('csrf_token=');
      expect(setCookie).toContain('HttpOnly');
      expect(setCookie).toContain('SameSite=Strict');
    });
  });
});
