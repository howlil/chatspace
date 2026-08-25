import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Chatspace',
    description: 'A spatial workspace layer for long-form AI conversations.',
    permissions: [],
  },
});
