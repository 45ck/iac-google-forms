# Requirements Traceability Matrix (RTM)

## Overview

This matrix traces requirements from scenarios through use cases to implementation artifacts, ensuring complete coverage.

## Traceability Summary

| Metric          | Count                      |
| --------------- | -------------------------- |
| Scenarios       | 6 (2 As-Is, 4 Visionary)   |
| Use Cases       | 7                          |
| Domain Entities | 18                         |
| API Endpoints   | 12 CLI commands            |
| Test Categories | 3 (Unit, Integration, E2E) |

---

## Scenario → Use Case Mapping

| Scenario                         | Related Use Cases      |
| -------------------------------- | ---------------------- |
| AS-001: Manual Form Creation     | UC-001, UC-002, UC-003 |
| AS-002: Form Update Process      | UC-002, UC-003         |
| VS-001: Define New Form          | UC-001                 |
| VS-002: Preview and Deploy       | UC-002, UC-003         |
| VS-003: Configure Integrations   | UC-005, UC-006, UC-007 |
| VS-004: Version Control Workflow | UC-002, UC-003, UC-004 |

---

## Use Case → Artifact Mapping

### UC-001: Define Form as Code

| Artifact Type    | Artifact                       | Location                                      |
| ---------------- | ------------------------------ | --------------------------------------------- |
| Domain Model     | FormDefinition, Question types | `docs/arch/domain-model/`                     |
| Data Schema      | form-definition.schema.json    | `docs/arch/data-model/schemas/`               |
| TypeScript Types | FormDefinition, Question       | `docs/arch/data-model/typescript/`            |
| CLI Command      | `gforms validate`              | `docs/arch/api-contract/cli-specification.md` |
| Examples         | form-definition-examples.md    | `docs/ux/cli-design/`                         |

### UC-002: Diff Form Changes

| Artifact Type    | Artifact                 | Location                                       |
| ---------------- | ------------------------ | ---------------------------------------------- |
| Domain Model     | DiffResult, QuestionDiff | `docs/arch/domain-model/`                      |
| Sequence Diagram | diff-sequence.mmd        | `docs/arch/domain-model/sequence-diagrams/`    |
| TypeScript Types | DiffResult, DiffEngine   | `docs/arch/data-model/typescript/`             |
| CLI Command      | `gforms diff`            | `docs/arch/api-contract/cli-specification.md`  |
| Terminal Mockup  | Diff output formats      | `docs/ux/cli-design/terminal-mockups.md`       |
| API Mapping      | GET /forms/{formId}      | `docs/arch/api-contract/google-api-mapping.md` |

### UC-003: Deploy Form

| Artifact Type    | Artifact                     | Location                                       |
| ---------------- | ---------------------------- | ---------------------------------------------- |
| Domain Model     | GoogleFormsClient, FormState | `docs/arch/domain-model/`                      |
| Sequence Diagram | deploy-sequence.mmd          | `docs/arch/domain-model/sequence-diagrams/`    |
| Activity Diagram | deploy-flow.mmd              | `docs/req/activity-diagrams/`                  |
| CLI Command      | `gforms deploy`              | `docs/arch/api-contract/cli-specification.md`  |
| Terminal Mockup  | Deploy output                | `docs/ux/cli-design/terminal-mockups.md`       |
| API Mapping      | POST /forms, batchUpdate     | `docs/arch/api-contract/google-api-mapping.md` |

### UC-004: Authenticate

| Artifact Type    | Artifact                                  | Location                                        |
| ---------------- | ----------------------------------------- | ----------------------------------------------- |
| Domain Model     | AuthClient, OAuthAuth, ServiceAccountAuth | `docs/arch/domain-model/`                       |
| Sequence Diagram | auth-sequence.mmd                         | `docs/arch/domain-model/sequence-diagrams/`     |
| Activity Diagram | auth-flow.mmd                             | `docs/req/activity-diagrams/`                   |
| TypeScript Types | AuthClient, OAuthTokens                   | `docs/arch/data-model/typescript/auth.types.ts` |
| CLI Commands     | `gforms auth login/logout/status`         | `docs/arch/api-contract/cli-specification.md`   |
| Security Design  | authentication-design.md                  | `docs/arch/security/`                           |
| Threat Model     | Auth threats (S1-S3)                      | `docs/arch/security/threat-model.md`            |

### UC-005: Configure Sheets Integration

| Artifact Type | Artifact                    | Location                                         |
| ------------- | --------------------------- | ------------------------------------------------ |
| Domain Model  | SheetsIntegration           | `docs/arch/domain-model/`                        |
| Data Schema   | SheetsIntegration in schema | `docs/arch/data-model/schemas/`                  |
| API Mapping   | Sheets API calls            | `docs/arch/api-contract/google-api-mapping.md`   |
| Examples      | Customer Feedback form      | `docs/ux/cli-design/form-definition-examples.md` |

### UC-006: Configure Email Notifications

| Artifact Type | Artifact                           | Location                                         |
| ------------- | ---------------------------------- | ------------------------------------------------ |
| Domain Model  | EmailIntegration, ConditionalLogic | `docs/arch/domain-model/`                        |
| Data Schema   | EmailIntegration in schema         | `docs/arch/data-model/schemas/`                  |
| Examples      | NPS Survey (detractor alerts)      | `docs/ux/cli-design/form-definition-examples.md` |

### UC-007: Configure Webhooks

| Artifact Type | Artifact                        | Location                                         |
| ------------- | ------------------------------- | ------------------------------------------------ |
| Domain Model  | WebhookIntegration, RetryConfig | `docs/arch/domain-model/`                        |
| Data Schema   | WebhookIntegration in schema    | `docs/arch/data-model/schemas/`                  |
| Examples      | Event Registration form         | `docs/ux/cli-design/form-definition-examples.md` |

---

## Entity → Implementation Mapping

| Domain Entity      | TypeScript Type        | Schema Definition           | Test Coverage     |
| ------------------ | ---------------------- | --------------------------- | ----------------- |
| FormDefinition     | `FormDefinition`       | form-definition.schema.json | Unit, Integration |
| TextQuestion       | `TextQuestion`         | #/$defs/TextQuestion        | Unit              |
| EmailQuestion      | `EmailQuestion`        | #/$defs/EmailQuestion       | Unit              |
| ChoiceQuestion     | `ChoiceQuestion`       | #/$defs/ChoiceQuestion      | Unit              |
| DropdownQuestion   | `DropdownQuestion`     | #/$defs/DropdownQuestion    | Unit              |
| ScaleQuestion      | `ScaleQuestion`        | #/$defs/ScaleQuestion       | Unit              |
| Section            | `Section`              | #/$defs/Section             | Unit              |
| ConditionalLogic   | `ConditionalLogic`     | #/$defs/ConditionalLogic    | Unit              |
| SheetsIntegration  | `SheetsIntegration`    | #/$defs/SheetsIntegration   | Integration       |
| EmailIntegration   | `EmailIntegration`     | #/$defs/EmailIntegration    | Unit              |
| WebhookIntegration | `WebhookIntegration`   | #/$defs/WebhookIntegration  | Unit              |
| FormState          | `FormState`            | state-file.schema.json      | Integration       |
| StateFile          | `StateFile`            | state-file.schema.json      | Integration       |
| DiffResult         | `DiffResult`           | N/A (internal)              | Unit              |
| GoogleFormsClient  | `GoogleFormsClient`    | N/A (internal)              | Integration, E2E  |
| AuthClient         | `AuthClient`           | N/A (internal)              | Integration       |
| OAuthAuth          | `OAuthClient`          | N/A (internal)              | Integration       |
| ServiceAccountAuth | `ServiceAccountClient` | N/A (internal)              | Integration       |

---

## CLI Command → Test Coverage

| Command              | Unit Tests        | Integration Tests | E2E Tests |
| -------------------- | ----------------- | ----------------- | --------- |
| `gforms init`        | Validation        | File creation     | Full flow |
| `gforms auth login`  | Token handling    | OAuth flow        | -         |
| `gforms auth logout` | Token removal     | File deletion     | -         |
| `gforms auth status` | Status formatting | Token reading     | -         |
| `gforms validate`    | Schema validation | File loading      | -         |
| `gforms diff`        | Diff calculation  | API mocking       | Full flow |
| `gforms deploy`      | Update generation | API mocking       | Full flow |
| `gforms list`        | State reading     | File I/O          | -         |
| `gforms destroy`     | State removal     | API mocking       | Full flow |

---

## Security Requirements Tracing

| Threat ID | Mitigation              | Implementation Artifact |
| --------- | ----------------------- | ----------------------- |
| S1        | Token file permissions  | `auth/token-store.ts`   |
| S2        | User-managed key files  | Documentation           |
| S3        | Verified OAuth client   | `auth/oauth.ts`         |
| T1        | Git version control     | User workflow           |
| T2        | Regenerable state       | `state/manager.ts`      |
| T3        | HTTPS + cert validation | `api/http-client.ts`    |
| I1        | No token logging        | All modules             |
| I2        | .gitignore template     | `gforms init`           |
| I4        | Env var support         | `config/loader.ts`      |
| D1        | Exponential backoff     | `api/retry.ts`          |
| E1        | Minimum scopes          | `auth/scopes.ts`        |
| E3        | Dependency locking      | `pnpm-lock.yaml`        |

---

## Quality Requirements Tracing

| Quality Attribute | Requirement                    | Verification      |
| ----------------- | ------------------------------ | ----------------- |
| Reliability       | 95% uptime (depends on Google) | E2E monitoring    |
| Performance       | CLI response <2s for local ops | Performance tests |
| Security          | No credential exposure         | Security review   |
| Maintainability   | Complexity ≤10 per function    | ESLint rules      |
| Testability       | 95% code coverage              | Vitest coverage   |
| Usability         | Clear error messages           | UX review         |

---

## Artifact Inventory

### Requirements Phase

- [x] Persona: Platform Engineer
- [x] As-Is Scenarios (2)
- [x] Visionary Scenarios (4)
- [x] Use Cases (7)
- [x] Use Case Diagram
- [x] Activity Diagrams (3)
- [x] Non-Functional Requirements (NFR)

### Architecture Phase

- [x] Class Diagram
- [x] Sequence Diagrams (3)
- [x] ERD
- [x] JSON Schemas (2)
- [x] TypeScript Types (3 files)
- [x] CLI Specification
- [x] Internal API Specification
- [x] Google API Mapping
- [x] ADRs (3 decisions)

### Design Phase

- [x] Terminal Mockups
- [x] Form Definition Examples
- [x] CLI Design README

### Security & Quality

- [x] Threat Model
- [x] Authentication Design
- [x] Test Strategy
- [x] Coding Standards
- [x] Quality Model (ISO/IEC 25010)
- [x] Technical Debt Register
- [x] Test Plan

### Planning Closeout

- [x] Requirements Traceability Matrix (this document)
- [x] Planning Summary
