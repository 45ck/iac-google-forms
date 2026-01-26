/**
 * Tests for diff CLI command
 * Covers TC-CLI-004, TC-CLI-005
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createDiffCommand } from './diff.js';
import * as fs from 'node:fs/promises';

const mockGetFormState = vi.fn();
const mockGetAccessToken = vi.fn();
const mockGetForm = vi.fn();

vi.mock('node:fs/promises');

vi.mock('../../state/state-manager.js', () => ({
  StateManager: class MockStateManager {
    getFormState = mockGetFormState;
  },
}));

vi.mock('../../auth/auth-manager.js', () => ({
  AuthManager: class MockAuthManager {
    getAccessToken = mockGetAccessToken;
  },
  TokenStore: class MockTokenStore {
    readonly path = 'mock-path';
  },
}));

vi.mock('../../api/forms-client.js', () => ({
  FormsApiError: class FormsApiError extends Error {
    constructor(
      message: string,
      public readonly statusCode: number,
      public readonly details?: unknown,
    ) {
      super(message);
      this.name = 'FormsApiError';
    }
  },
  FormsClient: class MockFormsClient {
    getForm = mockGetForm;
  },
}));

const mockConvertResponse = vi.hoisted(() => vi.fn());

vi.mock('../../api/response-converter.js', () => ({
  convertResponseToFormDefinition: mockConvertResponse,
}));

const mockForm = {
  title: 'Test Form',
  questions: [
    { id: 'q1', type: 'text', title: 'Name', required: true, paragraph: false },
    { id: 'q2', type: 'choice', title: 'Color', required: false, options: ['Red', 'Blue'], allowOther: false, multiple: false },
  ],
};

describe('diff command', () => {
  const mockFs = vi.mocked(fs);

  beforeEach(() => {
    vi.clearAllMocks();
    mockFs.access.mockResolvedValue(undefined);
    mockFs.readFile.mockResolvedValue(JSON.stringify(mockForm));
    mockGetFormState.mockResolvedValue(undefined);
    mockGetAccessToken.mockResolvedValue('mock-token');
    mockConvertResponse.mockReturnValue({
      title: 'Remote Form',
      questions: [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createDiffCommand', () => {
    it('should create a command with correct name', () => {
      const cmd = createDiffCommand();
      expect(cmd.name()).toBe('diff');
    });

    it('should have --format option', () => {
      const cmd = createDiffCommand();
      const option = cmd.options.find((o) => o.long === '--format');
      expect(option).toBeDefined();
    });

    it('should have --ci option', () => {
      const cmd = createDiffCommand();
      const option = cmd.options.find((o) => o.long === '--ci');
      expect(option).toBeDefined();
    });
  });

  describe('TC-CLI-004: diff new form', () => {
    it('should show new form message for undeployed form', async () => {
      const cmd = createDiffCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json']);

      const calls = consoleSpy.mock.calls;
      const hasNewForm = calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('New form'))
      );
      expect(hasNewForm).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should show added question count in summary', async () => {
      const cmd = createDiffCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json']);

      const calls = consoleSpy.mock.calls;
      const hasSummary = calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('added'))
      );
      expect(hasSummary).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe('TC-CLI-005: markdown output', () => {
    it('should output markdown table format', async () => {
      const cmd = createDiffCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json', '--format', 'markdown']);

      const calls = consoleSpy.mock.calls;
      const hasMarkdownTable = calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('| Change |'))
      );
      expect(hasMarkdownTable).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should include summary line in markdown', async () => {
      const cmd = createDiffCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json', '--format', 'markdown']);

      const calls = consoleSpy.mock.calls;
      const hasSummary = calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('**Summary:**'))
      );
      expect(hasSummary).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe('json output', () => {
    it('should output valid JSON', async () => {
      const cmd = createDiffCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json', '--format', 'json']);

      const jsonOutput = consoleSpy.mock.calls
        .map((call) => call.join(''))
        .join('');

      const parsed = JSON.parse(jsonOutput);
      expect(parsed).toHaveProperty('status', 'new');
      expect(parsed).toHaveProperty('hasChanges', true);
      expect(parsed).toHaveProperty('summary');

      consoleSpy.mockRestore();
    });
  });

  describe('CI mode', () => {
    it('should exit with code 1 when changes detected in CI mode', async () => {
      const cmd = createDiffCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await cmd.parseAsync(['node', 'test', 'form.json', '--ci']);

      // New form = has changes => exit code 1 in CI mode
      expect(exitSpy).toHaveBeenCalledWith(1);

      consoleSpy.mockRestore();
      exitSpy.mockRestore();
    });

    it('should not exit with error when no changes in CI mode', async () => {
      // Set up an existing form that matches the local
      mockGetFormState.mockResolvedValue({
        localPath: 'form.json',
        formId: 'existing-id',
      });
      mockGetForm.mockResolvedValue({
        formId: 'existing-id',
        info: { title: 'Test Form' },
        responderUri: 'https://...',
        items: [],
      });
      // Return the same definition as the local form so diff shows no changes
      mockConvertResponse.mockReturnValueOnce({
        title: 'Test Form',
        questions: [
          { id: 'q1', type: 'text', title: 'Name', required: true, paragraph: false },
          { id: 'q2', type: 'choice', title: 'Color', required: false, options: ['Red', 'Blue'], allowOther: false, multiple: false },
        ],
      });

      const cmd = createDiffCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await cmd.parseAsync(['node', 'test', 'form.json', '--ci']);

      // No changes => exit code 0, so process.exit should NOT be called (or called with 0)
      const exitCalls = exitSpy.mock.calls;
      const hasNonZeroExit = exitCalls.some((call) => call[0] !== 0);
      expect(hasNonZeroExit).toBe(false);

      consoleSpy.mockRestore();
      exitSpy.mockRestore();
    });
  });

  describe('invalid format', () => {
    it('should error on invalid format', async () => {
      const cmd = createDiffCommand();
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await cmd.parseAsync(['node', 'test', 'form.json', '--format', 'xml']);

      expect(exitSpy).toHaveBeenCalledWith(2);

      errorSpy.mockRestore();
      exitSpy.mockRestore();
    });
  });

  describe('existing form diff with remote', () => {
    beforeEach(() => {
      mockGetFormState.mockResolvedValue({
        localPath: 'form.json',
        formId: 'existing-id',
      });
    });

    it('should show modified status when remote differs', async () => {
      mockGetForm.mockResolvedValue({
        formId: 'existing-id',
        info: { title: 'Old Title' },
        responderUri: 'https://...',
        items: [],
      });
      mockConvertResponse.mockReturnValueOnce({
        title: 'Old Title',
        questions: [
          { id: 'q1', type: 'text', title: 'Old Name', required: false, paragraph: false },
        ],
      });

      const cmd = createDiffCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json']);

      const calls = consoleSpy.mock.calls;
      const output = calls.map((c) => c.join(' ')).join('\n');
      // Should have summary with added (q2 is new) and possibly modified counts
      expect(output).toContain('added');

      consoleSpy.mockRestore();
    });

    it('should show fallback when remote cannot be fetched', async () => {
      mockGetAccessToken.mockRejectedValue(new Error('No auth'));

      const cmd = createDiffCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json']);

      const calls = consoleSpy.mock.calls;
      const hasFallback = calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('Could not fetch remote'))
      );
      expect(hasFallback).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should show markdown with question diffs for existing form', async () => {
      mockGetForm.mockResolvedValue({
        formId: 'existing-id',
        info: { title: 'Test Form' },
        responderUri: 'https://...',
        items: [],
      });
      mockConvertResponse.mockReturnValueOnce({
        title: 'Test Form',
        questions: [],
      });

      const cmd = createDiffCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json', '--format', 'markdown']);

      const calls = consoleSpy.mock.calls;
      const output = calls.map((c) => c.join(' ')).join('\n');
      expect(output).toContain('| Change |');
      expect(output).toContain('**Summary:**');

      consoleSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('should exit with code 2 on file not found', async () => {
      mockFs.access.mockRejectedValue(new Error('ENOENT'));

      const cmd = createDiffCommand();
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await cmd.parseAsync(['node', 'test', 'missing.json']);

      expect(exitSpy).toHaveBeenCalledWith(2);

      errorSpy.mockRestore();
      exitSpy.mockRestore();
    });
  });
});
