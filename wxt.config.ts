import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Chatspace',
    description: 'Turns rendered ChatGPT responses into clear, animated cards directly in the conversation pane.',
    host_permissions: ['https://chatgpt.com/*'],
  },
});
