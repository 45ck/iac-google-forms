/**
 * gforms destroy command
 * Remove a form from Google and clear state
 */

import chalk from 'chalk';
import { Command } from 'commander';
import { FormsApiError, FormsClient } from '../../api/forms-client.js';
import { StateManager } from '../../state/state-manager.js';
import { commandAction, DEFAULT_STATE_DIR, getAuthManager } from '../utils/load-form.js';

interface DestroyOptions {
  autoApprove?: boolean;
  keepRemote?: boolean;
}

export function createDestroyCommand(): Command {
  const destroy = new Command('destroy')
    .description('Remove a form from Google and clear local state')
    .argument('<file>', 'Path to form definition file')
    .option('--auto-approve', 'Skip confirmation prompt')
    .option('--keep-remote', 'Only clear local state, keep form on Google')
    .action(
      commandAction(async (file: string, options: DestroyOptions) => {
        await runDestroy(file, options);
      })
    );

  return destroy;
}

async function runDestroy(file: string, options: DestroyOptions): Promise<void> {
  const stateManager = new StateManager(DEFAULT_STATE_DIR);
  const formState = await stateManager.getFormState(file);

  if (!formState) {
    throw new Error(`No state found for ${file}. Nothing to destroy.`);
  }

  printDestroyPlan(file, formState.formId, options.keepRemote);

  if (!options.autoApprove) {
    console.log(chalk.yellow('To proceed, run with --auto-approve'));
    return;
  }

  if (!options.keepRemote && formState.formId) {
    await deleteRemoteForm(formState.formId);
  }

  await stateManager.removeFormState(file);
  console.log(chalk.green('✓'), `State cleared for ${file}`);
}

function printDestroyPlan(
  file: string,
  formId: string | undefined,
  keepRemote: boolean | undefined
): void {
  console.log(chalk.red('This will permanently destroy:'));
  console.log(`  File: ${file}`);
  if (formId) {
    console.log(`  Form ID: ${formId}`);
  }
  console.log();

  if (keepRemote) {
    console.log(chalk.dim('  --keep-remote: Form will NOT be deleted from Google.'));
    console.log(chalk.dim('  Only local state will be cleared.'));
  } else if (formId) {
    console.log(chalk.red('  The form will be deleted from Google.'));
    console.log(chalk.red('  This action cannot be undone.'));
  }
  console.log();
}

async function deleteRemoteForm(formId: string): Promise<void> {
  const authManager = getAuthManager();

  console.log(chalk.dim('Authenticating...'));
  const formsClient = new FormsClient(() => authManager.getAccessToken());

  const exists = await verifyFormExists(formsClient, formId);
  if (!exists) {
    console.log(
      chalk.yellow('Warning:'),
      'Form not found on Google — may have been deleted already.'
    );
    return;
  }

  console.log(chalk.dim('Deleting form from Google...'));
  await formsClient.deleteForm(formId);
  console.log(chalk.green('✓'), 'Form deleted from Google');
}

async function verifyFormExists(client: FormsClient, formId: string): Promise<boolean> {
  try {
    await client.getForm(formId);
    return true;
  } catch (error: unknown) {
    if (error instanceof FormsApiError && error.statusCode === 404) {
      return false;
    }
    throw error;
  }
}
