/**
 * Tests for Google Forms API Client
 * Implements TC-API-001 through TC-API-006 from test plan
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FormsClient, FormsApiError } from './forms-client.js';
import { convertQuestionToApiFormat } from './question-converter.js';
import type { FormDefinition } from '../schema/index.js';

// Mock form data
const mockFormDefinition: FormDefinition = {
  title: 'Test Form',
  description: 'Test Description',
  questions: [
    { id: 'q1', type: 'text', title: 'Name', required: true, paragraph: false },
    {
      id: 'q2',
      type: 'choice',
      title: 'Color',
      required: false,
      options: ['Red', 'Blue', 'Green'],
      allowOther: false,
      multiple: false,
    },
  ],
};

// Mock Google API responses
const mockFormResponse = {
  formId: 'test-form-id-123',
  info: {
    title: 'Test Form',
    description: 'Test Description',
  },
  responderUri: 'https://docs.google.com/forms/d/e/test/viewform',
  items: [],
};

const mockListResponse = {
  files: [
    { id: 'form-1', name: 'Form 1', mimeType: 'application/vnd.google-apps.form' },
    { id: 'form-2', name: 'Form 2', mimeType: 'application/vnd.google-apps.form' },
  ],
};

describe('FormsClient', () => {
  let client: FormsClient;
  let mockGetAccessToken: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockGetAccessToken = vi.fn().mockResolvedValue('mock-access-token');
    client = new FormsClient(mockGetAccessToken, { disableRetry: true });
  });

  describe('TC-API-001: Create form', () => {
    it('should create a new form from definition', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFormResponse),
      });
      global.fetch = mockFetch;

      const result = await client.createForm(mockFormDefinition);

      expect(result).toEqual({
        formId: 'test-form-id-123',
        formUrl: expect.stringContaining('test-form-id-123'),
        responseUrl: 'https://docs.google.com/forms/d/e/test/viewform',
      });
      expect(mockGetAccessToken).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('forms.googleapis.com'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-access-token',
          }),
        })
      );
    });

    it('should throw FormsApiError on API failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: () => Promise.resolve({ error: { message: 'Insufficient permissions' } }),
      });

      await expect(client.createForm(mockFormDefinition)).rejects.toThrow(FormsApiError);
    });
  });

  describe('TC-API-002: Get form', () => {
    it('should retrieve a form by ID', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFormResponse),
      });

      const result = await client.getForm('test-form-id-123');

      expect(result).toBeDefined();
      expect(result.formId).toBe('test-form-id-123');
    });

    it('should throw FormsApiError when form not found', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ error: { message: 'Form not found' } }),
      });

      await expect(client.getForm('nonexistent')).rejects.toThrow(FormsApiError);
    });
  });

  describe('TC-API-003: Update form', () => {
    it('should update an existing form', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ replies: [{}] }),
      });

      const updatedDefinition = {
        ...mockFormDefinition,
        title: 'Updated Title',
      };

      await expect(
        client.updateForm('test-form-id-123', updatedDefinition)
      ).resolves.not.toThrow();
    });
  });

  describe('TC-API-004: Delete form', () => {
    it('should delete a form', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await expect(client.deleteForm('test-form-id-123')).resolves.not.toThrow();
    });
  });

  describe('TC-API-005: List forms', () => {
    it('should list all forms in Drive', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockListResponse),
      });

      const result = await client.listForms();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 'form-1', name: 'Form 1' });
    });
  });

  describe('TC-API-006: Convert definition to API format', () => {
    it('should convert text questions correctly', () => {
      const question = { id: 'q1', type: 'text' as const, title: 'Name', required: true, paragraph: false };
      const result = convertQuestionToApiFormat(question);

      expect(result).toEqual({
        questionItem: {
          question: {
            questionId: 'q1',
            required: true,
            textQuestion: {
              paragraph: false,
            },
          },
        },
        title: 'Name',
      });
    });

    it('should convert choice questions correctly', () => {
      const question = {
        id: 'q2',
        type: 'choice' as const,
        title: 'Favorite Color',
        required: false,
        options: ['Red', 'Blue', 'Green'],
        allowOther: true,
        multiple: false,
      };
      const result = convertQuestionToApiFormat(question);

      expect(result.questionItem.question.choiceQuestion).toBeDefined();
      expect(result.questionItem.question.choiceQuestion.options).toHaveLength(3);
      expect(result.questionItem.question.choiceQuestion.type).toBe('RADIO');
    });

    it('should convert scale questions correctly', () => {
      const question = {
        id: 'q3',
        type: 'scale' as const,
        title: 'Rating',
        required: true,
        min: 1,
        max: 5,
        minLabel: 'Poor',
        maxLabel: 'Excellent',
      };
      const result = convertQuestionToApiFormat(question);

      expect(result.questionItem.question.scaleQuestion).toBeDefined();
      expect(result.questionItem.question.scaleQuestion.low).toBe(1);
      expect(result.questionItem.question.scaleQuestion.high).toBe(5);
    });
  });

  describe('TC-API-003b: Update form with existing items', () => {
    it('should delete existing items before re-creating', async () => {
      const calls: string[] = [];
      const mockFetch = vi.fn().mockImplementation((url: string, opts: RequestInit) => {
        calls.push(`${opts.method ?? 'GET'} ${url}`);
        // GET to fetch current form
        if (opts.method === 'GET') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              ...mockFormResponse,
              items: [
                { itemId: 'existing-1', title: 'Old Q1' },
                { itemId: 'existing-2', title: 'Old Q2' },
              ],
            }),
          });
        }
        // POST for batchUpdate
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ replies: [{}] }),
        });
      });
      global.fetch = mockFetch;

      await client.updateForm('test-form-id-123', mockFormDefinition);

      // Should have: 1 GET (fetch current), 1 POST (delete items), 1 POST (add items)
      expect(mockFetch).toHaveBeenCalledTimes(3);
      const postCalls = calls.filter((c) => c.startsWith('POST'));
      expect(postCalls).toHaveLength(2);
    });

    it('should skip delete when form has no existing items', async () => {
      const mockFetch = vi.fn().mockImplementation((_url: string, opts: RequestInit) => {
        if (opts.method === 'GET') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ ...mockFormResponse, items: [] }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ replies: [{}] }),
        });
      });
      global.fetch = mockFetch;

      await client.updateForm('test-form-id-123', mockFormDefinition);

      // Should have: 1 GET (fetch current), 1 POST (add items only)
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('TC-API-005b: Paginated list', () => {
    it('should follow pagination tokens', async () => {
      let callCount = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              files: [{ id: 'form-1', name: 'Form 1' }],
              nextPageToken: 'page2',
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            files: [{ id: 'form-2', name: 'Form 2' }],
          }),
        });
      });

      const result = await client.listForms();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 'form-1', name: 'Form 1' });
      expect(result[1]).toEqual({ id: 'form-2', name: 'Form 2' });
    });

    it('should return empty array when no files', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const result = await client.listForms();
      expect(result).toHaveLength(0);
    });
  });

  describe('batch update with sections', () => {
    it('should flatten section children into individual items', async () => {
      const defWithSection: FormDefinition = {
        title: 'Section Form',
        questions: [
          {
            id: 's1',
            type: 'section',
            title: 'Personal Info',
            questions: [
              { id: 'q1', type: 'text', title: 'Name', required: true, paragraph: false },
              { id: 'q2', type: 'text', title: 'Email', required: false, paragraph: false },
            ],
          },
        ],
      };

      let batchBody: unknown;
      const mockFetch = vi.fn().mockImplementation((_url: string, opts: RequestInit) => {
        if (opts.method === 'POST' && opts.body) {
          batchBody = JSON.parse(opts.body as string);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ formId: 'new-id', info: { title: 'Section Form' }, responderUri: 'https://test' }),
        });
      });
      global.fetch = mockFetch;

      await client.createForm(defWithSection);

      // The batch update should contain createItem requests for both children
      expect(batchBody).toBeDefined();
      const requests = (batchBody as { requests: unknown[] }).requests;
      const createItems = requests.filter((r: any) => 'createItem' in r);
      expect(createItems).toHaveLength(2);
    });
  });

  describe('create form without questions', () => {
    it('should skip batch update when no questions or description', async () => {
      const minimalDef: FormDefinition = {
        title: 'Empty Form',
        questions: [],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          formId: 'empty-id',
          info: { title: 'Empty Form' },
          responderUri: 'https://test',
        }),
      });

      const result = await client.createForm(minimalDef);
      expect(result.formId).toBe('empty-id');
      // Only 1 call (create form), no batch update
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error handling', () => {
    it('should include status code in FormsApiError', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: () => Promise.resolve({ error: { message: 'Rate limit exceeded' } }),
      });

      try {
        await client.getForm('test');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(FormsApiError);
        expect((error as FormsApiError).statusCode).toBe(429);
      }
    });

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(client.getForm('test')).rejects.toThrow('Network error');
    });

    it('should handle error response without JSON body', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        json: () => Promise.reject(new Error('Not JSON')),
      });

      try {
        await client.getForm('test');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(FormsApiError);
        expect((error as FormsApiError).statusCode).toBe(502);
        expect((error as FormsApiError).message).toBe('Bad Gateway');
      }
    });

    it('should throw when API returns response without formId', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          info: { title: 'No ID' },
          responderUri: 'https://test',
        }),
      });

      await expect(client.getForm('test')).rejects.toThrow(FormsApiError);
    });

    it('should include details from error body', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({
          error: {
            message: 'Invalid request',
            code: 400,
            errors: [{ domain: 'global', reason: 'invalid' }],
          },
        }),
      });

      try {
        await client.getForm('test');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(FormsApiError);
        expect((error as FormsApiError).details).toBeDefined();
      }
    });
  });
});
