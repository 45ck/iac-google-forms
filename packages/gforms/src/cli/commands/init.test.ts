/**
 * Tests for init CLI command
 * Covers TC-CLI-001
 */

import * as fs from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitCommand } from './init.js';

vi.mock('node:fs/promises');

describe('init command', () => {
  const mockFs = vi.mocked(fs);

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: directory does not exist
    mockFs.access.mockRejectedValue(new Error('ENOENT'));
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.appendFile.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createInitCommand', () => {
    it('should create a command with correct name', () => {
      const cmd = createInitCommand();
      expect(cmd.name()).toBe('init');
    });

    it('should have --force option', () => {
      const cmd = createInitCommand();
      const option = cmd.options.find((o) => o.long === '--force');
      expect(option).toBeDefined();
    });
  });

  describe('TC-CLI-001: creates project structure', () => {
    it('should create .gforms directory', async () => {
      const cmd = createInitCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test']);

      expect(mockFs.mkdir).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should create state.json', async () => {
      const cmd = createInitCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test']);

      const stateCall = mockFs.writeFile.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('state.json')
      );
      expect(stateCall).toBeDefined();

      consoleSpy.mockRestore();
    });

    it('should create config file', async () => {
      const cmd = createInitCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test']);

      const configCall = mockFs.writeFile.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('gforms.config.ts')
      );
      expect(configCall).toBeDefined();

      consoleSpy.mockRestore();
    });

    it('should create example form', async () => {
      const cmd = createInitCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test']);

      const exampleCall = mockFs.writeFile.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('example.ts')
      );
      expect(exampleCall).toBeDefined();

      consoleSpy.mockRestore();
    });

    it('should show next steps', async () => {
      const cmd = createInitCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test']);

      const calls = consoleSpy.mock.calls;
      const hasNextSteps = calls.some((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('initialized'))
      );
      expect(hasNextSteps).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe('gitignore dedup', () => {
    it('should not duplicate gitignore entries on reinit', async () => {
      // Everything exists (reinit with --force scenario)
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue('# gforms\n.gforms/credentials.json\n');

      const cmd = createInitCommand();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      await cmd.parseAsync(['node', 'test', '--force']);

      // Should NOT have called appendFile since gitignore already has the entry
      expect(mockFs.appendFile).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('existing project', () => {
    it('should error if already initialized without --force', async () => {
      // .gforms directory exists
      mockFs.access.mockResolvedValue(undefined);

      const cmd = createInitCommand();
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await cmd.parseAsync(['node', 'test']);

      expect(exitSpy).toHaveBeenCalledWith(1);

      errorSpy.mockRestore();
      exitSpy.mockRestore();
    });
  });
});
