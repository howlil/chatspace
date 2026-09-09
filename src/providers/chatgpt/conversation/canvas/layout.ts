import { childIds, graphNodes, nodeById, type CanvasGraphState } from './graphEngine';

export const CARD_WIDTH = 296;
export const CARD_HEIGHT = 166;
export const X_GAP = 96;
export const Y_GAP = 58;
export const PADDING = 96;

export interface NodePosition {
  x: number;
  y: number;
}

export interface GraphBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function fallbackPosition(depth: number, order: number): NodePosition {
  return {
    x: PADDING + depth * (CARD_WIDTH + X_GAP),
    y: PADDING + Math.max(0, order - 1) * (CARD_HEIGHT + Y_GAP),
  };
}

/**
 * Compact deterministic tree layout for the currently rendered conversation graph.
 * The graph invariant is one parent per turn, so a linear-time layered layout is
 * sufficient and avoids running a general graph solver while tokens stream.
 */
export function computeLayeredLayout(state: CanvasGraphState): Map<string, NodePosition> {
  const positions = new Map<string, NodePosition>();
  const heightById = new Map<string, number>();
  const visiting = new Set<string>();

  const subtreeHeight = (id: string): number => {
    const cached = heightById.get(id);
    if (cached !== undefined) return cached;
    if (visiting.has(id)) return CARD_HEIGHT;
    visiting.add(id);
    const children = childIds(state, id);
    let height = CARD_HEIGHT;
    if (children.length > 0) {
      let sum = 0;
      for (const childId of children) sum += subtreeHeight(childId);
      sum += Y_GAP * Math.max(0, children.length - 1);
      height = Math.max(CARD_HEIGHT, sum);
    }
    visiting.delete(id);
    heightById.set(id, height);
    return height;
  };

  const place = (id: string, top: number): void => {
    const node = nodeById(state, id);
    if (node === null || positions.has(id)) return;
    const height = subtreeHeight(id);
    positions.set(id, {
      x: PADDING + node.depth * (CARD_WIDTH + X_GAP),
      y: top + (height - CARD_HEIGHT) / 2,
    });

    let childTop = top;
    for (const childId of childIds(state, id)) {
      place(childId, childTop);
      childTop += subtreeHeight(childId) + Y_GAP;
    }
  };

  let rootTop = PADDING;
  const roots = childIds(state, null);
  for (const rootId of roots) {
    place(rootId, rootTop);
    rootTop += subtreeHeight(rootId) + Y_GAP * 2;
  }

  // Corrupt/incomplete persisted metadata should not make nodes disappear.
  for (const node of graphNodes(state)) {
    if (!positions.has(node.id)) positions.set(node.id, fallbackPosition(node.depth, node.order));
  }

  return positions;
}

export function graphBounds(
  state: CanvasGraphState,
  positions: ReadonlyMap<string, NodePosition>,
): GraphBounds {
  const nodes = graphNodes(state);
  if (nodes.length === 0) return { x: 0, y: 0, width: 1, height: 1 };

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const node of nodes) {
    const point = positions.get(node.id) ?? fallbackPosition(node.depth, node.order);
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x + CARD_WIDTH);
    maxY = Math.max(maxY, point.y + CARD_HEIGHT);
  }

  return {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}
