/**
 * Zod schemas for form definition validation
 */

export {
  // Main schemas
  FormDefinitionSchema,
  QuestionSchema,
  IntegrationSchema,
  FormSettingsSchema,
  // Question type schemas
  TextQuestionSchema,
  EmailQuestionSchema,
  ChoiceQuestionSchema,
  DropdownQuestionSchema,
  ScaleQuestionSchema,
  SectionSchema,
  // Integration schemas
  SheetsIntegrationSchema,
  EmailIntegrationSchema,
  WebhookIntegrationSchema,
  // Utility schemas
  ConditionalLogicSchema,
  TextValidationSchema,
  RetryConfigSchema,
  QuizSettingsSchema,
  // Validation function
  validateFormDefinition,
  // Types inferred from schemas
  type FormDefinition,
  type Question,
  type Integration,
  type TextQuestion,
  type ChoiceQuestion,
  type DropdownQuestion,
  type ScaleQuestion,
  type EmailQuestion,
  type Section,
  type FormSettings,
} from './form-definition.js';

export {
  // State schemas
  StateFileSchema,
  FormStateSchema,
  // Validation function
  validateStateFile,
  // Types
  type StateFile,
  type FormState,
} from './state-file.js';
