/**
 * Error Handling Tests
 * Tests error handling, retry logic, and timeout handling
 * 
 * Validates: Requirements 8.1, 8.2, 8.3, 8.5
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  PaymentError, 
  ErrorCodes, 
  createPaymentError,
  isPaymentError,
  toPaymentError 
} from '../services/payment/errors';
import { 
  retryWithBackoff, 
  retryWithJitter,
  retryHttpRequest,
  makeRetryable,
  CircuitBreaker 
} from '../utils/retry';
import { 
  withTimeout, 
  TimeoutError,
  withTimeoutAndRetry,
  fetchWithTimeout 
} from '../utils/timeout';
import { maskSensitiveData } from '../middleware/error';

describe('Payment Error Handling', () => {
  describe('PaymentError Class', () => {
    test('should create payment error with code and status', () => {
      const error = new PaymentError('Test error', ErrorCodes.INVALID_AMOUNT, 400);
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ErrorCodes.INVALID_AMOUNT);
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('PaymentError');
    });

    test('should include details in error', () => {
      const details = { field: 'amount', value: -100 };
      const error = new PaymentError('Invalid amount', ErrorCodes.INVALID_AMOUNT, 400, details);
      
      expect(error.details).toEqual(details);
    });

    test('should convert to JSON format', () => {
      const error = new PaymentError('Test error', ErrorCodes.GATEWAY_ERROR, 502, { gateway: 'test' });
      const json = error.toJSON();
      
      expect(json).toEqual({
        error: ErrorCodes.GATEWAY_ERROR,
        message: 'Test error',
        details: { gateway: 'test' },
      });
    });
  });

  describe('Error Code Helpers', () => {
    test('should create payment error with predefined code', () => {
      const error = createPaymentError(ErrorCodes.ORDER_NOT_FOUND);
      
      expect(error.code).toBe(ErrorCodes.ORDER_NOT_FOUND);
      expect(error.statusCode).toBe(404);
      expect(error.message).toContain('Order not found');
    });

    test('should use custom message when provided', () => {
      const error = createPaymentError(ErrorCodes.GATEWAY_ERROR, 'Custom gateway error');
      
      expect(error.message).toBe('Custom gateway error');
    });

    test('should check if error is PaymentError', () => {
      const paymentError = new PaymentError('Test', ErrorCodes.INTERNAL_ERROR);
      const standardError = new Error('Test');
      
      expect(isPaymentError(paymentError)).toBe(true);
      expect(isPaymentError(standardError)).toBe(false);
    });

    test('should convert standard error to PaymentError', () => {
      const standardError = new Error('Standard error');
      const paymentError = toPaymentError(standardError);
      
      expect(isPaymentError(paymentError)).toBe(true);
      expect(paymentError.code).toBe(ErrorCodes.INTERNAL_ERROR);
      expect(paymentError.message).toBe('Standard error');
    });
  });
});

describe('Sensitive Data Masking', () => {
  test('should mask password fields', () => {
    const data = {
      username: 'user123',
      password: 'secret123',
      email: 'user@example.com',
    };
    
    const masked = maskSensitiveData(data);
    
    expect(masked.username).toBe('user123');
    expect(masked.password).toBe('***MASKED***');
    expect(masked.email).toContain('@example.com');
  });

  test('should mask API keys and tokens', () => {
    const data = {
      apiKey: 'sk_test_1234567890abcdef',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
      hashKey: 'secret-hash-key',
    };
    
    const masked = maskSensitiveData(data);
    
    expect(masked.apiKey).toBe('***MASKED***');
    expect(masked.token).toBe('***MASKED***');
    expect(masked.hashKey).toBe('***MASKED***');
  });

  test('should mask credit card numbers in strings', () => {
    const data = 'Card number: 4532-1234-5678-9010';
    const masked = maskSensitiveData(data);
    
    expect(masked).toContain('****-****-****-****');
    expect(masked).not.toContain('4532');
  });

  test('should recursively mask nested objects', () => {
    const data = {
      user: {
        name: 'John',
        credentials: {
          password: 'secret',
          apiKey: 'key123',
        },
      },
    };
    
    const masked = maskSensitiveData(data);
    
    // Debug: log the masked data
    console.log('Masked data:', JSON.stringify(masked, null, 2));
    
    expect(masked.user.name).toBe('John');
    expect(masked.user.credentials).toBeDefined();
    expect(masked.user.credentials.password).toBe('***MASKED***');
    expect(masked.user.credentials.apiKey).toBe('***MASKED***');
  });

  test('should handle arrays', () => {
    const data = [
      { password: 'secret1' },
      { password: 'secret2' },
    ];
    
    const masked = maskSensitiveData(data);
    
    expect(masked[0].password).toBe('***MASKED***');
    expect(masked[1].password).toBe('***MASKED***');
  });
});

describe('Retry Logic', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('should succeed on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    
    const result = await retryWithBackoff(fn);
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('should retry on failure and eventually succeed', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValue('success');
    
    const promise = retryWithBackoff(fn, { 
      maxRetries: 3,
      initialDelay: 1000,
      isRetryable: () => true,
    });
    
    // Fast-forward through retries
    await vi.advanceTimersByTimeAsync(1000); // First retry
    await vi.advanceTimersByTimeAsync(2000); // Second retry
    
    const result = await promise;
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  test('should stop retrying after max attempts', async () => {
    const error = new Error('Persistent failure');
    const fn = vi.fn().mockRejectedValue(error);
    
    const promise = retryWithBackoff(fn, { 
      maxRetries: 2,
      initialDelay: 100,
      isRetryable: () => true,
    });
    
    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(200);
    
    await expect(promise).rejects.toThrow('Persistent failure');
    expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  test('should not retry non-retryable errors', async () => {
    const error = new PaymentError('Validation error', ErrorCodes.INVALID_AMOUNT, 400);
    const fn = vi.fn().mockRejectedValue(error);
    
    await expect(
      retryWithBackoff(fn, {
        isRetryable: (err) => err.statusCode >= 500,
      })
    ).rejects.toThrow('Validation error');
    
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('should call onRetry callback', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Fail'))
      .mockResolvedValue('success');
    
    const onRetry = vi.fn();
    
    const promise = retryWithBackoff(fn, {
      maxRetries: 2,
      initialDelay: 100,
      isRetryable: () => true,
      onRetry,
    });
    
    await vi.advanceTimersByTimeAsync(100);
    await promise;
    
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
  });

  test('should use exponential backoff', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValue('success');
    
    const promise = retryWithBackoff(fn, {
      maxRetries: 3,
      initialDelay: 1000,
      backoffMultiplier: 2,
      isRetryable: () => true,
    });
    
    // First retry after 1000ms
    await vi.advanceTimersByTimeAsync(1000);
    expect(fn).toHaveBeenCalledTimes(2);
    
    // Second retry after 2000ms (exponential backoff)
    await vi.advanceTimersByTimeAsync(2000);
    expect(fn).toHaveBeenCalledTimes(3);
    
    await promise;
  });
});

describe('Retry with Jitter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('should add jitter to delay', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Fail'))
      .mockResolvedValue('success');
    
    // Mock Math.random to return predictable value
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    
    const promise = retryWithJitter(fn, {
      maxRetries: 2,
      initialDelay: 1000,
      isRetryable: () => true,
    });
    
    // Jitter adds 0.5 * 1000 = 500ms, so total delay is 1500ms
    await vi.advanceTimersByTimeAsync(1500);
    await promise;
    
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('HTTP Request Retry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('should retry on 5xx errors', async () => {
    const error503 = Object.assign(new Error('Service Unavailable'), { statusCode: 503 });
    const fn = vi.fn()
      .mockRejectedValueOnce(error503)
      .mockResolvedValue('success');
    
    const promise = retryHttpRequest(fn, {
      maxRetries: 2,
      initialDelay: 100,
    });
    
    await vi.advanceTimersByTimeAsync(100);
    const result = await promise;
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('should retry on 429 (rate limit)', async () => {
    const error429 = Object.assign(new Error('Too Many Requests'), { statusCode: 429 });
    const fn = vi.fn()
      .mockRejectedValueOnce(error429)
      .mockResolvedValue('success');
    
    const promise = retryHttpRequest(fn, {
      maxRetries: 2,
      initialDelay: 100,
    });
    
    await vi.advanceTimersByTimeAsync(100);
    const result = await promise;
    
    expect(result).toBe('success');
  });

  test('should not retry on 4xx errors (except 429)', async () => {
    const error400 = Object.assign(new Error('Bad Request'), { statusCode: 400 });
    const fn = vi.fn().mockRejectedValue(error400);
    
    await expect(retryHttpRequest(fn)).rejects.toThrow('Bad Request');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('Circuit Breaker', () => {
  test('should allow requests when circuit is closed', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const breaker = new CircuitBreaker(fn, { failureThreshold: 3 });
    
    const result = await breaker.execute();
    
    expect(result).toBe('success');
    expect(breaker.getState()).toBe('CLOSED');
  });

  test('should open circuit after threshold failures', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Failure'));
    const breaker = new CircuitBreaker(fn, { failureThreshold: 3 });
    
    // Fail 3 times to open circuit
    await expect(breaker.execute()).rejects.toThrow('Failure');
    await expect(breaker.execute()).rejects.toThrow('Failure');
    await expect(breaker.execute()).rejects.toThrow('Failure');
    
    expect(breaker.getState()).toBe('OPEN');
    
    // Next request should fail immediately
    await expect(breaker.execute()).rejects.toThrow('Circuit breaker is OPEN');
  });

  test('should transition to half-open after reset timeout', async () => {
    vi.useFakeTimers();
    
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Fail'))
      .mockRejectedValueOnce(new Error('Fail'))
      .mockRejectedValueOnce(new Error('Fail'))
      .mockResolvedValue('success');
    
    const breaker = new CircuitBreaker(fn, { 
      failureThreshold: 3,
      resetTimeout: 5000,
    });
    
    // Open the circuit
    await expect(breaker.execute()).rejects.toThrow();
    await expect(breaker.execute()).rejects.toThrow();
    await expect(breaker.execute()).rejects.toThrow();
    
    expect(breaker.getState()).toBe('OPEN');
    
    // Wait for reset timeout
    vi.advanceTimersByTime(5000);
    
    // Should transition to half-open and allow request
    const result = await breaker.execute();
    expect(result).toBe('success');
    
    vi.restoreAllMocks();
  });
});

describe('Timeout Handling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('should resolve if promise completes before timeout', async () => {
    const promise = new Promise(resolve => setTimeout(() => resolve('success'), 1000));
    
    const timeoutPromise = withTimeout(promise, 2000);
    
    vi.advanceTimersByTime(1000);
    const result = await timeoutPromise;
    
    expect(result).toBe('success');
  });

  test('should reject with TimeoutError if timeout expires', async () => {
    const promise = new Promise(resolve => setTimeout(() => resolve('success'), 3000));
    
    const timeoutPromise = withTimeout(promise, 1000, 'Custom timeout message');
    
    vi.advanceTimersByTime(1000);
    
    await expect(timeoutPromise).rejects.toThrow(TimeoutError);
    await expect(timeoutPromise).rejects.toThrow('Custom timeout message');
  });

  test('should use default error message if not provided', async () => {
    const promise = new Promise(resolve => setTimeout(() => resolve('success'), 3000));
    
    const timeoutPromise = withTimeout(promise, 1000);
    
    vi.advanceTimersByTime(1000);
    
    await expect(timeoutPromise).rejects.toThrow('Operation timed out after 1000ms');
  });
});

describe('Timeout with Retry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('should retry on timeout', async () => {
    let attempt = 0;
    const fn = vi.fn().mockImplementation(() => {
      attempt++;
      return new Promise(resolve => {
        if (attempt < 3) {
          setTimeout(() => resolve('too slow'), 2000);
        } else {
          setTimeout(() => resolve('success'), 500);
        }
      });
    });
    
    const promise = withTimeoutAndRetry(fn, 1000, 3);
    
    // First attempt times out
    vi.advanceTimersByTime(1000);
    await vi.advanceTimersByTimeAsync(1000); // Wait for retry delay
    
    // Second attempt times out
    vi.advanceTimersByTime(1000);
    await vi.advanceTimersByTimeAsync(2000); // Wait for retry delay
    
    // Third attempt succeeds
    vi.advanceTimersByTime(500);
    
    const result = await promise;
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });
});

describe('Make Retryable', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('should create retryable version of function', async () => {
    const originalFn = vi.fn()
      .mockRejectedValueOnce(new Error('Fail'))
      .mockResolvedValue('success');
    
    const retryableFn = makeRetryable(originalFn, {
      maxRetries: 2,
      initialDelay: 100,
      isRetryable: () => true,
    });
    
    const promise = retryableFn('arg1', 'arg2');
    
    await vi.advanceTimersByTimeAsync(100);
    const result = await promise;
    
    expect(result).toBe('success');
    expect(originalFn).toHaveBeenCalledTimes(2);
    expect(originalFn).toHaveBeenCalledWith('arg1', 'arg2');
  });
});
