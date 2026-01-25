import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: [
          'Overview',
          'Project Management',
          'Business Analysis',
          'Requirements',
          'Architecture',
          'Security',
          'Quality',
          'Testing',
          'UX & Design',
          'Database',
          'DevOps',
          'UI Kit',
          ['Tokens', 'Primitives', 'Components'],
        ],
      },
    },
    layout: 'padded',
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#1a1a1a',
        },
      ],
    },
  },
};

export default preview;
