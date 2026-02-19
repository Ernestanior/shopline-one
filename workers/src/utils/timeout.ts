/**
 * Timeout Utility Functions
 * Provides timeout handling for async operations
 * 
 * Validates: Requirements 8.2
 */

/**
 * Custom timeout error
 */
export class TimeoutError extends Error {
  constructor(message: string = 'Operation timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Execute a promise with a timeout
 * If the promise doesn't resolve within the timeout, it will be rejected
 * 
 * @param promise - The promise to execute
 * @param timeoutMs - Timeout in milliseconds
 * @param errorMessage - Custom error message for timeout
 * @returns Promise that resolves with the result or rejects with TimeoutError
 * 
 * @example
 * ```typescript
 * const result = await withTimeout(
 *   fetch('https://api.example.com/data'),
 *   5000,
 *   'API request timed out'
 * );
 * ```
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage?: string
): Promise<T> {
  let timeoutId: NodeJS.Timeout | number;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(errorMessage || `Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId as NodeJS.Timeout);
    return result;
  } catch (error) {
    clearTimeout(timeoutId as NodeJS.Timeout);
    throw error;
  }
}

/**
 * Create a timeout wrapper for a function
 * Returns a new function that automatically applies timeout
 * 
 * @param fn - The async function to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param errorMessage - Custom error message for timeout
 * @returns Wrapped function with timeout
 */
export function withTimeoutWrapper<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  timeoutMs: number,
  errorMessage?: string
): T {
  return ((...args: any[]) => {
    return withTimeout(fn(...args), timeoutMs, errorMessage);
  }) as T;
}

/**
 * Execute multiple promises with individual timeouts
 * Each promise has its own timeout, and the function returns results for all promises
 * 
 * @param promises - Array of promises with their timeout configurations
 * @returns Promise that resolves with array of results (or errors)
 */
export async function withTimeoutAll<T>(
  promises: Array<{
    promise: Promise<T>;
    timeout: number;
    errorMessage?: string;
  }>
): Promise<Array<{ success: boolean; result?: T; error?: Error }>> {
  const wrappedPromises = promises.map(async ({ promise, timeout, errorMessage }) => {
    try {
      const result = await withTimeout(promise, timeout, errorMessage);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  });

  return Promise.all(wrappedPromises);
}

/**
 * Execute a function with retry and timeout
 * Combines timeout handling with retry logic
 * 
 * @param fn - The async function to execute
 * @param timeoutMs - Timeout for each attempt in milliseconds
 * @param maxRetries - Maximum number of retry attempts
 * @param errorMessage - Custom error message for timeout
 * @returns Promise that resolves with the result or rejects with error
 */
export async function withTimeoutAndRetry<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  maxRetries: number = 3,
  errorMessage?: string
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await withTimeout(fn(), timeoutMs, errorMessage);
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry if it's not a timeout error
      if (!(error instanceof TimeoutError) && attempt < maxRetries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  throw lastError!;
}

/**
 * Create an AbortController with timeout
 * Useful for fetch requests that support AbortSignal
 * 
 * @param timeoutMs - Timeout in milliseconds
 * @returns Object with AbortController and cleanup function
 * 
 * @example
 * ```typescript
 * const { controller, cleanup } = createAbortTimeout(5000);
 * try {
 *   const response = await fetch(url, { signal: controller.signal });
 *   cleanup();
 *   return response;
 * } catch (error) {
 *   cleanup();
 *   throw error;
 * }
 * ```
 */
export function createAbortTimeout(timeoutMs: number): {
  controller: AbortController;
  cleanup: () => void;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  return {
    controller,
    cleanup: () => clearTimeout(timeoutId),
  };
}

/**
 * Fetch with timeout using AbortController
 * Wrapper around fetch that adds timeout support
 * 
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param timeoutMs - Timeout in milliseconds (default: 30000)
 * @returns Promise that resolves with Response or rejects with TimeoutError
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 30000
): Promise<Response> {
  const { controller, cleanup } = createAbortTimeout(timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    cleanup();
    return response;
  } catch (error) {
    cleanup();
    
    // Convert AbortError to TimeoutError
    if ((error as Error).name === 'AbortError') {
      throw new TimeoutError(`Request to ${url} timed out after ${timeoutMs}ms`);
    }
    
    throw error;
  }
}

/**
 * Debounce a function with timeout
 * Delays execution until after timeout has elapsed since last call
 * 
 * @param fn - The function to debounce
 * @param timeoutMs - Debounce timeout in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  timeoutMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | number;

  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId as NodeJS.Timeout);
    timeoutId = setTimeout(() => fn.apply(this, args), timeoutMs);
  };
}

/**
 * Throttle a function with timeout
 * Ensures function is called at most once per timeout period
 * 
 * @param fn - The function to throttle
 * @param timeoutMs - Throttle timeout in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  timeoutMs: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    if (now - lastCall >= timeoutMs) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
}

/**
 * Execute a function with a deadline
 * Similar to withTimeout but uses absolute deadline instead of relative timeout
 * 
 * @param promise - The promise to execute
 * @param deadline - Absolute deadline timestamp (Date.now() + ms)
 * @param errorMessage - Custom error message
 * @returns Promise that resolves with result or rejects with TimeoutError
 */
export async function withDeadline<T>(
  promise: Promise<T>,
  deadline: number,
  errorMessage?: string
): Promise<T> {
  const timeoutMs = deadline - Date.now();
  
  if (timeoutMs <= 0) {
    throw new TimeoutError(errorMessage || 'Deadline has already passed');
  }
  
  return withTimeout(promise, timeoutMs, errorMessage);
}
