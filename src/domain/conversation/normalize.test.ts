import { describe, expect, it } from 'vitest';

import { normalizeConversationSnapshot, semanticLabel } from './normalize';

describe('conversation normalization', () => {
  it('builds stable provider-backed message identities and turns', () => {
    const raw = {
      conversationId: 'abc',
      target: 'https://chatgpt.com/c/abc',
      messages: [
        { role: 'user' as const, text: '# Database   design', providerId: 'u1' },
        { role: 'assistant' as const, text: 'I recommend PostgreSQL.', providerId: 'a1', codeBlockCount: 1 },
        { role: 'user' as const, text: 'What about Redis?', providerId: 'u2' },
        { role: 'assistant' as const, text: 'Use it for caching.', providerId: 'a2' },
      ],
    };

    const first = normalizeConversationSnapshot(raw);
    const second = normalizeConversationSnapshot(raw);

    expect(first.messages.map((message) => message.id)).toEqual(second.messages.map((message) => message.id));
    expect(first.messages[0]?.source).toEqual({ sourceId: 'u1', strategy: 'provider-id' });
    expect(first.turns).toHaveLength(2);
    expect(first.turns[0]).toMatchObject({ label: 'Database design', responseMessageIds: ['message:a1'] });
    expect(first.turns[1]).toMatchObject({ previousTurnId: 'turn:message:u1' });
  });

  it('uses DOM and fingerprint fallbacks without persisting DOM references', () => {
    const snapshot = normalizeConversationSnapshot({
      conversationId: 'abc',
      target: 'https://chatgpt.com/c/abc',
      messages: [
        { role: 'user', text: 'hello', domId: 'dom-u' },
        { role: 'assistant', text: 'world' },
      ],
    });

    expect(snapshot.messages[0]?.source.strategy).toBe('dom-id');
    expect(snapshot.messages[1]?.source.strategy).toBe('fingerprint');
    expect(JSON.stringify(snapshot)).not.toContain('HTMLElement');
  });

  it('derives a compact semantic line', () => {
    expect(semanticLabel('  ## Redis invalidation\n\nMore detail')).toBe('Redis invalidation');
    expect(semanticLabel('  \n')).toBe('Untitled turn');
  });
});
