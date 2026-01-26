/**
 * Retry utility for transient failures
 */

export interface RetryOptions {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * Check if an error is retryable based on status code
 */
export function isRetryableStatusCode(statusCode: number): boolean {
  // Retry on rate limiting, server errors, and timeouts
  return statusCode === 429 || statusCode >= 500;
}

/**
 * Sleep for a given duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with automatic retry on failure
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (opts.maxAttempts < 1) {
    throw new Error('maxAttempts must be at least 1');
  }

  let lastError: unknown;
  let delay = opts.initialDelayMs;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const isRetryable = opts.retryableErrors
        ? opts.retryableErrors(error)
        : isDefaultRetryable(error);

      if (!isRetryable || attempt === opts.maxAttempts) {
        throw error;
      }

      await sleep(delay);
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelayMs);
    }
  }

  throw lastError;
}

function isDefaultRetryable(error: unknown): boolean {
  if (error instanceof Error && 'statusCode' in error) {
    const statusCode = error.statusCode as number;
    return isRetryableStatusCode(statusCode);
  }
  return false;
}

/**
 * Create a retryable version of an async function
 */
export function makeRetryable<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: Partial<RetryOptions> = {}
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) => withRetry(() => fn(...args), options);
}
