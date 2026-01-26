# UC-007: Configure Webhooks

## Overview

| Attribute | Value |
|-----------|-------|
| **ID** | UC-007 |
| **Title** | Configure Webhooks |
| **Actor** | System (via Deploy) |
| **Priority** | Should Have |
| **Derived From** | visionary-configure-integrations |

## Goal

Set up webhook integrations to POST form response data to external URLs on submission.

## Preconditions

1. Form definition includes `webhook()` integration
2. External webhook endpoint accessible
3. Form deployed to Google Forms

## Postconditions

1. Webhook trigger configured
2. Submissions will POST to specified URL
3. Payload formatted as specified

## Main Success Scenario

| Step | Actor | Action | System Response |
|------|-------|--------|-----------------|
| 1 | System | Reads webhook config | Config parsed |
| 2 | System | Validates URL format | URL valid |
| 3 | System | Creates Apps Script trigger | Trigger created |
| 4 | System | Deploys webhook handler code | Handler deployed |

## Configuration Options

```typescript
webhook({
  // Required: endpoint URL
  url: 'https://api.company.com/webhooks/forms',

  // Optional: HTTP method (default: POST)
  method: 'POST',

  // Optional: custom headers
  headers: {
    'Authorization': 'Bearer ${WEBHOOK_TOKEN}',
    'Content-Type': 'application/json',
  },

  // Optional: payload template
  payload: {
    source: 'google-forms',
    formId: '${formId}',
    formTitle: '${formTitle}',
    responseId: '${responseId}',
    timestamp: '${submittedAt}',
    responses: '${responses}',
  },

  // Optional: retry configuration
  retry: {
    attempts: 3,
    backoffMs: 1000,
  },
})
```

## Payload Variables

| Variable | Description |
|----------|-------------|
| `${formId}` | Google Form ID |
| `${formTitle}` | Form title |
| `${responseId}` | Unique response ID |
| `${submittedAt}` | ISO timestamp |
| `${responses}` | All responses as JSON object |
| `${responses.fieldId}` | Specific field value |

## Implementation Notes

Google Forms doesn't have native webhook support. Implementation options:
1. **Apps Script**: Deploy script with form trigger (preferred)
2. **Sheets + Apps Script**: Trigger on sheet row addition

## Business Rules

- URL must be HTTPS (HTTP allowed for localhost only)
- Environment variables supported in headers (for secrets)
- Timeout: 30 seconds per request
- Retries: 3 attempts with exponential backoff

## Error Handling

| Error | Behavior |
|-------|----------|
| Invalid URL | Validation error at config time |
| Endpoint unreachable | Log error, continue (async) |
| Non-2xx response | Retry per config, then log |

## Related Use Cases

- UC-003: Deploy Form (parent use case)
