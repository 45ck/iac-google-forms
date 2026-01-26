/**
 * Diff Engine Tests
 * Implements TC-DIFF-001 through TC-DIFF-008 from test plan
 *
 * TDD: These tests define the expected behavior for form diffing.
 */

import { describe, it, expect } from 'vitest';
import { DiffEngine } from './diff-engine.js';
import type { FormDefinition } from '../schema/index.js';

describe('DiffEngine', () => {
  const diffEngine = new DiffEngine();

  // Helper to create a minimal valid form
  const createForm = (overrides: Partial<FormDefinition> = {}): FormDefinition => ({
    title: 'Test Form',
    questions: [{ id: 'q1', type: 'text', title: 'Question 1' }],
    ...overrides,
  });

  // ==========================================================================
  // TC-DIFF-001: New form (no remote)
  // ==========================================================================
  describe('TC-DIFF-001: New form (no remote)', () => {
    it('should detect new form when no remote exists', () => {
      const local = createForm({ title: 'New Form' });

      const result = diffEngine.diff(local, null);

      expect(result.status).toBe('new');
      expect(result.hasChanges).toBe(true);
    });

    it('should list all questions as additions for new form', () => {
      const local = createForm({
        questions: [
          { id: 'q1', type: 'text', title: 'Q1' },
          { id: 'q2', type: 'email', title: 'Q2' },
        ],
      });

      const result = diffEngine.diff(local, null);

      expect(result.questions).toHaveLength(2);
      expect(result.questions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ action: 'add', questionId: 'q1' }),
          expect.objectContaining({ action: 'add', questionId: 'q2' }),
        ])
      );
    });
  });

  // ==========================================================================
  // TC-DIFF-002: No changes
  // ==========================================================================
  describe('TC-DIFF-002: No changes', () => {
    it('should detect no changes when local matches remote', () => {
      const form = createForm({ title: 'Same Form' });

      const result = diffEngine.diff(form, form);

      expect(result.status).toBe('unchanged');
      expect(result.hasChanges).toBe(false);
    });

    it('should return empty arrays for questions and integrations', () => {
      const form = createForm();

      const result = diffEngine.diff(form, form);

      expect(result.questions.filter((q) => q.action !== 'unchanged')).toHaveLength(0);
      expect(result.integrations.filter((i) => i.action !== 'unchanged')).toHaveLength(0);
    });
  });

  // ==========================================================================
  // TC-DIFF-003: Title changed
  // ==========================================================================
  describe('TC-DIFF-003: Title changed', () => {
    it('should detect title change', () => {
      const local = createForm({ title: 'New Title' });
      const remote = createForm({ title: 'Old Title' });

      const result = diffEngine.diff(local, remote);

      expect(result.status).toBe('modified');
      expect(result.hasChanges).toBe(true);
      expect(result.title).toEqual({
        local: 'New Title',
        remote: 'Old Title',
      });
    });
  });

  // ==========================================================================
  // TC-DIFF-004: Question added
  // ==========================================================================
  describe('TC-DIFF-004: Question added', () => {
    it('should detect added question', () => {
      const local = createForm({
        questions: [
          { id: 'q1', type: 'text', title: 'Q1' },
          { id: 'q2', type: 'text', title: 'Q2 (new)' },
        ],
      });
      const remote = createForm({
        questions: [{ id: 'q1', type: 'text', title: 'Q1' }],
      });

      const result = diffEngine.diff(local, remote);

      expect(result.status).toBe('modified');
      expect(result.hasChanges).toBe(true);
      expect(result.questions).toContainEqual(
        expect.objectContaining({
          action: 'add',
          questionId: 'q2',
        })
      );
    });
  });

  // ==========================================================================
  // TC-DIFF-005: Question removed
  // ==========================================================================
  describe('TC-DIFF-005: Question removed', () => {
    it('should detect removed question', () => {
      const local = createForm({
        questions: [{ id: 'q1', type: 'text', title: 'Q1' }],
      });
      const remote = createForm({
        questions: [
          { id: 'q1', type: 'text', title: 'Q1' },
          { id: 'q2', type: 'text', title: 'Q2 (to be removed)' },
        ],
      });

      const result = diffEngine.diff(local, remote);

      expect(result.status).toBe('modified');
      expect(result.hasChanges).toBe(true);
      expect(result.questions).toContainEqual(
        expect.objectContaining({
          action: 'remove',
          questionId: 'q2',
        })
      );
    });
  });

  // ==========================================================================
  // TC-DIFF-006: Question modified
  // ==========================================================================
  describe('TC-DIFF-006: Question modified', () => {
    it('should detect modified question title', () => {
      const local = createForm({
        questions: [{ id: 'q1', type: 'text', title: 'Updated Title' }],
      });
      const remote = createForm({
        questions: [{ id: 'q1', type: 'text', title: 'Original Title' }],
      });

      const result = diffEngine.diff(local, remote);

      expect(result.status).toBe('modified');
      expect(result.hasChanges).toBe(true);
      expect(result.questions).toContainEqual(
        expect.objectContaining({
          action: 'modify',
          questionId: 'q1',
          changes: expect.arrayContaining(['title']),
        })
      );
    });

    it('should detect modified question options', () => {
      const local = createForm({
        questions: [
          { id: 'q1', type: 'choice', title: 'Pick', options: ['A', 'B', 'C'] },
        ],
      });
      const remote = createForm({
        questions: [{ id: 'q1', type: 'choice', title: 'Pick', options: ['A', 'B'] }],
      });

      const result = diffEngine.diff(local, remote);

      expect(result.status).toBe('modified');
      expect(result.questions).toContainEqual(
        expect.objectContaining({
          action: 'modify',
          questionId: 'q1',
          changes: expect.arrayContaining(['options']),
        })
      );
    });

    it('should detect modified scale labels', () => {
      const local = createForm({
        questions: [
          {
            id: 'q1',
            type: 'scale',
            title: 'Rating',
            min: 1,
            max: 5,
            maxLabel: 'Excellent',
          },
        ],
      });
      const remote = createForm({
        questions: [
          {
            id: 'q1',
            type: 'scale',
            title: 'Rating',
            min: 1,
            max: 5,
            maxLabel: 'Very Satisfied',
          },
        ],
      });

      const result = diffEngine.diff(local, remote);

      expect(result.questions).toContainEqual(
        expect.objectContaining({
          action: 'modify',
          questionId: 'q1',
          changes: expect.arrayContaining(['maxLabel']),
        })
      );
    });

    it('should detect required flag change', () => {
      const local = createForm({
        questions: [{ id: 'q1', type: 'text', title: 'Q1', required: true }],
      });
      const remote = createForm({
        questions: [{ id: 'q1', type: 'text', title: 'Q1', required: false }],
      });

      const result = diffEngine.diff(local, remote);

      expect(result.questions).toContainEqual(
        expect.objectContaining({
          action: 'modify',
          questionId: 'q1',
          changes: expect.arrayContaining(['required']),
        })
      );
    });
  });

  // ==========================================================================
  // TC-DIFF-007: Integration added
  // ==========================================================================
  describe('TC-DIFF-007: Integration added', () => {
    it('should detect added sheets integration', () => {
      const local = createForm({
        integrations: [{ type: 'sheets', spreadsheetName: 'Responses' }],
      });
      const remote = createForm({
        integrations: [],
      });

      const result = diffEngine.diff(local, remote);

      expect(result.status).toBe('modified');
      expect(result.hasChanges).toBe(true);
      expect(result.integrations).toContainEqual(
        expect.objectContaining({
          action: 'add',
          integrationType: 'sheets',
        })
      );
    });

    it('should detect added email integration', () => {
      const local = createForm({
        integrations: [{ type: 'email', to: ['admin@example.com'] }],
      });
      const remote = createForm();

      const result = diffEngine.diff(local, remote);

      expect(result.integrations).toContainEqual(
        expect.objectContaining({
          action: 'add',
          integrationType: 'email',
        })
      );
    });

    it('should detect modified integration', () => {
      const local = createForm({
        integrations: [{ type: 'sheets', spreadsheetName: 'New Responses' }],
      });
      const remote = createForm({
        integrations: [{ type: 'sheets', spreadsheetName: 'Old Responses' }],
      });

      const result = diffEngine.diff(local, remote);

      expect(result.integrations).toContainEqual(
        expect.objectContaining({
          action: 'modify',
          integrationType: 'sheets',
          changes: expect.arrayContaining(['spreadsheetName']),
        })
      );
    });

    it('should detect removed integration', () => {
      const local = createForm({
        integrations: [],
      });
      const remote = createForm({
        integrations: [{ type: 'webhook', url: 'https://api.example.com' }],
      });

      const result = diffEngine.diff(local, remote);

      expect(result.integrations).toContainEqual(
        expect.objectContaining({
          action: 'remove',
          integrationType: 'webhook',
        })
      );
    });

    it('should handle duplicate integration types without data loss', () => {
      const local = createForm({
        integrations: [
          { type: 'sheets', spreadsheetName: 'Sheet1' },
          { type: 'sheets', spreadsheetName: 'Sheet2' },
        ],
      });
      const remote = createForm({
        integrations: [
          { type: 'sheets', spreadsheetName: 'Sheet1' },
          { type: 'sheets', spreadsheetName: 'Sheet2-old' },
        ],
      });

      const result = diffEngine.diff(local, remote);

      const sheetsIntegrations = result.integrations.filter(
        (i) => i.integrationType === 'sheets'
      );
      expect(sheetsIntegrations).toHaveLength(2);
      expect(sheetsIntegrations.filter((i) => i.action === 'unchanged')).toHaveLength(1);
      expect(sheetsIntegrations.filter((i) => i.action === 'modify')).toHaveLength(1);
    });
  });

  // ==========================================================================
  // TC-DIFF-008: Question order changed
  // ==========================================================================
  describe('TC-DIFF-008: Question order changed', () => {
    it('should detect question reorder', () => {
      const local = createForm({
        questions: [
          { id: 'q2', type: 'text', title: 'Q2' },
          { id: 'q1', type: 'text', title: 'Q1' },
        ],
      });
      const remote = createForm({
        questions: [
          { id: 'q1', type: 'text', title: 'Q1' },
          { id: 'q2', type: 'text', title: 'Q2' },
        ],
      });

      const result = diffEngine.diff(local, remote);

      expect(result.status).toBe('modified');
      expect(result.hasChanges).toBe(true);
      // Questions are unchanged individually but order changed
      expect(result.orderChanged).toBe(true);
    });
  });

  // ==========================================================================
  // Additional diff scenarios
  // ==========================================================================
  describe('Additional scenarios', () => {
    it('should handle description change', () => {
      const local = createForm({ description: 'New description' });
      const remote = createForm({ description: 'Old description' });

      const result = diffEngine.diff(local, remote);

      expect(result.status).toBe('modified');
      expect(result.description).toEqual({
        local: 'New description',
        remote: 'Old description',
      });
    });

    it('should handle settings changes', () => {
      const local = createForm({
        settings: { collectEmail: true, limitOneResponse: true },
      });
      const remote = createForm({
        settings: { collectEmail: false, limitOneResponse: false },
      });

      const result = diffEngine.diff(local, remote);

      expect(result.status).toBe('modified');
      expect(result.settings).toBeDefined();
      expect(result.settings?.changes).toContain('collectEmail');
      expect(result.settings?.changes).toContain('limitOneResponse');
    });

    it('should handle multiple changes at once', () => {
      const local = createForm({
        title: 'New Title',
        questions: [
          { id: 'q1', type: 'text', title: 'Modified Q1' },
          { id: 'q3', type: 'text', title: 'New Q3' },
        ],
        integrations: [{ type: 'sheets', spreadsheetName: 'New Sheet' }],
      });
      const remote = createForm({
        title: 'Old Title',
        questions: [
          { id: 'q1', type: 'text', title: 'Q1' },
          { id: 'q2', type: 'text', title: 'Q2 to remove' },
        ],
        integrations: [],
      });

      const result = diffEngine.diff(local, remote);

      expect(result.status).toBe('modified');
      expect(result.hasChanges).toBe(true);
      expect(result.title).toBeDefined();
      expect(result.questions.find((q) => q.action === 'modify')).toBeDefined();
      expect(result.questions.find((q) => q.action === 'add')).toBeDefined();
      expect(result.questions.find((q) => q.action === 'remove')).toBeDefined();
      expect(result.integrations.find((i) => i.action === 'add')).toBeDefined();
    });

    it('should handle nested section questions', () => {
      const local = createForm({
        questions: [
          {
            type: 'section',
            title: 'Section 1',
            questions: [{ id: 'nested1', type: 'text', title: 'Updated Nested' }],
          },
        ],
      });
      const remote = createForm({
        questions: [
          {
            type: 'section',
            title: 'Section 1',
            questions: [{ id: 'nested1', type: 'text', title: 'Original Nested' }],
          },
        ],
      });

      const result = diffEngine.diff(local, remote);

      expect(result.status).toBe('modified');
      expect(result.hasChanges).toBe(true);
    });
  });

  // ==========================================================================
  // Summary generation
  // ==========================================================================
  describe('Summary generation', () => {
    it('should generate correct summary counts', () => {
      const local = createForm({
        questions: [
          { id: 'q1', type: 'text', title: 'Modified' },
          { id: 'q3', type: 'text', title: 'Added' },
        ],
      });
      const remote = createForm({
        questions: [
          { id: 'q1', type: 'text', title: 'Original' },
          { id: 'q2', type: 'text', title: 'Removed' },
        ],
      });

      const result = diffEngine.diff(local, remote);
      const summary = diffEngine.getSummary(result);

      expect(summary.modified).toBe(1);
      expect(summary.added).toBe(1);
      expect(summary.removed).toBe(1);
    });
  });
});
