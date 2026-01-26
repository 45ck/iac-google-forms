/**
 * Tests for response-converter
 * Covers conversion of Google Forms API responses to local FormDefinition format
 */

import { describe, it, expect } from 'vitest';
import { convertResponseToFormDefinition } from './response-converter.js';
import type { GoogleFormResponse } from './forms-client.js';

function makeResponse(
  overrides: Partial<GoogleFormResponse> = {}
): GoogleFormResponse {
  return {
    formId: 'test-id',
    info: { title: 'Test Form' },
    responderUri: 'https://docs.google.com/forms/d/test-id/viewform',
    ...overrides,
  };
}

describe('convertResponseToFormDefinition', () => {
  describe('form metadata', () => {
    it('should convert title', () => {
      const response = makeResponse({ info: { title: 'My Form' } });
      const result = convertResponseToFormDefinition(response);
      expect(result.title).toBe('My Form');
    });

    it('should convert description when present', () => {
      const response = makeResponse({
        info: { title: 'Form', description: 'A description' },
      });
      const result = convertResponseToFormDefinition(response);
      expect(result.description).toBe('A description');
    });

    it('should omit description when not present', () => {
      const response = makeResponse({ info: { title: 'Form' } });
      const result = convertResponseToFormDefinition(response);
      expect(result.description).toBeUndefined();
    });
  });

  describe('text questions', () => {
    it('should convert short text questions', () => {
      const response = makeResponse({
        items: [{
          itemId: 'item1',
          title: 'Your Name',
          questionItem: {
            question: {
              questionId: 'q1',
              required: true,
              textQuestion: { paragraph: false },
            },
          },
        }],
      });

      const result = convertResponseToFormDefinition(response);
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0]).toMatchObject({
        id: 'q1',
        type: 'text',
        title: 'Your Name',
        required: true,
        paragraph: false,
      });
    });

    it('should convert paragraph text questions', () => {
      const response = makeResponse({
        items: [{
          itemId: 'item1',
          title: 'Comments',
          questionItem: {
            question: {
              questionId: 'q1',
              textQuestion: { paragraph: true },
            },
          },
        }],
      });

      const result = convertResponseToFormDefinition(response);
      expect(result.questions[0]).toMatchObject({
        type: 'text',
        paragraph: true,
      });
    });

    it('should default required to false', () => {
      const response = makeResponse({
        items: [{
          itemId: 'item1',
          title: 'Optional',
          questionItem: {
            question: {
              questionId: 'q1',
              textQuestion: { paragraph: false },
            },
          },
        }],
      });

      const result = convertResponseToFormDefinition(response);
      expect(result.questions[0]).toMatchObject({ required: false });
    });
  });

  describe('choice questions', () => {
    it('should convert radio button questions', () => {
      const response = makeResponse({
        items: [{
          itemId: 'item1',
          title: 'Favorite Color',
          questionItem: {
            question: {
              questionId: 'q1',
              required: false,
              choiceQuestion: {
                type: 'RADIO',
                options: [{ value: 'Red' }, { value: 'Blue' }, { value: 'Green' }],
              },
            },
          },
        }],
      });

      const result = convertResponseToFormDefinition(response);
      expect(result.questions[0]).toMatchObject({
        id: 'q1',
        type: 'choice',
        title: 'Favorite Color',
        options: ['Red', 'Blue', 'Green'],
        multiple: false,
        allowOther: false,
      });
    });

    it('should convert checkbox questions as multiple choice', () => {
      const response = makeResponse({
        items: [{
          itemId: 'item1',
          title: 'Select All',
          questionItem: {
            question: {
              questionId: 'q1',
              choiceQuestion: {
                type: 'CHECKBOX',
                options: [{ value: 'A' }, { value: 'B' }],
              },
            },
          },
        }],
      });

      const result = convertResponseToFormDefinition(response);
      expect(result.questions[0]).toMatchObject({
        type: 'choice',
        multiple: true,
      });
    });
  });

  describe('dropdown questions', () => {
    it('should convert dropdown questions', () => {
      const response = makeResponse({
        items: [{
          itemId: 'item1',
          title: 'Country',
          questionItem: {
            question: {
              questionId: 'q1',
              choiceQuestion: {
                type: 'DROP_DOWN',
                options: [{ value: 'US' }, { value: 'UK' }, { value: 'CA' }],
              },
            },
          },
        }],
      });

      const result = convertResponseToFormDefinition(response);
      expect(result.questions[0]).toMatchObject({
        id: 'q1',
        type: 'dropdown',
        title: 'Country',
        options: ['US', 'UK', 'CA'],
      });
    });
  });

  describe('scale questions', () => {
    it('should convert scale questions', () => {
      const response = makeResponse({
        items: [{
          itemId: 'item1',
          title: 'Rating',
          questionItem: {
            question: {
              questionId: 'q1',
              required: true,
              scaleQuestion: {
                low: 1,
                high: 5,
                lowLabel: 'Poor',
                highLabel: 'Excellent',
              },
            },
          },
        }],
      });

      const result = convertResponseToFormDefinition(response);
      expect(result.questions[0]).toMatchObject({
        id: 'q1',
        type: 'scale',
        title: 'Rating',
        required: true,
        min: 1,
        max: 5,
        minLabel: 'Poor',
        maxLabel: 'Excellent',
      });
    });

    it('should omit labels when not present', () => {
      const response = makeResponse({
        items: [{
          itemId: 'item1',
          title: 'Rating',
          questionItem: {
            question: {
              questionId: 'q1',
              scaleQuestion: { low: 0, high: 10 },
            },
          },
        }],
      });

      const result = convertResponseToFormDefinition(response);
      const q = result.questions[0];
      expect(q).toMatchObject({ type: 'scale', min: 0, max: 10 });
      expect('minLabel' in q).toBe(false);
      expect('maxLabel' in q).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should return empty questions when no items', () => {
      const response = makeResponse();
      const result = convertResponseToFormDefinition(response);
      expect(result.questions).toHaveLength(0);
    });

    it('should skip non-question items', () => {
      const response = makeResponse({
        items: [
          { itemId: 'section1', title: 'Section Header' },
          {
            itemId: 'item1',
            title: 'Name',
            questionItem: {
              question: {
                questionId: 'q1',
                textQuestion: { paragraph: false },
              },
            },
          },
        ],
      });

      const result = convertResponseToFormDefinition(response);
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0]).toMatchObject({ id: 'q1' });
    });

    it('should use itemId when questionId is missing', () => {
      const response = makeResponse({
        items: [{
          itemId: 'fallback-id',
          title: 'Question',
          questionItem: {
            question: {
              questionId: '',
              textQuestion: { paragraph: false },
            },
          },
        }],
      });

      const result = convertResponseToFormDefinition(response);
      expect(result.questions[0]).toMatchObject({ id: 'fallback-id' });
    });

    it('should include question description when present', () => {
      const response = makeResponse({
        items: [{
          itemId: 'item1',
          title: 'Name',
          description: 'Enter your full name',
          questionItem: {
            question: {
              questionId: 'q1',
              textQuestion: { paragraph: false },
            },
          },
        }],
      });

      const result = convertResponseToFormDefinition(response);
      expect(result.questions[0]).toMatchObject({
        description: 'Enter your full name',
      });
    });

    it('should handle unknown question types as text', () => {
      const response = makeResponse({
        items: [{
          itemId: 'item1',
          title: 'Unknown',
          questionItem: {
            question: {
              questionId: 'q1',
            },
          },
        }],
      });

      const result = convertResponseToFormDefinition(response);
      expect(result.questions[0]).toMatchObject({
        type: 'text',
        paragraph: false,
      });
    });

    it('should convert multiple questions', () => {
      const response = makeResponse({
        items: [
          {
            itemId: 'item1',
            title: 'Name',
            questionItem: {
              question: { questionId: 'q1', textQuestion: { paragraph: false } },
            },
          },
          {
            itemId: 'item2',
            title: 'Color',
            questionItem: {
              question: {
                questionId: 'q2',
                choiceQuestion: {
                  type: 'RADIO',
                  options: [{ value: 'Red' }],
                },
              },
            },
          },
          {
            itemId: 'item3',
            title: 'Rating',
            questionItem: {
              question: {
                questionId: 'q3',
                scaleQuestion: { low: 1, high: 5 },
              },
            },
          },
        ],
      });

      const result = convertResponseToFormDefinition(response);
      expect(result.questions).toHaveLength(3);
      expect(result.questions[0]).toMatchObject({ type: 'text' });
      expect(result.questions[1]).toMatchObject({ type: 'choice' });
      expect(result.questions[2]).toMatchObject({ type: 'scale' });
    });
  });
});
