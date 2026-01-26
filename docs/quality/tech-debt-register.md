# Technical Debt Register

## Overview

This document tracks technical debt items for iac-google-forms. Technical debt represents shortcuts or suboptimal solutions that should be addressed to maintain long-term code quality.

## Debt Classification

| Priority     | Description                           | SLA                  |
| ------------ | ------------------------------------- | -------------------- |
| **Critical** | Blocks features or causes failures    | Fix immediately      |
| **High**     | Significant impact on maintainability | Fix within 2 sprints |
| **Medium**   | Moderate impact, workarounds exist    | Fix within 1 quarter |
| **Low**      | Minor inconvenience                   | Fix when convenient  |

| Type       | Description                    |
| ---------- | ------------------------------ |
| **Design** | Architectural or design issues |
| **Code**   | Implementation quality issues  |
| **Test**   | Testing gaps or quality        |
| **Docs**   | Documentation gaps             |
| **Deps**   | Dependency issues              |

---

## Active Debt Items

### TD-001: [TEMPLATE]

| Field        | Value             |
| ------------ | ----------------- |
| **ID**       | TD-001            |
| **Title**    | Example debt item |
| **Type**     | Design            |
| **Priority** | Medium            |
| **Created**  | 2024-01-01        |
| **Owner**    | Unassigned        |
| **Status**   | Open              |

**Description:**
Brief description of the technical debt.

**Impact:**
What problems does this cause?

**Proposed Solution:**
How should this be fixed?

**Estimated Effort:**
Small / Medium / Large

**Related Issues:**

- Link to related issues

---

## Debt Summary

| Priority  | Count | Total Effort |
| --------- | ----- | ------------ |
| Critical  | 0     | -            |
| High      | 0     | -            |
| Medium    | 0     | -            |
| Low       | 0     | -            |
| **Total** | **0** | **-**        |

---

## Resolved Debt

| ID  | Title | Resolved Date | Resolution |
| --- | ----- | ------------- | ---------- |
| -   | -     | -             | -          |

---

## Debt Prevention Guidelines

### Code Review Checklist

- [ ] No TODO comments without linked issue
- [ ] No skipped tests without justification
- [ ] No `any` types without documentation
- [ ] No duplicated code (>10 lines)
- [ ] No functions >50 lines
- [ ] No cyclomatic complexity >10

### When to Create Debt Items

1. **Shortcuts for deadlines** - Document what was skipped
2. **Known limitations** - Document known issues
3. **Refactoring needs** - Code that works but needs cleanup
4. **Dependency updates** - Outdated or vulnerable deps
5. **Test gaps** - Areas with insufficient coverage

### Debt Review Process

1. **Weekly** - Review critical/high items
2. **Sprint Planning** - Allocate 20% capacity to debt
3. **Quarterly** - Full debt audit and prioritization

---

## Metrics

### Debt Ratio

```
Debt Ratio = (Estimated Debt Effort) / (Total Codebase Effort)
Target: <10%
```

### Debt Trend

Track debt count over time to ensure it's not growing unbounded.

| Month | Critical | High | Medium | Low | Total |
| ----- | -------- | ---- | ------ | --- | ----- |
| -     | -        | -    | -      | -   | -     |

---

## Adding New Debt

Copy the template below and fill in details:

```markdown
### TD-XXX: [Title]

| Field        | Value                      |
| ------------ | -------------------------- |
| **ID**       | TD-XXX                     |
| **Title**    | Brief title                |
| **Type**     | Design/Code/Test/Docs/Deps |
| **Priority** | Critical/High/Medium/Low   |
| **Created**  | YYYY-MM-DD                 |
| **Owner**    | Name or Unassigned         |
| **Status**   | Open/In Progress/Resolved  |

**Description:**
What is the debt?

**Impact:**
What problems does it cause?

**Proposed Solution:**
How to fix it?

**Estimated Effort:**
Small (1-2h) / Medium (1-2d) / Large (1w+)

**Related Issues:**

- #issue-number
```
