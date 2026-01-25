import { addons } from '@storybook/manager-api';
import { themes } from '@storybook/theming';

addons.setConfig({
  theme: {
    ...themes.light,
    brandTitle: 'iac-google-forms Planning Hub',
    brandUrl: '/',
    brandTarget: '_self',
  },
  sidebar: {
    showRoots: true,
    collapsedRoots: ['UI Kit'],
  },
});
