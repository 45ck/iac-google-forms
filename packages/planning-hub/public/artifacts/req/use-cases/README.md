# Use Cases

## Overview

This document summarizes the use cases for the iac-google-forms project.

## Use Case Diagram

See [use-case-diagram.mmd](./use-case-diagram.mmd) for the visual diagram.

## Use Case Summary

| ID | Title | Actor | Priority | Description |
|----|-------|-------|----------|-------------|
| UC-001 | [Define Form](./uc-001-define-form.md) | Platform Engineer | Must Have | Create form definition in TypeScript |
| UC-002 | [Diff Form](./uc-002-diff-form.md) | Platform Engineer, CI | Must Have | Compare local vs remote form state |
| UC-003 | [Deploy Form](./uc-003-deploy-form.md) | Platform Engineer, CI | Must Have | Apply form definition to Google Forms |
| UC-004 | [Configure Auth](./uc-004-configure-auth.md) | Platform Engineer | Must Have | Set up Google API credentials |
| UC-005 | [Link to Sheets](./uc-005-link-sheets.md) | System | Must Have | Connect form to Google Sheets |
| UC-006 | [Configure Notifications](./uc-006-configure-notifications.md) | System | Should Have | Set up email notifications |
| UC-007 | [Configure Webhooks](./uc-007-configure-webhooks.md) | System | Should Have | Set up webhook integrations |

## Activity Diagrams

| Workflow | Diagram |
|----------|---------|
| Deploy Flow | [deploy-flow.mmd](../activity-diagrams/deploy-flow.mmd) |
| Diff Flow | [diff-flow.mmd](../activity-diagrams/diff-flow.mmd) |
| Authentication Flow | [auth-flow.mmd](../activity-diagrams/auth-flow.mmd) |

## CLI Commands Derived

| Command | Use Case | Description |
|---------|----------|-------------|
| `gforms diff <file>` | UC-002 | Show changes between local and remote |
| `gforms deploy <file>` | UC-003 | Apply local definition to Google |
| `gforms auth login` | UC-004 | Interactive OAuth login |
| `gforms auth verify` | UC-004 | Verify credentials work |
| `gforms auth status` | UC-004 | Show current auth status |

## Traceability

| Use Case | Derived From Scenario |
|----------|----------------------|
| UC-001 | visionary-define-form |
| UC-002 | visionary-preview-deploy |
| UC-003 | visionary-define-form, visionary-preview-deploy |
| UC-004 | All scenarios (prerequisite) |
| UC-005 | visionary-configure-integrations |
| UC-006 | visionary-configure-integrations |
| UC-007 | visionary-configure-integrations |
