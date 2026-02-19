/**
 * Unit Tests for PaymentService Status Query
 * Feature: taiwan-payment-gateway
 * Validates: Requirements 6.2
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { PaymentService } from '../services/payment/payment.service';
import { PaymentStatus, PaymentMethod, PaymentConfig } from '../types/payment';

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
              transaction.updated_at = new Date().toISOString();
            }
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

  updateTransactionStatus(orderId: string, status: PaymentStatus, paidAt?: Date) {
    const transaction = this.getTransaction(orderId);
    if (transaction) {
      transaction.status = status;
      if (paidAt) {
        transaction.paid_at = paidAt.toISOString();
      }
      transaction.updated_at = new Date().toISOString();
    }
  }

  reset() {
    this.transactions.clear();
    this.orders.clear();
  }
}

describe('PaymentService Status Query - Unit Tests', () => {
  let mockDb: MockD1Database;
  let paymentService: PaymentService;

  beforeEach(() => {
    mockDb = new MockD1Database();
    paymentService = new PaymentService(mockDb as any, testConfig);
  });

  /**
   * Test: Query existing transaction with PENDING status
   * Validates: Requirements 6.2
   */
  test('should return payment status for existing pending transaction', async () => {
    // Arrange
    const orderId = 'order-123';
    const amount = 10000;
    mockDb.addOrder(orderId, amount);

    await paymentService.createPayment('newebpay', {
      orderId,
      amount,
      currency: 'TWD',
      description: 'Test Order',
      buyerEmail: 'test@example.com',
      paymentMethod: PaymentMethod.CREDIT_CARD,
      returnUrl: 'https://example.com/return',
      notifyUrl: 'https://example.com/notify',
    });

    // Act
    const result = await paymentService.queryPaymentStatus(orderId);

    // Assert
    expect(result).toBeTruthy();
    expect(result?.orderId).toBe(orderId);
    expect(result?.amount).toBe(amount);
    expect(result?.status).toBe(PaymentStatus.PROCESSING);
    expect(result?.paidAt).toBeUndefined();
  });

  /**
   * Test: Query existing transaction with SUCCESS status
   * Validates: Requirements 6.2
   */
  test('should return payment status for existing successful transaction', async () => {
    // Arrange
    const orderId = 'order-456';
    const amount = 25000;
    const paidAt = new Date('2024-01-15T10:30:00Z');
    
    mockDb.addOrder(orderId, amount);

    await paymentService.createPayment('ecpay', {
      orderId,
      amount,
      currency: 'TWD',
      description: 'Test Order',
      buyerEmail: 'test@example.com',
      paymentMethod: PaymentMethod.ATM,
      returnUrl: 'https://example.com/return',
      notifyUrl: 'https://example.com/notify',
    });

    // Simulate successful payment
    mockDb.updateTransactionStatus(orderId, PaymentStatus.SUCCESS, paidAt);

    // Act
    const result = await paymentService.queryPaymentStatus(orderId);

    // Assert
    expect(result).toBeTruthy();
    expect(result?.orderId).toBe(orderId);
    expect(result?.amount).toBe(amount);
    expect(result?.status).toBe(PaymentStatus.SUCCESS);
    expect(result?.paidAt).toEqual(paidAt);
  });

  /**
   * Test: Query existing transaction with FAILED status
   * Validates: Requirements 6.2
   */
  test('should return payment status for existing failed transaction', async () => {
    // Arrange
    const orderId = 'order-789';
    const amount = 5000;
    
    mockDb.addOrder(orderId, amount);

    await paymentService.createPayment('newebpay', {
      orderId,
      amount,
      currency: 'TWD',
      description: 'Test Order',
      buyerEmail: 'test@example.com',
      paymentMethod: PaymentMethod.CONVENIENCE_STORE,
      returnUrl: 'https://example.com/return',
      notifyUrl: 'https://example.com/notify',
    });

    // Simulate failed payment
    mockDb.updateTransactionStatus(orderId, PaymentStatus.FAILED);

    // Act
    const result = await paymentService.queryPaymentStatus(orderId);

    // Assert
    expect(result).toBeTruthy();
    expect(result?.orderId).toBe(orderId);
    expect(result?.amount).toBe(amount);
    expect(result?.status).toBe(PaymentStatus.FAILED);
    expect(result?.paidAt).toBeUndefined();
  });

  /**
   * Test: Query non-existent transaction
   * Validates: Requirements 6.2
   */
  test('should return null for non-existent transaction', async () => {
    // Arrange
    const nonExistentOrderId = 'order-nonexistent';

    // Act
    const result = await paymentService.queryPaymentStatus(nonExistentOrderId);

    // Assert
    expect(result).toBeNull();
  });

  /**
   * Test: Query transaction with all payment methods
   * Validates: Requirements 6.2
   */
  test('should return correct payment method for each transaction', async () => {
    // Arrange
    const testCases = [
      { orderId: 'order-cc', method: PaymentMethod.CREDIT_CARD },
      { orderId: 'order-atm', method: PaymentMethod.ATM },
      { orderId: 'order-cvs', method: PaymentMethod.CONVENIENCE_STORE },
      { orderId: 'order-barcode', method: PaymentMethod.BARCODE },
    ];

    for (const testCase of testCases) {
      mockDb.addOrder(testCase.orderId, 10000);
      await paymentService.createPayment('newebpay', {
        orderId: testCase.orderId,
        amount: 10000,
        currency: 'TWD',
        description: 'Test Order',
        buyerEmail: 'test@example.com',
        paymentMethod: testCase.method,
        returnUrl: 'https://example.com/return',
        notifyUrl: 'https://example.com/notify',
      });
    }

    // Act & Assert
    for (const testCase of testCases) {
      const result = await paymentService.queryPaymentStatus(testCase.orderId);
      expect(result).toBeTruthy();
      expect(result?.paymentMethod).toBe(testCase.method);
    }
  });

  /**
   * Test: Query transaction returns correct transaction ID
   * Validates: Requirements 6.2
   */
  test('should return transaction ID in query result', async () => {
    // Arrange
    const orderId = 'order-txn-id';
    const amount = 15000;
    
    mockDb.addOrder(orderId, amount);

    await paymentService.createPayment('ecpay', {
      orderId,
      amount,
      currency: 'TWD',
      description: 'Test Order',
      buyerEmail: 'test@example.com',
      paymentMethod: PaymentMethod.CREDIT_CARD,
      returnUrl: 'https://example.com/return',
      notifyUrl: 'https://example.com/notify',
    });

    // Act
    const result = await paymentService.queryPaymentStatus(orderId);

    // Assert
    expect(result).toBeTruthy();
    expect(result?.transactionId).toBeTruthy();
    expect(result?.transactionId).toMatch(/^txn_/);
  });

  /**
   * Test: Query transaction with gateway transaction ID
   * Validates: Requirements 6.2
   */
  test('should return gateway transaction ID when available', async () => {
    // Arrange
    const orderId = 'order-gateway-txn';
    const amount = 20000;
    const gatewayTxnId = 'GATEWAY_TXN_123456';
    
    mockDb.addOrder(orderId, amount);

    await paymentService.createPayment('newebpay', {
      orderId,
      amount,
      currency: 'TWD',
      description: 'Test Order',
      buyerEmail: 'test@example.com',
      paymentMethod: PaymentMethod.CREDIT_CARD,
      returnUrl: 'https://example.com/return',
      notifyUrl: 'https://example.com/notify',
    });

    // Simulate gateway transaction ID being set
    const transaction = mockDb.getTransaction(orderId);
    if (transaction) {
      transaction.gateway_transaction_id = gatewayTxnId;
    }

    // Act
    const result = await paymentService.queryPaymentStatus(orderId);

    // Assert
    expect(result).toBeTruthy();
    expect(result?.gatewayTransactionId).toBe(gatewayTxnId);
  });

  /**
   * Test: Query multiple transactions for different orders
   * Validates: Requirements 6.2
   */
  test('should correctly query multiple different transactions', async () => {
    // Arrange
    const orders = [
      { orderId: 'order-multi-1', amount: 5000, gateway: 'newebpay' as const },
      { orderId: 'order-multi-2', amount: 10000, gateway: 'ecpay' as const },
      { orderId: 'order-multi-3', amount: 15000, gateway: 'newebpay' as const },
    ];

    for (const order of orders) {
      mockDb.addOrder(order.orderId, order.amount);
      await paymentService.createPayment(order.gateway, {
        orderId: order.orderId,
        amount: order.amount,
        currency: 'TWD',
        description: 'Test Order',
        buyerEmail: 'test@example.com',
        paymentMethod: PaymentMethod.CREDIT_CARD,
        returnUrl: 'https://example.com/return',
        notifyUrl: 'https://example.com/notify',
      });
    }

    // Act & Assert
    for (const order of orders) {
      const result = await paymentService.queryPaymentStatus(order.orderId);
      expect(result).toBeTruthy();
      expect(result?.orderId).toBe(order.orderId);
      expect(result?.amount).toBe(order.amount);
    }
  });
});
