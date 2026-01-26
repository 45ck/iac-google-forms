/**
 * iac-google-forms - Infrastructure as Code for Google Forms
 *
 * Define forms in TypeScript, version control them, and deploy with diff preview.
 */

// Schema & Validation
export * from './schema/index.js';

// Types
export type * from './types/index.js';

// Config
export { defineConfig, defineForm } from './config/index.js';

// State management
export { StateError, StateManager } from './state/state-manager.js';

// Auth
export { AuthError, AuthManager, TokenStore } from './auth/auth-manager.js';

// Diff engine
export { DiffEngine } from './diff/diff-engine.js';
export type { DiffSummary } from './diff/diff-engine.js';

// API client
export { FormsApiError, FormsClient } from './api/forms-client.js';
export type { CreateFormResult, FormListItem } from './api/forms-client.js';

// Utilities
export { isRetryableStatusCode, makeRetryable, withRetry } from './utils/retry.js';
export type { RetryOptions } from './utils/retry.js';
