# Test Strategy

## Overview

This document defines the testing approach for iac-google-forms, covering unit tests, integration tests, and end-to-end tests.

## Test Pyramid

```
                    ┌───────────┐
                    │   E2E     │  Few, slow, high confidence
                    │  Tests    │
                   ─┴───────────┴─
                  ┌───────────────┐
                  │  Integration  │  Some, medium speed
                  │    Tests      │
                 ─┴───────────────┴─
                ┌───────────────────┐
                │    Unit Tests     │  Many, fast, isolated
                └───────────────────┘
```

| Level | Count | Speed | Scope |
|-------|-------|-------|-------|
| Unit | ~200 | <1ms each | Single function/class |
| Integration | ~50 | <100ms each | Module boundaries |
| E2E | ~20 | <30s each | Full CLI workflows |

## Testing Framework

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      thresholds: {
        statements: 95,
        branches: 90,
        functions: 95,
        lines: 95,
      },
      exclude: [
        'node_modules',
        'dist',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/test-utils/**',
      ],
    },
  },
});
```

## Unit Tests

### What to Unit Test

| Component | Test Focus |
|-----------|------------|
| ConfigLoader | Parsing, validation, error messages |
| DiffEngine | Diff calculation for all change types |
| StateManager | Read/write, serialization |
| AuthManager | Token handling, expiry logic |
| Formatters | Output formatting, colors |

### Example: DiffEngine

```typescript
// src/diff/diff-engine.test.ts
import { describe, it, expect } from 'vitest';
import { DiffEngine } from './diff-engine';

describe('DiffEngine', () => {
  const engine = new DiffEngine();

  describe('calculateDiff', () => {
    it('should detect new form', () => {
      const local = { title: 'New Form', questions: [] };
      const remote = null;

      const diff = engine.calculateDiff(local, remote);

      expect(diff.status).toBe('new');
      expect(diff.hasChanges).toBe(true);
    });

    it('should detect no changes', () => {
      const local = { title: 'Form', questions: [{ id: 'q1', type: 'text', title: 'Q1' }] };
      const remote = { title: 'Form', questions: [{ questionId: 'q1', title: 'Q1' }] };

      const diff = engine.calculateDiff(local, remote);

      expect(diff.status).toBe('unchanged');
      expect(diff.hasChanges).toBe(false);
    });

    it('should detect added question', () => {
      const local = {
        title: 'Form',
        questions: [
          { id: 'q1', type: 'text', title: 'Q1' },
          { id: 'q2', type: 'text', title: 'Q2' },
        ],
      };
      const remote = {
        title: 'Form',
        questions: [{ questionId: 'q1', title: 'Q1' }],
      };

      const diff = engine.calculateDiff(local, remote);

      expect(diff.questions).toHaveLength(1);
      expect(diff.questions[0].action).toBe('add');
      expect(diff.questions[0].questionId).toBe('q2');
    });

    it('should detect removed question', () => {
      const local = {
        title: 'Form',
        questions: [{ id: 'q1', type: 'text', title: 'Q1' }],
      };
      const remote = {
        title: 'Form',
        questions: [
          { questionId: 'q1', title: 'Q1' },
          { questionId: 'q2', title: 'Q2' },
        ],
      };

      const diff = engine.calculateDiff(local, remote);

      expect(diff.questions).toContainEqual(
        expect.objectContaining({ action: 'remove', questionId: 'q2' })
      );
    });

    it('should detect modified question', () => {
      const local = {
        title: 'Form',
        questions: [{ id: 'q1', type: 'text', title: 'Updated Title' }],
      };
      const remote = {
        title: 'Form',
        questions: [{ questionId: 'q1', title: 'Original Title' }],
      };

      const diff = engine.calculateDiff(local, remote);

      expect(diff.questions[0].action).toBe('modify');
      expect(diff.questions[0].changes).toContain('title');
    });
  });
});
```

### Example: Validation

```typescript
// src/config/validator.test.ts
import { describe, it, expect } from 'vitest';
import { validateDefinition } from './validator';

describe('validateDefinition', () => {
  it('should pass for valid form', () => {
    const form = {
      title: 'Valid Form',
      questions: [{ id: 'q1', type: 'text', title: 'Question 1' }],
    };

    const result = validateDefinition(form);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail when title is missing', () => {
    const form = {
      questions: [{ id: 'q1', type: 'text', title: 'Q1' }],
    };

    const result = validateDefinition(form);

    expect(result.valid).toBe(false);
    expect(result.errors[0].path).toBe('title');
    expect(result.errors[0].message).toContain('required');
  });

  it('should fail when questions is empty', () => {
    const form = { title: 'Form', questions: [] };

    const result = validateDefinition(form);

    expect(result.valid).toBe(false);
    expect(result.errors[0].path).toBe('questions');
  });

  it('should fail for invalid question id format', () => {
    const form = {
      title: 'Form',
      questions: [{ id: '123-invalid', type: 'text', title: 'Q' }],
    };

    const result = validateDefinition(form);

    expect(result.valid).toBe(false);
    expect(result.errors[0].path).toBe('questions[0].id');
  });

  it('should fail for duplicate question ids', () => {
    const form = {
      title: 'Form',
      questions: [
        { id: 'q1', type: 'text', title: 'Q1' },
        { id: 'q1', type: 'text', title: 'Q2' },
      ],
    };

    const result = validateDefinition(form);

    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('duplicate');
  });
});
```

## Integration Tests

### What to Integration Test

| Boundary | Test Focus |
|----------|------------|
| Config → State | Loading form, checking state |
| Auth → API | Token refresh, API calls |
| Diff → Deploy | Diff calculation to update generation |
| CLI → All | Command parsing to output |

### Example: State Integration

```typescript
// src/state/state-manager.integration.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StateManager } from './state-manager';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('StateManager Integration', () => {
  let tempDir: string;
  let stateManager: StateManager;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'gforms-test-'));
    stateManager = new StateManager(tempDir);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it('should create state file on first save', async () => {
    await stateManager.updateFormState('forms/test.ts', {
      localPath: 'forms/test.ts',
      formId: 'abc123',
    });
    await stateManager.save();

    const loaded = new StateManager(tempDir);
    await loaded.load();
    const state = await loaded.getFormState('forms/test.ts');

    expect(state?.formId).toBe('abc123');
  });

  it('should preserve existing state on update', async () => {
    // First save
    await stateManager.updateFormState('forms/a.ts', { localPath: 'forms/a.ts', formId: 'a' });
    await stateManager.save();

    // Second save
    const manager2 = new StateManager(tempDir);
    await manager2.load();
    await manager2.updateFormState('forms/b.ts', { localPath: 'forms/b.ts', formId: 'b' });
    await manager2.save();

    // Verify both exist
    const manager3 = new StateManager(tempDir);
    await manager3.load();
    expect(await manager3.getFormState('forms/a.ts')).toBeTruthy();
    expect(await manager3.getFormState('forms/b.ts')).toBeTruthy();
  });
});
```

### Example: API Mock Integration

```typescript
// src/api/forms-client.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { GoogleFormsClient } from './forms-client';
import { createMockAuthClient } from '../test-utils/mock-auth';

const server = setupServer(
  http.post('https://forms.googleapis.com/v1/forms', () => {
    return HttpResponse.json({
      formId: 'new-form-123',
      info: { title: 'Test Form' },
      revisionId: '00000001',
      responderUri: 'https://docs.google.com/forms/d/e/.../viewform',
    });
  }),

  http.get('https://forms.googleapis.com/v1/forms/:formId', ({ params }) => {
    return HttpResponse.json({
      formId: params.formId,
      info: { title: 'Existing Form' },
      items: [],
    });
  }),
);

beforeAll(() => server.listen());
afterAll(() => server.close());

describe('GoogleFormsClient Integration', () => {
  const client = new GoogleFormsClient(createMockAuthClient());

  it('should create a new form', async () => {
    const result = await client.createForm({
      title: 'Test Form',
      questions: [],
    });

    expect(result.formId).toBe('new-form-123');
    expect(result.formUrl).toContain('docs.google.com');
  });

  it('should fetch an existing form', async () => {
    const form = await client.getForm('existing-123');

    expect(form.formId).toBe('existing-123');
    expect(form.title).toBe('Existing Form');
  });
});
```

## End-to-End Tests

### What to E2E Test

| Workflow | Verification |
|----------|--------------|
| Init → Auth → Deploy | Full new user journey |
| Deploy → Diff → Deploy | Update workflow |
| Deploy → Destroy | Cleanup workflow |

### Example: E2E with Real CLI

```typescript
// tests/e2e/deploy.e2e.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('E2E: Deploy Workflow', () => {
  let projectDir: string;

  beforeAll(async () => {
    projectDir = await mkdtemp(join(tmpdir(), 'gforms-e2e-'));

    // Initialize project
    execSync('gforms init', { cwd: projectDir });

    // Create test form
    await writeFile(
      join(projectDir, 'forms/test.ts'),
      `export default {
        title: 'E2E Test Form',
        questions: [
          { id: 'q1', type: 'text', title: 'Test Question' }
        ]
      };`
    );
  });

  afterAll(async () => {
    // Cleanup: destroy form if created
    try {
      execSync('gforms destroy forms/test.ts --auto-approve', {
        cwd: projectDir,
        env: { ...process.env, GFORMS_TEST_MODE: '1' },
      });
    } catch {
      // Ignore if form wasn't created
    }
    await rm(projectDir, { recursive: true });
  });

  it('should validate form successfully', () => {
    const result = execSync('gforms validate forms/test.ts', {
      cwd: projectDir,
      encoding: 'utf-8',
    });

    expect(result).toContain('is valid');
  });

  it('should show diff for new form', () => {
    const result = execSync('gforms diff forms/test.ts', {
      cwd: projectDir,
      encoding: 'utf-8',
    });

    expect(result).toContain('new form');
    expect(result).toContain('E2E Test Form');
  });

  // Note: Actual deploy tests require Google API credentials
  // and are run separately in CI with secrets
});
```

## Test Data

### Fixtures

```typescript
// tests/fixtures/forms.ts
export const minimalForm = {
  title: 'Minimal Form',
  questions: [{ id: 'q1', type: 'text' as const, title: 'Q1' }],
};

export const fullForm = {
  title: 'Full Form',
  description: 'A complete form with all features',
  questions: [
    { id: 'email', type: 'email' as const, title: 'Email', required: true },
    { id: 'rating', type: 'scale' as const, title: 'Rating', min: 1, max: 5 },
    {
      type: 'section' as const,
      title: 'Details',
      questions: [
        { id: 'comments', type: 'text' as const, title: 'Comments', paragraph: true },
      ],
    },
  ],
  integrations: [
    { type: 'sheets' as const, spreadsheetName: 'Responses' },
  ],
  settings: {
    collectEmail: true,
    confirmationMessage: 'Thanks!',
  },
};
```

### Factories

```typescript
// tests/factories/form-factory.ts
import { FormDefinition } from '../../src/types';

let counter = 0;

export function createForm(overrides: Partial<FormDefinition> = {}): FormDefinition {
  counter++;
  return {
    title: `Test Form ${counter}`,
    questions: [
      { id: `q${counter}`, type: 'text', title: `Question ${counter}` },
    ],
    ...overrides,
  };
}
```

## CI Configuration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test:unit
      - uses: codecov/codecov-action@v3

  integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: pnpm test:integration

  e2e:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: pnpm build
      - run: pnpm test:e2e
        env:
          GOOGLE_APPLICATION_CREDENTIALS: ${{ secrets.GCP_SA_KEY_PATH }}
```

## Coverage Requirements

| Metric | Threshold |
|--------|-----------|
| Statements | 95% |
| Branches | 90% |
| Functions | 95% |
| Lines | 95% |
