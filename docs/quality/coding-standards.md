# Coding Standards

## Overview

This document defines coding standards for iac-google-forms to ensure consistency, maintainability, and quality.

## TypeScript Configuration

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

## ESLint Configuration

```javascript
// eslint.config.mjs
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    rules: {
      // Complexity
      'complexity': ['error', 10],
      'max-depth': ['error', 4],
      'max-lines-per-function': ['error', 50],
      'max-params': ['error', 4],

      // TypeScript specific
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',

      // Import order
      'import/order': ['error', {
        'groups': ['builtin', 'external', 'internal', 'parent', 'sibling'],
        'newlines-between': 'always',
        'alphabetize': { order: 'asc' }
      }],
    },
  }
);
```

## Code Style

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Variables | camelCase | `formState`, `authClient` |
| Constants | SCREAMING_SNAKE | `MAX_RETRIES`, `API_BASE_URL` |
| Functions | camelCase | `calculateDiff()`, `loadForm()` |
| Classes | PascalCase | `DiffEngine`, `StateManager` |
| Interfaces | PascalCase | `FormDefinition`, `AuthClient` |
| Types | PascalCase | `Question`, `DiffResult` |
| Enums | PascalCase | `DiffAction`, `QuestionType` |
| Enum values | PascalCase | `DiffAction.Add`, `DiffAction.Remove` |
| Files | kebab-case | `diff-engine.ts`, `state-manager.ts` |
| Test files | *.test.ts | `diff-engine.test.ts` |

### File Organization

```
src/
├── index.ts              # Public exports
├── types/                # Type definitions
│   ├── index.ts
│   ├── form.ts
│   └── auth.ts
├── config/               # Configuration loading
│   ├── index.ts
│   ├── loader.ts
│   ├── validator.ts
│   └── loader.test.ts
├── auth/                 # Authentication
│   ├── index.ts
│   ├── manager.ts
│   ├── oauth.ts
│   └── service-account.ts
├── api/                  # Google API clients
│   ├── index.ts
│   ├── forms-client.ts
│   └── sheets-client.ts
├── diff/                 # Diff engine
│   ├── index.ts
│   ├── engine.ts
│   └── formatter.ts
├── state/                # State management
│   ├── index.ts
│   └── manager.ts
├── cli/                  # CLI commands
│   ├── index.ts
│   ├── commands/
│   │   ├── init.ts
│   │   ├── auth.ts
│   │   ├── deploy.ts
│   │   └── diff.ts
│   └── utils/
│       ├── output.ts
│       └── prompts.ts
└── utils/                # Shared utilities
    ├── hash.ts
    └── retry.ts
```

### Function Guidelines

```typescript
// Good: Single responsibility, clear name, typed
function calculateContentHash(definition: FormDefinition): string {
  const normalized = JSON.stringify(definition, Object.keys(definition).sort());
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

// Good: Early returns for guard clauses
async function getFormState(path: string): Promise<FormState | null> {
  const state = await this.load();

  if (!state.forms[path]) {
    return null;
  }

  return state.forms[path];
}

// Good: Destructured parameters with defaults
function formatDiff(
  diff: DiffResult,
  { color = true, verbose = false }: FormatOptions = {}
): string {
  // ...
}
```

### Error Handling

```typescript
// Define specific error classes
class GFormsError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'GFormsError';
  }
}

class AuthError extends GFormsError {
  constructor(message: string, cause?: Error) {
    super(message, 'AUTH_ERROR', cause);
    this.name = 'AuthError';
  }
}

class ValidationError extends GFormsError {
  constructor(
    message: string,
    public readonly errors: ValidationErrorDetail[]
  ) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

// Use specific errors
async function loadFormDefinition(path: string): Promise<FormDefinition> {
  let content: string;

  try {
    content = await readFile(path, 'utf-8');
  } catch (error) {
    throw new GFormsError(
      `Failed to read file: ${path}`,
      'FILE_READ_ERROR',
      error as Error
    );
  }

  const result = validateDefinition(content);

  if (!result.valid) {
    throw new ValidationError(
      `Invalid form definition in ${path}`,
      result.errors
    );
  }

  return result.data;
}
```

### Async/Await

```typescript
// Good: Parallel when independent
async function loadProject(): Promise<ProjectData> {
  const [config, state] = await Promise.all([
    loadConfig(),
    loadState(),
  ]);

  return { config, state };
}

// Good: Sequential when dependent
async function deployForm(path: string): Promise<DeployResult> {
  const definition = await loadFormDefinition(path);
  const validated = await validateDefinition(definition);
  const result = await uploadToGoogle(validated);
  await saveState(path, result);
  return result;
}

// Good: Error handling with try-catch
async function safeLoad<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}
```

### Comments

```typescript
// Good: Explain WHY, not WHAT
// Google Forms API requires questions to be added via batchUpdate
// after initial form creation. A single POST cannot include questions.
await client.batchUpdate(formId, questionRequests);

// Good: Document edge cases
// Note: Empty strings are valid for optional fields but null is not.
// The API will reject null values with a 400 error.
const description = form.description ?? '';

// Good: JSDoc for public APIs
/**
 * Calculates the difference between local and remote form definitions.
 *
 * @param local - The local form definition from the TypeScript file
 * @param remote - The remote form fetched from Google Forms API, or null if new
 * @returns A DiffResult containing all detected changes
 *
 * @example
 * const diff = engine.calculateDiff(localForm, remoteForm);
 * if (diff.hasChanges) {
 *   console.log('Changes detected:', diff.questions.length);
 * }
 */
function calculateDiff(local: FormDefinition, remote: RemoteForm | null): DiffResult {
  // ...
}
```

## Testing Standards

### Test Structure

```typescript
describe('ComponentName', () => {
  // Setup/teardown at describe level
  let instance: ComponentName;

  beforeEach(() => {
    instance = new ComponentName();
  });

  describe('methodName', () => {
    it('should do X when Y', () => {
      // Arrange
      const input = createTestInput();

      // Act
      const result = instance.methodName(input);

      // Assert
      expect(result).toBe(expected);
    });

    it('should throw when invalid input', () => {
      expect(() => instance.methodName(null)).toThrow(ValidationError);
    });
  });
});
```

### Test Naming

```typescript
// Pattern: should [expected behavior] when [condition]
it('should return null when form not found', () => {});
it('should throw AuthError when token expired', () => {});
it('should create new spreadsheet when createIfMissing is true', () => {});
```

## Git Commit Standards

### Commit Message Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, missing semicolons |
| `refactor` | Code change that neither fixes nor adds |
| `perf` | Performance improvement |
| `test` | Adding tests |
| `chore` | Maintenance tasks |

### Examples

```
feat(cli): add --dry-run flag to deploy command

Allows users to preview changes without applying them.
Useful for CI pipelines to check for drift.

Closes #42
```

```
fix(auth): handle expired refresh tokens gracefully

Previously, an expired refresh token would cause a cryptic
API error. Now shows a clear message asking user to re-login.
```

## Dependencies

### Adding Dependencies

1. Prefer built-in Node.js APIs when possible
2. Check bundle size impact (`pnpm why <package>`)
3. Check maintenance status (last update, open issues)
4. Check for security vulnerabilities (`pnpm audit`)
5. Pin exact versions in `package.json`

### Approved Dependencies

| Category | Package | Purpose |
|----------|---------|---------|
| CLI | `commander` | Command parsing |
| Validation | `zod` | Schema validation |
| HTTP | `undici` | Fetch implementation |
| Testing | `vitest` | Test framework |
| Testing | `msw` | API mocking |

## Performance Guidelines

1. **Lazy loading**: Don't load Google API clients until needed
2. **Caching**: Cache auth tokens, don't re-validate unchanged files
3. **Parallel I/O**: Use `Promise.all()` for independent operations
4. **Streaming**: Stream large files instead of loading into memory
5. **Early exit**: Return early when no changes detected
