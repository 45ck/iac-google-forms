/**
 * State Manager
 * Manages the .gforms/state.json file that tracks deployed forms
 *
 * Implements TC-STATE-001 through TC-STATE-005 from test plan
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { StateFileSchema, type FormState, type StateFile } from '../schema/state-file.js';

/**
 * Error thrown when state file operations fail
 */
export class StateError extends Error {
  public override readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'StateError';
    this.cause = cause;
  }
}

/**
 * Manages form state persistence to the state.json file
 */
export class StateManager {
  private readonly stateFilePath: string;
  private readonly stateDir: string;
  private readonly lockPath: string;

  /**
   * Create a new StateManager
   * @param stateDir - Directory where state.json will be stored (e.g., '.gforms')
   */
  constructor(stateDir: string) {
    this.stateDir = stateDir;
    this.stateFilePath = path.join(stateDir, 'state.json');
    this.lockPath = `${this.stateFilePath}.lock`;
  }

  /**
   * Load the state file
   * Returns empty state if file doesn't exist
   * Throws if file is corrupted or invalid
   *
   * TC-STATE-003: Load state file
   * TC-STATE-004: Handle corrupted state
   */
  async load(): Promise<StateFile> {
    try {
      const content = await fs.readFile(this.stateFilePath, 'utf-8');
      const parsed = JSON.parse(content) as unknown;

      const result = StateFileSchema.safeParse(parsed);
      if (!result.success) {
        throw new StateError(
          `Invalid state file structure: ${result.error.issues.map((i) => i.message).join(', ')}`
        );
      }

      return result.data;
    } catch (error) {
      // File doesn't exist - return empty state
      if (this.isFileNotFoundError(error)) {
        return { version: '1.0.0', forms: {} };
      }

      // JSON parse error
      if (error instanceof SyntaxError) {
        throw new StateError(
          `Failed to parse state file: Invalid JSON in ${this.stateFilePath}`,
          error
        );
      }

      // Re-throw StateError as-is
      if (error instanceof StateError) {
        throw error;
      }

      // Unknown error
      throw new StateError(
        `Failed to load state file: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  /**
   * Save the complete state file with exclusive lock
   */
  private async save(state: StateFile): Promise<void> {
    // Ensure directory exists
    await fs.mkdir(this.stateDir, { recursive: true });

    await this.withLock(async () => {
      // Write atomically by writing to temp file first
      const tempPath = `${this.stateFilePath}.tmp`;
      await fs.writeFile(tempPath, JSON.stringify(state, null, 2), 'utf-8');
      await fs.rename(tempPath, this.stateFilePath);
    });
  }

  private static readonly LOCK_TIMEOUT_MS = 10000;
  private static readonly LOCK_RETRY_MS = 100;

  /**
   * Acquire an exclusive lock file, run fn, then release.
   * Stale locks older than LOCK_TIMEOUT_MS are automatically broken.
   */
  private async withLock<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquireLock();
    try {
      return await fn();
    } finally {
      await this.releaseLock();
    }
  }

  private async acquireLock(): Promise<void> {
    const deadline = Date.now() + StateManager.LOCK_TIMEOUT_MS;

    while (Date.now() < deadline) {
      try {
        await fs.writeFile(this.lockPath, String(process.pid), { flag: 'wx' });
        return;
      } catch (error: unknown) {
        // Only retry if the lock file already exists (EEXIST).
        // Any other error (e.g. permission denied) should propagate immediately.
        if (!this.isFileExistsError(error)) {
          throw new StateError(
            `Failed to create lock file: ${error instanceof Error ? error.message : String(error)}`,
            error
          );
        }

        // Lock file exists — check if it's stale
        const broken = await this.tryBreakStaleLock();
        if (broken) {
          continue; // Retry immediately after breaking stale lock
        }
        await this.sleep(StateManager.LOCK_RETRY_MS);
      }
    }

    throw new StateError('Failed to acquire state file lock — another process may be running');
  }

  private async tryBreakStaleLock(): Promise<boolean> {
    try {
      const stat = await fs.stat(this.lockPath);
      const age = Date.now() - stat.mtimeMs;
      if (age > StateManager.LOCK_TIMEOUT_MS) {
        await fs.unlink(this.lockPath);
        return true;
      }
      return false;
    } catch {
      // Lock already removed — race with another process is fine
      return true;
    }
  }

  private isFileExistsError(error: unknown): boolean {
    return (
      error instanceof Error &&
      'code' in error &&
      (error as NodeJS.ErrnoException).code === 'EEXIST'
    );
  }

  private async releaseLock(): Promise<void> {
    try {
      await fs.unlink(this.lockPath);
    } catch {
      // Already released
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Save or update form state
   *
   * TC-STATE-001: Create state file
   * TC-STATE-002: Update existing state
   */
  async saveFormState(formPath: string, formState: FormState): Promise<void> {
    const state = await this.load();
    state.forms[formPath] = formState;
    await this.save(state);
  }

  /**
   * Get form state by path
   *
   * TC-STATE-003: Load state file
   */
  async getFormState(formPath: string): Promise<FormState | undefined> {
    const state = await this.load();
    return state.forms[formPath];
  }

  /**
   * Remove form from state
   *
   * TC-STATE-005: Remove form from state
   */
  async removeFormState(formPath: string): Promise<void> {
    const state = await this.load();

    if (formPath in state.forms) {
      state.forms = Object.fromEntries(
        Object.entries(state.forms).filter(([key]) => key !== formPath)
      );
      await this.save(state);
    }
  }

  /**
   * List all tracked forms
   */
  async listForms(): Promise<FormState[]> {
    const state = await this.load();
    return Object.values(state.forms);
  }

  /**
   * Check if a form is tracked
   */
  async hasForm(formPath: string): Promise<boolean> {
    const state = await this.load();
    return formPath in state.forms;
  }

  /**
   * Check if error is a "file not found" error
   */
  private isFileNotFoundError(error: unknown): boolean {
    return (
      error instanceof Error &&
      'code' in error &&
      (error as NodeJS.ErrnoException).code === 'ENOENT'
    );
  }
}
