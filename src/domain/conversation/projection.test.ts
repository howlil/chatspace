import { describe, expect, it } from 'vitest';

import { normalizeConversationSnapshot } from './normalize';
import { projectConversationGraph } from './projection';
import { focusConversationGraph, searchConversation } from './selectors';

function snapshot() {
  return normalizeConversationSnapshot({
    conversationId: 'abc',
    target: 'https://chatgpt.com/c/abc',
    messages: [
      { role: 'user', text: 'Database schema', providerId: 'u1' },
      { role: 'assistant', text: 'Postgres', providerId: 'a1' },
      { role: 'user', text: 'Redis caching', providerId: 'u2' },
      { role: 'assistant', text: 'Use Redis', providerId: 'a2' },
    ],
  });
}

describe('conversation graph projection', () => {
  it('projects a truthful turn-first graph without inventing branches', () => {
    const graph = projectConversationGraph(snapshot());
    expect(graph.nodes.map((node) => node.kind)).toEqual(['conversation', 'turn', 'turn']);
    expect(graph.edges.filter((edge) => edge.kind === 'branch')).toHaveLength(0);
    expect(graph.edges.filter((edge) => edge.kind === 'next')).toHaveLength(1);
  });

  it('searches message text and focuses the selected turn neighborhood', () => {
    const current = snapshot();
    const graph = projectConversationGraph(current);
    const matches = searchConversation(current, graph, 'redis');
    const redis = graph.nodes.find((node) => node.label === 'Redis caching');
    expect(redis).toBeDefined();
    expect(matches.has(redis?.id ?? '')).toBe(true);
    expect(focusConversationGraph(graph, redis?.id)).toEqual(new Set([graph.nodes[0]?.id, redis?.id, graph.nodes[1]?.id]));
  });
});
