/**
 * Configuration helpers for iac-google-forms
 */

import type { GFormsConfig } from '../types/index.js';
import type { FormDefinition } from '../schema/index.js';

/**
 * Define the gforms configuration
 * Used in gforms.config.ts files
 *
 * @example
 * ```typescript
 * import { defineConfig } from 'iac-google-forms';
 *
 * export default defineConfig({
 *   defaults: {
 *     settings: {
 *       collectEmail: false,
 *       limitOneResponse: false,
 *     },
 *   },
 *   oauth: {
 *     clientId: process.env.GOOGLE_CLIENT_ID,
 *     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
 *   },
 *   stateDir: '.gforms',
 * });
 * ```
 */
export function defineConfig(config: GFormsConfig): GFormsConfig {
  return config;
}

/**
 * Define a form with type checking
 * Used in form definition files
 *
 * @example
 * ```typescript
 * import { defineForm } from 'iac-google-forms';
 *
 * export default defineForm({
 *   title: 'Customer Feedback',
 *   questions: [
 *     { id: 'name', type: 'text', title: 'Your name', required: true },
 *     { id: 'satisfaction', type: 'scale', title: 'How satisfied are you?', min: 1, max: 5 },
 *   ],
 * });
 * ```
 */
export function defineForm(form: FormDefinition): FormDefinition {
  return form;
}
