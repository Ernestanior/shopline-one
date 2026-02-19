/**
 * Retry Utility Functions
 * Provides retry logic with exponential backoff for network operations
 * 
 * Validates: Requirements 8.5
 */

/**
 * Retry configuration options
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Initial delay in milliseconds */
  initialDelay?: number;
  /** Maximum delay in milliseconds */
  maxDelay?: number;
  /** Backoff multiplier */
  backoffMultiplier?: number;
  /** Function to determine if error is retryable */
  isRetryable?: (error: any) => boolean;
  /** Callback called before each retry */
  onRetry?: (attempt: number, error: any) => void;
}

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  isRetryable: (error: any) => {
    // By default, retry on network errors and 5xx status codes
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return true;
    }
    if (error.statusCode >= 500 && error.statusCode < 600) {
      return true;
    }
    return false;
  },
  onRetry: () => {},
};

/**
 * Retry a function with exponential backoff
 * 
 * @param fn - The async function to retry
 * @param options - Retry configuration options
 * @returns Promise that resolves with the function result or rejects with the last error
 * 
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   async () => fetch('https://api.example.com/data'),
 *   { maxRetries: 3, initialDelay: 1000 }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;
  let delay = config.initialDelay;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // Try to execute the function
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt === config.maxRetries || !config.isRetryable(error)) {
        throw error;
      }

      // Call onRetry callback
      config.onRetry(attempt + 1, error);

      // Wait before retrying
      await sleep(delay);

      // Calculate next delay with exponential backoff
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry with jitter to avoid thundering herd problem
 * Adds random jitter to the delay
 */
export async function retryWithJitter<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;
  let baseDelay = config.initialDelay;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === config.maxRetries || !config.isRetryable(error)) {
        throw error;
      }

      config.onRetry(attempt + 1, error);

      // Add jitter: random value between 0 and baseDelay
      const jitter = Math.random() * baseDelay;
      const delay = Math.min(baseDelay + jitter, config.maxDelay);

      await sleep(delay);

      baseDelay = Math.min(baseDelay * config.backoffMultiplier, config.maxDelay);
    }
  }

  throw lastError;
}

/**
 * Create a retryable version of a function
 * Returns a new function that automatically retries on failure
 */
export function makeRetryable<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): T {
  return ((...args: any[]) => {
    return retryWithBackoff(() => fn(...args), options);
  }) as T;
}

/**
 * Retry specifically for HTTP requests
 * Includes default retry logic for common HTTP errors
 */
export async function retryHttpRequest<T>(
  fn: () => Promise<T>,
  options: Omit<RetryOptions, 'isRetryable'> & {
    retryOn?: number[];
  } = {}
): Promise<T> {
  const { retryOn = [408, 429, 500, 502, 503, 504], ...retryOptions } = options;

  return retryWithBackoff(fn, {
    ...retryOptions,
    isRetryable: (error: any) => {
      // Retry on network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return true;
      }
      
      // Retry on specific status codes
      if (error.statusCode && retryOn.includes(error.statusCode)) {
        return true;
      }
      
      // Retry on timeout
      if (error.name === 'TimeoutError') {
        return true;
      }
      
      return false;
    },
  });
}

/**
 * Circuit breaker state
 */
enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

/**
 * Circuit breaker options
 */
export interface CircuitBreakerOptions {
  /** Number of failures before opening circuit */
  failureThreshold?: number;
  /** Time in ms to wait before attempting to close circuit */
  resetTimeout?: number;
  /** Number of successful calls needed to close circuit from half-open */
  successThreshold?: number;
}

/**
 * Circuit breaker implementation
 * Prevents cascading failures by stopping requests when service is down
 */
export class CircuitBreaker<T> {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private nextAttempt = Date.now();
  
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly successThreshold: number;

  constructor(
    private fn: () => Promise<T>,
    options: CircuitBreakerOptions = {}
  ) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.successThreshold = options.successThreshold || 2;
  }

  async execute(): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      // Try to recover
      this.state = CircuitState.HALF_OPEN;
      this.successCount = 0;
    }

    try {
      const result = await this.fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.successCount = 0;

    if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.resetTimeout;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
  }
}
