# CLI Specification

## Overview

The `gforms` CLI provides infrastructure-as-code management for Google Forms. This document specifies all commands, options, and output formats.

## Installation

```bash
npm install -g iac-google-forms
# or
pnpm add -g iac-google-forms
```

## Global Options

| Option            | Alias | Description                                       |
| ----------------- | ----- | ------------------------------------------------- |
| `--help`          | `-h`  | Show help for command                             |
| `--version`       | `-v`  | Show version number                               |
| `--verbose`       |       | Enable verbose output                             |
| `--quiet`         | `-q`  | Suppress non-essential output                     |
| `--no-color`      |       | Disable colored output                            |
| `--config <path>` | `-c`  | Path to config file (default: `gforms.config.ts`) |

---

## Commands

### `gforms init`

Initialize a new gforms project in the current directory.

```bash
gforms init [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `--template <name>` | Starter template (`minimal`, `full`) | `minimal` |
| `--typescript` | Use TypeScript for form definitions | `true` |

**Behavior:**

1. Creates `.gforms/` directory
2. Creates `gforms.config.ts` with default settings
3. Creates `forms/` directory with example form
4. Initializes `.gforms/state.json`

**Output:**

```
✓ Created .gforms/state.json
✓ Created gforms.config.ts
✓ Created forms/example.ts

Project initialized! Next steps:
  1. Run 'gforms auth login' to authenticate
  2. Edit forms/example.ts to define your form
  3. Run 'gforms deploy forms/example.ts' to deploy
```

**Exit Codes:**
| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Directory not empty (use --force to override) |

---

### `gforms auth login`

Authenticate with Google using OAuth 2.0.

```bash
gforms auth login [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--no-browser` | Print URL instead of opening browser |
| `--force` | Re-authenticate even if already logged in |

**Behavior:**

1. Starts local server on random port
2. Opens browser to Google consent screen
3. Receives OAuth code via redirect
4. Exchanges code for tokens
5. Stores tokens in `~/.gforms/credentials.json`

**Output:**

```
Opening browser for Google authentication...

✓ Authenticated as alex.chen@company.com
  Scopes: forms.body, spreadsheets, drive.file

Credentials saved to ~/.gforms/credentials.json
```

**Exit Codes:**
| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Authentication failed or cancelled |

---

### `gforms auth logout`

Remove stored credentials.

```bash
gforms auth logout
```

**Output:**

```
✓ Credentials removed from ~/.gforms/credentials.json
```

---

### `gforms auth status`

Show current authentication status.

```bash
gforms auth status
```

**Output (authenticated):**

```
Authentication Status
─────────────────────
Method:    OAuth 2.0
Email:     alex.chen@company.com
Expires:   2024-01-15 14:30:00 (in 2 hours)
Scopes:    forms.body, spreadsheets, drive.file
```

**Output (service account):**

```
Authentication Status
─────────────────────
Method:    Service Account
Email:     gforms-sa@project.iam.gserviceaccount.com
Key File:  /path/to/key.json
Scopes:    forms.body, spreadsheets, drive.file
```

**Output (not authenticated):**

```
Not authenticated. Run 'gforms auth login' to authenticate.
```

---

### `gforms diff <file>`

Show differences between local form definition and deployed form.

```bash
gforms diff <file> [options]
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `file` | Path to form definition file |

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `--format <fmt>` | Output format (`console`, `markdown`, `json`) | `console` |
| `--ci` | CI mode: exit 1 if changes, markdown output | `false` |

**Output (console format):**

```
Comparing forms/feedback.ts with remote form...

Form: Customer Feedback (ID: 1Bxi...upms)

~ Title: "Customer Feedback" → "Customer Feedback Form"

Questions:
  ~ [satisfaction] Modified
    - maxLabel: "Very Satisfied" → "Extremely Satisfied"
  + [comments] Added
    type: text, paragraph: true
  - [legacy_field] Removed

Integrations:
  ~ [sheets] Modified
    - spreadsheetName: "Responses" → "Feedback Responses"

Summary: 1 modified, 1 added, 1 removed
```

**Output (markdown format):**

```markdown
## Form Diff: Customer Feedback

| Change   | Item         | Details                                        |
| -------- | ------------ | ---------------------------------------------- |
| Modified | Title        | "Customer Feedback" → "Customer Feedback Form" |
| Modified | satisfaction | maxLabel changed                               |
| Added    | comments     | text (paragraph)                               |
| Removed  | legacy_field | -                                              |

**Summary:** 1 modified, 1 added, 1 removed
```

**Output (json format):**

```json
{
  "status": "modified",
  "hasChanges": true,
  "questions": [...],
  "integrations": [...],
  "summary": { "modified": 1, "added": 1, "removed": 1 }
}
```

**Exit Codes:**
| Code | Meaning |
|------|---------|
| 0 | No changes (or changes exist in non-CI mode) |
| 1 | Changes detected (CI mode only) |
| 2 | Error (auth, network, validation) |

---

### `gforms deploy <file>`

Deploy a form definition to Google Forms.

```bash
gforms deploy <file> [options]
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `file` | Path to form definition file |

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `--auto-approve` | Skip confirmation prompt | `false` |
| `--dry-run` | Show diff without deploying | `false` |

**Behavior:**

1. Load and validate form definition
2. Check state file for existing form ID
3. Authenticate with Google
4. If new form: create form
5. If existing form: calculate diff, show changes
6. Prompt for confirmation (unless --auto-approve)
7. Apply changes via Forms API
8. Set up integrations (Sheets, etc.)
9. Update state file

**Output (new form):**

```
Deploying forms/feedback.ts...

This will create a new Google Form:
  Title: Customer Feedback
  Questions: 5
  Integrations: sheets

Proceed? [y/N] y

✓ Form created successfully!

  Form URL:      https://docs.google.com/forms/d/1Bxi.../edit
  Response URL:  https://docs.google.com/forms/d/1Bxi.../viewform
  Spreadsheet:   https://docs.google.com/spreadsheets/d/1abc.../edit

State saved to .gforms/state.json
```

**Output (update existing):**

```
Deploying forms/feedback.ts...

Changes to apply:
  ~ Title: "Customer Feedback" → "Customer Feedback v2"
  + [new_question] text question
  ~ [satisfaction] maxLabel changed

Proceed? [y/N] y

✓ Form updated successfully!

  Form URL: https://docs.google.com/forms/d/1Bxi.../edit
  Applied: 3 changes

State saved to .gforms/state.json
```

**Exit Codes:**
| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Deployment failed |
| 2 | Validation error |
| 3 | User cancelled |

---

### `gforms validate <file>`

Validate a form definition without deploying.

```bash
gforms validate <file> [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--strict` | Treat warnings as errors |

**Output (valid):**

```
✓ forms/feedback.ts is valid

  Title: Customer Feedback
  Questions: 5
  Integrations: 1 (sheets)
```

**Output (invalid):**

```
✗ forms/feedback.ts has errors

  Error at questions[2].options:
    Array must have at least 1 item

  Error at integrations[0].to:
    Invalid email format: "not-an-email"

2 errors found
```

**Exit Codes:**
| Code | Meaning |
|------|---------|
| 0 | Valid |
| 1 | Validation errors |

---

### `gforms list`

List all forms tracked in the state file.

```bash
gforms list [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--format <fmt>` | Output format (`table`, `json`) |

**Output:**

```
Tracked Forms
─────────────────────────────────────────────────────────────────
File                    Form ID           Last Deployed
─────────────────────────────────────────────────────────────────
forms/feedback.ts       1BxiMVs0XRA5...   2024-01-15 10:30:00
forms/survey.ts         1CyjNWt1YSB6...   2024-01-14 09:15:00
forms/new-form.ts       (not deployed)    -
─────────────────────────────────────────────────────────────────
```

---

### `gforms destroy <file>`

Remove a form from Google and clear state.

```bash
gforms destroy <file> [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--auto-approve` | Skip confirmation |
| `--keep-remote` | Only clear local state, don't delete from Google |

**Output:**

```
This will permanently delete:
  Form: Customer Feedback (1BxiMVs0XRA5...)
  Linked Spreadsheet: Feedback Responses (1abc...)

This action cannot be undone. Proceed? [y/N] y

✓ Form deleted from Google
✓ Spreadsheet deleted from Google
✓ State cleared for forms/feedback.ts
```

**Exit Codes:**
| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Deletion failed |
| 3 | User cancelled |

---

## Environment Variables

| Variable                         | Description                                   |
| -------------------------------- | --------------------------------------------- |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account key (for CI)          |
| `GFORMS_CONFIG`                  | Path to config file                           |
| `GFORMS_STATE_DIR`               | Directory for state file (default: `.gforms`) |
| `NO_COLOR`                       | Disable colored output                        |
| `CI`                             | Enables CI mode behaviors                     |

---

## Configuration File

`gforms.config.ts`:

```typescript
import { defineConfig } from 'iac-google-forms';

export default defineConfig({
  // Default form settings applied to all forms
  defaults: {
    settings: {
      collectEmail: false,
      limitOneResponse: false,
    },
  },

  // OAuth client credentials (for local dev)
  oauth: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },

  // State file location
  stateDir: '.gforms',
});
```

---

## Error Messages

| Error               | Cause                    | Resolution                                            |
| ------------------- | ------------------------ | ----------------------------------------------------- |
| `Not authenticated` | No credentials found     | Run `gforms auth login`                               |
| `Token expired`     | OAuth token expired      | Run `gforms auth login`                               |
| `Form not found`    | Form deleted externally  | Remove from state with `gforms destroy --keep-remote` |
| `Permission denied` | Insufficient scopes      | Re-authenticate with required scopes                  |
| `Validation failed` | Invalid form definition  | Fix errors shown in output                            |
| `Conflict detected` | Form modified externally | Run `gforms diff` to review, then redeploy            |
