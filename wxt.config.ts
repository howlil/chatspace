import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Chatspace',
    description: 'A spatial workspace layer for long-form AI conversations.',
    permissions: ['storage'],
    optional_host_permissions: ['http://127.0.0.1:27123/*'],
  },
});
