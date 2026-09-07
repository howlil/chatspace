import { describe, expect, it, vi } from 'vitest';

import { projectConversationGraph } from '../../../domain/conversation/projection';
import { normalizeConversationSnapshot } from '../../../domain/conversation/normalize';
import { ChatGptDomAdapter } from './domAdapter';

describe('conversation bridge integration', () => {
  it('reads a DOM fixture, projects turns, and navigates back to the exact source element', () => {
    document.body.innerHTML = `
      <main>
        <article data-message-id="u1"><div data-message-author-role="user">Explain Redis caching</div></article>
        <article data-message-id="a1"><div data-message-author-role="assistant">Use Redis for hot data.</div></article>
      </main>`;
    const source = document.querySelector<HTMLElement>('[data-message-id="u1"]');
    expect(source).not.toBeNull();
    if (source === null) return;
    vi.spyOn(source, 'scrollIntoView').mockImplementation(() => undefined);
    const adapter = new ChatGptDomAdapter(() => 'https://chatgpt.com/c/redis');
    const snapshot = adapter.readConversation();
    expect(snapshot).not.toBeNull();
    if (snapshot === null) return;
    const graph = projectConversationGraph(snapshot);
    expect(graph.nodes.some((node) => node.label === 'Explain Redis caching')).toBe(true);
    expect(adapter.revealMessage(snapshot.messages[0]?.source.sourceId ?? '')).toBe(true);
  });

  it('keeps a large turn projection bounded and deterministic', () => {
    const messages = Array.from({ length: 500 }, (_, index) => ({
      role: index % 2 === 0 ? 'user' as const : 'assistant' as const,
      text: index % 2 === 0 ? `Prompt ${index / 2}` : `Response ${index / 2}`,
      providerId: `message-${index}`,
    }));
    const snapshot = normalizeConversationSnapshot({ conversationId: 'large', target: 'https://chatgpt.com/c/large', messages });
    const graph = projectConversationGraph(snapshot);
    expect(snapshot.turns).toHaveLength(250);
    expect(graph.nodes).toHaveLength(251);
    expect(graph.edges.filter((edge) => edge.kind === 'branch')).toHaveLength(0);
  });
});
