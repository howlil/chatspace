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
  view: CanvasViewState,
  afterPositions: Map<string, NodePosition>,
  nodeId: string | null,
): void {
  if (nodeId === null) {
    view.positions = afterPositions;
    return;
  }
  const node = nodeById(state, nodeId);
  const old = view.positions.get(nodeId);
  const next = afterPositions.get(nodeId);
  if (node === null || old === undefined || next === undefined) {
    view.positions = afterPositions;
    return;
  }
  const screen = worldToScreen(view, old);
  view.positions = afterPositions;
  view.x = screen.x - next.x * view.zoom;
  view.y = screen.y - next.y * view.zoom;
}

function zoomLevel(zoom: number): 'far' | 'mid' | 'near' {
  if (zoom < 0.48) return 'far';
  if (zoom < 0.78) return 'mid';
  return 'near';
}

export function applyViewport(canvas: HTMLElement, view: CanvasViewState): void {
  const scene = canvas.querySelector<HTMLElement>('[data-chatspace-scene]');
  if (scene === null) return;
  scene.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`;
  canvas.setAttribute('data-chatspace-zoom-level', zoomLevel(view.zoom));
  const readout = canvas.querySelector<HTMLElement>('[data-chatspace-zoom-readout]');
  if (readout !== null) readout.textContent = `${Math.round(view.zoom * 100)}%`;
}

function viewportSize(canvas: HTMLElement): { width: number; height: number } | null {
  const viewport = canvas.querySelector<HTMLElement>('[data-chatspace-viewport]');
  if (viewport === null) return null;
  return { width: viewport.clientWidth || 1100, height: viewport.clientHeight || 680 };
}

export function centerNode(canvas: HTMLElement, state: CanvasGraphState, view: CanvasViewState, nodeId: string): void {
  const node = nodeById(state, nodeId);
  const size = viewportSize(canvas);
  if (node === null || size === null) return;
  const point = positionOf(view, node);
  view.x = size.width / 2 - (point.x + CARD_WIDTH / 2) * view.zoom;
  view.y = size.height / 2 - (point.y + CARD_HEIGHT / 2) * view.zoom;
  applyViewport(canvas, view);
}

export function fitGraph(canvas: HTMLElement, state: CanvasGraphState, view: CanvasViewState): void {
  const size = viewportSize(canvas);
  if (size === null || state.nodesById.size === 0) return;
  const bounds = graphBounds(state, view.positions);
  const inspectorOpen = canvas.querySelector('[data-chatspace-inspector][data-chatspace-open="true"]') !== null;
  const usableWidth = Math.max(360, size.width - (inspectorOpen ? 390 : 0));
  const zoom = clamp(Math.min((usableWidth - 120) / bounds.width, (size.height - 150) / bounds.height, 1.08), MIN_ZOOM, MAX_ZOOM);
  view.zoom = zoom;
  view.x = (usableWidth - bounds.width * zoom) / 2 - bounds.x * zoom;
  view.y = (size.height - bounds.height * zoom) / 2 - bounds.y * zoom;
  view.followLatest = false;
  applyViewport(canvas, view);
}

export function zoomAround(canvas: HTMLElement, view: CanvasViewState, clientX: number, clientY: number, nextZoom: number): void {
  const viewport = canvas.querySelector<HTMLElement>('[data-chatspace-viewport]');
  if (viewport === null) return;
  const rect = viewport.getBoundingClientRect();
  const px = clientX - rect.left;
  const py = clientY - rect.top;
  const worldX = (px - view.x) / view.zoom;
  const worldY = (py - view.y) / view.zoom;
  const zoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
  view.x = px - worldX * zoom;
  view.y = py - worldY * zoom;
  view.zoom = zoom;
  view.followLatest = false;
  applyViewport(canvas, view);
}

export function setupViewportInteractions(
  canvas: HTMLElement,
  state: CanvasGraphState,
  view: CanvasViewState,
  onViewChange: () => void,
): void {
  const viewport = canvas.querySelector<HTMLElement>('[data-chatspace-viewport]');
  if (viewport === null || viewport.getAttribute('data-chatspace-bound') === 'true') return;
  viewport.setAttribute('data-chatspace-bound', 'true');
  viewport.tabIndex = -1;
  let pointerId: number | null = null;
  let lastX = 0;
  let lastY = 0;

  viewport.addEventListener('pointerdown', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('[data-chatspace-node-id], button, input, [data-chatspace-inspector], [data-chatspace-minimap]') !== null) return;
    pointerId = event.pointerId;
    lastX = event.clientX;
    lastY = event.clientY;
    view.followLatest = false;
    canvas.setAttribute('data-chatspace-panning', 'true');
    viewport.setPointerCapture?.(event.pointerId);
  });
  viewport.addEventListener('pointermove', (event) => {
    if (pointerId !== event.pointerId) return;
    view.x += event.clientX - lastX;
    view.y += event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    applyViewport(canvas, view);
    onViewChange();
  });
  const endPan = (event: PointerEvent) => {
    if (pointerId !== event.pointerId) return;
    pointerId = null;
    canvas.removeAttribute('data-chatspace-panning');
    viewport.releasePointerCapture?.(event.pointerId);
  };
  viewport.addEventListener('pointerup', endPan);
  viewport.addEventListener('pointercancel', endPan);

  viewport.addEventListener('wheel', (event) => {
    event.preventDefault();
    view.followLatest = false;
    if (event.ctrlKey || event.metaKey) {
      const factor = Math.exp(-event.deltaY * 0.0018);
      zoomAround(canvas, view, event.clientX, event.clientY, view.zoom * factor);
    } else {
      view.x -= event.deltaX;
      view.y -= event.deltaY;
      applyViewport(canvas, view);
    }
    onViewChange();
  }, { passive: false });

  canvas.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    if (event.key.toLocaleLowerCase() === 'f') {
      event.preventDefault();
      fitGraph(canvas, state, view);
      onViewChange();
    } else if (event.key === '0') {
      const active = state.activeTarget === null ? undefined : state.paths.get(state.activeTarget);
      const leaf = active?.[active.length - 1];
      if (leaf !== undefined) {
        event.preventDefault();
        centerNode(canvas, state, view, leaf);
        onViewChange();
      }
    } else if (event.key === 'Escape') {
      canvas.querySelector<HTMLButtonElement>('[data-chatspace-inspector-close]')?.click();
    }
  });
}
