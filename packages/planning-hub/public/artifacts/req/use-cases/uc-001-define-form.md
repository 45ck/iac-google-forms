# UC-001: Define Form

## Overview

| Attribute        | Value                 |
| ---------------- | --------------------- |
| **ID**           | UC-001                |
| **Title**        | Define Form           |
| **Actor**        | Platform Engineer     |
| **Priority**     | Must Have             |
| **Derived From** | visionary-define-form |

## Goal

Create a form definition in TypeScript that specifies the form structure, questions, validation rules, and integrations.

## Preconditions

1. Node.js and npm/pnpm installed
2. `iac-google-forms` package installed
3. IDE with TypeScript support available

## Postconditions

1. TypeScript file exists with valid form definition
2. Form definition passes type checking
3. Form can be used with `diff` and `deploy` commands

## Main Success Scenario

| Step | Actor    | Action                                         | System Response                 |
| ---- | -------- | ---------------------------------------------- | ------------------------------- |
| 1    | Engineer | Creates new `.ts` file in forms directory      | IDE creates file                |
| 2    | Engineer | Imports form builder functions                 | IDE provides autocomplete       |
| 3    | Engineer | Calls `defineForm()` with configuration        | IDE validates types             |
| 4    | Engineer | Adds questions array with question definitions | IDE shows question type options |
| 5    | Engineer | Configures validation rules for questions      | IDE validates rule options      |
| 6    | Engineer | Adds integrations array (optional)             | IDE shows integration options   |
| 7    | Engineer | Exports form definition as default             | File is complete                |
| 8    | Engineer | Runs TypeScript compiler or IDE check          | Type errors shown if any        |

## Extensions

| Step | Condition               | Action                                   |
| ---- | ----------------------- | ---------------------------------------- |
| 3a   | Invalid config shape    | IDE shows type error with expected shape |
| 4a   | Invalid question type   | IDE shows available question types       |
| 5a   | Invalid validation rule | IDE shows valid rules for question type  |
| 8a   | Type errors exist       | Engineer fixes errors before proceeding  |

## Business Rules

- Form must have a `title` (required)
- Form must have at least one question
- Question IDs must be unique within the form
- Conditional sections must reference existing question IDs

## Example

```typescript
import { defineForm, text, email, dropdown, required } from 'iac-google-forms';

export default defineForm({
  title: 'Customer Feedback',
  description: 'Help us improve',
  questions: [
    email('email', { title: 'Email', validation: required() }),
    text('name', { title: 'Name' }),
    dropdown('rating', {
      title: 'Rating',
      options: ['Excellent', 'Good', 'Fair', 'Poor'],
    }),
  ],
});
```

## Related Use Cases

- UC-002: Diff Form (uses form definition)
- UC-003: Deploy Form (uses form definition)
- UC-009: Validate Form Config (validates definition)
