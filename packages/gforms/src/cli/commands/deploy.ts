/**
 * gforms deploy command
 * Deploy form definitions to Google Forms
 */

import { Command } from 'commander';
import chalk from 'chalk';
import type { FormDefinition, FormState } from '../../schema/index.js';
import { StateManager } from '../../state/state-manager.js';
import { FormsClient, FormsApiError, type CreateFormResult } from '../../api/forms-client.js';
import { AuthError } from '../../auth/auth-manager.js';
import { DiffEngine, type DiffSummary, type DiffResult } from '../../diff/diff-engine.js';
import { convertResponseToFormDefinition } from '../../api/response-converter.js';
import { hashFormDefinition } from '../../utils/hash.js';
import { loadFormDefinition, DEFAULT_STATE_DIR, getGlobalOptions, getAuthManager, commandAction } from '../utils/load-form.js';

interface DeployOptions {
  autoApprove?: boolean;
  dryRun?: boolean;
}

interface DeployContext {
  file: string;
  localDef: FormDefinition;
  stateManager: StateManager;
  getAccessToken: () => Promise<string>;
  formState: FormState | undefined;
  isNewForm: boolean;
  remoteDef?: FormDefinition | undefined;
  remoteRevisionId?: string | undefined;
}

interface RemoteFetchResult {
  definition?: FormDefinition | undefined;
  revisionId?: string | undefined;
}

export function createDeployCommand(): Command {
  const deploy = new Command('deploy')
    .description('Deploy a form definition to Google Forms')
    .argument('<file>', 'Path to form definition file')
    .option('--auto-approve', 'Skip confirmation prompt')
    .option('--dry-run', 'Show changes without deploying')
    .action(commandAction(async (file: string, options: DeployOptions) => {
      await runDeploy(file, options);
    }));

  return deploy;
}

async function runDeploy(file: string, options: DeployOptions): Promise<void> {
  const ctx = await initializeDeployContext(file);

  printFormInfo(ctx.localDef);

  if (!ctx.isNewForm && ctx.formState?.formId) {
    const remote = await fetchRemoteDef(ctx.getAccessToken, ctx.formState.formId);
    ctx.remoteDef = remote.definition;
    ctx.remoteRevisionId = remote.revisionId;
  }

  showDiffSummary(ctx);

  if (options.dryRun) {
    console.log(chalk.cyan('[Dry run]'), 'No changes will be made.');
    return;
  }

  if (!options.autoApprove) {
    console.log(chalk.yellow('To deploy, run with --auto-approve or --dry-run to preview'));
    return;
  }

  await executeDeployment(ctx);
}

async function initializeDeployContext(file: string): Promise<DeployContext> {
  const localDef = await loadFormDefinition(file);

  const stateManager = new StateManager(DEFAULT_STATE_DIR);
  const authManager = getAuthManager();
  const getAccessToken = (): Promise<string> => authManager.getAccessToken();

  const formState = await stateManager.getFormState(file);
  const isNewForm = !formState?.formId;

  return { file, localDef, stateManager, getAccessToken, formState, isNewForm };
}

function printFormInfo(localDef: FormDefinition): void {
  console.log(chalk.cyan('Form:'), localDef.title);
  console.log(chalk.cyan('Questions:'), String(localDef.questions.length));
  console.log();
}

async function fetchRemoteDef(
  getAccessToken: () => Promise<string>,
  formId: string
): Promise<RemoteFetchResult> {
  try {
    console.log(chalk.dim('Fetching remote form for comparison...'));
    await getAccessToken(); // Validate credentials before making API call
    const client = new FormsClient(getAccessToken);
    const response = await client.getForm(formId);
    return {
      definition: convertResponseToFormDefinition(response) as FormDefinition,
      revisionId: response.revisionId,
    };
  } catch (error: unknown) {
    printFetchWarning(error);
    return {};
  }
}

function printFetchWarning(error: unknown): void {
  if (error instanceof AuthError) {
    console.log(chalk.yellow('Warning:'), 'Authentication failed — skipping remote comparison.');
  } else if (error instanceof FormsApiError && error.statusCode === 404) {
    console.log(chalk.yellow('Warning:'), 'Remote form not found — it may have been deleted.');
  } else if (error instanceof FormsApiError) {
    console.log(
      chalk.yellow('Warning:'),
      `API error (${String(error.statusCode)}) — skipping remote comparison.`
    );
  } else {
    console.log(chalk.yellow('Warning:'), 'Could not fetch remote form for comparison.');
  }

  if (getGlobalOptions().verbose && error instanceof Error) {
    console.log(chalk.dim(`  Detail: ${error.message}`));
  }
}

function showDiffSummary(ctx: DeployContext): void {
  const diffEngine = new DiffEngine();

  if (ctx.isNewForm) {
    console.log(chalk.green('New form'), '- will be created');
    const diff = diffEngine.diff(ctx.localDef, null);
    const summary = diffEngine.getSummary(diff);
    console.log(`  ${chalk.green('+')} ${String(summary.added)} question(s) to add`);
  } else if (ctx.formState?.formId) {
    console.log(chalk.yellow('Existing form'), `- ID: ${ctx.formState.formId}`);
    if (ctx.remoteDef) {
      const diff = diffEngine.diff(ctx.localDef, ctx.remoteDef);
      const summary = diffEngine.getSummary(diff);
      printExistingFormDiff(diff, summary);
    } else {
      console.log(chalk.dim('  (Could not fetch remote form for comparison)'));
    }
  }

  console.log();
}

function printExistingFormDiff(diff: DiffResult, summary: DiffSummary): void {
  if (!diff.hasChanges) {
    console.log(chalk.green('  No changes detected'));
    return;
  }
  if (summary.added > 0) {
    console.log(`  ${chalk.green('+')} ${String(summary.added)} question(s) to add`);
  }
  if (summary.removed > 0) {
    console.log(`  ${chalk.red('-')} ${String(summary.removed)} question(s) to remove`);
  }
  if (summary.modified > 0) {
    console.log(`  ${chalk.yellow('~')} ${String(summary.modified)} question(s) to modify`);
  }
}

async function executeDeployment(ctx: DeployContext): Promise<void> {
  const contentHash = hashFormDefinition(ctx.localDef);

  // Skip deploy if content hash matches (no changes since last deploy)
  if (!ctx.isNewForm && ctx.formState?.contentHash === contentHash) {
    console.log(chalk.green('No changes detected'), '— skipping deploy (content hash matches).');
    return;
  }

  console.log(chalk.dim('Authenticating...'));
  const formsClient = new FormsClient(ctx.getAccessToken);

  if (ctx.isNewForm) {
    await createNewForm(ctx, formsClient, contentHash);
  } else if (ctx.formState?.formId) {
    warnIfRevisionConflict(ctx);
    await updateExistingForm(ctx, formsClient, ctx.formState.formId, contentHash);
  }
}

function warnIfRevisionConflict(ctx: DeployContext): void {
  const stored = ctx.formState?.remoteRevisionId;
  const current = ctx.remoteRevisionId;
  if (stored && current && stored !== current) {
    console.log(chalk.yellow('Warning:'), 'Form was modified remotely since last deploy.');
  }
}

async function fetchRevisionId(
  formsClient: FormsClient,
  formId: string
): Promise<string | undefined> {
  try {
    const form = await formsClient.getForm(formId);
    return form.revisionId;
  } catch {
    return undefined;
  }
}

async function createNewForm(
  ctx: DeployContext,
  formsClient: FormsClient,
  contentHash: string
): Promise<void> {
  console.log(chalk.dim('Creating form...'));
  const result = await formsClient.createForm(ctx.localDef);
  const revisionId = await fetchRevisionId(formsClient, result.formId);

  await ctx.stateManager.saveFormState(ctx.file, {
    localPath: ctx.file,
    formId: result.formId,
    formUrl: result.formUrl,
    responseUrl: result.responseUrl,
    lastDeployed: new Date().toISOString(),
    contentHash,
    remoteRevisionId: revisionId,
  });

  printCreateSuccess(result);
}

async function updateExistingForm(
  ctx: DeployContext,
  formsClient: FormsClient,
  formId: string,
  contentHash: string
): Promise<void> {
  console.log(chalk.dim('Updating form...'));
  await formsClient.updateForm(formId, ctx.localDef);
  const revisionId = await fetchRevisionId(formsClient, formId);

  if (ctx.formState) {
    await ctx.stateManager.saveFormState(ctx.file, {
      ...ctx.formState,
      lastDeployed: new Date().toISOString(),
      contentHash,
      remoteRevisionId: revisionId,
    });
  }

  console.log();
  console.log(chalk.green('Success!'), 'Form updated.');
  console.log('  Form ID:', chalk.cyan(formId));
}

function printCreateSuccess(result: CreateFormResult): void {
  console.log();
  console.log(chalk.green('Success!'), 'Form created.');
  console.log();
  console.log('  Form ID:', chalk.cyan(result.formId));
  console.log('  Edit URL:', chalk.cyan(result.formUrl));
  console.log('  Response URL:', chalk.cyan(result.responseUrl));
}

