import { describe, expect, it } from 'vitest';

import { normalizeChatGptTarget } from './adapter';

describe('ChatGPT URL adapter', () => {
  it('accepts only standard ChatGPT conversation URLs and removes query/hash metadata', () => {
    expect(normalizeChatGptTarget('https://chatgpt.com/c/abc-123?foo=bar#x')).toBe('https://chatgpt.com/c/abc-123');
    expect(normalizeChatGptTarget('https://chatgpt.com/')).toBeNull();
    expect(normalizeChatGptTarget('https://evil.chatgpt.com/c/abc-123')).toBeNull();
    expect(normalizeChatGptTarget('javascript:alert(1)')).toBeNull();
  });
});
