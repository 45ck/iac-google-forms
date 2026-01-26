/**
 * Tests for retry utility
 */

import { describe, it, expect, vi } from 'vitest';
import { withRetry, isRetryableStatusCode, makeRetryable } from './retry.js';

describe('isRetryableStatusCode', () => {
  it('should return true for rate limiting (429)', () => {
    expect(isRetryableStatusCode(429)).toBe(true);
  });

  it('should return true for server errors (5xx)', () => {
    expect(isRetryableStatusCode(500)).toBe(true);
    expect(isRetryableStatusCode(502)).toBe(true);
    expect(isRetryableStatusCode(503)).toBe(true);
    expect(isRetryableStatusCode(504)).toBe(true);
  });

  it('should return false for client errors (4xx)', () => {
    expect(isRetryableStatusCode(400)).toBe(false);
    expect(isRetryableStatusCode(401)).toBe(false);
    expect(isRetryableStatusCode(403)).toBe(false);
    expect(isRetryableStatusCode(404)).toBe(false);
  });

  it('should return false for success codes', () => {
    expect(isRetryableStatusCode(200)).toBe(false);
    expect(isRetryableStatusCode(201)).toBe(false);
  });
});

describe('withRetry', () => {
  it('should return result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('success');

    const result = await withRetry(fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on retryable error', async () => {
    const retryableError = new Error('Rate limited');
    Object.assign(retryableError, { statusCode: 429 });

    const fn = vi
      .fn()
      .mockRejectedValueOnce(retryableError)
      .mockResolvedValueOnce('success');

    const result = await withRetry(fn, {
      maxAttempts: 3,
      initialDelayMs: 10,
    });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should not retry on non-retryable error', async () => {
    const nonRetryableError = new Error('Not found');
    Object.assign(nonRetryableError, { statusCode: 404 });

    const fn = vi.fn().mockRejectedValue(nonRetryableError);

    await expect(
      withRetry(fn, { maxAttempts: 3, initialDelayMs: 10 })
    ).rejects.toThrow('Not found');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should throw after max attempts', async () => {
    const retryableError = new Error('Server error');
    Object.assign(retryableError, { statusCode: 500 });

    const fn = vi.fn().mockRejectedValue(retryableError);

    await expect(
      withRetry(fn, { maxAttempts: 3, initialDelayMs: 10 })
    ).rejects.toThrow('Server error');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should use custom retryable check', async () => {
    const customError = new Error('Custom error');

    const fn = vi
      .fn()
      .mockRejectedValueOnce(customError)
      .mockResolvedValueOnce('success');

    const result = await withRetry(fn, {
      maxAttempts: 3,
      initialDelayMs: 10,
      retryableErrors: (error) => error === customError,
    });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should throw if maxAttempts is less than 1', async () => {
    const fn = vi.fn().mockResolvedValue('success');

    await expect(
      withRetry(fn, { maxAttempts: 0 })
    ).rejects.toThrow('maxAttempts must be at least 1');

    expect(fn).not.toHaveBeenCalled();
  });

  it('should apply exponential backoff', async () => {
    const retryableError = new Error('Rate limited');
    Object.assign(retryableError, { statusCode: 429 });

    const fn = vi
      .fn()
      .mockRejectedValueOnce(retryableError)
      .mockRejectedValueOnce(retryableError)
      .mockResolvedValueOnce('success');

    const startTime = Date.now();

    await withRetry(fn, {
      maxAttempts: 3,
      initialDelayMs: 50,
      backoffMultiplier: 2,
    });

    const elapsed = Date.now() - startTime;

    // First retry after 50ms, second after 100ms = 150ms minimum
    expect(elapsed).toBeGreaterThanOrEqual(140); // Allow some timing variance
    expect(fn).toHaveBeenCalledTimes(3);
  });
});

describe('makeRetryable', () => {
  it('should create a retryable version of a function', async () => {
    const originalFn = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error('Retry'), { statusCode: 500 }))
      .mockResolvedValueOnce('success');

    const retryableFn = makeRetryable(originalFn, {
      maxAttempts: 2,
      initialDelayMs: 10,
    });

    const result = await retryableFn();

    expect(result).toBe('success');
    expect(originalFn).toHaveBeenCalledTimes(2);
  });

  it('should pass arguments to the original function', async () => {
    const originalFn = vi.fn().mockResolvedValue('result');

    const retryableFn = makeRetryable(originalFn);

    await retryableFn('arg1', 'arg2');

    expect(originalFn).toHaveBeenCalledWith('arg1', 'arg2');
  });
});
