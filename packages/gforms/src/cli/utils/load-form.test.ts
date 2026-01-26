/**
 * Tests for load-form utilities
 * Covers security fixes: C1 (token leakage), H2 (path traversal)
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { assertSafePath, sanitizeErrorMessage } from './load-form.js';

describe('sanitizeErrorMessage (C1: token leakage prevention)', () => {
  it('should redact Bearer tokens', () => {
    const msg = 'Authorization: Bearer ya29.a0AfH6SM_some_long_token.abc';
    const sanitized = sanitizeErrorMessage(msg);
    expect(sanitized).not.toContain('ya29');
    expect(sanitized).toContain('[REDACTED');
  });

  it('should redact access_token values', () => {
    const msg = 'access_token: "ya29.very_secret_token"';
    const sanitized = sanitizeErrorMessage(msg);
    expect(sanitized).not.toContain('ya29');
    expect(sanitized).toContain('[REDACTED');
  });

  it('should redact Google access tokens (ya29.*)', () => {
    const msg = 'Failed with token ya29.a0AfH6SMBx_secret_123';
    const sanitized = sanitizeErrorMessage(msg);
    expect(sanitized).not.toContain('ya29.a0AfH6SMBx');
    expect(sanitized).toContain('[REDACTED_TOKEN]');
  });

  it('should leave normal error messages unchanged', () => {
    const msg = 'File not found: form.json';
    expect(sanitizeErrorMessage(msg)).toBe('File not found: form.json');
  });

  it('should handle multiple tokens in one message', () => {
    const msg = 'Bearer abc123.def456.ghi789 and also Bearer xyz.uvw.rst';
    const sanitized = sanitizeErrorMessage(msg);
    expect(sanitized).not.toContain('abc123');
    expect(sanitized).not.toContain('xyz');
  });

  it('should handle empty string', () => {
    expect(sanitizeErrorMessage('')).toBe('');
  });
});

describe('assertSafePath (H2: path traversal protection)', () => {
  beforeEach(() => {
    vi.spyOn(process, 'cwd').mockReturnValue('D:\\project');
  });

  it('should allow paths within project directory', () => {
    expect(() => {
      assertSafePath('D:\\project\\forms\\test.json', 'forms/test.json');
    }).not.toThrow();
  });

  it('should allow paths in subdirectories', () => {
    expect(() => {
      assertSafePath('D:\\project\\src\\forms\\nested\\deep.json', 'src/forms/nested/deep.json');
    }).not.toThrow();
  });

  it('should reject paths outside project directory', () => {
    expect(() => {
      assertSafePath('D:\\other\\secret.json', '../../other/secret.json');
    }).toThrow('resolves outside the project directory');
  });

  it('should reject paths that traverse up', () => {
    expect(() => {
      assertSafePath('D:\\etc\\passwd', '../../../../etc/passwd');
    }).toThrow('resolves outside the project directory');
  });

  it('should reject parent directory access', () => {
    expect(() => {
      assertSafePath('D:\\file.json', '../file.json');
    }).toThrow('resolves outside the project directory');
  });
});
