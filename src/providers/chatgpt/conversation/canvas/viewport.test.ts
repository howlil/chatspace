import { describe, expect, it } from 'vitest';

import { createGraphState, graphNodes, reconcileGraph, type TurnSnapshot } from './graphEngine';
import { computeLayeredLayout } from './layout';
import { createViewState, preserveNodeAnchor, worldToScreen } from './viewport';

function turn(id: string, prompt: string): TurnSnapshot {
  return {
    stableKey: `assistant:${id}`,
    promptKey: `u-${id}`,
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

describe('canvas viewport anchoring', () => {
  it('keeps the selected node at the same screen coordinate after branch relayout', () => {
    const state = createGraphState();
    reconcileGraph(state, '/c/a', [turn('root', 'Root'), turn('a', 'A')]);
    const selected = graphNodes(state).find((node) => node.stableKey === 'assistant:a');
    expect(selected).toBeDefined();

    const view = createViewState();
    view.zoom = 0.8;
    view.x = 120;
    view.y = 90;
    view.selectedNodeId = selected?.id ?? null;
    view.positions = computeLayeredLayout(state);
    const beforeWorld = view.positions.get(selected?.id ?? '');
    expect(beforeWorld).toBeDefined();
    const beforeScreen = worldToScreen(view, beforeWorld ?? { x: 0, y: 0 });

    reconcileGraph(state, '/c/b', [turn('root', 'Root'), turn('b', 'B'), turn('b2', 'B2')]);
    const nextPositions = computeLayeredLayout(state);
    preserveNodeAnchor(state, view, nextPositions, selected?.id ?? null);

    const afterWorld = view.positions.get(selected?.id ?? '');
    expect(afterWorld).toBeDefined();
    const afterScreen = worldToScreen(view, afterWorld ?? { x: 0, y: 0 });
    expect(afterScreen.x).toBeCloseTo(beforeScreen.x, 6);
    expect(afterScreen.y).toBeCloseTo(beforeScreen.y, 6);
  });
});
