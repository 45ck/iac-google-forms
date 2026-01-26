# Internal API Specification

## Overview

This document specifies the internal programmatic APIs of iac-google-forms. These APIs are used by the CLI and can be consumed directly by Node.js applications.

## Module Structure

```
iac-google-forms/
├── index.ts              # Main exports
├── config/               # Configuration loading
├── auth/                 # Authentication
├── forms/                # Form operations
├── diff/                 # Diff engine
├── state/                # State management
└── integrations/         # Sheets, email, webhooks
```

---

## Core APIs

### ConfigLoader

Loads and validates form definition files.

```typescript
import { loadFormDefinition, validateDefinition } from 'iac-google-forms';

// Load from TypeScript file
const form = await loadFormDefinition('forms/feedback.ts');

// Validate any object against schema
const result = validateDefinition(formObject);
if (!result.valid) {
  console.error(result.errors);
}
```

**Function Signatures:**

```typescript
function loadFormDefinition(filePath: string): Promise<FormDefinition>;

function validateDefinition(definition: unknown): ValidationResult;

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}
```

---

### AuthManager

Manages OAuth and Service Account authentication.

```typescript
import { AuthManager } from 'iac-google-forms';

const auth = new AuthManager({
  scopes: ['forms.body', 'spreadsheets', 'drive.file'],
  tokenStorePath: '~/.gforms/credentials.json',
});

// OAuth login (opens browser)
await auth.loginWithOAuth({ openBrowser: true });

// Or use service account
await auth.useServiceAccount('/path/to/key.json');

// Get auth client for API calls
const client = await auth.getAuthClient();
```

**Class Definition:**

```typescript
class AuthManager {
  constructor(config: AuthManagerConfig);

  // OAuth methods
  loginWithOAuth(options?: OAuthLoginOptions): Promise<void>;
  logout(): Promise<void>;

  // Service account
  useServiceAccount(keyFilePath: string): Promise<void>;

  // Get authenticated client
  getAuthClient(): Promise<AuthClient>;

  // Status
  getStatus(): Promise<AuthState>;
  isAuthenticated(): Promise<boolean>;
}

interface OAuthLoginOptions {
  openBrowser?: boolean; // default: true
  port?: number; // default: random
  timeout?: number; // default: 120000 (2 min)
}
```

---

### GoogleFormsClient

CRUD operations for Google Forms.

```typescript
import { GoogleFormsClient } from 'iac-google-forms';

const client = new GoogleFormsClient(authClient);

// Create new form
const result = await client.createForm(formDefinition);
console.log(result.formId, result.formUrl);

// Get existing form
const remote = await client.getForm('1BxiMVs0XRA5...');

// Update form
await client.updateForm('1BxiMVs0XRA5...', formDefinition);

// Link to Sheets
await client.linkToSheets('1BxiMVs0XRA5...', {
  mode: 'create',
  spreadsheetName: 'Form Responses',
});
```

**Class Definition:**

```typescript
class GoogleFormsClient {
  constructor(auth: AuthClient);

  createForm(definition: FormDefinition): Promise<CreateFormResult>;
  getForm(formId: string): Promise<RemoteForm>;
  updateForm(formId: string, definition: FormDefinition): Promise<UpdateFormResult>;
  deleteForm(formId: string): Promise<void>;

  linkToSheets(formId: string, config: SheetsLinkConfig): Promise<SheetsLinkResult>;
  unlinkSheets(formId: string): Promise<void>;
}
```

---

### DiffEngine

Compares local and remote form definitions.

```typescript
import { DiffEngine, formatDiff } from 'iac-google-forms';

const engine = new DiffEngine();

// Calculate diff
const diff = engine.calculateDiff(localForm, remoteForm);

if (diff.hasChanges) {
  // Format for display
  const output = formatDiff(diff, { format: 'console', color: true });
  console.log(output);
}
```

**Class Definition:**

```typescript
class DiffEngine {
  calculateDiff(local: FormDefinition, remote: RemoteForm | null): DiffResult;
}

function formatDiff(diff: DiffResult, options: DiffFormatOptions): string;

interface DiffResult {
  status: 'new' | 'modified' | 'unchanged' | 'deleted';
  hasChanges: boolean;
  questions: QuestionDiff[];
  integrations: IntegrationDiff[];
  settings?: SettingsDiff;
}
```

---

### StateManager

Manages the `.gforms/state.json` file.

```typescript
import { StateManager } from 'iac-google-forms';

const state = new StateManager('.gforms');

// Load state
await state.load();

// Get form state
const formState = await state.getFormState('forms/feedback.ts');
if (formState?.formId) {
  console.log('Form ID:', formState.formId);
}

// Update after deploy
await state.updateFormState('forms/feedback.ts', {
  formId: '1BxiMVs0XRA5...',
  formUrl: 'https://...',
  lastDeployed: new Date().toISOString(),
  contentHash: 'a1b2c3...',
});

// Save to disk
await state.save();
```

**Class Definition:**

```typescript
class StateManager {
  constructor(stateDir: string);

  load(): Promise<void>;
  save(): Promise<void>;

  getFormState(localPath: string): Promise<FormState | null>;
  updateFormState(localPath: string, updates: Partial<FormState>): Promise<void>;
  removeFormState(localPath: string): Promise<void>;

  getAllForms(): Promise<Record<string, FormState>>;
}
```

---

## High-Level Operations

### deploy()

Complete deployment flow.

```typescript
import { deploy } from 'iac-google-forms';

const result = await deploy('forms/feedback.ts', {
  autoApprove: false,
  dryRun: false,
  onDiff: (diff) => {
    console.log('Changes:', diff);
    return true; // proceed with deploy
  },
  onProgress: (step, message) => {
    console.log(`[${step}] ${message}`);
  },
});

console.log('Deployed:', result.formUrl);
```

**Function Signature:**

```typescript
async function deploy(filePath: string, options: DeployOptions): Promise<DeployResult>;

interface DeployOptions {
  autoApprove?: boolean;
  dryRun?: boolean;
  onDiff?: (diff: DiffResult) => boolean | Promise<boolean>;
  onProgress?: (step: string, message: string) => void;
}

interface DeployResult {
  status: 'created' | 'updated' | 'unchanged' | 'cancelled';
  formId: string;
  formUrl: string;
  responseUrl: string;
  spreadsheetUrl?: string;
  changes: number;
}
```

---

### diff()

Calculate and format diff.

```typescript
import { diff } from 'iac-google-forms';

const result = await diff('forms/feedback.ts', {
  format: 'console',
});

console.log(result.output);
process.exit(result.hasChanges ? 1 : 0);
```

**Function Signature:**

```typescript
async function diff(filePath: string, options: DiffOptions): Promise<DiffOutput>;

interface DiffOptions {
  format?: 'console' | 'markdown' | 'json';
}

interface DiffOutput {
  diff: DiffResult;
  output: string;
  hasChanges: boolean;
}
```

---

## Events

The library emits events for monitoring and logging.

```typescript
import { gforms } from 'iac-google-forms';

gforms.on('auth:login', (email) => {
  console.log('Logged in as:', email);
});

gforms.on('auth:refresh', () => {
  console.log('Token refreshed');
});

gforms.on('deploy:start', (filePath) => {
  console.log('Deploying:', filePath);
});

gforms.on('deploy:complete', (result) => {
  console.log('Deployed:', result.formUrl);
});

gforms.on('api:request', (method, url) => {
  console.log(`API: ${method} ${url}`);
});

gforms.on('api:error', (error) => {
  console.error('API Error:', error);
});
```

**Event Types:**

| Event             | Payload                                 |
| ----------------- | --------------------------------------- |
| `auth:login`      | `{ email: string, method: AuthMethod }` |
| `auth:logout`     | `void`                                  |
| `auth:refresh`    | `void`                                  |
| `deploy:start`    | `{ filePath: string }`                  |
| `deploy:diff`     | `{ diff: DiffResult }`                  |
| `deploy:complete` | `{ result: DeployResult }`              |
| `deploy:error`    | `{ error: Error }`                      |
| `api:request`     | `{ method: string, url: string }`       |
| `api:response`    | `{ status: number, duration: number }`  |
| `api:error`       | `{ error: Error, retryable: boolean }`  |

---

## Error Handling

All errors extend `GFormsError`:

```typescript
import { GFormsError, AuthError, ValidationError, ApiError, ConflictError } from 'iac-google-forms';

try {
  await deploy('forms/feedback.ts', { autoApprove: true });
} catch (error) {
  if (error instanceof AuthError) {
    console.error('Auth failed:', error.message);
    // Prompt re-login
  } else if (error instanceof ValidationError) {
    console.error('Invalid form:', error.errors);
  } else if (error instanceof ConflictError) {
    console.error('Form modified externally');
    console.error('Local hash:', error.localHash);
    console.error('Remote revision:', error.remoteRevision);
  } else if (error instanceof ApiError) {
    console.error('API error:', error.status, error.message);
    if (error.retryable) {
      // Retry logic
    }
  }
}
```

**Error Classes:**

| Class             | Properties                        |
| ----------------- | --------------------------------- |
| `GFormsError`     | `message`, `code`                 |
| `AuthError`       | `method`, `reason`                |
| `ValidationError` | `errors[]`, `filePath`            |
| `ApiError`        | `status`, `retryable`, `response` |
| `ConflictError`   | `localHash`, `remoteRevision`     |
| `StateError`      | `statePath`, `reason`             |
