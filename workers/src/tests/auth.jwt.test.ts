/**
 * JWT Authentication Flow Test
 * Property 4: JWT Authentication Flow
 * Validates: Requirements 2.3, 5.1, 5.3, 5.5
 * 
 * Tests that JWT tokens are correctly issued and verified
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { issueToken, verifyToken, getUserFromPayload } from '../services/auth.service';

describe('Feature: cloudflare-migration, Property 4: JWT Authentication Flow', () => {
  const testSecret = 'test-secret-key-for-jwt-signing';

  it('should issue and verify a JWT token', async () => {
    const user = {
      id: 1,
      email: 'test@example.com',
      is_admin: 0
    };

    const token = await issueToken(user, testSecret);
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');

    const payload = await verifyToken(token, testSecret);
    expect(payload).toBeTruthy();
    expect(payload!.sub).toBe('1');
    expect(payload!.email).toBe('test@example.com');
    expect(payload!.is_admin).toBe(0);
  });

  it('should reject tokens with wrong secret', async () => {
    const user = {
      id: 1,
      email: 'test@example.com',
      is_admin: 0
    };

    const token = await issueToken(user, testSecret);
    const payload = await verifyToken(token, 'wrong-secret');
    
    expect(payload).toBeNull();
  });

  it('should handle admin users', async () => {
    const adminUser = {
      id: 1,
      email: 'admin@example.com',
      is_admin: 1
    };

    const token = await issueToken(adminUser, testSecret);
    const payload = await verifyToken(token, testSecret);
    
    expect(payload!.is_admin).toBe(1);
  });

  it('should extract user from payload', async () => {
    const user = {
      id: 42,
      email: 'user@example.com',
      is_admin: 0
    };

    const token = await issueToken(user, testSecret);
    const payload = await verifyToken(token, testSecret);
    const extractedUser = getUserFromPayload(payload!);
    
    expect(extractedUser.id).toBe(42);
    expect(extractedUser.email).toBe('user@example.com');
    expect(extractedUser.is_admin).toBe(0);
  });

  it('should include expiration time', async () => {
    const user = {
      id: 1,
      email: 'test@example.com',
      is_admin: 0
    };

    const token = await issueToken(user, testSecret);
    const payload = await verifyToken(token, testSecret);
    
    expect(payload!.exp).toBeTruthy();
    expect(payload!.exp).toBeGreaterThan(Date.now() / 1000);
  });

  it('should handle special characters in email', async () => {
    const user = {
      id: 1,
      email: 'test+tag@example.com',
      is_admin: 0
    };

    const token = await issueToken(user, testSecret);
    const payload = await verifyToken(token, testSecret);
    
    expect(payload!.email).toBe('test+tag@example.com');
  });

  // Property-based test: Token round-trip
  it('property: any valid user should be able to issue and verify token', () => {
    fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }),
        fc.emailAddress(),
        fc.constantFrom(0, 1),
        async (id, email, is_admin) => {
          const user = { id, email, is_admin };
          const token = await issueToken(user, testSecret);
          const payload = await verifyToken(token, testSecret);
          
          if (!payload) return false;
          
          return (
            payload.sub === String(id) &&
            payload.email === email &&
            payload.is_admin === is_admin
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property-based test: Token should be a string
  it('property: issued token should always be a non-empty string', () => {
    fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }),
        fc.emailAddress(),
        fc.constantFrom(0, 1),
        async (id, email, is_admin) => {
          const user = { id, email, is_admin };
          const token = await issueToken(user, testSecret);
          
          return typeof token === 'string' && token.length > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property-based test: Token should have JWT structure
  it('property: token should have three parts separated by dots', () => {
    fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }),
        fc.emailAddress(),
        fc.constantFrom(0, 1),
        async (id, email, is_admin) => {
          const user = { id, email, is_admin };
          const token = await issueToken(user, testSecret);
          
          const parts = token.split('.');
          return parts.length === 3;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property-based test: Different users should get different tokens
  it('property: different users should get different tokens', () => {
    fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }),
        fc.integer({ min: 1, max: 1000000 }),
        fc.emailAddress(),
        fc.emailAddress(),
        async (id1, id2, email1, email2) => {
          // Skip if users are the same
          if (id1 === id2 && email1 === email2) return true;
          
          const user1 = { id: id1, email: email1, is_admin: 0 };
          const user2 = { id: id2, email: email2, is_admin: 0 };
          
          const token1 = await issueToken(user1, testSecret);
          const token2 = await issueToken(user2, testSecret);
          
          return token1 !== token2;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property-based test: getUserFromPayload should be inverse of issueToken
  it('property: getUserFromPayload should extract original user data', () => {
    fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }),
        fc.emailAddress(),
        fc.constantFrom(0, 1),
        async (id, email, is_admin) => {
          const user = { id, email, is_admin };
          const token = await issueToken(user, testSecret);
          const payload = await verifyToken(token, testSecret);
          
          if (!payload) return false;
          
          const extractedUser = getUserFromPayload(payload);
          
          return (
            extractedUser.id === id &&
            extractedUser.email === email &&
            extractedUser.is_admin === is_admin
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property-based test: Token verification should be idempotent
  it('property: verifying the same token multiple times should give same result', () => {
    fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000000 }),
        fc.emailAddress(),
        fc.constantFrom(0, 1),
        fc.integer({ min: 2, max: 5 }),
        async (id, email, is_admin, attempts) => {
          const user = { id, email, is_admin };
          const token = await issueToken(user, testSecret);
          
          const results = [];
          for (let i = 0; i < attempts; i++) {
            const payload = await verifyToken(token, testSecret);
            results.push(payload);
          }
          
          // All results should be equal
          return results.every(result => 
            result?.sub === String(id) &&
            result?.email === email &&
            result?.is_admin === is_admin
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  // Security test: Invalid tokens should be rejected
  it('should reject malformed tokens', async () => {
    const invalidTokens = [
      '',
      'invalid',
      'invalid.token',
      'invalid.token.format',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature'
    ];

    for (const token of invalidTokens) {
      const payload = await verifyToken(token, testSecret);
      expect(payload).toBeNull();
    }
  });

  // Security test: Tampered tokens should be rejected
  it('should reject tampered tokens', async () => {
    const user = {
      id: 1,
      email: 'test@example.com',
      is_admin: 0
    };

    const token = await issueToken(user, testSecret);
    const parts = token.split('.');
    
    // Tamper with payload
    const tamperedToken = parts[0] + '.eyJzdWIiOiIyIn0.' + parts[2];
    const payload = await verifyToken(tamperedToken, testSecret);
    
    expect(payload).toBeNull();
  });
});
