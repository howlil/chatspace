import { describe, expect, it } from 'vitest';

import { createGraphState, reconcileGraph, type TurnSnapshot } from './graphEngine';
import { CARD_HEIGHT, Y_GAP, computeLayeredLayout } from './layout';

function turn(id: string, prompt: string): TurnSnapshot {
  return {
    stableKey: `assistant:${id}`,
    promptKey: `user:${id}`,
    responseKey: id,
    promptText: prompt,
    responseText: `${prompt} answer`,
    signature: `${prompt}\u0000${prompt} answer`,
    streaming: false,
    hasVariants: false,
    promptSource: null,
    responseSource: null,
  };
}

describe('layered conversation layout', () => {
  it('keeps depth horizontal and separates sibling subtrees without overlap', () => {
    const state = createGraphState();
    reconcileGraph(state, '/c/a', [turn('root', 'Root'), turn('a', 'A')]);
    reconcileGraph(state, '/c/b', [turn('root', 'Root'), turn('b', 'B'), turn('b2', 'B2')]);

    const positions = computeLayeredLayout(state);
    const nodes = Array.from(state.nodesById.values());
    const root = nodes.find((node) => node.stableKey === 'assistant:root');
    const a = nodes.find((node) => node.stableKey === 'assistant:a');
    const b = nodes.find((node) => node.stableKey === 'assistant:b');

    expect(root).toBeDefined();
    expect(a).toBeDefined();
    expect(b).toBeDefined();
    expect((positions.get(a?.id ?? '')?.x ?? 0)).toBeGreaterThan(positions.get(root?.id ?? '')?.x ?? 0);
    expect(Math.abs((positions.get(a?.id ?? '')?.y ?? 0) - (positions.get(b?.id ?? '')?.y ?? 0))).toBeGreaterThanOrEqual(CARD_HEIGHT + Y_GAP);
  });
});
