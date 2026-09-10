import { describe, expect, it } from 'vitest';

import {
  childIds,
  createGraphState,
  graphNodes,
  reconcileGraph,
  restoreGraphState,
  serializeGraphState,
  type TurnSnapshot,
} from './graphEngine';

function snapshot(options: {
  promptId?: string;
  responseId?: string;
  prompt?: string;
  response?: string;
  streaming?: boolean;
} = {}): TurnSnapshot {
  const prompt = options.prompt ?? 'Question';
  const response = options.response ?? 'Answer';
  const promptKey = options.promptId ?? null;
  const responseKey = options.responseId ?? null;
  return {
    stableKey: responseKey !== null ? `assistant:${responseKey}` : promptKey !== null ? `user:${promptKey}` : null,
    promptKey,
    responseKey,
    promptText: prompt,
    responseText: response,
    signature: `${prompt}\u0000${response}`,
    streaming: options.streaming ?? false,
    hasVariants: false,
    promptSource: null,
    responseSource: null,
  };
}

describe('conversation graph engine', () => {
  it('uses provider response identity so streaming content updates do not create topology', () => {
    const state = createGraphState();
    const first = reconcileGraph(state, '/c/a', [snapshot({ promptId: 'u1', responseId: 'm1', response: 'A', streaming: true })]);
    expect(first.topologyChanged).toBe(true);
    expect(graphNodes(state)).toHaveLength(1);

    const update = reconcileGraph(state, '/c/a', [snapshot({ promptId: 'u1', responseId: 'm1', response: 'A longer streamed answer', streaming: true })]);
    expect(update.topologyChanged).toBe(false);
    expect(update.changedNodeIds.size).toBe(1);
    expect(graphNodes(state)).toHaveLength(1);
    expect(graphNodes(state)[0]?.responseText).toBe('A longer streamed answer');
  });

  it('keeps a prompt-only turn as the same logical node when a completed assistant response appears', () => {
    const state = createGraphState();
    reconcileGraph(state, '/c/a', [snapshot({ promptId: 'u1', prompt: 'Question', response: '' })]);
    const pending = graphNodes(state)[0];
    expect(pending?.providerAliases.has('user:u1')).toBe(true);

    const completed = reconcileGraph(state, '/c/a', [snapshot({ promptId: 'u1', responseId: 'a1', prompt: 'Question', response: 'Final answer' })]);
    expect(completed.topologyChanged).toBe(false);
    expect(graphNodes(state)).toHaveLength(1);
    expect(graphNodes(state)[0]?.id).toBe(pending?.id);
    expect(graphNodes(state)[0]?.providerAliases.has('assistant:a1')).toBe(true);
    expect(state.nodeIdByProviderAlias.get('user:u1')).toBe(pending?.id);
    expect(state.nodeIdByProviderAlias.get('assistant:a1')).toBe(pending?.id);
  });

  it('reuses a stable shared prefix and indexes sibling branches once', () => {
    const state = createGraphState();
    reconcileGraph(state, '/c/a', [
      snapshot({ promptId: 'u-root', responseId: 'root', prompt: 'Root', response: 'Root answer' }),
      snapshot({ promptId: 'u-a2', responseId: 'a2', prompt: 'A', response: 'A answer' }),
    ]);

    const fork = reconcileGraph(state, '/c/b', [
      snapshot({ promptId: 'u-root', responseId: 'root', prompt: 'Root', response: 'Root answer' }),
      snapshot({ promptId: 'u-b2', responseId: 'b2', prompt: 'B', response: 'B answer' }),
    ]);

    expect(fork.activePathChanged).toBe(true);
    expect(graphNodes(state)).toHaveLength(3);
    const root = graphNodes(state).find((node) => node.stableKey === 'assistant:root');
    expect(root).toBeDefined();
    expect(childIds(state, root?.id ?? null)).toHaveLength(2);
  });

  it('restores structural aliases without persisting transcript content, then hydrates it', () => {
    const state = createGraphState();
    reconcileGraph(state, '/c/a', [snapshot({ promptId: 'u-root', responseId: 'root', prompt: 'Secret prompt', response: 'Secret answer' })]);
    const persisted = serializeGraphState(state);

    expect(persisted.version).toBe(2);
    expect(JSON.stringify(persisted)).not.toContain('Secret prompt');
    expect(JSON.stringify(persisted)).not.toContain('Secret answer');

    const restored = restoreGraphState(persisted);
    expect(graphNodes(restored)[0]?.hydrated).toBe(false);
    expect(restored.nodeIdByProviderAlias.get('user:u-root')).toBe(graphNodes(restored)[0]?.id);
    const result = reconcileGraph(restored, '/c/a', [snapshot({ promptId: 'u-root', responseId: 'root', prompt: 'Secret prompt', response: 'Secret answer' })]);
    expect(result.topologyChanged).toBe(false);
    expect(result.changedNodeIds.size).toBe(1);
    expect(graphNodes(restored)[0]?.hydrated).toBe(true);
  });
});
