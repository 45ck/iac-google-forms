/**
 * CLI Program Tests
 * TC-CLI-009: gforms --help
 * TC-CLI-010: gforms --version
 */

import { Command } from 'commander';
import { describe, expect, it } from 'vitest';
import { createDeployCommand } from './commands/deploy.js';
import { createDestroyCommand } from './commands/destroy.js';
import { createDiffCommand } from './commands/diff.js';
import { createInitCommand } from './commands/init.js';
import { createListCommand } from './commands/list.js';
import { createValidateCommand } from './commands/validate.js';

/**
 * Build the CLI program (mirrors src/cli/index.ts without calling parse)
 */
function buildProgram(): Command {
  const program = new Command();
  program.name('gforms').description('Infrastructure as Code for Google Forms').version('0.1.0');

  program
    .option('--verbose', 'Enable verbose output')
    .option('-q, --quiet', 'Suppress non-essential output')
    .option('--no-color', 'Disable colored output')
    .option('-c, --config <path>', 'Path to config file', 'gforms.config.ts');

  program.addCommand(createInitCommand());
  program.addCommand(createValidateCommand());
  program.addCommand(createDiffCommand());
  program.addCommand(createDeployCommand());
  program.addCommand(createListCommand());
  program.addCommand(createDestroyCommand());

  return program;
}

describe('CLI program', () => {
  // TC-CLI-009: gforms --help shows usage with all commands
  describe('TC-CLI-009: --help shows usage', () => {
    it('should include all registered commands in help text', () => {
      const program = buildProgram();
      const helpText = program.helpInformation();

      expect(helpText).toContain('gforms');
      expect(helpText).toContain('Infrastructure as Code for Google Forms');
      expect(helpText).toContain('init');
      expect(helpText).toContain('validate');
      expect(helpText).toContain('diff');
      expect(helpText).toContain('deploy');
      expect(helpText).toContain('list');
      expect(helpText).toContain('destroy');
    });

    it('should include global options in help text', () => {
      const program = buildProgram();
      const helpText = program.helpInformation();

      expect(helpText).toContain('--verbose');
      expect(helpText).toContain('--quiet');
      expect(helpText).toContain('--no-color');
      expect(helpText).toContain('--config');
    });
  });

  // TC-CLI-010: gforms --version shows version
  describe('TC-CLI-010: --version shows version', () => {
    it('should have a version string set', () => {
      const program = buildProgram();

      expect(program.version()).toBe('0.1.0');
    });

    it('should have version option registered', () => {
      const program = buildProgram();
      const versionOption = program.options.find((o) => o.long === '--version' || o.short === '-V');

      expect(versionOption).toBeDefined();
    });
  });
});
