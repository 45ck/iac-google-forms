# Google API Mapping

## Overview

This document maps iac-google-forms operations to Google API calls. It serves as a reference for implementation and debugging.

## APIs Used

| API                  | Purpose                          | Scopes Required |
| -------------------- | -------------------------------- | --------------- |
| Google Forms API v1  | Create/update forms              | `forms.body`    |
| Google Sheets API v4 | Link responses to sheets         | `spreadsheets`  |
| Google Drive API v3  | Manage file permissions, folders | `drive.file`    |

## Base URLs

```
Forms:  https://forms.googleapis.com/v1
Sheets: https://sheets.googleapis.com/v4
Drive:  https://www.googleapis.com/drive/v3
```

---

## Form Operations

### Create Form

**gforms operation:** `gforms deploy <file>` (new form)

**API Calls:**

1. Create empty form:

```http
POST https://forms.googleapis.com/v1/forms
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "info": {
    "title": "Customer Feedback"
  }
}
```

**Response:**

```json
{
  "formId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "info": {
    "title": "Customer Feedback",
    "documentTitle": "Customer Feedback"
  },
  "revisionId": "00000001",
  "responderUri": "https://docs.google.com/forms/d/e/.../viewform"
}
```

2. Add questions via batch update:

```http
POST https://forms.googleapis.com/v1/forms/{formId}:batchUpdate
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "requests": [
    {
      "createItem": {
        "item": {
          "title": "How satisfied are you?",
          "description": "Rate your experience",
          "questionItem": {
            "question": {
              "required": true,
              "scaleQuestion": {
                "low": 1,
                "high": 5,
                "lowLabel": "Very Unsatisfied",
                "highLabel": "Very Satisfied"
              }
            }
          }
        },
        "location": { "index": 0 }
      }
    }
  ]
}
```

---

### Get Form

**gforms operation:** `gforms diff <file>`, `gforms deploy <file>` (fetch remote)

**API Call:**

```http
GET https://forms.googleapis.com/v1/forms/{formId}
Authorization: Bearer {access_token}
```

**Response:**

```json
{
  "formId": "1BxiMVs0XRA5...",
  "info": {
    "title": "Customer Feedback",
    "description": "Please share your experience"
  },
  "settings": {
    "quizSettings": { "isQuiz": false }
  },
  "revisionId": "00000005",
  "responderUri": "https://docs.google.com/forms/d/e/.../viewform",
  "items": [
    {
      "itemId": "abc123",
      "title": "How satisfied are you?",
      "questionItem": {
        "question": {
          "questionId": "xyz789",
          "required": true,
          "scaleQuestion": {
            "low": 1,
            "high": 5,
            "lowLabel": "Very Unsatisfied",
            "highLabel": "Very Satisfied"
          }
        }
      }
    }
  ]
}
```

---

### Update Form

**gforms operation:** `gforms deploy <file>` (existing form with changes)

**API Call:**

```http
POST https://forms.googleapis.com/v1/forms/{formId}:batchUpdate
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "requests": [
    {
      "updateItem": {
        "item": {
          "itemId": "abc123",
          "title": "How satisfied are you? (Updated)",
          "questionItem": {
            "question": {
              "questionId": "xyz789",
              "required": true,
              "scaleQuestion": {
                "low": 1,
                "high": 10,
                "lowLabel": "Poor",
                "highLabel": "Excellent"
              }
            }
          }
        },
        "location": { "index": 0 },
        "updateMask": "title,questionItem.question.scaleQuestion"
      }
    }
  ]
}
```

---

### Delete Form

**gforms operation:** `gforms destroy <file>`

**API Call:**

```http
DELETE https://www.googleapis.com/drive/v3/files/{formId}
Authorization: Bearer {access_token}
```

Note: Forms API doesn't have a delete endpoint. We use Drive API to trash the file.

---

## Question Type Mapping

| gforms Type                | Google Forms API Type                 |
| -------------------------- | ------------------------------------- |
| `text` (paragraph: false)  | `textQuestion`                        |
| `text` (paragraph: true)   | `textQuestion` with `paragraph: true` |
| `email`                    | `textQuestion` with email validation  |
| `choice` (multiple: false) | `choiceQuestion` type `RADIO`         |
| `choice` (multiple: true)  | `choiceQuestion` type `CHECKBOX`      |
| `dropdown`                 | `choiceQuestion` type `DROP_DOWN`     |
| `scale`                    | `scaleQuestion`                       |
| `section`                  | `pageBreakItem`                       |

### Text Question

**gforms:**

```typescript
{
  type: 'text',
  id: 'feedback',
  title: 'Any additional feedback?',
  paragraph: true,
  maxLength: 500
}
```

**Google API:**

```json
{
  "title": "Any additional feedback?",
  "questionItem": {
    "question": {
      "textQuestion": {
        "paragraph": true
      }
    }
  }
}
```

### Choice Question (Radio)

**gforms:**

```typescript
{
  type: 'choice',
  id: 'department',
  title: 'Which department?',
  options: ['Sales', 'Support', 'Engineering'],
  allowOther: true
}
```

**Google API:**

```json
{
  "title": "Which department?",
  "questionItem": {
    "question": {
      "choiceQuestion": {
        "type": "RADIO",
        "options": [{ "value": "Sales" }, { "value": "Support" }, { "value": "Engineering" }],
        "shuffle": false
      }
    }
  }
}
```

### Scale Question

**gforms:**

```typescript
{
  type: 'scale',
  id: 'nps',
  title: 'How likely to recommend?',
  min: 0,
  max: 10,
  minLabel: 'Not likely',
  maxLabel: 'Very likely'
}
```

**Google API:**

```json
{
  "title": "How likely to recommend?",
  "questionItem": {
    "question": {
      "scaleQuestion": {
        "low": 0,
        "high": 10,
        "lowLabel": "Not likely",
        "highLabel": "Very likely"
      }
    }
  }
}
```

---

## Sheets Integration

### Link Form to New Spreadsheet

**gforms operation:** `gforms deploy <file>` with sheets integration

**API Calls:**

1. Create spreadsheet:

```http
POST https://sheets.googleapis.com/v4/spreadsheets
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "properties": {
    "title": "Form Responses"
  }
}
```

2. Link form responses:

```http
POST https://forms.googleapis.com/v1/forms/{formId}:batchUpdate
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "requests": [
    {
      "updateSettings": {
        "settings": {
          "responseSettings": {
            "responseDestination": {
              "type": "SPREADSHEET",
              "spreadsheet": {
                "spreadsheetId": "{spreadsheetId}"
              }
            }
          }
        },
        "updateMask": "responseSettings.responseDestination"
      }
    }
  ]
}
```

3. Move to folder (optional):

```http
POST https://www.googleapis.com/drive/v3/files/{spreadsheetId}/parents
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "parents": ["{folderId}"]
}
```

---

## Authentication

### OAuth 2.0 Token Exchange

**gforms operation:** `gforms auth login`

```http
POST https://oauth2.googleapis.com/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code={auth_code}
&client_id={client_id}
&client_secret={client_secret}
&redirect_uri=http://localhost:{port}/callback
&code_verifier={pkce_verifier}
```

### Token Refresh

```http
POST https://oauth2.googleapis.com/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token={refresh_token}
&client_id={client_id}
&client_secret={client_secret}
```

### Service Account JWT

```http
POST https://oauth2.googleapis.com/token
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer
&assertion={signed_jwt}
```

JWT payload:

```json
{
  "iss": "service-account@project.iam.gserviceaccount.com",
  "scope": "https://www.googleapis.com/auth/forms.body https://www.googleapis.com/auth/spreadsheets",
  "aud": "https://oauth2.googleapis.com/token",
  "iat": 1704067200,
  "exp": 1704070800
}
```

---

## Rate Limits

| API        | Limit         | Per                      |
| ---------- | ------------- | ------------------------ |
| Forms API  | 300 requests  | per minute per user      |
| Sheets API | 100 requests  | per 100 seconds per user |
| Drive API  | 1000 requests | per 100 seconds per user |

### Retry Strategy

```typescript
const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableStatuses: [429, 500, 502, 503, 504],
};
```

---

## Error Codes

| HTTP Status | Google Error         | gforms Error                      |
| ----------- | -------------------- | --------------------------------- |
| 401         | `UNAUTHENTICATED`    | `AuthError`                       |
| 403         | `PERMISSION_DENIED`  | `AuthError` (insufficient scopes) |
| 404         | `NOT_FOUND`          | `ApiError` (form deleted)         |
| 429         | `RESOURCE_EXHAUSTED` | `ApiError` (retry)                |
| 409         | `ABORTED`            | `ConflictError`                   |
