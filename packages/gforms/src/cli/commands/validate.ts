/**
 * gforms validate command
 * Validate form definitions
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { validateFormDefinition } from '../../schema/index.js';
import {
  assertFileExists,
  assertSafePath,
  commandAction,
  parseJsonContent,
} from '../utils/load-form.js';

export function createValidateCommand(): Command {
  const validate = new Command('validate')
    .description('Validate a form definition without deploying')
    .argument('<file>', 'Path to form definition file')
    .option('--strict', 'Treat warnings as errors')
    .action(
      commandAction(async (file: string, options: { strict: boolean }) => {
        await runValidate(file, options.strict);
      })
    );

  return validate;
}

async function runValidate(file: string, strict: boolean): Promise<void> {
  const filePath = path.resolve(file);
  assertSafePath(filePath, file);
  await assertFileExists(filePath, file);

  if (filePath.endsWith('.ts')) {
    handleTypeScriptFile(file);
    return;
  }

  await validateJsonFile(filePath, file, strict);
}

function handleTypeScriptFile(file: string): void {
  console.log(chalk.yellow('Note: TypeScript file loading requires compilation.'));
  console.log('For validation, export your form as JSON or use the programmatic API.');
  console.log();
  console.log(chalk.green('✓'), `${file} syntax appears valid`);
  console.log();
  console.log('For full validation, use the programmatic API or export as JSON.');
}

async function validateJsonFile(filePath: string, file: string, strict: boolean): Promise<void> {
  const content = await fs.readFile(filePath, 'utf-8');
  const formData = parseJsonContent(content, file);
  const result = validateFormDefinition(formData);

  if (!result.success || !result.data) {
    printErrors(file, result.errors ?? []);
    process.exit(1);
    return;
  }

  const warnings = strict ? getStrictWarnings(result.data) : [];

  if (warnings.length > 0) {
    printStrictWarnings(file, warnings);
    process.exit(1);
    return;
  }

  printValidResult(file, result.data);
}

interface StrictWarning {
  path: string;
  message: string;
}

interface StrictCheckQuestion {
  description?: string | undefined;
  id?: string | undefined;
  title?: string | undefined;
}

interface StrictCheckData {
  title: string;
  description?: string | undefined;
  questions: StrictCheckQuestion[];
  integrations?: unknown[] | undefined;
  settings?: unknown;
}

function getStrictWarnings(data: StrictCheckData): StrictWarning[] {
  const warnings: StrictWarning[] = [];

  if (data.description === undefined) {
    warnings.push({ path: 'description', message: 'Form is missing a description' });
  }

  for (let i = 0; i < data.questions.length; i++) {
    const q = data.questions[i];
    if (q && q.description === undefined) {
      const id = q.id ?? String(i);
      warnings.push({
        path: `questions[${String(i)}]`,
        message: `Question '${id}' is missing a description`,
      });
    }
  }

  if (!data.settings) {
    warnings.push({ path: 'settings', message: 'Form has no settings defined' });
  }

  return warnings;
}

function printStrictWarnings(file: string, warnings: StrictWarning[]): void {
  console.log(chalk.red('✗'), `${file} has strict mode warnings`);
  console.log();

  for (const warning of warnings) {
    console.log(chalk.yellow('  Warning at'), chalk.yellow(warning.path) + ':');
    console.log('    ' + warning.message);
  }

  console.log();
  console.log(`${String(warnings.length)} warning(s) treated as errors (--strict)`);
}

function printValidResult(
  file: string,
  data: { title: string; questions: unknown[]; integrations?: unknown[] | undefined }
): void {
  console.log(chalk.green('✓'), `${file} is valid`);
  console.log();
  console.log('  Title:', chalk.cyan(data.title));
  console.log('  Questions:', chalk.cyan(String(data.questions.length)));
  if (data.integrations !== undefined) {
    console.log('  Integrations:', chalk.cyan(String(data.integrations.length)));
  }
}

function printErrors(file: string, errors: { path: (string | number)[]; message: string }[]): void {
  console.log(chalk.red('✗'), `${file} has errors`);
  console.log();

  for (const error of errors) {
    const pathStr = error.path.join('.');
    console.log(chalk.red('  Error at'), chalk.yellow(pathStr) + ':');
    console.log('    ' + error.message);
  }

  console.log();
  console.log(`${String(errors.length)} error(s) found`);
}
