/**
 * Zod schemas for form definition validation
 * Implements validation per TC-VAL-001 through TC-VAL-008 from test plan
 */

import { z } from 'zod';
import { checkDuplicateIds, validateScaleBounds } from './validators.js';

// =============================================================================
// Utility Schemas
// =============================================================================

/**
 * Text validation rules (pattern matching)
 */
export const TextValidationSchema = z.object({
  pattern: z.string().optional(),
  patternError: z.string().optional(),
});

/**
 * Conditional logic for showing/hiding sections
 */
export const ConditionalLogicSchema = z
  .object({
    field: z.string(),
    equals: z.string().optional(),
    in: z.array(z.string()).optional(),
    notEquals: z.string().optional(),
  })
  .refine(
    (data) => data.equals !== undefined || data.in !== undefined || data.notEquals !== undefined,
    { message: 'ConditionalLogic must have equals, in, or notEquals' }
  );

/**
 * Retry configuration for webhooks
 */
export const RetryConfigSchema = z.object({
  maxAttempts: z.number().int().min(1).max(5).default(3),
  backoffMs: z.number().int().min(100).max(60000).default(1000),
});

/**
 * Quiz settings
 */
export const QuizSettingsSchema = z.object({
  isQuiz: z.boolean().default(false),
  showScore: z.boolean().default(true),
  showCorrectAnswers: z.boolean().default(true),
});

// =============================================================================
// Question ID Pattern
// =============================================================================

/**
 * Question ID must start with a letter and contain only letters, numbers, underscores, and hyphens
 * TC-VAL-004: Invalid question ID format
 */
const questionIdPattern = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

const QuestionIdSchema = z
  .string()
  .regex(
    questionIdPattern,
    'id must start with a letter and contain only letters, numbers, underscores, and hyphens'
  );

// =============================================================================
// Base Question Schema
// =============================================================================

const BaseQuestionSchema = z.object({
  id: QuestionIdSchema,
  title: z.string().min(1, 'title is required'),
  description: z.string().optional(),
  required: z.boolean().default(false),
});

// =============================================================================
// Question Type Schemas
// =============================================================================

/**
 * Text question - short or paragraph text
 */
export const TextQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('text'),
  paragraph: z.boolean().default(false),
  maxLength: z.number().int().min(1).optional(),
  validation: TextValidationSchema.optional(),
});

/**
 * Email question - auto-validates email format
 */
export const EmailQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('email'),
});

/**
 * Choice question - radio buttons or checkboxes
 */
export const ChoiceQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('choice'),
  options: z.array(z.string()).min(1, 'options must have at least 1 item'),
  allowOther: z.boolean().default(false),
  multiple: z.boolean().default(false),
});

/**
 * Dropdown question - single selection dropdown
 */
export const DropdownQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('dropdown'),
  options: z.array(z.string()).min(1, 'options must have at least 1 item'),
});

/**
 * Scale question - numeric scale (e.g., 1-5 stars)
 * TC-VAL-007: Scale question bounds - use superRefine to avoid ZodEffects issues
 */
export const ScaleQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal('scale'),
  min: z.number().int().min(0).max(1),
  max: z.number().int().min(2).max(10),
  minLabel: z.string().optional(),
  maxLabel: z.string().optional(),
});

/**
 * Section - groups questions with optional conditional display
 * Note: For simplicity, we use a non-recursive definition here
 * Real forms shouldn't have deeply nested sections
 */
export const SectionSchema = z.object({
  type: z.literal('section'),
  title: z.string().min(1, 'title is required'),
  description: z.string().optional(),
  // Questions within section - using a simpler inline definition to avoid recursion issues
  questions: z
    .array(
      z.discriminatedUnion('type', [
        TextQuestionSchema,
        EmailQuestionSchema,
        ChoiceQuestionSchema,
        DropdownQuestionSchema,
        ScaleQuestionSchema,
      ])
    )
    .min(1, 'questions must have at least 1 item'),
  showIf: ConditionalLogicSchema.optional(),
});

/**
 * Union of all question types (without Section for top-level)
 */
const SimpleQuestionSchema = z.discriminatedUnion('type', [
  TextQuestionSchema,
  EmailQuestionSchema,
  ChoiceQuestionSchema,
  DropdownQuestionSchema,
  ScaleQuestionSchema,
]);

/**
 * Union of all question types including sections
 * TC-VAL-006: All question types valid
 */
export const QuestionSchema = z.union([SimpleQuestionSchema, SectionSchema]);

// =============================================================================
// Integration Schemas
// =============================================================================

/**
 * Google Sheets integration
 */
export const SheetsIntegrationSchema = z.object({
  type: z.literal('sheets'),
  spreadsheetName: z.string().optional(),
  spreadsheetId: z.string().optional(),
  createIfMissing: z.boolean().default(true),
  folderId: z.string().optional(),
});

/**
 * Email notification integration
 * TC-VAL-008: Invalid email in integration
 */
export const EmailIntegrationSchema = z.object({
  type: z.literal('email'),
  to: z.array(z.string().email('invalid email format')).min(1),
  subject: z.string().optional(),
  condition: ConditionalLogicSchema.optional(),
});

/**
 * Webhook integration
 */
export const WebhookIntegrationSchema = z.object({
  type: z.literal('webhook'),
  url: z.string().url('invalid URL format'),
  method: z.enum(['POST', 'PUT']).default('POST'),
  headers: z.record(z.string(), z.string()).optional(),
  secret: z.string().optional(),
  retry: RetryConfigSchema.optional(),
});

/**
 * Union of all integration types
 */
export const IntegrationSchema = z.discriminatedUnion('type', [
  SheetsIntegrationSchema,
  EmailIntegrationSchema,
  WebhookIntegrationSchema,
]);

// =============================================================================
// Form Settings Schema
// =============================================================================

export const FormSettingsSchema = z.object({
  collectEmail: z.boolean().default(false),
  limitOneResponse: z.boolean().default(false),
  editAfterSubmit: z.boolean().default(false),
  confirmationMessage: z.string().optional(),
  quiz: QuizSettingsSchema.optional(),
});

// =============================================================================
// Form Definition Schema
// =============================================================================

/**
 * Main form definition schema
 * TC-VAL-001: Valid minimal form
 * TC-VAL-002: Missing title
 * TC-VAL-003: Empty questions array
 * TC-VAL-005: Duplicate question IDs
 * TC-VAL-007: Scale question bounds
 */
export const FormDefinitionSchema = z
  .object({
    title: z.string().min(1, 'title is required').max(200),
    description: z.string().max(2000).optional(),
    questions: z.array(QuestionSchema).min(1, 'questions must have at least 1 item'),
    integrations: z.array(IntegrationSchema).optional(),
    settings: FormSettingsSchema.optional(),
  })
  .superRefine((data, ctx) => {
    checkDuplicateIds(data.questions, ctx);
    validateScaleBounds(data.questions, ctx);
  });

// =============================================================================
// Type Exports
// =============================================================================

export type FormDefinition = z.infer<typeof FormDefinitionSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type Integration = z.infer<typeof IntegrationSchema>;
export type TextQuestion = z.infer<typeof TextQuestionSchema>;
export type EmailQuestion = z.infer<typeof EmailQuestionSchema>;
export type ChoiceQuestion = z.infer<typeof ChoiceQuestionSchema>;
export type DropdownQuestion = z.infer<typeof DropdownQuestionSchema>;
export type ScaleQuestion = z.infer<typeof ScaleQuestionSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type SheetsIntegration = z.infer<typeof SheetsIntegrationSchema>;
export type EmailIntegration = z.infer<typeof EmailIntegrationSchema>;
export type WebhookIntegration = z.infer<typeof WebhookIntegrationSchema>;
export type FormSettings = z.infer<typeof FormSettingsSchema>;
export type ConditionalLogic = z.infer<typeof ConditionalLogicSchema>;
export type TextValidation = z.infer<typeof TextValidationSchema>;
export type RetryConfig = z.infer<typeof RetryConfigSchema>;
export type QuizSettings = z.infer<typeof QuizSettingsSchema>;

// =============================================================================
// Validation Function
// =============================================================================

export interface ValidationResult {
  success: boolean;
  data?: FormDefinition;
  errors?: {
    path: (string | number)[];
    message: string;
  }[];
}

/**
 * Validate a form definition
 * Returns a result object with either the validated data or an array of errors
 */
export function validateFormDefinition(input: unknown): ValidationResult {
  const result = FormDefinitionSchema.safeParse(input);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: result.error.issues.map((issue) => ({
      path: issue.path,
      message: issue.message,
    })),
  };
}
