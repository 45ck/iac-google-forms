/**
 * Zod schemas for state file validation
 * Implements validation per TC-STATE-001 through TC-STATE-005 from test plan
 */

import { z } from 'zod';

// =============================================================================
// Form State Schema
// =============================================================================

/**
 * State for a single tracked form
 */
export const FormStateSchema = z.object({
  /** Relative path to the form definition file */
  localPath: z.string(),
  /** Google Forms ID (after first deploy) */
  formId: z.string().optional(),
  /** URL to view/edit the form */
  formUrl: z.string().url().optional(),
  /** URL for respondents */
  responseUrl: z.string().url().optional(),
  /** Linked Google Sheets ID */
  spreadsheetId: z.string().optional(),
  /** URL to the linked spreadsheet */
  spreadsheetUrl: z.string().url().optional(),
  /** ISO 8601 timestamp of last deployment */
  lastDeployed: z.string().datetime().optional(),
  /** Email or identifier of deployer */
  lastDeployedBy: z.string().optional(),
  /** SHA-256 hash of deployed form definition */
  contentHash: z.string().optional(),
  /** Google Forms revision ID for conflict detection */
  remoteRevisionId: z.string().optional(),
});

// =============================================================================
// State File Schema
// =============================================================================

/**
 * Root state file schema
 * Stored at .gforms/state.json
 */
export const StateFileSchema = z.object({
  /** State file format version */
  version: z.string().default('1.0.0'),
  /** Map of local file paths to form state */
  forms: z.record(z.string(), FormStateSchema).default({}),
});

// =============================================================================
// Type Exports
// =============================================================================

export type FormState = z.infer<typeof FormStateSchema>;
export type StateFile = z.infer<typeof StateFileSchema>;

// =============================================================================
// Validation Function
// =============================================================================

export interface StateValidationResult {
  success: boolean;
  data?: StateFile;
  errors?: {
    path: (string | number)[];
    message: string;
  }[];
}

/**
 * Validate a state file
 * Returns a result object with either the validated data or an array of errors
 */
export function validateStateFile(input: unknown): StateValidationResult {
  const result = StateFileSchema.safeParse(input);

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
