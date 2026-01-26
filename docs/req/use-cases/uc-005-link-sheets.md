# UC-005: Link to Sheets

## Overview

| Attribute | Value |
|-----------|-------|
| **ID** | UC-005 |
| **Title** | Link to Sheets |
| **Actor** | System (via Deploy) |
| **Priority** | Must Have |
| **Derived From** | visionary-configure-integrations |

## Goal

Configure a Google Sheets spreadsheet as the response destination for form submissions.

## Preconditions

1. Form definition includes `sheets()` integration
2. Authenticated with Sheets and Drive scopes
3. Deploy command invoked (UC-003)

## Postconditions

1. Spreadsheet exists (created or existing)
2. Form responses linked to spreadsheet
3. Column headers match form questions

## Main Success Scenario

| Step | Actor | Action | System Response |
|------|-------|--------|-----------------|
| 1 | System | Reads sheets integration config | Config parsed |
| 2 | System | Checks if spreadsheet exists | Existence determined |
| 3a | System | Creates new spreadsheet (if `createIfMissing`) | Sheet created |
| 3b | System | Uses existing spreadsheet (if ID provided) | Sheet found |
| 4 | System | Links form responses to spreadsheet | Linkage created |
| 5 | System | Returns spreadsheet URL | URL available |

## Configuration Options

```typescript
sheets({
  // Option 1: Create new spreadsheet
  spreadsheetName: 'Form Responses',
  createIfMissing: true,

  // Option 2: Use existing spreadsheet
  spreadsheetId: '1ABC123...',

  // Option 3: Create in specific folder
  spreadsheetName: 'Form Responses',
  folderId: '1XYZ789...',
})
```

## Business Rules

- Only one Sheets destination per form (Google Forms limitation)
- Spreadsheet name defaults to form title if not specified
- Columns auto-created based on question IDs
- Timestamp column automatically added

## Error Handling

| Error | Behavior |
|-------|----------|
| Spreadsheet not found | Error with ID, or create if allowed |
| Permission denied | Show which permission needed |
| Already linked to different sheet | Warn and update linkage |

## Related Use Cases

- UC-003: Deploy Form (parent use case)
