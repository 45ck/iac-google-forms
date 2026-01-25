import type { StorybookConfig } from '@storybook/react-vite';
import { dirname, join } from 'path';

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, 'package.json')));
}

const config: StorybookConfig = {
  framework: getAbsolutePath('@storybook/react-vite'),

  stories: [
    '../src/docs/**/*.mdx',
    '../src/docs/**/*.stories.@(js|jsx|ts|tsx)',
    '../../ui/src/**/*.stories.@(js|jsx|ts|tsx)',
  ],

  addons: [
    getAbsolutePath('@storybook/addon-essentials'),
    getAbsolutePath('@storybook/addon-links'),
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('@storybook/addon-themes'),
  ],

  staticDirs: ['../public'],

  viteFinal: async (config) => {
    const { mergeConfig } = await import('vite');

    return mergeConfig(config, {
      resolve: {
        alias: {
          '@ui': join(__dirname, '../../ui/src'),
          '@artifacts': join(__dirname, '../public/artifacts'),
        },
      },
    });
  },

  docs: {
    autodocs: 'tag',
  },
};

export default config;
