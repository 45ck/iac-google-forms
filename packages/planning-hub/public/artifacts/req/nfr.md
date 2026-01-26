# Non-Functional Requirements (NFR)

## Overview

This document specifies the non-functional requirements for iac-google-forms, organized by ISO/IEC 25010 quality characteristics.

---

## 1. Performance

### NFR-PERF-001: CLI Response Time

**Requirement:** Local operations (validate, diff with cached data) must complete within 2 seconds.

| Metric                 | Target | Measurement                          |
| ---------------------- | ------ | ------------------------------------ |
| `gforms validate`      | <500ms | Time from command to output          |
| `gforms diff` (cached) | <1s    | Time with cached remote data         |
| `gforms diff` (fetch)  | <5s    | Time including API call              |
| `gforms deploy`        | <10s   | Time for typical form (10 questions) |

### NFR-PERF-002: Memory Usage

**Requirement:** CLI must not exceed 256MB heap memory during normal operations.

### NFR-PERF-003: Startup Time

**Requirement:** CLI must be ready to accept commands within 500ms of invocation.

---

## 2. Reliability

### NFR-REL-001: Error Recovery

**Requirement:** All operations must be idempotent and recoverable from interruption.

| Scenario                    | Expected Behavior              |
| --------------------------- | ------------------------------ |
| Network failure mid-deploy  | State not corrupted; can retry |
| Process killed during write | State file remains valid       |
| API rate limit hit          | Automatic retry with backoff   |

### NFR-REL-002: Data Integrity

**Requirement:** State file must never become corrupted or contain inconsistent data.

- Content hash must match deployed form
- Form IDs must be valid Google resource IDs
- Timestamps must be valid ISO 8601

### NFR-REL-003: Graceful Degradation

**Requirement:** CLI must provide helpful error messages when external services are unavailable.

---

## 3. Security

### NFR-SEC-001: Credential Protection

**Requirement:** Credentials must never be exposed in logs, error messages, or stack traces.

| Data                 | Protection                                |
| -------------------- | ----------------------------------------- |
| OAuth tokens         | File permissions 600, masked in output    |
| Service account keys | Never copied, user-managed                |
| API responses        | Sensitive fields redacted in verbose mode |

### NFR-SEC-002: Secure Communication

**Requirement:** All external communication must use TLS 1.2 or higher.

### NFR-SEC-003: Minimal Permissions

**Requirement:** Request only the OAuth scopes necessary for operation.

### NFR-SEC-004: Input Validation

**Requirement:** All user input must be validated before use.

- Form definitions validated against JSON Schema
- File paths sanitized (no path traversal)
- URLs validated before fetch

---

## 4. Maintainability

### NFR-MAINT-001: Code Complexity

**Requirement:** No function may exceed cyclomatic complexity of 10.

### NFR-MAINT-002: Test Coverage

**Requirement:** Code coverage must meet the following thresholds:

| Metric             | Threshold |
| ------------------ | --------- |
| Statement coverage | ≥95%      |
| Branch coverage    | ≥90%      |
| Function coverage  | ≥95%      |
| Line coverage      | ≥95%      |

### NFR-MAINT-003: Documentation

**Requirement:** All public APIs must have JSDoc documentation.

### NFR-MAINT-004: Dependency Management

**Requirement:** Dependencies must be:

- Locked to exact versions
- Audited for vulnerabilities in CI
- Updated within 30 days of security patches

---

## 5. Portability

### NFR-PORT-001: Platform Support

**Requirement:** CLI must run on:

| Platform | Version                   |
| -------- | ------------------------- |
| Node.js  | 18.x, 20.x, 22.x          |
| Windows  | 10, 11                    |
| macOS    | 12+ (Monterey+)           |
| Linux    | Ubuntu 20.04+, Debian 11+ |

### NFR-PORT-002: No Native Dependencies

**Requirement:** Package must not require native compilation (no node-gyp).

---

## 6. Usability

### NFR-USE-001: Error Messages

**Requirement:** All error messages must include:

1. What went wrong
2. Why it might have happened
3. How to fix it

### NFR-USE-002: Help Text

**Requirement:** All commands must support `--help` with:

- Command description
- All options with descriptions
- Example usage

### NFR-USE-003: Color Support

**Requirement:** CLI must:

- Detect TTY and disable colors when piped
- Respect `NO_COLOR` environment variable
- Support `--no-color` flag

### NFR-USE-004: Exit Codes

**Requirement:** CLI must use consistent exit codes:

| Code | Meaning          |
| ---- | ---------------- |
| 0    | Success          |
| 1    | General failure  |
| 2    | Validation error |
| 3    | User cancelled   |

---

## 7. Compatibility

### NFR-COMPAT-001: Google API Versions

**Requirement:** Support current Google API versions:

| API        | Version |
| ---------- | ------- |
| Forms API  | v1      |
| Sheets API | v4      |
| Drive API  | v3      |

### NFR-COMPAT-002: Backward Compatibility

**Requirement:** State file format changes must be backward compatible or include migration.

### NFR-COMPAT-003: CI/CD Integration

**Requirement:** CLI must work in headless environments:

- No interactive prompts when `--auto-approve` or `CI=true`
- Service account auth without browser
- Machine-readable output formats (JSON, markdown)

---

## 8. Scalability

### NFR-SCALE-001: Form Size

**Requirement:** Support forms with:

| Limit                    | Value |
| ------------------------ | ----- |
| Max questions            | 200   |
| Max sections             | 50    |
| Max options per question | 100   |
| Max integrations         | 10    |

### NFR-SCALE-002: Project Size

**Requirement:** Support projects with:

| Limit                | Value |
| -------------------- | ----- |
| Max form definitions | 100   |
| Max state file size  | 1MB   |

---

## Traceability

| NFR ID        | Related Use Cases | Test Coverage     |
| ------------- | ----------------- | ----------------- |
| NFR-PERF-001  | All               | Performance tests |
| NFR-PERF-002  | All               | Memory profiling  |
| NFR-REL-001   | UC-003 Deploy     | Integration tests |
| NFR-REL-002   | All               | Unit tests        |
| NFR-SEC-001   | UC-004 Auth       | Security review   |
| NFR-SEC-002   | All               | Integration tests |
| NFR-MAINT-001 | N/A               | ESLint rules      |
| NFR-MAINT-002 | N/A               | CI coverage       |
| NFR-PORT-001  | All               | CI matrix         |
| NFR-USE-001   | All               | Manual review     |
