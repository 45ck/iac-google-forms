# Architecture Decision Records (ADRs)

## Overview

This directory contains Architecture Decision Records documenting significant technical decisions made during the design of iac-google-forms.

## Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [ADR-001](./adr-001-typescript-config-format.md) | TypeScript for Form Configuration | Accepted | 2024-01-25 |
| [ADR-002](./adr-002-state-file-approach.md) | Local State File Pattern | Accepted | 2024-01-25 |
| [ADR-003](./adr-003-dual-auth-strategy.md) | Dual Authentication Strategy | Accepted | 2024-01-25 |

## ADR Template

When creating a new ADR, use this template:

```markdown
# ADR-XXX: [Title]

## Status
[Proposed | Accepted | Deprecated | Superseded by ADR-XXX]

## Date
YYYY-MM-DD

## Context
What is the issue that we're seeing that is motivating this decision?

## Decision
What is the change that we're proposing?

## Rationale
Why is this the best choice? What alternatives were considered?

## Consequences
What are the positive and negative results of this decision?
```

## Status Definitions

| Status | Meaning |
|--------|---------|
| **Proposed** | Under discussion, not yet decided |
| **Accepted** | Approved and implemented |
| **Deprecated** | No longer recommended |
| **Superseded** | Replaced by a newer ADR |
