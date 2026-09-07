import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'Chatspace',
    description: 'A local-first spatial conversation map that lives beside ChatGPT.',
    permissions: ['storage', 'sidePanel', 'scripting'],
    host_permissions: ['https://chatgpt.com/*'],
    action: {
      default_title: 'Open Chatspace',
    },
  },
});
