/**
 * TypeScript type definitions for iac-google-forms
 * These types are derived from the JSON schemas and class diagram
 */

// =============================================================================
// Form Definition Types
// =============================================================================

export interface FormDefinition {
  /** Form title displayed to respondents */
  title: string;
  /** Optional form description */
  description?: string;
  /** List of questions in the form */
  questions: Question[];
  /** Optional integrations (Sheets, email, webhooks) */
  integrations?: Integration[];
  /** Form behavior settings */
  settings?: FormSettings;
}

// =============================================================================
// Question Types (Discriminated Union)
// =============================================================================

export type Question =
  | TextQuestion
  | EmailQuestion
  | ChoiceQuestion
  | DropdownQuestion
  | ScaleQuestion
  | Section;

export type QuestionType = Question['type'];

/** Common properties shared by all questions */
interface BaseQuestion {
  /** Unique identifier for the question */
  id: string;
  /** Question text displayed to respondents */
  title: string;
  /** Optional help text */
  description?: string;
  /** Whether the question must be answered */
  required?: boolean;
}

export interface TextQuestion extends BaseQuestion {
  type: 'text';
  /** If true, shows multi-line text area */
  paragraph?: boolean;
  /** Maximum character length */
  maxLength?: number;
  /** Custom validation rules */
  validation?: TextValidation;
}

export interface EmailQuestion extends BaseQuestion {
  type: 'email';
  // Email validation is automatic
}

export interface ChoiceQuestion extends BaseQuestion {
  type: 'choice';
  /** List of choices (radio buttons or checkboxes) */
  options: string[];
  /** Allow 'Other' free-text option */
  allowOther?: boolean;
  /** Allow multiple selections (checkboxes vs radio) */
  multiple?: boolean;
}

export interface DropdownQuestion extends BaseQuestion {
  type: 'dropdown';
  /** List of dropdown options */
  options: string[];
}

export interface ScaleQuestion extends BaseQuestion {
  type: 'scale';
  /** Minimum scale value (0 or 1) */
  min: number;
  /** Maximum scale value (2-10) */
  max: number;
  /** Label for minimum value */
  minLabel?: string;
  /** Label for maximum value */
  maxLabel?: string;
}

export interface Section {
  type: 'section';
  /** Section header text */
  title: string;
  /** Optional section description */
  description?: string;
  /** Questions within this section */
  questions: Question[];
  /** Conditional display logic */
  showIf?: ConditionalLogic;
}

// =============================================================================
// Conditional Logic
// =============================================================================

export interface ConditionalLogic {
  /** Question ID to evaluate */
  field: string;
  /** Show if field equals this value */
  equals?: string;
  /** Show if field value is in this list */
  in?: string[];
  /** Show if field does not equal this value */
  notEquals?: string;
}

// =============================================================================
// Validation
// =============================================================================

export interface TextValidation {
  /** Regex pattern for validation */
  pattern?: string;
  /** Error message when pattern fails */
  patternError?: string;
}

// =============================================================================
// Integration Types
// =============================================================================

export type Integration = SheetsIntegration | EmailIntegration | WebhookIntegration;

export type IntegrationType = Integration['type'];

export interface SheetsIntegration {
  type: 'sheets';
  /** Name for new spreadsheet */
  spreadsheetName?: string;
  /** ID of existing spreadsheet to link */
  spreadsheetId?: string;
  /** Create spreadsheet if not exists */
  createIfMissing?: boolean;
  /** Google Drive folder ID for new spreadsheet */
  folderId?: string;
}

export interface EmailIntegration {
  type: 'email';
  /** Email addresses to notify on submission */
  to: string[];
  /** Email subject template */
  subject?: string;
  /** Only send when condition matches */
  condition?: ConditionalLogic;
}

export interface WebhookIntegration {
  type: 'webhook';
  /** Webhook endpoint URL */
  url: string;
  /** HTTP method */
  method?: 'POST' | 'PUT';
  /** Custom HTTP headers */
  headers?: Record<string, string>;
  /** Secret for HMAC signature */
  secret?: string;
  /** Retry configuration */
  retry?: RetryConfig;
}

export interface RetryConfig {
  /** Maximum retry attempts */
  maxAttempts?: number;
  /** Backoff delay in milliseconds */
  backoffMs?: number;
}

// =============================================================================
// Form Settings
// =============================================================================

export interface FormSettings {
  /** Collect respondent email addresses */
  collectEmail?: boolean;
  /** Limit to one response per user */
  limitOneResponse?: boolean;
  /** Allow editing after submission */
  editAfterSubmit?: boolean;
  /** Message shown after submission */
  confirmationMessage?: string;
  /** Quiz mode settings */
  quiz?: QuizSettings;
}

export interface QuizSettings {
  /** Enable quiz mode */
  isQuiz?: boolean;
  /** Show score after submission */
  showScore?: boolean;
  /** Show correct answers after submission */
  showCorrectAnswers?: boolean;
}

// =============================================================================
// State Management Types
// =============================================================================

export interface StateFile {
  /** State file format version */
  version: string;
  /** Map of local file paths to form state */
  forms: Record<string, FormState>;
}

export interface FormState {
  /** Relative path to the form definition file */
  localPath: string;
  /** Google Forms ID (after first deploy) */
  formId?: string;
  /** URL to view/edit the form */
  formUrl?: string;
  /** URL for respondents */
  responseUrl?: string;
  /** Linked Google Sheets ID */
  spreadsheetId?: string;
  /** URL to the linked spreadsheet */
  spreadsheetUrl?: string;
  /** ISO 8601 timestamp of last deployment */
  lastDeployed?: string;
  /** Email or identifier of deployer */
  lastDeployedBy?: string;
  /** SHA-256 hash of deployed form definition */
  contentHash?: string;
  /** Google Forms revision ID for conflict detection */
  remoteRevisionId?: string;
}

// =============================================================================
// Diff Types
// =============================================================================

export type DiffStatus = 'new' | 'modified' | 'unchanged' | 'deleted';
export type DiffAction = 'add' | 'remove' | 'modify' | 'unchanged';

export interface DiffResult {
  /** Overall form status */
  status: DiffStatus;
  /** Whether there are any changes */
  hasChanges: boolean;
  /** Question-level diffs */
  questions: QuestionDiff[];
  /** Integration-level diffs */
  integrations: IntegrationDiff[];
  /** Settings changes */
  settings?: SettingsDiff;
}

export interface QuestionDiff {
  /** What action is needed */
  action: DiffAction;
  /** Question ID */
  questionId: string;
  /** Local version (undefined if deleted) */
  local?: Question;
  /** Remote version (undefined if new) */
  remote?: Question;
  /** List of changed property paths */
  changes: string[];
}

export interface IntegrationDiff {
  /** What action is needed */
  action: DiffAction;
  /** Integration type */
  integrationType: IntegrationType;
  /** Local version */
  local?: Integration;
  /** Remote version */
  remote?: Integration;
  /** List of changed properties */
  changes: string[];
}

export interface SettingsDiff {
  /** List of changed setting paths */
  changes: string[];
  /** Local settings */
  local?: FormSettings;
  /** Remote settings */
  remote?: FormSettings;
}
