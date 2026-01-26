/**
 * Form Definition Validation Tests
 * Implements TC-VAL-001 through TC-VAL-008 from test plan
 *
 * TDD: These tests define the expected behavior.
 * The Zod schemas in form-definition.ts make these tests pass.
 */

import { describe, it, expect } from 'vitest';
import {
  validateFormDefinition,
  TextQuestionSchema,
  EmailQuestionSchema,
  ChoiceQuestionSchema,
  DropdownQuestionSchema,
  ScaleQuestionSchema,
  SectionSchema,
  EmailIntegrationSchema,
} from './form-definition.js';

describe('Form Definition Validation', () => {
  // ==========================================================================
  // TC-VAL-001: Valid minimal form
  // ==========================================================================
  describe('TC-VAL-001: Valid minimal form', () => {
    it('should validate a minimal form with title and 1 question', () => {
      const form = {
        title: 'Test',
        questions: [{ id: 'q1', type: 'text', title: 'Q1' }],
      };

      const result = validateFormDefinition(form);

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('Test');
      expect(result.data?.questions).toHaveLength(1);
    });

    it('should apply default values for optional fields', () => {
      const form = {
        title: 'Test',
        questions: [{ id: 'q1', type: 'text', title: 'Q1' }],
      };

      const result = validateFormDefinition(form);

      expect(result.success).toBe(true);
      // Check defaults are applied
      expect(result.data?.questions[0]).toMatchObject({
        id: 'q1',
        type: 'text',
        title: 'Q1',
        required: false,
        paragraph: false,
      });
    });
  });

  // ==========================================================================
  // TC-VAL-002: Missing title
  // ==========================================================================
  describe('TC-VAL-002: Missing title', () => {
    it('should reject a form without title', () => {
      const form = {
        questions: [{ id: 'q1', type: 'text', title: 'Q1' }],
      };

      const result = validateFormDefinition(form);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          path: ['title'],
          message: expect.stringMatching(/required/i),
        })
      );
    });

    it('should reject a form with empty title', () => {
      const form = {
        title: '',
        questions: [{ id: 'q1', type: 'text', title: 'Q1' }],
      };

      const result = validateFormDefinition(form);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          path: ['title'],
          message: expect.stringMatching(/required/i),
        })
      );
    });
  });

  // ==========================================================================
  // TC-VAL-003: Empty questions array
  // ==========================================================================
  describe('TC-VAL-003: Empty questions array', () => {
    it('should reject a form with empty questions array', () => {
      const form = {
        title: 'Test',
        questions: [],
      };

      const result = validateFormDefinition(form);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          path: ['questions'],
          message: expect.stringMatching(/at least 1/i),
        })
      );
    });

    it('should reject a form without questions property', () => {
      const form = {
        title: 'Test',
      };

      const result = validateFormDefinition(form);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          path: ['questions'],
          message: expect.stringMatching(/required/i),
        })
      );
    });
  });

  // ==========================================================================
  // TC-VAL-004: Invalid question ID format
  // ==========================================================================
  describe('TC-VAL-004: Invalid question ID format', () => {
    it('should reject question ID that starts with a number', () => {
      const form = {
        title: 'Test',
        questions: [{ id: '123abc', type: 'text', title: 'Q1' }],
      };

      const result = validateFormDefinition(form);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          path: expect.arrayContaining(['questions', 0, 'id']),
          message: expect.stringMatching(/must start with a letter|pattern/i),
        })
      );
    });

    it('should reject question ID with special characters', () => {
      const form = {
        title: 'Test',
        questions: [{ id: 'q1@invalid', type: 'text', title: 'Q1' }],
      };

      const result = validateFormDefinition(form);

      expect(result.success).toBe(false);
    });

    it('should accept valid question IDs with letters, numbers, underscores, and hyphens', () => {
      const form = {
        title: 'Test',
        questions: [
          { id: 'q1', type: 'text', title: 'Q1' },
          { id: 'question_2', type: 'text', title: 'Q2' },
          { id: 'question-3', type: 'text', title: 'Q3' },
          { id: 'Q4_test-123', type: 'text', title: 'Q4' },
        ],
      };

      const result = validateFormDefinition(form);

      expect(result.success).toBe(true);
    });
  });

  // ==========================================================================
  // TC-VAL-005: Duplicate question IDs
  // ==========================================================================
  describe('TC-VAL-005: Duplicate question IDs', () => {
    it('should reject form with duplicate question IDs', () => {
      const form = {
        title: 'Test',
        questions: [
          { id: 'q1', type: 'text', title: 'Q1' },
          { id: 'q1', type: 'email', title: 'Q2' },
        ],
      };

      const result = validateFormDefinition(form);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          message: expect.stringMatching(/duplicate.*q1/i),
        })
      );
    });

    it('should reject duplicate IDs across sections and top-level', () => {
      const form = {
        title: 'Test',
        questions: [
          { id: 'q1', type: 'text', title: 'Q1' },
          {
            type: 'section',
            title: 'Section 1',
            questions: [{ id: 'q1', type: 'text', title: 'Nested Q1' }],
          },
        ],
      };

      const result = validateFormDefinition(form);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          message: expect.stringMatching(/duplicate.*q1/i),
        })
      );
    });

    it('should accept form with unique question IDs', () => {
      const form = {
        title: 'Test',
        questions: [
          { id: 'q1', type: 'text', title: 'Q1' },
          { id: 'q2', type: 'text', title: 'Q2' },
          { id: 'q3', type: 'text', title: 'Q3' },
        ],
      };

      const result = validateFormDefinition(form);

      expect(result.success).toBe(true);
    });
  });

  // ==========================================================================
  // TC-VAL-006: All question types valid
  // ==========================================================================
  describe('TC-VAL-006: All question types valid', () => {
    it('should validate text question', () => {
      const result = TextQuestionSchema.safeParse({
        id: 'q1',
        type: 'text',
        title: 'Name',
        paragraph: true,
        maxLength: 500,
      });

      expect(result.success).toBe(true);
    });

    it('should validate email question', () => {
      const result = EmailQuestionSchema.safeParse({
        id: 'email',
        type: 'email',
        title: 'Your email',
        required: true,
      });

      expect(result.success).toBe(true);
    });

    it('should validate choice question', () => {
      const result = ChoiceQuestionSchema.safeParse({
        id: 'choice',
        type: 'choice',
        title: 'Pick one',
        options: ['A', 'B', 'C'],
        allowOther: true,
        multiple: false,
      });

      expect(result.success).toBe(true);
    });

    it('should validate dropdown question', () => {
      const result = DropdownQuestionSchema.safeParse({
        id: 'dropdown',
        type: 'dropdown',
        title: 'Select',
        options: ['Option 1', 'Option 2'],
      });

      expect(result.success).toBe(true);
    });

    it('should validate scale question', () => {
      const result = ScaleQuestionSchema.safeParse({
        id: 'rating',
        type: 'scale',
        title: 'Rate us',
        min: 1,
        max: 5,
        minLabel: 'Poor',
        maxLabel: 'Excellent',
      });

      expect(result.success).toBe(true);
    });

    it('should validate section with nested questions', () => {
      const result = SectionSchema.safeParse({
        type: 'section',
        title: 'Demographics',
        description: 'Tell us about yourself',
        questions: [
          { id: 'age', type: 'text', title: 'Age' },
          { id: 'gender', type: 'choice', title: 'Gender', options: ['M', 'F', 'Other'] },
        ],
      });

      expect(result.success).toBe(true);
    });

    it('should validate form with all 6 question types', () => {
      const form = {
        title: 'Complete Form',
        questions: [
          { id: 'q1', type: 'text', title: 'Text Question' },
          { id: 'q2', type: 'email', title: 'Email Question' },
          { id: 'q3', type: 'choice', title: 'Choice Question', options: ['A', 'B'] },
          { id: 'q4', type: 'dropdown', title: 'Dropdown Question', options: ['X', 'Y'] },
          { id: 'q5', type: 'scale', title: 'Scale Question', min: 1, max: 10 },
          {
            type: 'section',
            title: 'Section',
            questions: [{ id: 'q6', type: 'text', title: 'Nested Text' }],
          },
        ],
      };

      const result = validateFormDefinition(form);

      expect(result.success).toBe(true);
      expect(result.data?.questions).toHaveLength(6);
    });
  });

  // ==========================================================================
  // TC-VAL-007: Scale question bounds
  // ==========================================================================
  describe('TC-VAL-007: Scale question bounds', () => {
    it('should reject scale with max less than min', () => {
      const form = {
        title: 'Test',
        questions: [{ id: 'q1', type: 'scale', title: 'Rating', min: 5, max: 3 }],
      };

      const result = validateFormDefinition(form);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          message: expect.stringMatching(/max must be greater than min/i),
        })
      );
    });

    it('should reject scale with max equal to min', () => {
      const form = {
        title: 'Test',
        questions: [{ id: 'q1', type: 'scale', title: 'Rating', min: 1, max: 1 }],
      };

      const result = validateFormDefinition(form);

      // This should fail because max (1) is not > min (1), and also max must be >= 2
      expect(result.success).toBe(false);
    });

    it('should accept scale with valid bounds (min 0-1, max 2-10)', () => {
      const form = {
        title: 'Test',
        questions: [{ id: 'q1', type: 'scale', title: 'Rating', min: 0, max: 10 }],
      };

      const result = validateFormDefinition(form);

      expect(result.success).toBe(true);
    });

    it('should reject scale with min > 1', () => {
      const form = {
        title: 'Test',
        questions: [{ id: 'q1', type: 'scale', title: 'Rating', min: 2, max: 5 }],
      };

      const result = validateFormDefinition(form);

      expect(result.success).toBe(false);
    });

    it('should reject scale with max > 10', () => {
      const form = {
        title: 'Test',
        questions: [{ id: 'q1', type: 'scale', title: 'Rating', min: 1, max: 11 }],
      };

      const result = validateFormDefinition(form);

      expect(result.success).toBe(false);
    });
  });

  // ==========================================================================
  // TC-VAL-008: Invalid email in integration
  // ==========================================================================
  describe('TC-VAL-008: Invalid email in integration', () => {
    it('should reject email integration with invalid email format', () => {
      const result = EmailIntegrationSchema.safeParse({
        type: 'email',
        to: ['not-an-email'],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            message: expect.stringMatching(/invalid email/i),
          })
        );
      }
    });

    it('should reject form with invalid email in integration', () => {
      const form = {
        title: 'Test',
        questions: [{ id: 'q1', type: 'text', title: 'Q1' }],
        integrations: [{ type: 'email', to: ['invalid-email', 'also@invalid'] }],
      };

      const result = validateFormDefinition(form);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          message: expect.stringMatching(/invalid email/i),
        })
      );
    });

    it('should accept valid email addresses in integration', () => {
      const result = EmailIntegrationSchema.safeParse({
        type: 'email',
        to: ['test@example.com', 'admin@company.org'],
        subject: 'New submission',
      });

      expect(result.success).toBe(true);
    });
  });

  // ==========================================================================
  // Additional edge cases
  // ==========================================================================
  describe('Additional validation cases', () => {
    it('should validate form with all integrations', () => {
      const form = {
        title: 'Full Form',
        questions: [{ id: 'q1', type: 'text', title: 'Q1' }],
        integrations: [
          { type: 'sheets', spreadsheetName: 'Responses' },
          { type: 'email', to: ['admin@example.com'] },
          { type: 'webhook', url: 'https://api.example.com/webhook' },
        ],
      };

      const result = validateFormDefinition(form);

      expect(result.success).toBe(true);
    });

    it('should validate form with settings', () => {
      const form = {
        title: 'Quiz Form',
        questions: [{ id: 'q1', type: 'text', title: 'Q1' }],
        settings: {
          collectEmail: true,
          limitOneResponse: true,
          confirmationMessage: 'Thanks!',
          quiz: {
            isQuiz: true,
            showScore: true,
          },
        },
      };

      const result = validateFormDefinition(form);

      expect(result.success).toBe(true);
      expect(result.data?.settings?.collectEmail).toBe(true);
    });

    it('should reject choice question with empty options', () => {
      const form = {
        title: 'Test',
        questions: [{ id: 'q1', type: 'choice', title: 'Pick', options: [] }],
      };

      const result = validateFormDefinition(form);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          message: expect.stringMatching(/at least 1/i),
        })
      );
    });

    it('should validate conditional logic in sections', () => {
      const form = {
        title: 'Conditional Form',
        questions: [
          {
            id: 'trigger',
            type: 'choice',
            title: 'Show more?',
            options: ['Yes', 'No'],
          },
          {
            type: 'section',
            title: 'Extra Questions',
            showIf: { field: 'trigger', equals: 'Yes' },
            questions: [{ id: 'extra', type: 'text', title: 'Extra info' }],
          },
        ],
      };

      const result = validateFormDefinition(form);

      expect(result.success).toBe(true);
    });

    it('should validate webhook with retry config', () => {
      const form = {
        title: 'Webhook Form',
        questions: [{ id: 'q1', type: 'text', title: 'Q1' }],
        integrations: [
          {
            type: 'webhook',
            url: 'https://api.example.com/hook',
            method: 'POST',
            headers: { 'X-API-Key': 'secret' },
            retry: { maxAttempts: 3, backoffMs: 1000 },
          },
        ],
      };

      const result = validateFormDefinition(form);

      expect(result.success).toBe(true);
    });

    it('should reject invalid URL in webhook', () => {
      const form = {
        title: 'Test',
        questions: [{ id: 'q1', type: 'text', title: 'Q1' }],
        integrations: [{ type: 'webhook', url: 'not-a-url' }],
      };

      const result = validateFormDefinition(form);

      expect(result.success).toBe(false);
    });

    it('should enforce title max length of 200 characters', () => {
      const form = {
        title: 'A'.repeat(201),
        questions: [{ id: 'q1', type: 'text', title: 'Q1' }],
      };

      const result = validateFormDefinition(form);

      expect(result.success).toBe(false);
    });
  });
});
