/**
 * Error Handling Middleware
 * Provides centralized error handling and consistent error responses
 * Enhanced with payment error support and sensitive data masking
 * 
 * Validates: Requirements 8.1, 8.3, 14.5
 */

import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { PaymentError, isPaymentError } from '../services/payment/errors';

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  constructor(message: string, public details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * Unauthorized error
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

/**
 * Forbidden error
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

/**
 * Database error
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
  }
}

/**
 * Mask sensitive information in data
 * Prevents exposure of sensitive data in logs and error messages
 * 
 * Validates: Requirements 14.5, 15.7
 */
export function maskSensitiveData(data: any): any {
  if (!data) return data;
  
  // If it's a string, check for sensitive patterns
  if (typeof data === 'string') {
    return maskSensitiveString(data);
  }
  
  // If it's an object, recursively mask fields
  if (typeof data === 'object') {
    const masked: any = Array.isArray(data) ? [] : {};
    
    for (const key in data) {
      // First check if the value itself is an object that needs recursive processing
      if (data[key] !== null && typeof data[key] === 'object') {
        // Recursively process nested objects/arrays
        masked[key] = maskSensitiveData(data[key]);
      } else {
        const lowerKey = key.toLowerCase();
        
        // Mask sensitive fields (only for primitive values)
        if (
          lowerKey.includes('password') ||
          lowerKey.includes('secret') ||
          lowerKey.includes('token') ||
          lowerKey.includes('key') ||
          lowerKey.includes('hash') ||
          lowerKey.includes('iv') ||
          lowerKey.includes('cvv') ||
          lowerKey.includes('pin')
        ) {
          masked[key] = '***MASKED***';
        } else if (typeof data[key] === 'string') {
          masked[key] = maskSensitiveString(data[key]);
        } else {
          masked[key] = data[key];
        }
      }
    }
    
    return masked;
  }
  
  return data;
}

/**
 * Mask sensitive patterns in strings
 */
function maskSensitiveString(str: string): string {
  // Mask credit card numbers (16 digits)
  str = str.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '****-****-****-****');
  
  // Mask email addresses (keep first char and domain)
  str = str.replace(/\b([a-zA-Z])[a-zA-Z0-9._-]*@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g, '$1***@$2');
  
  // Mask phone numbers
  str = str.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '***-***-****');
  
  // Mask API keys (long alphanumeric strings)
  str = str.replace(/\b[a-zA-Z0-9]{32,}\b/g, '***MASKED_KEY***');
  
  return str;
}

/**
 * Log error with masked sensitive data
 */
function logError(err: Error, context?: any) {
  const errorLog: any = {
    name: err.name,
    message: err.message,
    timestamp: new Date().toISOString(),
  };
  
  // Add stack trace in development
  if (process.env.NODE_ENV !== 'production') {
    errorLog.stack = err.stack;
  }
  
  // Add context if provided
  if (context) {
    errorLog.context = maskSensitiveData(context);
  }
  
  // Add error details if available
  if ('details' in err) {
    errorLog.details = maskSensitiveData((err as any).details);
  }
  
  console.error('Error:', errorLog);
}

/**
 * Global error handler
 * Handles all types of errors including payment errors
 * 
 * Validates: Requirements 8.1, 8.3, 14.5
 */
export function errorHandler(err: Error, c: Context) {
  // Log error with masked sensitive data
  logError(err, {
    path: c.req.path,
    method: c.req.method,
    userAgent: c.req.header('user-agent'),
  });

  // Helper function to add CORS headers to response
  const addCorsHeaders = (response: Response) => {
    const origin = c.req.header('origin');
    const allowedOrigins = [
      'https://shopline-one.pages.dev',
      'https://seedlight.tech',
      'https://www.seedlight.tech',
      'http://localhost:3000'
    ];
    
    let allowOrigin = null;
    if (!origin) {
      allowOrigin = '*';
    } else if (origin.match(/^https?:\/\/localhost(:\d+)?$/)) {
      allowOrigin = origin;
    } else if (origin.match(/^https:\/\/[a-z0-9-]+\.shopline-one\.pages\.dev$/)) {
      allowOrigin = origin;
    } else if (allowedOrigins.includes(origin)) {
      allowOrigin = origin;
    }
    
    if (allowOrigin) {
      response.headers.set('Access-Control-Allow-Origin', allowOrigin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Vary', 'Origin');
    }
    
    return response;
  };

  // Handle Payment errors
  if (isPaymentError(err)) {
    const paymentError = err as PaymentError;
    const response = c.json(
      {
        error: paymentError.code,
        message: paymentError.message,
        ...(paymentError.details && { 
          details: maskSensitiveData(paymentError.details) 
        }),
      },
      paymentError.statusCode
    );
    return addCorsHeaders(response);
  }

  // Handle Hono HTTP exceptions
  if (err instanceof HTTPException) {
    const response = c.json(
      {
        error: err.message,
        code: 'HTTP_EXCEPTION'
      },
      err.status
    );
    return addCorsHeaders(response);
  }

  // Handle custom app errors
  if (err instanceof AppError) {
    const responseData: any = {
      error: err.message
    };

    if (err.code) {
      responseData.code = err.code;
    }

    if (err instanceof ValidationError && err.details) {
      responseData.details = maskSensitiveData(err.details);
    }

    const response = c.json(responseData, err.statusCode);
    return addCorsHeaders(response);
  }

  // Handle database errors
  if (err.message && err.message.includes('SQLITE')) {
    const response = c.json(
      {
        error: 'Database error',
        code: 'DATABASE_ERROR'
      },
      500
    );
    return addCorsHeaders(response);
  }

  // Handle generic errors - don't expose internal details
  const response = c.json(
    {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    },
    500
  );
  return addCorsHeaders(response);
}

/**
 * Not found handler
 */
export function notFoundHandler(c: Context) {
  const response = c.json(
    {
      error: 'Not found',
      code: 'NOT_FOUND',
      path: c.req.path
    },
    404
  );
  
  // Add CORS headers
  const origin = c.req.header('origin');
  const allowedOrigins = [
    'https://shopline-one.pages.dev',
    'https://seedlight.tech',
    'https://www.seedlight.tech',
    'http://localhost:3000'
  ];
  
  let allowOrigin = null;
  if (!origin) {
    allowOrigin = '*';
  } else if (origin.match(/^https?:\/\/localhost(:\d+)?$/)) {
    allowOrigin = origin;
  } else if (origin.match(/^https:\/\/[a-z0-9-]+\.shopline-one\.pages\.dev$/)) {
    allowOrigin = origin;
  } else if (allowedOrigins.includes(origin)) {
    allowOrigin = origin;
  }
  
  if (allowOrigin) {
    response.headers.set('Access-Control-Allow-Origin', allowOrigin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Vary', 'Origin');
  }
  
  return response;
}

/**
 * Async handler wrapper
 * Catches async errors and passes them to error handler
 */
export function asyncHandler(
  fn: (c: Context) => Promise<Response>
) {
  return async (c: Context) => {
    try {
      return await fn(c);
    } catch (error) {
      return errorHandler(error as Error, c);
    }
  };
}
