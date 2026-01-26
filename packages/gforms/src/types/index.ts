/**
 * Type definitions for iac-google-forms
 *
 * Most types are inferred from Zod schemas in ./schema
 * This file contains additional types not derived from schemas.
 */

// Re-export schema-derived types
export type {
  FormDefinition,
  FormState,
  Integration,
  Question,
  StateFile,
} from '../schema/index.js';

// Diff types
export type DiffStatus = 'new' | 'modified' | 'unchanged' | 'deleted';
export type DiffAction = 'add' | 'remove' | 'modify' | 'unchanged';

export interface DiffResult {
  status: DiffStatus;
  hasChanges: boolean;
  title?: { local: string; remote: string };
  description?: { local?: string; remote?: string };
  questions: QuestionDiff[];
  integrations: IntegrationDiff[];
  settings?: SettingsDiff;
  orderChanged: boolean;
}

export interface QuestionDiff {
  action: DiffAction;
  questionId: string;
  local?: unknown;
  remote?: unknown;
  changes: string[];
}

export interface IntegrationDiff {
  action: DiffAction;
  integrationType: string;
  local?: unknown;
  remote?: unknown;
  changes: string[];
}

export interface SettingsDiff {
  changes: string[];
  local?: unknown;
  remote?: unknown;
}

// Auth types
export type AuthMethod = 'oauth' | 'service-account';

export interface AuthState {
  method: AuthMethod | null;
  isAuthenticated: boolean;
  email?: string;
  expiresAt?: string;
}

// Config types
export interface GFormsConfig {
  defaults?: {
    settings?: {
      collectEmail?: boolean;
      limitOneResponse?: boolean;
    };
  };
  oauth?: {
    clientId?: string;
    clientSecret?: string;
  };
  stateDir?: string;
}

// CLI types
export interface DiffOptions {
  format?: 'console' | 'markdown' | 'json';
  ci?: boolean;
}

export interface DeployOptions {
  autoApprove?: boolean;
  dryRun?: boolean;
}

export interface DestroyOptions {
  autoApprove?: boolean;
  keepRemote?: boolean;
}
