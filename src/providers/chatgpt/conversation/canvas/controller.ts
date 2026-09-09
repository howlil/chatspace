import { normalizeChatGptTarget } from '../../adapter';
import {
  CANVAS_ID,
  NODE_ATTRIBUTE,
  STYLE_ID,
  clearNativeSources,
  collectTurnSnapshots,
  focusNativeComposer,
  markNativeSources,
  safeInnerHtml,
  sourceForkControl,
} from './dom';
import {
  childIds,
  createGraphState,
  graphNodes,
  nodeById,
  reconcileGraph,
  type CanvasGraphState,
  type GraphNode,
} from './graphEngine';
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  PADDING,
  computeLayeredLayout,
  fallbackPosition,
  graphBounds,
  type NodePosition,
} from './layout';
import { loadGraphForTarget, persistGraphStructure } from './persistence';
import { CANVAS_CSS } from './styles';

const REFRESH_DELAY_MS = 80;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;

interface CanvasViewState {
  x: number;
  y: number;
  zoom: number;
  selectedNodeId: string | null;
  searchQuery: string;
  followLatest: boolean;
  positions: Map<string, NodePosition>;
}

interface HtmlSnapshot {
  prompt: string;
  response: string;
}

export interface TurnCardController {
  refresh(): void;
  disconnect(): void;
}

function createViewState(): CanvasViewState {
  return {
    x: 64,
    y: 92,
    zoom: 1,
    selectedNodeId: null,
    searchQuery: '',
    followLatest: true,
    positions: new Map(),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function ensureStyles(doc: Document): void {
  if (doc.getElementById(STYLE_ID) !== null) return;
  const style = doc.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CANVAS_CSS;
  (doc.head ?? doc.documentElement).append(style);
}

function ensureCanvas(doc: Document): HTMLElement | null {
  const existing = doc.getElementById(CANVAS_ID);
  if (existing instanceof HTMLElement) return existing;
  const host = doc.querySelector<HTMLElement>('main') ?? doc.body;
  if (host === null) return null;

  const canvas = doc.createElement('section');
  canvas.id = CANVAS_ID;
  canvas.setAttribute('aria-label', 'Chatspace conversation canvas');
  canvas.setAttribute('data-chatspace-zoom-level', 'near');

  const viewport = doc.createElement('div');
  viewport.setAttribute('data-chatspace-viewport', 'true');
  const scene = doc.createElement('div');
  scene.setAttribute('data-chatspace-scene', 'true');
  const edges = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
  edges.setAttribute('data-chatspace-edges', 'true');
  edges.setAttribute('aria-hidden', 'true');
  scene.append(edges);
  viewport.append(scene);

  const toolbar = doc.createElement('div');
  toolbar.setAttribute('data-chatspace-toolbar', 'true');
  const minimap = doc.createElement('div');
  minimap.setAttribute('data-chatspace-minimap', 'true');
  const inspector = doc.createElement('aside');
  inspector.setAttribute('data-chatspace-inspector', 'true');
  inspector.setAttribute('data-chatspace-open', 'false');
  const dock = doc.createElement('div');
  dock.setAttribute('data-chatspace-composer-dock', 'true');

  canvas.append(viewport, toolbar, minimap, inspector, dock);
  host.prepend(canvas);
  return canvas;
}

function cleanupView(doc: Document): void {
  clearNativeSources(doc);
  doc.getElementById(CANVAS_ID)?.remove();
}

function zoomLevel(zoom: number): 'far' | 'mid' | 'near' {
  if (zoom < 0.48) return 'far';
  if (zoom < 0.78) return 'mid';
  return 'near';
}

function positionOf(view: CanvasViewState, node: GraphNode): NodePosition {
  return view.positions.get(node.id) ?? fallbackPosition(node.depth, node.order);
}

function applyViewport(canvas: HTMLElement, view: CanvasViewState): void {
  const scene = canvas.querySelector<HTMLElement>('[data-chatspace-scene]');
  if (scene === null) return;
  scene.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`;
  canvas.setAttribute('data-chatspace-zoom-level', zoomLevel(view.zoom));
  const readout = canvas.querySelector<HTMLElement>('[data-chatspace-zoom-readout]');
  if (readout !== null) readout.textContent = `${Math.round(view.zoom * 100)}%`;
}

function centerWorldPoint(canvas: HTMLElement, view: CanvasViewState, worldX: number, worldY: number, zoom = view.zoom): void {
  const viewport = canvas.querySelector<HTMLElement>('[data-chatspace-viewport]');
  if (viewport === null) return;
  const width = viewport.clientWidth || 1100;
  const height = viewport.clientHeight || 680;
  view.zoom = clamp(zoom, MIN_ZOOM, MAX_ZOOM);
  view.x = width / 2 - worldX * view.zoom;
  view.y = height / 2 - worldY * view.zoom;
  applyViewport(canvas, view);
}

function centerNode(canvas: HTMLElement, state: CanvasGraphState, view: CanvasViewState, nodeId: string): void {
  const node = nodeById(state, nodeId);
  if (node === null) return;
  const point = positionOf(view, node);
  centerWorldPoint(canvas, view, point.x + CARD_WIDTH / 2, point.y + CARD_HEIGHT / 2);
}

function fitGraph(canvas: HTMLElement, state: CanvasGraphState, view: CanvasViewState): void {
  const viewport = canvas.querySelector<HTMLElement>('[data-chatspace-viewport]');
  if (viewport === null || state.nodesById.size === 0) return;
  const bounds = graphBounds(state, view.positions);
  const width = viewport.clientWidth || 1100;
  const height = viewport.clientHeight || 680;
  const inspectorOpen = canvas.querySelector('[data-chatspace-inspector][data-chatspace-open="true"]') !== null;
  const usableWidth = Math.max(360, width - (inspectorOpen ? 390 : 0));
  const nextZoom = clamp(Math.min((usableWidth - 120) / bounds.width, (height - 150) / bounds.height, 1.08), MIN_ZOOM, MAX_ZOOM);
  view.zoom = nextZoom;
  view.x = (usableWidth - bounds.width * nextZoom) / 2 - bounds.x * nextZoom;
  view.y = (height - bounds.height * nextZoom) / 2 - bounds.y * nextZoom;
  view.followLatest = false;
  applyViewport(canvas, view);
}

function zoomAround(canvas: HTMLElement, view: CanvasViewState, clientX: number, clientY: number, nextZoom: number): void {
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

function hydrateHtml(doc: Document, state: CanvasGraphState, cache: Map<string, HtmlSnapshot>, nodeIds: Iterable<string>): void {
  for (const nodeId of nodeIds) {
    const node = nodeById(state, nodeId);
    if (node === null) continue;
    cache.set(node.id, {
      prompt: safeInnerHtml(node.promptSource, doc),
      response: safeInnerHtml(node.responseSource, doc),
    });
  }
}

function applySearchFilter(canvas: HTMLElement, state: CanvasGraphState, query: string): void {
  const normalized = query.trim().toLocaleLowerCase();
  for (const node of graphNodes(state)) {
    const card = canvas.querySelector<HTMLElement>(`[${NODE_ATTRIBUTE}="${node.id}"]`);
    if (card === null) continue;
    const matches = normalized.length === 0
      || node.promptText.toLocaleLowerCase().includes(normalized)
      || node.responseText.toLocaleLowerCase().includes(normalized);
    card.setAttribute('data-chatspace-search-match', String(matches));
  }
}

function createToolbarButton(doc: Document, label: string, title: string, onClick: () => void): HTMLButtonElement {
  const button = doc.createElement('button');
  button.type = 'button';
  button.setAttribute('data-chatspace-toolbar-button', 'true');
  button.title = title;
  button.textContent = label;
  button.addEventListener('click', onClick);
  return button;
}

function renderSelection(
  canvas: HTMLElement,
  state: CanvasGraphState,
  view: CanvasViewState,
  activePath: ReadonlySet<string>,
): void {
  for (const node of graphNodes(state)) {
    const card = canvas.querySelector<HTMLElement>(`[${NODE_ATTRIBUTE}="${node.id}"]`);
    if (card === null) continue;
    card.setAttribute('data-chatspace-active', String(activePath.has(node.id)));
    card.setAttribute('data-chatspace-path', activePath.has(node.id) ? 'active' : 'inactive');
    card.setAttribute('data-chatspace-selected', String(view.selectedNodeId === node.id));
  }
  applySearchFilter(canvas, state, view.searchQuery);
}

function renderToolbar(
  doc: Document,
  canvas: HTMLElement,
  state: CanvasGraphState,
  view: CanvasViewState,
  activePathIds: readonly string[],
  htmlCache: Map<string, HtmlSnapshot>,
): void {
  const toolbar = canvas.querySelector<HTMLElement>('[data-chatspace-toolbar]');
  if (toolbar === null) return;
  toolbar.replaceChildren();

  const searchGroup = doc.createElement('div');
  searchGroup.setAttribute('data-chatspace-toolbar-group', 'true');
  const search = doc.createElement('input');
  search.type = 'search';
  search.setAttribute('data-chatspace-search', 'true');
  search.placeholder = 'Search this conversation…';
  search.value = view.searchQuery;
  search.addEventListener('input', () => {
    view.searchQuery = search.value;
    applySearchFilter(canvas, state, view.searchQuery);
  });
  search.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    const query = view.searchQuery.trim().toLocaleLowerCase();
    const match = graphNodes(state).find((node) => query !== '' && (
      node.promptText.toLocaleLowerCase().includes(query) || node.responseText.toLocaleLowerCase().includes(query)
    ));
    if (match === undefined) return;
    view.selectedNodeId = match.id;
    centerNode(canvas, state, view, match.id);
    const activePath = new Set(activePathIds);
    renderSelection(canvas, state, view, activePath);
    renderInspector(doc, canvas, state, view, activePathIds, htmlCache);
    renderMinimap(doc, canvas, state, view, activePath, activePathIds, htmlCache);
  });
  searchGroup.append(search);

  const viewGroup = doc.createElement('div');
  viewGroup.setAttribute('data-chatspace-toolbar-group', 'true');
  const leaf = activePathIds[activePathIds.length - 1] ?? null;
  viewGroup.append(
    createToolbarButton(doc, 'Fit', 'Fit graph', () => {
      fitGraph(canvas, state, view);
      updateMinimapViewport(canvas, state, view);
    }),
    createToolbarButton(doc, 'Center', 'Center current turn', () => {
      if (leaf === null) return;
      view.followLatest = true;
      centerNode(canvas, state, view, leaf);
      updateMinimapViewport(canvas, state, view);
    }),
  );

  const zoomGroup = doc.createElement('div');
  zoomGroup.setAttribute('data-chatspace-toolbar-group', 'true');
  const readout = doc.createElement('span');
  readout.setAttribute('data-chatspace-zoom-readout', 'true');
  readout.textContent = `${Math.round(view.zoom * 100)}%`;
  const zoomAtCenter = (factor: number) => {
    const viewport = canvas.querySelector<HTMLElement>('[data-chatspace-viewport]');
    if (viewport === null) return;
    const rect = viewport.getBoundingClientRect();
    zoomAround(canvas, view, rect.left + rect.width / 2, rect.top + rect.height / 2, view.zoom * factor);
    updateMinimapViewport(canvas, state, view);
  };
  zoomGroup.append(
    createToolbarButton(doc, '−', 'Zoom out', () => zoomAtCenter(1 / 1.18)),
    readout,
    createToolbarButton(doc, '+', 'Zoom in', () => zoomAtCenter(1.18)),
  );
  toolbar.append(searchGroup, viewGroup, zoomGroup);
}

function selectNode(
  doc: Document,
  canvas: HTMLElement,
  state: CanvasGraphState,
  view: CanvasViewState,
  activePathIds: readonly string[],
  htmlCache: Map<string, HtmlSnapshot>,
  nodeId: string,
): void {
  view.selectedNodeId = nodeId;
  const activePath = new Set(activePathIds);
  renderSelection(canvas, state, view, activePath);
  renderInspector(doc, canvas, state, view, activePathIds, htmlCache);
  renderMinimap(doc, canvas, state, view, activePath, activePathIds, htmlCache);
  renderComposerDock(doc, canvas, state, view, activePathIds);
}

function renderCard(
  doc: Document,
  canvas: HTMLElement,
  state: CanvasGraphState,
  view: CanvasViewState,
  node: GraphNode,
  activePathIds: readonly string[],
  htmlCache: Map<string, HtmlSnapshot>,
): HTMLElement {
  const activePath = new Set(activePathIds);
  const card = doc.createElement('article');
  card.setAttribute(NODE_ATTRIBUTE, node.id);
  card.setAttribute('data-chatspace-depth', String(node.depth));
  card.setAttribute('data-chatspace-streaming', String(node.streaming));
  card.setAttribute('data-chatspace-active', String(activePath.has(node.id)));
  card.setAttribute('data-chatspace-path', activePath.has(node.id) ? 'active' : 'inactive');
  card.setAttribute('data-chatspace-selected', String(view.selectedNodeId === node.id));

  const header = doc.createElement('div');
  header.setAttribute('data-chatspace-card-header', 'true');
  const dot = doc.createElement('span');
  dot.setAttribute('data-chatspace-status-dot', 'true');
  const title = doc.createElement('span');
  title.setAttribute('data-chatspace-card-title', 'true');
  title.textContent = `Turn ${node.depth + 1}`;
  header.append(dot, title);
  const siblings = childIds(state, node.parentId).length;
  if (node.streaming || siblings > 1 || node.hasVariants || !node.hydrated) {
    const badge = doc.createElement('span');
    badge.setAttribute('data-chatspace-badge', 'true');
    badge.textContent = node.streaming ? 'Streaming' : !node.hydrated ? 'Saved branch' : siblings > 1 ? (activePath.has(node.id) ? 'Current branch' : 'Branch') : 'Variants';
    header.append(badge);
  }

  const prompt = doc.createElement('div');
  prompt.setAttribute('data-chatspace-prompt', 'true');
  const promptLabel = doc.createElement('span');
  promptLabel.setAttribute('data-chatspace-prompt-label', 'true');
  promptLabel.textContent = 'User';
  const promptText = doc.createElement('span');
  promptText.setAttribute('data-chatspace-prompt-text', 'true');
  promptText.textContent = node.promptText || (node.hydrated ? 'Continuation' : 'Branch content loads when opened');
  prompt.append(promptLabel, promptText);

  const response = doc.createElement('div');
  response.setAttribute('data-chatspace-response', 'true');
  const responseLabel = doc.createElement('span');
  responseLabel.setAttribute('data-chatspace-response-label', 'true');
  responseLabel.textContent = 'Assistant';
  const responseText = doc.createElement('span');
  responseText.setAttribute('data-chatspace-response-text', 'true');
  responseText.textContent = node.responseText || (node.hydrated ? 'Waiting for response…' : 'Structural history preserved locally');
  response.append(responseLabel, responseText);

  const actions = doc.createElement('div');
  actions.setAttribute('data-chatspace-card-actions', 'true');
  const open = doc.createElement('button');
  open.type = 'button';
  open.setAttribute('data-chatspace-card-action', 'true');
  open.textContent = 'Open';
  open.addEventListener('click', (event) => {
    event.stopPropagation();
    selectNode(doc, canvas, state, view, activePathIds, htmlCache, node.id);
  });
  actions.append(open);
  const nativeFork = sourceForkControl(node);
  if (nativeFork !== null) {
    const fork = doc.createElement('button');
    fork.type = 'button';
    fork.setAttribute('data-chatspace-card-action', 'true');
    fork.setAttribute('data-chatspace-fork', 'true');
    fork.textContent = 'Fork';
    fork.addEventListener('click', (event) => {
      event.stopPropagation();
      nativeFork.click();
    });
    actions.append(fork);
  }

  card.addEventListener('click', () => selectNode(doc, canvas, state, view, activePathIds, htmlCache, node.id));
  card.addEventListener('dblclick', (event) => {
    event.stopPropagation();
    centerNode(canvas, state, view, node.id);
    updateMinimapViewport(canvas, state, view);
  });
  card.append(header, prompt, response, actions);
  return card;
}

function renderEdges(
  doc: Document,
  scene: HTMLElement,
  state: CanvasGraphState,
  view: CanvasViewState,
  activePath: ReadonlySet<string>,
): void {
  const bounds = graphBounds(state, view.positions);
  const width = Math.max(960, bounds.x + bounds.width + PADDING);
  const height = Math.max(620, bounds.y + bounds.height + PADDING);
  let svg = scene.querySelector<SVGSVGElement>('[data-chatspace-edges]');
  if (svg === null) {
    svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('data-chatspace-edges', 'true');
    scene.prepend(svg);
  }
  svg.replaceChildren();
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

  for (const node of graphNodes(state)) {
    const parent = nodeById(state, node.parentId);
    if (parent === null) continue;
    const from = positionOf(view, parent);
    const to = positionOf(view, node);
    const x1 = from.x + CARD_WIDTH;
    const y1 = from.y + CARD_HEIGHT / 2;
    const x2 = to.x;
    const y2 = to.y + CARD_HEIGHT / 2;
    const mid = x1 + Math.max(38, (x2 - x1) / 2);
    const path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('data-chatspace-edge', `${parent.id}:${node.id}`);
    path.setAttribute('data-chatspace-path', activePath.has(parent.id) && activePath.has(node.id) ? 'active' : 'inactive');
    path.setAttribute('data-chatspace-branch', String(childIds(state, parent.id).length > 1));
    path.setAttribute('d', `M ${x1} ${y1} H ${mid} V ${y2} H ${x2}`);
    svg.append(path);
  }
}

function renderInspector(
  doc: Document,
  canvas: HTMLElement,
  state: CanvasGraphState,
  view: CanvasViewState,
  activePathIds: readonly string[],
  htmlCache: Map<string, HtmlSnapshot>,
): void {
  const inspector = canvas.querySelector<HTMLElement>('[data-chatspace-inspector]');
  if (inspector === null) return;
  const node = nodeById(state, view.selectedNodeId);
  if (node === null) {
    inspector.setAttribute('data-chatspace-open', 'false');
    inspector.replaceChildren();
    return;
  }

  inspector.setAttribute('data-chatspace-open', 'true');
  inspector.replaceChildren();
  const header = doc.createElement('div');
  header.setAttribute('data-chatspace-inspector-header', 'true');
  const title = doc.createElement('div');
  title.setAttribute('data-chatspace-inspector-title', 'true');
  const strong = doc.createElement('strong');
  strong.textContent = `Turn ${node.depth + 1}`;
  const meta = doc.createElement('span');
  meta.textContent = !node.hydrated ? 'Saved branch structure' : node.streaming ? 'Streaming response' : activePathIds.includes(node.id) ? 'Current path' : 'Branch history';
  title.append(strong, meta);
  const close = doc.createElement('button');
  close.type = 'button';
  close.setAttribute('data-chatspace-inspector-close', 'true');
  close.setAttribute('aria-label', 'Close inspector');
  close.textContent = '×';
  close.addEventListener('click', () => {
    view.selectedNodeId = null;
    inspector.setAttribute('data-chatspace-open', 'false');
    renderSelection(canvas, state, view, new Set(activePathIds));
    renderComposerDock(doc, canvas, state, view, activePathIds);
  });
  header.append(title, close);

  const body = doc.createElement('div');
  body.setAttribute('data-chatspace-inspector-body', 'true');
  const html = htmlCache.get(node.id);
  const addSection = (label: string, richHtml: string | undefined, text: string, fallback: string) => {
    const section = doc.createElement('section');
    section.setAttribute('data-chatspace-inspector-section', 'true');
    const sectionLabel = doc.createElement('div');
    sectionLabel.setAttribute('data-chatspace-inspector-label', 'true');
    sectionLabel.textContent = label;
    const content = doc.createElement('div');
    content.setAttribute('data-chatspace-inspector-content', 'true');
    if (richHtml !== undefined && richHtml !== '') content.innerHTML = richHtml;
    else content.textContent = text || fallback;
    section.append(sectionLabel, content);
    body.append(section);
  };
  addSection('User', html?.prompt, node.promptText, 'Open this branch to hydrate its content.');
  addSection('Assistant', html?.response, node.responseText, node.hydrated ? 'Waiting for response…' : 'Only structural metadata is persisted.');

  const actions = doc.createElement('div');
  actions.setAttribute('data-chatspace-inspector-actions', 'true');
  const leaf = activePathIds[activePathIds.length - 1] ?? null;
  if (node.id === leaf) {
    const continueButton = doc.createElement('button');
    continueButton.type = 'button';
    continueButton.setAttribute('data-chatspace-primary-action', 'true');
    continueButton.textContent = 'Continue';
    continueButton.addEventListener('click', () => focusNativeComposer(doc));
    actions.append(continueButton);
  }
  const nativeFork = sourceForkControl(node);
  if (nativeFork !== null) {
    const fork = doc.createElement('button');
    fork.type = 'button';
    fork.setAttribute('data-chatspace-secondary-action', 'true');
    fork.setAttribute('data-chatspace-fork', 'true');
    fork.textContent = 'Fork';
    fork.addEventListener('click', () => nativeFork.click());
    actions.append(fork);
  }
  inspector.append(header, body, actions);
}

function renderComposerDock(
  doc: Document,
  canvas: HTMLElement,
  state: CanvasGraphState,
  view: CanvasViewState,
  activePathIds: readonly string[],
): void {
  const dock = canvas.querySelector<HTMLElement>('[data-chatspace-composer-dock]');
  if (dock === null) return;
  dock.replaceChildren();
  const leafId = activePathIds[activePathIds.length - 1] ?? null;
  const selected = nodeById(state, view.selectedNodeId ?? leafId);
  if (selected === null) return;
  const fork = sourceForkControl(selected);
  const isLeaf = selected.id === leafId;
  const button = doc.createElement('button');
  button.type = 'button';
  button.setAttribute('data-chatspace-composer-button', 'true');
  const icon = doc.createElement('span');
  icon.setAttribute('data-chatspace-composer-icon', 'true');
  icon.textContent = isLeaf ? '↑' : '⑂';
  const copy = doc.createElement('span');
  copy.setAttribute('data-chatspace-composer-copy', 'true');
  const strong = doc.createElement('strong');
  strong.textContent = isLeaf ? `Continue from Turn ${selected.depth + 1}` : fork !== null ? `Fork from Turn ${selected.depth + 1}` : `Turn ${selected.depth + 1} is historical`;
  const detail = doc.createElement('span');
  detail.textContent = isLeaf ? 'Write in the native ChatGPT composer' : fork !== null ? 'Create a native ChatGPT branch' : 'Open its conversation branch before continuing';
  copy.append(strong, detail);
  button.append(icon, copy);
  button.disabled = !isLeaf && fork === null;
  button.addEventListener('click', () => {
    if (isLeaf) focusNativeComposer(doc);
    else fork?.click();
  });
  dock.append(button);
}

interface MinimapMetrics {
  scale: number;
  offsetX: number;
  offsetY: number;
}

function minimapMetrics(state: CanvasGraphState, view: CanvasViewState): MinimapMetrics {
  const bounds = graphBounds(state, view.positions);
  const width = 188;
  const height = 112;
  const scale = Math.min((width - 20) / bounds.width, (height - 20) / bounds.height);
  return {
    scale,
    offsetX: (width - bounds.width * scale) / 2 - bounds.x * scale,
    offsetY: (height - bounds.height * scale) / 2 - bounds.y * scale,
  };
}

function updateMinimapViewport(canvas: HTMLElement, state: CanvasGraphState, view: CanvasViewState): void {
  const minimap = canvas.querySelector<HTMLElement>('[data-chatspace-minimap]');
  const viewport = canvas.querySelector<HTMLElement>('[data-chatspace-viewport]');
  const rect = minimap?.querySelector<HTMLElement>('[data-chatspace-minimap-viewport]') ?? null;
  if (minimap === null || viewport === null || rect === null || state.nodesById.size === 0) return;
  const metrics = minimapMetrics(state, view);
  const viewportWidth = viewport.clientWidth || 1100;
  const viewportHeight = viewport.clientHeight || 680;
  const worldLeft = -view.x / view.zoom;
  const worldTop = -view.y / view.zoom;
  rect.style.left = `${metrics.offsetX + worldLeft * metrics.scale}px`;
  rect.style.top = `${metrics.offsetY + worldTop * metrics.scale}px`;
  rect.style.width = `${Math.max(8, viewportWidth / view.zoom * metrics.scale)}px`;
  rect.style.height = `${Math.max(6, viewportHeight / view.zoom * metrics.scale)}px`;
}

function renderMinimap(
  doc: Document,
  canvas: HTMLElement,
  state: CanvasGraphState,
  view: CanvasViewState,
  activePath: ReadonlySet<string>,
  activePathIds: readonly string[],
  htmlCache: Map<string, HtmlSnapshot>,
): void {
  const minimap = canvas.querySelector<HTMLElement>('[data-chatspace-minimap]');
  if (minimap === null) return;
  minimap.replaceChildren();
  if (state.nodesById.size === 0) return;
  const metrics = minimapMetrics(state, view);
  for (const node of graphNodes(state)) {
    const point = positionOf(view, node);
    const mini = doc.createElement('button');
    mini.type = 'button';
    mini.setAttribute('data-chatspace-minimap-node', node.id);
    mini.setAttribute('data-chatspace-active', String(activePath.has(node.id)));
    mini.setAttribute('data-chatspace-selected', String(view.selectedNodeId === node.id));
    mini.style.left = `${metrics.offsetX + point.x * metrics.scale}px`;
    mini.style.top = `${metrics.offsetY + point.y * metrics.scale}px`;
    mini.style.width = `${Math.max(8, CARD_WIDTH * metrics.scale)}px`;
    mini.style.height = `${Math.max(5, CARD_HEIGHT * metrics.scale)}px`;
    mini.title = `Turn ${node.depth + 1}`;
    mini.addEventListener('click', () => {
      selectNode(doc, canvas, state, view, activePathIds, htmlCache, node.id);
      centerNode(canvas, state, view, node.id);
      updateMinimapViewport(canvas, state, view);
    });
    minimap.append(mini);
  }
  const viewportRect = doc.createElement('div');
  viewportRect.setAttribute('data-chatspace-minimap-viewport', 'true');
  minimap.append(viewportRect);
  updateMinimapViewport(canvas, state, view);
}

function setupViewportInteractions(canvas: HTMLElement, state: CanvasGraphState, view: CanvasViewState): void {
  const viewport = canvas.querySelector<HTMLElement>('[data-chatspace-viewport]');
  if (viewport === null || viewport.getAttribute('data-chatspace-bound') === 'true') return;
  viewport.setAttribute('data-chatspace-bound', 'true');
  let pointerId: number | null = null;
  let lastX = 0;
  let lastY = 0;

  viewport.addEventListener('pointerdown', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest(`[${NODE_ATTRIBUTE}], button, input, [data-chatspace-inspector], [data-chatspace-minimap]`) !== null) return;
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
    updateMinimapViewport(canvas, state, view);
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
    updateMinimapViewport(canvas, state, view);
  }, { passive: false });
}

function renderFull(
  doc: Document,
  state: CanvasGraphState,
  view: CanvasViewState,
  activePathIds: readonly string[],
  htmlCache: Map<string, HtmlSnapshot>,
): number {
  const canvas = ensureCanvas(doc);
  if (canvas === null) return 0;
  const scene = canvas.querySelector<HTMLElement>('[data-chatspace-scene]');
  if (scene === null) return 0;
  view.positions = computeLayeredLayout(state);
  const activePath = new Set(activePathIds);
  renderEdges(doc, scene, state, view, activePath);

  for (const oldCard of Array.from(scene.querySelectorAll<HTMLElement>(`[${NODE_ATTRIBUTE}]`))) oldCard.remove();
  if (view.selectedNodeId === null) view.selectedNodeId = activePathIds[activePathIds.length - 1] ?? null;
  for (const node of graphNodes(state)) {
    const card = renderCard(doc, canvas, state, view, node, activePathIds, htmlCache);
    const point = positionOf(view, node);
    card.style.left = `${point.x}px`;
    card.style.top = `${point.y}px`;
    scene.append(card);
  }
  renderToolbar(doc, canvas, state, view, activePathIds, htmlCache);
  renderInspector(doc, canvas, state, view, activePathIds, htmlCache);
  renderMinimap(doc, canvas, state, view, activePath, activePathIds, htmlCache);
  renderComposerDock(doc, canvas, state, view, activePathIds);
  setupViewportInteractions(canvas, state, view);
  applyViewport(canvas, view);
  return state.nodesById.size;
}

function renderChangedCards(
  doc: Document,
  state: CanvasGraphState,
  view: CanvasViewState,
  activePathIds: readonly string[],
  htmlCache: Map<string, HtmlSnapshot>,
  changedNodeIds: ReadonlySet<string>,
): void {
  const canvas = doc.getElementById(CANVAS_ID);
  const scene = canvas?.querySelector<HTMLElement>('[data-chatspace-scene]') ?? null;
  if (!(canvas instanceof HTMLElement) || scene === null) return;
  for (const nodeId of changedNodeIds) {
    const node = nodeById(state, nodeId);
    if (node === null) continue;
    const existing = scene.querySelector<HTMLElement>(`[${NODE_ATTRIBUTE}="${node.id}"]`);
    const replacement = renderCard(doc, canvas, state, view, node, activePathIds, htmlCache);
    const point = positionOf(view, node);
    replacement.style.left = `${point.x}px`;
    replacement.style.top = `${point.y}px`;
    if (existing === null) scene.append(replacement);
    else existing.replaceWith(replacement);
  }
  renderSelection(canvas, state, view, new Set(activePathIds));
  if (view.selectedNodeId !== null && changedNodeIds.has(view.selectedNodeId)) {
    renderInspector(doc, canvas, state, view, activePathIds, htmlCache);
  }
}

function runRefresh(
  root: ParentNode,
  state: CanvasGraphState,
  view: CanvasViewState,
  htmlCache: Map<string, HtmlSnapshot>,
  target: string,
  hasRendered: boolean,
): { responses: HTMLElement[]; nodeCount: number; activePathIds: string[]; fullRender: boolean } {
  const doc = root instanceof Document ? root : root.ownerDocument ?? document;
  const snapshots = collectTurnSnapshots(root, doc);
  if (snapshots.length === 0) {
    clearNativeSources(doc);
    return { responses: [], nodeCount: 0, activePathIds: [], fullRender: false };
  }
  const result = reconcileGraph(state, target, snapshots);
  hydrateHtml(doc, state, htmlCache, result.changedNodeIds);
  const needsFullRender = !hasRendered || result.topologyChanged || result.activePathChanged;
  const nodeCount = needsFullRender
    ? renderFull(doc, state, view, result.activePathIds, htmlCache)
    : state.nodesById.size;
  if (!needsFullRender && result.changedNodeIds.size > 0) {
    renderChangedCards(doc, state, view, result.activePathIds, htmlCache, result.changedNodeIds);
  }
  if (nodeCount > 0) markNativeSources(doc, snapshots);
  return {
    responses: snapshots.flatMap((snapshot) => snapshot.responseSource === null ? [] : [snapshot.responseSource]),
    nodeCount,
    activePathIds: [...result.activePathIds],
    fullRender: needsFullRender,
  };
}

export function refreshChatGptTurnCards(root: ParentNode = document): HTMLElement[] {
  const doc = root instanceof Document ? root : root.ownerDocument ?? document;
  ensureStyles(doc);
  const state = createGraphState();
  const view = createViewState();
  const htmlCache = new Map<string, HtmlSnapshot>();
  return runRefresh(root, state, view, htmlCache, 'chatspace://current', false).responses;
}

export function mountChatGptTurnCards(options: {
  doc?: Document;
  getHref?: () => string;
  persist?: boolean;
} = {}): TurnCardController {
  const doc = options.doc ?? document;
  const viewWindow = doc.defaultView ?? window;
  const getHref = options.getHref ?? (() => viewWindow.location.href);
  const persist = options.persist ?? options.doc === undefined;
  let state = createGraphState();
  const view = createViewState();
  const htmlCache = new Map<string, HtmlSnapshot>();
  let timer: number | undefined;
  let hasRendered = false;
  let ready = !persist;
  let lastNodeCount = 0;
  let lastActivePathIds: string[] = [];

  const refresh = () => {
    timer = undefined;
    if (!ready) return;
    const target = normalizeChatGptTarget(getHref());
    if (target === null) {
      cleanupView(doc);
      hasRendered = false;
      return;
    }
    ensureStyles(doc);
    const result = runRefresh(doc, state, view, htmlCache, target, hasRendered);
    hasRendered = hasRendered || result.nodeCount > 0;
    lastActivePathIds = result.activePathIds;

    if (result.nodeCount > lastNodeCount) {
      const canvas = doc.getElementById(CANVAS_ID);
      const latest = result.activePathIds[result.activePathIds.length - 1] ?? null;
      if (canvas instanceof HTMLElement && latest !== null && view.followLatest) {
        view.selectedNodeId = latest;
        if (lastNodeCount === 0) {
          fitGraph(canvas, state, view);
          view.followLatest = true;
        } else {
          centerNode(canvas, state, view, latest);
        }
        renderSelection(canvas, state, view, new Set(result.activePathIds));
        renderInspector(doc, canvas, state, view, result.activePathIds, htmlCache);
        renderMinimap(doc, canvas, state, view, new Set(result.activePathIds), result.activePathIds, htmlCache);
        renderComposerDock(doc, canvas, state, view, result.activePathIds);
      }
    }
    if (persist && result.fullRender && result.activePathIds.length > 0) {
      void persistGraphStructure(state, result.activePathIds);
    }
    lastNodeCount = result.nodeCount;
  };

  const schedule = () => {
    if (!ready || timer !== undefined) return;
    timer = viewWindow.setTimeout(refresh, REFRESH_DELAY_MS);
  };

  const Observer = viewWindow.MutationObserver ?? MutationObserver;
  const observer = new Observer((records) => {
    const canvas = doc.getElementById(CANVAS_ID);
    const providerMutation = records.some((record) => canvas === null || !canvas.contains(record.target));
    if (providerMutation) schedule();
  });
  observer.observe(doc.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['data-message-author-role', 'data-message-id', 'aria-busy', 'data-is-streaming'],
  });

  if (persist) {
    const initialTarget = normalizeChatGptTarget(getHref());
    void (async () => {
      if (initialTarget !== null) {
        const restored = await loadGraphForTarget(initialTarget);
        if (restored !== null) state = restored;
      }
      ready = true;
      refresh();
    })();
  } else {
    refresh();
  }

  return {
    refresh,
    disconnect() {
      observer.disconnect();
      if (timer !== undefined) viewWindow.clearTimeout(timer);
      if (persist && lastActivePathIds.length > 0) void persistGraphStructure(state, lastActivePathIds);
      cleanupView(doc);
      doc.getElementById(STYLE_ID)?.remove();
    },
  };
}
