import { describe, expect, it } from 'vitest';

import { loadConversationAnnotations, saveConversationAnnotation, type ConversationAnnotationStorage } from './conversationAnnotationStore';

function storage(): ConversationAnnotationStorage {
  let value: unknown;
  return {
    async get() { return { 'chatspace-conversation-annotations': value }; },
    async set(values) { value = values['chatspace-conversation-annotations']; },
  };
}

describe('conversation annotation store', () => {
  it('persists only explicit derived metadata and scopes it by target', async () => {
    const repository = storage();
    await saveConversationAnnotation(repository, { id: 'a', conversationTarget: 'https://chatgpt.com/c/a', sourceKey: 'u1', note: 'Check this', pinned: true, createdAt: 1, updatedAt: 1 });
    await saveConversationAnnotation(repository, { id: 'b', conversationTarget: 'https://chatgpt.com/c/b', sourceKey: 'u2', note: '', pinned: false, createdAt: 1, updatedAt: 1 });
    expect(await loadConversationAnnotations(repository, 'https://chatgpt.com/c/a')).toHaveLength(1);
    expect(await loadConversationAnnotations(repository, 'https://chatgpt.com/c/b')).toHaveLength(0);
  });
});
