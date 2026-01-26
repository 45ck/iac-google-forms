# Scenario: Configure Multiple Integrations (Visionary)

**Type:** Visionary (Future State with Tool)
**Persona:** Alex Chen (Platform Engineer)
**Goal:** Configure Google Sheets, email notifications, and webhook for form responses

## Preconditions

- Form definition exists in TypeScript
- Alex needs to send responses to:
  1. Google Sheets (for data analysis)
  2. Email notification (for immediate alerts)
  3. Webhook (for integration with internal systems)

## Steps

| Step | Actor | Action                                   | System Response                       |
| ---- | ----- | ---------------------------------------- | ------------------------------------- |
| 1    | Alex  | Opens form definition in IDE             | TypeScript file loads                 |
| 2    | Alex  | Adds `integrations` array to form config | IDE shows available integration types |
| 3    | Alex  | Configures Sheets integration            | Autocomplete shows options            |
| 4    | Alex  | Configures email notification            | Type checking validates config        |
| 5    | Alex  | Configures webhook integration           | URL and payload format specified      |
| 6    | Alex  | Runs `gforms diff`                       | Shows integrations to be configured   |
| 7    | Alex  | Runs `gforms deploy`                     | All integrations set up atomically    |

## Code Example

```typescript
// forms/customer-feedback.ts
import {
  defineForm,
  // ... question types ...
  sheets,
  emailNotification,
  webhook,
} from 'iac-google-forms';

export default defineForm({
  title: 'Customer Feedback',
  description: 'Help us improve our product',

  questions: [
    // ... questions ...
  ],

  integrations: [
    // 1. Google Sheets - store all responses
    sheets({
      spreadsheetName: 'Customer Feedback Responses',
      createIfMissing: true,
      // Optionally specify existing spreadsheet
      // spreadsheetId: '1ABC123...',
    }),

    // 2. Email notification - alert on submission
    emailNotification({
      to: ['feedback@company.com', 'product@company.com'],
      subject: 'New customer feedback received',
      // Optional: only notify for certain responses
      condition: {
        field: 'satisfaction',
        in: ['Dissatisfied', 'Very dissatisfied'],
      },
    }),

    // 3. Webhook - integrate with internal systems
    webhook({
      url: 'https://api.internal.company.com/forms/feedback',
      method: 'POST',
      headers: {
        Authorization: 'Bearer ${FORMS_WEBHOOK_TOKEN}',
        'Content-Type': 'application/json',
      },
      // Transform response data before sending
      payload: {
        source: 'google-forms',
        formId: '${formId}',
        responseId: '${responseId}',
        timestamp: '${submittedAt}',
        data: '${responses}',
      },
    }),
  ],
});
```

## CLI Output

```
$ gforms diff forms/customer-feedback.ts

📋 Form: Customer Feedback
   Status: MODIFIED

   Questions: (no changes)

   Integrations:
   ~ Google Sheets: "Customer Feedback Responses" (no changes)
   + Email notification: feedback@company.com, product@company.com
     Condition: satisfaction IN [Dissatisfied, Very dissatisfied]
   + Webhook: https://api.internal.company.com/forms/feedback
     Method: POST

$ gforms deploy forms/customer-feedback.ts

✓ Form unchanged
✓ Sheets integration unchanged
✓ Configured email notification (conditional)
✓ Configured webhook integration

Done in 2.1s
```

## Environment Variables

For sensitive values like webhook tokens:

```bash
# .env (not committed to git)
FORMS_WEBHOOK_TOKEN=secret-token-here

# Or via CLI
$ FORMS_WEBHOOK_TOKEN=secret gforms deploy forms/customer-feedback.ts
```

## Postconditions

- All three integrations configured and active
- Sheets receives all responses
- Email sent only for dissatisfied customers
- Webhook fires for all submissions
- **Configuration is code** - reproducible, reviewable, version controlled

## Integration Types Reference

| Integration           | Purpose                        | Configuration                             |
| --------------------- | ------------------------------ | ----------------------------------------- |
| `sheets()`            | Store responses in spreadsheet | Spreadsheet name or ID, create if missing |
| `emailNotification()` | Send email on submission       | Recipients, subject, optional condition   |
| `webhook()`           | POST to external URL           | URL, method, headers, payload template    |

## Benefits

- **Single source of truth** - All integrations defined in one place
- **Atomic deployment** - All integrations updated together
- **Conditional logic** - Email only for certain responses
- **Secret management** - Tokens via environment variables
- **Testable** - Can deploy to dev environment first
