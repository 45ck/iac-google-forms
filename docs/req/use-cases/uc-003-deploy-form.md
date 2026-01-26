# UC-003: Deploy Form

## Overview

| Attribute        | Value                                           |
| ---------------- | ----------------------------------------------- |
| **ID**           | UC-003                                          |
| **Title**        | Deploy Form                                     |
| **Actor**        | Platform Engineer, CI/CD System                 |
| **Priority**     | Must Have                                       |
| **Derived From** | visionary-define-form, visionary-preview-deploy |

## Goal

Apply the local form definition to Google Forms, creating or updating the form and its integrations.

## Preconditions

1. Valid form definition exists (TypeScript file)
2. Google API credentials configured with write permissions
3. Network access to Google APIs
4. User has reviewed diff (recommended but not enforced)

## Postconditions

1. Form exists in Google Forms matching local definition
2. Integrations configured (Sheets, email, webhooks)
3. State file updated with form ID mapping
4. URLs displayed for form and linked resources

## Main Success Scenario

| Step | Actor    | Action                                        | System Response      |
| ---- | -------- | --------------------------------------------- | -------------------- |
| 1    | Engineer | Runs `gforms deploy <file>`                   | CLI starts           |
| 2    | System   | Loads and validates form definition           | Config loaded        |
| 3    | System   | Authenticates with Google APIs                | Auth successful      |
| 4    | System   | Calculates diff (same as UC-002)              | Changes determined   |
| 5    | System   | Displays changes and prompts for confirmation | User sees changes    |
| 6    | Engineer | Confirms deployment (Y/Enter)                 | Deployment proceeds  |
| 7    | System   | Creates/updates form via Google Forms API     | Form created/updated |
| 8    | System   | Configures integrations                       | Integrations set up  |
| 9    | System   | Updates local state file                      | State persisted      |
| 10   | System   | Displays success message with URLs            | Complete             |

## Extensions

| Step | Condition          | Action                                     |
| ---- | ------------------ | ------------------------------------------ |
| 2a   | Invalid TypeScript | CLI shows validation errors, exits         |
| 3a   | Auth fails         | CLI shows auth error with fix instructions |
| 4a   | No changes         | CLI shows "No changes to deploy", exits    |
| 6a   | User declines      | CLI exits without changes                  |
| 7a   | API error          | CLI shows error, suggests retry, exits     |
| 7b   | Rate limited       | CLI waits and retries automatically        |
| 8a   | Integration fails  | CLI shows partial success, lists failures  |

## CLI Interface

```bash
# Basic usage (prompts for confirmation)
gforms deploy forms/customer-feedback.ts

# Skip confirmation (for CI/CD)
gforms deploy forms/customer-feedback.ts --yes

# Deploy all forms in directory
gforms deploy forms/ --yes

# Dry run (same as diff)
gforms deploy forms/customer-feedback.ts --dry-run
```

## Output Format

```
$ gforms deploy forms/customer-feedback.ts

📋 Form: Customer Feedback
   Status: MODIFIED

   Changes:
   + [dropdown] referral - How did you hear about us?

   Integrations:
   + Email notification: feedback@company.com

Deploy these changes? [Y/n] Y

⠋ Authenticating...
⠋ Fetching current state...
⠋ Creating questions...
⠋ Configuring integrations...

✓ Added question "How did you hear about us?"
✓ Configured email notification

Form URL: https://docs.google.com/forms/d/e/1FAIp.../viewform
Edit URL: https://docs.google.com/forms/d/1ABC.../edit
Sheet URL: https://docs.google.com/spreadsheets/d/1XYZ...

Done in 3.2s
```

## Business Rules

- Always show diff before applying (unless `--yes`)
- Incremental updates (don't recreate unchanged items)
- Integrations created/updated atomically with form
- State file updated only after successful deployment
- Form ID persisted for future updates

## Error Handling

| Error             | Behavior                           |
| ----------------- | ---------------------------------- |
| Network failure   | Retry 3 times with backoff         |
| Partial success   | Show what succeeded, list failures |
| Rate limit        | Wait and retry automatically       |
| Permission denied | Show which permission is missing   |

## Related Use Cases

- UC-001: Define Form (provides definition)
- UC-002: Diff Form (same diff logic)
- UC-005: Link to Sheets (sub-use case)
- UC-006: Configure Notifications (sub-use case)
- UC-007: Configure Webhooks (sub-use case)
