#!/usr/bin/env node

import chokidar from 'chokidar';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_DIR = path.resolve(__dirname, '../../../docs');
const PUBLIC_ARTIFACTS = path.resolve(__dirname, '../public/artifacts');

async function syncArtifacts() {
  try {
    console.log('Syncing artifacts from docs/ to public/artifacts/...');
    await fs.ensureDir(PUBLIC_ARTIFACTS);
    await fs.copy(DOCS_DIR, PUBLIC_ARTIFACTS, {
      overwrite: true,
      errorOnExist: false,
    });
    console.log('✓ Artifacts synced successfully');
  } catch (error) {
    console.error('✗ Error syncing artifacts:', error);
    process.exit(1);
  }
}

// Check for --watch flag
const isWatchMode = process.argv.includes('--watch');

if (isWatchMode) {
  console.log('Watching docs directory for changes...');

  // Initial sync
  await syncArtifacts();

  // Watch for changes
  const watcher = chokidar.watch(DOCS_DIR, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true,
  });

  watcher
    .on('add', (filepath) => {
      console.log(`File added: ${path.relative(DOCS_DIR, filepath)}`);
      syncArtifacts();
    })
    .on('change', (filepath) => {
      console.log(`File changed: ${path.relative(DOCS_DIR, filepath)}`);
      syncArtifacts();
    })
    .on('unlink', (filepath) => {
      console.log(`File removed: ${path.relative(DOCS_DIR, filepath)}`);
      syncArtifacts();
    });

  console.log('Press Ctrl+C to stop watching');
} else {
  // One-time sync
  await syncArtifacts();
}
