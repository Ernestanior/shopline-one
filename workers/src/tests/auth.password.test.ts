/**
 * Password Hash Round-Trip Test
 * Property 3: Password Hash Round-Trip
 * Validates: Requirements 2.4, 5.2
 * 
 * Tests that passwords can be hashed and verified correctly using Web Crypto API
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { hashPassword, verifyPassword } from '../services/auth.service';

describe('Feature: cloudflare-migration, Property 3: Password Hash Round-Trip', () => {
  it('should hash and verify a password correctly', async () => {
    const password = 'testPassword123!';
    const hash = await hashPassword(password);
    
    expect(hash).toBeTruthy();
    expect(hash).not.toBe(password);
    
    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it('should reject incorrect passwords', async () => {
    const password = 'correctPassword123!';
    const wrongPassword = 'wrongPassword456!';
    const hash = await hashPassword(password);
    
    const isValid = await verifyPassword(wrongPassword, hash);
    expect(isValid).toBe(false);
  });

  it('should generate different hashes for the same password', async () => {
    const password = 'samePassword123!';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);
    
    // Hashes should be different due to random salt
    expect(hash1).not.toBe(hash2);
    
    // But both should verify correctly
    expect(await verifyPassword(password, hash1)).toBe(true);
    expect(await verifyPassword(password, hash2)).toBe(true);
  });

  it('should handle empty passwords', async () => {
    const password = '';
    const hash = await hashPassword(password);
    
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword('notEmpty', hash)).toBe(false);
  });

  it('should handle very long passwords', async () => {
    const password = 'a'.repeat(1000);
    const hash = await hashPassword(password);
    
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword('a'.repeat(999), hash)).toBe(false);
  });

  it('should handle special characters', async () => {
    const password = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
    const hash = await hashPassword(password);
    
    expect(await verifyPassword(password, hash)).toBe(true);
  });

  it('should handle unicode characters', async () => {
    const password = '密码测试🔐';
    const hash = await hashPassword(password);
    
    expect(await verifyPassword(password, hash)).toBe(true);
  });

  // Property-based test: Password hash round-trip
  it('property: any password should hash and verify correctly', () => {
    fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (password) => {
          const hash = await hashPassword(password);
          const isValid = await verifyPassword(password, hash);
          return isValid === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property-based test: Different passwords should not verify
  it('property: different passwords should not verify against each other', () => {
    fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (password1, password2) => {
          // Skip if passwords are the same
          if (password1 === password2) return true;
          
          const hash = await hashPassword(password1);
          const isValid = await verifyPassword(password2, hash);
          return isValid === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property-based test: Hash should be deterministic for verification
  it('property: same password should always verify against its hash', () => {
    fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer({ min: 1, max: 5 }),
        async (password, attempts) => {
          const hash = await hashPassword(password);
          
          // Verify multiple times
          for (let i = 0; i < attempts; i++) {
            const isValid = await verifyPassword(password, hash);
            if (!isValid) return false;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property-based test: Hash should be base64 encoded
  it('property: hash should be valid base64 string', () => {
    fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        async (password) => {
          const hash = await hashPassword(password);
          
          // Try to decode base64
          try {
            atob(hash);
            return true;
          } catch {
            return false;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property-based test: Hash should have consistent length
  it('property: hash should have consistent structure (salt + hash)', () => {
    fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        async (password) => {
          const hash = await hashPassword(password);
          const decoded = Uint8Array.from(atob(hash), c => c.charCodeAt(0));
          
          // Should be 16 bytes salt + 32 bytes hash = 48 bytes total
          return decoded.length === 48;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Security test: Timing attack resistance
  it('should take similar time for correct and incorrect passwords', async () => {
    const password = 'testPassword123!';
    const hash = await hashPassword(password);
    
    const times: number[] = [];
    
    // Measure correct password verification
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      await verifyPassword(password, hash);
      const end = performance.now();
      times.push(end - start);
    }
    
    // Measure incorrect password verification
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      await verifyPassword('wrongPassword', hash);
      const end = performance.now();
      times.push(end - start);
    }
    
    // Calculate variance - should be relatively consistent
    const avg = times.reduce((a, b) => a + b) / times.length;
    const variance = times.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / times.length;
    const stdDev = Math.sqrt(variance);
    
    // Standard deviation should be reasonable (not too high)
    // This is a basic timing attack resistance check
    expect(stdDev / avg).toBeLessThan(0.5); // Less than 50% variation
  });
});
