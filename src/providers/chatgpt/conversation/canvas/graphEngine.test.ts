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
  id?: string;
  prompt?: string;
  response?: string;
  streaming?: boolean;
} = {}): TurnSnapshot {
  const prompt = options.prompt ?? 'Question';
  const response = options.response ?? 'Answer';
  return {
    stableKey: options.id === undefined ? null : `assistant:${options.id}`,
    promptKey: options.id === undefined ? null : `user:${options.id}`,
    responseKey: options.id ?? null,
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
  it('uses provider identity so streaming content updates do not create topology', () => {
    const state = createGraphState();
    const first = reconcileGraph(state, '/c/a', [snapshot({ id: 'm1', response: 'A', streaming: true })]);
    expect(first.topologyChanged).toBe(true);
    expect(graphNodes(state)).toHaveLength(1);

    const update = reconcileGraph(state, '/c/a', [snapshot({ id: 'm1', response: 'A longer streamed answer', streaming: true })]);
    expect(update.topologyChanged).toBe(false);
    expect(update.changedNodeIds.size).toBe(1);
    expect(graphNodes(state)).toHaveLength(1);
    expect(graphNodes(state)[0]?.responseText).toBe('A longer streamed answer');
  });

  it('reuses a stable shared prefix and indexes sibling branches once', () => {
    const state = createGraphState();
    reconcileGraph(state, '/c/a', [
      snapshot({ id: 'root', prompt: 'Root', response: 'Root answer' }),
      snapshot({ id: 'a2', prompt: 'A', response: 'A answer' }),
    ]);

    const fork = reconcileGraph(state, '/c/b', [
      snapshot({ id: 'root', prompt: 'Root', response: 'Root answer' }),
      snapshot({ id: 'b2', prompt: 'B', response: 'B answer' }),
    ]);

    expect(fork.activePathChanged).toBe(true);
    expect(graphNodes(state)).toHaveLength(3);
    const root = graphNodes(state).find((node) => node.stableKey === 'assistant:root');
    expect(root).toBeDefined();
    expect(childIds(state, root?.id ?? null)).toHaveLength(2);
  });

  it('restores structural metadata without persisting transcript content, then hydrates it', () => {
    const state = createGraphState();
    reconcileGraph(state, '/c/a', [snapshot({ id: 'root', prompt: 'Secret prompt', response: 'Secret answer' })]);
    const persisted = serializeGraphState(state);

    expect(JSON.stringify(persisted)).not.toContain('Secret prompt');
    expect(JSON.stringify(persisted)).not.toContain('Secret answer');

    const restored = restoreGraphState(persisted);
    expect(graphNodes(restored)[0]?.hydrated).toBe(false);
    const result = reconcileGraph(restored, '/c/a', [snapshot({ id: 'root', prompt: 'Secret prompt', response: 'Secret answer' })]);
    expect(result.topologyChanged).toBe(false);
    expect(result.changedNodeIds.size).toBe(1);
    expect(graphNodes(restored)[0]?.hydrated).toBe(true);
  });
});
