/**
 * Payment Service
 * Core service for managing payment operations
 * Requirements: 3.1, 3.7, 5.1, 5.4, 5.6, 5.8, 5.9, 6.2, 7.2, 14.2, 14.3, 14.4
 */

import { PaymentGateway } from './gateway.interface';
import { NewebPayAdapter } from './newebpay.adapter';
import { ECPayAdapter } from './ecpay.adapter';
import {
  PaymentConfig,
  PaymentRequest,
  PaymentResponse,
  CallbackData,
  PaymentResult,
  PaymentStatus,
  PaymentMethod,
  RefundRequest,
  RefundResponse,
  PaymentTransaction,
} from '../../types/payment';
import { Logger, createLogger } from '../../utils/logger';

export class PaymentService {
  private gateways: Map<string, PaymentGateway>;
  private logger: Logger;

  constructor(
    private db: D1Database,
    private config: PaymentConfig
  ) {
    this.gateways = new Map();
    this.logger = createLogger();
    this.initializeGateways();
  }

  /**
   * Initialize payment gateway adapters
   */
  private initializeGateways(): void {
    // Initialize NewebPay
    if (this.config.newebpay) {
      this.gateways.set('newebpay', new NewebPayAdapter(this.config.newebpay));
    }

    // Initialize ECPay
    if (this.config.ecpay) {
      this.gateways.set('ecpay', new ECPayAdapter(this.config.ecpay));
    }
  }

  /**
   * Create a payment request
   * Requirements: 3.1, 3.7, 10.1, 10.2, 10.3, 13.1, 13.2, 13.5, 14.2
   */
  async createPayment(
    gatewayName: string,
    params: PaymentRequest
  ): Promise<PaymentResponse> {
    this.logger.info('Payment initiation started', {
      orderId: params.orderId,
      gateway: gatewayName,
      amount: params.amount,
      currency: params.currency,
      paymentMethod: params.paymentMethod,
    });

    try {
      // 1. Get gateway adapter
      const gateway = this.gateways.get(gatewayName);
      if (!gateway) {
        this.logger.error('Gateway not found', { gateway: gatewayName });
        throw new Error(`Gateway ${gatewayName} not found`);
      }

      // 2. Validate order amount
      await this.validateOrder(params.orderId, params.amount);

      // 3. Cancel any existing pending/processing transactions for this order
      // This allows users to retry payment if they abandoned the previous attempt
      await this.cancelPendingTransactionsForRetry(params.orderId);

      // 4. Calculate expiration time based on payment method
      const expiredAt = this.calculateExpirationTime(params.paymentMethod);

      // 5. Create transaction record (allows multiple attempts - Requirement 13.1, 13.2)
      const transactionId = this.generateTransactionId();
      await this.createTransaction({
        id: transactionId,
        orderId: params.orderId,
        gateway: gatewayName,
        amount: params.amount,
        currency: params.currency,
        paymentMethod: params.paymentMethod,
        status: PaymentStatus.PENDING,
        expiredAt,
      });

      this.logger.info('Transaction record created for payment attempt', {
        orderId: params.orderId,
        transactionId,
      });

      // 6. Call gateway to create payment
      let response: PaymentResponse;
      try {
        response = await gateway.createPayment(params);
      } catch (error) {
        // If gateway call fails, mark transaction as failed and cleanup
        await this.updateTransaction(transactionId, {
          status: PaymentStatus.FAILED,
        });
        
        this.logger.error('Gateway call failed', {
          orderId: params.orderId,
          transactionId,
          gateway: gatewayName,
          error: error instanceof Error ? error.message : String(error),
        });
        
        throw error;
      }

      // 7. Update transaction record based on response
      if (response.success) {
        await this.updateTransaction(transactionId, {
          gatewayTransactionId: response.transactionId,
          status: PaymentStatus.PROCESSING,
        });

        this.logger.info('Payment initiation successful', {
          orderId: params.orderId,
          transactionId,
          gateway: gatewayName,
          gatewayTransactionId: response.transactionId,
          expiredAt: expiredAt.toISOString(),
        });
      } else {
        // Gateway returned failure response, mark transaction as failed
        await this.updateTransaction(transactionId, {
          status: PaymentStatus.FAILED,
        });
        
        this.logger.warn('Payment initiation failed', {
          orderId: params.orderId,
          transactionId,
          gateway: gatewayName,
          error: response.error,
        });
      }

      return response;
    } catch (error) {
      this.logger.error('Payment initiation error', {
        orderId: params.orderId,
        gateway: gatewayName,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Calculate expiration time based on payment method
   * Requirements: 10.1, 10.2, 10.3
   * - Credit card: 30 minutes
   * - ATM: 3 days
   * - Convenience store: 3 days
   * - Barcode: 3 days
   */
  private calculateExpirationTime(paymentMethod: PaymentMethod): Date {
    const now = new Date();
    
    if (paymentMethod === PaymentMethod.CREDIT_CARD) {
      // Credit card: 30 minutes
      return new Date(now.getTime() + 30 * 60 * 1000);
    } else {
      // ATM, CVS, Barcode: 3 days
      return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Handle payment callback from gateway
   * Requirements: 5.1, 5.4, 5.6, 5.8, 5.9, 13.4, 14.3
   */
  async handleCallback(
    gatewayName: string,
    data: CallbackData
  ): Promise<{ success: boolean; message: string }> {
    this.logger.info('Payment callback received', {
      gateway: gatewayName,
      dataKeys: Object.keys(data),
    });

    try {
      // 1. Get gateway adapter
      const gateway = this.gateways.get(gatewayName);
      if (!gateway) {
        this.logger.error('Gateway not found in callback', { gateway: gatewayName });
        return { success: false, message: 'Gateway not found' };
      }

      // 2. Verify signature
      const isValid = await gateway.verifyCallback(data);
      if (!isValid) {
        this.logger.warn('Invalid callback signature', {
          gateway: gatewayName,
          dataKeys: Object.keys(data),
        });
        await this.logSecurityEvent('Invalid callback signature', { gatewayName, data });
        return { success: false, message: 'Invalid signature' };
      }

      // 3. Parse callback data
      const result = await gateway.parseCallback(data);

      this.logger.info('Callback parsed successfully', {
        gateway: gatewayName,
        orderId: result.orderId,
        transactionId: result.transactionId,
        status: result.status,
        amount: result.amount,
        gatewayTransactionId: result.gatewayTransactionId,
      });

      // 4. Idempotency check
      const existingTransaction = await this.getTransactionByOrderId(result.orderId);
      if (existingTransaction && existingTransaction.status === PaymentStatus.SUCCESS) {
        this.logger.info('Callback already processed (idempotent)', {
          orderId: result.orderId,
          existingStatus: existingTransaction.status,
        });
        return { success: true, message: 'Already processed' };
      }

      // 5. Update transaction status
      await this.updateTransactionByOrderId(result.orderId, {
        status: result.status,
        paidAt: result.paidAt,
        gatewayTransactionId: result.gatewayTransactionId,
      });

      // 6. Update order status and cancel other pending transactions (Requirement 13.4)
      if (result.status === PaymentStatus.SUCCESS) {
        await this.updateOrderStatus(result.orderId, 'paid');
        
        // Cancel all other pending/processing transactions for this order
        await this.cancelOtherPendingTransactions(result.orderId, result.transactionId);
        
        this.logger.info('Payment successful, order updated and other pending transactions cancelled', {
          orderId: result.orderId,
          amount: result.amount,
          paidAt: result.paidAt,
        });
      } else if (result.status === PaymentStatus.FAILED) {
        await this.updateOrderStatus(result.orderId, 'payment_failed');
        this.logger.warn('Payment failed', {
          orderId: result.orderId,
          status: result.status,
        });
      }

      // 7. Log callback
      await this.logCallback({
        gateway: gatewayName,
        orderId: result.orderId,
        status: result.status,
        data: JSON.stringify(data),
      });

      return { success: true, message: 'OK' };
    } catch (error) {
      this.logger.error('Callback processing error', {
        gateway: gatewayName,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Query payment status by order ID
   * Requirements: 6.2
   */
  async queryPaymentStatus(orderId: string): Promise<PaymentResult | null> {
    const transaction = await this.getTransactionByOrderId(orderId);
    if (!transaction) {
      return null;
    }

    return {
      transactionId: transaction.id,
      orderId: transaction.order_id,
      amount: transaction.amount,
      status: transaction.status as PaymentStatus,
      paidAt: transaction.paid_at ? new Date(transaction.paid_at) : undefined,
      gatewayTransactionId: transaction.gateway_transaction_id || '',
      paymentMethod: transaction.payment_method,
    };
  }

  /**
   * Process refund
   * Requirements: 14.4
   */
  async refundPayment(
    orderId: string,
    amount: number,
    reason: string
  ): Promise<RefundResponse> {
    this.logger.info('Refund initiated', {
      orderId,
      amount,
      reason,
    });

    try {
      // 1. Get original transaction
      const transaction = await this.getTransactionByOrderId(orderId);
      if (!transaction || transaction.status !== PaymentStatus.SUCCESS) {
        this.logger.warn('Refund failed: invalid transaction', {
          orderId,
          transactionFound: !!transaction,
          transactionStatus: transaction?.status,
        });
        return { success: false, error: 'Transaction not found or not paid' };
      }

      // 2. Validate refund amount
      if (amount > transaction.amount) {
        this.logger.warn('Refund failed: amount exceeds payment', {
          orderId,
          requestedAmount: amount,
          transactionAmount: transaction.amount,
        });
        return { success: false, error: 'Refund amount exceeds payment amount' };
      }

      // 3. Get gateway adapter
      const gateway = this.gateways.get(transaction.gateway);
      if (!gateway) {
        this.logger.error('Gateway not found for refund', {
          orderId,
          gateway: transaction.gateway,
        });
        return { success: false, error: 'Gateway not found' };
      }

      // 4. Call gateway refund
      const response = await gateway.refund({
        transactionId: transaction.gateway_transaction_id || '',
        amount,
        reason,
      });

      // 5. Record refund
      if (response.success) {
        await this.createRefundRecord({
          transactionId: transaction.id,
          amount,
          reason,
          status: 'success',
        });

        // If full refund, update transaction status
        if (amount === transaction.amount) {
          await this.updateTransaction(transaction.id, {
            status: PaymentStatus.REFUNDED,
          });
        }

        this.logger.info('Refund successful', {
          orderId,
          transactionId: transaction.id,
          amount,
          isFullRefund: amount === transaction.amount,
          refundId: response.refundId,
        });
      } else {
        this.logger.warn('Refund failed', {
          orderId,
          transactionId: transaction.id,
          amount,
          error: response.error,
        });
      }

      return response;
    } catch (error) {
      this.logger.error('Refund processing error', {
        orderId,
        amount,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // ============================================================================
  // Database Operations
  // ============================================================================

  /**
   * Generate unique transaction ID
   */
  private generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Create transaction record
   */
  private async createTransaction(data: {
    id: string;
    orderId: string;
    gateway: string;
    amount: number;
    currency: string;
    paymentMethod: PaymentMethod;
    status: PaymentStatus;
    expiredAt?: Date;
  }): Promise<void> {
    const now = new Date().toISOString();
    
    await this.db
      .prepare(
        `INSERT INTO payment_transactions 
        (id, order_id, gateway, amount, currency, payment_method, status, created_at, updated_at, expired_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        data.id,
        data.orderId,
        data.gateway,
        data.amount,
        data.currency,
        data.paymentMethod,
        data.status,
        now,
        now,
        data.expiredAt ? data.expiredAt.toISOString() : null
      )
      .run();
  }

  /**
   * Update transaction by ID
   */
  private async updateTransaction(
    id: string,
    data: Partial<{
      gatewayTransactionId: string;
      status: PaymentStatus;
      paidAt: Date;
    }>
  ): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.gatewayTransactionId !== undefined) {
      updates.push('gateway_transaction_id = ?');
      values.push(data.gatewayTransactionId);
    }

    if (data.status !== undefined) {
      updates.push('status = ?');
      values.push(data.status);
    }

    if (data.paidAt !== undefined) {
      updates.push('paid_at = ?');
      values.push(data.paidAt.toISOString());
    }

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(id);

    await this.db
      .prepare(`UPDATE payment_transactions SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();
  }

  /**
   * Get transaction by order ID
   */
  private async getTransactionByOrderId(orderId: string): Promise<PaymentTransaction | null> {
    const result = await this.db
      .prepare('SELECT * FROM payment_transactions WHERE order_id = ? ORDER BY created_at DESC LIMIT 1')
      .bind(orderId)
      .first<PaymentTransaction>();

    return result || null;
  }

  /**
   * Count pending transactions for an order
   * Requirements: 13.5
   */
  private async countPendingTransactions(orderId: string): Promise<number> {
    const result = await this.db
      .prepare(
        `SELECT COUNT(*) as count FROM payment_transactions 
         WHERE order_id = ? AND status IN (?, ?)`
      )
      .bind(orderId, PaymentStatus.PENDING, PaymentStatus.PROCESSING)
      .first<{ count: number }>();

    return result?.count || 0;
  }

  /**
   * Get all transactions for an order
   * Requirements: 13.3
   */
  private async getAllTransactionsByOrderId(orderId: string): Promise<PaymentTransaction[]> {
    const result = await this.db
      .prepare('SELECT * FROM payment_transactions WHERE order_id = ? ORDER BY created_at DESC')
      .bind(orderId)
      .all<PaymentTransaction>();

    return result.results || [];
  }

  /**
   * Cancel other pending transactions for an order
   * Requirements: 13.4
   */
  private async cancelOtherPendingTransactions(orderId: string, successfulTransactionId: string): Promise<void> {
    // Get all pending/processing transactions for this order except the successful one
    const transactions = await this.getAllTransactionsByOrderId(orderId);
    
    const pendingTransactions = transactions.filter(
      (t: PaymentTransaction) => 
        t.id !== successfulTransactionId && 
        (t.status === PaymentStatus.PENDING || t.status === PaymentStatus.PROCESSING)
    );

    // Cancel each pending transaction
    for (const transaction of pendingTransactions) {
      await this.updateTransaction(transaction.id, {
        status: PaymentStatus.CANCELLED,
      });
      
      this.logger.info('Cancelled pending transaction', {
        transactionId: transaction.id,
        orderId,
        reason: 'Another payment succeeded',
      });
    }

    if (pendingTransactions.length > 0) {
      this.logger.info('Cancelled other pending transactions', {
        orderId,
        successfulTransactionId,
        cancelledCount: pendingTransactions.length,
      });
    }
  }

  /**
   * Cancel pending transactions for payment retry
   * Allows users to retry payment if they abandoned the previous attempt
   */
  private async cancelPendingTransactionsForRetry(orderId: string): Promise<void> {
    const transactions = await this.getAllTransactionsByOrderId(orderId);
    
    const pendingTransactions = transactions.filter(
      (t: PaymentTransaction) => 
        t.status === PaymentStatus.PENDING || t.status === PaymentStatus.PROCESSING
    );

    // Cancel each pending transaction
    for (const transaction of pendingTransactions) {
      await this.updateTransaction(transaction.id, {
        status: PaymentStatus.CANCELLED,
      });
      
      this.logger.info('Cancelled pending transaction for retry', {
        transactionId: transaction.id,
        orderId,
        reason: 'User initiated new payment attempt',
      });
    }

    if (pendingTransactions.length > 0) {
      this.logger.info('Cancelled pending transactions for retry', {
        orderId,
        cancelledCount: pendingTransactions.length,
      });
    }
  }

  /**
   * Update transaction by order ID
   */
  private async updateTransactionByOrderId(
    orderId: string,
    data: Partial<{
      status: PaymentStatus;
      paidAt?: Date;
      gatewayTransactionId: string;
    }>
  ): Promise<void> {
    const transaction = await this.getTransactionByOrderId(orderId);
    if (transaction) {
      await this.updateTransaction(transaction.id, data);
    }
  }

  /**
   * Validate order exists and amount matches
   */
  private async validateOrder(orderId: string, amount: number): Promise<void> {
    const order = await this.db
      .prepare('SELECT id, total_amount FROM orders WHERE id = ?')
      .bind(orderId)
      .first<{ id: string; total_amount: number }>();

    if (!order) {
      throw new Error('Order not found');
    }

    // Convert order total to cents for comparison
    const orderAmountInCents = Math.round(order.total_amount * 100);
    
    if (orderAmountInCents !== amount) {
      throw new Error(`Amount mismatch: expected ${orderAmountInCents}, got ${amount}`);
    }
  }

  /**
   * Update order status
   */
  private async updateOrderStatus(orderId: string, status: string): Promise<void> {
    await this.db
      .prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?')
      .bind(status, new Date().toISOString(), orderId)
      .run();
  }

  /**
   * Log callback
   */
  private async logCallback(data: {
    gateway: string;
    orderId: string;
    status: PaymentStatus;
    data: string;
  }): Promise<void> {
    const transaction = await this.getTransactionByOrderId(data.orderId);
    if (!transaction) return;

    await this.db
      .prepare(
        `INSERT INTO payment_callbacks 
        (transaction_id, gateway, callback_data, status, created_at)
        VALUES (?, ?, ?, ?, ?)`
      )
      .bind(
        transaction.id,
        data.gateway,
        data.data,
        data.status === PaymentStatus.SUCCESS ? 'success' : 'failed',
        new Date().toISOString()
      )
      .run();
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(eventType: string, data: any): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO payment_security_logs 
        (event_type, gateway, request_data, created_at)
        VALUES (?, ?, ?, ?)`
      )
      .bind(
        eventType,
        data.gatewayName || null,
        JSON.stringify(data),
        new Date().toISOString()
      )
      .run();
  }

  /**
   * Create refund record
   */
  private async createRefundRecord(data: {
    transactionId: string;
    amount: number;
    reason: string;
    status: string;
  }): Promise<void> {
    const refundId = `ref_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    await this.db
      .prepare(
        `INSERT INTO payment_refunds 
        (id, transaction_id, amount, reason, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(
        refundId,
        data.transactionId,
        data.amount,
        data.reason,
        data.status,
        new Date().toISOString()
      )
      .run();
  }
}
