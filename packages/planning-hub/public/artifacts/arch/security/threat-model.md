# Threat Model

## Overview

This document identifies security threats for iac-google-forms and describes mitigations.

## System Context

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Trust Boundary: User Machine                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐  │
│  │ Form Defs   │───▶│  gforms CLI │───▶│ ~/.gforms/credentials   │  │
│  │ (.ts files) │    │             │    │ .gforms/state.json      │  │
│  └─────────────┘    └──────┬──────┘    └─────────────────────────┘  │
│                            │                                         │
└────────────────────────────┼─────────────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Trust Boundary: Google Cloud                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐  │
│  │ OAuth 2.0   │    │ Forms API   │    │ Sheets API / Drive API  │  │
│  │ Server      │    │             │    │                         │  │
│  └─────────────┘    └─────────────┘    └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Assets

| Asset | Sensitivity | Description |
|-------|-------------|-------------|
| OAuth Tokens | High | Access to user's Google account |
| Service Account Keys | Critical | Full access to GCP resources |
| Form Definitions | Medium | May contain business logic |
| State File | Low | Contains form IDs, URLs |
| Form Responses | High | User-submitted data in Sheets |

## Threat Categories (STRIDE)

### 1. Spoofing

| ID | Threat | Impact | Mitigation |
|----|--------|--------|------------|
| S1 | Attacker steals OAuth tokens from disk | Access to victim's Google Forms | Tokens stored with user-only permissions (600) |
| S2 | Attacker steals service account key | Full access to GCP project | Keys never stored by CLI; user manages key file |
| S3 | Phishing via fake OAuth consent screen | Token theft | Use verified OAuth client ID; show expected scopes |

### 2. Tampering

| ID | Threat | Impact | Mitigation |
|----|--------|--------|------------|
| T1 | Attacker modifies form definition files | Malicious forms deployed | Git version control; code review process |
| T2 | Attacker modifies state file | Incorrect form mappings | State file is regenerable from Google APIs |
| T3 | MITM attack on API calls | Data interception | All API calls use HTTPS with certificate validation |

### 3. Repudiation

| ID | Threat | Impact | Mitigation |
|----|--------|--------|------------|
| R1 | User denies deploying a form | Audit trail gaps | State file tracks lastDeployedBy; Git history |
| R2 | No record of form changes | Compliance issues | Content hash in state; Git commit history |

### 4. Information Disclosure

| ID | Threat | Impact | Mitigation |
|----|--------|--------|------------|
| I1 | Tokens leaked in logs | Account compromise | Never log tokens; mask in error messages |
| I2 | Service account key committed to Git | Project compromise | .gitignore includes *.json keys; CLI warns |
| I3 | Form IDs in state file exposed | Information leak | Form IDs are not secret; access requires auth |
| I4 | Webhook secrets in form definitions | Secret exposure | Support env vars for secrets; warn on commit |

### 5. Denial of Service

| ID | Threat | Impact | Mitigation |
|----|--------|--------|------------|
| D1 | Rate limiting by Google APIs | Deployment blocked | Exponential backoff; respect 429 responses |
| D2 | Large form definition crashes CLI | CLI unavailable | Input validation; size limits |

### 6. Elevation of Privilege

| ID | Threat | Impact | Mitigation |
|----|--------|--------|------------|
| E1 | OAuth scope escalation | Broader access than needed | Request minimum scopes; validate at auth |
| E2 | Form definition executes arbitrary code | System compromise | Form defs are data, not executed code |
| E3 | Dependency supply chain attack | Code injection | Lock dependencies; security audits |

## Authentication Security

### OAuth 2.0 Flow

```
User ──▶ CLI ──▶ Browser ──▶ Google OAuth ──▶ Consent ──▶ Redirect
                                                              │
          CLI ◀── localhost:PORT?code=AUTH_CODE ◀─────────────┘
            │
            └──▶ Exchange code for tokens (PKCE)
            └──▶ Store tokens (~/.gforms/credentials.json)
```

**Security Controls:**
- PKCE (Proof Key for Code Exchange) prevents authorization code interception
- Localhost redirect prevents remote token theft
- Random port prevents port prediction attacks
- Token file permissions: `chmod 600`

### Service Account Flow

```
CI/CD ──▶ GOOGLE_APPLICATION_CREDENTIALS=key.json
              │
              └──▶ CLI reads key file
              └──▶ Signs JWT with private key
              └──▶ Exchanges JWT for access token
```

**Security Controls:**
- Key file never copied or stored by CLI
- User responsible for key file security
- Recommend: Store key in CI/CD secrets manager

## Secure Defaults

| Setting | Default | Rationale |
|---------|---------|-----------|
| Token file permissions | 600 | User-only read/write |
| HTTPS only | Yes | No HTTP fallback |
| Certificate validation | Enabled | No `--insecure` flag |
| Auto-approve | Disabled | Require explicit confirmation |
| Verbose logging | Disabled | Minimize information exposure |

## Secrets Management

### In Form Definitions

```typescript
// BAD: Hardcoded secrets
integrations: [{
  type: 'webhook',
  url: 'https://api.example.com',
  secret: 'super-secret-key',  // ⚠️ Will be in Git!
}]

// GOOD: Environment variables
integrations: [{
  type: 'webhook',
  url: 'https://api.example.com',
  secret: process.env.WEBHOOK_SECRET,
}]
```

### CLI Warnings

The CLI will warn when:
- Service account key file is in project directory
- Form definition contains string literals that look like secrets
- Token file has incorrect permissions

## Dependency Security

| Practice | Implementation |
|----------|----------------|
| Lock file | `pnpm-lock.yaml` committed |
| Audit | `pnpm audit` in CI |
| Updates | Dependabot / Renovate |
| Minimal deps | Prefer built-in Node.js APIs |

## Compliance Considerations

| Requirement | How gforms Helps |
|-------------|------------------|
| Access control | OAuth scopes limit access |
| Audit trail | State file + Git history |
| Data residency | Forms stored in user's Google account |
| Encryption at rest | Google handles (user's account) |
| Encryption in transit | HTTPS for all API calls |
