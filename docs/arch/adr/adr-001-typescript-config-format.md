# ADR-001: TypeScript for Form Configuration

## Status

Accepted

## Date

2024-01-25

## Context

We need to decide on the format for form definition files. Options considered:

1. **YAML** - Human-readable, widely used for config
2. **JSON** - Universal, schema validation available
3. **TypeScript** - Type-safe, allows logic and env vars

## Decision

We will use **TypeScript** as the form configuration format.

## Rationale

### Advantages of TypeScript

1. **Type Safety** - IDE autocomplete, compile-time validation
2. **Environment Variables** - `process.env.VAR` works natively
3. **Conditional Logic** - Can compute values programmatically
4. **Reusability** - Can share common patterns via imports
5. **Developer Experience** - Familiar to target users (DevOps/Platform Engineers)

### Disadvantages

1. **Requires Node.js** - Must have runtime to process
2. **More Complex Parsing** - Must compile/execute TS
3. **Security Consideration** - Config files execute code

### Why Not YAML

- No type checking without external tooling
- No native support for env vars or logic
- More error-prone (indentation sensitivity)

### Why Not JSON

- Verbose for humans
- No comments
- No env var interpolation
- No logic possible

## Consequences

### Positive

- Excellent developer experience with IDE support
- Can create sophisticated form definitions
- Type errors caught before deployment

### Negative

- Must handle arbitrary code execution safely
- Config loading is more complex than parsing JSON/YAML
- Users must understand basic TypeScript

### Mitigations

- Form definitions are data-focused, not complex code
- Provide `defineForm()` helper with full typing
- Document common patterns and examples

## Alternatives Rejected

- **YAML with custom syntax** - Non-standard, learning curve
- **JSON Schema validation only** - Misses DX benefits
- **HCL (Terraform-like)** - Unfamiliar to JS ecosystem users
