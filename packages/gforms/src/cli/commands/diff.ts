/**
 * gforms diff command
 * Show differences between local and remote forms
 */

import chalk from 'chalk';
import { Command } from 'commander';
import { FormsClient } from '../../api/forms-client.js';
import { convertResponseToFormDefinition } from '../../api/response-converter.js';
import { DiffEngine } from '../../diff/diff-engine.js';
import type { FormDefinition } from '../../schema/index.js';
import { StateManager } from '../../state/state-manager.js';
import type { DiffResult, IntegrationDiff, QuestionDiff } from '../../types/index.js';
import { DEFAULT_STATE_DIR } from '../constants.js';
import { commandAction, getAuthManager, loadFormDefinition } from '../utils/load-form.js';

const diffEngine = new DiffEngine();

type OutputFormat = 'console' | 'markdown' | 'json';

interface DiffContext {
  localDef: FormDefinition;
  remoteDef: FormDefinition | null;
  format: OutputFormat;
  ci: boolean;
  formId?: string | undefined;
}

export function createDiffCommand(): Command {
  const diff = new Command('diff')
    .description('Show differences between local form and deployed version')
    .argument('<file>', 'Path to form definition file')
    .option('--format <fmt>', 'Output format (console, markdown, json)', 'console')
    .option('--ci', 'CI mode: exit 1 if changes detected')
    .action(
      commandAction(async (file: string, options: { format: string; ci: boolean }) => {
        return runDiff(file, options);
      }, 2)
    );

  return diff;
}

async function runDiff(file: string, options: { format: string; ci: boolean }): Promise<number> {
  const format = validateFormat(options.format);
  const localDef = await loadFormDefinition(file);
  const stateManager = new StateManager(DEFAULT_STATE_DIR);
  const formState = await stateManager.getFormState(file);

  let remoteDef: FormDefinition | null = null;

  if (formState?.formId) {
    remoteDef = await fetchRemoteForm(formState.formId);
  }

  const ctx: DiffContext = {
    localDef,
    remoteDef,
    format,
    ci: options.ci,
    formId: formState?.formId,
  };

  return executeDiff(ctx);
}

async function fetchRemoteForm(formId: string): Promise<FormDefinition | null> {
  try {
    const authManager = getAuthManager();
    const getAccessToken = (): Promise<string> => authManager.getAccessToken();
    await getAccessToken(); // Validate credentials eagerly
    const client = new FormsClient(getAccessToken);
    const response = await client.getForm(formId);
    return convertResponseToFormDefinition(response) as FormDefinition;
  } catch {
    console.log(chalk.dim('  Could not fetch remote form — showing local definition summary.'));
    return null;
  }
}

function executeDiff(ctx: DiffContext): number {
  const result = diffEngine.diff(ctx.localDef, ctx.remoteDef);

  formatOutput(result, ctx.localDef.title, ctx.format);
  return ctx.ci && result.hasChanges ? 1 : 0;
}

function formatOutput(result: DiffResult, title: string, format: OutputFormat): void {
  const formatters: Record<OutputFormat, () => void> = {
    console: () => formatConsole(result, title),
    markdown: () => formatMarkdown(result, title),
    json: () => formatJson(result),
  };
  formatters[format]();
}

function formatConsole(result: DiffResult, title: string): void {
  const summary = diffEngine.getSummary(result);

  if (result.status === 'new') {
    console.log(chalk.green('New form:'), title);
    console.log();
  } else if (result.status === 'unchanged') {
    console.log(chalk.green('No changes'), `- ${title} is up to date`);
    return;
  } else {
    console.log(chalk.yellow('Modified:'), title);
    console.log();
  }

  if (result.title) {
    console.log(chalk.yellow('~ Title:'), `"${result.title.remote}" → "${result.title.local}"`);
  }

  printQuestionDiffs(result.questions);
  printIntegrationDiffs(result.integrations);

  if (result.orderChanged) {
    console.log();
    console.log(chalk.yellow('⚠'), 'Question order has changed');
  }

  console.log();
  const parts = buildSummaryParts(summary);
  console.log('Summary:', parts.join(', '));
}

function buildSummaryParts(summary: {
  added: number;
  removed: number;
  modified: number;
  unchanged: number;
}): string[] {
  const parts: string[] = [];
  if (summary.added > 0) {
    parts.push(chalk.green(`${String(summary.added)} added`));
  }
  if (summary.removed > 0) {
    parts.push(chalk.red(`${String(summary.removed)} removed`));
  }
  if (summary.modified > 0) {
    parts.push(chalk.yellow(`${String(summary.modified)} modified`));
  }
  if (summary.unchanged > 0) {
    parts.push(chalk.dim(`${String(summary.unchanged)} unchanged`));
  }
  return parts;
}

function printQuestionDiffs(questions: QuestionDiff[]): void {
  const changed = questions.filter((q) => q.action !== 'unchanged');
  if (changed.length === 0) {
    return;
  }

  console.log();
  console.log('Questions:');
  for (const q of changed) {
    const symbol = actionSymbol(q.action);
    console.log(`  ${symbol} [${q.questionId}] ${actionLabel(q.action)}`);
    if (q.changes.length > 0) {
      console.log(`    ${chalk.dim(`Changed: ${q.changes.join(', ')}`)}`);
    }
  }
}

function printIntegrationDiffs(integrations: IntegrationDiff[]): void {
  const changed = integrations.filter((i) => i.action !== 'unchanged');
  if (changed.length === 0) {
    return;
  }

  console.log();
  console.log('Integrations:');
  for (const i of changed) {
    const symbol = actionSymbol(i.action);
    console.log(`  ${symbol} [${i.integrationType}] ${actionLabel(i.action)}`);
    if (i.changes.length > 0) {
      console.log(`    ${chalk.dim(`Changed: ${i.changes.join(', ')}`)}`);
    }
  }
}

function formatMarkdown(result: DiffResult, title: string): void {
  const summary = diffEngine.getSummary(result);

  console.log(`## Form Diff: ${title}`);
  console.log();
  console.log('| Change | Item | Details |');
  console.log('|--------|------|---------|');

  if (result.title) {
    console.log(`| Modified | Title | "${result.title.remote}" → "${result.title.local}" |`);
  }

  for (const q of result.questions) {
    if (q.action !== 'unchanged') {
      const details = q.changes.length > 0 ? q.changes.join(', ') : '-';
      console.log(`| ${actionLabel(q.action)} | ${q.questionId} | ${details} |`);
    }
  }

  for (const i of result.integrations) {
    if (i.action !== 'unchanged') {
      const details = i.changes.length > 0 ? i.changes.join(', ') : '-';
      console.log(`| ${actionLabel(i.action)} | ${i.integrationType} | ${details} |`);
    }
  }

  console.log();
  console.log(
    `**Summary:** ${String(summary.added)} added, ` +
      `${String(summary.removed)} removed, ` +
      `${String(summary.modified)} modified`
  );
}

function formatJson(result: DiffResult): void {
  const summary = diffEngine.getSummary(result);
  console.log(JSON.stringify({ ...result, summary }, null, 2));
}

function actionSymbol(action: string): string {
  const symbols: Record<string, string> = {
    add: chalk.green('+'),
    remove: chalk.red('-'),
    modify: chalk.yellow('~'),
    unchanged: chalk.dim('='),
  };
  return symbols[action] ?? ' ';
}

function actionLabel(action: string): string {
  const labels: Record<string, string> = {
    add: 'Added',
    remove: 'Removed',
    modify: 'Modified',
    unchanged: 'Unchanged',
  };
  return labels[action] ?? action;
}

const VALID_FORMATS: OutputFormat[] = ['console', 'markdown', 'json'];

function validateFormat(format: string): OutputFormat {
  if (!VALID_FORMATS.includes(format as OutputFormat)) {
    throw new Error(`Invalid format '${format}'. Valid formats: ${VALID_FORMATS.join(', ')}`);
  }
  return format as OutputFormat;
}
