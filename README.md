# iac-google-forms

Infrastructure as Code for Google Forms with output integrations (Google Sheets, email, webhooks). Define forms in TypeScript, review diffs, and deploy via CLI.

## What this repo contains

- `packages/gforms`: core library and CLI
- `packages/planning-hub`: Storybook-style planning hub and generated artifacts
- `packages/ui`: shared UI primitives
- `docs/`: requirements, architecture, security, and test artifacts

## Key capabilities

- Type-safe form definitions in TypeScript
- Diff and preview before deploy
- OAuth and Service Account auth flows
- Integrations to Sheets, email, and webhooks
- CI-friendly, non-interactive mode

## Getting started

### Prerequisites

- Node.js 20+
- pnpm (repo uses `pnpm@10.28.1`)

### Install

```bash
pnpm install
```

### Build

```bash
pnpm build:storybook
```

This project was built using my SDLC Claude Code plugin.

### Develop

```bash
pnpm dev:storybook
```

### Quality checks

```bash
pnpm check
```

## Documentation

- Planning summary: `docs/planning-summary.md`
- Architecture, requirements, security, and test plans are under `docs/`

## Contributing

See `CONTRIBUTING.md`.

## License

MIT. See `LICENSE`.