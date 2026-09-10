import { graphBounds, CARD_HEIGHT, CARD_WIDTH, type NodePosition } from './layout';
import { nodeById, type CanvasGraphState, type GraphNode } from './graphEngine';

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 2;

export interface CanvasViewState {
  x: number;
  y: number;
  zoom: number;
  selectedNodeId: string | null;
  searchQuery: string;
  followLatest: boolean;
  positions: Map<string, NodePosition>;
}

export function createViewState(): CanvasViewState {
  return { x: 64, y: 92, zoom: 1, selectedNodeId: null, searchQuery: '', followLatest: true, positions: new Map() };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function positionOf(view: CanvasViewState, node: GraphNode): NodePosition {
  return view.positions.get(node.id) ?? { x: 0, y: 0 };
}

export function worldToScreen(view: CanvasViewState, point: NodePosition): NodePosition {
  return { x: view.x + point.x * view.zoom, y: view.y + point.y * view.zoom };
}

export function preserveNodeAnchor(
  state: CanvasGraphState,
  before: CanvasViewState,
  afterPositions: Map<string, NodePosition>,
  nodeId: string | null,
): void {
  if (nodeId === null) {
    before.positions = afterPositions;
    return;
  }
  const node = nodeById(state, nodeId);
  if (node === null) {
    before.positions = afterPositions;
    return;
  }
  const old = before.positions.get(nodeId);
  const next = afterPositions.get(nodeId);
  before.positions = afterPositions;
  if (old === undefined || next === undefined) return;
  const screen = worldToScreen(before, old);
  before.x = screen.x - next.x * before.zoom;
  before.y = screen.y - next.y * before.zoom;
}

export function fitTransform(
  state: CanvasGraphState,
  view: CanvasViewState,
  viewportWidth: number,
  viewportHeight: number,
  inspectorWidth = 0,
): { x: number; y: number; zoom: number } | null {
  if (state.nodesById.size === 0) return null;
  const bounds = graphBounds(state, view.positions);
  const usableWidth = Math.max(360, viewportWidth - inspectorWidth);
  const zoom = clamp(Math.min((usableWidth - 120) / bounds.width, (viewportHeight - 150) / bounds.height, 1.08), MIN_ZOOM, MAX_ZOOM);
  return {
    zoom,
    x: (usableWidth - bounds.width * zoom) / 2 - bounds.x * zoom,
    y: (viewportHeight - bounds.height * zoom) / 2 - bounds.y * zoom,
  };
}

export function nodeCenter(view: CanvasViewState, node: GraphNode): NodePosition {
  const point = positionOf(view, node);
  return { x: point.x + CARD_WIDTH / 2, y: point.y + CARD_HEIGHT / 2 };
}
