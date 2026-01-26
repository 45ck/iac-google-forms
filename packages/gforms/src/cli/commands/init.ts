/**
 * gforms init command
 * Initialize a new gforms project
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { commandAction } from '../utils/load-form.js';

export function createInitCommand(): Command {
  const init = new Command('init')
    .description('Initialize a new gforms project')
    .option('--force', 'Overwrite existing files')
    .action(
      commandAction(async (options: { force: boolean }) => {
        await runInit(options.force);
      })
    );

  return init;
}

async function runInit(force: boolean): Promise<void> {
  const cwd = process.cwd();
  const gformsDir = path.join(cwd, '.gforms');

  await checkExisting(gformsDir, force);
  await createDirectories(cwd, gformsDir);
  await createStateFile(gformsDir);
  await createConfigFile(cwd);
  await createExampleForm(cwd);
  await updateGitignore(cwd);
  printNextSteps();
}

async function checkExisting(gformsDir: string, force: boolean): Promise<void> {
  const exists = await fs
    .access(gformsDir)
    .then(() => true)
    .catch(() => false);
  if (exists && !force) {
    throw new Error('Project already initialized. Use --force to reinitialize.');
  }
}

async function createDirectories(cwd: string, gformsDir: string): Promise<void> {
  const formsDir = path.join(cwd, 'forms');
  await fs.mkdir(gformsDir, { recursive: true });
  await fs.mkdir(formsDir, { recursive: true });
}

async function createStateFile(gformsDir: string): Promise<void> {
  const stateFile = { version: '1.0.0', forms: {} };
  await fs.writeFile(path.join(gformsDir, 'state.json'), JSON.stringify(stateFile, null, 2));
  console.log(chalk.green('✓'), 'Created .gforms/state.json');
}

async function createConfigFile(cwd: string): Promise<void> {
  const configContent = `import { defineConfig } from 'iac-google-forms';

export default defineConfig({
  defaults: {
    settings: {
      collectEmail: false,
      limitOneResponse: false,
    },
  },
  oauth: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  stateDir: '.gforms',
});
`;
  await fs.writeFile(path.join(cwd, 'gforms.config.ts'), configContent);
  console.log(chalk.green('✓'), 'Created gforms.config.ts');
}

async function createExampleForm(cwd: string): Promise<void> {
  const formsDir = path.join(cwd, 'forms');
  const exampleForm = `import { defineForm } from 'iac-google-forms';

export default defineForm({
  title: 'Customer Feedback',
  description: 'Help us improve by sharing your feedback',
  questions: [
    { id: 'name', type: 'text', title: 'Your name', required: true },
    { id: 'email', type: 'email', title: 'Your email', required: true },
    { id: 'satisfaction', type: 'scale', title: 'How satisfied are you?', min: 1, max: 5, minLabel: 'Very Dissatisfied', maxLabel: 'Very Satisfied', required: true },
    { id: 'feedback', type: 'text', title: 'Any additional feedback?', paragraph: true },
  ],
  integrations: [{ type: 'sheets', spreadsheetName: 'Customer Feedback Responses' }],
});
`;
  await fs.writeFile(path.join(formsDir, 'example.ts'), exampleForm);
  console.log(chalk.green('✓'), 'Created forms/example.ts');
}

async function updateGitignore(cwd: string): Promise<void> {
  const gitignoreContent = `# gforms\n.gforms/credentials.json\n`;
  const gitignorePath = path.join(cwd, '.gitignore');
  const exists = await fs
    .access(gitignorePath)
    .then(() => true)
    .catch(() => false);

  if (exists) {
    const existing = await fs.readFile(gitignorePath, 'utf-8');
    if (existing.includes('.gforms/credentials.json')) {
      return;
    }
    await fs.appendFile(gitignorePath, `\n${gitignoreContent}`);
    console.log(chalk.green('✓'), 'Updated .gitignore');
  } else {
    await fs.writeFile(gitignorePath, gitignoreContent);
    console.log(chalk.green('✓'), 'Created .gitignore');
  }
}

function printNextSteps(): void {
  console.log();
  console.log(chalk.bold('Project initialized!'), 'Next steps:');
  console.log('  1. Run', chalk.cyan("'gforms auth login'"), 'to authenticate');
  console.log('  2. Edit', chalk.cyan('forms/example.ts'), 'to define your form');
  console.log('  3. Run', chalk.cyan("'gforms deploy forms/example.ts'"), 'to deploy');
}
