import { mountChatGptTurnCards } from '../src/providers/chatgpt/conversation/turnCards';

export default defineContentScript({
  matches: ['https://chatgpt.com/*'],
  runAt: 'document_idle',
  main(ctx) {
    const controller = mountChatGptTurnCards();
    ctx.onInvalidated(() => controller.disconnect());
  },
});
