/**
 * Tests for diff comparator functions
 * Covers getQuestionChanges and getIntegrationChanges
 */

import { describe, expect, it } from 'vitest';
import type { Integration, Question } from '../schema/index.js';
import { getIntegrationChanges, getQuestionChanges } from './comparators.js';

describe('getQuestionChanges', () => {
  describe('common properties', () => {
    it('should detect title change', () => {
      const local: Question = {
        id: 'q1',
        type: 'text',
        title: 'New',
        required: true,
        paragraph: false,
      };
      const remote: Question = {
        id: 'q1',
        type: 'text',
        title: 'Old',
        required: true,
        paragraph: false,
      };
      expect(getQuestionChanges(local, remote)).toContain('title');
    });

    it('should detect required change', () => {
      const local: Question = {
        id: 'q1',
        type: 'text',
        title: 'Q',
        required: true,
        paragraph: false,
      };
      const remote: Question = {
        id: 'q1',
        type: 'text',
        title: 'Q',
        required: false,
        paragraph: false,
      };
      expect(getQuestionChanges(local, remote)).toContain('required');
    });

    it('should detect description change', () => {
      const local: Question = {
        id: 'q1',
        type: 'text',
        title: 'Q',
        required: true,
        paragraph: false,
        description: 'New',
      };
      const remote: Question = {
        id: 'q1',
        type: 'text',
        title: 'Q',
        required: true,
        paragraph: false,
        description: 'Old',
      };
      expect(getQuestionChanges(local, remote)).toContain('description');
    });

    it('should return empty array when no changes', () => {
      const q: Question = { id: 'q1', type: 'text', title: 'Q', required: true, paragraph: false };
      expect(getQuestionChanges(q, q)).toEqual([]);
    });
  });

  describe('text questions', () => {
    it('should detect paragraph change', () => {
      const local: Question = {
        id: 'q1',
        type: 'text',
        title: 'Q',
        required: true,
        paragraph: true,
      };
      const remote: Question = {
        id: 'q1',
        type: 'text',
        title: 'Q',
        required: true,
        paragraph: false,
      };
      expect(getQuestionChanges(local, remote)).toContain('paragraph');
    });

    it('should detect maxLength change', () => {
      const local: Question = {
        id: 'q1',
        type: 'text',
        title: 'Q',
        required: true,
        paragraph: false,
        maxLength: 100,
      };
      const remote: Question = {
        id: 'q1',
        type: 'text',
        title: 'Q',
        required: true,
        paragraph: false,
        maxLength: 200,
      };
      expect(getQuestionChanges(local, remote)).toContain('maxLength');
    });
  });

  describe('choice questions', () => {
    const makeChoice = (overrides: Partial<Question> = {}): Question => ({
      id: 'q1',
      type: 'choice' as const,
      title: 'Q',
      required: false,
      options: ['A', 'B', 'C'],
      allowOther: false,
      multiple: false,
      ...overrides,
    });

    it('should detect options change', () => {
      const local = makeChoice({ options: ['A', 'B', 'D'] });
      const remote = makeChoice({ options: ['A', 'B', 'C'] });
      expect(getQuestionChanges(local, remote)).toContain('options');
    });

    it('should detect allowOther change', () => {
      const local = makeChoice({ allowOther: true });
      const remote = makeChoice({ allowOther: false });
      expect(getQuestionChanges(local, remote)).toContain('allowOther');
    });

    it('should detect multiple change', () => {
      const local = makeChoice({ multiple: true });
      const remote = makeChoice({ multiple: false });
      expect(getQuestionChanges(local, remote)).toContain('multiple');
    });

    it('should return no changes for identical choice questions', () => {
      const q = makeChoice();
      expect(getQuestionChanges(q, q)).toEqual([]);
    });
  });

  describe('dropdown questions', () => {
    it('should detect options change in dropdown', () => {
      const local: Question = {
        id: 'q1',
        type: 'dropdown',
        title: 'Q',
        required: false,
        options: ['X', 'Y'],
      };
      const remote: Question = {
        id: 'q1',
        type: 'dropdown',
        title: 'Q',
        required: false,
        options: ['X', 'Z'],
      };
      expect(getQuestionChanges(local, remote)).toContain('options');
    });

    it('should return no changes for identical dropdown questions', () => {
      const q: Question = {
        id: 'q1',
        type: 'dropdown',
        title: 'Q',
        required: false,
        options: ['X', 'Y'],
      };
      expect(getQuestionChanges(q, q)).toEqual([]);
    });
  });

  describe('scale questions', () => {
    const makeScale = (overrides: Partial<Question> = {}): Question => ({
      id: 'q1',
      type: 'scale' as const,
      title: 'Q',
      required: true,
      min: 1,
      max: 5,
      ...overrides,
    });

    it('should detect min change', () => {
      const local = makeScale({ min: 0 });
      const remote = makeScale({ min: 1 });
      expect(getQuestionChanges(local, remote)).toContain('min');
    });

    it('should detect max change', () => {
      const local = makeScale({ max: 10 });
      const remote = makeScale({ max: 5 });
      expect(getQuestionChanges(local, remote)).toContain('max');
    });

    it('should detect minLabel change', () => {
      const local = makeScale({ minLabel: 'Bad' });
      const remote = makeScale({ minLabel: 'Poor' });
      expect(getQuestionChanges(local, remote)).toContain('minLabel');
    });

    it('should detect maxLabel change', () => {
      const local = makeScale({ maxLabel: 'Great' });
      const remote = makeScale({ maxLabel: 'Best' });
      expect(getQuestionChanges(local, remote)).toContain('maxLabel');
    });

    it('should return no changes for identical scale questions', () => {
      const q = makeScale();
      expect(getQuestionChanges(q, q)).toEqual([]);
    });
  });

  describe('cross-type', () => {
    it('should not detect type-specific changes for mismatched types', () => {
      const text: Question = {
        id: 'q1',
        type: 'text',
        title: 'Q',
        required: true,
        paragraph: false,
      };
      const choice: Question = {
        id: 'q1',
        type: 'choice',
        title: 'Q',
        required: true,
        options: ['A'],
        allowOther: false,
        multiple: false,
      };
      // Only common prop comparisons apply; type-specific comparisons short-circuit
      const changes = getQuestionChanges(text, choice);
      expect(changes).not.toContain('paragraph');
      expect(changes).not.toContain('options');
    });
  });
});

describe('getIntegrationChanges', () => {
  describe('sheets integration', () => {
    it('should detect spreadsheetName change', () => {
      const local: Integration = { type: 'sheets', spreadsheetName: 'New Sheet' };
      const remote: Integration = { type: 'sheets', spreadsheetName: 'Old Sheet' };
      expect(getIntegrationChanges(local, remote)).toContain('spreadsheetName');
    });

    it('should detect spreadsheetId change', () => {
      const local: Integration = { type: 'sheets', spreadsheetName: 'S', spreadsheetId: 'id1' };
      const remote: Integration = { type: 'sheets', spreadsheetName: 'S', spreadsheetId: 'id2' };
      expect(getIntegrationChanges(local, remote)).toContain('spreadsheetId');
    });

    it('should detect folderId change', () => {
      const local: Integration = { type: 'sheets', spreadsheetName: 'S', folderId: 'f1' };
      const remote: Integration = { type: 'sheets', spreadsheetName: 'S', folderId: 'f2' };
      expect(getIntegrationChanges(local, remote)).toContain('folderId');
    });

    it('should return no changes for identical sheets integrations', () => {
      const i: Integration = { type: 'sheets', spreadsheetName: 'S' };
      expect(getIntegrationChanges(i, i)).toEqual([]);
    });
  });

  describe('email integration', () => {
    it('should detect to change', () => {
      const local: Integration = { type: 'email', to: ['a@b.com'], subject: 'S' };
      const remote: Integration = { type: 'email', to: ['x@y.com'], subject: 'S' };
      expect(getIntegrationChanges(local, remote)).toContain('to');
    });

    it('should detect subject change', () => {
      const local: Integration = { type: 'email', to: ['a@b.com'], subject: 'New' };
      const remote: Integration = { type: 'email', to: ['a@b.com'], subject: 'Old' };
      expect(getIntegrationChanges(local, remote)).toContain('subject');
    });

    it('should return no changes for identical email integrations', () => {
      const i: Integration = { type: 'email', to: ['a@b.com'], subject: 'S' };
      expect(getIntegrationChanges(i, i)).toEqual([]);
    });
  });

  describe('webhook integration', () => {
    it('should detect url change', () => {
      const local: Integration = { type: 'webhook', url: 'https://new.com', method: 'POST' };
      const remote: Integration = { type: 'webhook', url: 'https://old.com', method: 'POST' };
      expect(getIntegrationChanges(local, remote)).toContain('url');
    });

    it('should detect method change', () => {
      const local: Integration = { type: 'webhook', url: 'https://x.com', method: 'PUT' };
      const remote: Integration = { type: 'webhook', url: 'https://x.com', method: 'POST' };
      expect(getIntegrationChanges(local, remote)).toContain('method');
    });

    it('should return no changes for identical webhook integrations', () => {
      const i: Integration = { type: 'webhook', url: 'https://x.com', method: 'POST' };
      expect(getIntegrationChanges(i, i)).toEqual([]);
    });
  });

  describe('cross-type', () => {
    it('should not detect type-specific changes for mismatched types', () => {
      const sheets: Integration = { type: 'sheets', spreadsheetName: 'S' };
      const email: Integration = { type: 'email', to: ['a@b.com'], subject: 'S' };
      const changes = getIntegrationChanges(sheets, email);
      expect(changes).not.toContain('spreadsheetName');
      expect(changes).not.toContain('to');
    });
  });
});
