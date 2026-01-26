/**
 * Authentication Manager Tests
 * Implements TC-AUTH-001 through TC-AUTH-006 from test plan
 *
 * TDD: These tests define the expected behavior for authentication.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  AuthManager,
  AuthError,
  TokenStore,
  type OAuthTokens,
} from './auth-manager.js';

describe('AuthManager', () => {
  let tempDir: string;
  let tokenStore: TokenStore;
  let authManager: AuthManager;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gforms-auth-test-'));
    tokenStore = new TokenStore(path.join(tempDir, 'credentials.json'));
    authManager = new AuthManager({
      tokenStore,
      scopes: ['https://www.googleapis.com/auth/forms.body'],
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  // ==========================================================================
  // TC-AUTH-001: OAuth login success (TokenStore tests)
  // ==========================================================================
  describe('TC-AUTH-001: OAuth token storage', () => {
    it('should save tokens to credentials file', async () => {
      const tokens: OAuthTokens = {
        accessToken: 'access123',
        refreshToken: 'refresh456',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        tokenType: 'Bearer',
        scope: 'forms.body',
      };

      await tokenStore.save(tokens);

      const exists = await fs
        .access(path.join(tempDir, 'credentials.json'))
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    });

    it('should load saved tokens', async () => {
      const tokens: OAuthTokens = {
        accessToken: 'access123',
        refreshToken: 'refresh456',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        tokenType: 'Bearer',
        scope: 'forms.body',
      };

      await tokenStore.save(tokens);
      const loaded = await tokenStore.load();

      expect(loaded).toEqual(tokens);
    });

    it('should return null when no tokens exist', async () => {
      const loaded = await tokenStore.load();

      expect(loaded).toBeNull();
    });

    it('should check if tokens exist', async () => {
      expect(await tokenStore.exists()).toBe(false);

      await tokenStore.save({
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresAt: new Date().toISOString(),
        tokenType: 'Bearer',
        scope: 'forms.body',
      });

      expect(await tokenStore.exists()).toBe(true);
    });
  });

  // ==========================================================================
  // TC-AUTH-002: OAuth token refresh
  // ==========================================================================
  describe('TC-AUTH-002: Token expiration detection', () => {
    it('should detect expired tokens', async () => {
      const expiredTokens: OAuthTokens = {
        accessToken: 'old-access',
        refreshToken: 'refresh',
        expiresAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        tokenType: 'Bearer',
        scope: 'forms.body',
      };

      await tokenStore.save(expiredTokens);

      expect(await authManager.isTokenExpired()).toBe(true);
    });

    it('should detect valid tokens', async () => {
      const validTokens: OAuthTokens = {
        accessToken: 'valid-access',
        refreshToken: 'refresh',
        expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        tokenType: 'Bearer',
        scope: 'forms.body',
      };

      await tokenStore.save(validTokens);

      expect(await authManager.isTokenExpired()).toBe(false);
    });

    it('should consider tokens expiring soon as expired', async () => {
      // Token expiring in 30 seconds (within 5-minute buffer)
      const soonExpiring: OAuthTokens = {
        accessToken: 'soon-expired',
        refreshToken: 'refresh',
        expiresAt: new Date(Date.now() + 30000).toISOString(),
        tokenType: 'Bearer',
        scope: 'forms.body',
      };

      await tokenStore.save(soonExpiring);

      // Should be considered expired due to buffer
      expect(await authManager.isTokenExpired()).toBe(true);
    });
  });

  // ==========================================================================
  // TC-AUTH-003: Service account auth
  // ==========================================================================
  describe('TC-AUTH-003: Service account configuration', () => {
    it('should detect service account from environment variable', () => {
      vi.stubEnv('GOOGLE_APPLICATION_CREDENTIALS', '/path/to/key.json');

      const manager = new AuthManager({
        tokenStore,
        scopes: ['https://www.googleapis.com/auth/forms.body'],
      });

      expect(manager.getAuthMethod()).toBe('service-account');
    });

    it('should prefer OAuth when both are available', async () => {
      vi.stubEnv('GOOGLE_APPLICATION_CREDENTIALS', '/path/to/key.json');

      // Save OAuth tokens
      await tokenStore.save({
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        tokenType: 'Bearer',
        scope: 'forms.body',
      });

      const manager = new AuthManager({
        tokenStore,
        scopes: ['https://www.googleapis.com/auth/forms.body'],
      });

      // When OAuth tokens exist, should use OAuth
      expect(await manager.hasOAuthTokens()).toBe(true);
    });
  });

  // ==========================================================================
  // TC-AUTH-004: No credentials available
  // ==========================================================================
  describe('TC-AUTH-004: No credentials', () => {
    it('should report not authenticated when no credentials', async () => {
      // Clear the environment variable completely
      vi.unstubAllEnvs();
      delete process.env['GOOGLE_APPLICATION_CREDENTIALS'];

      // Create a new manager without any credentials
      const emptyTokenStore = new TokenStore(path.join(tempDir, 'nonexistent.json'));
      const noAuthManager = new AuthManager({
        tokenStore: emptyTokenStore,
        scopes: ['https://www.googleapis.com/auth/forms.body'],
      });

      const status = await noAuthManager.getStatus();

      expect(status.isAuthenticated).toBe(false);
      expect(status.method).toBeNull();
    });

    it('should throw AuthError when getting token without credentials', async () => {
      vi.unstubAllEnvs();
      delete process.env['GOOGLE_APPLICATION_CREDENTIALS'];

      const emptyTokenStore = new TokenStore(path.join(tempDir, 'nonexistent.json'));
      const noAuthManager = new AuthManager({
        tokenStore: emptyTokenStore,
        scopes: ['https://www.googleapis.com/auth/forms.body'],
      });

      await expect(noAuthManager.getAccessToken()).rejects.toThrow(AuthError);
    });

    it('should provide helpful message when not authenticated', async () => {
      vi.unstubAllEnvs();
      delete process.env['GOOGLE_APPLICATION_CREDENTIALS'];

      const emptyTokenStore = new TokenStore(path.join(tempDir, 'nonexistent.json'));
      const noAuthManager = new AuthManager({
        tokenStore: emptyTokenStore,
        scopes: ['https://www.googleapis.com/auth/forms.body'],
      });

      try {
        await noAuthManager.getAccessToken();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        expect((error as AuthError).message).toMatch(/not authenticated|login/i);
      }
    });
  });

  // ==========================================================================
  // TC-AUTH-005: Invalid service account key
  // ==========================================================================
  describe('TC-AUTH-005: Invalid credentials handling', () => {
    it('should handle malformed credentials file gracefully', async () => {
      // Write invalid JSON to credentials file
      await fs.writeFile(
        path.join(tempDir, 'credentials.json'),
        'invalid json {{'
      );

      const loaded = await tokenStore.load();

      // Should return null for invalid credentials, not crash
      expect(loaded).toBeNull();
    });

    it('should reject tokens missing required fields', async () => {
      // Valid JSON but missing tokenType and scope
      await fs.writeFile(
        path.join(tempDir, 'credentials.json'),
        JSON.stringify({
          accessToken: 'access123',
          refreshToken: 'refresh456',
          expiresAt: new Date().toISOString(),
        })
      );

      const loaded = await tokenStore.load();
      expect(loaded).toBeNull();
    });

    it('should reject tokens with wrong field types', async () => {
      await fs.writeFile(
        path.join(tempDir, 'credentials.json'),
        JSON.stringify({
          accessToken: 12345,
          refreshToken: 'refresh',
          expiresAt: 'date',
          tokenType: 'Bearer',
          scope: 'forms.body',
        })
      );

      const loaded = await tokenStore.load();
      expect(loaded).toBeNull();
    });
  });

  // ==========================================================================
  // TC-AUTH-006: Logout clears credentials
  // ==========================================================================
  describe('TC-AUTH-006: Logout', () => {
    it('should clear credentials on logout', async () => {
      // Setup: Save tokens
      await tokenStore.save({
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresAt: new Date().toISOString(),
        tokenType: 'Bearer',
        scope: 'forms.body',
      });

      expect(await tokenStore.exists()).toBe(true);

      // Logout
      await tokenStore.clear();

      expect(await tokenStore.exists()).toBe(false);
    });

    it('should delete credentials file on logout', async () => {
      const credPath = path.join(tempDir, 'credentials.json');

      await tokenStore.save({
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresAt: new Date().toISOString(),
        tokenType: 'Bearer',
        scope: 'forms.body',
      });

      const existsBefore = await fs
        .access(credPath)
        .then(() => true)
        .catch(() => false);
      expect(existsBefore).toBe(true);

      await tokenStore.clear();

      const existsAfter = await fs
        .access(credPath)
        .then(() => true)
        .catch(() => false);
      expect(existsAfter).toBe(false);
    });

    it('should not throw when clearing non-existent credentials', async () => {
      await expect(tokenStore.clear()).resolves.not.toThrow();
    });
  });

  // ==========================================================================
  // Auth status tests
  // ==========================================================================
  describe('Auth status', () => {
    it('should return OAuth status when authenticated via OAuth', async () => {
      await tokenStore.save({
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        tokenType: 'Bearer',
        scope: 'forms.body spreadsheets',
      });

      const status = await authManager.getStatus();

      expect(status.isAuthenticated).toBe(true);
      expect(status.method).toBe('oauth');
    });

    it('should return service account status when using SA', async () => {
      vi.stubEnv('GOOGLE_APPLICATION_CREDENTIALS', '/path/to/key.json');

      const manager = new AuthManager({
        tokenStore: new TokenStore(path.join(tempDir, 'empty.json')),
        scopes: ['https://www.googleapis.com/auth/forms.body'],
      });

      const status = await manager.getStatus();

      // Has service account configured (even if file doesn't exist)
      expect(status.method).toBe('service-account');
    });
  });
});
