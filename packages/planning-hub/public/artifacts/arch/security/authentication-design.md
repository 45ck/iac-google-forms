# Authentication Design

## Overview

iac-google-forms supports two authentication methods:
1. **OAuth 2.0** - For local development and interactive use
2. **Service Account** - For CI/CD and automation

## OAuth 2.0 Authentication

### Flow Diagram

```
┌────────┐     ┌─────────┐     ┌─────────┐     ┌─────────────┐
│  User  │     │   CLI   │     │ Browser │     │ Google OAuth│
└───┬────┘     └────┬────┘     └────┬────┘     └──────┬──────┘
    │               │               │                  │
    │ gforms auth   │               │                  │
    │ login         │               │                  │
    │──────────────▶│               │                  │
    │               │               │                  │
    │               │ Generate PKCE │                  │
    │               │ code_verifier │                  │
    │               │ + code_challenge                 │
    │               │───────────────│                  │
    │               │               │                  │
    │               │ Start local   │                  │
    │               │ HTTP server   │                  │
    │               │ on random port│                  │
    │               │───────────────│                  │
    │               │               │                  │
    │               │ Open auth URL │                  │
    │               │──────────────▶│                  │
    │               │               │                  │
    │               │               │ GET /authorize   │
    │               │               │─────────────────▶│
    │               │               │                  │
    │               │               │◀─────────────────│
    │               │               │ Consent screen   │
    │◀──────────────│───────────────│                  │
    │ View consent  │               │                  │
    │               │               │                  │
    │ Grant         │               │                  │
    │──────────────▶│───────────────▶│                 │
    │               │               │ Allow            │
    │               │               │─────────────────▶│
    │               │               │                  │
    │               │               │◀─────────────────│
    │               │◀──────────────│ Redirect to      │
    │               │ ?code=AUTH    │ localhost:PORT   │
    │               │               │                  │
    │               │ POST /token   │                  │
    │               │ (code, verifier)────────────────▶│
    │               │               │                  │
    │               │◀─────────────────────────────────│
    │               │ {access_token, refresh_token}    │
    │               │               │                  │
    │               │ Save to       │                  │
    │               │ ~/.gforms/    │                  │
    │               │ credentials   │                  │
    │               │───────────────│                  │
    │               │               │                  │
    │◀──────────────│               │                  │
    │ Success!      │               │                  │
    │               │               │                  │
```

### PKCE Implementation

PKCE (Proof Key for Code Exchange) prevents authorization code interception:

```typescript
// Generate cryptographically secure code verifier
const codeVerifier = crypto.randomBytes(32).toString('base64url');

// Create code challenge (SHA-256 hash of verifier)
const codeChallenge = crypto
  .createHash('sha256')
  .update(codeVerifier)
  .digest('base64url');

// Include in authorization URL
const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
authUrl.searchParams.set('code_challenge', codeChallenge);
authUrl.searchParams.set('code_challenge_method', 'S256');

// Include verifier in token exchange
const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  body: new URLSearchParams({
    code: authCode,
    code_verifier: codeVerifier,  // Proves we initiated the request
    // ...
  }),
});
```

### Token Storage

```
~/.gforms/
└── credentials.json    (chmod 600)
```

```json
{
  "access_token": "ya29.a0AfH6SM...",
  "refresh_token": "1//0eXx...",
  "expires_at": "2024-01-15T14:30:00Z",
  "token_type": "Bearer",
  "scope": "https://www.googleapis.com/auth/forms.body ..."
}
```

### Token Refresh

```typescript
async function getAccessToken(): Promise<string> {
  const tokens = await loadTokens();

  if (!tokens) {
    throw new AuthError('Not authenticated. Run: gforms auth login');
  }

  // Check if token expires within 5 minutes
  const expiresAt = new Date(tokens.expires_at);
  const fiveMinutes = 5 * 60 * 1000;

  if (expiresAt.getTime() - Date.now() < fiveMinutes) {
    // Refresh the token
    const newTokens = await refreshTokens(tokens.refresh_token);
    await saveTokens(newTokens);
    return newTokens.access_token;
  }

  return tokens.access_token;
}
```

## Service Account Authentication

### Flow Diagram

```
┌────────┐     ┌─────────┐     ┌─────────────┐
│ CI/CD  │     │   CLI   │     │ Google OAuth│
└───┬────┘     └────┬────┘     └──────┬──────┘
    │               │                  │
    │ Set env var:  │                  │
    │ GOOGLE_APPLICATION_CREDENTIALS   │
    │──────────────▶│                  │
    │               │                  │
    │ gforms deploy │                  │
    │──────────────▶│                  │
    │               │                  │
    │               │ Read key file    │
    │               │──────────────    │
    │               │                  │
    │               │ Create JWT       │
    │               │ Sign with        │
    │               │ private key      │
    │               │──────────────    │
    │               │                  │
    │               │ POST /token      │
    │               │ (JWT assertion)  │
    │               │─────────────────▶│
    │               │                  │
    │               │◀─────────────────│
    │               │ {access_token}   │
    │               │                  │
    │               │ Use token for    │
    │               │ API calls        │
    │               │──────────────    │
    │               │                  │
```

### JWT Structure

```typescript
// Header
{
  "alg": "RS256",
  "typ": "JWT"
}

// Payload
{
  "iss": "gforms-sa@project.iam.gserviceaccount.com",
  "sub": "gforms-sa@project.iam.gserviceaccount.com",
  "aud": "https://oauth2.googleapis.com/token",
  "iat": 1704067200,  // Issued at
  "exp": 1704070800,  // Expires (1 hour max)
  "scope": "https://www.googleapis.com/auth/forms.body ..."
}

// Signature
RS256(header + "." + payload, privateKey)
```

### Key File Format

```json
{
  "type": "service_account",
  "project_id": "my-project",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "gforms-sa@my-project.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

## Auth Client Interface

Both auth methods implement the same interface:

```typescript
interface AuthClient {
  /** Get a valid access token (refreshes if needed) */
  getAccessToken(): Promise<string>;

  /** Get the scopes this client has */
  getScopes(): string[];

  /** Check if currently authenticated */
  isAuthenticated(): boolean;
}

class OAuthClient implements AuthClient {
  private tokenStore: TokenStore;

  async getAccessToken(): Promise<string> {
    const tokens = await this.tokenStore.load();
    if (this.isExpired(tokens)) {
      return this.refresh(tokens);
    }
    return tokens.access_token;
  }
}

class ServiceAccountClient implements AuthClient {
  private keyFile: ServiceAccountKey;
  private cachedToken?: { token: string; expiresAt: Date };

  async getAccessToken(): Promise<string> {
    if (this.cachedToken && !this.isExpired(this.cachedToken)) {
      return this.cachedToken.token;
    }
    return this.fetchNewToken();
  }
}
```

## Auth Manager

Selects the appropriate auth method:

```typescript
class AuthManager {
  async getAuthClient(): Promise<AuthClient> {
    // Priority 1: Service account from env var
    const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (keyPath) {
      return new ServiceAccountClient(keyPath);
    }

    // Priority 2: OAuth tokens from storage
    const tokenStore = new TokenStore('~/.gforms/credentials.json');
    if (await tokenStore.exists()) {
      return new OAuthClient(tokenStore);
    }

    // No auth available
    throw new AuthError(
      'Not authenticated.\n' +
      'Run: gforms auth login\n' +
      'Or set: GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json'
    );
  }
}
```

## Required Scopes

| Scope | Purpose |
|-------|---------|
| `forms.body` | Read/write form structure |
| `forms.responses.readonly` | Read form responses (for conflict detection) |
| `spreadsheets` | Create/link spreadsheets |
| `drive.file` | Manage files created by the app |

```typescript
const REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/forms.responses.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];
```

## Security Best Practices

### For Users

1. **Never commit credentials**
   ```gitignore
   # .gitignore
   *.json
   !package.json
   !tsconfig.json
   .gforms/
   ```

2. **Use environment variables for CI**
   ```yaml
   # GitHub Actions
   env:
     GOOGLE_APPLICATION_CREDENTIALS: ${{ secrets.GCP_SA_KEY }}
   ```

3. **Rotate service account keys regularly**

4. **Use least-privilege scopes**

### For the CLI

1. **Never log tokens**
2. **Mask tokens in error messages**
3. **Set restrictive file permissions**
4. **Validate token file permissions on load**
5. **Clear tokens on logout**
