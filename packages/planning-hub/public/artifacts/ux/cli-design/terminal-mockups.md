# Terminal Mockups

## Overview

This document shows the visual design of CLI output for all major commands and scenarios.

---

## Color Palette

| Element | Color  | ANSI Code  | Usage                        |
| ------- | ------ | ---------- | ---------------------------- |
| Success | Green  | `\x1b[32m` | Checkmarks, success messages |
| Error   | Red    | `\x1b[31m` | Error messages, removals     |
| Warning | Yellow | `\x1b[33m` | Warnings, modifications      |
| Info    | Cyan   | `\x1b[36m` | URLs, hints                  |
| Dim     | Gray   | `\x1b[90m` | Secondary info, IDs          |
| Bold    | -      | `\x1b[1m`  | Headers, emphasis            |
| Add     | Green  | `\x1b[32m` | Diff additions (+)           |
| Remove  | Red    | `\x1b[31m` | Diff removals (-)            |
| Modify  | Yellow | `\x1b[33m` | Diff modifications (~)       |

---

## gforms init

```
┌─────────────────────────────────────────────────────────────────┐
│ $ gforms init                                                   │
│                                                                 │
│ Initializing gforms project...                                  │
│                                                                 │
│ ✓ Created .gforms/state.json                                    │
│ ✓ Created gforms.config.ts                                      │
│ ✓ Created forms/example.ts                                      │
│                                                                 │
│ Project initialized!                                            │
│                                                                 │
│ Next steps:                                                     │
│   1. Run gforms auth login to authenticate with Google          │
│   2. Edit forms/example.ts to define your form                  │
│   3. Run gforms deploy forms/example.ts to deploy               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## gforms auth login

### Success Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ $ gforms auth login                                             │
│                                                                 │
│ Opening browser for Google authentication...                    │
│                                                                 │
│ Waiting for authorization ━━━━━━━━━━━━━━━━━━━━ (Press Ctrl+C    │
│                                                to cancel)       │
│                                                                 │
│ ✓ Authenticated successfully!                                   │
│                                                                 │
│   Account: alex.chen@company.com                                │
│   Scopes:  forms.body, spreadsheets, drive.file                 │
│                                                                 │
│ Credentials saved to ~/.gforms/credentials.json                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### No Browser Mode

```
┌─────────────────────────────────────────────────────────────────┐
│ $ gforms auth login --no-browser                                │
│                                                                 │
│ Open this URL in your browser to authenticate:                  │
│                                                                 │
│   https://accounts.google.com/o/oauth2/auth?client_id=...       │
│                                                                 │
│ Waiting for authorization...                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## gforms auth status

### Authenticated (OAuth)

```
┌─────────────────────────────────────────────────────────────────┐
│ $ gforms auth status                                            │
│                                                                 │
│ Authentication Status                                           │
│ ─────────────────────                                           │
│ Method:    OAuth 2.0                                            │
│ Account:   alex.chen@company.com                                │
│ Expires:   2024-01-15 14:30:00 (in 2 hours)                     │
│ Scopes:    forms.body, spreadsheets, drive.file                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Authenticated (Service Account)

```
┌─────────────────────────────────────────────────────────────────┐
│ $ gforms auth status                                            │
│                                                                 │
│ Authentication Status                                           │
│ ─────────────────────                                           │
│ Method:    Service Account                                      │
│ Account:   gforms-sa@my-project.iam.gserviceaccount.com         │
│ Key File:  ./service-account.json                               │
│ Scopes:    forms.body, spreadsheets, drive.file                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Not Authenticated

```
┌─────────────────────────────────────────────────────────────────┐
│ $ gforms auth status                                            │
│                                                                 │
│ ✗ Not authenticated                                             │
│                                                                 │
│   Run gforms auth login to authenticate with Google.            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## gforms validate

### Valid Form

```
┌─────────────────────────────────────────────────────────────────┐
│ $ gforms validate forms/feedback.ts                             │
│                                                                 │
│ ✓ forms/feedback.ts is valid                                    │
│                                                                 │
│   Title:        Customer Feedback                               │
│   Questions:    5                                               │
│   Integrations: 1 (sheets)                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Invalid Form

```
┌─────────────────────────────────────────────────────────────────┐
│ $ gforms validate forms/feedback.ts                             │
│                                                                 │
│ ✗ forms/feedback.ts has errors                                  │
│                                                                 │
│   Error at questions[2].options                                 │
│   └─ Array must have at least 1 item                            │
│                                                                 │
│   Error at integrations[0].to[1]                                │
│   └─ Invalid email format: "not-an-email"                       │
│                                                                 │
│ 2 errors found                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## gforms diff

### Console Format (with changes)

```
┌─────────────────────────────────────────────────────────────────┐
│ $ gforms diff forms/feedback.ts                                 │
│                                                                 │
│ Comparing forms/feedback.ts with deployed form...               │
│                                                                 │
│ Form: Customer Feedback                                         │
│ ID:   1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms              │
│                                                                 │
│ ─────────────────────────────────────────────────────────────── │
│                                                                 │
│ ~ Title                                                         │
│   - "Customer Feedback"                                         │
│   + "Customer Feedback Form"                                    │
│                                                                 │
│ Questions:                                                      │
│                                                                 │
│   ~ satisfaction (scale)                                        │
│     - maxLabel: "Very Satisfied"                                │
│     + maxLabel: "Extremely Satisfied"                           │
│                                                                 │
│   + comments (text)                                             │
│     paragraph: true                                             │
│     required: false                                             │
│                                                                 │
│   - legacy_field (text)                                         │
│     This question will be removed                               │
│                                                                 │
│ Integrations:                                                   │
│                                                                 │
│   ~ sheets                                                      │
│     - spreadsheetName: "Responses"                              │
│     + spreadsheetName: "Feedback Responses"                     │
│                                                                 │
│ ─────────────────────────────────────────────────────────────── │
│ Summary: 2 modified, 1 added, 1 removed                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### No Changes

```
┌─────────────────────────────────────────────────────────────────┐
│ $ gforms diff forms/feedback.ts                                 │
│                                                                 │
│ Comparing forms/feedback.ts with deployed form...               │
│                                                                 │
│ Form: Customer Feedback                                         │
│ ID:   1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms              │
│                                                                 │
│ ✓ No changes detected                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### New Form (not yet deployed)

```
┌─────────────────────────────────────────────────────────────────┐
│ $ gforms diff forms/new-survey.ts                               │
│                                                                 │
│ Comparing forms/new-survey.ts...                                │
│                                                                 │
│ This is a new form that has not been deployed.                  │
│                                                                 │
│ + Title: Employee Survey                                        │
│ + Questions: 8                                                  │
│ + Integrations: 2 (sheets, email)                               │
│                                                                 │
│ Run gforms deploy forms/new-survey.ts to create.                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Markdown Format (CI)

```
┌─────────────────────────────────────────────────────────────────┐
│ $ gforms diff forms/feedback.ts --format markdown               │
│                                                                 │
│ ## Form Diff: Customer Feedback                                 │
│                                                                 │
│ | Change | Item | Details |                                     │
│ |--------|------|---------|                                     │
│ | ~Modified | Title | "Customer Feedback" → "Customer Feedback  │
│ |           |       | Form" |                                   │
│ | ~Modified | satisfaction | maxLabel changed |                 │
│ | +Added | comments | text (paragraph) |                        │
│ | -Removed | legacy_field | - |                                 │
│                                                                 │
│ **Summary:** 2 modified, 1 added, 1 removed                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## gforms deploy

### New Form Deployment

```
┌─────────────────────────────────────────────────────────────────┐
│ $ gforms deploy forms/feedback.ts                               │
│                                                                 │
│ Deploying forms/feedback.ts...                                  │
│                                                                 │
│ This will create a new Google Form:                             │
│                                                                 │
│   Title:        Customer Feedback                               │
│   Questions:    5                                               │
│   Integrations: sheets                                          │
│                                                                 │
│ Proceed? [y/N] y                                                │
│                                                                 │
│ Creating form...                                                │
│   ✓ Form created                                                │
│   ✓ Questions added (5)                                         │
│   ✓ Spreadsheet linked                                          │
│   ✓ State saved                                                 │
│                                                                 │
│ ✓ Deployment complete!                                          │
│                                                                 │
│   Form URL:        https://docs.google.com/forms/d/1Bxi.../edit │
│   Response URL:    https://docs.google.com/forms/d/e/.../viewform│
│   Spreadsheet:     https://docs.google.com/spreadsheets/d/1abc..│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Update Existing Form

```
┌─────────────────────────────────────────────────────────────────┐
│ $ gforms deploy forms/feedback.ts                               │
│                                                                 │
│ Deploying forms/feedback.ts...                                  │
│                                                                 │
│ Form: Customer Feedback                                         │
│ ID:   1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms              │
│                                                                 │
│ Changes to apply:                                               │
│                                                                 │
│   ~ Title: "Customer Feedback" → "Customer Feedback Form"       │
│   ~ satisfaction: maxLabel changed                              │
│   + comments: new text question                                 │
│   - legacy_field: will be removed                               │
│                                                                 │
│ Proceed? [y/N] y                                                │
│                                                                 │
│ Applying changes...                                             │
│   ✓ Title updated                                               │
│   ✓ Question updated: satisfaction                              │
│   ✓ Question added: comments                                    │
│   ✓ Question removed: legacy_field                              │
│   ✓ State saved                                                 │
│                                                                 │
│ ✓ Deployment complete! (4 changes applied)                      │
│                                                                 │
│   Form URL: https://docs.google.com/forms/d/1Bxi.../edit        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Dry Run

```
┌─────────────────────────────────────────────────────────────────┐
│ $ gforms deploy forms/feedback.ts --dry-run                     │
│                                                                 │
│ Deploying forms/feedback.ts (dry run)...                        │
│                                                                 │
│ Form: Customer Feedback                                         │
│ ID:   1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms              │
│                                                                 │
│ Changes that would be applied:                                  │
│                                                                 │
│   ~ Title: "Customer Feedback" → "Customer Feedback Form"       │
│   ~ satisfaction: maxLabel changed                              │
│   + comments: new text question                                 │
│                                                                 │
│ Dry run complete. No changes were made.                         │
│ Run without --dry-run to apply changes.                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Auto-Approve (CI mode)

```
┌─────────────────────────────────────────────────────────────────┐
│ $ gforms deploy forms/feedback.ts --auto-approve                │
│                                                                 │
│ Deploying forms/feedback.ts...                                  │
│ Applying 3 changes...                                           │
│ ✓ Deployment complete!                                          │
│   Form URL: https://docs.google.com/forms/d/1Bxi.../edit        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## gforms list

```
┌─────────────────────────────────────────────────────────────────┐
│ $ gforms list                                                   │
│                                                                 │
│ Tracked Forms                                                   │
│ ─────────────────────────────────────────────────────────────── │
│ File                    Form ID           Last Deployed         │
│ ─────────────────────────────────────────────────────────────── │
│ forms/feedback.ts       1BxiMVs0XRA5...   2024-01-15 10:30      │
│ forms/survey.ts         1CyjNWt1YSB6...   2024-01-14 09:15      │
│ forms/new-form.ts       (not deployed)    -                     │
│ ─────────────────────────────────────────────────────────────── │
│ 3 forms (2 deployed, 1 pending)                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## gforms destroy

```
┌─────────────────────────────────────────────────────────────────┐
│ $ gforms destroy forms/feedback.ts                              │
│                                                                 │
│ ⚠ This will permanently delete:                                 │
│                                                                 │
│   Form:        Customer Feedback                                │
│   Form ID:     1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms     │
│   Spreadsheet: Feedback Responses (1abc...)                     │
│   Responses:   142 submissions                                  │
│                                                                 │
│ This action cannot be undone.                                   │
│                                                                 │
│ Type "delete" to confirm: delete                                │
│                                                                 │
│   ✓ Form deleted from Google                                    │
│   ✓ Spreadsheet deleted from Google                             │
│   ✓ State cleared                                               │
│                                                                 │
│ Destruction complete.                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Error States

### Authentication Required

```
┌─────────────────────────────────────────────────────────────────┐
│ $ gforms deploy forms/feedback.ts                               │
│                                                                 │
│ ✗ Error: Not authenticated                                      │
│                                                                 │
│   Run gforms auth login to authenticate with Google.            │
│                                                                 │
│   For CI/CD, set the GOOGLE_APPLICATION_CREDENTIALS             │
│   environment variable to your service account key path.        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Validation Error

```
┌─────────────────────────────────────────────────────────────────┐
│ $ gforms deploy forms/feedback.ts                               │
│                                                                 │
│ ✗ Error: Validation failed                                      │
│                                                                 │
│   forms/feedback.ts:12                                          │
│   └─ questions[2].options: Array must have at least 1 item      │
│                                                                 │
│   forms/feedback.ts:18                                          │
│   └─ integrations[0].to[1]: Invalid email format                │
│                                                                 │
│ Fix errors and try again.                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### API Error

```
┌─────────────────────────────────────────────────────────────────┐
│ $ gforms deploy forms/feedback.ts                               │
│                                                                 │
│ ✗ Error: Google API request failed                              │
│                                                                 │
│   Status: 403 Forbidden                                         │
│   Message: The caller does not have permission                  │
│                                                                 │
│   This may be caused by:                                        │
│   • Insufficient OAuth scopes (re-run gforms auth login)        │
│   • Form owned by different account                             │
│   • Google Forms API not enabled in Cloud Console               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Conflict Error

```
┌─────────────────────────────────────────────────────────────────┐
│ $ gforms deploy forms/feedback.ts                               │
│                                                                 │
│ ✗ Error: Conflict detected                                      │
│                                                                 │
│   The form was modified outside of gforms since last deploy.    │
│                                                                 │
│   Last deployed: 2024-01-15 10:30:00                            │
│   Remote changed: 2024-01-15 11:45:00                           │
│                                                                 │
│ Options:                                                        │
│   • Run gforms diff to review remote changes                    │
│   • Run gforms deploy --force to overwrite remote               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Network Error

```
┌─────────────────────────────────────────────────────────────────┐
│ $ gforms deploy forms/feedback.ts                               │
│                                                                 │
│ ✗ Error: Network request failed                                 │
│                                                                 │
│   Could not connect to Google APIs.                             │
│   Check your internet connection and try again.                 │
│                                                                 │
│   If behind a proxy, ensure HTTPS_PROXY is configured.          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Progress Indicators

### Spinner (indeterminate)

```
⠋ Creating form...
⠙ Creating form...
⠹ Creating form...
⠸ Creating form...
```

### Progress Bar (determinate)

```
Uploading questions ━━━━━━━━━━━━━━━━━━━━ 100% (5/5)
```

### Step Progress

```
[1/4] Creating form...         ✓
[2/4] Adding questions...      ✓
[3/4] Linking spreadsheet...   ✓
[4/4] Saving state...          ⠋
```
