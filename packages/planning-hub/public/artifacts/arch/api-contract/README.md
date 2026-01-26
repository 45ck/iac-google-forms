# API Contract

## Overview

This directory contains the API specifications for iac-google-forms, covering the CLI interface, internal programmatic APIs, and Google API mappings.

## Documents

| Document | Description |
|----------|-------------|
| [cli-specification.md](./cli-specification.md) | Complete CLI command reference |
| [internal-api.md](./internal-api.md) | Programmatic Node.js API |
| [google-api-mapping.md](./google-api-mapping.md) | Maps gforms operations to Google API calls |

## Quick Reference

### CLI Commands

| Command | Description |
|---------|-------------|
| `gforms init` | Initialize new project |
| `gforms auth login` | Authenticate with Google |
| `gforms auth logout` | Remove credentials |
| `gforms auth status` | Show auth status |
| `gforms validate <file>` | Validate form definition |
| `gforms diff <file>` | Show changes vs deployed |
| `gforms deploy <file>` | Deploy form to Google |
| `gforms list` | List tracked forms |
| `gforms destroy <file>` | Delete form |

### Programmatic API

```typescript
import {
  loadFormDefinition,
  deploy,
  diff,
  AuthManager,
  GoogleFormsClient,
  StateManager,
} from 'iac-google-forms';

// Load and validate
const form = await loadFormDefinition('forms/feedback.ts');

// Deploy
const result = await deploy('forms/feedback.ts', { autoApprove: true });
console.log(result.formUrl);
```

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Operation failed / Changes detected (CI mode) |
| 2 | Validation error |
| 3 | User cancelled |

### Environment Variables

| Variable | Description |
|----------|-------------|
| `GOOGLE_APPLICATION_CREDENTIALS` | Service account key path |
| `GFORMS_CONFIG` | Config file path |
| `GFORMS_STATE_DIR` | State directory |
| `NO_COLOR` | Disable colors |
| `CI` | CI mode behaviors |

## Google APIs

| API | Purpose |
|-----|---------|
| Forms API v1 | Form CRUD operations |
| Sheets API v4 | Response spreadsheet linking |
| Drive API v3 | File management, permissions |

### Required OAuth Scopes

```
https://www.googleapis.com/auth/forms.body
https://www.googleapis.com/auth/forms.responses.readonly
https://www.googleapis.com/auth/spreadsheets
https://www.googleapis.com/auth/drive.file
```
