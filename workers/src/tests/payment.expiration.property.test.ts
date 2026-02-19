/**
 * Property-Based Tests for Payment Expiration
 * Feature: taiwan-payment-gateway
 * Property 27: Payment Expiration Time
 * Validates: Requirements 10.1, 10.2, 10.3
 */

import { describe, test, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { PaymentService } from '../services/payment/payment.service';
import { PaymentMethod, PaymentStatus } from '../types/payment';

// Mock D1 Database
class MockD1Database {
  private transactions: Map<string, any> = new Map();

  prepare(query: string) {
    const self = this;
    return {
      bind(...params: any[]) {
        return {
          async run() {
            // Handle INSERT
            if (query.includes('INSERT INTO payment_transactions')) {
              const [id, orderId, gateway, amount, currency, paymentMethod, status, createdAt, updatedAt, expiredAt] = params;
              self.transactions.set(orderId, {
                id,
                order_id: orderId,
                gateway,
                amount,
                currency,
                payment_method: paymentMethod,
                status,
                created_at: createdAt,
                updated_at: updatedAt,
                expired_at: expiredAt,
                gateway_transaction_id: null,
                paid_at: null,
              });
              return { success: true };
            }
            // Handle UPDATE
            if (query.includes('UPDATE payment_transactions')) {
              return { success: true };
            }
            // Handle UPDATE orders
            if (query.includes('UPDATE orders')) {
              return { success: true };
            }
            return { success: true };
          },
          async first() {
            // Handle SELECT from orders
            if (query.includes('SELECT id, total FROM orders')) {
              const orderId = params[0];
              return { id: orderId, total: 10000 };
            }
            // Handle SELECT from payment_transactions
            if (query.includes('SELECT * FROM payment_transactions')) {
              const orderId = params[0];
              return self.transactions.get(orderId) || null;
            }
            return null;
          },
          async all() {
            return { results: [] };
          },
        };
      },
    };
  }

  reset() {
    this.transactions.clear();
  }
}

// Test configuration
const fcConfig = {
  numRuns: 100,
  verbose: false,
};

// Custom arbitraries
const arbitraries = {
  orderId: () => fc.uuid(),
  amount: () => fc.constant(10000), // Fixed amount to match mock order
  paymentMethod: () => fc.constantFrom(
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.ATM,
    PaymentMethod.CONVENIENCE_STORE,
    PaymentMethod.BARCODE
  ),
  gateway: () => fc.constantFrom('newebpay', 'ecpay'),
};

describe('Property 27: Payment Expiration Time', () => {
  let mockDb: MockD1Database;
  let paymentService: PaymentService;

  beforeEach(() => {
    mockDb = new MockD1Database();
    
    const config = {
      newebpay: {
        merchantId: 'TEST_MERCHANT',
        hashKey: 'test_hash_key',
        hashIV: 'test_hash_iv',
        apiUrl: 'https://test.newebpay.com',
        version: '2.0',
      },
      ecpay: {
        merchantId: 'TEST_MERCHANT',
        hashKey: 'test_hash_key',
        hashIV: 'test_hash_iv',
        apiUrl: 'https://test.ecpay.com',
      },
    };

    paymentService = new PaymentService(mockDb as any, config);
  });

  test('Feature: taiwan-payment-gateway, Property 27: Expiration time matches payment method', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraries.orderId(),
        arbitraries.amount(),
        arbitraries.paymentMethod(),
        arbitraries.gateway(),
        async (orderId, amount, paymentMethod, gateway) => {
          // Arrange
          const startTime = Date.now();
          
          // Act
          await paymentService.createPayment(gateway, {
            orderId,
            amount,
            currency: 'TWD',
            description: 'Test Order',
            buyerEmail: 'test@example.com',
            paymentMethod,
            returnUrl: 'https://example.com/return',
            notifyUrl: 'https://example.com/notify',
          });

          // Get the transaction from mock database
          const transaction = await mockDb.prepare('SELECT * FROM payment_transactions WHERE order_id = ?')
            .bind(orderId)
            .first();

          // Assert
          expect(transaction).toBeDefined();
          expect(transaction.expired_at).toBeDefined();

          const expiredAt = new Date(transaction.expired_at);
          const expectedExpiration = calculateExpectedExpiration(paymentMethod, startTime);

          // Allow 2 second tolerance for execution time
          const diff = Math.abs(expiredAt.getTime() - expectedExpiration.getTime());
          expect(diff).toBeLessThan(2000);
        }
      ),
      fcConfig
    );
  });

  test('Feature: taiwan-payment-gateway, Property 27: Credit card expiration is 30 minutes', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraries.orderId(),
        arbitraries.amount(),
        arbitraries.gateway(),
        async (orderId, amount, gateway) => {
          // Arrange
          const startTime = Date.now();
          const paymentMethod = PaymentMethod.CREDIT_CARD;

          // Act
          await paymentService.createPayment(gateway, {
            orderId,
            amount,
            currency: 'TWD',
            description: 'Test Order',
            buyerEmail: 'test@example.com',
            paymentMethod,
            returnUrl: 'https://example.com/return',
            notifyUrl: 'https://example.com/notify',
          });

          // Get the transaction
          const transaction = await mockDb.prepare('SELECT * FROM payment_transactions WHERE order_id = ?')
            .bind(orderId)
            .first();

          // Assert
          const expiredAt = new Date(transaction.expired_at);
          const expectedExpiration = new Date(startTime + 30 * 60 * 1000); // 30 minutes

          const diff = Math.abs(expiredAt.getTime() - expectedExpiration.getTime());
          expect(diff).toBeLessThan(2000); // 2 second tolerance
        }
      ),
      fcConfig
    );
  });

  test('Feature: taiwan-payment-gateway, Property 27: ATM expiration is 3 days', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraries.orderId(),
        arbitraries.amount(),
        arbitraries.gateway(),
        async (orderId, amount, gateway) => {
          // Arrange
          const startTime = Date.now();
          const paymentMethod = PaymentMethod.ATM;

          // Act
          await paymentService.createPayment(gateway, {
            orderId,
            amount,
            currency: 'TWD',
            description: 'Test Order',
            buyerEmail: 'test@example.com',
            paymentMethod,
            returnUrl: 'https://example.com/return',
            notifyUrl: 'https://example.com/notify',
          });

          // Get the transaction
          const transaction = await mockDb.prepare('SELECT * FROM payment_transactions WHERE order_id = ?')
            .bind(orderId)
            .first();

          // Assert
          const expiredAt = new Date(transaction.expired_at);
          const expectedExpiration = new Date(startTime + 3 * 24 * 60 * 60 * 1000); // 3 days

          const diff = Math.abs(expiredAt.getTime() - expectedExpiration.getTime());
          expect(diff).toBeLessThan(2000); // 2 second tolerance
        }
      ),
      fcConfig
    );
  });

  test('Feature: taiwan-payment-gateway, Property 27: CVS expiration is 3 days', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraries.orderId(),
        arbitraries.amount(),
        arbitraries.gateway(),
        async (orderId, amount, gateway) => {
          // Arrange
          const startTime = Date.now();
          const paymentMethod = PaymentMethod.CONVENIENCE_STORE;

          // Act
          await paymentService.createPayment(gateway, {
            orderId,
            amount,
            currency: 'TWD',
            description: 'Test Order',
            buyerEmail: 'test@example.com',
            paymentMethod,
            returnUrl: 'https://example.com/return',
            notifyUrl: 'https://example.com/notify',
          });

          // Get the transaction
          const transaction = await mockDb.prepare('SELECT * FROM payment_transactions WHERE order_id = ?')
            .bind(orderId)
            .first();

          // Assert
          const expiredAt = new Date(transaction.expired_at);
          const expectedExpiration = new Date(startTime + 3 * 24 * 60 * 60 * 1000); // 3 days

          const diff = Math.abs(expiredAt.getTime() - expectedExpiration.getTime());
          expect(diff).toBeLessThan(2000); // 2 second tolerance
        }
      ),
      fcConfig
    );
  });

  test('Feature: taiwan-payment-gateway, Property 27: Barcode expiration is 3 days', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraries.orderId(),
        arbitraries.amount(),
        arbitraries.gateway(),
        async (orderId, amount, gateway) => {
          // Arrange
          const startTime = Date.now();
          const paymentMethod = PaymentMethod.BARCODE;

          // Act
          await paymentService.createPayment(gateway, {
            orderId,
            amount,
            currency: 'TWD',
            description: 'Test Order',
            buyerEmail: 'test@example.com',
            paymentMethod,
            returnUrl: 'https://example.com/return',
            notifyUrl: 'https://example.com/notify',
          });

          // Get the transaction
          const transaction = await mockDb.prepare('SELECT * FROM payment_transactions WHERE order_id = ?')
            .bind(orderId)
            .first();

          // Assert
          const expiredAt = new Date(transaction.expired_at);
          const expectedExpiration = new Date(startTime + 3 * 24 * 60 * 60 * 1000); // 3 days

          const diff = Math.abs(expiredAt.getTime() - expectedExpiration.getTime());
          expect(diff).toBeLessThan(2000); // 2 second tolerance
        }
      ),
      fcConfig
    );
  });
});

/**
 * Calculate expected expiration time based on payment method
 */
function calculateExpectedExpiration(method: PaymentMethod, startTime: number): Date {
  if (method === PaymentMethod.CREDIT_CARD) {
    return new Date(startTime + 30 * 60 * 1000); // 30 minutes
  } else {
    return new Date(startTime + 3 * 24 * 60 * 60 * 1000); // 3 days
  }
}
