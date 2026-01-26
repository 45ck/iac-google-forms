# UC-002: Diff Form

## Overview

| Attribute | Value |
|-----------|-------|
| **ID** | UC-002 |
| **Title** | Diff Form |
| **Actor** | Platform Engineer, CI/CD System |
| **Priority** | Must Have |
| **Derived From** | visionary-preview-deploy |

## Goal

Compare local form definition against the current state in Google Forms and display the differences.

## Preconditions

1. Valid form definition exists (TypeScript file)
2. Google API credentials configured
3. Network access to Google APIs

## Postconditions

1. Diff output displayed showing:
   - New form (if doesn't exist in Google)
   - Changed questions (added, modified, removed)
   - Changed integrations
2. No changes made to Google Forms

## Main Success Scenario

| Step | Actor | Action | System Response |
|------|-------|--------|-----------------|
| 1 | Engineer | Runs `gforms diff <file>` | CLI starts |
| 2 | System | Loads and validates form definition | Config loaded |
| 3 | System | Authenticates with Google APIs | Auth successful |
| 4 | System | Fetches current form state (if exists) | Remote state retrieved |
| 5 | System | Compares local vs remote | Diff calculated |
| 6 | System | Displays formatted diff output | Diff shown to user |

## Extensions

| Step | Condition | Action |
|------|-----------|--------|
| 2a | Invalid TypeScript | CLI shows validation errors, exits |
| 3a | Auth fails | CLI shows auth error with fix instructions |
| 4a | Form doesn't exist | CLI shows "NEW" form, lists all questions |
| 4b | Network error | CLI shows error, suggests retry |
| 5a | No changes | CLI shows "No changes detected" |

## CLI Interface

```bash
# Basic usage
gforms diff forms/customer-feedback.ts

# Diff all forms in directory
gforms diff forms/

# Output format options
gforms diff forms/customer-feedback.ts --format=json
gforms diff forms/customer-feedback.ts --format=markdown

# CI mode (exit code based on changes)
gforms diff forms/customer-feedback.ts --ci
```

## Output Format

```
📋 Form: Customer Feedback
   Status: MODIFIED
   Form ID: 1ABC123...

   Questions:
   ~ [email]    email - Your email address (no changes)
   ~ [text]     name - Your name (no changes)
   + [dropdown] referral - How did you hear about us? (NEW)
   - [text]     old_field - Removed field (REMOVED)
   ~ [choice]   satisfaction - Rating changed options (MODIFIED)

   Integrations:
   ~ Google Sheets: unchanged
   + Email notification: NEW

   Summary:
   - 1 question added
   - 1 question modified
   - 1 question removed
   - 1 integration added
```

## Business Rules

- Diff is read-only (never modifies remote)
- Must authenticate before fetching remote state
- State file (`.gforms/state.json`) maps local files to form IDs
- Exit code 0 = no changes, 1 = changes exist (for CI)

## Related Use Cases

- UC-001: Define Form (creates definition to diff)
- UC-003: Deploy Form (applies diff)
- UC-004: Configure Authentication (required for API access)
