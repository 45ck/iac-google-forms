/**
 * Tests for list CLI command
 * Covers TC-CLI-008
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createListCommand } from './list.js';

const mockListForms = vi.fn();

vi.mock('../../state/state-manager.js', () => ({
  StateManager: class MockStateManager {
    listForms = mockListForms;
  },
}));

describe('list command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListForms.mockResolvedValue([
      { localPath: 'forms/feedback.json', formId: 'abc123', lastDeployed: '2026-01-25T10:30:00Z' },
      { localPath: 'forms/survey.json', formId: 'def456', lastDeployed: '2026-01-24T09:15:00Z' },
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createListCommand', () => {
    it('should create a command with correct name', () => {
      const cmd = createListCommand();
      expect(cmd.name()).toBe('list');
    });

    it('should have --format option', () => {
      const cmd = createListCommand();
      const option = cmd.options.find((o) => o.long === '--format');
      expect(option).toBeDefined();
    });
  });

  describe('TC-CLI-008: list shows forms', () => {
    it('should display tracked forms in table format', async () => {
      const cmd = createListCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test']);

      const calls = consoleSpy.mock.calls;
      const hasHeader = calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('Tracked Forms'))
      );
      expect(hasHeader).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should show form count', async () => {
      const cmd = createListCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test']);

      const calls = consoleSpy.mock.calls;
      const hasCount = calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('2 form(s)'))
      );
      expect(hasCount).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should show empty message when no forms tracked', async () => {
      mockListForms.mockResolvedValue([]);

      const cmd = createListCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test']);

      const calls = consoleSpy.mock.calls;
      const hasEmpty = calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('No forms tracked'))
      );
      expect(hasEmpty).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe('json format', () => {
    it('should output JSON when --format json', async () => {
      const cmd = createListCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', '--format', 'json']);

      const jsonCall = consoleSpy.mock.calls.find((call) => {
        try {
          JSON.parse(String(call[0]));
          return true;
        } catch {
          return false;
        }
      });
      expect(jsonCall).toBeDefined();

      consoleSpy.mockRestore();
    });
  });
});
