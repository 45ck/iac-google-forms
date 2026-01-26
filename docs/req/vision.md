# iac-google-forms Vision

## Problem Statement

Managing Google Forms manually through the web UI is:

- **Not version-controlled**: No history of changes, no rollback capability
- **Not reproducible**: Forms must be recreated manually in different environments
- **Error-prone**: Manual configuration leads to inconsistencies
- **Not scalable**: Managing multiple forms with similar structures requires repetitive work
- **Disconnected**: Setting up integrations (Sheets, notifications) is a separate manual process

## Solution

**Infrastructure as Code for Google Forms** - a TypeScript-first toolkit that lets you:

1. **Define forms as code** using a type-safe DSL
2. **Version control** form definitions alongside your codebase
3. **Preview changes** before deploying (diff)
4. **Deploy consistently** to Google Forms API
5. **Configure integrations** (Sheets, email, webhooks) in the same definition

## Target Users

- DevOps/Platform engineers who need automated, reproducible form management
- Developers who want forms defined alongside their application code
- Teams who need consistent forms across environments

## Project Components

### 1. Core Library (`@iac-google-forms/core`)

- TypeScript types and builders for form definitions
- Validation of form configurations
- Serialization/deserialization

### 2. Google API Client (`@iac-google-forms/google`)

- Google Forms API integration
- Google Sheets API integration
- Authentication (Service Account + OAuth)
- Diff calculation between local and remote state

### 3. CLI (`iac-google-forms` or `gforms`)

- `diff` - Show what would change
- `deploy` - Apply changes to Google Forms

### 4. Output Integrations

- Google Sheets response destination
- Email notifications
- Webhook triggers

## Scope Boundaries

### In Scope (MVP)

- TypeScript form definition DSL
- All question types supported by Google Forms API
- Form logic (sections, branching, skip logic)
- Validation rules
- Google Sheets integration
- Email notification configuration
- Webhook configuration
- CLI with diff and deploy commands
- Service Account + OAuth authentication
- Single Google account

### Out of Scope (Future)

- Import existing forms from Google
- Delete forms via CLI
- Multi-account support
- Web UI
- Terraform provider
- GitHub Action

## Success Criteria

1. A form can be fully defined in a TypeScript file
2. Running `gforms diff` shows exactly what will change
3. Running `gforms deploy` creates/updates the form in Google Forms
4. Integrations (Sheets, email, webhooks) are configured automatically
5. The same form definition deploys identically every time

## Technical Constraints

- Node.js runtime (TypeScript compiled to JavaScript)
- Google Forms API v1
- OAuth 2.0 and Service Account authentication
- Forms must be owned by the authenticated account
