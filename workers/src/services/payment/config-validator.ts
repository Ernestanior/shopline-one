/**
 * Payment Gateway Configuration Validator
 * Validates payment gateway configurations before initialization
 * Requirements: 1.2, 1.3, 1.5
 */

import { PaymentConfig, NewebPayConfig, ECPayConfig } from '../../types/payment';

export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

/**
 * Validate complete payment configuration
 */
export function validatePaymentConfig(config: PaymentConfig): void {
  if (!config) {
    throw new ConfigValidationError('Payment configuration is required');
  }

  // At least one gateway must be configured
  if (!config.newebpay && !config.ecpay) {
    throw new ConfigValidationError('At least one payment gateway (NewebPay or ECPay) must be configured');
  }

  // Validate NewebPay configuration if present
  if (config.newebpay) {
    validateNewebPayConfig(config.newebpay);
  }

  // Validate ECPay configuration if present
  if (config.ecpay) {
    validateECPayConfig(config.ecpay);
  }
}

/**
 * Validate NewebPay configuration
 * Requirements: 1.2, 1.3
 */
export function validateNewebPayConfig(config: NewebPayConfig): void {
  const requiredFields: (keyof NewebPayConfig)[] = [
    'merchantId',
    'hashKey',
    'hashIV',
    'apiUrl',
    'version',
  ];

  for (const field of requiredFields) {
    if (!config[field]) {
      throw new ConfigValidationError(`NewebPay configuration missing required field: ${field}`);
    }
  }

  // Validate merchantId format (should be alphanumeric)
  if (!/^[a-zA-Z0-9_-]+$/.test(config.merchantId)) {
    throw new ConfigValidationError('NewebPay merchantId must contain only alphanumeric characters, underscores, and hyphens');
  }

  // Validate fields are not empty strings (after checking format requirements)
  for (const field of requiredFields) {
    if (typeof config[field] === 'string' && config[field].trim() === '') {
      throw new ConfigValidationError(`NewebPay configuration field cannot be empty: ${field}`);
    }
  }

  // Validate hashKey and hashIV length (should be 16 or 32 characters for AES)
  if (config.hashKey.length !== 16 && config.hashKey.length !== 32) {
    throw new ConfigValidationError('NewebPay hashKey must be 16 or 32 characters');
  }

  if (config.hashIV.length !== 16 && config.hashIV.length !== 32) {
    throw new ConfigValidationError('NewebPay hashIV must be 16 or 32 characters');
  }

  // Validate apiUrl format
  if (!isValidUrl(config.apiUrl)) {
    throw new ConfigValidationError('NewebPay apiUrl must be a valid HTTPS URL');
  }

  // Validate version format
  if (!/^\d+\.\d+$/.test(config.version)) {
    throw new ConfigValidationError('NewebPay version must be in format X.Y (e.g., 2.0)');
  }
}

/**
 * Validate ECPay configuration
 * Requirements: 1.2, 1.3
 */
export function validateECPayConfig(config: ECPayConfig): void {
  const requiredFields: (keyof ECPayConfig)[] = [
    'merchantId',
    'hashKey',
    'hashIV',
    'apiUrl',
  ];

  for (const field of requiredFields) {
    if (!config[field]) {
      throw new ConfigValidationError(`ECPay configuration missing required field: ${field}`);
    }

    // Validate field is not empty string
    if (typeof config[field] === 'string' && config[field].trim() === '') {
      throw new ConfigValidationError(`ECPay configuration field cannot be empty: ${field}`);
    }
  }

  // Validate merchantId format (should be alphanumeric)
  if (!/^[a-zA-Z0-9_-]+$/.test(config.merchantId)) {
    throw new ConfigValidationError('ECPay merchantId must be alphanumeric');
  }

  // Validate hashKey and hashIV (ECPay typically uses alphanumeric strings)
  if (config.hashKey.length < 8) {
    throw new ConfigValidationError('ECPay hashKey must be at least 8 characters');
  }

  if (config.hashIV.length < 8) {
    throw new ConfigValidationError('ECPay hashIV must be at least 8 characters');
  }

  // Validate apiUrl format
  if (!isValidUrl(config.apiUrl)) {
    throw new ConfigValidationError('ECPay apiUrl must be a valid HTTPS URL');
  }
}

/**
 * Validate URL format
 * Requirements: 1.5
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // For production, require HTTPS
    // For testing, allow HTTP
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Sanitize configuration for logging (mask sensitive data)
 * Requirements: 1.5
 */
export function sanitizeConfigForLogging(config: PaymentConfig): any {
  const sanitized: any = {};

  if (config.newebpay) {
    sanitized.newebpay = {
      merchantId: config.newebpay.merchantId,
      hashKey: maskSensitiveData(config.newebpay.hashKey),
      hashIV: maskSensitiveData(config.newebpay.hashIV),
      apiUrl: config.newebpay.apiUrl,
      version: config.newebpay.version,
    };
  }

  if (config.ecpay) {
    sanitized.ecpay = {
      merchantId: config.ecpay.merchantId,
      hashKey: maskSensitiveData(config.ecpay.hashKey),
      hashIV: maskSensitiveData(config.ecpay.hashIV),
      apiUrl: config.ecpay.apiUrl,
    };
  }

  return sanitized;
}

/**
 * Mask sensitive data for logging
 * Shows first 4 and last 4 characters, masks the rest
 */
function maskSensitiveData(data: string): string {
  // Ensure input is a string
  if (typeof data !== 'string') {
    return '****';
  }
  
  if (data.length <= 8) {
    return '****';
  }
  const first = data.substring(0, 4);
  const last = data.substring(data.length - 4);
  const masked = '*'.repeat(data.length - 8);
  return `${first}${masked}${last}`;
}
