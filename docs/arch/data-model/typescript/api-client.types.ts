/**
 * API Client type definitions for Google Forms/Sheets/Drive APIs
 */

import type { AuthClient } from './auth.types';
import type { DiffResult, FormDefinition, FormState } from './form-definition.types';

// =============================================================================
// Google Forms API Types
// =============================================================================

/** Google Forms client interface */
export interface GoogleFormsClient {
  /** Authentication client */
  auth: AuthClient;

  /** Create a new form */
  createForm(definition: FormDefinition): Promise<CreateFormResult>;

  /** Update an existing form */
  updateForm(formId: string, definition: FormDefinition): Promise<UpdateFormResult>;

  /** Get form by ID */
  getForm(formId: string): Promise<RemoteForm>;

  /** Delete a form */
  deleteForm(formId: string): Promise<void>;

  /** Link form to Google Sheets */
  linkToSheets(formId: string, config: SheetsLinkConfig): Promise<SheetsLinkResult>;
}

export interface CreateFormResult {
  /** Created form ID */
  formId: string;
  /** URL to edit the form */
  formUrl: string;
  /** URL for respondents */
  responseUrl: string;
  /** Form revision ID */
  revisionId: string;
}

export interface UpdateFormResult {
  /** Form ID */
  formId: string;
  /** New revision ID */
  revisionId: string;
  /** Number of items updated */
  updatedItems: number;
}

export interface RemoteForm {
  /** Form ID */
  formId: string;
  /** Form title */
  title: string;
  /** Form description */
  description?: string;
  /** Form revision ID */
  revisionId: string;
  /** Questions in the form */
  questions: RemoteQuestion[];
  /** Form settings */
  settings: RemoteFormSettings;
  /** Linked response destination */
  linkedSheetId?: string;
}

export interface RemoteQuestion {
  /** Question item ID (Google's internal ID) */
  questionId: string;
  /** Question title */
  title: string;
  /** Question description */
  description?: string;
  /** Whether required */
  required: boolean;
  /** Question type info */
  questionType: RemoteQuestionType;
}

export type RemoteQuestionType =
  | { kind: 'textQuestion'; paragraph: boolean }
  | { kind: 'choiceQuestion'; type: 'RADIO' | 'CHECKBOX' | 'DROP_DOWN'; options: string[] }
  | { kind: 'scaleQuestion'; low: number; high: number; lowLabel?: string; highLabel?: string }
  | { kind: 'pageBreakItem' };

export interface RemoteFormSettings {
  collectEmail: boolean;
  limitOneResponse: boolean;
  editAfterSubmit: boolean;
  confirmationMessage?: string;
  isQuiz: boolean;
}

// =============================================================================
// Sheets Integration Types
// =============================================================================

export interface SheetsLinkConfig {
  /** Create new spreadsheet or link existing */
  mode: 'create' | 'link';
  /** Spreadsheet name (for create mode) */
  spreadsheetName?: string;
  /** Existing spreadsheet ID (for link mode) */
  spreadsheetId?: string;
  /** Drive folder ID for new spreadsheet */
  folderId?: string;
}

export interface SheetsLinkResult {
  /** Linked spreadsheet ID */
  spreadsheetId: string;
  /** Spreadsheet URL */
  spreadsheetUrl: string;
  /** Sheet name where responses go */
  sheetName: string;
}

// =============================================================================
// Config Loader Types
// =============================================================================

export interface ConfigLoader {
  /** Load form definition from TypeScript file */
  loadFormDefinition(filePath: string): Promise<FormDefinition>;
  /** Validate a form definition against schema */
  validateDefinition(definition: unknown): ValidationResult;
  /** Calculate content hash */
  calculateHash(definition: FormDefinition): string;
}

export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Validation errors (if any) */
  errors: ValidationError[];
  /** Validation warnings */
  warnings: ValidationWarning[];
}

export interface ValidationError {
  /** JSON path to the error */
  path: string;
  /** Error message */
  message: string;
  /** Error code for programmatic handling */
  code: string;
}

export interface ValidationWarning {
  /** JSON path to the warning */
  path: string;
  /** Warning message */
  message: string;
  /** Suggestion for fixing */
  suggestion?: string;
}

// =============================================================================
// State File Manager Types
// =============================================================================

export interface StateFileManager {
  /** Load state file (creates empty if missing) */
  load(): Promise<StateFileData>;
  /** Save state file */
  save(state: StateFileData): Promise<void>;
  /** Get state for a specific form */
  getFormState(localPath: string): Promise<FormState | null>;
  /** Update state for a specific form */
  updateFormState(localPath: string, state: Partial<FormState>): Promise<void>;
  /** Remove a form from state */
  removeFormState(localPath: string): Promise<void>;
}

export interface StateFileData {
  version: string;
  forms: Record<string, FormState>;
}

// =============================================================================
// Diff Engine Types
// =============================================================================

export interface DiffEngine {
  /** Calculate diff between local and remote form */
  calculateDiff(local: FormDefinition, remote: RemoteForm | null): DiffResult;
  /** Format diff for display */
  formatDiff(diff: DiffResult, options: DiffFormatOptions): string;
}

export interface DiffFormatOptions {
  /** Output format */
  format: 'console' | 'markdown' | 'json';
  /** Use colors (for console format) */
  color: boolean;
  /** Show full details or summary only */
  verbose: boolean;
}

// =============================================================================
// CLI Types
// =============================================================================

export interface DeployOptions {
  /** Path to form definition file */
  filePath: string;
  /** Skip confirmation prompt */
  autoApprove: boolean;
  /** Dry run (show diff only) */
  dryRun: boolean;
  /** Verbose output */
  verbose: boolean;
}

export interface DiffOptions {
  /** Path to form definition file */
  filePath: string;
  /** Output format */
  format: 'console' | 'markdown' | 'json';
  /** Exit with code 1 if changes detected (for CI) */
  exitOnChanges: boolean;
}

export interface AuthOptions {
  /** Force re-authentication */
  force: boolean;
  /** Auth method to use */
  method?: 'oauth' | 'service-account';
}
