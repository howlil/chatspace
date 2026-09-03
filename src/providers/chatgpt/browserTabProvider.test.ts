import { describe, expect, it, vi } from 'vitest';

import {
  classifyProviderTab,
  navigateActiveProvider,
  readActiveProviderState,
  type ProviderTabsPort,
} from './browserTabProvider';

function port(url?: string, title = 'ChatGPT'): ProviderTabsPort {
  return {
    getActive: vi.fn(async () => ({ id: 7, url, title, windowId: 2 })),
    findByTarget: vi.fn(async () => undefined),
    focus: vi.fn(async () => undefined),
    update: vi.fn(async () => undefined),
    create: vi.fn(async () => undefined),
  };
}

describe('browser ChatGPT tab provider', () => {
  it('classifies an active conversation and exposes only browser-tab metadata', async () => {
    const state = await readActiveProviderState(port('https://chatgpt.com/c/abc-123?utm_source=test', 'Database isolation - ChatGPT'));

    expect(state).toEqual({
      kind: 'conversation',
      url: 'https://chatgpt.com/c/abc-123?utm_source=test',
      target: 'https://chatgpt.com/c/abc-123',
      title: 'Database isolation - ChatGPT',
    });
  });

  it('distinguishes ChatGPT home from an unavailable tab', () => {
    expect(classifyProviderTab({ id: 1, url: 'https://chatgpt.com/', title: 'ChatGPT', windowId: 1 }).kind).toBe('chatgpt');
    expect(classifyProviderTab({ id: 2, url: 'https://example.com/', title: 'Example', windowId: 1 }).kind).toBe('unavailable');
  });

  it('focuses an existing matching conversation before navigating or creating another tab', async () => {
    const existing = port('https://chatgpt.com/');
    const matching = { id: 11, url: 'https://chatgpt.com/c/next', title: 'Next', windowId: 4 };
    vi.mocked(existing.findByTarget!).mockResolvedValue(matching);

    await navigateActiveProvider(existing, 'https://chatgpt.com/c/next?utm_source=test');

    expect(existing.focus).toHaveBeenCalledWith(matching);
    expect(existing.update).not.toHaveBeenCalled();
    expect(existing.create).not.toHaveBeenCalled();
  });

  it('navigates the active ChatGPT tab and opens a new tab when ChatGPT is not active', async () => {
    const activeChatGpt = port('https://chatgpt.com/');
    await navigateActiveProvider(activeChatGpt, 'https://chatgpt.com/c/next?utm_source=test');
    expect(activeChatGpt.update).toHaveBeenCalledWith(7, 'https://chatgpt.com/c/next');
    expect(activeChatGpt.create).not.toHaveBeenCalled();

    const otherTab = port('https://example.com/');
    await navigateActiveProvider(otherTab, 'https://chatgpt.com/c/next');
    expect(otherTab.create).toHaveBeenCalledWith('https://chatgpt.com/c/next');
  });
});
