/**
 * Payment Input Validation and Sanitization Middleware
 * Validates and sanitizes payment-related inputs
 * Requirements: 12.4, 12.5, 15.4
 */

import { PaymentMethod } from '../types/payment';

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate payment amount
 * Requirements: 12.4, 12.5
 */
export function validatePaymentAmount(amount: any): number {
  // Check if amount is provided
  if (amount === undefined || amount === null) {
    throw new ValidationError('Payment amount is required', 'amount');
  }

  // Convert to number if string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  // Check if valid number
  if (isNaN(numAmount) || !isFinite(numAmount)) {
    throw new ValidationError('Payment amount must be a valid number', 'amount');
  }

  // Check if positive
  if (numAmount <= 0) {
    throw new ValidationError('Payment amount must be greater than zero', 'amount');
  }

  // Check if reasonable (not too large)
  const MAX_AMOUNT = 10000000; // 100,000 TWD in cents
  if (numAmount > MAX_AMOUNT) {
    throw new ValidationError(`Payment amount cannot exceed ${MAX_AMOUNT / 100} TWD`, 'amount');
  }

  // Check if integer (amounts should be in cents)
  if (!Number.isInteger(numAmount)) {
    throw new ValidationError('Payment amount must be an integer (in cents)', 'amount');
  }

  return numAmount;
}

/**
 * Validate payment method
 * Requirements: 12.4
 */
export function validatePaymentMethod(method: any): PaymentMethod {
  // Check if method is provided
  if (!method) {
    throw new ValidationError('Payment method is required', 'paymentMethod');
  }

  // Sanitize input (trim and lowercase)
  const sanitized = typeof method === 'string' ? method.trim().toLowerCase() : String(method);

  // Check if valid payment method
  const validMethods = Object.values(PaymentMethod);
  if (!validMethods.includes(sanitized as PaymentMethod)) {
    throw new ValidationError(
      `Invalid payment method. Must be one of: ${validMethods.join(', ')}`,
      'paymentMethod'
    );
  }

  return sanitized as PaymentMethod;
}

/**
 * Validate order ID
 * Requirements: 15.4
 */
export function validateOrderId(orderId: any): string {
  // Check if orderId is provided
  if (!orderId) {
    throw new ValidationError('Order ID is required', 'orderId');
  }

  // Convert to string and sanitize
  const sanitized = String(orderId).trim();

  // Check if empty after trimming
  if (sanitized.length === 0) {
    throw new ValidationError('Order ID cannot be empty', 'orderId');
  }

  // Check length
  if (sanitized.length > 100) {
    throw new ValidationError('Order ID is too long (max 100 characters)', 'orderId');
  }

  // Check format (alphanumeric, hyphens, underscores only)
  if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
    throw new ValidationError('Order ID must contain only alphanumeric characters, hyphens, and underscores', 'orderId');
  }

  return sanitized;
}

/**
 * Validate email address
 * Requirements: 15.4
 */
export function validateEmail(email: any): string {
  // Check if email is provided
  if (!email) {
    throw new ValidationError('Email is required', 'email');
  }

  // Convert to string and sanitize
  const sanitized = String(email).trim().toLowerCase();

  // Check if empty after trimming
  if (sanitized.length === 0) {
    throw new ValidationError('Email cannot be empty', 'email');
  }

  // Check length
  if (sanitized.length > 255) {
    throw new ValidationError('Email is too long (max 255 characters)', 'email');
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    throw new ValidationError('Invalid email format', 'email');
  }

  return sanitized;
}

/**
 * Validate description/item name
 * Requirements: 15.4
 */
export function validateDescription(description: any): string {
  // Check if description is provided
  if (!description) {
    throw new ValidationError('Description is required', 'description');
  }

  // Convert to string and sanitize
  let sanitized = String(description).trim();

  // Check if empty after trimming
  if (sanitized.length === 0) {
    throw new ValidationError('Description cannot be empty', 'description');
  }

  // Check length
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 200);
  }

  // Remove potentially dangerous characters
  sanitized = sanitizeString(sanitized);

  return sanitized;
}

/**
 * Validate URL
 * Requirements: 15.4
 */
export function validateUrl(url: any, fieldName: string = 'url'): string {
  // Check if URL is provided
  if (!url) {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }

  // Convert to string and sanitize
  const sanitized = String(url).trim();

  // Check if empty after trimming
  if (sanitized.length === 0) {
    throw new ValidationError(`${fieldName} cannot be empty`, fieldName);
  }

  // Validate URL format
  try {
    const parsed = new URL(sanitized);
    
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new ValidationError(`${fieldName} must use HTTP or HTTPS protocol`, fieldName);
    }

    return sanitized;
  } catch {
    throw new ValidationError(`${fieldName} must be a valid URL`, fieldName);
  }
}

/**
 * Validate gateway name
 * Requirements: 15.4
 */
export function validateGateway(gateway: any): string {
  // Check if gateway is provided
  if (!gateway) {
    throw new ValidationError('Gateway is required', 'gateway');
  }

  // Convert to string and sanitize
  const sanitized = String(gateway).trim().toLowerCase();

  // Check if valid gateway
  const validGateways = ['newebpay', 'ecpay'];
  if (!validGateways.includes(sanitized)) {
    throw new ValidationError(
      `Invalid gateway. Must be one of: ${validGateways.join(', ')}`,
      'gateway'
    );
  }

  return sanitized;
}

/**
 * Sanitize string input
 * Removes potentially dangerous characters and HTML tags
 * Requirements: 15.4
 */
export function sanitizeString(input: string): string {
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');

  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  // Remove SQL injection patterns (basic protection)
  sanitized = sanitized.replace(/['";\\]/g, '');
  
  // Remove SQL keywords (case-insensitive)
  const sqlKeywords = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'SELECT', 'TABLE', 'FROM', 'WHERE', '--'];
  for (const keyword of sqlKeywords) {
    const regex = new RegExp(keyword, 'gi');
    sanitized = sanitized.replace(regex, '');
  }

  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  return sanitized;
}

/**
 * Validate payment request data
 * Requirements: 12.4, 12.5, 15.4
 */
export interface PaymentRequestInput {
  orderId: any;
  amount: any;
  gateway: any;
  paymentMethod: any;
  description: any;
  buyerEmail: any;
  returnUrl: any;
  notifyUrl: any;
}

export interface ValidatedPaymentRequest {
  orderId: string;
  amount: number;
  gateway: string;
  paymentMethod: PaymentMethod;
  description: string;
  buyerEmail: string;
  returnUrl: string;
  notifyUrl: string;
}

export function validatePaymentRequest(input: PaymentRequestInput): ValidatedPaymentRequest {
  return {
    orderId: validateOrderId(input.orderId),
    amount: validatePaymentAmount(input.amount),
    gateway: validateGateway(input.gateway),
    paymentMethod: validatePaymentMethod(input.paymentMethod),
    description: validateDescription(input.description),
    buyerEmail: validateEmail(input.buyerEmail),
    returnUrl: validateUrl(input.returnUrl, 'returnUrl'),
    notifyUrl: validateUrl(input.notifyUrl, 'notifyUrl'),
  };
}

/**
 * Validate refund request data
 * Requirements: 12.4, 15.4
 */
export interface RefundRequestInput {
  orderId: any;
  amount: any;
  reason?: any;
}

export interface ValidatedRefundRequest {
  orderId: string;
  amount: number;
  reason: string;
}

export function validateRefundRequest(input: RefundRequestInput): ValidatedRefundRequest {
  return {
    orderId: validateOrderId(input.orderId),
    amount: validatePaymentAmount(input.amount),
    reason: input.reason ? validateDescription(input.reason) : 'Refund requested',
  };
}
