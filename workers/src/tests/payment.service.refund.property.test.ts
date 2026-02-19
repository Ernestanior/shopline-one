/**
 * Property-Based Tests for PaymentService Refund Functionality
 * Feature: taiwan-payment-gateway
 * Validates: Requirements 11.1, 11.5, 11.6, 11.7, 11.8
 */

import { describe, test, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { PaymentService } from '../services/payment/payment.service';
import { PaymentStatus, PaymentMethod, PaymentConfig } from '../types/payment';

// Fast-check configuration
const fcConfig = {
  numRuns: 100,
  verbose: true,
};

// Test configuration
const testConfig: PaymentConfig = {
  newebpay: {
    merchantId: 'TEST_MERCHANT_123',
    hashKey: '1234567890123456',
    hashIV: '1234567890123456',
    apiUrl: 'https://test.newebpay.com/MPG/mpg_gateway',
    version: '2.0',
  },
  ecpay: {
    merchantId: 'TEST_MERCHANT_456',
    hashKey: 'abcdefghijklmnop',
    hashIV: 'abcdefghijklmnop',
    apiUrl: 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5',
  },
};

// Mock D1 Database
class MockD1Database {
  private transactions: Map<string, any> = new Map();
  private orders: Map<string, any> = new Map();
  private refunds: any[] = [];

  prepare(query: string) {
    return {
      bind: (...params: any[]) => ({
        run: async () => {
          // Handle INSERT INTO payment_transactions
          if (query.includes('INSERT INTO payment_transactions')) {
            const [id, orderId, gateway, amount, currency, paymentMethod, status, createdAt, updatedAt] = params;
            this.transactions.set(id, {
              id,
              order_id: orderId,
              gateway,
              amount,
              currency,
              payment_method: paymentMethod,
              status,
              created_at: createdAt,
              updated_at: updatedAt,
              gateway_transaction_id: null,
              paid_at: null,
              expired_at: null,
            });
            return { success: true };
          }

          // Handle UPDATE payment_transactions
          if (query.includes('UPDATE payment_transactions')) {
            const id = params[params.length - 1];
            const transaction = this.transactions.get(id);
            if (transaction) {
              if (query.includes('gateway_transaction_id')) {
                transaction.gateway_transaction_id = params[0];
              }
              if (query.includes('status')) {
                const statusIndex = query.includes('gateway_transaction_id') ? 1 : 0;
                transaction.status = params[statusIndex];
              }
              if (query.includes('paid_at')) {
                const paidAtIndex = query.match(/gateway_transaction_id/) && query.match(/status/) ? 2 : 
                                    query.match(/gateway_transaction_id/) || query.match(/status/) ? 1 : 0;
                transaction.paid_at = params[paidAtIndex];
              }
              transaction.updated_at = new Date().toISOString();
            }
            return { success: true };
          }

          // Handle INSERT INTO payment_refunds
          if (query.includes('INSERT INTO payment_refunds')) {
            this.refunds.push({
              id: params[0],
              transaction_id: params[1],
              amount: params[2],
              reason: params[3],
              status: params[4],
              created_at: params[5],
            });
            return { success: true };
          }

          return { success: true };
        },
        first: async () => {
          // Handle SELECT from payment_transactions
          if (query.includes('SELECT * FROM payment_transactions')) {
            const orderId = params[0];
            for (const [, transaction] of this.transactions) {
              if (transaction.order_id === orderId) {
                return transaction;
              }
            }
            return null;
          }

          // Handle SELECT from orders
          if (query.includes('SELECT id, total FROM orders')) {
            const orderId = params[0];
            return this.orders.get(orderId) || null;
          }

          return null;
        },
      }),
    };
  }

  // Helper methods for testing
  addOrder(orderId: string, total: number) {
    this.orders.set(orderId, {
      id: orderId,
      total,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  getTransaction(orderId: string) {
    for (const [, transaction] of this.transactions) {
      if (transaction.order_id === orderId) {
        return transaction;
      }
    }
    return null;
  }

  updateTransactionStatus(orderId: string, status: PaymentStatus, paidAt?: Date, gatewayTxnId?: string) {
    const transaction = this.getTransaction(orderId);
    if (transaction) {
      transaction.status = status;
      if (paidAt) {
        transaction.paid_at = paidAt.toISOString();
      }
      if (gatewayTxnId) {
        transaction.gateway_transaction_id = gatewayTxnId;
      }
      transaction.updated_at = new Date().toISOString();
    }
  }

  getRefunds() {
    return this.refunds;
  }

  reset() {
    this.transactions.clear();
    this.orders.clear();
    this.refunds = [];
  }
}

// Custom arbitraries
const arbitraries = {
  orderId: () => fc.uuid(),
  amount: () => fc.integer({ min: 1000, max: 1000000 }),
  refundAmount: (maxAmount: number) => fc.integer({ min: 100, max: maxAmount }),
  gateway: () => fc.constantFrom('newebpay', 'ecpay'),
  reason: () => fc.string({ minLength: 5, maxLength: 100 }),
};

describe('PaymentService Refund Functionality - Property Tests', () => {
  let mockDb: MockD1Database;
  let paymentService: PaymentService;

  beforeEach(() => {
    mockDb = new MockD1Database();
    paymentService = new PaymentService(mockDb as any, testConfig);
  });

  /**
   * Property 29: Refund Validation
   * Validates: Requirements 11.1
   */
  describe('Property 29: Refund Validation', () => {
    test('Feature: taiwan-payment-gateway, Property 29: Refund requires successful payment', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraries.orderId(),
          arbitraries.amount(),
          arbitraries.gateway(),
          arbitraries.reason(),
          async (orderId, amount, gateway, reason) => {
            // Setup: Create order and payment
            mockDb.reset();
            mockDb.addOrder(orderId, amount);

            await paymentService.createPayment(gateway, {
              orderId,
              amount,
              currency: 'TWD',
              description: 'Test Order',
              buyerEmail: 'test@example.com',
              paymentMethod: PaymentMethod.CREDIT_CARD,
              returnUrl: 'https://example.com/return',
              notifyUrl: 'https://example.com/notify',
            });

            // Transaction is in PROCESSING state, not SUCCESS
            // Act: Try to refund
            const result = await paymentService.refundPayment(orderId, amount, reason);

            // Assert: Refund should fail because payment is not successful
            expect(result.success).toBe(false);
            expect(result.error).toContain('not paid');
          }
        ),
        fcConfig
      );
    });

    test('Feature: taiwan-payment-gateway, Property 29: Refund succeeds for successful payment', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraries.orderId(),
          arbitraries.amount(),
          arbitraries.gateway(),
          arbitraries.reason(),
          async (orderId, amount, gateway, reason) => {
            // Setup: Create order and successful payment
            mockDb.reset();
            mockDb.addOrder(orderId, amount);

            await paymentService.createPayment(gateway, {
              orderId,
              amount,
              currency: 'TWD',
              description: 'Test Order',
              buyerEmail: 'test@example.com',
              paymentMethod: PaymentMethod.CREDIT_CARD,
              returnUrl: 'https://example.com/return',
              notifyUrl: 'https://example.com/notify',
            });

            // Simulate successful payment
            mockDb.updateTransactionStatus(orderId, PaymentStatus.SUCCESS, new Date(), 'GATEWAY_TXN_123');

            // Act: Refund
            const result = await paymentService.refundPayment(orderId, amount, reason);

            // Assert: Refund should succeed
            expect(result.success).toBe(true);
          }
        ),
        fcConfig
      );
    });
  });

  /**
   * Property 32: Refund Status Update
   * Validates: Requirements 11.5, 11.6
   */
  describe('Property 32: Refund Status Update', () => {
    test('Feature: taiwan-payment-gateway, Property 32: Full refund updates transaction status', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraries.orderId(),
          arbitraries.amount(),
          arbitraries.gateway(),
          arbitraries.reason(),
          async (orderId, amount, gateway, reason) => {
            // Setup: Create successful payment
            mockDb.reset();
            mockDb.addOrder(orderId, amount);

            await paymentService.createPayment(gateway, {
              orderId,
              amount,
              currency: 'TWD',
              description: 'Test Order',
              buyerEmail: 'test@example.com',
              paymentMethod: PaymentMethod.CREDIT_CARD,
              returnUrl: 'https://example.com/return',
              notifyUrl: 'https://example.com/notify',
            });

            mockDb.updateTransactionStatus(orderId, PaymentStatus.SUCCESS, new Date(), 'GATEWAY_TXN_123');

            // Act: Full refund
            const result = await paymentService.refundPayment(orderId, amount, reason);

            // Assert: Transaction status should be updated to REFUNDED
            expect(result.success).toBe(true);
            
            const transaction = mockDb.getTransaction(orderId);
            expect(transaction?.status).toBe(PaymentStatus.REFUNDED);
          }
        ),
        fcConfig
      );
    });
  });

  /**
   * Property 33: Partial Refund Support
   * Validates: Requirements 11.7
   */
  describe('Property 33: Partial Refund Support', () => {
    test('Feature: taiwan-payment-gateway, Property 33: Partial refund processes correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraries.orderId(),
          arbitraries.amount(),
          arbitraries.gateway(),
          arbitraries.reason(),
          async (orderId, amount, gateway, reason) => {
            // Setup: Create successful payment
            mockDb.reset();
            mockDb.addOrder(orderId, amount);

            await paymentService.createPayment(gateway, {
              orderId,
              amount,
              currency: 'TWD',
              description: 'Test Order',
              buyerEmail: 'test@example.com',
              paymentMethod: PaymentMethod.CREDIT_CARD,
              returnUrl: 'https://example.com/return',
              notifyUrl: 'https://example.com/notify',
            });

            mockDb.updateTransactionStatus(orderId, PaymentStatus.SUCCESS, new Date(), 'GATEWAY_TXN_123');

            // Act: Partial refund (50% of amount)
            const partialAmount = Math.floor(amount / 2);
            const result = await paymentService.refundPayment(orderId, partialAmount, reason);

            // Assert: Partial refund should succeed
            expect(result.success).toBe(true);
            
            // Transaction status should NOT be REFUNDED (only partial)
            const transaction = mockDb.getTransaction(orderId);
            expect(transaction?.status).toBe(PaymentStatus.SUCCESS);
          }
        ),
        fcConfig
      );
    });

    test('Feature: taiwan-payment-gateway, Property 33: Refund amount cannot exceed payment amount', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraries.orderId(),
          arbitraries.amount(),
          arbitraries.gateway(),
          arbitraries.reason(),
          async (orderId, amount, gateway, reason) => {
            // Setup: Create successful payment
            mockDb.reset();
            mockDb.addOrder(orderId, amount);

            await paymentService.createPayment(gateway, {
              orderId,
              amount,
              currency: 'TWD',
              description: 'Test Order',
              buyerEmail: 'test@example.com',
              paymentMethod: PaymentMethod.CREDIT_CARD,
              returnUrl: 'https://example.com/return',
              notifyUrl: 'https://example.com/notify',
            });

            mockDb.updateTransactionStatus(orderId, PaymentStatus.SUCCESS, new Date(), 'GATEWAY_TXN_123');

            // Act: Try to refund more than payment amount
            const excessAmount = amount + 1000;
            const result = await paymentService.refundPayment(orderId, excessAmount, reason);

            // Assert: Refund should fail
            expect(result.success).toBe(false);
            expect(result.error).toContain('exceeds');
          }
        ),
        fcConfig
      );
    });
  });

  /**
   * Property 34: Refund Record Creation
   * Validates: Requirements 11.8
   */
  describe('Property 34: Refund Record Creation', () => {
    test('Feature: taiwan-payment-gateway, Property 34: Refund creates complete record', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraries.orderId(),
          arbitraries.amount(),
          arbitraries.gateway(),
          arbitraries.reason(),
          async (orderId, amount, gateway, reason) => {
            // Setup: Create successful payment
            mockDb.reset();
            mockDb.addOrder(orderId, amount);

            await paymentService.createPayment(gateway, {
              orderId,
              amount,
              currency: 'TWD',
              description: 'Test Order',
              buyerEmail: 'test@example.com',
              paymentMethod: PaymentMethod.CREDIT_CARD,
              returnUrl: 'https://example.com/return',
              notifyUrl: 'https://example.com/notify',
            });

            mockDb.updateTransactionStatus(orderId, PaymentStatus.SUCCESS, new Date(), 'GATEWAY_TXN_123');

            // Act: Refund
            const result = await paymentService.refundPayment(orderId, amount, reason);

            // Assert: Refund record should be created
            expect(result.success).toBe(true);
            
            const refunds = mockDb.getRefunds();
            expect(refunds.length).toBeGreaterThan(0);
            
            const refund = refunds[0];
            expect(refund.amount).toBe(amount);
            expect(refund.reason).toBe(reason);
            expect(refund.status).toBe('success');
            expect(refund.created_at).toBeTruthy();
          }
        ),
        fcConfig
      );
    });
  });
});
