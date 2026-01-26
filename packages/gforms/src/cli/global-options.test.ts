/**
 * Tests for global CLI options
 */

import chalk from 'chalk';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { applyGlobalOptions, getGlobalOptions } from './global-options.js';

describe('global options', () => {
  let originalChalkLevel: number;

  beforeEach(() => {
    originalChalkLevel = chalk.level;
    applyGlobalOptions({});
  });

  afterEach(() => {
    chalk.level = originalChalkLevel;
    applyGlobalOptions({});
  });

  describe('applyGlobalOptions', () => {
    it('should set verbose from opts', () => {
      applyGlobalOptions({ verbose: true });
      expect(getGlobalOptions().verbose).toBe(true);
    });

    it('should set quiet from opts', () => {
      applyGlobalOptions({ quiet: true });
      expect(getGlobalOptions().quiet).toBe(true);
    });

    it('should disable chalk when color is false', () => {
      applyGlobalOptions({ color: false });
      expect(getGlobalOptions().color).toBe(false);
      expect(chalk.level).toBe(0);
    });

    it('should keep chalk enabled when color is not false', () => {
      applyGlobalOptions({ color: true });
      expect(getGlobalOptions().color).toBe(true);
    });

    it('should set config path from opts', () => {
      applyGlobalOptions({ config: 'custom.config.ts' });
      expect(getGlobalOptions().configPath).toBe('custom.config.ts');
    });

    it('should use default config path when not provided', () => {
      applyGlobalOptions({});
      expect(getGlobalOptions().configPath).toBe('gforms.config.ts');
    });
  });

  describe('getGlobalOptions', () => {
    it('should return defaults initially', () => {
      const opts = getGlobalOptions();
      expect(opts.verbose).toBe(false);
      expect(opts.quiet).toBe(false);
      expect(opts.color).toBe(true);
      expect(opts.configPath).toBe('gforms.config.ts');
    });
  });
});
