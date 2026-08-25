import { describe, expect, it } from 'vitest';

import { getChatGptCapability, normalizeChatGptTarget } from './adapter';

describe('ChatGPT compatibility adapter', () => {
  it('accepts only explicit standard ChatGPT conversation URLs and strips query/hash metadata', () => {
    expect(normalizeChatGptTarget('https://chatgpt.com/c/abc-123?foo=bar#x')).toBe('https://chatgpt.com/c/abc-123');
    expect(normalizeChatGptTarget('https://chatgpt.com/')).toBeNull();
    expect(normalizeChatGptTarget('https://evil.chatgpt.com/c/abc-123')).toBeNull();
    expect(normalizeChatGptTarget('javascript:alert(1)')).toBeNull();
  });

  it('reports provider capabilities from URL shape only, with no DOM or conversation extraction contract', () => {
    expect(getChatGptCapability('https://chatgpt.com/c/abc-123')).toEqual({
      supportedOrigin: true,
      canCaptureCurrentReference: true,
      currentTarget: 'https://chatgpt.com/c/abc-123',
    });
    expect(getChatGptCapability('https://example.com/c/abc-123')).toEqual({
      supportedOrigin: false,
      canCaptureCurrentReference: false,
      currentTarget: null,
    });
  });
});
