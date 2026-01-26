/**
 * Tests for deploy CLI command
 * Tests file loading, validation, and deploy flow
 */

import * as fs from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FormsApiError } from '../../api/forms-client.js';
import { AuthError } from '../../auth/auth-manager.js';
import { applyGlobalOptions } from '../global-options.js';
import { createDeployCommand } from './deploy.js';

// Module-level mock functions for per-test control
const mockGetFormState = vi.fn();
const mockSaveFormState = vi.fn();
const mockGetAccessToken = vi.fn();
const mockCreateForm = vi.fn();
const mockUpdateForm = vi.fn();
const mockGetForm = vi.fn();
const mockDeleteForm = vi.fn();

vi.mock('node:fs/promises');

vi.mock('../../state/state-manager.js', () => ({
  StateManager: class MockStateManager {
    getFormState = mockGetFormState;
    saveFormState = mockSaveFormState;
  },
}));

vi.mock('../../auth/auth-manager.js', () => ({
  AuthError: class AuthError extends Error {
    public override readonly cause?: unknown;
    constructor(message: string, cause?: unknown) {
      super(message);
      this.name = 'AuthError';
      this.cause = cause;
    }
  },
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
    createForm = mockCreateForm;
    updateForm = mockUpdateForm;
    getForm = mockGetForm;
    deleteForm = mockDeleteForm;
  },
}));
vi.mock('../../api/response-converter.js', () => ({
  convertResponseToFormDefinition: vi.fn().mockReturnValue({
    title: 'Test Form',
    description: 'A test form',
    questions: [{ id: 'q1', type: 'text', title: 'Name', required: true, paragraph: false }],
  }),
}));

const mockFormDefinition = {
  title: 'Test Form',
  description: 'A test form',
  questions: [{ id: 'q1', type: 'text', title: 'Name', required: true, paragraph: false }],
};

describe('deploy command', () => {
  const mockFs = vi.mocked(fs);

  beforeEach(() => {
    vi.clearAllMocks();
    applyGlobalOptions({});
    // Default mock: file exists, new form (no state)
    mockFs.access.mockResolvedValue(undefined);
    mockFs.readFile.mockResolvedValue(JSON.stringify(mockFormDefinition));
    mockGetFormState.mockResolvedValue(undefined);
    mockSaveFormState.mockResolvedValue(undefined);
    mockGetAccessToken.mockResolvedValue('mock-token');
    mockCreateForm.mockResolvedValue({
      formId: 'test-id',
      formUrl: 'https://forms.google.com/test',
      responseUrl: 'https://forms.google.com/test/response',
    });
    mockUpdateForm.mockResolvedValue(undefined);
    mockGetForm.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createDeployCommand', () => {
    it('should create a command with correct name and description', () => {
      const cmd = createDeployCommand();

      expect(cmd.name()).toBe('deploy');
      expect(cmd.description()).toBe('Deploy a form definition to Google Forms');
    });

    it('should have required file argument', () => {
      const cmd = createDeployCommand();
      const args = cmd.registeredArguments;

      expect(args).toHaveLength(1);
      expect(args[0].name()).toBe('file');
      expect(args[0].required).toBe(true);
    });

    it('should have --auto-approve option', () => {
      const cmd = createDeployCommand();
      const option = cmd.options.find((o) => o.long === '--auto-approve');

      expect(option).toBeDefined();
    });

    it('should have --dry-run option', () => {
      const cmd = createDeployCommand();
      const option = cmd.options.find((o) => o.long === '--dry-run');

      expect(option).toBeDefined();
    });
  });

  describe('file loading', () => {
    it('should throw error for non-existent file', async () => {
      mockFs.access.mockRejectedValue(new Error('ENOENT'));

      const cmd = createDeployCommand();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await cmd.parseAsync(['node', 'test', 'nonexistent.json']);

      expect(consoleSpy).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(1);

      consoleSpy.mockRestore();
      exitSpy.mockRestore();
    });

    it('should throw error for TypeScript files', async () => {
      const cmd = createDeployCommand();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await cmd.parseAsync(['node', 'test', 'form.ts']);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('TypeScript files require compilation')
      );
      expect(exitSpy).toHaveBeenCalledWith(1);

      consoleSpy.mockRestore();
      exitSpy.mockRestore();
    });

    it('should throw error for invalid JSON', async () => {
      mockFs.readFile.mockResolvedValue('{ invalid json }');

      const cmd = createDeployCommand();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await cmd.parseAsync(['node', 'test', 'form.json']);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('Invalid JSON')
      );
      expect(exitSpy).toHaveBeenCalledWith(1);

      consoleSpy.mockRestore();
      exitSpy.mockRestore();
    });

    it('should throw error for invalid form definition', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify({ title: 'Missing questions' }));

      const cmd = createDeployCommand();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await cmd.parseAsync(['node', 'test', 'form.json']);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('Invalid form definition')
      );
      expect(exitSpy).toHaveBeenCalledWith(1);

      consoleSpy.mockRestore();
      exitSpy.mockRestore();
    });
  });

  // TC-CLI-006: gforms deploy dry-run
  describe('dry-run mode', () => {
    it('should show diff without deploying in dry-run mode', async () => {
      const cmd = createDeployCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json', '--dry-run']);

      expect(consoleSpy).toHaveBeenCalledWith(expect.anything(), 'No changes will be made.');

      consoleSpy.mockRestore();
    });
  });

  describe('confirmation flow', () => {
    it('should prompt for --auto-approve when not provided', async () => {
      const cmd = createDeployCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json']);

      // Check that one of the console.log calls contains the approval message
      const calls = consoleSpy.mock.calls;
      const hasApprovalMessage = calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('run with --auto-approve'))
      );
      expect(hasApprovalMessage).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe('remote diff error handling', () => {
    beforeEach(() => {
      mockGetFormState.mockResolvedValue({
        localPath: 'form.json',
        formId: 'existing-form-id',
        lastDeployed: '2026-01-25T00:00:00.000Z',
      });
    });

    it('should show auth warning when authentication fails', async () => {
      mockGetAccessToken.mockRejectedValue(new AuthError('Token expired'));

      const cmd = createDeployCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json', '--dry-run']);

      const calls = consoleSpy.mock.calls;
      const hasAuthWarning = calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('Authentication failed'))
      );
      expect(hasAuthWarning).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should show not-found warning for 404 API error', async () => {
      mockGetForm.mockRejectedValue(new FormsApiError('Not found', 404));

      const cmd = createDeployCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json', '--dry-run']);

      const calls = consoleSpy.mock.calls;
      const hasNotFound = calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('not found'))
      );
      expect(hasNotFound).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should show API error warning with status code for server errors', async () => {
      mockGetForm.mockRejectedValue(new FormsApiError('Internal error', 500));

      const cmd = createDeployCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json', '--dry-run']);

      const calls = consoleSpy.mock.calls;
      const hasApiError = calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('API error (500)'))
      );
      expect(hasApiError).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should show generic warning for network errors', async () => {
      mockGetForm.mockRejectedValue(new Error('ECONNRESET'));

      const cmd = createDeployCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json', '--dry-run']);

      const calls = consoleSpy.mock.calls;
      const hasGenericWarning = calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('Could not fetch remote form'))
      );
      expect(hasGenericWarning).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should show error details in verbose mode', async () => {
      applyGlobalOptions({ verbose: true });
      mockGetForm.mockRejectedValue(new FormsApiError('Rate limit exceeded', 429));

      const cmd = createDeployCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json', '--dry-run']);

      const calls = consoleSpy.mock.calls;
      const hasDetail = calls.some((call) =>
        call.some(
          (arg) =>
            typeof arg === 'string' &&
            arg.includes('Detail:') &&
            arg.includes('Rate limit exceeded')
        )
      );
      expect(hasDetail).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should not show details when not in verbose mode', async () => {
      mockGetForm.mockRejectedValue(new FormsApiError('Server error', 500));

      const cmd = createDeployCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json', '--dry-run']);

      const calls = consoleSpy.mock.calls;
      const hasDetail = calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('Detail:'))
      );
      expect(hasDetail).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  // TC-CLI-007: gforms deploy auto-approve
  describe('new form deployment', () => {
    it('should create form and save state with --auto-approve', async () => {
      mockGetForm.mockResolvedValue({ revisionId: 'rev-1' });

      const cmd = createDeployCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json', '--auto-approve']);

      expect(mockCreateForm).toHaveBeenCalled();
      expect(mockSaveFormState).toHaveBeenCalledWith(
        'form.json',
        expect.objectContaining({
          formId: 'test-id',
          formUrl: 'https://forms.google.com/test',
          responseUrl: 'https://forms.google.com/test/response',
          contentHash: expect.any(String),
          remoteRevisionId: 'rev-1',
        })
      );

      const calls = consoleSpy.mock.calls;
      const hasSuccess = calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('Success'))
      );
      expect(hasSuccess).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should handle fetchRevisionId failure gracefully', async () => {
      mockGetForm.mockRejectedValue(new Error('Network error'));

      const cmd = createDeployCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json', '--auto-approve']);

      expect(mockCreateForm).toHaveBeenCalled();
      expect(mockSaveFormState).toHaveBeenCalledWith(
        'form.json',
        expect.objectContaining({
          formId: 'test-id',
          remoteRevisionId: undefined,
        })
      );

      consoleSpy.mockRestore();
    });

    it('should print form URLs after creation', async () => {
      mockGetForm.mockResolvedValue({ revisionId: 'rev-1' });

      const cmd = createDeployCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json', '--auto-approve']);

      const calls = consoleSpy.mock.calls;
      const hasFormId = calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('test-id'))
      );
      const hasEditUrl = calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('forms.google.com/test'))
      );
      expect(hasFormId).toBe(true);
      expect(hasEditUrl).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe('existing form update', () => {
    beforeEach(() => {
      mockGetFormState.mockResolvedValue({
        localPath: 'form.json',
        formId: 'existing-form-id',
        lastDeployed: '2026-01-25T00:00:00.000Z',
        contentHash: 'old-hash',
      });
      mockGetAccessToken.mockResolvedValue('mock-token');
      mockGetForm.mockResolvedValue({
        formId: 'existing-form-id',
        info: { title: 'Test Form' },
        responderUri: 'https://...',
        revisionId: 'rev-2',
      });
    });

    it('should update existing form with --auto-approve', async () => {
      const cmd = createDeployCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json', '--auto-approve']);

      expect(mockUpdateForm).toHaveBeenCalledWith('existing-form-id', mockFormDefinition);
      expect(mockSaveFormState).toHaveBeenCalledWith(
        'form.json',
        expect.objectContaining({
          formId: 'existing-form-id',
          contentHash: expect.any(String),
          remoteRevisionId: 'rev-2',
        })
      );

      const calls = consoleSpy.mock.calls;
      const hasUpdated = calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('Form updated'))
      );
      expect(hasUpdated).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should skip deploy when content hash matches', async () => {
      const { hashFormDefinition } = await import('../../utils/hash.js');
      const currentHash = hashFormDefinition(mockFormDefinition);

      mockGetFormState.mockResolvedValue({
        localPath: 'form.json',
        formId: 'existing-form-id',
        lastDeployed: '2026-01-25T00:00:00.000Z',
        contentHash: currentHash,
      });

      const cmd = createDeployCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json', '--auto-approve']);

      expect(mockUpdateForm).not.toHaveBeenCalled();

      const calls = consoleSpy.mock.calls;
      const hasSkip = calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('content hash matches'))
      );
      expect(hasSkip).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should warn about revision conflict', async () => {
      mockGetFormState.mockResolvedValue({
        localPath: 'form.json',
        formId: 'existing-form-id',
        lastDeployed: '2026-01-25T00:00:00.000Z',
        contentHash: 'old-hash',
        remoteRevisionId: 'rev-1',
      });
      mockGetForm.mockResolvedValue({
        formId: 'existing-form-id',
        info: { title: 'Test Form' },
        responderUri: 'https://...',
        revisionId: 'rev-2',
      });

      const cmd = createDeployCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json', '--auto-approve']);

      const calls = consoleSpy.mock.calls;
      const hasConflictWarning = calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('modified remotely'))
      );
      expect(hasConflictWarning).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe('existing form diff display', () => {
    beforeEach(() => {
      mockGetFormState.mockResolvedValue({
        localPath: 'form.json',
        formId: 'existing-form-id',
        lastDeployed: '2026-01-25T00:00:00.000Z',
      });
    });

    it('should show no changes when remote matches local', async () => {
      mockGetAccessToken.mockResolvedValue('mock-token');
      mockGetForm.mockResolvedValue({
        formId: 'existing-form-id',
        info: { title: 'Test Form', description: 'A test form' },
        responderUri: 'https://...',
        items: [
          {
            itemId: 'item-1',
            title: 'Name',
            questionItem: {
              question: { questionId: 'q1', required: true, textQuestion: { paragraph: false } },
            },
          },
        ],
        revisionId: 'rev-1',
      });

      const cmd = createDeployCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json', '--dry-run']);

      const calls = consoleSpy.mock.calls;
      const hasExistingForm = calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('Existing form'))
      );
      expect(hasExistingForm).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should display diff with added questions', async () => {
      const { convertResponseToFormDefinition } = await import('../../api/response-converter.js');
      const mockConvert = vi.mocked(convertResponseToFormDefinition);
      mockConvert.mockReturnValueOnce({
        title: 'Test Form',
        description: 'A test form',
        questions: [],
      });

      mockGetAccessToken.mockResolvedValue('mock-token');
      mockGetForm.mockResolvedValue({
        formId: 'existing-form-id',
        info: { title: 'Test Form', description: 'A test form' },
        responderUri: 'https://...',
        items: [],
        revisionId: 'rev-1',
      });

      const cmd = createDeployCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json', '--dry-run']);

      const calls = consoleSpy.mock.calls;
      const hasAdded = calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('question(s) to add'))
      );
      expect(hasAdded).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should display diff with removed questions', async () => {
      const { convertResponseToFormDefinition } = await import('../../api/response-converter.js');
      const mockConvert = vi.mocked(convertResponseToFormDefinition);
      mockConvert.mockReturnValueOnce({
        title: 'Test Form',
        description: 'A test form',
        questions: [
          { id: 'q1', type: 'text', title: 'Name', required: true, paragraph: false },
          { id: 'q2', type: 'text', title: 'Email', required: true, paragraph: false },
        ],
      });

      mockGetAccessToken.mockResolvedValue('mock-token');
      mockGetForm.mockResolvedValue({
        formId: 'existing-form-id',
        info: { title: 'Test Form', description: 'A test form' },
        responderUri: 'https://...',
        items: [],
        revisionId: 'rev-1',
      });

      const cmd = createDeployCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json', '--dry-run']);

      const calls = consoleSpy.mock.calls;
      const hasRemoved = calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('question(s) to remove'))
      );
      expect(hasRemoved).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should display diff with modified questions', async () => {
      const { convertResponseToFormDefinition } = await import('../../api/response-converter.js');
      const mockConvert = vi.mocked(convertResponseToFormDefinition);
      mockConvert.mockReturnValueOnce({
        title: 'Test Form',
        description: 'A test form',
        questions: [
          { id: 'q1', type: 'text', title: 'Full Name', required: true, paragraph: false },
        ],
      });

      mockGetAccessToken.mockResolvedValue('mock-token');
      mockGetForm.mockResolvedValue({
        formId: 'existing-form-id',
        info: { title: 'Test Form', description: 'A test form' },
        responderUri: 'https://...',
        items: [],
        revisionId: 'rev-1',
      });

      const cmd = createDeployCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json', '--dry-run']);

      const calls = consoleSpy.mock.calls;
      const hasModified = calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('question(s) to modify'))
      );
      expect(hasModified).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should show no changes detected in diff when remote equals local', async () => {
      const { convertResponseToFormDefinition } = await import('../../api/response-converter.js');
      const mockConvert = vi.mocked(convertResponseToFormDefinition);
      mockConvert.mockReturnValueOnce({
        title: 'Test Form',
        description: 'A test form',
        questions: [{ id: 'q1', type: 'text', title: 'Name', required: true, paragraph: false }],
      });

      mockGetAccessToken.mockResolvedValue('mock-token');
      mockGetForm.mockResolvedValue({
        formId: 'existing-form-id',
        info: { title: 'Test Form', description: 'A test form' },
        responderUri: 'https://...',
        items: [],
        revisionId: 'rev-1',
      });

      const cmd = createDeployCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json', '--dry-run']);

      const calls = consoleSpy.mock.calls;
      const hasNoChanges = calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('No changes detected'))
      );
      expect(hasNoChanges).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should display diff summary when remote form cannot be fetched', async () => {
      mockGetAccessToken.mockRejectedValue(new AuthError('No credentials'));

      const cmd = createDeployCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', 'form.json', '--dry-run']);

      const calls = consoleSpy.mock.calls;
      const hasFallback = calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('Could not fetch remote form'))
      );
      expect(hasFallback).toBe(true);

      consoleSpy.mockRestore();
    });
  });
});
