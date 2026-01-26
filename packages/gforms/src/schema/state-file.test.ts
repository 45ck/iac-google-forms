/**
 * State File Validation Tests
 * Implements TC-STATE-001 through TC-STATE-005 test foundations
 *
 * TDD: These tests define the expected behavior for state file validation.
 */

import { describe, it, expect } from 'vitest';
import { validateStateFile, FormStateSchema } from './state-file.js';

describe('State File Validation', () => {
  // ==========================================================================
  // TC-STATE-001: Create state file (validation aspects)
  // ==========================================================================
  describe('TC-STATE-001: State file schema validation', () => {
    it('should validate an empty state file', () => {
      const state = {
        version: '1.0.0',
        forms: {},
      };

      const result = validateStateFile(state);

      expect(result.success).toBe(true);
      expect(result.data?.version).toBe('1.0.0');
      expect(result.data?.forms).toEqual({});
    });

    it('should apply default version if not provided', () => {
      const state = {
        forms: {},
      };

      const result = validateStateFile(state);

      expect(result.success).toBe(true);
      expect(result.data?.version).toBe('1.0.0');
    });

    it('should apply default empty forms if not provided', () => {
      const state = {};

      const result = validateStateFile(state);

      expect(result.success).toBe(true);
      expect(result.data?.forms).toEqual({});
    });
  });

  // ==========================================================================
  // TC-STATE-002: Update existing state (validation aspects)
  // ==========================================================================
  describe('TC-STATE-002: State with form entries', () => {
    it('should validate state file with a deployed form', () => {
      const state = {
        version: '1.0.0',
        forms: {
          'forms/feedback.ts': {
            localPath: 'forms/feedback.ts',
            formId: '1BxiMVs0XRA5upms',
            formUrl: 'https://docs.google.com/forms/d/1BxiMVs0XRA5upms/edit',
            responseUrl: 'https://docs.google.com/forms/d/1BxiMVs0XRA5upms/viewform',
            lastDeployed: '2024-01-15T10:30:00.000Z',
            lastDeployedBy: 'alex@company.com',
            contentHash: 'abc123',
          },
        },
      };

      const result = validateStateFile(state);

      expect(result.success).toBe(true);
      expect(result.data?.forms['forms/feedback.ts']?.formId).toBe('1BxiMVs0XRA5upms');
    });

    it('should validate state file with multiple forms', () => {
      const state = {
        version: '1.0.0',
        forms: {
          'forms/feedback.ts': {
            localPath: 'forms/feedback.ts',
            formId: 'form1',
          },
          'forms/survey.ts': {
            localPath: 'forms/survey.ts',
            formId: 'form2',
          },
          'forms/new.ts': {
            localPath: 'forms/new.ts',
            // No formId - not yet deployed
          },
        },
      };

      const result = validateStateFile(state);

      expect(result.success).toBe(true);
      expect(Object.keys(result.data?.forms ?? {})).toHaveLength(3);
    });
  });

  // ==========================================================================
  // TC-STATE-003: Load state file (validation aspects)
  // ==========================================================================
  describe('TC-STATE-003: Form state validation', () => {
    it('should validate form state with all optional fields', () => {
      const formState = {
        localPath: 'forms/test.ts',
        formId: 'abc123',
        formUrl: 'https://docs.google.com/forms/d/abc123/edit',
        responseUrl: 'https://docs.google.com/forms/d/abc123/viewform',
        spreadsheetId: 'sheet123',
        spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/sheet123/edit',
        lastDeployed: '2024-01-15T10:30:00.000Z',
        lastDeployedBy: 'user@example.com',
        contentHash: 'sha256hash',
        remoteRevisionId: 'rev123',
      };

      const result = FormStateSchema.safeParse(formState);

      expect(result.success).toBe(true);
    });

    it('should validate minimal form state (only localPath)', () => {
      const formState = {
        localPath: 'forms/test.ts',
      };

      const result = FormStateSchema.safeParse(formState);

      expect(result.success).toBe(true);
    });

    it('should reject form state without localPath', () => {
      const formState = {
        formId: 'abc123',
      };

      const result = FormStateSchema.safeParse(formState);

      expect(result.success).toBe(false);
    });

    it('should reject invalid URL in formUrl', () => {
      const formState = {
        localPath: 'forms/test.ts',
        formUrl: 'not-a-url',
      };

      const result = FormStateSchema.safeParse(formState);

      expect(result.success).toBe(false);
    });

    it('should reject invalid datetime in lastDeployed', () => {
      const formState = {
        localPath: 'forms/test.ts',
        lastDeployed: 'not-a-date',
      };

      const result = FormStateSchema.safeParse(formState);

      expect(result.success).toBe(false);
    });
  });

  // ==========================================================================
  // TC-STATE-004: Handle corrupted state (validation aspects)
  // ==========================================================================
  describe('TC-STATE-004: Invalid state file handling', () => {
    it('should reject null input', () => {
      const result = validateStateFile(null);

      expect(result.success).toBe(false);
    });

    it('should reject string input', () => {
      const result = validateStateFile('invalid');

      expect(result.success).toBe(false);
    });

    it('should reject array input', () => {
      const result = validateStateFile([]);

      expect(result.success).toBe(false);
    });

    it('should reject forms as array instead of object', () => {
      const state = {
        version: '1.0.0',
        forms: [{ localPath: 'forms/test.ts' }],
      };

      const result = validateStateFile(state);

      expect(result.success).toBe(false);
    });

    it('should reject invalid form state in forms object', () => {
      const state = {
        version: '1.0.0',
        forms: {
          'forms/test.ts': {
            // Missing required localPath
            formId: 'abc123',
          },
        },
      };

      const result = validateStateFile(state);

      expect(result.success).toBe(false);
    });
  });

  // ==========================================================================
  // TC-STATE-005: Remove form from state (validation aspects)
  // ==========================================================================
  describe('TC-STATE-005: State file mutations', () => {
    it('should validate state after removing a form', () => {
      const initialState = {
        version: '1.0.0',
        forms: {
          'forms/feedback.ts': { localPath: 'forms/feedback.ts', formId: 'form1' },
          'forms/survey.ts': { localPath: 'forms/survey.ts', formId: 'form2' },
        },
      };

      // Simulate removing a form
      const remainingForms = Object.fromEntries(
        Object.entries(initialState.forms).filter(([key]) => key !== 'forms/feedback.ts')
      );
      const updatedState = {
        ...initialState,
        forms: remainingForms,
      };

      const result = validateStateFile(updatedState);

      expect(result.success).toBe(true);
      expect(result.data?.forms['forms/feedback.ts']).toBeUndefined();
      expect(result.data?.forms['forms/survey.ts']).toBeDefined();
    });
  });

  // ==========================================================================
  // Edge cases
  // ==========================================================================
  describe('Edge cases', () => {
    it('should handle form state with spreadsheet integration', () => {
      const state = {
        version: '1.0.0',
        forms: {
          'forms/feedback.ts': {
            localPath: 'forms/feedback.ts',
            formId: 'abc123',
            spreadsheetId: 'sheet456',
            spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/sheet456/edit',
          },
        },
      };

      const result = validateStateFile(state);

      expect(result.success).toBe(true);
      expect(result.data?.forms['forms/feedback.ts']?.spreadsheetId).toBe('sheet456');
    });

    it('should handle deeply nested path in localPath', () => {
      const state = {
        version: '1.0.0',
        forms: {
          'src/forms/customer/feedback.ts': {
            localPath: 'src/forms/customer/feedback.ts',
            formId: 'abc123',
          },
        },
      };

      const result = validateStateFile(state);

      expect(result.success).toBe(true);
    });
  });
});
