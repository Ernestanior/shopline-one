/**
 * Logging Property Tests
 * Requirements: 14.2, 14.3, 14.5
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { Logger, LogLevel, createLogger } from '../utils/logger';

describe('Logging Functionality - Property Tests', () => {
  /**
   * Property 43: Payment Initiation Logging
   * Validates: Requirements 14.2
   * 
   * For any payment initiation, the system SHALL log:
   * - Order ID
   * - Gateway name
   * - Amount
   * - Currency
   * - Payment method
   */
  describe('Property 43: Payment Initiation Logging', () => {
    it('Feature: taiwan-payment-gateway, Property 43: Logs payment initiation with required fields', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.constantFrom('newebpay', 'ecpay'),
          fc.integer({ min: 1, max: 1000000 }),
          fc.constantFrom('TWD'),
          fc.constantFrom('credit_card', 'atm', 'cvs'),
          (orderId, gateway, amount, currency, paymentMethod) => {
            const logs: string[] = [];
            const originalLog = console.log;
            console.log = (message: string) => logs.push(message);

            try {
              const logger = createLogger(LogLevel.INFO);
              logger.info('Payment initiation started', {
                orderId,
                gateway,
                amount,
                currency,
                paymentMethod,
              });

              // Verify log was created
              expect(logs.length).toBeGreaterThan(0);

              const logEntry = JSON.parse(logs[0]);
              
              // Verify log structure
              expect(logEntry).toHaveProperty('level', 'INFO');
              expect(logEntry).toHaveProperty('message', 'Payment initiation started');
              expect(logEntry).toHaveProperty('timestamp');
              expect(logEntry).toHaveProperty('context');

              // Verify required fields are present
              expect(logEntry.context).toHaveProperty('orderId', orderId);
              expect(logEntry.context).toHaveProperty('gateway', gateway);
              expect(logEntry.context).toHaveProperty('amount', amount);
              expect(logEntry.context).toHaveProperty('currency', currency);
              expect(logEntry.context).toHaveProperty('paymentMethod', paymentMethod);
            } finally {
              console.log = originalLog;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 44: Callback Logging Details
   * Validates: Requirements 14.3
   * 
   * For any payment callback, the system SHALL log:
   * - Gateway name
   * - Order ID
   * - Transaction ID
   * - Payment status
   * - Amount
   */
  describe('Property 44: Callback Logging Details', () => {
    it('Feature: taiwan-payment-gateway, Property 44: Logs callback with required details', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('newebpay', 'ecpay'),
          fc.uuid(),
          fc.string({ minLength: 10, maxLength: 50 }),
          fc.constantFrom('success', 'failed', 'pending'),
          fc.integer({ min: 1, max: 1000000 }),
          (gateway, orderId, transactionId, status, amount) => {
            const logs: string[] = [];
            const originalLog = console.log;
            console.log = (message: string) => logs.push(message);

            try {
              const logger = createLogger(LogLevel.INFO);
              logger.info('Callback parsed successfully', {
                gateway,
                orderId,
                transactionId,
                status,
                amount,
              });

              // Verify log was created
              expect(logs.length).toBeGreaterThan(0);

              const logEntry = JSON.parse(logs[0]);
              
              // Verify log structure
              expect(logEntry).toHaveProperty('level', 'INFO');
              expect(logEntry).toHaveProperty('message', 'Callback parsed successfully');
              expect(logEntry).toHaveProperty('context');

              // Verify required fields are present
              expect(logEntry.context).toHaveProperty('gateway', gateway);
              expect(logEntry.context).toHaveProperty('orderId', orderId);
              expect(logEntry.context).toHaveProperty('transactionId', transactionId);
              expect(logEntry.context).toHaveProperty('status', status);
              expect(logEntry.context).toHaveProperty('amount', amount);
            } finally {
              console.log = originalLog;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 46: Sensitive Data Masking
   * Validates: Requirements 14.5
   * 
   * For any log entry containing sensitive data (passwords, keys, tokens, credit cards),
   * the system SHALL mask the sensitive information before logging.
   */
  describe('Property 46: Sensitive Data Masking', () => {
    it('Feature: taiwan-payment-gateway, Property 46: Masks sensitive field names', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 50 }),
          fc.string({ minLength: 10, maxLength: 50 }),
          fc.string({ minLength: 10, maxLength: 50 }),
          (password, apiKey, token) => {
            const logs: string[] = [];
            const originalLog = console.log;
            console.log = (message: string) => logs.push(message);

            try {
              const logger = createLogger(LogLevel.INFO);
              logger.info('Test sensitive data', {
                password,
                api_key: apiKey,
                token,
                normalField: 'visible',
              });

              // Verify log was created
              expect(logs.length).toBeGreaterThan(0);

              const logEntry = JSON.parse(logs[0]);
              
              // Verify sensitive fields are masked
              expect(logEntry.context.password).toBe('***MASKED***');
              expect(logEntry.context.api_key).toBe('***MASKED***');
              expect(logEntry.context.token).toBe('***MASKED***');
              
              // Verify normal fields are not masked
              expect(logEntry.context.normalField).toBe('visible');
            } finally {
              console.log = originalLog;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Feature: taiwan-payment-gateway, Property 46: Masks credit card numbers in strings', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.integer({ min: 1000, max: 9999 }),
            fc.integer({ min: 1000, max: 9999 }),
            fc.integer({ min: 1000, max: 9999 }),
            fc.integer({ min: 1000, max: 9999 })
          ),
          ([d1, d2, d3, d4]) => {
            const cardNumber = `${d1}-${d2}-${d3}-${d4}`;
            
            const logs: string[] = [];
            const originalLog = console.log;
            console.log = (message: string) => logs.push(message);

            try {
              const logger = createLogger(LogLevel.INFO);
              logger.info('Test credit card masking', {
                cardInfo: cardNumber,
              });

              // Verify log was created
              expect(logs.length).toBeGreaterThan(0);

              const logEntry = JSON.parse(logs[0]);
              
              // Verify credit card is masked
              expect(logEntry.context.cardInfo).toBe('****-****-****-****');
              expect(logEntry.context.cardInfo).not.toContain(d1.toString());
              expect(logEntry.context.cardInfo).not.toContain(d2.toString());
              expect(logEntry.context.cardInfo).not.toContain(d3.toString());
              expect(logEntry.context.cardInfo).not.toContain(d4.toString());
            } finally {
              console.log = originalLog;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Feature: taiwan-payment-gateway, Property 46: Masks nested sensitive data', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 50 }),
          fc.string({ minLength: 10, maxLength: 50 }),
          (hashKey, hashIV) => {
            const logs: string[] = [];
            const originalLog = console.log;
            console.log = (message: string) => logs.push(message);

            try {
              const logger = createLogger(LogLevel.INFO);
              logger.info('Test nested sensitive data', {
                config: {
                  merchantId: 'visible',
                  hashKey,
                  hashIV,
                },
                orderId: 'order123',
              });

              // Verify log was created
              expect(logs.length).toBeGreaterThan(0);

              const logEntry = JSON.parse(logs[0]);
              
              // Verify nested sensitive fields are masked
              expect(logEntry.context.config.hashKey).toBe('***MASKED***');
              expect(logEntry.context.config.hashIV).toBe('***MASKED***');
              
              // Verify normal fields are not masked
              expect(logEntry.context.config.merchantId).toBe('visible');
              expect(logEntry.context.orderId).toBe('order123');
            } finally {
              console.log = originalLog;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional property: Log Level Filtering
   * 
   * For any log level setting, only messages at or above that level should be logged.
   */
  describe('Additional: Log Level Filtering', () => {
    it('Feature: taiwan-payment-gateway: Filters logs based on minimum level', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 50 }),
          (message) => {
            const logs: string[] = [];
            const originalLog = console.log;
            const originalWarn = console.warn;
            const originalError = console.error;
            
            console.log = (msg: string) => logs.push(msg);
            console.warn = (msg: string) => logs.push(msg);
            console.error = (msg: string) => logs.push(msg);

            try {
              // Create logger with WARN level
              const logger = createLogger(LogLevel.WARN);
              
              // Try logging at different levels
              logger.debug(message);  // Should not log
              logger.info(message);   // Should not log
              logger.warn(message);   // Should log
              logger.error(message);  // Should log

              // Verify only WARN and ERROR were logged
              expect(logs.length).toBe(2);
              
              const warnEntry = JSON.parse(logs[0]);
              const errorEntry = JSON.parse(logs[1]);
              
              expect(warnEntry.level).toBe('WARN');
              expect(errorEntry.level).toBe('ERROR');
            } finally {
              console.log = originalLog;
              console.warn = originalWarn;
              console.error = originalError;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
