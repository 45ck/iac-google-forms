# Contributing to iac-google-forms

## Quality Standards

This project enforces **strict TypeScript quality gates** to ensure maintainable, high-quality code.

### Quality Gates Enforced

1. **TypeScript Strictness**: 12 strict compiler flags enabled
2. **Cyclomatic Complexity**: ≤10 per function
3. **Nesting Depth**: ≤3 levels
4. **Function Size**: ≤50 lines
5. **File Size**: ≤300 lines
6. **Test Coverage**: 95% lines/functions/statements, 90% branches (per file)
7. **No Circular Dependencies**: Enforced via dependency-cruiser
8. **No Dead Code**: Enforced via knip

### Development Workflow

1. **Install dependencies**:

   ```bash
   pnpm install
   ```

2. **Start development**:

   ```bash
   pnpm dev:storybook
   ```

3. **Run quality checks** (before committing):

   ```bash
   pnpm run check
   ```

   This runs:
   - Format check (Prettier)
   - Lint (ESLint with complexity limits)
   - Type check (TypeScript strict mode)
   - Tests with coverage (95%/90% thresholds)
   - Dependency analysis (circular deps, orphans)
   - Dead code detection (Knip)

4. **Fix issues automatically** (when possible):
   ```bash
   pnpm run format:write  # Auto-format
   pnpm run lint:fix      # Auto-fix lint issues
   ```

### Git Hooks

- **Pre-commit**: Runs lint-staged (format + lint on staged files only)
- **Pre-push**: Runs full quality gate suite across all packages

### Creating New Packages

See [PACKAGE_CREATION.md](docs/development/PACKAGE_CREATION.md) for detailed guide.

**Quick checklist**:

- [ ] Create `tsconfig.json` extending `../../tsconfig.base.json`
- [ ] Create `vitest.config.ts` with coverage thresholds
- [ ] Add quality scripts to `package.json`: typecheck, lint, test, test:coverage
- [ ] Run `pnpm run validate:packages` to verify setup

### For LLM Agents

**When working on this codebase**:

1. Read `docs/development/QUALITY_STANDARDS.md` for TypeScript rules
2. Ensure all new code passes `pnpm run check`
3. Keep functions small (≤50 lines), complexity low (≤10)
4. Write tests with 95%+ coverage
5. Never use `any` type or disable strict checks without justification
6. New packages MUST follow the pattern in `docs/development/PACKAGE_CREATION.md`

### CI/CD

GitHub Actions runs quality gates on:

- All pull requests
- Pushes to main branch

PRs cannot merge unless all quality gates pass.
