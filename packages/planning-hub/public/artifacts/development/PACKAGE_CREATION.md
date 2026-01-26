# Creating New Packages

When adding new packages to the monorepo, follow this guide to ensure quality gate compliance.

## Quick Start

1. **Create package directory**:

   ```bash
   mkdir -p packages/your-package/src
   ```

2. **Create `package.json`**:

   ```json
   {
     "name": "your-package",
     "version": "0.1.0",
     "private": true,
     "type": "module",
     "scripts": {
       "typecheck": "tsc --noEmit",
       "lint": "eslint . --max-warnings=0",
       "test": "vitest",
       "test:coverage": "vitest run --coverage"
     },
     "dependencies": {},
     "devDependencies": {}
   }
   ```

3. **Create `tsconfig.json`**:

   ```json
   {
     "extends": "../../tsconfig.base.json",
     "compilerOptions": {
       "outDir": "dist"
     },
     "include": ["src"]
   }
   ```

4. **Create `vitest.config.ts`**:

   ```typescript
   import { defineConfig } from 'vitest/config';

   export default defineConfig({
     test: {
       globals: false,
       coverage: {
         provider: 'v8',
         reporter: ['text', 'html'],
         include: ['src/**/*.ts'],
         thresholds: {
           lines: 95,
           functions: 95,
           statements: 95,
           branches: 90,
           perFile: true,
         },
       },
     },
   });
   ```

5. **Validate setup**:

   ```bash
   pnpm run validate:packages
   ```

6. **Run quality checks**:
   ```bash
   cd packages/your-package
   pnpm run typecheck
   pnpm run lint
   pnpm run test:coverage
   ```

## Checklist

- [ ] Package directory created in `packages/`
- [ ] `package.json` with quality scripts
- [ ] `tsconfig.json` extends `../../tsconfig.base.json`
- [ ] `vitest.config.ts` with 95%/90% thresholds
- [ ] `src/index.ts` entry point exists
- [ ] Tests written (if applicable)
- [ ] `pnpm run validate:packages` passes
- [ ] `pnpm run check` passes

## For LLM Agents

When creating new packages:

1. Follow this exact structure
2. Always extend root tsconfig.base.json
3. Always include quality scripts in package.json
4. Always set coverage thresholds to 95%/90%
5. Run `pnpm run validate:packages` after creation
