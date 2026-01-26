/**
 * Authentication Manager
 * Handles OAuth 2.0 and Service Account authentication for Google APIs
 *
 * Implements TC-AUTH-001 through TC-AUTH-006 from test plan
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

// =============================================================================
// Types
// =============================================================================

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  tokenType: 'Bearer';
  scope: string;
}

export type AuthMethod = 'oauth' | 'service-account';

export interface AuthStatus {
  method: AuthMethod | null;
  isAuthenticated: boolean;
  email?: string;
  expiresAt?: string;
  scopes?: string[];
}

export interface AuthManagerConfig {
  tokenStore: TokenStore;
  scopes: readonly string[];
  oauthClientId?: string | undefined;
  oauthClientSecret?: string | undefined;
}

// =============================================================================
// Errors
// =============================================================================

export class AuthError extends Error {
  public override readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'AuthError';
    this.cause = cause;
  }
}

// =============================================================================
// Token Store
// =============================================================================

/**
 * Stores OAuth tokens in a credentials file
 */
export class TokenStore {
  constructor(private readonly filePath: string) {}

  /**
   * Load tokens from the credentials file
   * Returns null if file doesn't exist or is invalid
   */
  async load(): Promise<OAuthTokens | null> {
    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      const parsed: unknown = JSON.parse(content);
      return isOAuthTokens(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  /**
   * Save tokens to the credentials file
   */
  async save(tokens: OAuthTokens): Promise<void> {
    // Ensure directory exists
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });

    // Write tokens with restricted permissions
    await fs.writeFile(this.filePath, JSON.stringify(tokens, null, 2), {
      mode: 0o600, // User read/write only
    });
  }

  /**
   * Clear stored tokens (logout)
   */
  async clear(): Promise<void> {
    try {
      await fs.unlink(this.filePath);
    } catch (error) {
      // Ignore if file doesn't exist
      if (!this.isFileNotFoundError(error)) {
        throw error;
      }
    }
  }

  /**
   * Check if tokens file exists
   */
  async exists(): Promise<boolean> {
    try {
      await fs.access(this.filePath);
      return true;
    } catch {
      return false;
    }
  }

  private isFileNotFoundError(error: unknown): boolean {
    return (
      error instanceof Error &&
      'code' in error &&
      (error as NodeJS.ErrnoException).code === 'ENOENT'
    );
  }
}

// =============================================================================
// Type Guards
// =============================================================================

function isOAuthTokens(value: unknown): value is OAuthTokens {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    typeof obj['accessToken'] === 'string' &&
    typeof obj['refreshToken'] === 'string' &&
    typeof obj['expiresAt'] === 'string' &&
    obj['tokenType'] === 'Bearer' &&
    typeof obj['scope'] === 'string'
  );
}

// =============================================================================
// Auth Manager
// =============================================================================

/**
 * Buffer time before token expiration (5 minutes)
 * Tokens are considered expired this many milliseconds before actual expiration
 */
const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

/**
 * Manages authentication for Google APIs
 * Supports OAuth 2.0 (interactive) and Service Account (non-interactive) auth
 */
export class AuthManager {
  private readonly tokenStore: TokenStore;
  private readonly scopes: readonly string[];
  private readonly serviceAccountKeyPath: string | undefined;

  constructor(config: AuthManagerConfig) {
    this.tokenStore = config.tokenStore;
    this.scopes = config.scopes;

    // Check for service account from environment
    this.serviceAccountKeyPath =
      process.env['GOOGLE_APPLICATION_CREDENTIALS'] ?? undefined;
  }

  /**
   * Get the configured authentication method
   * Returns 'service-account' if GOOGLE_APPLICATION_CREDENTIALS is set
   * Returns 'oauth' if OAuth tokens exist
   * Returns null if no auth configured
   */
  getAuthMethod(): AuthMethod | null {
    if (this.serviceAccountKeyPath) {
      return 'service-account';
    }
    return null;
  }

  /**
   * Check if OAuth tokens are stored
   */
  async hasOAuthTokens(): Promise<boolean> {
    return this.tokenStore.exists();
  }

  /**
   * Check if the stored token is expired or about to expire
   */
  async isTokenExpired(): Promise<boolean> {
    const tokens = await this.tokenStore.load();
    if (!tokens) {
      return true;
    }

    const expiresAt = new Date(tokens.expiresAt).getTime();
    const now = Date.now();

    // Consider expired if within buffer time
    return now >= expiresAt - TOKEN_EXPIRY_BUFFER_MS;
  }

  /**
   * Get the current authentication status
   */
  async getStatus(): Promise<AuthStatus> {
    // Check for OAuth tokens first
    const tokens = await this.tokenStore.load();
    if (tokens) {
      const isExpired = await this.isTokenExpired();
      return {
        method: 'oauth',
        isAuthenticated: !isExpired,
        expiresAt: tokens.expiresAt,
        scopes: tokens.scope.split(' '),
      };
    }

    // Check for service account
    if (this.serviceAccountKeyPath) {
      return {
        method: 'service-account',
        isAuthenticated: true, // Assume valid if configured
      };
    }

    // No authentication
    return {
      method: null,
      isAuthenticated: false,
    };
  }

  /**
   * Get an access token for API calls
   * Throws AuthError if not authenticated
   *
   * Note: This is a simplified implementation.
   * In production, this would handle token refresh and service account JWT signing.
   */
  async getAccessToken(): Promise<string> {
    // Check for OAuth tokens
    const tokens = await this.tokenStore.load();
    if (tokens) {
      if (await this.isTokenExpired()) {
        // In a full implementation, we would refresh the token here
        throw new AuthError(
          'Token expired. Please run `gforms auth login` to re-authenticate.'
        );
      }
      return tokens.accessToken;
    }

    // Check for service account
    if (this.serviceAccountKeyPath) {
      // In a full implementation, we would use the service account key
      // to sign a JWT and exchange it for an access token
      throw new AuthError(
        'Service account authentication not yet implemented. ' +
          'Please use OAuth with `gforms auth login`.'
      );
    }

    // No authentication available
    throw new AuthError(
      'Not authenticated. Please run `gforms auth login` to authenticate ' +
        'or set GOOGLE_APPLICATION_CREDENTIALS for service account auth.'
    );
  }

  /**
   * Get the scopes this manager is configured for
   */
  getScopes(): string[] {
    return [...this.scopes];
  }
}
