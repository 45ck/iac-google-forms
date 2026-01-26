# Scenario: Define a New Form in TypeScript (Visionary)

**Type:** Visionary (Future State with Tool)
**Persona:** Alex Chen (Platform Engineer)
**Goal:** Create a customer feedback form with questions, validation, and integrations

## Preconditions

- `iac-google-forms` CLI is installed (`npm install -g iac-google-forms`)
- Google API credentials configured (service account or OAuth)
- Project has a `forms/` directory for form definitions

## Steps

| Step | Actor  | Action                                                                                         | System Response                                    |
| ---- | ------ | ---------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 1    | Alex   | Creates new file `forms/customer-feedback.ts` in IDE                                           | IDE provides TypeScript autocomplete               |
| 2    | Alex   | Imports form builder: `import { defineForm, text, dropdown, section } from 'iac-google-forms'` | Types available                                    |
| 3    | Alex   | Defines form structure (see code below)                                                        | IDE validates types, shows errors                  |
| 4    | Alex   | Runs `gforms diff forms/customer-feedback.ts`                                                  | CLI shows "Will create new form with 10 questions" |
| 5    | Alex   | Reviews diff output                                                                            | Clear summary of what will be created              |
| 6    | Alex   | Runs `gforms deploy forms/customer-feedback.ts`                                                | CLI creates form, shows progress                   |
| 7    | System | Creates form via Google Forms API                                                              | Form created                                       |
| 8    | System | Links to Google Sheet (as configured)                                                          | Sheet created and linked                           |
| 9    | System | Sets up email notification                                                                     | Notification configured                            |
| 10   | Alex   | Receives confirmation with form URL                                                            | Form ready to use                                  |

## Example Code

```typescript
// forms/customer-feedback.ts
import {
  defineForm,
  text,
  email,
  dropdown,
  multipleChoice,
  section,
  required,
  sheets,
  emailNotification,
} from 'iac-google-forms';

export default defineForm({
  title: 'Customer Feedback',
  description: 'Help us improve our product',

  questions: [
    email('email', {
      title: 'Your email address',
      validation: required(),
    }),

    text('name', {
      title: 'Your name',
      validation: required(),
    }),

    dropdown('company_size', {
      title: 'Company size',
      options: ['1-10', '11-50', '51-200', '201+'],
      validation: required(),
    }),

    multipleChoice('satisfaction', {
      title: 'Overall satisfaction',
      options: ['Very satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very dissatisfied'],
      validation: required(),
    }),

    section('detailed_feedback', {
      title: 'Detailed Feedback',
      showIf: { field: 'satisfaction', in: ['Dissatisfied', 'Very dissatisfied'] },
      questions: [
        text('improvement_suggestions', {
          title: 'What could we improve?',
          paragraph: true,
        }),
      ],
    }),
  ],

  integrations: [
    sheets({
      spreadsheetName: 'Customer Feedback Responses',
      createIfMissing: true,
    }),

    emailNotification({
      to: ['feedback@company.com'],
      subject: 'New feedback received',
    }),
  ],
});
```

## CLI Output

```
$ gforms diff forms/customer-feedback.ts

📋 Form: Customer Feedback
   Status: NEW (will be created)

   Questions (5):
   + [email]    email - Your email address (required)
   + [text]     name - Your name (required)
   + [dropdown] company_size - Company size (required)
   + [choice]   satisfaction - Overall satisfaction (required)
   + [section]  detailed_feedback - Detailed Feedback (conditional)
     + [text]   improvement_suggestions - What could we improve?

   Integrations:
   + Google Sheets: "Customer Feedback Responses" (create new)
   + Email notification: feedback@company.com

$ gforms deploy forms/customer-feedback.ts

✓ Created form "Customer Feedback"
✓ Created spreadsheet "Customer Feedback Responses"
✓ Linked form responses to spreadsheet
✓ Configured email notification

Form URL: https://docs.google.com/forms/d/e/1FAIp.../viewform
Edit URL: https://docs.google.com/forms/d/1ABC.../edit
Sheet URL: https://docs.google.com/spreadsheets/d/1XYZ.../edit

Done in 3.2s
```

## Postconditions

- Form exists in Google Forms with all questions and logic
- Responses linked to Google Sheet
- Email notification configured
- **TypeScript file is source of truth** - can be version controlled
- **Reproducible** - running deploy again produces identical form

## Time Spent

- Total: **5 minutes** (including writing TypeScript)
- IDE autocomplete accelerates development
- Type errors caught before deployment

## Benefits Over As-Is

| Aspect          | As-Is     | Visionary                  |
| --------------- | --------- | -------------------------- |
| Time            | 35-45 min | 5 min                      |
| Version control | None      | Full git history           |
| Reproducibility | None      | 100% reproducible          |
| Review process  | None      | Code review before deploy  |
| Type safety     | None      | Full TypeScript validation |
| Documentation   | None      | Code is documentation      |
