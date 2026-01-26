/**
 * Authentication type definitions for iac-google-forms
 */

// =============================================================================
// Auth Client Interface
// =============================================================================

/**
 * Abstract interface for authentication providers
 * Allows swapping between Service Account (CI) and OAuth (local dev)
 */
export interface AuthClient {
  /** Get a valid access token (refreshes if needed) */
  getAccessToken(): Promise<string>;
  /** Get the OAuth scopes this client has */
  getScopes(): string[];
  /** Check if the client has valid credentials */
  isAuthenticated(): boolean;
}

// =============================================================================
// OAuth Types
// =============================================================================

export interface OAuthConfig {
  /** OAuth client ID */
  clientId: string;
  /** OAuth client secret */
  clientSecret: string;
  /** Redirect URI for OAuth flow */
  redirectUri: string;
  /** OAuth scopes to request */
  scopes: string[];
}

export interface OAuthTokens {
  /** Access token for API calls */
  accessToken: string;
  /** Refresh token for getting new access tokens */
  refreshToken: string;
  /** When the access token expires (ISO 8601) */
  expiresAt: string;
  /** Token type (always "Bearer") */
  tokenType: 'Bearer';
  /** Scopes granted by the user */
  scope: string;
}

export interface TokenStore {
  /** Load stored tokens */
  load(): Promise<OAuthTokens | null>;
  /** Save tokens */
  save(tokens: OAuthTokens): Promise<void>;
  /** Clear stored tokens */
  clear(): Promise<void>;
  /** Check if tokens exist */
  exists(): Promise<boolean>;
}

// =============================================================================
// Service Account Types
// =============================================================================

export interface ServiceAccountKey {
  /** Key type (always "service_account") */
  type: 'service_account';
  /** Project ID */
  project_id: string;
  /** Private key ID */
  private_key_id: string;
  /** Private key (PEM format) */
  private_key: string;
  /** Service account email */
  client_email: string;
  /** Client ID */
  client_id: string;
  /** Auth URI */
  auth_uri: string;
  /** Token URI */
  token_uri: string;
  /** Auth provider cert URL */
  auth_provider_x509_cert_url: string;
  /** Client cert URL */
  client_x509_cert_url: string;
}

export interface ServiceAccountConfig {
  /** Path to service account key file */
  keyFilePath: string;
  /** OAuth scopes to request */
  scopes: string[];
  /** Optional: subject for domain-wide delegation */
  subject?: string;
}

// =============================================================================
// Auth Manager Types
// =============================================================================

export type AuthMethod = 'oauth' | 'service-account';

export interface AuthState {
  /** Which auth method is active */
  method: AuthMethod | null;
  /** Whether currently authenticated */
  isAuthenticated: boolean;
  /** User/service account email */
  email?: string;
  /** When credentials expire */
  expiresAt?: string;
}

export interface AuthManagerConfig {
  /** OAuth configuration (for local dev) */
  oauth?: OAuthConfig;
  /** Service account key path (for CI/CD) */
  serviceAccountKeyPath?: string;
  /** Token storage location */
  tokenStorePath?: string;
  /** Scopes to request */
  scopes: string[];
}

// =============================================================================
// OAuth Scopes
// =============================================================================

/** Required scopes for iac-google-forms */
export const REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/forms.responses.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
] as const;

export type RequiredScope = (typeof REQUIRED_SCOPES)[number];
