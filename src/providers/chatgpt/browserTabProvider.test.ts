import { describe, expect, it, vi } from 'vitest';

import {
  classifyProviderTab,
  navigateActiveProvider,
  readActiveProviderState,
  type ProviderTabsPort,
} from './browserTabProvider';

function port(url?: string): ProviderTabsPort {
  return {
    getActive: vi.fn(async () => ({ id: 7, url })),
    update: vi.fn(async () => undefined),
    create: vi.fn(async () => undefined),
  };
}

describe('browser ChatGPT tab provider', () => {
  it('classifies an active conversation without reading page content', async () => {
    const state = await readActiveProviderState(port('https://chatgpt.com/c/abc-123?utm_source=test'));

    expect(state).toEqual({
      kind: 'conversation',
      url: 'https://chatgpt.com/c/abc-123?utm_source=test',
      target: 'https://chatgpt.com/c/abc-123',
    });
  });

  it('distinguishes ChatGPT home from an unavailable tab', () => {
    expect(classifyProviderTab({ id: 1, url: 'https://chatgpt.com/' }).kind).toBe('chatgpt');
    expect(classifyProviderTab({ id: 2, url: 'https://example.com/' }).kind).toBe('unavailable');
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
