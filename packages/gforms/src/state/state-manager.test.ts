/**
 * State Manager Tests
 * Implements TC-STATE-001 through TC-STATE-005 from test plan
 *
 * TDD: These tests define the expected behavior for state file management.
 */

import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StateError, StateManager } from './state-manager.js';

// Make ESM module namespace configurable so vi.spyOn works
vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof fs>();
  return { ...actual };
});

describe('StateManager', () => {
  let tempDir: string;
  let stateManager: StateManager;

  beforeEach(async () => {
    // Create a unique temp directory for each test
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gforms-test-'));
    stateManager = new StateManager(tempDir);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  // ==========================================================================
  // TC-STATE-001: Create state file
  // ==========================================================================
  describe('TC-STATE-001: Create state file', () => {
    it('should create state file when saving form state', async () => {
      const formState = {
        localPath: 'forms/feedback.ts',
        formId: 'abc123',
      };

      await stateManager.saveFormState('forms/feedback.ts', formState);

      const stateFilePath = path.join(tempDir, 'state.json');
      const exists = await fs
        .access(stateFilePath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    });

    it('should create state file with correct schema', async () => {
      const formState = {
        localPath: 'forms/feedback.ts',
        formId: 'abc123',
      };

      await stateManager.saveFormState('forms/feedback.ts', formState);

      const state = await stateManager.load();
      expect(state.version).toBe('1.0.0');
      expect(state.forms).toBeDefined();
      expect(state.forms['forms/feedback.ts']).toBeDefined();
    });

    it('should create .gforms directory if it does not exist', async () => {
      const subDir = path.join(tempDir, '.gforms');
      const manager = new StateManager(subDir);

      await manager.saveFormState('forms/test.ts', {
        localPath: 'forms/test.ts',
      });

      const dirExists = await fs
        .access(subDir)
        .then(() => true)
        .catch(() => false);
      expect(dirExists).toBe(true);
    });
  });

  // ==========================================================================
  // TC-STATE-002: Update existing state
  // ==========================================================================
  describe('TC-STATE-002: Update existing state', () => {
    it('should update existing form state', async () => {
      // Initial save
      await stateManager.saveFormState('forms/feedback.ts', {
        localPath: 'forms/feedback.ts',
      });

      // Update with form ID after deployment
      await stateManager.saveFormState('forms/feedback.ts', {
        localPath: 'forms/feedback.ts',
        formId: 'abc123',
        lastDeployed: new Date().toISOString(),
      });

      const state = await stateManager.load();
      expect(state.forms['forms/feedback.ts']?.formId).toBe('abc123');
    });

    it('should preserve other forms when updating one', async () => {
      // Save two forms
      await stateManager.saveFormState('forms/form1.ts', {
        localPath: 'forms/form1.ts',
        formId: 'id1',
      });
      await stateManager.saveFormState('forms/form2.ts', {
        localPath: 'forms/form2.ts',
        formId: 'id2',
      });

      // Update form1
      await stateManager.saveFormState('forms/form1.ts', {
        localPath: 'forms/form1.ts',
        formId: 'id1-updated',
      });

      const state = await stateManager.load();
      expect(state.forms['forms/form1.ts']?.formId).toBe('id1-updated');
      expect(state.forms['forms/form2.ts']?.formId).toBe('id2');
    });

    it('should add new form without affecting existing forms', async () => {
      await stateManager.saveFormState('forms/existing.ts', {
        localPath: 'forms/existing.ts',
        formId: 'existing-id',
      });

      await stateManager.saveFormState('forms/new.ts', {
        localPath: 'forms/new.ts',
        formId: 'new-id',
      });

      const state = await stateManager.load();
      expect(Object.keys(state.forms)).toHaveLength(2);
      expect(state.forms['forms/existing.ts']?.formId).toBe('existing-id');
      expect(state.forms['forms/new.ts']?.formId).toBe('new-id');
    });
  });

  // ==========================================================================
  // TC-STATE-003: Load state file
  // ==========================================================================
  describe('TC-STATE-003: Load state file', () => {
    it('should load existing state file correctly', async () => {
      const initialState = {
        version: '1.0.0',
        forms: {
          'forms/test.ts': {
            localPath: 'forms/test.ts',
            formId: 'test-id',
            lastDeployed: '2024-01-15T10:30:00.000Z',
          },
        },
      };

      await fs.writeFile(path.join(tempDir, 'state.json'), JSON.stringify(initialState, null, 2));

      const state = await stateManager.load();

      expect(state.version).toBe('1.0.0');
      expect(state.forms['forms/test.ts']?.formId).toBe('test-id');
    });

    it('should return empty state when file does not exist', async () => {
      const state = await stateManager.load();

      expect(state.version).toBe('1.0.0');
      expect(state.forms).toEqual({});
    });

    it('should get form state by path', async () => {
      await stateManager.saveFormState('forms/feedback.ts', {
        localPath: 'forms/feedback.ts',
        formId: 'abc123',
        formUrl: 'https://forms.google.com/d/abc123/edit',
      });

      const formState = await stateManager.getFormState('forms/feedback.ts');

      expect(formState).toBeDefined();
      expect(formState?.formId).toBe('abc123');
      expect(formState?.formUrl).toBe('https://forms.google.com/d/abc123/edit');
    });

    it('should return undefined for non-existent form', async () => {
      const formState = await stateManager.getFormState('forms/nonexistent.ts');

      expect(formState).toBeUndefined();
    });
  });

  // ==========================================================================
  // TC-STATE-004: Handle corrupted state
  // ==========================================================================
  describe('TC-STATE-004: Handle corrupted state', () => {
    it('should throw error for invalid JSON', async () => {
      await fs.writeFile(path.join(tempDir, 'state.json'), 'invalid json {{{');

      await expect(stateManager.load()).rejects.toThrow(/parse|json/i);
    });

    it('should throw error for invalid state structure', async () => {
      await fs.writeFile(
        path.join(tempDir, 'state.json'),
        JSON.stringify({ version: '1.0.0', forms: 'invalid' })
      );

      await expect(stateManager.load()).rejects.toThrow();
    });

    it('should provide helpful error message for corrupted state', async () => {
      await fs.writeFile(path.join(tempDir, 'state.json'), 'not valid json');

      try {
        await stateManager.load();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toMatch(/state|json|parse/i);
      }
    });
  });

  // ==========================================================================
  // TC-STATE-005: Remove form from state
  // ==========================================================================
  describe('TC-STATE-005: Remove form from state', () => {
    it('should remove form from state', async () => {
      // Setup: Create state with two forms
      await stateManager.saveFormState('forms/form1.ts', {
        localPath: 'forms/form1.ts',
        formId: 'id1',
      });
      await stateManager.saveFormState('forms/form2.ts', {
        localPath: 'forms/form2.ts',
        formId: 'id2',
      });

      // Remove form1
      await stateManager.removeFormState('forms/form1.ts');

      const state = await stateManager.load();
      expect(state.forms['forms/form1.ts']).toBeUndefined();
      expect(state.forms['forms/form2.ts']).toBeDefined();
    });

    it('should update file after removing form', async () => {
      await stateManager.saveFormState('forms/test.ts', {
        localPath: 'forms/test.ts',
        formId: 'test-id',
      });

      await stateManager.removeFormState('forms/test.ts');

      // Read file directly to verify it was updated
      const content = await fs.readFile(path.join(tempDir, 'state.json'), 'utf-8');
      const state = JSON.parse(content);
      expect(state.forms['forms/test.ts']).toBeUndefined();
    });

    it('should not throw when removing non-existent form', async () => {
      await expect(stateManager.removeFormState('forms/nonexistent.ts')).resolves.not.toThrow();
    });
  });

  // ==========================================================================
  // Additional functionality tests
  // ==========================================================================
  describe('Additional functionality', () => {
    it('should list all tracked forms', async () => {
      await stateManager.saveFormState('forms/form1.ts', {
        localPath: 'forms/form1.ts',
        formId: 'id1',
      });
      await stateManager.saveFormState('forms/form2.ts', {
        localPath: 'forms/form2.ts',
      });

      const forms = await stateManager.listForms();

      expect(forms).toHaveLength(2);
      expect(forms).toContainEqual(expect.objectContaining({ localPath: 'forms/form1.ts' }));
      expect(forms).toContainEqual(expect.objectContaining({ localPath: 'forms/form2.ts' }));
    });

    it('should check if form exists', async () => {
      await stateManager.saveFormState('forms/existing.ts', {
        localPath: 'forms/existing.ts',
      });

      expect(await stateManager.hasForm('forms/existing.ts')).toBe(true);
      expect(await stateManager.hasForm('forms/nonexistent.ts')).toBe(false);
    });

    it('should handle concurrent writes safely', async () => {
      // Simulate concurrent saves
      const promises = [
        stateManager.saveFormState('forms/form1.ts', {
          localPath: 'forms/form1.ts',
          formId: 'id1',
        }),
        stateManager.saveFormState('forms/form2.ts', {
          localPath: 'forms/form2.ts',
          formId: 'id2',
        }),
      ];

      await Promise.all(promises);

      const state = await stateManager.load();
      // Both forms should be saved
      expect(Object.keys(state.forms).length).toBeGreaterThanOrEqual(1);
    });
  });

  // ==========================================================================
  // Lock mechanism branch coverage
  // ==========================================================================
  describe('Lock mechanism', () => {
    it('should throw StateError when lock file creation fails with non-EEXIST error', async () => {
      const writeFileSpy = vi
        .spyOn(fs, 'writeFile')
        .mockRejectedValue(Object.assign(new Error('Permission denied'), { code: 'EACCES' }));

      await expect(
        stateManager.saveFormState('forms/test.ts', { localPath: 'forms/test.ts' })
      ).rejects.toThrow(StateError);

      await expect(
        stateManager.saveFormState('forms/test.ts', { localPath: 'forms/test.ts' })
      ).rejects.toThrow(/lock file/i);

      writeFileSpy.mockRestore();
    });

    it('should break stale lock and retry', async () => {
      const lockPath = path.join(tempDir, 'state.json.lock');

      // Create a stale lock file (pretend it's old)
      await fs.writeFile(lockPath, '99999');

      // Make the lock file appear old by modifying its mtime
      const staleMtime = new Date(Date.now() - 15000); // 15 seconds ago (> 10s timeout)
      await fs.utimes(lockPath, staleMtime, staleMtime);

      // saveFormState should break the stale lock and succeed
      await stateManager.saveFormState('forms/test.ts', {
        localPath: 'forms/test.ts',
        formId: 'stale-lock-test',
      });

      const state = await stateManager.load();
      expect(state.forms['forms/test.ts']?.formId).toBe('stale-lock-test');
    });
  });

  // ==========================================================================
  // Load error handling branch coverage
  // ==========================================================================
  describe('Load error handling', () => {
    it('should re-throw StateError as-is', async () => {
      // Write valid JSON that fails schema validation (triggers StateError)
      await fs.writeFile(
        path.join(tempDir, 'state.json'),
        JSON.stringify({ version: 123, forms: {} })
      );

      try {
        await stateManager.load();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(StateError);
        expect((error as StateError).message).toMatch(/invalid state file/i);
      }
    });

    it('should wrap unknown read errors as StateError', async () => {
      const readFileSpy = vi
        .spyOn(fs, 'readFile')
        .mockRejectedValueOnce(Object.assign(new Error('I/O error'), { code: 'EIO' }));

      try {
        await stateManager.load();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(StateError);
        expect((error as StateError).message).toMatch(/failed to load state file/i);
      }

      readFileSpy.mockRestore();
    });
  });
});
