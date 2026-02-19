/**
 * Payment Gateway Interface
 * Defines the contract that all payment gateway adapters must implement
 * Requirements: 3.2
 */

import {
  PaymentRequest,
  PaymentResponse,
  CallbackData,
  PaymentResult,
  PaymentStatus,
  RefundRequest,
  RefundResponse,
} from '../../types/payment';

/**
 * PaymentGateway Interface
 * All payment gateway adapters (NewebPay, ECPay, etc.) must implement this interface
 */
export interface PaymentGateway {
  /**
   * Gateway name identifier
   */
  name: string;

  /**
   * Create a payment request
   * Generates the necessary parameters and form HTML for redirecting to the gateway
   * @param params - Payment request parameters
   * @returns Payment response with form HTML or payment URL
   */
  createPayment(params: PaymentRequest): Promise<PaymentResponse>;

  /**
   * Verify callback signature
   * Validates that the callback data comes from the legitimate payment gateway
   * @param data - Callback data received from the gateway
   * @returns true if signature is valid, false otherwise
   */
  verifyCallback(data: CallbackData): Promise<boolean>;

  /**
   * Parse callback data
   * Extracts and decrypts payment result information from callback
   * @param data - Callback data received from the gateway
   * @returns Parsed payment result
   */
  parseCallback(data: CallbackData): Promise<PaymentResult>;

  /**
   * Query payment status
   * Queries the current status of a payment from the gateway
   * @param transactionId - Transaction identifier
   * @returns Current payment status
   */
  queryPayment(transactionId: string): Promise<PaymentStatus>;

  /**
   * Initiate a refund
   * Requests a refund for a completed payment
   * @param params - Refund request parameters
   * @returns Refund response
   */
  refund(params: RefundRequest): Promise<RefundResponse>;
}
