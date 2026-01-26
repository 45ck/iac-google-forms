/**
 * Tests for destroy CLI command
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FormsApiError } from '../../api/forms-client.js';
import { createDestroyCommand } from './destroy.js';

const mockGetFormState = vi.fn();
const mockRemoveFormState = vi.fn();
const mockGetAccessToken = vi.fn();
const mockGetForm = vi.fn();
const mockDeleteForm = vi.fn();

vi.mock('../../state/state-manager.js', () => ({
  StateManager: class MockStateManager {
    getFormState = mockGetFormState;
    removeFormState = mockRemoveFormState;
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
      public readonly details?: unknown
    ) {
      super(message);
      this.name = 'FormsApiError';
    }
  },
  FormsClient: class MockFormsClient {
    getForm = mockGetForm;
    deleteForm = mockDeleteForm;
  },
}));

describe('destroy command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetFormState.mockResolvedValue({
      localPath: 'form.json',
      formId: 'test-form-id',
      lastDeployed: '2026-01-25T00:00:00.000Z',
    });
    mockRemoveFormState.mockResolvedValue(undefined);
    mockGetAccessToken.mockResolvedValue('mock-token');
    mockGetForm.mockResolvedValue({ formId: 'test-form-id' });
    mockDeleteForm.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createDestroyCommand', () => {
    it('should create a command with correct name', () => {
      const cmd = createDestroyCommand();
      expect(cmd.name()).toBe('destroy');
    });

    it('should have --auto-approve option', () => {
      const cmd = createDestroyCommand();
      const option = cmd.options.find((o) => o.long === '--auto-approve');
      expect(option).toBeDefined();
    });

    it('should have --keep-remote option', () => {
      const cmd = createDestroyCommand();
      const option = cmd.options.find((o) => o.long === '--keep-remote');
      expect(option).toBeDefined();
    });
  });

  describe('without --auto-approve', () => {
    it('should prompt for approval', async () => {
      const cmd = createDestroyCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json']);

      const calls = consoleSpy.mock.calls;
      const hasPrompt = calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('--auto-approve'))
      );
      expect(hasPrompt).toBe(true);
      expect(mockRemoveFormState).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('with --auto-approve --keep-remote', () => {
    it('should clear local state without deleting remote', async () => {
      const cmd = createDestroyCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json', '--auto-approve', '--keep-remote']);

      expect(mockRemoveFormState).toHaveBeenCalledWith('form.json');
      expect(mockDeleteForm).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should show keep-remote plan message', async () => {
      const cmd = createDestroyCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json', '--keep-remote']);

      const calls = consoleSpy.mock.calls;
      const hasKeepMsg = calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('NOT be deleted from Google'))
      );
      expect(hasKeepMsg).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe('no state found', () => {
    it('should error when form not in state', async () => {
      mockGetFormState.mockResolvedValue(undefined);

      const cmd = createDestroyCommand();
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await cmd.parseAsync(['node', 'test', 'unknown.json']);

      expect(exitSpy).toHaveBeenCalledWith(1);

      errorSpy.mockRestore();
      exitSpy.mockRestore();
    });
  });

  describe('full destroy with --auto-approve', () => {
    it('should delete remote form and clear state', async () => {
      const cmd = createDestroyCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json', '--auto-approve']);

      expect(mockGetForm).toHaveBeenCalledWith('test-form-id');
      expect(mockDeleteForm).toHaveBeenCalledWith('test-form-id');
      expect(mockRemoveFormState).toHaveBeenCalledWith('form.json');

      const calls = consoleSpy.mock.calls;
      const hasDeleted = calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('Form deleted from Google'))
      );
      const hasCleared = calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('State cleared'))
      );
      expect(hasDeleted).toBe(true);
      expect(hasCleared).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should warn when remote form not found (404) and still clear state', async () => {
      mockGetForm.mockRejectedValue(new FormsApiError('Not found', 404));

      const cmd = createDestroyCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json', '--auto-approve']);

      expect(mockDeleteForm).not.toHaveBeenCalled();
      expect(mockRemoveFormState).toHaveBeenCalledWith('form.json');

      const calls = consoleSpy.mock.calls;
      const hasWarning = calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('may have been deleted already'))
      );
      expect(hasWarning).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should propagate non-404 API errors during verify', async () => {
      mockGetForm.mockRejectedValue(new FormsApiError('Server error', 500));

      const cmd = createDestroyCommand();
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await cmd.parseAsync(['node', 'test', 'form.json', '--auto-approve']);

      expect(exitSpy).toHaveBeenCalledWith(1);

      errorSpy.mockRestore();
      exitSpy.mockRestore();
    });

    it('should handle form with no formId gracefully', async () => {
      mockGetFormState.mockResolvedValue({
        localPath: 'form.json',
        lastDeployed: '2026-01-25T00:00:00.000Z',
      });

      const cmd = createDestroyCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json', '--auto-approve']);

      expect(mockDeleteForm).not.toHaveBeenCalled();
      expect(mockRemoveFormState).toHaveBeenCalledWith('form.json');

      consoleSpy.mockRestore();
    });
  });

  describe('destroy plan display', () => {
    it('should show form ID in destroy plan', async () => {
      const cmd = createDestroyCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json']);

      const calls = consoleSpy.mock.calls;
      const hasFormId = calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('test-form-id'))
      );
      expect(hasFormId).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should warn about permanent deletion', async () => {
      const cmd = createDestroyCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json']);

      const calls = consoleSpy.mock.calls;
      const hasWarning = calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('cannot be undone'))
      );
      expect(hasWarning).toBe(true);

      consoleSpy.mockRestore();
    });
  });
});
