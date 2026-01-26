/**
 * gforms auth commands
 * Handle authentication with Google APIs
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { getTokenStore, getAuthManager, commandAction } from '../utils/load-form.js';

export function createAuthCommand(): Command {
  const auth = new Command('auth').description('Manage authentication');

  // gforms auth login
  auth
    .command('login')
    .description('Authenticate with Google using OAuth 2.0')
    .option('--no-browser', 'Print URL instead of opening browser')
    .option('--force', 'Re-authenticate even if already logged in')
    .action(commandAction(async (options: { browser: boolean; force: boolean }) => {
      await runLogin(options);
    }));

  // gforms auth logout
  auth
    .command('logout')
    .description('Remove stored credentials')
    .action(commandAction(async () => {
      await runLogout();
    }));

  // gforms auth status
  auth
    .command('status')
    .description('Show current authentication status')
    .action(commandAction(async () => {
      await runStatus();
    }));

  return auth;
}

async function runLogin(options: { browser: boolean; force: boolean }): Promise<void> {
  void options; // Unused for now
  const authManager = getAuthManager();

  // Check if already authenticated
  const status = await authManager.getStatus();
  if (status.isAuthenticated && status.method === 'oauth') {
    console.log(chalk.yellow('Already authenticated.'));
    console.log('Use --force to re-authenticate.');
    return;
  }

  // Note: Full OAuth flow requires setting up a local server and handling redirects
  // This is a placeholder showing where the flow would start
  console.log(chalk.yellow('OAuth login not fully implemented yet.'));
  console.log();
  console.log('To authenticate:');
  console.log('1. Set up a Google Cloud project with OAuth credentials');
  console.log('2. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables');
  console.log('3. Or use a service account by setting GOOGLE_APPLICATION_CREDENTIALS');
}

async function runLogout(): Promise<void> {
  const tokenStore = getTokenStore();

  if (!(await tokenStore.exists())) {
    console.log(chalk.yellow('Not logged in.'));
    return;
  }

  await tokenStore.clear();
  console.log(chalk.green('✓'), 'Credentials removed');
}

async function runStatus(): Promise<void> {
  const authManager = getAuthManager();
  const status = await authManager.getStatus();

  console.log(chalk.bold('Authentication Status'));
  console.log('─'.repeat(30));

  if (!status.isAuthenticated && status.method === null) {
    console.log(chalk.yellow('Not authenticated.'));
    console.log();
    console.log("Run 'gforms auth login' to authenticate.");
    return;
  }

  if (status.method === 'oauth') {
    console.log('Method:', chalk.cyan('OAuth 2.0'));
    if (status.expiresAt) {
      const expires = new Date(status.expiresAt);
      const now = new Date();
      const diff = expires.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      console.log('Expires:', chalk.cyan(expires.toLocaleString()), `(in ${String(hours)}h ${String(minutes)}m)`);
    }
    if (status.scopes) {
      console.log('Scopes:', chalk.cyan(status.scopes.join(', ')));
    }
  } else if (status.method === 'service-account') {
    console.log('Method:', chalk.cyan('Service Account'));
    console.log('Key File:', chalk.cyan(process.env['GOOGLE_APPLICATION_CREDENTIALS'] ?? 'Unknown'));
  }
}
