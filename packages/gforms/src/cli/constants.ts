/**
 * Shared CLI constants
 * Single source of truth for configuration defaults
 */

/** Default directory for state file and credentials */
export const DEFAULT_STATE_DIR = '.gforms';

/** Google API scopes required for all operations */
export const DEFAULT_SCOPES: readonly string[] = [
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/forms.responses.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];
