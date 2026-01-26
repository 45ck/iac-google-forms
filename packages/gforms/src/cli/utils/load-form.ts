/**
 * Shared CLI utilities
 * Eliminates duplicated logic across CLI commands
 */

import chalk from 'chalk';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { AuthManager, TokenStore } from '../../auth/index.js';
import { validateFormDefinition, type FormDefinition } from '../../schema/index.js';
import { DEFAULT_SCOPES } from '../constants.js';

export { DEFAULT_STATE_DIR } from '../constants.js';
export { getGlobalOptions } from '../global-options.js';

/**
 * Sanitize an error message to prevent leaking sensitive data (tokens, credentials).
 */
export function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/Bearer\s+[\w./-]+/gi, 'Bearer [REDACTED]')
    .replace(/access_token["':\s]+[\w./-]+/gi, 'access_token: [REDACTED]')
    .replace(/ya29\.[\w-]+/g, '[REDACTED_TOKEN]');
}

/**
 * Assert that a resolved file path does not escape the current working directory.
 * Prevents path traversal attacks via arguments like "../../etc/passwd".
 */
export function assertSafePath(resolvedPath: string, displayPath: string): void {
  const cwd = process.cwd();
  if (!resolvedPath.startsWith(cwd)) {
    throw new Error(
      `Path '${displayPath}' resolves outside the project directory. ` +
        'Provide a path within the project.'
    );
  }
}

/**
 * Create a TokenStore pointing to the user-level credentials file (~/.gforms/credentials.json).
 * All commands must use this single location for credential storage.
 */
export function getTokenStore(): TokenStore {
  const credPath = path.join(os.homedir(), '.gforms', 'credentials.json');
  return new TokenStore(credPath);
}

/**
 * Create an AuthManager with default scopes and the shared token store.
 */
export function getAuthManager(): AuthManager {
  return new AuthManager({ tokenStore: getTokenStore(), scopes: DEFAULT_SCOPES });
}

/**
 * Load and validate a form definition from a JSON file.
 * Performs file existence check, TypeScript rejection, JSON parsing, and schema validation.
 */
export async function loadFormDefinition(file: string): Promise<FormDefinition> {
  const filePath = path.resolve(file);

  assertSafePath(filePath, file);
  await assertFileExists(filePath, file);
  assertNotTypeScript(filePath);

  const content = await fs.readFile(filePath, 'utf-8');
  const data = parseJsonContent(content, file);
  return validateForm(data);
}

/**
 * Assert that a file exists, throwing a descriptive error if not.
 */
export async function assertFileExists(filePath: string, displayPath: string): Promise<void> {
  try {
    await fs.access(filePath);
  } catch {
    throw new Error(`File not found: ${displayPath}`);
  }
}

/**
 * Assert the file is not TypeScript (requires compilation).
 */
function assertNotTypeScript(filePath: string): void {
  if (filePath.endsWith('.ts')) {
    throw new Error(
      'TypeScript files require compilation. Export as JSON or use the programmatic API.'
    );
  }
}

/**
 * Parse a JSON string, throwing a descriptive error on failure.
 */
export function parseJsonContent(content: string, displayPath: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    throw new Error(`Invalid JSON in ${displayPath}`);
  }
}

/**
 * Validate parsed data against the form definition schema.
 */
function validateForm(data: unknown): FormDefinition {
  const result = validateFormDefinition(data);
  if (!result.success || !result.data) {
    const errors = result.errors?.map((e) => `  ${e.path.join('.')}: ${e.message}`).join('\n');
    throw new Error(`Invalid form definition:\n${errors ?? 'Unknown validation error'}`);
  }
  return result.data;
}

/**
 * Wrap a command action with standard error handling.
 * If the action returns a non-zero number, exits with that code.
 * If the action throws, prints the error and exits with errorExitCode.
 */
export function commandAction<A extends unknown[]>(
  fn: (...args: A) => Promise<unknown>,
  errorExitCode = 1
): (...args: A) => Promise<void> {
  return async (...args: A): Promise<void> => {
    try {
      const result: unknown = await fn(...args);
      if (typeof result === 'number' && result !== 0) {
        process.exit(result);
      }
    } catch (error: unknown) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(errorExitCode);
    }
  };
}
