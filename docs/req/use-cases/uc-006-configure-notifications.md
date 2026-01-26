# UC-006: Configure Email Notifications

## Overview

| Attribute | Value |
|-----------|-------|
| **ID** | UC-006 |
| **Title** | Configure Email Notifications |
| **Actor** | System (via Deploy) |
| **Priority** | Should Have |
| **Derived From** | visionary-configure-integrations |

## Goal

Set up email notifications to be sent when form responses are submitted.

## Preconditions

1. Form definition includes `emailNotification()` integration
2. Form deployed to Google Forms
3. Valid email addresses provided

## Postconditions

1. Email notification rule created
2. Specified recipients will receive emails on submission
3. Conditional logic applied (if configured)

## Main Success Scenario

| Step | Actor | Action | System Response |
|------|-------|--------|-----------------|
| 1 | System | Reads email notification config | Config parsed |
| 2 | System | Validates email addresses | Addresses valid |
| 3 | System | Creates notification rule via API | Rule created |
| 4 | System | Applies condition filter (if any) | Filter applied |

## Configuration Options

```typescript
emailNotification({
  // Required: recipients
  to: ['team@company.com', 'manager@company.com'],

  // Optional: email subject
  subject: 'New form submission received',

  // Optional: only notify for certain responses
  condition: {
    field: 'urgency',
    equals: 'High',
  },

  // Alternative condition
  condition: {
    field: 'satisfaction',
    in: ['Dissatisfied', 'Very dissatisfied'],
  },
})
```

## Business Rules

- Email addresses must be valid format
- Multiple notifications can be configured (different conditions)
- Conditions reference question IDs from form definition
- Subject defaults to "New response: {form title}"

## Error Handling

| Error | Behavior |
|-------|----------|
| Invalid email format | Validation error at config time |
| Unknown field in condition | Error referencing available fields |
| API error | Retry, then show error |

## Related Use Cases

- UC-003: Deploy Form (parent use case)
- UC-001: Define Form (provides field references)
