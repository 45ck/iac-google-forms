/**
 * Tests for content hashing utility
 */

import { describe, expect, it } from 'vitest';
import type { FormDefinition } from '../schema/index.js';
import { hashFormDefinition } from './hash.js';

const baseDef: FormDefinition = {
  title: 'Test Form',
  questions: [{ id: 'q1', type: 'text', title: 'Name', required: true, paragraph: false }],
};

describe('hashFormDefinition', () => {
  it('should return a 64-character hex string (SHA-256)', () => {
    const hash = hashFormDefinition(baseDef);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should return same hash for identical inputs', () => {
    const hash1 = hashFormDefinition(baseDef);
    const hash2 = hashFormDefinition(baseDef);
    expect(hash1).toBe(hash2);
  });

  it('should return different hash when title changes', () => {
    const modified = { ...baseDef, title: 'Different Title' };
    expect(hashFormDefinition(baseDef)).not.toBe(hashFormDefinition(modified));
  });

  it('should return different hash when questions change', () => {
    const modified: FormDefinition = {
      ...baseDef,
      questions: [{ id: 'q1', type: 'text', title: 'Name', required: false, paragraph: false }],
    };
    expect(hashFormDefinition(baseDef)).not.toBe(hashFormDefinition(modified));
  });

  it('should return different hash when description is added', () => {
    const withDesc = { ...baseDef, description: 'A description' };
    expect(hashFormDefinition(baseDef)).not.toBe(hashFormDefinition(withDesc));
  });

  it('should handle forms with no questions', () => {
    const empty: FormDefinition = { title: 'Empty', questions: [] };
    const hash = hashFormDefinition(empty);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should handle forms with description', () => {
    const withDesc: FormDefinition = {
      title: 'Form',
      description: 'Desc',
      questions: [],
    };
    const hash = hashFormDefinition(withDesc);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});
