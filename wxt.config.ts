import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Chatspace',
    description: 'A local-first workspace layer that lives beside ChatGPT.',
    permissions: ['storage', 'sidePanel'],
    host_permissions: ['https://chatgpt.com/*'],
    action: {
      default_title: 'Open Chatspace',
    },
    optional_host_permissions: ['http://127.0.0.1:27123/*'],
  },
});
