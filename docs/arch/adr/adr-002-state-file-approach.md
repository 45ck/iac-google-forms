# ADR-002: Local State File Pattern

## Status
Accepted

## Date
2024-01-25

## Context
We need to track the relationship between local form definition files and deployed Google Forms. Options considered:

1. **Local state file** - Like Terraform's `.tfstate`
2. **Remote state** - Store state in cloud (GCS, S3)
3. **Inline metadata** - Store form ID in the definition file
4. **No state** - Always create new forms or query by name

## Decision
We will use a **local state file** stored at `.gforms/state.json`.

## Rationale

### Advantages of Local State
1. **Simplicity** - No additional cloud resources needed
2. **Git-friendly** - Can be committed or gitignored
3. **Terraform pattern** - Familiar to target users
4. **Fast** - No network call to read state
5. **Offline capable** - Can validate/diff with cached state

### Disadvantages
1. **Team sync** - Multiple developers need to share state
2. **State corruption** - File can be corrupted
3. **State loss** - Deleted state = orphaned forms

### Why Not Remote State
- Adds complexity (cloud bucket, credentials)
- Overkill for initial version
- Can be added later as enhancement

### Why Not Inline Metadata
- Mixes config with runtime state
- Git diffs would show form IDs changing
- Less flexible for multi-environment

### Why Not No State
- Would create duplicate forms on each deploy
- No way to update existing forms
- Can't detect drift

## Consequences

### Positive
- Simple to implement and understand
- Works offline
- No external dependencies

### Negative
- Teams must coordinate state file
- State can diverge from reality

### Mitigations
- Document team workflow (commit state vs gitignore)
- Provide `gforms state pull` to reconstruct from Google
- Content hash enables drift detection
- State is recoverable from Google Forms API

## State File Structure
```json
{
  "version": "1.0",
  "forms": {
    "forms/feedback.ts": {
      "localPath": "forms/feedback.ts",
      "formId": "1BxiMVs0XRA5...",
      "lastDeployed": "2024-01-15T10:30:00Z",
      "contentHash": "sha256:..."
    }
  }
}
```

## Future Considerations
- Add `gforms state push/pull` for remote state
- Add state locking for CI/CD concurrency
- Add state encryption option
