# CLI Design

## Overview

This directory contains UX design documentation for the gforms CLI, including terminal mockups and form definition examples.

## Documents

| Document | Description |
|----------|-------------|
| [terminal-mockups.md](./terminal-mockups.md) | Visual mockups of all CLI commands and states |
| [form-definition-examples.md](./form-definition-examples.md) | Example form definitions in TypeScript |

## Design Principles

### 1. Clarity Over Brevity
- Always show what will happen before it happens
- Display clear diffs before making changes
- Require explicit confirmation for destructive actions

### 2. Progressive Disclosure
- Simple commands show essential info only
- Use `--verbose` for detailed output
- Error messages include next steps

### 3. Consistent Visual Language
| Symbol | Meaning |
|--------|---------|
| `✓` | Success / Complete |
| `✗` | Error / Failure |
| `⚠` | Warning |
| `+` | Addition (green) |
| `-` | Removal (red) |
| `~` | Modification (yellow) |

### 4. CI-Friendly
- All commands work non-interactively with flags
- Exit codes are meaningful (0=success, 1=failure, 2=validation, 3=cancelled)
- Markdown output format for PR comments

### 5. Helpful Errors
Every error message includes:
1. What went wrong
2. Why it might have happened
3. How to fix it

## Color Usage

| Color | ANSI | Usage |
|-------|------|-------|
| Green | 32 | Success, additions |
| Red | 31 | Errors, removals |
| Yellow | 33 | Warnings, modifications |
| Cyan | 36 | URLs, hints |
| Gray | 90 | Secondary info |
| Bold | 1 | Headers, emphasis |

Colors are disabled when:
- `--no-color` flag is passed
- `NO_COLOR` environment variable is set
- Output is not a TTY (piped)

## Command Quick Reference

```
gforms init              # Initialize project
gforms auth login        # Authenticate with Google
gforms auth logout       # Remove credentials
gforms auth status       # Show auth status
gforms validate <file>   # Validate form definition
gforms diff <file>       # Show changes vs deployed
gforms deploy <file>     # Deploy form
gforms list              # List tracked forms
gforms destroy <file>    # Delete form
```

## Interactive vs Non-Interactive

| Feature | Interactive | Non-Interactive (CI) |
|---------|-------------|---------------------|
| Confirmation prompts | Yes | Skip with `--auto-approve` |
| Colored output | Yes | Disabled in pipe/CI |
| Progress spinners | Animated | Static dots |
| Browser opening | Automatic | Print URL instead |
| Output format | Console | Use `--format markdown/json` |
