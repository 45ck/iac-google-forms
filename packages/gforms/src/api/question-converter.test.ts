/**
 * Tests for question-converter
 * Covers conversion of local form questions to Google Forms API format
 */

import { describe, it, expect } from 'vitest';
import { convertQuestionToApiFormat } from './question-converter.js';
import type { Question } from '../schema/index.js';

describe('convertQuestionToApiFormat', () => {
  describe('text questions', () => {
    it('should convert short text question', () => {
      const question: Question = {
        id: 'q1',
        type: 'text',
        title: 'Your Name',
        required: true,
        paragraph: false,
      };

      const result = convertQuestionToApiFormat(question);

      expect(result).toEqual({
        title: 'Your Name',
        questionItem: {
          question: {
            questionId: 'q1',
            required: true,
            textQuestion: { paragraph: false },
          },
        },
      });
    });

    it('should convert paragraph text question', () => {
      const question: Question = {
        id: 'q2',
        type: 'text',
        title: 'Comments',
        required: false,
        paragraph: true,
      };

      const result = convertQuestionToApiFormat(question);

      expect(result.questionItem.question.textQuestion).toEqual({
        paragraph: true,
      });
    });

    it('should include description when present', () => {
      const question: Question = {
        id: 'q1',
        type: 'text',
        title: 'Name',
        description: 'Enter your full name',
        required: false,
        paragraph: false,
      };

      const result = convertQuestionToApiFormat(question);

      expect(result.description).toBe('Enter your full name');
    });

    it('should omit description when not present', () => {
      const question: Question = {
        id: 'q1',
        type: 'text',
        title: 'Name',
        required: false,
        paragraph: false,
      };

      const result = convertQuestionToApiFormat(question);

      expect(result.description).toBeUndefined();
    });
  });

  describe('email questions', () => {
    it('should convert email question as non-paragraph text', () => {
      const question: Question = {
        id: 'email1',
        type: 'email',
        title: 'Email Address',
        required: true,
      };

      const result = convertQuestionToApiFormat(question);

      expect(result.questionItem.question.textQuestion).toEqual({
        paragraph: false,
      });
      expect(result.title).toBe('Email Address');
      expect(result.questionItem.question.required).toBe(true);
    });

    it('should handle email question with description', () => {
      const question: Question = {
        id: 'email1',
        type: 'email',
        title: 'Email',
        description: 'Your work email',
        required: false,
      };

      const result = convertQuestionToApiFormat(question);

      expect(result.description).toBe('Your work email');
      expect(result.questionItem.question.textQuestion).toEqual({
        paragraph: false,
      });
    });
  });

  describe('choice questions', () => {
    it('should convert single-select choice as RADIO', () => {
      const question: Question = {
        id: 'q1',
        type: 'choice',
        title: 'Favorite Color',
        required: false,
        options: ['Red', 'Blue', 'Green'],
        allowOther: false,
        multiple: false,
      };

      const result = convertQuestionToApiFormat(question);

      expect(result.questionItem.question.choiceQuestion).toEqual({
        type: 'RADIO',
        options: [{ value: 'Red' }, { value: 'Blue' }, { value: 'Green' }],
      });
    });

    it('should convert multi-select choice as CHECKBOX', () => {
      const question: Question = {
        id: 'q1',
        type: 'choice',
        title: 'Select All',
        required: true,
        options: ['A', 'B', 'C'],
        allowOther: false,
        multiple: true,
      };

      const result = convertQuestionToApiFormat(question);

      expect(result.questionItem.question.choiceQuestion).toEqual({
        type: 'CHECKBOX',
        options: [{ value: 'A' }, { value: 'B' }, { value: 'C' }],
      });
    });
  });

  describe('dropdown questions', () => {
    it('should convert dropdown as DROP_DOWN choice', () => {
      const question: Question = {
        id: 'dd1',
        type: 'dropdown',
        title: 'Country',
        required: true,
        options: ['US', 'UK', 'CA'],
      };

      const result = convertQuestionToApiFormat(question);

      expect(result.questionItem.question.choiceQuestion).toEqual({
        type: 'DROP_DOWN',
        options: [{ value: 'US' }, { value: 'UK' }, { value: 'CA' }],
      });
    });

    it('should handle dropdown with description', () => {
      const question: Question = {
        id: 'dd1',
        type: 'dropdown',
        title: 'Region',
        description: 'Select your region',
        required: false,
        options: ['North', 'South'],
      };

      const result = convertQuestionToApiFormat(question);

      expect(result.description).toBe('Select your region');
      expect(result.questionItem.question.choiceQuestion?.type).toBe('DROP_DOWN');
    });
  });

  describe('scale questions', () => {
    it('should convert scale with labels', () => {
      const question: Question = {
        id: 'rating1',
        type: 'scale',
        title: 'Satisfaction',
        required: true,
        min: 1,
        max: 5,
        minLabel: 'Poor',
        maxLabel: 'Excellent',
      };

      const result = convertQuestionToApiFormat(question);

      expect(result.questionItem.question.scaleQuestion).toEqual({
        low: 1,
        high: 5,
        lowLabel: 'Poor',
        highLabel: 'Excellent',
      });
    });

    it('should omit labels when not provided', () => {
      const question: Question = {
        id: 'rating1',
        type: 'scale',
        title: 'Rating',
        required: false,
        min: 0,
        max: 10,
      };

      const result = convertQuestionToApiFormat(question);

      expect(result.questionItem.question.scaleQuestion).toEqual({
        low: 0,
        high: 10,
      });
      expect(result.questionItem.question.scaleQuestion?.lowLabel).toBeUndefined();
      expect(result.questionItem.question.scaleQuestion?.highLabel).toBeUndefined();
    });

    it('should include only minLabel when maxLabel is absent', () => {
      const question: Question = {
        id: 'rating1',
        type: 'scale',
        title: 'Rating',
        required: false,
        min: 1,
        max: 5,
        minLabel: 'Low',
      };

      const result = convertQuestionToApiFormat(question);

      expect(result.questionItem.question.scaleQuestion).toEqual({
        low: 1,
        high: 5,
        lowLabel: 'Low',
      });
    });
  });

  describe('base question properties', () => {
    it('should default required to false when not set', () => {
      const question = {
        id: 'q1',
        type: 'text' as const,
        title: 'Name',
        paragraph: false,
      } as Question;

      const result = convertQuestionToApiFormat(question);

      expect(result.questionItem.question.required).toBe(false);
    });

    it('should handle unknown question type by returning base', () => {
      const question = {
        id: 'q1',
        type: 'unknown' as 'text',
        title: 'Something',
        required: false,
      } as Question;

      const result = convertQuestionToApiFormat(question);

      // Unknown type returns base question without type-specific data
      expect(result.title).toBe('Something');
      expect(result.questionItem.question.questionId).toBe('q1');
      expect(result.questionItem.question.textQuestion).toBeUndefined();
      expect(result.questionItem.question.choiceQuestion).toBeUndefined();
      expect(result.questionItem.question.scaleQuestion).toBeUndefined();
    });
  });
});
