/**
 * CORS Policy Enforcement Test
 * Property 16: CORS Policy Enforcement
 * Validates: Requirements 13.1
 * 
 * Tests that CORS policies are correctly enforced
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { Hono } from 'hono';
import { createCorsMiddleware, corsCheck } from '../middleware/cors';
import type { Env } from '../types/env';

describe('Feature: cloudflare-migration, Property 16: CORS Policy Enforcement', () => {
  let app: Hono<{ Bindings: Env }>;
  let mockEnv: Env;

  beforeEach(() => {
    mockEnv = {
      DB: {} as D1Database,
      R2_BUCKET: {} as R2Bucket,
      JWT_SECRET: 'test-secret',
      ALLOWED_ORIGINS: 'https://example.com,https://www.example.com'
    };

    app = new Hono<{ Bindings: Env }>();
    app.use('*', createCorsMiddleware(mockEnv));
    app.use('*', async (c, next) => {
      c.env = mockEnv;
      return next();
    });
    app.use('*', corsCheck);
    app.get('/test', (c) => c.json({ ok: true }));
    app.post('/test', (c) => c.json({ ok: true }));
  });

  it('should allow requests from allowed origins', async () => {
    const req = new Request('http://localhost/test', {
      headers: {
        'Origin': 'https://example.com'
      }
    });

    const res = await app.fetch(req, mockEnv);
    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com');
  });

  it('should allow localhost origins', async () => {
    const req = new Request('http://localhost/test', {
      headers: {
        'Origin': 'http://localhost:3000'
      }
    });

    const res = await app.fetch(req, mockEnv);
    expect(res.status).toBe(200);
  });

  it('should reject requests from disallowed origins for POST', async () => {
    const req = new Request('http://localhost/test', {
      method: 'POST',
      headers: {
        'Origin': 'https://evil.com',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const res = await app.fetch(req, mockEnv);
    expect(res.status).toBe(403);
  });

  it('should allow GET requests from any origin', async () => {
    const req = new Request('http://localhost/test', {
      headers: {
        'Origin': 'https://any-origin.com'
      }
    });

    const res = await app.fetch(req, mockEnv);
    // GET requests are allowed, CORS headers might not match but request succeeds
    expect(res.status).toBe(200);
  });

  it('should handle requests without origin header', async () => {
    const req = new Request('http://localhost/test');
    const res = await app.fetch(req, mockEnv);
    expect(res.status).toBe(200);
  });

  it('should set credentials header', async () => {
    const req = new Request('http://localhost/test', {
      headers: {
        'Origin': 'https://example.com'
      }
    });

    const res = await app.fetch(req, mockEnv);
    expect(res.headers.get('Access-Control-Allow-Credentials')).toBe('true');
  });

  it('should handle OPTIONS preflight requests', async () => {
    const req = new Request('http://localhost/test', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://example.com',
        'Access-Control-Request-Method': 'POST'
      }
    });

    const res = await app.fetch(req, mockEnv);
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  // Property-based test: Allowed origins should always be accepted
  it('property: requests from allowed origins should always succeed', () => {
    const allowedOrigins = ['https://example.com', 'https://www.example.com'];
    
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allowedOrigins),
        fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'),
        async (origin, method) => {
          const req = new Request('http://localhost/test', {
            method,
            headers: {
              'Origin': origin,
              'Content-Type': 'application/json'
            },
            body: method !== 'GET' ? JSON.stringify({}) : undefined
          });

          const res = await app.fetch(req, mockEnv);
          return res.status === 200;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property-based test: Localhost should always be allowed
  it('property: localhost origins should always be allowed', () => {
    fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 3000, max: 9999 }),
        fc.constantFrom('http', 'https'),
        async (port, protocol) => {
          const origin = `${protocol}://localhost:${port}`;
          const req = new Request('http://localhost/test', {
            headers: {
              'Origin': origin
            }
          });

          const res = await app.fetch(req, mockEnv);
          return res.status === 200;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property-based test: Disallowed origins should be rejected for mutating requests
  it('property: disallowed origins should be rejected for POST/PUT/DELETE', () => {
    fc.assert(
      fc.asyncProperty(
        fc.webUrl({ validSchemes: ['https'] }),
        fc.constantFrom('POST', 'PUT', 'DELETE', 'PATCH'),
        async (origin, method) => {
          // Skip if origin is in allowed list or localhost
          if (
            origin.includes('example.com') ||
            origin.includes('localhost')
          ) {
            return true;
          }

          const req = new Request('http://localhost/test', {
            method,
            headers: {
              'Origin': origin,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
          });

          const res = await app.fetch(req, mockEnv);
          return res.status === 403;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should allow multiple allowed origins', () => {
    const multiOriginEnv = {
      ...mockEnv,
      ALLOWED_ORIGINS: 'https://site1.com,https://site2.com,https://site3.com'
    };

    const testApp = new Hono<{ Bindings: Env }>();
    testApp.use('*', createCorsMiddleware(multiOriginEnv));
    testApp.get('/test', (c) => c.json({ ok: true }));

    const origins = ['https://site1.com', 'https://site2.com', 'https://site3.com'];

    return Promise.all(
      origins.map(async (origin) => {
        const req = new Request('http://localhost/test', {
          headers: { 'Origin': origin }
        });
        const res = await testApp.fetch(req, multiOriginEnv);
        expect(res.status).toBe(200);
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe(origin);
      })
    );
  });

  it('should handle empty ALLOWED_ORIGINS', async () => {
    const emptyOriginEnv = {
      ...mockEnv,
      ALLOWED_ORIGINS: ''
    };

    const testApp = new Hono<{ Bindings: Env }>();
    testApp.use('*', createCorsMiddleware(emptyOriginEnv));
    testApp.get('/test', (c) => c.json({ ok: true }));

    const req = new Request('http://localhost/test', {
      headers: { 'Origin': 'https://any-site.com' }
    });

    const res = await testApp.fetch(req, emptyOriginEnv);
    expect(res.status).toBe(200);
  });
});
