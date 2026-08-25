import { browser } from 'wxt/browser';

import { normalizeChatGptTarget } from '../src/providers/chatgpt/adapter';

type ProviderMessage =
  | { type: 'chatspace/provider/location' }
  | { type: 'chatspace/provider/navigate'; target: string };

export default defineContentScript({
  matches: ['https://chatgpt.com/*'],
  main() {
    browser.runtime.onMessage.addListener((message: ProviderMessage) => {
      if (message.type === 'chatspace/provider/location') {
        return { href: window.location.href };
      }

      if (message.type === 'chatspace/provider/navigate') {
        const target = normalizeChatGptTarget(message.target);
        if (target === null) {
          return { ok: false, error: 'Unsupported ChatGPT conversation target.' };
        }
        window.location.assign(target);
        return { ok: true, target };
      }

      return undefined;
    });
  },
});
