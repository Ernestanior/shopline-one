/**
 * Error Handling Middleware
 * Provides centralized error handling and consistent error responses
 */

import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

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
 * Global error handler
 */
export function errorHandler(err: Error, c: Context) {
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: err.stack
  });

  // Handle Hono HTTP exceptions
  if (err instanceof HTTPException) {
    return c.json(
      {
        error: err.message,
        code: 'HTTP_EXCEPTION'
      },
      err.status
    );
  }

  // Handle custom app errors
  if (err instanceof AppError) {
    const response: any = {
      error: err.message
    };

    if (err.code) {
      response.code = err.code;
    }

    if (err instanceof ValidationError && err.details) {
      response.details = err.details;
    }

    return c.json(response, err.statusCode);
  }

  // Handle database errors
  if (err.message && err.message.includes('SQLITE')) {
    return c.json(
      {
        error: 'Database error',
        code: 'DATABASE_ERROR'
      },
      500
    );
  }

  // Handle generic errors
  return c.json(
    {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    },
    500
  );
}

/**
 * Not found handler
 */
export function notFoundHandler(c: Context) {
  return c.json(
    {
      error: 'Not found',
      code: 'NOT_FOUND',
      path: c.req.path
    },
    404
  );
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
