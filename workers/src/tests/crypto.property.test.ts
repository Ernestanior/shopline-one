/**
 * Property-Based Tests for Cryptographic Functions
 * Feature: taiwan-payment-gateway
 * Validates: Requirements 3.3, 3.4
 */

import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import { sha256, aesEncrypt, aesDecrypt } from '../utils/crypto';

// Fast-check configuration
const fcConfig = {
  numRuns: 100, // Minimum 100 iterations as per spec
  verbose: true,
};

describe('Property 7: Signature Calculation Correctness', () => {
  test('Feature: taiwan-payment-gateway, Property 7: SHA256 hash should be deterministic', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 1000 }),
        async (input) => {
          // Act: Calculate hash twice
          const hash1 = await sha256(input);
          const hash2 = await sha256(input);
          
          // Assert: Same input should produce same hash (deterministic)
          expect(hash1).toBe(hash2);
          expect(hash1).toHaveLength(64); // SHA256 produces 64 hex characters
          expect(hash1).toMatch(/^[0-9a-f]{64}$/); // Only hex characters
        }
      ),
      fcConfig
    );
  });

  test('Feature: taiwan-payment-gateway, Property 7: Different inputs should produce different hashes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (input1, input2) => {
          // Pre-condition: inputs must be different
          fc.pre(input1 !== input2);
          
          // Act
          const hash1 = await sha256(input1);
          const hash2 = await sha256(input2);
          
          // Assert: Different inputs should produce different hashes
          expect(hash1).not.toBe(hash2);
        }
      ),
      fcConfig
    );
  });

  test('Feature: taiwan-payment-gateway, Property 7: Hash should be consistent across multiple calls', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          key: fc.string({ minLength: 16, maxLength: 32 }),
          data: fc.string({ minLength: 1, maxLength: 500 }),
          iv: fc.string({ minLength: 16, maxLength: 16 }),
        }),
        async ({ key, data, iv }) => {
          // Simulate signature calculation like payment gateways do
          const signatureString = `HashKey=${key}&${data}&HashIV=${iv}`;
          
          // Act: Calculate hash multiple times
          const hash1 = await sha256(signatureString);
          const hash2 = await sha256(signatureString);
          const hash3 = await sha256(signatureString);
          
          // Assert: All hashes should be identical
          expect(hash1).toBe(hash2);
          expect(hash2).toBe(hash3);
        }
      ),
      fcConfig
    );
  });

  test('Feature: taiwan-payment-gateway, Property 7: Hash should handle special characters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 200 }),
        async (input) => {
          // Act
          const hash = await sha256(input);
          
          // Assert: Should produce valid hash regardless of special characters
          expect(hash).toHaveLength(64);
          expect(hash).toMatch(/^[0-9a-f]{64}$/);
        }
      ),
      fcConfig
    );
  });

  test('Feature: taiwan-payment-gateway, Property 7: Empty string should produce consistent hash', async () => {
    // Act
    const hash1 = await sha256('');
    const hash2 = await sha256('');
    
    // Assert
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
    // SHA256 of empty string is a known value
    expect(hash1).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });
});
