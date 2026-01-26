# Domain Model

## Overview

This document describes the domain entities for iac-google-forms, derived from the validated use cases and scenarios.

## Class Diagram

See [class-diagram.mmd](./class-diagram.mmd) for the full UML class diagram.

## Core Entities

### Form Definition Entities

| Entity | Description |
|--------|-------------|
| **FormDefinition** | Root entity representing a complete form configuration |
| **Question** | Interface for all question types (text, email, choice, etc.) |
| **Section** | Groups questions with optional conditional display logic |
| **ConditionalLogic** | Rules for when sections/notifications are triggered |

### Question Types

| Type | Description | Key Properties |
|------|-------------|----------------|
| **TextQuestion** | Short answer or paragraph | `paragraph`, `maxLength` |
| **EmailQuestion** | Email with validation | `validation` (auto email format) |
| **ChoiceQuestion** | Multiple choice (radio) | `options`, `allowOther` |
| **DropdownQuestion** | Dropdown selection | `options` |
| **ScaleQuestion** | Linear scale (1-10, etc.) | `min`, `max`, labels |

### Integration Entities

| Entity | Description |
|--------|-------------|
| **SheetsIntegration** | Links form to Google Sheets |
| **EmailIntegration** | Email notifications with optional conditions |
| **WebhookIntegration** | HTTP POST to external URLs |

### State Management Entities

| Entity | Description |
|--------|-------------|
| **FormState** | Tracks a deployed form (ID, last deployed, content hash) |
| **StateFile** | Persists all form states to `.gforms/state.json` |
| **DiffResult** | Result of comparing local vs remote form |

### API Client Entities

| Entity | Description |
|--------|-------------|
| **GoogleFormsClient** | Wrapper around Google Forms/Sheets APIs |
| **AuthClient** | Interface for authentication |
| **ServiceAccountAuth** | JWT-based service account authentication |
| **OAuthAuth** | User-delegated OAuth 2.0 authentication |

## Sequence Diagrams

| Diagram | Description |
|---------|-------------|
| [deploy-sequence.mmd](./sequence-diagrams/deploy-sequence.mmd) | Full deployment flow |
| [diff-sequence.mmd](./sequence-diagrams/diff-sequence.mmd) | Diff calculation flow |
| [auth-sequence.mmd](./sequence-diagrams/auth-sequence.mmd) | Authentication flows |

## Key Relationships

```
FormDefinition
├── questions: Question[]
│   ├── TextQuestion
│   ├── EmailQuestion
│   ├── ChoiceQuestion
│   ├── DropdownQuestion
│   ├── ScaleQuestion
│   └── Section
│       ├── questions: Question[]
│       └── showIf?: ConditionalLogic
└── integrations: Integration[]
    ├── SheetsIntegration
    ├── EmailIntegration
    │   └── condition?: ConditionalLogic
    └── WebhookIntegration
```

## Design Decisions

### 1. Question as Interface
Questions share common properties (id, title, required) but have type-specific properties. Using an interface with discriminated union (`type` field) enables type-safe handling.

### 2. Separate Integration Types
Rather than a generic integration object, each integration type is a distinct class. This allows type-specific validation and configuration.

### 3. State File Pattern
Following Terraform's approach, form state is tracked in a local file. This enables:
- Mapping local files to remote form IDs
- Detecting drift
- Supporting multiple forms per project

### 4. Auth Client Abstraction
The `AuthClient` interface allows swapping between Service Account (for CI) and OAuth (for local dev) without changing client code.

## TypeScript Types Preview

```typescript
interface FormDefinition {
  title: string;
  description?: string;
  questions: Question[];
  integrations?: Integration[];
  settings?: FormSettings;
}

type Question =
  | TextQuestion
  | EmailQuestion
  | ChoiceQuestion
  | DropdownQuestion
  | ScaleQuestion
  | Section;

interface BaseQuestion {
  id: string;
  title: string;
  description?: string;
  required?: boolean;
}

interface TextQuestion extends BaseQuestion {
  type: 'text';
  paragraph?: boolean;
  maxLength?: number;
}

// ... etc
```
