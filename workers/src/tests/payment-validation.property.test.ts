/**
 * Property-Based Tests for Payment Input Validation
 * Feature: taiwan-payment-gateway
 * Validates: Requirements 12.4, 12.5, 15.4
 */

import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validatePaymentAmount,
  validatePaymentMethod,
  validateOrderId,
  validateEmail,
  validateDescription,
  validateUrl,
  validateGateway,
  sanitizeString,
  validatePaymentRequest,
  ValidationError,
} from '../middleware/payment-validation';
import { PaymentMethod } from '../types/payment';

// Fast-check configuration
const fcConfig = {
  numRuns: 100,
  verbose: true,
};

// Custom arbitraries
const arbitraries = {
  validAmount: () => fc.integer({ min: 1, max: 10000000 }),
  invalidAmount: () => fc.oneof(
    fc.constant(-100),
    fc.constant(0),
    fc.constant(10000001), // Too large
    fc.constant(NaN),
    fc.constant(Infinity),
    fc.constant(1.5), // Not integer
  ),
  validPaymentMethod: () => fc.constantFrom(
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.ATM,
    PaymentMethod.CONVENIENCE_STORE,
    PaymentMethod.BARCODE
  ),
  invalidPaymentMethod: () => fc.constantFrom('invalid', 'cash', 'paypal', ''),
  validOrderId: () => fc.stringMatching(/^[a-zA-Z0-9_-]{1,100}$/),
  invalidOrderId: () => fc.oneof(
    fc.constant(''),
    fc.constant('   '),
    fc.string({ minLength: 101, maxLength: 150 }), // Too long
    fc.constantFrom('order#123', 'order@456', 'order 789'), // Invalid characters
  ),
  validEmail: () => fc.emailAddress(),
  invalidEmail: () => fc.constantFrom('', 'invalid', 'test@', '@example.com', 'test @example.com'),
  validUrl: () => fc.constantFrom(
    'https://example.com',
    'http://localhost:3000',
    'https://example.com/path?query=value'
  ),
  invalidUrl: () => fc.constantFrom('', 'not-a-url', 'ftp://invalid.com', 'javascript:alert(1)'),
  validGateway: () => fc.constantFrom('newebpay', 'ecpay'),
  invalidGateway: () => fc.constantFrom('', 'invalid', 'stripe', 'paypal'),
  dangerousString: () => fc.constantFrom(
    '<script>alert("xss")</script>',
    'DROP TABLE users;',
    "'; DELETE FROM orders; --",
    '<img src=x onerror=alert(1)>',
    '\x00\x01\x02', // Control characters
  ),
};

describe('Payment Input Validation - Property Tests', () => {
  /**
   * Property 35: Amount Storage Format
   * Validates: Requirements 12.2, 12.4
   */
  describe('Property 35: Amount Storage Format', () => {
    test('Feature: taiwan-payment-gateway, Property 35: Valid amounts are positive integers', () => {
      fc.assert(
        fc.property(
          arbitraries.validAmount(),
          (amount) => {
            // Act
            const validated = validatePaymentAmount(amount);
            
            // Assert: Should be positive integer
            expect(validated).toBeGreaterThan(0);
            expect(Number.isInteger(validated)).toBe(true);
          }
        ),
        fcConfig
      );
    });

    test('Feature: taiwan-payment-gateway, Property 35: Invalid amounts are rejected', () => {
      fc.assert(
        fc.property(
          arbitraries.invalidAmount(),
          (amount) => {
            // Act & Assert: Should throw ValidationError
            expect(() => validatePaymentAmount(amount)).toThrow(ValidationError);
          }
        ),
        fcConfig
      );
    });

    test('Feature: taiwan-payment-gateway, Property 35: Amount must be in cents (integer)', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 1000, noNaN: true }),
          (decimalAmount) => {
            // Act & Assert: Decimal amounts should be rejected
            expect(() => validatePaymentAmount(decimalAmount)).toThrow(ValidationError);
            expect(() => validatePaymentAmount(decimalAmount)).toThrow(/integer/i);
          }
        ),
        fcConfig
      );
    });
  });

  /**
   * Property 37: Payment Amount Validation
   * Validates: Requirements 12.5
   */
  describe('Property 37: Payment Amount Validation', () => {
    test('Feature: taiwan-payment-gateway, Property 37: Zero and negative amounts are rejected', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -1000000, max: 0 }),
          (amount) => {
            // Act & Assert: Should throw ValidationError
            expect(() => validatePaymentAmount(amount)).toThrow(ValidationError);
            expect(() => validatePaymentAmount(amount)).toThrow(/greater than zero/i);
          }
        ),
        fcConfig
      );
    });

    test('Feature: taiwan-payment-gateway, Property 37: Excessively large amounts are rejected', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10000001, max: 100000000 }),
          (amount) => {
            // Act & Assert: Should throw ValidationError
            expect(() => validatePaymentAmount(amount)).toThrow(ValidationError);
            expect(() => validatePaymentAmount(amount)).toThrow(/cannot exceed/i);
          }
        ),
        fcConfig
      );
    });

    test('Feature: taiwan-payment-gateway, Property 37: String amounts are converted to numbers', () => {
      fc.assert(
        fc.property(
          arbitraries.validAmount(),
          (amount) => {
            // Arrange: Convert to string
            const stringAmount = amount.toString();
            
            // Act
            const validated = validatePaymentAmount(stringAmount);
            
            // Assert: Should be converted to number
            expect(validated).toBe(amount);
            expect(typeof validated).toBe('number');
          }
        ),
        fcConfig
      );
    });
  });

  /**
   * Property 48: Input Sanitization
   * Validates: Requirements 15.4
   */
  describe('Property 48: Input Sanitization', () => {
    test('Feature: taiwan-payment-gateway, Property 48: Valid payment methods are accepted', () => {
      fc.assert(
        fc.property(
          arbitraries.validPaymentMethod(),
          (method) => {
            // Act
            const validated = validatePaymentMethod(method);
            
            // Assert: Should return valid payment method
            expect(Object.values(PaymentMethod)).toContain(validated);
          }
        ),
        fcConfig
      );
    });

    test('Feature: taiwan-payment-gateway, Property 48: Invalid payment methods are rejected', () => {
      fc.assert(
        fc.property(
          arbitraries.invalidPaymentMethod(),
          (method) => {
            // Act & Assert: Should throw ValidationError
            expect(() => validatePaymentMethod(method)).toThrow(ValidationError);
          }
        ),
        fcConfig
      );
    });

    test('Feature: taiwan-payment-gateway, Property 48: Valid order IDs are accepted', () => {
      fc.assert(
        fc.property(
          arbitraries.validOrderId(),
          (orderId) => {
            // Act
            const validated = validateOrderId(orderId);
            
            // Assert: Should return sanitized order ID
            expect(validated).toBeTruthy();
            expect(validated.length).toBeGreaterThan(0);
            expect(validated.length).toBeLessThanOrEqual(100);
            expect(/^[a-zA-Z0-9_-]+$/.test(validated)).toBe(true);
          }
        ),
        fcConfig
      );
    });

    test('Feature: taiwan-payment-gateway, Property 48: Invalid order IDs are rejected', () => {
      fc.assert(
        fc.property(
          arbitraries.invalidOrderId(),
          (orderId) => {
            // Act & Assert: Should throw ValidationError
            expect(() => validateOrderId(orderId)).toThrow(ValidationError);
          }
        ),
        fcConfig
      );
    });

    test('Feature: taiwan-payment-gateway, Property 48: Valid emails are accepted', () => {
      fc.assert(
        fc.property(
          arbitraries.validEmail(),
          (email) => {
            // Act
            const validated = validateEmail(email);
            
            // Assert: Should return sanitized email
            expect(validated).toBeTruthy();
            expect(validated).toContain('@');
            expect(validated).toContain('.');
            expect(validated).toBe(validated.toLowerCase()); // Should be lowercase
          }
        ),
        fcConfig
      );
    });

    test('Feature: taiwan-payment-gateway, Property 48: Invalid emails are rejected', () => {
      fc.assert(
        fc.property(
          arbitraries.invalidEmail(),
          (email) => {
            // Act & Assert: Should throw ValidationError
            expect(() => validateEmail(email)).toThrow(ValidationError);
          }
        ),
        fcConfig
      );
    });

    test('Feature: taiwan-payment-gateway, Property 48: Valid URLs are accepted', () => {
      fc.assert(
        fc.property(
          arbitraries.validUrl(),
          (url) => {
            // Act
            const validated = validateUrl(url);
            
            // Assert: Should return valid URL
            expect(validated).toBeTruthy();
            expect(validated.startsWith('http://') || validated.startsWith('https://')).toBe(true);
          }
        ),
        fcConfig
      );
    });

    test('Feature: taiwan-payment-gateway, Property 48: Invalid URLs are rejected', () => {
      fc.assert(
        fc.property(
          arbitraries.invalidUrl(),
          (url) => {
            // Act & Assert: Should throw ValidationError
            expect(() => validateUrl(url)).toThrow(ValidationError);
          }
        ),
        fcConfig
      );
    });

    test('Feature: taiwan-payment-gateway, Property 48: Valid gateways are accepted', () => {
      fc.assert(
        fc.property(
          arbitraries.validGateway(),
          (gateway) => {
            // Act
            const validated = validateGateway(gateway);
            
            // Assert: Should return valid gateway
            expect(['newebpay', 'ecpay']).toContain(validated);
          }
        ),
        fcConfig
      );
    });

    test('Feature: taiwan-payment-gateway, Property 48: Invalid gateways are rejected', () => {
      fc.assert(
        fc.property(
          arbitraries.invalidGateway(),
          (gateway) => {
            // Act & Assert: Should throw ValidationError
            expect(() => validateGateway(gateway)).toThrow(ValidationError);
          }
        ),
        fcConfig
      );
    });

    test('Feature: taiwan-payment-gateway, Property 48: Dangerous strings are sanitized', () => {
      fc.assert(
        fc.property(
          arbitraries.dangerousString(),
          (dangerous) => {
            // Act
            const sanitized = sanitizeString(dangerous);
            
            // Assert: Should not contain dangerous patterns
            expect(sanitized).not.toContain('<script>');
            expect(sanitized).not.toContain('</script>');
            expect(sanitized).not.toContain('<img');
            expect(sanitized).not.toContain('DROP TABLE');
            expect(sanitized).not.toContain("'");
            expect(sanitized).not.toContain('"');
            expect(sanitized).not.toContain(';');
            expect(sanitized).not.toContain('\\');
          }
        ),
        fcConfig
      );
    });

    test('Feature: taiwan-payment-gateway, Property 48: Complete payment request validation', () => {
      fc.assert(
        fc.property(
          fc.record({
            orderId: arbitraries.validOrderId(),
            amount: arbitraries.validAmount(),
            gateway: arbitraries.validGateway(),
            paymentMethod: arbitraries.validPaymentMethod(),
            description: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0 && !/[<>'"\\;]/.test(s)),
            buyerEmail: arbitraries.validEmail(),
            returnUrl: arbitraries.validUrl(),
            notifyUrl: arbitraries.validUrl(),
          }),
          (input) => {
            // Act
            const validated = validatePaymentRequest(input);
            
            // Assert: All fields should be validated
            expect(validated.orderId).toBeTruthy();
            expect(validated.amount).toBeGreaterThan(0);
            expect(['newebpay', 'ecpay']).toContain(validated.gateway);
            expect(Object.values(PaymentMethod)).toContain(validated.paymentMethod);
            expect(validated.description).toBeTruthy();
            expect(validated.buyerEmail).toContain('@');
            expect(validated.returnUrl).toMatch(/^https?:\/\//);
            expect(validated.notifyUrl).toMatch(/^https?:\/\//);
          }
        ),
        fcConfig
      );
    });
  });
});
