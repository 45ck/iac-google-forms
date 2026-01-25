#!/usr/bin/env node

import fs from 'fs-extra';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function validatePackages() {
  const packagePaths = await glob('packages/*/package.json', { cwd: rootDir });

  let hasErrors = false;

  for (const pkgPath of packagePaths) {
    const fullPath = path.join(rootDir, pkgPath);
    const pkgDir = path.dirname(fullPath);
    const pkgName = path.basename(pkgDir);

    console.log(`\nValidating ${pkgName}...`);

    const pkg = await fs.readJson(fullPath);

    // Check required scripts
    const requiredScripts = ['typecheck', 'lint', 'test', 'test:coverage'];
    for (const script of requiredScripts) {
      if (!pkg.scripts || !pkg.scripts[script]) {
        console.error(`  ✗ Missing script: ${script}`);
        hasErrors = true;
      } else {
        console.log(`  ✓ Script exists: ${script}`);
      }
    }

    // Check tsconfig.json exists and extends base
    const tsconfigPath = path.join(pkgDir, 'tsconfig.json');
    if (!(await fs.pathExists(tsconfigPath))) {
      console.error(`  ✗ Missing tsconfig.json`);
      hasErrors = true;
    } else {
      const tsconfig = await fs.readJson(tsconfigPath);
      if (!tsconfig.extends || !tsconfig.extends.includes('tsconfig.base.json')) {
        console.error(`  ✗ tsconfig.json must extend ../../tsconfig.base.json`);
        hasErrors = true;
      } else {
        console.log(`  ✓ tsconfig.json extends base`);
      }
    }

    // Check vitest.config.ts exists
    const vitestConfigPath = path.join(pkgDir, 'vitest.config.ts');
    if (!(await fs.pathExists(vitestConfigPath))) {
      console.error(`  ✗ Missing vitest.config.ts`);
      hasErrors = true;
    } else {
      console.log(`  ✓ vitest.config.ts exists`);
    }
  }

  if (hasErrors) {
    console.error('\n✗ Package validation failed');
    console.error('See docs/development/PACKAGE_CREATION.md for guidance');
    process.exit(1);
  } else {
    console.log('\n✓ All packages validated successfully');
  }
}

validatePackages();
