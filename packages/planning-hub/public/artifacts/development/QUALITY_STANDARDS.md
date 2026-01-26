# TypeScript Quality Standards

This document defines the enforced quality standards for all TypeScript code in iac-google-forms.

## TypeScript Configuration

### Strict Flags (12 enabled)

All packages extend `tsconfig.base.json` with these strict settings:

1. `strict: true` (enables all basic strict checks)
2. `noUncheckedIndexedAccess: true` - Array access returns `T | undefined`
3. `exactOptionalPropertyTypes: true` - Optional props can't be explicitly `undefined`
4. `noImplicitOverride: true` - Requires `override` keyword
5. `noPropertyAccessFromIndexSignature: true` - Forces bracket notation for index signatures
6. `useUnknownInCatchVariables: true` - Catch uses `unknown`, not `any`
7. `noFallthroughCasesInSwitch: true` - All switch cases must break/return
8. `noImplicitReturns: true` - All code paths must return
9. `noUnusedLocals: true` - No unused variables
10. `noUnusedParameters: true` - No unused function params
11. `forceConsistentCasingInFileNames: true` - Case-sensitive imports
12. `verbatimModuleSyntax: true` - Explicit type imports

## ESLint Rules

### Complexity Limits

| Rule                     | Limit   | Purpose                                |
| ------------------------ | ------- | -------------------------------------- |
| `complexity`             | **10**  | Max cyclomatic complexity per function |
| `max-depth`              | **3**   | Max nesting depth                      |
| `max-nested-callbacks`   | **3**   | Max callback nesting                   |
| `max-params`             | **4**   | Max function parameters                |
| `max-lines`              | **300** | Max lines per file                     |
| `max-lines-per-function` | **50**  | Max lines per function                 |
| `max-statements`         | **25**  | Max statements per function            |

### Anti-Patterns Blocked

- `no-else-return` - Use guard clauses instead of nested if/else
- `no-lonely-if` - Merge nested ifs when possible
- `no-nested-ternary` - No nested ternary operators
- `no-explicit-any` - Never use `any` type
- `no-non-null-assertion` - Don't use `!` operator
- `unused-imports` - Auto-remove unused imports

### Coupling Limits

- `import/max-dependencies` - **10 imports max** per file
- `import/no-duplicates` - No duplicate imports
- Circular dependencies - **ERROR** (enforced by dependency-cruiser)

## Test Coverage Thresholds

Per-file enforcement (every file must meet thresholds):

- **Lines**: 95%
- **Functions**: 95%
- **Statements**: 95%
- **Branches**: 90%

## Dead Code Detection

- Unused exports - **ERROR** (via Knip)
- Unused dependencies - **WARNING**
- Orphan files - **WARNING**

## How to Write Compliant Code

### Keep Functions Small

**Bad** (too long, too complex):

```typescript
function processUser(user: User) {
  if (user.active) {
    if (user.role === 'admin') {
      if (user.permissions.includes('write')) {
        // 40 more lines...
      } else {
        // ...
      }
    } else {
      // ...
    }
  }
}
```

**Good** (guard clauses, small functions):

```typescript
function processUser(user: User): void {
  if (!user.active) return;
  if (!canWrite(user)) return;

  performAction(user);
}

function canWrite(user: User): boolean {
  return user.role === 'admin' && user.permissions.includes('write');
}
```

### Use Strict Types

**Bad**:

```typescript
function getData(id: any): any {
  const data = cache[id];
  return data;
}
```

**Good**:

```typescript
function getData(id: string): User | undefined {
  const data = cache[id];
  return data;
}
```

### Avoid Deep Nesting

**Bad** (depth 4):

```typescript
if (a) {
  if (b) {
    if (c) {
      if (d) {
        // ERROR: max depth 3
      }
    }
  }
}
```

**Good** (guard clauses):

```typescript
if (!a) return;
if (!b) return;
if (!c) return;
if (!d) return;
// depth 1
```

## Exemptions

Test files have relaxed limits:

- `max-lines-per-function`: 120 (vs 50)
- `max-statements`: 60 (vs 25)
- `no-explicit-any`: off
- `no-console`: off

No other exemptions are allowed without code review justification.
