# ADR-003: Dual Authentication Strategy

## Status

Accepted

## Date

2024-01-25

## Context

We need to support authentication to Google APIs for both:

1. Local development (interactive, personal accounts)
2. CI/CD pipelines (non-interactive, service accounts)

Options considered:

1. **OAuth only** - All users use OAuth
2. **Service Account only** - All users use service accounts
3. **Dual auth** - Support both OAuth and Service Account

## Decision

We will support **both OAuth and Service Account authentication**, with automatic detection based on environment.

## Rationale

### Why Both Methods

**OAuth 2.0** is ideal for:

- Local development
- Personal accounts
- Interactive workflows
- Testing with own forms

**Service Account** is ideal for:

- CI/CD pipelines
- Shared team projects
- Automated deployments
- Production environments

### Detection Priority

```
1. GOOGLE_APPLICATION_CREDENTIALS env var → Service Account
2. ~/.gforms/credentials.json exists → OAuth
3. Neither → Error: "Not authenticated"
```

### Advantages

1. **Flexibility** - Users choose what works for them
2. **Security** - Service accounts for production, OAuth for dev
3. **Simplicity** - No manual configuration needed

### Disadvantages

1. **Complexity** - Two code paths to maintain
2. **Documentation** - Must explain both methods
3. **Testing** - Must test both flows

## Consequences

### Positive

- Works for all use cases
- Familiar patterns (Terraform does similar)
- No one-size-fits-all compromise

### Negative

- More implementation effort
- More documentation needed

### Mitigations

- Abstract behind `AuthClient` interface
- Clear documentation with examples for each
- Test matrix covers both methods

## Implementation

### AuthClient Interface

```typescript
interface AuthClient {
  getAccessToken(): Promise<string>;
  getScopes(): string[];
  isAuthenticated(): boolean;
}
```

### Usage

```typescript
// Automatic detection
const auth = await AuthManager.getAuthClient();

// Or explicit
const oauth = await AuthManager.getOAuthClient();
const sa = await AuthManager.getServiceAccountClient(keyPath);
```

## Required Scopes

Both auth methods request the same scopes:

- `forms.body` - Read/write form structure
- `forms.responses.readonly` - Read responses (for drift)
- `spreadsheets` - Create/link sheets
- `drive.file` - Manage created files
