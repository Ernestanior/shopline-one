/**
 * Property-Based Tests for Payment Configuration Validation
 * Feature: taiwan-payment-gateway
 * Validates: Requirements 1.2, 1.3, 1.5
 */

import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validatePaymentConfig,
  validateNewebPayConfig,
  validateECPayConfig,
  sanitizeConfigForLogging,
  ConfigValidationError,
} from '../services/payment/config-validator';
import { PaymentConfig, NewebPayConfig, ECPayConfig } from '../types/payment';

// Fast-check configuration
const fcConfig = {
  numRuns: 100,
  verbose: true,
};

// Custom arbitraries
const arbitraries = {
  merchantId: () => fc.stringMatching(/^[a-zA-Z0-9_-]{5,20}$/),
  hashKey16: () => fc.stringOf(fc.char(), { minLength: 16, maxLength: 16 }),
  hashKey32: () => fc.stringOf(fc.char(), { minLength: 32, maxLength: 32 }),
  hashIV16: () => fc.stringOf(fc.char(), { minLength: 16, maxLength: 16 }),
  hashIV32: () => fc.stringOf(fc.char(), { minLength: 32, maxLength: 32 }),
  apiUrl: () => fc.constantFrom(
    'https://test.newebpay.com/MPG/mpg_gateway',
    'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5',
    'https://api.example.com/payment'
  ),
  version: () => fc.constantFrom('1.0', '2.0', '2.1'),
  
  validNewebPayConfig: (): fc.Arbitrary<NewebPayConfig> => fc.record({
    merchantId: arbitraries.merchantId(),
    hashKey: arbitraries.hashKey16(),
    hashIV: arbitraries.hashIV16(),
    apiUrl: arbitraries.apiUrl(),
    version: arbitraries.version(),
  }),
  
  validECPayConfig: (): fc.Arbitrary<ECPayConfig> => fc.record({
    merchantId: arbitraries.merchantId(),
    hashKey: fc.string({ minLength: 8, maxLength: 32 }),
    hashIV: fc.string({ minLength: 8, maxLength: 32 }),
    apiUrl: arbitraries.apiUrl(),
  }),
};

describe('Payment Configuration Validation - Property Tests', () => {
  /**
   * Property 1: Gateway Configuration Validation
   * Validates: Requirements 1.2, 1.3
   */
  describe('Property 1: Gateway Configuration Validation', () => {
    test('Feature: taiwan-payment-gateway, Property 1: Valid NewebPay config passes validation', () => {
      fc.assert(
        fc.property(
          arbitraries.validNewebPayConfig(),
          (config) => {
            // Act & Assert: Should not throw
            expect(() => validateNewebPayConfig(config)).not.toThrow();
          }
        ),
        fcConfig
      );
    });

    test('Feature: taiwan-payment-gateway, Property 1: Valid ECPay config passes validation', () => {
      fc.assert(
        fc.property(
          arbitraries.validECPayConfig(),
          (config) => {
            // Act & Assert: Should not throw
            expect(() => validateECPayConfig(config)).not.toThrow();
          }
        ),
        fcConfig
      );
    });

    test('Feature: taiwan-payment-gateway, Property 1: Missing merchantId fails validation', () => {
      fc.assert(
        fc.property(
          arbitraries.validNewebPayConfig(),
          (config) => {
            // Arrange: Remove merchantId
            const invalidConfig = { ...config, merchantId: '' };
            
            // Act & Assert: Should throw
            expect(() => validateNewebPayConfig(invalidConfig)).toThrow(ConfigValidationError);
            expect(() => validateNewebPayConfig(invalidConfig)).toThrow(/merchantId/i);
          }
        ),
        fcConfig
      );
    });

    test('Feature: taiwan-payment-gateway, Property 1: Missing hashKey fails validation', () => {
      fc.assert(
        fc.property(
          arbitraries.validNewebPayConfig(),
          (config) => {
            // Arrange: Remove hashKey
            const invalidConfig = { ...config, hashKey: '' };
            
            // Act & Assert: Should throw
            expect(() => validateNewebPayConfig(invalidConfig)).toThrow(ConfigValidationError);
            expect(() => validateNewebPayConfig(invalidConfig)).toThrow(/hashKey/i);
          }
        ),
        fcConfig
      );
    });

    test('Feature: taiwan-payment-gateway, Property 1: Missing hashIV fails validation', () => {
      fc.assert(
        fc.property(
          arbitraries.validNewebPayConfig(),
          (config) => {
            // Arrange: Remove hashIV
            const invalidConfig = { ...config, hashIV: '' };
            
            // Act & Assert: Should throw
            expect(() => validateNewebPayConfig(invalidConfig)).toThrow(ConfigValidationError);
            expect(() => validateNewebPayConfig(invalidConfig)).toThrow(/hashIV/i);
          }
        ),
        fcConfig
      );
    });

    test('Feature: taiwan-payment-gateway, Property 1: Invalid hashKey length fails validation', () => {
      fc.assert(
        fc.property(
          arbitraries.validNewebPayConfig(),
          fc.string({ minLength: 1, maxLength: 15 }), // Invalid length
          (config, invalidHashKey) => {
            // Arrange: Use invalid hashKey length
            const invalidConfig = { ...config, hashKey: invalidHashKey };
            
            // Act & Assert: Should throw
            expect(() => validateNewebPayConfig(invalidConfig)).toThrow(ConfigValidationError);
            expect(() => validateNewebPayConfig(invalidConfig)).toThrow(/hashKey.*16.*32/i);
          }
        ),
        fcConfig
      );
    });

    test('Feature: taiwan-payment-gateway, Property 1: Invalid apiUrl fails validation', () => {
      fc.assert(
        fc.property(
          arbitraries.validNewebPayConfig(),
          fc.constantFrom('not-a-url', 'ftp://invalid.com', ''),
          (config, invalidUrl) => {
            // Arrange: Use invalid URL
            const invalidConfig = { ...config, apiUrl: invalidUrl };
            
            // Act & Assert: Should throw
            expect(() => validateNewebPayConfig(invalidConfig)).toThrow(ConfigValidationError);
            expect(() => validateNewebPayConfig(invalidConfig)).toThrow(/apiUrl/i);
          }
        ),
        fcConfig
      );
    });

    test('Feature: taiwan-payment-gateway, Property 1: Complete payment config with at least one gateway passes', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.record({ newebpay: arbitraries.validNewebPayConfig() }),
            fc.record({ ecpay: arbitraries.validECPayConfig() }),
            fc.record({
              newebpay: arbitraries.validNewebPayConfig(),
              ecpay: arbitraries.validECPayConfig(),
            })
          ),
          (config) => {
            // Act & Assert: Should not throw
            expect(() => validatePaymentConfig(config as PaymentConfig)).not.toThrow();
          }
        ),
        fcConfig
      );
    });

    test('Feature: taiwan-payment-gateway, Property 1: Empty payment config fails validation', () => {
      // Arrange: Empty config
      const emptyConfig = {} as PaymentConfig;
      
      // Act & Assert: Should throw
      expect(() => validatePaymentConfig(emptyConfig)).toThrow(ConfigValidationError);
      expect(() => validatePaymentConfig(emptyConfig)).toThrow(/at least one/i);
    });
  });

  /**
   * Property 2: Invalid Credentials Prevention
   * Validates: Requirements 1.5
   */
  describe('Property 2: Invalid Credentials Prevention', () => {
    test('Feature: taiwan-payment-gateway, Property 2: Sensitive data is masked in logs', () => {
      fc.assert(
        fc.property(
          fc.record({
            newebpay: arbitraries.validNewebPayConfig(),
            ecpay: arbitraries.validECPayConfig(),
          }),
          (config) => {
            // Act: Sanitize config
            const sanitized = sanitizeConfigForLogging(config as PaymentConfig);
            
            // Assert: Original sensitive data should not appear in sanitized version
            if (config.newebpay) {
              expect(sanitized.newebpay.hashKey).not.toBe(config.newebpay.hashKey);
              expect(sanitized.newebpay.hashIV).not.toBe(config.newebpay.hashIV);
              expect(sanitized.newebpay.hashKey).toContain('*');
              expect(sanitized.newebpay.hashIV).toContain('*');
              
              // Non-sensitive data should remain
              expect(sanitized.newebpay.merchantId).toBe(config.newebpay.merchantId);
              expect(sanitized.newebpay.apiUrl).toBe(config.newebpay.apiUrl);
            }
            
            if (config.ecpay) {
              expect(sanitized.ecpay.hashKey).not.toBe(config.ecpay.hashKey);
              expect(sanitized.ecpay.hashIV).not.toBe(config.ecpay.hashIV);
              expect(sanitized.ecpay.hashKey).toContain('*');
              expect(sanitized.ecpay.hashIV).toContain('*');
              
              // Non-sensitive data should remain
              expect(sanitized.ecpay.merchantId).toBe(config.ecpay.merchantId);
              expect(sanitized.ecpay.apiUrl).toBe(config.ecpay.apiUrl);
            }
          }
        ),
        fcConfig
      );
    });

    test('Feature: taiwan-payment-gateway, Property 2: Masked data preserves first and last 4 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 16, maxLength: 32 }),
          (sensitiveData) => {
            // Act: Sanitize a config with this sensitive data
            const config: PaymentConfig = {
              newebpay: {
                merchantId: 'TEST123',
                hashKey: sensitiveData,
                hashIV: sensitiveData,
                apiUrl: 'https://test.example.com',
                version: '2.0',
              },
            };
            
            const sanitized = sanitizeConfigForLogging(config);
            
            // Assert: First 4 and last 4 characters should be preserved
            if (sensitiveData.length > 8) {
              expect(sanitized.newebpay.hashKey.substring(0, 4)).toBe(sensitiveData.substring(0, 4));
              expect(sanitized.newebpay.hashKey.substring(sanitized.newebpay.hashKey.length - 4)).toBe(
                sensitiveData.substring(sensitiveData.length - 4)
              );
            }
          }
        ),
        fcConfig
      );
    });

    test('Feature: taiwan-payment-gateway, Property 2: Invalid merchantId format fails validation', () => {
      fc.assert(
        fc.property(
          arbitraries.validNewebPayConfig(),
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => !/^[a-zA-Z0-9_-]+$/.test(s)),
          (config, invalidMerchantId) => {
            // Arrange: Use invalid merchantId with special characters
            const invalidConfig = { ...config, merchantId: invalidMerchantId };
            
            // Act & Assert: Should throw
            expect(() => validateNewebPayConfig(invalidConfig)).toThrow(ConfigValidationError);
            expect(() => validateNewebPayConfig(invalidConfig)).toThrow(/merchantId.*alphanumeric/i);
          }
        ),
        { ...fcConfig, numRuns: 50 } // Reduced runs due to filter
      );
    });
  });
});
