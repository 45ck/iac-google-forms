/**
 * Google Forms API Client
 * Handles communication with Google Forms and Drive APIs
 */

import type { FormDefinition } from '../schema/index.js';
import { isRetryableStatusCode, withRetry } from '../utils/retry.js';
import { convertQuestionToApiFormat, type ApiQuestion } from './question-converter.js';

const FORMS_API_BASE = 'https://forms.googleapis.com/v1';
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

const DEFAULT_RETRY_OPTIONS = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableErrors: (error: unknown): boolean => {
    if (error instanceof FormsApiError) {
      return isRetryableStatusCode(error.statusCode);
    }
    return false;
  },
};

export class FormsApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'FormsApiError';
  }
}

export interface CreateFormResult {
  formId: string;
  formUrl: string;
  responseUrl: string;
}

export interface FormListItem {
  id: string;
  name: string;
}

export interface GoogleFormItem {
  itemId: string;
  title: string;
  description?: string | undefined;
  questionItem?:
    | {
        question: {
          questionId: string;
          required?: boolean | undefined;
          textQuestion?: { paragraph: boolean } | undefined;
          choiceQuestion?:
            | {
                type: 'RADIO' | 'CHECKBOX' | 'DROP_DOWN';
                options: { value: string }[];
                shuffle?: boolean | undefined;
              }
            | undefined;
          scaleQuestion?:
            | {
                low: number;
                high: number;
                lowLabel?: string | undefined;
                highLabel?: string | undefined;
              }
            | undefined;
        };
      }
    | undefined;
}

export interface GoogleFormResponse {
  formId: string;
  info: {
    title: string;
    description?: string | undefined;
  };
  responderUri: string;
  items?: GoogleFormItem[] | undefined;
  revisionId?: string | undefined;
}

interface UpdateFormInfoRequest {
  updateFormInfo: {
    info: { description: string };
    updateMask: string;
  };
}

interface CreateItemRequest {
  createItem: {
    item: ApiQuestion;
    location: { index: number };
  };
}

type BatchRequest = UpdateFormInfoRequest | CreateItemRequest;

interface DriveListResponse {
  files?: { id: string; name: string }[] | undefined;
  nextPageToken?: string | undefined;
}

type AccessTokenGetter = () => Promise<string>;

export interface FormsClientOptions {
  /** Disable retry logic (useful for tests) */
  disableRetry?: boolean;
}

function assertValidFormResponse(data: GoogleFormResponse): void {
  if (!data.formId) {
    throw new FormsApiError('API returned response without formId', 0);
  }
}

function buildListFormsUrl(pageToken?: string): string {
  const base = `${DRIVE_API_BASE}/files?q=mimeType='application/vnd.google-apps.form'&fields=files(id,name),nextPageToken`;
  return pageToken ? `${base}&pageToken=${pageToken}` : base;
}

/**
 * Client for Google Forms API operations
 */
export class FormsClient {
  private readonly disableRetry: boolean;

  constructor(
    private readonly getAccessToken: AccessTokenGetter,
    options: FormsClientOptions = {}
  ) {
    this.disableRetry = options.disableRetry ?? false;
  }

  /**
   * Create a new Google Form from a definition
   */
  async createForm(definition: FormDefinition): Promise<CreateFormResult> {
    const token = await this.getAccessToken();

    const createResponse = await this.request<GoogleFormResponse>(`${FORMS_API_BASE}/forms`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        info: {
          title: definition.title,
          documentTitle: definition.title,
        },
      }),
    });

    assertValidFormResponse(createResponse);
    const formId = createResponse.formId;

    if (definition.description || definition.questions.length > 0) {
      await this.batchUpdateForm(formId, definition, token);
    }

    return {
      formId,
      formUrl: `https://docs.google.com/forms/d/${formId}/edit`,
      responseUrl: createResponse.responderUri,
    };
  }

  /**
   * Get a form by ID
   */
  async getForm(formId: string): Promise<GoogleFormResponse> {
    const token = await this.getAccessToken();

    const result = await this.request<GoogleFormResponse>(`${FORMS_API_BASE}/forms/${formId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    assertValidFormResponse(result);
    return result;
  }

  /**
   * Update an existing form.
   * Removes all existing items first, then re-creates from the definition
   * to ensure idempotent deploys.
   */
  async updateForm(formId: string, definition: FormDefinition): Promise<void> {
    const token = await this.getAccessToken();

    // Fetch current form to get existing item IDs
    const current = await this.request<GoogleFormResponse>(`${FORMS_API_BASE}/forms/${formId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    // Delete existing items in reverse order to maintain valid indices
    if (current.items && current.items.length > 0) {
      const deleteRequests = current.items
        .map((_item, index) => ({ deleteItem: { location: { index } } }))
        .reverse();

      await this.request<{ replies: unknown[] }>(`${FORMS_API_BASE}/forms/${formId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests: deleteRequests }),
      });
    }

    // Re-create from definition
    await this.batchUpdateForm(formId, definition, token);
  }

  /**
   * Delete a form (moves to trash in Drive)
   */
  async deleteForm(formId: string): Promise<void> {
    const token = await this.getAccessToken();

    await this.request<unknown>(`${DRIVE_API_BASE}/files/${formId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  /**
   * List all forms in the user's Drive
   */
  async listForms(): Promise<FormListItem[]> {
    const token = await this.getAccessToken();
    const allFiles: FormListItem[] = [];
    let pageToken: string | undefined;

    do {
      const url = buildListFormsUrl(pageToken);
      const response = await this.request<DriveListResponse>(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.files) {
        for (const f of response.files) {
          allFiles.push({ id: f.id, name: f.name });
        }
      }
      pageToken = response.nextPageToken;
    } while (pageToken);

    return allFiles;
  }

  private async batchUpdateForm(
    formId: string,
    definition: FormDefinition,
    token: string
  ): Promise<void> {
    const requests: BatchRequest[] = [];

    if (definition.description) {
      requests.push({
        updateFormInfo: {
          info: { description: definition.description },
          updateMask: 'description',
        },
      });
    }

    let itemIndex = 0;
    for (const q of definition.questions) {
      if (q.type === 'section') {
        // Recurse into section children
        for (const child of q.questions) {
          requests.push({
            createItem: {
              item: convertQuestionToApiFormat(child),
              location: { index: itemIndex },
            },
          });
          itemIndex++;
        }
      } else {
        requests.push({
          createItem: {
            item: convertQuestionToApiFormat(q),
            location: { index: itemIndex },
          },
        });
        itemIndex++;
      }
    }

    if (requests.length > 0) {
      await this.request<{ replies: unknown[] }>(`${FORMS_API_BASE}/forms/${formId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests }),
      });
    }
  }

  private async request<T>(url: string, options: RequestInit): Promise<T> {
    if (this.disableRetry) {
      return this.executeRequest<T>(url, options);
    }
    return withRetry(() => this.executeRequest<T>(url, options), DEFAULT_RETRY_OPTIONS);
  }

  private async executeRequest<T>(url: string, options: RequestInit): Promise<T> {
    const response = await fetch(url, options);

    if (!response.ok) {
      let errorMessage = response.statusText;
      let details: unknown;

      try {
        const errorBody = (await response.json()) as { error?: { message?: string } };
        if (errorBody.error?.message) {
          errorMessage = errorBody.error.message;
        }
        details = errorBody;
      } catch {
        // Ignore JSON parse errors
      }

      throw new FormsApiError(errorMessage, response.status, details);
    }

    return (await response.json()) as T;
  }
}
