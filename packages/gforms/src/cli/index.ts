#!/usr/bin/env node
/**
 * gforms CLI - Infrastructure as Code for Google Forms
 *
 * Usage:
 *   gforms init          Initialize a new project
 *   gforms auth login    Authenticate with Google
 *   gforms auth logout   Remove credentials
 *   gforms auth status   Show auth status
 *   gforms validate      Validate form definition
 *   gforms diff          Show changes between local and remote
 *   gforms deploy        Deploy form to Google Forms
 *   gforms list          List tracked forms
 *   gforms destroy       Delete form from Google
 */

import { Command } from 'commander';
import { createInitCommand } from './commands/init.js';
import { createAuthCommand } from './commands/auth.js';
import { createValidateCommand } from './commands/validate.js';
import { createDiffCommand } from './commands/diff.js';
import { createDeployCommand } from './commands/deploy.js';
import { createListCommand } from './commands/list.js';
import { createDestroyCommand } from './commands/destroy.js';
import { applyGlobalOptions } from './global-options.js';

const program = new Command();

program
  .name('gforms')
  .description('Infrastructure as Code for Google Forms')
  .version('0.1.0');

// Global options
program
  .option('--verbose', 'Enable verbose output')
  .option('-q, --quiet', 'Suppress non-essential output')
  .option('--no-color', 'Disable colored output')
  .option('-c, --config <path>', 'Path to config file', 'gforms.config.ts');

// Apply global options before any command executes
program.hook('preAction', (thisCommand) => {
  applyGlobalOptions(thisCommand.optsWithGlobals());
});

// Register commands
program.addCommand(createInitCommand());
program.addCommand(createAuthCommand());
program.addCommand(createValidateCommand());
program.addCommand(createDiffCommand());
program.addCommand(createDeployCommand());
program.addCommand(createListCommand());
program.addCommand(createDestroyCommand());

program.parse();
