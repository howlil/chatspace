import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Chatspace',
    description: 'Turns rendered ChatGPT conversations into a zoomable, branch-aware canvas directly in the conversation pane.',
    permissions: ['storage'],
    host_permissions: ['https://chatgpt.com/*'],
  },
});
