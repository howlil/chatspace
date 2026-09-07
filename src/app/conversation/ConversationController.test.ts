import { describe, expect, it, vi } from 'vitest';

import { normalizeConversationSnapshot } from '../../domain/conversation/normalize';
import type { ChatGptBridgeRequest } from '../../providers/chatgpt/conversation/bridge';
import { ConversationController, type ConversationControllerPort } from './ConversationController';

function createPort(response: unknown): ConversationControllerPort {
  return {
    getActiveTab: async () => ({ id: 7, url: 'https://chatgpt.com/c/abc', title: 'Redis' }),
    sendMessage: vi.fn<(tabId: number, message: ChatGptBridgeRequest) => Promise<unknown>>().mockResolvedValue(response),
    ensureContentScript: vi.fn().mockResolvedValue(undefined),
    subscribe: () => () => undefined,
  };
}

describe('ConversationController', () => {
  it('loads a supported active conversation into an available state', async () => {
    const snapshot = normalizeConversationSnapshot({ conversationId: 'abc', target: 'https://chatgpt.com/c/abc', messages: [{ role: 'user', text: 'Redis', providerId: 'u1' }] });
    const controller = new ConversationController(createPort({ type: 'chatspace/conversation/snapshot', snapshot }));
    await controller.refresh();
    expect(controller.getState()).toMatchObject({ phase: 'available', snapshot });
  });

  it('fails closed when the page has no readable structure and sends explicit source navigation', async () => {
    const port = createPort({ type: 'chatspace/conversation/snapshot', snapshot: normalizeConversationSnapshot({ conversationId: 'abc', target: 'https://chatgpt.com/c/abc', messages: [], availability: 'dom-unsupported' }) });
    const controller = new ConversationController(port);
    await controller.refresh();
    expect(controller.getState()).toMatchObject({ phase: 'unsupported', error: expect.stringContaining('could not read') });
    expect(await controller.revealSource('u1')).toBe(false);
  });

  it('reconnects the bridge without reloading the provider tab when the receiver is missing', async () => {
    const snapshot = normalizeConversationSnapshot({ conversationId: 'abc', target: 'https://chatgpt.com/c/abc', messages: [{ role: 'user', text: 'Redis', providerId: 'u1' }] });
    const port = createPort({ type: 'chatspace/conversation/snapshot', snapshot });
    const sendMessage = port.sendMessage as ReturnType<typeof vi.fn>;
    const ensureContentScript = port.ensureContentScript as ReturnType<typeof vi.fn>;
    sendMessage.mockRejectedValueOnce(new Error('Receiving end does not exist')).mockResolvedValueOnce({ type: 'chatspace/conversation/snapshot', snapshot });

    const controller = new ConversationController(port);
    await controller.refresh();

    expect(ensureContentScript).toHaveBeenCalledWith(7);
    expect(sendMessage).toHaveBeenCalledTimes(2);
    expect(controller.getState()).toMatchObject({ phase: 'available', snapshot });
  });
});
