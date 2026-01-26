/**
 * Global CLI options
 * Shared state for global options accessible to all subcommands
 */

import chalk from 'chalk';

export interface GlobalOptions {
  verbose: boolean;
  quiet: boolean;
  color: boolean;
  configPath: string;
}

const defaults: GlobalOptions = {
  verbose: false,
  quiet: false,
  color: true,
  configPath: 'gforms.config.ts',
};

let currentOptions: GlobalOptions = { ...defaults };

/**
 * Apply global options from parsed CLI flags.
 * Called in preAction hook before any command runs.
 */
export function applyGlobalOptions(opts: Record<string, unknown>): void {
  currentOptions = {
    verbose: opts['verbose'] === true,
    quiet: opts['quiet'] === true,
    color: opts['color'] !== false,
    configPath: typeof opts['config'] === 'string' ? opts['config'] : defaults.configPath,
  };

  if (!currentOptions.color) {
    chalk.level = 0;
  }
}

/**
 * Get current global options
 */
export function getGlobalOptions(): Readonly<GlobalOptions> {
  return currentOptions;
}

/**
 * Reset global options to defaults (for testing)
 */
export function resetGlobalOptions(): void {
  currentOptions = { ...defaults };
}
