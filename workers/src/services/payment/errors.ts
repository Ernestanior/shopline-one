/**
 * Payment Error Classes and Error Codes
 * Defines all error types and codes for payment operations
 * 
 * Validates: Requirements 8.1
 */

/**
 * Custom error class for payment-related errors
 */
export class PaymentError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message);
    this.name = 'PaymentError';
    
    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PaymentError);
    }
  }

  /**
   * Convert error to JSON format for API responses
   */
  toJSON() {
    return {
      error: this.code,
      message: this.message,
      ...(this.details && { details: this.details }),
    };
  }
}

/**
 * Error codes for payment operations
 * Organized by category for easy reference
 */
export const ErrorCodes = {
  // Configuration Errors (1xxx)
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  GATEWAY_NOT_FOUND: 'GATEWAY_NOT_FOUND',
  INVALID_CONFIGURATION: 'INVALID_CONFIGURATION',
  MISSING_CONFIGURATION: 'MISSING_CONFIGURATION',
  
  // Validation Errors (2xxx)
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  INVALID_PAYMENT_METHOD: 'INVALID_PAYMENT_METHOD',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_PARAMETER: 'INVALID_PARAMETER',
  AMOUNT_MISMATCH: 'AMOUNT_MISMATCH',
  
  // Gateway Errors (3xxx)
  GATEWAY_TIMEOUT: 'GATEWAY_TIMEOUT',
  GATEWAY_ERROR: 'GATEWAY_ERROR',
  GATEWAY_UNAVAILABLE: 'GATEWAY_UNAVAILABLE',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  ENCRYPTION_ERROR: 'ENCRYPTION_ERROR',
  
  // Business Logic Errors (4xxx)
  ORDER_ALREADY_PAID: 'ORDER_ALREADY_PAID',
  DUPLICATE_PAYMENT: 'DUPLICATE_PAYMENT',
  REFUND_AMOUNT_EXCEEDED: 'REFUND_AMOUNT_EXCEEDED',
  PAYMENT_NOT_FOUND: 'PAYMENT_NOT_FOUND',
  PAYMENT_NOT_PAID: 'PAYMENT_NOT_PAID',
  PAYMENT_EXPIRED: 'PAYMENT_EXPIRED',
  REFUND_NOT_ALLOWED: 'REFUND_NOT_ALLOWED',
  
  // Security Errors (5xxx)
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  CSRF_VALIDATION_FAILED: 'CSRF_VALIDATION_FAILED',
  INVALID_IP_ADDRESS: 'INVALID_IP_ADDRESS',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  
  // Internal Errors (9xxx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

/**
 * Error messages for each error code
 * Provides user-friendly messages
 */
export const ErrorMessages: Record<string, string> = {
  // Configuration
  [ErrorCodes.INVALID_CREDENTIALS]: 'Invalid payment gateway credentials',
  [ErrorCodes.GATEWAY_NOT_FOUND]: 'Payment gateway not found or not configured',
  [ErrorCodes.INVALID_CONFIGURATION]: 'Invalid payment gateway configuration',
  [ErrorCodes.MISSING_CONFIGURATION]: 'Missing required payment gateway configuration',
  
  // Validation
  [ErrorCodes.INVALID_AMOUNT]: 'Invalid payment amount',
  [ErrorCodes.ORDER_NOT_FOUND]: 'Order not found',
  [ErrorCodes.INVALID_PAYMENT_METHOD]: 'Invalid payment method',
  [ErrorCodes.MISSING_REQUIRED_FIELD]: 'Missing required field',
  [ErrorCodes.INVALID_PARAMETER]: 'Invalid parameter',
  [ErrorCodes.AMOUNT_MISMATCH]: 'Payment amount does not match order total',
  
  // Gateway
  [ErrorCodes.GATEWAY_TIMEOUT]: 'Payment gateway request timed out',
  [ErrorCodes.GATEWAY_ERROR]: 'Payment gateway returned an error',
  [ErrorCodes.GATEWAY_UNAVAILABLE]: 'Payment gateway is currently unavailable',
  [ErrorCodes.INVALID_SIGNATURE]: 'Invalid payment signature',
  [ErrorCodes.INVALID_RESPONSE]: 'Invalid response from payment gateway',
  [ErrorCodes.ENCRYPTION_ERROR]: 'Encryption/decryption error',
  
  // Business Logic
  [ErrorCodes.ORDER_ALREADY_PAID]: 'Order has already been paid',
  [ErrorCodes.DUPLICATE_PAYMENT]: 'Duplicate payment attempt detected',
  [ErrorCodes.REFUND_AMOUNT_EXCEEDED]: 'Refund amount exceeds payment amount',
  [ErrorCodes.PAYMENT_NOT_FOUND]: 'Payment transaction not found',
  [ErrorCodes.PAYMENT_NOT_PAID]: 'Payment has not been completed',
  [ErrorCodes.PAYMENT_EXPIRED]: 'Payment has expired',
  [ErrorCodes.REFUND_NOT_ALLOWED]: 'Refund is not allowed for this payment',
  
  // Security
  [ErrorCodes.UNAUTHORIZED]: 'Authentication required',
  [ErrorCodes.FORBIDDEN]: 'Access forbidden',
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded, please try again later',
  [ErrorCodes.CSRF_VALIDATION_FAILED]: 'CSRF token validation failed',
  [ErrorCodes.INVALID_IP_ADDRESS]: 'Request from invalid IP address',
  [ErrorCodes.SUSPICIOUS_ACTIVITY]: 'Suspicious activity detected',
  
  // Internal
  [ErrorCodes.INTERNAL_ERROR]: 'An internal error occurred',
  [ErrorCodes.DATABASE_ERROR]: 'Database operation failed',
  [ErrorCodes.UNKNOWN_ERROR]: 'An unknown error occurred',
};

/**
 * Helper function to create a PaymentError with predefined code
 */
export function createPaymentError(
  code: string,
  customMessage?: string,
  statusCode?: number,
  details?: any
): PaymentError {
  const message = customMessage || ErrorMessages[code] || ErrorMessages[ErrorCodes.UNKNOWN_ERROR];
  const status = statusCode || getDefaultStatusCode(code);
  return new PaymentError(message, code, status, details);
}

/**
 * Get default HTTP status code for error code
 */
function getDefaultStatusCode(code: string): number {
  // Configuration errors
  if (code.startsWith('INVALID_') && code.includes('CREDENTIALS')) return 500;
  if (code.includes('CONFIGURATION')) return 500;
  if (code === ErrorCodes.GATEWAY_NOT_FOUND) return 500;
  
  // Validation errors
  if (code === ErrorCodes.ORDER_NOT_FOUND) return 404;
  if (code === ErrorCodes.PAYMENT_NOT_FOUND) return 404;
  if (code.includes('INVALID_') || code.includes('MISSING_')) return 400;
  if (code === ErrorCodes.AMOUNT_MISMATCH) return 400;
  
  // Gateway errors
  if (code === ErrorCodes.GATEWAY_TIMEOUT) return 504;
  if (code === ErrorCodes.GATEWAY_UNAVAILABLE) return 503;
  if (code.includes('GATEWAY_')) return 502;
  
  // Business logic errors
  if (code === ErrorCodes.ORDER_ALREADY_PAID) return 409;
  if (code === ErrorCodes.DUPLICATE_PAYMENT) return 409;
  if (code.includes('REFUND_')) return 400;
  if (code === ErrorCodes.PAYMENT_EXPIRED) return 410;
  
  // Security errors
  if (code === ErrorCodes.UNAUTHORIZED) return 401;
  if (code === ErrorCodes.FORBIDDEN) return 403;
  if (code === ErrorCodes.RATE_LIMIT_EXCEEDED) return 429;
  if (code.includes('CSRF_') || code.includes('INVALID_IP')) return 403;
  
  // Internal errors
  if (code.includes('DATABASE_')) return 500;
  if (code === ErrorCodes.INTERNAL_ERROR) return 500;
  
  // Default
  return 500;
}

/**
 * Check if an error is a PaymentError
 */
export function isPaymentError(error: any): error is PaymentError {
  return error instanceof PaymentError;
}

/**
 * Convert any error to PaymentError
 */
export function toPaymentError(error: any): PaymentError {
  if (isPaymentError(error)) {
    return error;
  }
  
  // Handle standard errors
  if (error instanceof Error) {
    return new PaymentError(
      error.message,
      ErrorCodes.INTERNAL_ERROR,
      500,
      { originalError: error.name }
    );
  }
  
  // Handle unknown errors
  return new PaymentError(
    'An unknown error occurred',
    ErrorCodes.UNKNOWN_ERROR,
    500,
    { originalError: String(error) }
  );
}
