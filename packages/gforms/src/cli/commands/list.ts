/**
 * gforms list command
 * List tracked forms
 */

import chalk from 'chalk';
import { Command } from 'commander';
import { StateManager } from '../../state/index.js';
import { DEFAULT_STATE_DIR, commandAction } from '../utils/load-form.js';

export function createListCommand(): Command {
  const list = new Command('list')
    .description('List all forms tracked in the state file')
    .option('--format <fmt>', 'Output format (table, json)', 'table')
    .action(
      commandAction(async (options: { format: string }) => {
        await runList(options);
      })
    );

  return list;
}

const VALID_FORMATS = ['table', 'json'] as const;
type OutputFormat = (typeof VALID_FORMATS)[number];

function validateFormat(format: string): OutputFormat {
  if (!VALID_FORMATS.includes(format as OutputFormat)) {
    throw new Error(`Invalid format '${format}'. Valid formats: ${VALID_FORMATS.join(', ')}`);
  }
  return format as OutputFormat;
}

async function runList(options: { format: string }): Promise<void> {
  const format = validateFormat(options.format);
  const stateManager = new StateManager(DEFAULT_STATE_DIR);

  const forms = await stateManager.listForms();

  if (format === 'json') {
    console.log(JSON.stringify(forms, null, 2));
    return;
  }

  // Table format
  console.log(chalk.bold('Tracked Forms'));
  console.log('─'.repeat(70));

  if (forms.length === 0) {
    console.log(chalk.dim('No forms tracked yet.'));
    console.log();
    console.log("Run 'gforms deploy <file>' to deploy your first form.");
    return;
  }

  // Header
  console.log(chalk.gray(padRight('File', 30) + padRight('Form ID', 25) + 'Last Deployed'));
  console.log('─'.repeat(70));

  // Rows
  for (const form of forms) {
    const deployed = form.lastDeployed
      ? new Date(form.lastDeployed).toLocaleString()
      : chalk.dim('(not deployed)');
    const formId = form.formId ?? chalk.dim('(pending)');

    console.log(
      padRight(form.localPath, 30) + padRight(formId.slice(0, 23) + '...', 25) + deployed
    );
  }

  console.log('─'.repeat(70));
  console.log(`${String(forms.length)} form(s) tracked`);
}

function padRight(str: string, len: number): string {
  if (str.length >= len) {
    return str.slice(0, len - 1) + ' ';
  }
  return str.padEnd(len);
}
