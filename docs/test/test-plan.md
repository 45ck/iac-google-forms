# Test Plan

## Overview

This document details the test cases for iac-google-forms, organized by feature area and test level.

## Test Scope

### In Scope

- All CLI commands
- Form definition validation
- Diff engine
- State management
- Authentication flows
- Google API interactions (mocked)
- Error handling

### Out of Scope

- Google API internal behavior
- Network infrastructure
- Browser behavior (OAuth flow)

---

## Test Environments

| Environment | Purpose             | Configuration              |
| ----------- | ------------------- | -------------------------- |
| Local       | Developer testing   | Node.js 20, mocked APIs    |
| CI          | Automated testing   | Node.js 18/20/22 matrix    |
| E2E         | Integration testing | Real Google APIs (staging) |

---

## Test Cases by Feature

### 1. Form Definition Validation

#### TC-VAL-001: Valid minimal form

| Field            | Value                                                                     |
| ---------------- | ------------------------------------------------------------------------- |
| **Precondition** | Form with title and 1 question                                            |
| **Input**        | `{ title: "Test", questions: [{ id: "q1", type: "text", title: "Q1" }] }` |
| **Expected**     | Validation passes                                                         |
| **Priority**     | High                                                                      |

#### TC-VAL-002: Missing title

| Field            | Value                      |
| ---------------- | -------------------------- |
| **Precondition** | Form without title         |
| **Input**        | `{ questions: [...] }`     |
| **Expected**     | Error: "title is required" |
| **Priority**     | High                       |

#### TC-VAL-003: Empty questions array

| Field            | Value                                        |
| ---------------- | -------------------------------------------- |
| **Precondition** | Form with empty questions                    |
| **Input**        | `{ title: "Test", questions: [] }`           |
| **Expected**     | Error: "questions must have at least 1 item" |
| **Priority**     | High                                         |

#### TC-VAL-004: Invalid question ID format

| Field            | Value                          |
| ---------------- | ------------------------------ |
| **Precondition** | Question ID starts with number |
| **Input**        | `{ id: "123abc", ... }`        |
| **Expected**     | Error: "id must match pattern" |
| **Priority**     | Medium                         |

#### TC-VAL-005: Duplicate question IDs

| Field            | Value                                         |
| ---------------- | --------------------------------------------- |
| **Precondition** | Two questions with same ID                    |
| **Input**        | `{ questions: [{ id: "q1" }, { id: "q1" }] }` |
| **Expected**     | Error: "duplicate question id"                |
| **Priority**     | High                                          |

#### TC-VAL-006: All question types valid

| Field            | Value                                         |
| ---------------- | --------------------------------------------- |
| **Precondition** | Form with all 6 question types                |
| **Input**        | text, email, choice, dropdown, scale, section |
| **Expected**     | Validation passes for all                     |
| **Priority**     | High                                          |

#### TC-VAL-007: Scale question bounds

| Field            | Value                                 |
| ---------------- | ------------------------------------- |
| **Precondition** | Scale with invalid min/max            |
| **Input**        | `{ type: "scale", min: 5, max: 3 }`   |
| **Expected**     | Error: "max must be greater than min" |
| **Priority**     | Medium                                |

#### TC-VAL-008: Invalid email in integration

| Field            | Value                                     |
| ---------------- | ----------------------------------------- |
| **Precondition** | Email integration with invalid address    |
| **Input**        | `{ type: "email", to: ["not-an-email"] }` |
| **Expected**     | Error: "invalid email format"             |
| **Priority**     | Medium                                    |

---

### 2. Diff Engine

#### TC-DIFF-001: New form (no remote)

| Field            | Value                                 |
| ---------------- | ------------------------------------- |
| **Precondition** | Local form, no remote exists          |
| **Expected**     | `{ status: "new", hasChanges: true }` |
| **Priority**     | High                                  |

#### TC-DIFF-002: No changes

| Field            | Value                                        |
| ---------------- | -------------------------------------------- |
| **Precondition** | Local matches remote                         |
| **Expected**     | `{ status: "unchanged", hasChanges: false }` |
| **Priority**     | High                                         |

#### TC-DIFF-003: Title changed

| Field            | Value                      |
| ---------------- | -------------------------- |
| **Precondition** | Title differs              |
| **Expected**     | Diff includes title change |
| **Priority**     | High                       |

#### TC-DIFF-004: Question added

| Field            | Value                                               |
| ---------------- | --------------------------------------------------- |
| **Precondition** | Local has question not in remote                    |
| **Expected**     | `questions: [{ action: "add", questionId: "new" }]` |
| **Priority**     | High                                                |

#### TC-DIFF-005: Question removed

| Field            | Value                                                  |
| ---------------- | ------------------------------------------------------ |
| **Precondition** | Remote has question not in local                       |
| **Expected**     | `questions: [{ action: "remove", questionId: "old" }]` |
| **Priority**     | High                                                   |

#### TC-DIFF-006: Question modified

| Field            | Value                                                   |
| ---------------- | ------------------------------------------------------- |
| **Precondition** | Question property changed                               |
| **Expected**     | `questions: [{ action: "modify", changes: ["title"] }]` |
| **Priority**     | High                                                    |

#### TC-DIFF-007: Integration added

| Field            | Value                               |
| ---------------- | ----------------------------------- |
| **Precondition** | Local has new integration           |
| **Expected**     | `integrations: [{ action: "add" }]` |
| **Priority**     | Medium                              |

#### TC-DIFF-008: Question order changed

| Field            | Value                           |
| ---------------- | ------------------------------- |
| **Precondition** | Same questions, different order |
| **Expected**     | Diff detects reorder            |
| **Priority**     | Medium                          |

---

### 3. State Management

#### TC-STATE-001: Create state file

| Field            | Value                                  |
| ---------------- | -------------------------------------- |
| **Precondition** | No state file exists                   |
| **Action**       | Save form state                        |
| **Expected**     | State file created with correct schema |
| **Priority**     | High                                   |

#### TC-STATE-002: Update existing state

| Field            | Value                                |
| ---------------- | ------------------------------------ |
| **Precondition** | State file exists                    |
| **Action**       | Update form state                    |
| **Expected**     | State updated, other forms preserved |
| **Priority**     | High                                 |

#### TC-STATE-003: Load state file

| Field            | Value                   |
| ---------------- | ----------------------- |
| **Precondition** | Valid state file exists |
| **Action**       | Load state              |
| **Expected**     | State loaded correctly  |
| **Priority**     | High                    |

#### TC-STATE-004: Handle corrupted state

| Field            | Value                      |
| ---------------- | -------------------------- |
| **Precondition** | Invalid JSON in state file |
| **Action**       | Load state                 |
| **Expected**     | Error with helpful message |
| **Priority**     | Medium                     |

#### TC-STATE-005: Remove form from state

| Field            | Value                      |
| ---------------- | -------------------------- |
| **Precondition** | Form exists in state       |
| **Action**       | Remove form                |
| **Expected**     | Form removed, file updated |
| **Priority**     | Medium                     |

---

### 4. Authentication

#### TC-AUTH-001: OAuth login success

| Field            | Value                            |
| ---------------- | -------------------------------- |
| **Precondition** | No existing credentials          |
| **Action**       | Complete OAuth flow              |
| **Expected**     | Tokens saved to credentials file |
| **Priority**     | High                             |

#### TC-AUTH-002: OAuth token refresh

| Field            | Value                                     |
| ---------------- | ----------------------------------------- |
| **Precondition** | Expired access token, valid refresh token |
| **Action**       | Request access token                      |
| **Expected**     | New token obtained automatically          |
| **Priority**     | High                                      |

#### TC-AUTH-003: Service account auth

| Field            | Value                              |
| ---------------- | ---------------------------------- |
| **Precondition** | GOOGLE_APPLICATION_CREDENTIALS set |
| **Action**       | Get auth client                    |
| **Expected**     | Service account client returned    |
| **Priority**     | High                               |

#### TC-AUTH-004: No credentials available

| Field            | Value                             |
| ---------------- | --------------------------------- |
| **Precondition** | No tokens, no env var             |
| **Action**       | Get auth client                   |
| **Expected**     | AuthError with login instructions |
| **Priority**     | High                              |

#### TC-AUTH-005: Invalid service account key

| Field            | Value                      |
| ---------------- | -------------------------- |
| **Precondition** | Malformed key file         |
| **Action**       | Get auth client            |
| **Expected**     | Error with helpful message |
| **Priority**     | Medium                     |

#### TC-AUTH-006: Logout clears credentials

| Field            | Value                    |
| ---------------- | ------------------------ |
| **Precondition** | Credentials exist        |
| **Action**       | Logout                   |
| **Expected**     | Credentials file deleted |
| **Priority**     | Medium                   |

---

### 5. CLI Commands

#### TC-CLI-001: gforms init creates structure

| Field            | Value                                                |
| ---------------- | ---------------------------------------------------- |
| **Precondition** | Empty directory                                      |
| **Action**       | `gforms init`                                        |
| **Expected**     | .gforms/, gforms.config.ts, forms/example.ts created |
| **Priority**     | High                                                 |

#### TC-CLI-002: gforms validate valid file

| Field            | Value                           |
| ---------------- | ------------------------------- |
| **Precondition** | Valid form definition           |
| **Action**       | `gforms validate forms/test.ts` |
| **Expected**     | Success message, exit code 0    |
| **Priority**     | High                            |

#### TC-CLI-003: gforms validate invalid file

| Field            | Value                          |
| ---------------- | ------------------------------ |
| **Precondition** | Invalid form definition        |
| **Action**       | `gforms validate forms/bad.ts` |
| **Expected**     | Error messages, exit code 2    |
| **Priority**     | High                           |

#### TC-CLI-004: gforms diff new form

| Field            | Value                      |
| ---------------- | -------------------------- |
| **Precondition** | Form not yet deployed      |
| **Action**       | `gforms diff forms/new.ts` |
| **Expected**     | Shows "new form" message   |
| **Priority**     | High                       |

#### TC-CLI-005: gforms diff markdown output

| Field            | Value                                         |
| ---------------- | --------------------------------------------- |
| **Precondition** | Form with changes                             |
| **Action**       | `gforms diff forms/test.ts --format markdown` |
| **Expected**     | Markdown table output                         |
| **Priority**     | Medium                                        |

#### TC-CLI-006: gforms deploy dry-run

| Field            | Value                                   |
| ---------------- | --------------------------------------- |
| **Precondition** | Valid form                              |
| **Action**       | `gforms deploy forms/test.ts --dry-run` |
| **Expected**     | Shows changes, no API calls             |
| **Priority**     | High                                    |

#### TC-CLI-007: gforms deploy auto-approve

| Field            | Value                                        |
| ---------------- | -------------------------------------------- |
| **Precondition** | Valid form, authenticated                    |
| **Action**       | `gforms deploy forms/test.ts --auto-approve` |
| **Expected**     | Deploys without prompt                       |
| **Priority**     | High                                         |

#### TC-CLI-008: gforms list shows forms

| Field            | Value                  |
| ---------------- | ---------------------- |
| **Precondition** | State file with forms  |
| **Action**       | `gforms list`          |
| **Expected**     | Table of tracked forms |
| **Priority**     | Medium                 |

#### TC-CLI-009: gforms help shows usage

| Field            | Value                       |
| ---------------- | --------------------------- |
| **Precondition** | None                        |
| **Action**       | `gforms --help`             |
| **Expected**     | Help text with all commands |
| **Priority**     | Medium                      |

#### TC-CLI-010: gforms version shows version

| Field            | Value              |
| ---------------- | ------------------ |
| **Precondition** | None               |
| **Action**       | `gforms --version` |
| **Expected**     | Version number     |
| **Priority**     | Low                |

---

### 6. Error Handling

#### TC-ERR-001: Network failure

| Field            | Value                         |
| ---------------- | ----------------------------- |
| **Precondition** | Network unavailable           |
| **Action**       | `gforms deploy`               |
| **Expected**     | Helpful network error message |
| **Priority**     | High                          |

#### TC-ERR-002: API rate limit

| Field            | Value              |
| ---------------- | ------------------ |
| **Precondition** | API returns 429    |
| **Action**       | Any API operation  |
| **Expected**     | Retry with backoff |
| **Priority**     | High               |

#### TC-ERR-003: Form not found

| Field            | Value                                     |
| ---------------- | ----------------------------------------- |
| **Precondition** | State has form ID, form deleted on Google |
| **Action**       | `gforms diff`                             |
| **Expected**     | Error suggesting destroy --keep-remote    |
| **Priority**     | Medium                                    |

#### TC-ERR-004: Permission denied

| Field            | Value                     |
| ---------------- | ------------------------- |
| **Precondition** | Insufficient OAuth scopes |
| **Action**       | API operation             |
| **Expected**     | Error suggesting re-login |
| **Priority**     | Medium                    |

---

## Test Execution

### Unit Tests

```bash
pnpm test:unit
```

### Integration Tests

```bash
pnpm test:integration
```

### E2E Tests (requires credentials)

```bash
GOOGLE_APPLICATION_CREDENTIALS=./key.json pnpm test:e2e
```

### Full Test Suite

```bash
pnpm test
```

### Coverage Report

```bash
pnpm test:coverage
```

---

## Test Metrics

| Metric                    | Target    | Actual |
| ------------------------- | --------- | ------ |
| Total test cases          | 50+       | TBD    |
| Unit test coverage        | ≥95%      | TBD    |
| Integration test coverage | ≥80%      | TBD    |
| E2E test coverage         | Key flows | TBD    |
| Test execution time       | <60s      | TBD    |
