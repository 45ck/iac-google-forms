# Persona: Alex Chen - Platform Engineer

## Overview

| Attribute | Value |
|-----------|-------|
| **Name** | Alex Chen |
| **Role** | Platform Engineer |
| **Experience** | 8 years in DevOps/Infrastructure |
| **Technical Level** | Expert |

## Background

Alex is a platform engineer who manages internal tooling and automation. They have a strong "everything as code" philosophy - the team already uses Terraform for cloud infrastructure, Helm for Kubernetes, and GitOps workflows for all changes.

## Technical Context

- **Languages**: TypeScript, Python, Bash
- **Tools**: VS Code, Git, GitHub, Terraform, npm/pnpm
- **Workflow**: Code review for all changes, CI/CD automation, preview before apply

## Goals

1. **Define forms as code** - TypeScript files alongside application code
2. **Version control everything** - Full git history, diff, rollback
3. **Eliminate manual work** - No clicking through web UIs
4. **Ensure consistency** - Same form definition deploys identically every time

## Pain Points (Current State)

| Pain Point | Severity | Impact |
|------------|----------|--------|
| Manual form creation via web UI | Critical | 30-45 min per form, context switching |
| No version control | Critical | Can't track changes or rollback |
| Environment drift | High | Dev/staging/prod forms get out of sync |
| Manual integration setup | High | Sheets, notifications require separate steps |
| No diff/preview | Medium | Fear of breaking production |

## Key Quotes

> "If it's not in git, it doesn't exist."

> "I don't want to click through UIs. I want to write code and run a command."

> "Show me a terraform plan equivalent - what will change before I apply it."

## Top Tasks

| Task | Frequency | Current Time | Target Time |
|------|-----------|--------------|-------------|
| Create new form | Weekly | 30-45 min | < 5 min |
| Update form questions | Weekly | 15 min | < 2 min |
| Set up Sheets integration | Weekly | 10 min | 0 (automated) |
| Sync forms across environments | Monthly | 1 hour | < 5 min |

## Success Metrics

- Form creation time: < 5 minutes
- Environment drift incidents: 0
- Manual intervention: Eliminated
