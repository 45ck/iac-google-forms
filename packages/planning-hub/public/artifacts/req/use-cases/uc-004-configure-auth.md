# UC-004: Configure Authentication

## Overview

| Attribute | Value |
|-----------|-------|
| **ID** | UC-004 |
| **Title** | Configure Authentication |
| **Actor** | Platform Engineer |
| **Priority** | Must Have |
| **Derived From** | All scenarios (prerequisite) |

## Goal

Set up authentication credentials to allow the CLI to access Google Forms, Sheets, and Drive APIs.

## Preconditions

1. Google Cloud project exists
2. APIs enabled (Forms, Sheets, Drive)
3. Credentials created (Service Account or OAuth)

## Postconditions

1. Credentials stored/configured locally
2. CLI can authenticate with Google APIs
3. Appropriate scopes granted

## Main Success Scenario (Service Account)

| Step | Actor | Action | System Response |
|------|-------|--------|-----------------|
| 1 | Engineer | Downloads service account JSON from GCP Console | JSON file obtained |
| 2 | Engineer | Sets `GOOGLE_APPLICATION_CREDENTIALS` env var | Environment configured |
| 3 | Engineer | Runs `gforms auth verify` | CLI tests connection |
| 4 | System | Authenticates using service account | Auth successful |
| 5 | System | Verifies required scopes | Scopes confirmed |
| 6 | System | Displays success message | Ready to use |

## Alternative: OAuth Flow

| Step | Actor | Action | System Response |
|------|-------|--------|-----------------|
| 1 | Engineer | Runs `gforms auth login` | CLI starts OAuth flow |
| 2 | System | Opens browser to Google consent page | Browser opens |
| 3 | Engineer | Grants permissions to application | Consent given |
| 4 | System | Receives OAuth tokens | Tokens stored |
| 5 | System | Saves tokens to `~/.gforms/credentials.json` | Credentials persisted |
| 6 | System | Displays success message | Ready to use |

## CLI Interface

```bash
# OAuth login (interactive)
gforms auth login

# Verify credentials work
gforms auth verify

# Show current auth status
gforms auth status

# Logout (remove stored credentials)
gforms auth logout

# Use service account (via env var)
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json gforms deploy
```

## Required Scopes

| Scope | Purpose |
|-------|---------|
| `https://www.googleapis.com/auth/forms.body` | Create/edit forms |
| `https://www.googleapis.com/auth/forms.responses.readonly` | Read responses (for diff) |
| `https://www.googleapis.com/auth/spreadsheets` | Create/link Sheets |
| `https://www.googleapis.com/auth/drive.file` | Access files created by app |

## Business Rules

- Service account takes precedence over OAuth if both configured
- OAuth tokens refresh automatically when expired
- Credentials never committed to git (warn if detected)
- Minimum required scopes used (principle of least privilege)

## Error Handling

| Error | Behavior |
|-------|----------|
| Missing credentials | Show setup instructions |
| Invalid credentials | Show re-auth instructions |
| Missing scopes | List which scopes to add |
| Expired OAuth token | Auto-refresh or prompt re-login |

## Related Use Cases

- UC-002: Diff Form (requires auth)
- UC-003: Deploy Form (requires auth)
- UC-005-007: Integrations (require auth)
