/**
 * Tests for validate CLI command
 * Covers TC-CLI-002, TC-CLI-003
 */

import * as fs from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createValidateCommand } from './validate.js';

vi.mock('node:fs/promises');

const validForm = {
  title: 'Test Form',
  questions: [{ id: 'q1', type: 'text', title: 'Name', required: true, paragraph: false }],
};

describe('validate command', () => {
  const mockFs = vi.mocked(fs);

  beforeEach(() => {
    vi.clearAllMocks();
    mockFs.access.mockResolvedValue(undefined);
    mockFs.readFile.mockResolvedValue(JSON.stringify(validForm));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createValidateCommand', () => {
    it('should create a command with correct name', () => {
      const cmd = createValidateCommand();
      expect(cmd.name()).toBe('validate');
    });

    it('should have --strict option', () => {
      const cmd = createValidateCommand();
      const option = cmd.options.find((o) => o.long === '--strict');
      expect(option).toBeDefined();
    });
  });

  describe('TC-CLI-002: valid file', () => {
    it('should show success for valid form definition', async () => {
      const cmd = createValidateCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json']);

      const calls = consoleSpy.mock.calls;
      const hasValid = calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('is valid'))
      );
      expect(hasValid).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe('TC-CLI-003: invalid file', () => {
    it('should show errors for invalid form definition', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify({ title: 'No questions' }));

      const cmd = createValidateCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await cmd.parseAsync(['node', 'test', 'bad.json']);

      // Should exit with non-zero or show error
      const hasError = consoleSpy.mock.calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('has errors'))
      );
      const exitedWithError = exitSpy.mock.calls.some((call) => call[0] === 1);

      expect(hasError || exitedWithError).toBe(true);

      consoleSpy.mockRestore();
      errorSpy.mockRestore();
      exitSpy.mockRestore();
    });

    it('should throw for non-existent file', async () => {
      mockFs.access.mockRejectedValue(new Error('ENOENT'));

      const cmd = createValidateCommand();
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await cmd.parseAsync(['node', 'test', 'missing.json']);

      expect(exitSpy).toHaveBeenCalledWith(1);

      errorSpy.mockRestore();
      exitSpy.mockRestore();
    });
  });

  describe('--strict mode', () => {
    it('should pass in strict mode when form has all fields', async () => {
      const completeForm = {
        title: 'Complete Form',
        description: 'A fully described form',
        questions: [
          {
            id: 'q1',
            type: 'text',
            title: 'Name',
            description: 'Your name',
            required: true,
            paragraph: false,
          },
        ],
        settings: { collectEmail: false },
      };
      mockFs.readFile.mockResolvedValue(JSON.stringify(completeForm));

      const cmd = createValidateCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json', '--strict']);

      const calls = consoleSpy.mock.calls;
      const hasValid = calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('is valid'))
      );
      expect(hasValid).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should fail in strict mode when description is missing', async () => {
      const cmd = createValidateCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await cmd.parseAsync(['node', 'test', 'form.json', '--strict']);

      expect(exitSpy).toHaveBeenCalledWith(1);
      const hasWarnings = consoleSpy.mock.calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('strict mode warnings'))
      );
      expect(hasWarnings).toBe(true);

      consoleSpy.mockRestore();
      exitSpy.mockRestore();
    });

    it('should warn about questions without descriptions', async () => {
      const formWithDesc = {
        title: 'Test Form',
        description: 'Has description',
        questions: [{ id: 'q1', type: 'text', title: 'Name', required: true, paragraph: false }],
        settings: { collectEmail: false },
      };
      mockFs.readFile.mockResolvedValue(JSON.stringify(formWithDesc));

      const cmd = createValidateCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await cmd.parseAsync(['node', 'test', 'form.json', '--strict']);

      expect(exitSpy).toHaveBeenCalledWith(1);
      const hasQuestionWarning = consoleSpy.mock.calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('missing a description'))
      );
      expect(hasQuestionWarning).toBe(true);

      consoleSpy.mockRestore();
      exitSpy.mockRestore();
    });

    it('should not apply strict checks without --strict flag', async () => {
      const cmd = createValidateCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json']);

      const calls = consoleSpy.mock.calls;
      const hasValid = calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('is valid'))
      );
      expect(hasValid).toBe(true);

      consoleSpy.mockRestore();
    });
  });
});
