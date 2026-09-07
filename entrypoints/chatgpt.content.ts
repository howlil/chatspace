import { browser } from 'wxt/browser';

import type { ChatGptBridgeEvent, ChatGptBridgeRequest } from '../src/providers/chatgpt/conversation/bridge';
import type { ConversationSnapshot } from '../src/domain/conversation/model';
import { createChatGptDomAdapter } from '../src/providers/chatgpt/conversation/domAdapter';
import { observeConversation } from '../src/providers/chatgpt/conversation/observeConversation';

export default defineContentScript({
  matches: ['https://chatgpt.com/*'],
  runAt: 'document_idle',
  main(ctx) {
    const adapter = createChatGptDomAdapter();
    const publish = (snapshot: ConversationSnapshot | null) => {
      const event: ChatGptBridgeEvent = { type: 'chatspace/conversation/snapshot', snapshot };
      void browser.runtime.sendMessage(event).catch(() => undefined);
    };
    const stopObservation = observeConversation(adapter, publish);
    const stopVisible = adapter.subscribeVisible((sourceId) => {
      const event: ChatGptBridgeEvent = { type: 'chatspace/conversation/source-visible', sourceId };
      void browser.runtime.sendMessage(event).catch(() => undefined);
    });

    const onMessage = (message: ChatGptBridgeRequest, _sender: unknown, sendResponse: (response: unknown) => void) => {
      if (message?.type === 'chatspace/conversation/read') {
        sendResponse({ type: 'chatspace/conversation/snapshot', snapshot: adapter.readConversation() });
        return false;
      }
      if (message?.type === 'chatspace/conversation/reveal') {
        sendResponse({ ok: adapter.revealMessage(message.sourceId) });
        return false;
      }
      return false;
    };
    browser.runtime.onMessage.addListener(onMessage);
    ctx.onInvalidated(() => {
      stopObservation();
      stopVisible();
      browser.runtime.onMessage.removeListener(onMessage);
    });
  },
});
