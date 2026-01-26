# Data Model

## Overview

This document describes the data schemas and type definitions for iac-google-forms. The data model covers three main areas:

1. **Form Definition** - The user-authored TypeScript/JSON configuration
2. **State File** - Local tracking of deployed forms
3. **API Types** - Interfaces for Google APIs and internal services

## Diagrams

| Diagram              | Description                                            |
| -------------------- | ------------------------------------------------------ |
| [erd.mmd](./erd.mmd) | Entity-Relationship diagram showing data relationships |

## JSON Schemas

| Schema                          | Purpose                            | Location   |
| ------------------------------- | ---------------------------------- | ---------- |
| **form-definition.schema.json** | Validates form configuration files | `schemas/` |
| **state-file.schema.json**      | Validates `.gforms/state.json`     | `schemas/` |

### Form Definition Schema

The form definition schema validates user-authored form configurations:

```json
{
  "title": "Customer Feedback",
  "description": "Please share your experience",
  "questions": [
    {
      "id": "satisfaction",
      "type": "scale",
      "title": "How satisfied are you?",
      "min": 1,
      "max": 5,
      "minLabel": "Very Unsatisfied",
      "maxLabel": "Very Satisfied",
      "required": true
    }
  ],
  "integrations": [
    {
      "type": "sheets",
      "spreadsheetName": "Feedback Responses"
    }
  ]
}
```

**Question Types:**
| Type | Description | Key Properties |
|------|-------------|----------------|
| `text` | Short/long text | `paragraph`, `maxLength`, `validation` |
| `email` | Email with validation | (auto-validated) |
| `choice` | Radio/checkbox | `options`, `allowOther`, `multiple` |
| `dropdown` | Dropdown select | `options` |
| `scale` | Linear scale | `min`, `max`, `minLabel`, `maxLabel` |
| `section` | Question group | `questions`, `showIf` |

**Integration Types:**
| Type | Description | Key Properties |
|------|-------------|----------------|
| `sheets` | Link to Sheets | `spreadsheetName`, `spreadsheetId`, `folderId` |
| `email` | Send notifications | `to`, `subject`, `condition` |
| `webhook` | HTTP POST | `url`, `method`, `headers`, `secret` |

### State File Schema

The state file tracks deployed forms in `.gforms/state.json`:

```json
{
  "version": "1.0",
  "forms": {
    "forms/feedback.ts": {
      "localPath": "forms/feedback.ts",
      "formId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
      "formUrl": "https://docs.google.com/forms/d/.../edit",
      "responseUrl": "https://docs.google.com/forms/d/.../viewform",
      "spreadsheetId": "1abc...",
      "lastDeployed": "2024-01-15T10:30:00Z",
      "contentHash": "a1b2c3d4...",
      "remoteRevisionId": "00000123"
    }
  }
}
```

## TypeScript Types

| File                                  | Contents                                    |
| ------------------------------------- | ------------------------------------------- |
| `typescript/form-definition.types.ts` | Form, Question, Integration types           |
| `typescript/auth.types.ts`            | AuthClient, OAuth, ServiceAccount types     |
| `typescript/api-client.types.ts`      | GoogleFormsClient, ConfigLoader, DiffEngine |

### Key Type Patterns

**Discriminated Unions for Questions:**

```typescript
type Question =
  | TextQuestion
  | EmailQuestion
  | ChoiceQuestion
  | DropdownQuestion
  | ScaleQuestion
  | Section;

// Type-safe handling
function processQuestion(q: Question) {
  switch (q.type) {
    case 'text':
      console.log(q.paragraph); // TypeScript knows this exists
      break;
    case 'choice':
      console.log(q.options); // TypeScript knows this exists
      break;
  }
}
```

**Auth Client Interface:**

```typescript
interface AuthClient {
  getAccessToken(): Promise<string>;
  getScopes(): string[];
  isAuthenticated(): boolean;
}

// Implementations
class OAuthAuth implements AuthClient { ... }
class ServiceAccountAuth implements AuthClient { ... }
```

## Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Form Definition │────▶│    ConfigLoader   │────▶│  Validated Form  │
│   (.ts file)    │     │   (parse + validate)│    │   (in memory)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   State File    │◀────│   StateManager    │◀────│   DiffEngine    │
│ (.gforms/state) │     │  (read/write)     │     │ (local vs remote)│
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │  GoogleFormsClient│────▶│   Google APIs   │
                        │   (CRUD ops)      │     │ (Forms/Sheets)  │
                        └──────────────────┘     └─────────────────┘
```

## Validation Rules

### Form Definition Validation

| Rule                  | Constraint                 |
| --------------------- | -------------------------- |
| Title length          | 1-200 characters           |
| Question ID format    | `^[a-zA-Z][a-zA-Z0-9_-]*$` |
| Scale min             | 0 or 1                     |
| Scale max             | 2-10                       |
| At least one question | `minItems: 1`              |
| Unique question IDs   | Enforced at runtime        |

### State File Validation

| Rule           | Constraint                 |
| -------------- | -------------------------- |
| Version format | `^\d+\.\d+$` (e.g., "1.0") |
| Form ID format | `^[a-zA-Z0-9_-]+$`         |
| Content hash   | SHA-256 (64 hex chars)     |
| Timestamps     | ISO 8601 format            |

## File Locations

```
project/
├── forms/
│   └── feedback.ts          # Form definitions
├── .gforms/
│   └── state.json           # Deployment state
└── node_modules/
    └── iac-google-forms/
        └── schemas/         # JSON schemas (for IDE validation)
```
