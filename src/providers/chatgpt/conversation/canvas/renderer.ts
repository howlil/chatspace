import { CANVAS_ID, NODE_ATTRIBUTE, focusNativeComposer, sourceForkControl } from './dom';
import { childIds, graphNodes, nodeById, type CanvasGraphState, type GraphNode } from './graphEngine';
import { CARD_HEIGHT, CARD_WIDTH, PADDING, graphBounds, type NodePosition } from './layout';
import type { CanvasViewState } from './viewport';

export interface HtmlSnapshot {
  prompt: string;
  response: string;
}

export interface RenderContext {
  doc: Document;
  canvas: HTMLElement;
  state: CanvasGraphState;
  view: CanvasViewState;
  activePathIds: readonly string[];
  htmlCache: Map<string, HtmlSnapshot>;
  centerNode(nodeId: string): void;
  fitGraph(): void;
}

function activeSet(ctx: RenderContext): Set<string> {
  return new Set(ctx.activePathIds);
}

function positionOf(ctx: RenderContext, node: GraphNode): NodePosition {
  return ctx.view.positions.get(node.id) ?? { x: 0, y: 0 };
}

export function applySearchFilter(ctx: RenderContext): void {
  const normalized = ctx.view.searchQuery.trim().toLocaleLowerCase();
  for (const node of graphNodes(ctx.state)) {
    const card = ctx.canvas.querySelector<HTMLElement>(`[${NODE_ATTRIBUTE}="${node.id}"]`);
    if (card === null) continue;
    const matches = normalized.length === 0
      || node.promptText.toLocaleLowerCase().includes(normalized)
      || node.responseText.toLocaleLowerCase().includes(normalized);
    card.setAttribute('data-chatspace-search-match', String(matches));
  }
}

export function renderSelection(ctx: RenderContext): void {
  const active = activeSet(ctx);
  for (const node of graphNodes(ctx.state)) {
    const card = ctx.canvas.querySelector<HTMLElement>(`[${NODE_ATTRIBUTE}="${node.id}"]`);
    if (card === null) continue;
    card.setAttribute('data-chatspace-active', String(active.has(node.id)));
    card.setAttribute('data-chatspace-path', active.has(node.id) ? 'active' : 'inactive');
    card.setAttribute('data-chatspace-selected', String(ctx.view.selectedNodeId === node.id));
    card.tabIndex = ctx.view.selectedNodeId === node.id ? 0 : -1;
  }
  applySearchFilter(ctx);
}

function selectNode(ctx: RenderContext, nodeId: string, openInspector = true): void {
  ctx.view.selectedNodeId = nodeId;
  renderSelection(ctx);
  if (openInspector) renderInspector(ctx, true);
  renderMinimap(ctx);
  renderComposerDock(ctx);
}

function moveSelection(ctx: RenderContext, direction: 'parent' | 'child' | 'previous-sibling' | 'next-sibling'): void {
  const current = nodeById(ctx.state, ctx.view.selectedNodeId);
  if (current === null) return;
  let next: GraphNode | null = null;
  if (direction === 'parent') next = nodeById(ctx.state, current.parentId);
  else if (direction === 'child') next = nodeById(ctx.state, childIds(ctx.state, current.id)[0] ?? null);
  else {
    const siblings = childIds(ctx.state, current.parentId);
    const index = siblings.indexOf(current.id);
    const offset = direction === 'previous-sibling' ? -1 : 1;
    next = nodeById(ctx.state, siblings[index + offset] ?? null);
  }
  if (next === null) return;
  selectNode(ctx, next.id, false);
  ctx.canvas.querySelector<HTMLElement>(`[${NODE_ATTRIBUTE}="${next.id}"]`)?.focus({ preventScroll: true });
  ctx.centerNode(next.id);
}

function cardBadge(ctx: RenderContext, node: GraphNode): string | null {
  if (node.streaming) return 'Streaming';
  if (!node.hydrated) return 'Saved branch';
  const siblings = childIds(ctx.state, node.parentId).length;
  if (siblings > 1) return activeSet(ctx).has(node.id) ? 'Current branch' : 'Branch';
  if (node.hasVariants) return 'Variants';
  return null;
}

export function createCard(ctx: RenderContext, node: GraphNode): HTMLElement {
  const active = activeSet(ctx);
  const card = ctx.doc.createElement('article');
  card.setAttribute(NODE_ATTRIBUTE, node.id);
  card.setAttribute('data-chatspace-depth', String(node.depth));
  card.setAttribute('data-chatspace-streaming', String(node.streaming));
  card.setAttribute('data-chatspace-active', String(active.has(node.id)));
  card.setAttribute('data-chatspace-path', active.has(node.id) ? 'active' : 'inactive');
  card.setAttribute('data-chatspace-selected', String(ctx.view.selectedNodeId === node.id));
  card.setAttribute('aria-label', `Turn ${node.depth + 1}`);
  card.tabIndex = ctx.view.selectedNodeId === node.id ? 0 : -1;

  const header = ctx.doc.createElement('div');
  header.setAttribute('data-chatspace-card-header', 'true');
  const dot = ctx.doc.createElement('span');
  dot.setAttribute('data-chatspace-status-dot', 'true');
  const title = ctx.doc.createElement('span');
  title.setAttribute('data-chatspace-card-title', 'true');
  title.textContent = `Turn ${node.depth + 1}`;
  header.append(dot, title);
  const badgeText = cardBadge(ctx, node);
  if (badgeText !== null) {
    const badge = ctx.doc.createElement('span');
    badge.setAttribute('data-chatspace-badge', 'true');
    badge.textContent = badgeText;
    header.append(badge);
  }

  const prompt = ctx.doc.createElement('div');
  prompt.setAttribute('data-chatspace-prompt', 'true');
  const promptLabel = ctx.doc.createElement('span');
  promptLabel.setAttribute('data-chatspace-prompt-label', 'true');
  promptLabel.textContent = 'User';
  const promptText = ctx.doc.createElement('span');
  promptText.setAttribute('data-chatspace-prompt-text', 'true');
  promptText.textContent = node.promptText || (node.hydrated ? 'Continuation' : 'Branch content loads when opened');
  prompt.append(promptLabel, promptText);

  const response = ctx.doc.createElement('div');
  response.setAttribute('data-chatspace-response', 'true');
  const responseLabel = ctx.doc.createElement('span');
  responseLabel.setAttribute('data-chatspace-response-label', 'true');
  responseLabel.textContent = 'Assistant';
  const responseText = ctx.doc.createElement('span');
  responseText.setAttribute('data-chatspace-response-text', 'true');
  responseText.textContent = node.responseText || (node.hydrated ? 'Waiting for response…' : 'Structural history preserved locally');
  response.append(responseLabel, responseText);

  const actions = ctx.doc.createElement('div');
  actions.setAttribute('data-chatspace-card-actions', 'true');
  const nativeFork = sourceForkControl(node);
  if (nativeFork !== null) {
    const fork = ctx.doc.createElement('button');
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

  card.addEventListener('click', () => selectNode(ctx, node.id, true));
  card.addEventListener('dblclick', (event) => {
    event.stopPropagation();
    ctx.centerNode(node.id);
  });
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectNode(ctx, node.id, true);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveSelection(ctx, 'parent');
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveSelection(ctx, 'child');
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveSelection(ctx, 'previous-sibling');
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveSelection(ctx, 'next-sibling');
    }
  });
  card.append(header, prompt, response, actions);
  return card;
}

export function patchCards(ctx: RenderContext, changedNodeIds: ReadonlySet<string>, addedNodeIds: ReadonlySet<string>, removedNodeIds: ReadonlySet<string>): void {
  const scene = ctx.canvas.querySelector<HTMLElement>('[data-chatspace-scene]');
  if (scene === null) return;
  for (const id of removedNodeIds) scene.querySelector<HTMLElement>(`[${NODE_ATTRIBUTE}="${id}"]`)?.remove();
  for (const node of graphNodes(ctx.state)) {
    const existing = scene.querySelector<HTMLElement>(`[${NODE_ATTRIBUTE}="${node.id}"]`);
    const point = positionOf(ctx, node);
    if (existing === null || addedNodeIds.has(node.id) || changedNodeIds.has(node.id)) {
      const replacement = createCard(ctx, node);
      replacement.style.left = `${point.x}px`;
      replacement.style.top = `${point.y}px`;
      if (existing === null) scene.append(replacement);
      else existing.replaceWith(replacement);
    } else {
      existing.style.left = `${point.x}px`;
      existing.style.top = `${point.y}px`;
    }
  }
  renderSelection(ctx);
}

export function renderEdges(ctx: RenderContext): void {
  const scene = ctx.canvas.querySelector<HTMLElement>('[data-chatspace-scene]');
  if (scene === null) return;
  const active = activeSet(ctx);
  const bounds = graphBounds(ctx.state, ctx.view.positions);
  const width = Math.max(960, bounds.x + bounds.width + PADDING);
  const height = Math.max(620, bounds.y + bounds.height + PADDING);
  let svg = scene.querySelector<SVGSVGElement>('[data-chatspace-edges]');
  if (svg === null) {
    svg = ctx.doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('data-chatspace-edges', 'true');
    svg.setAttribute('aria-hidden', 'true');
    scene.prepend(svg);
  }
  svg.replaceChildren();
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  for (const node of graphNodes(ctx.state)) {
    const parent = nodeById(ctx.state, node.parentId);
    if (parent === null) continue;
    const from = positionOf(ctx, parent);
    const to = positionOf(ctx, node);
    const x1 = from.x + CARD_WIDTH;
    const y1 = from.y + CARD_HEIGHT / 2;
    const x2 = to.x;
    const y2 = to.y + CARD_HEIGHT / 2;
    const mid = x1 + Math.max(38, (x2 - x1) / 2);
    const path = ctx.doc.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('data-chatspace-edge', `${parent.id}:${node.id}`);
    path.setAttribute('data-chatspace-path', active.has(parent.id) && active.has(node.id) ? 'active' : 'inactive');
    path.setAttribute('data-chatspace-branch', String(childIds(ctx.state, parent.id).length > 1));
    path.setAttribute('d', `M ${x1} ${y1} H ${mid} V ${y2} H ${x2}`);
    svg.append(path);
  }
}

export function renderInspector(ctx: RenderContext, focus = false): void {
  const inspector = ctx.canvas.querySelector<HTMLElement>('[data-chatspace-inspector]');
  if (inspector === null) return;
  const node = nodeById(ctx.state, ctx.view.selectedNodeId);
  if (node === null) {
    inspector.setAttribute('data-chatspace-open', 'false');
    inspector.replaceChildren();
    return;
  }
  inspector.setAttribute('data-chatspace-open', 'true');
  inspector.replaceChildren();
  inspector.tabIndex = -1;

  const header = ctx.doc.createElement('div');
  header.setAttribute('data-chatspace-inspector-header', 'true');
  const title = ctx.doc.createElement('div');
  title.setAttribute('data-chatspace-inspector-title', 'true');
  const strong = ctx.doc.createElement('strong');
  strong.textContent = `Turn ${node.depth + 1}`;
  const meta = ctx.doc.createElement('span');
  meta.textContent = !node.hydrated ? 'Saved branch structure' : node.streaming ? 'Streaming response' : ctx.activePathIds.includes(node.id) ? 'Current path' : 'Branch history';
  title.append(strong, meta);
  const close = ctx.doc.createElement('button');
  close.type = 'button';
  close.setAttribute('data-chatspace-inspector-close', 'true');
  close.setAttribute('aria-label', 'Close inspector');
  close.textContent = '×';
  close.addEventListener('click', () => {
    inspector.setAttribute('data-chatspace-open', 'false');
    ctx.canvas.querySelector<HTMLElement>(`[${NODE_ATTRIBUTE}="${node.id}"]`)?.focus({ preventScroll: true });
  });
  header.append(title, close);

  const body = ctx.doc.createElement('div');
  body.setAttribute('data-chatspace-inspector-body', 'true');
  const html = ctx.htmlCache.get(node.id);
  const addSection = (label: string, richHtml: string | undefined, text: string, fallback: string) => {
    const section = ctx.doc.createElement('section');
    section.setAttribute('data-chatspace-inspector-section', 'true');
    const sectionLabel = ctx.doc.createElement('div');
    sectionLabel.setAttribute('data-chatspace-inspector-label', 'true');
    sectionLabel.textContent = label;
    const content = ctx.doc.createElement('div');
    content.setAttribute('data-chatspace-inspector-content', 'true');
    if (richHtml !== undefined && richHtml !== '') content.innerHTML = richHtml;
    else content.textContent = text || fallback;
    section.append(sectionLabel, content);
    body.append(section);
  };
  addSection('User', html?.prompt, node.promptText, 'Open this branch to hydrate its content.');
  addSection('Assistant', html?.response, node.responseText, node.hydrated ? 'Waiting for response…' : 'Only structural metadata is persisted.');

  const actions = ctx.doc.createElement('div');
  actions.setAttribute('data-chatspace-inspector-actions', 'true');
  const leaf = ctx.activePathIds[ctx.activePathIds.length - 1] ?? null;
  if (node.id === leaf) {
    const continueButton = ctx.doc.createElement('button');
    continueButton.type = 'button';
    continueButton.setAttribute('data-chatspace-primary-action', 'true');
    continueButton.textContent = 'Continue';
    continueButton.addEventListener('click', () => focusNativeComposer(ctx.doc));
    actions.append(continueButton);
  }
  const nativeFork = sourceForkControl(node);
  if (nativeFork !== null) {
    const fork = ctx.doc.createElement('button');
    fork.type = 'button';
    fork.setAttribute('data-chatspace-secondary-action', 'true');
    fork.setAttribute('data-chatspace-fork', 'true');
    fork.textContent = 'Fork';
    fork.addEventListener('click', () => nativeFork.click());
    actions.append(fork);
  }
  inspector.append(header, body, actions);
  if (focus) close.focus({ preventScroll: true });
}

export function renderComposerDock(ctx: RenderContext): void {
  const dock = ctx.canvas.querySelector<HTMLElement>('[data-chatspace-composer-dock]');
  if (dock === null) return;
  dock.replaceChildren();
  const leafId = ctx.activePathIds[ctx.activePathIds.length - 1] ?? null;
  const selected = nodeById(ctx.state, ctx.view.selectedNodeId ?? leafId);
  if (selected === null) return;
  const fork = sourceForkControl(selected);
  const isLeaf = selected.id === leafId;
  const button = ctx.doc.createElement('button');
  button.type = 'button';
  button.setAttribute('data-chatspace-composer-button', 'true');
  const icon = ctx.doc.createElement('span');
  icon.setAttribute('data-chatspace-composer-icon', 'true');
  icon.textContent = isLeaf ? '↑' : '⑂';
  const copy = ctx.doc.createElement('span');
  copy.setAttribute('data-chatspace-composer-copy', 'true');
  const strong = ctx.doc.createElement('strong');
  strong.textContent = isLeaf ? `Continue from Turn ${selected.depth + 1}` : fork !== null ? `Fork from Turn ${selected.depth + 1}` : `Turn ${selected.depth + 1} is historical`;
  const detail = ctx.doc.createElement('span');
  detail.textContent = isLeaf ? 'Continue in ChatGPT without leaving your canvas position' : fork !== null ? 'Create a native ChatGPT branch' : 'Open its conversation branch before continuing';
  copy.append(strong, detail);
  button.append(icon, copy);
  button.disabled = !isLeaf && fork === null;
  button.addEventListener('click', () => {
    if (isLeaf) focusNativeComposer(ctx.doc);
    else fork?.click();
  });
  dock.append(button);
}

interface MinimapMetrics { scale: number; offsetX: number; offsetY: number }
function minimapMetrics(ctx: RenderContext): MinimapMetrics {
  const bounds = graphBounds(ctx.state, ctx.view.positions);
  const width = 188;
  const height = 112;
  const scale = Math.min((width - 20) / bounds.width, (height - 20) / bounds.height);
  return { scale, offsetX: (width - bounds.width * scale) / 2 - bounds.x * scale, offsetY: (height - bounds.height * scale) / 2 - bounds.y * scale };
}

export function updateMinimapViewport(ctx: RenderContext): void {
  const minimap = ctx.canvas.querySelector<HTMLElement>('[data-chatspace-minimap]');
  const viewport = ctx.canvas.querySelector<HTMLElement>('[data-chatspace-viewport]');
  const rect = minimap?.querySelector<HTMLElement>('[data-chatspace-minimap-viewport]') ?? null;
  if (minimap === null || viewport === null || rect === null || ctx.state.nodesById.size === 0) return;
  const metrics = minimapMetrics(ctx);
  const viewportWidth = viewport.clientWidth || 1100;
  const viewportHeight = viewport.clientHeight || 680;
  const worldLeft = -ctx.view.x / ctx.view.zoom;
  const worldTop = -ctx.view.y / ctx.view.zoom;
  rect.style.left = `${metrics.offsetX + worldLeft * metrics.scale}px`;
  rect.style.top = `${metrics.offsetY + worldTop * metrics.scale}px`;
  rect.style.width = `${Math.max(8, viewportWidth / ctx.view.zoom * metrics.scale)}px`;
  rect.style.height = `${Math.max(6, viewportHeight / ctx.view.zoom * metrics.scale)}px`;
}

export function renderMinimap(ctx: RenderContext): void {
  const minimap = ctx.canvas.querySelector<HTMLElement>('[data-chatspace-minimap]');
  if (minimap === null) return;
  minimap.replaceChildren();
  if (ctx.state.nodesById.size === 0) return;
  minimap.tabIndex = 0;
  minimap.setAttribute('aria-label', 'Conversation minimap');
  const metrics = minimapMetrics(ctx);
  const active = activeSet(ctx);
  for (const node of graphNodes(ctx.state)) {
    const point = positionOf(ctx, node);
    const mini = ctx.doc.createElement('span');
    mini.setAttribute('data-chatspace-minimap-node', node.id);
    mini.setAttribute('data-chatspace-active', String(active.has(node.id)));
    mini.setAttribute('data-chatspace-selected', String(ctx.view.selectedNodeId === node.id));
    mini.style.left = `${metrics.offsetX + point.x * metrics.scale}px`;
    mini.style.top = `${metrics.offsetY + point.y * metrics.scale}px`;
    mini.style.width = `${Math.max(8, CARD_WIDTH * metrics.scale)}px`;
    mini.style.height = `${Math.max(5, CARD_HEIGHT * metrics.scale)}px`;
    minimap.append(mini);
  }
  const viewportRect = ctx.doc.createElement('div');
  viewportRect.setAttribute('data-chatspace-minimap-viewport', 'true');
  minimap.append(viewportRect);
  updateMinimapViewport(ctx);
}

export function renderToolbar(ctx: RenderContext): void {
  const toolbar = ctx.canvas.querySelector<HTMLElement>('[data-chatspace-toolbar]');
  if (toolbar === null) return;
  toolbar.replaceChildren();
  const searchGroup = ctx.doc.createElement('div');
  searchGroup.setAttribute('data-chatspace-toolbar-group', 'true');
  const search = ctx.doc.createElement('input');
  search.type = 'search';
  search.setAttribute('data-chatspace-search', 'true');
  search.setAttribute('aria-label', 'Search conversation');
  search.placeholder = 'Search this conversation…';
  search.value = ctx.view.searchQuery;
  search.addEventListener('input', () => {
    ctx.view.searchQuery = search.value;
    applySearchFilter(ctx);
  });
  const matchingNodes = () => graphNodes(ctx.state).filter((node) => {
    const query = ctx.view.searchQuery.trim().toLocaleLowerCase();
    return query !== '' && (node.promptText.toLocaleLowerCase().includes(query) || node.responseText.toLocaleLowerCase().includes(query));
  });
  search.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    const matches = matchingNodes();
    if (matches.length === 0) return;
    const currentIndex = matches.findIndex((node) => node.id === ctx.view.selectedNodeId);
    const step = event.shiftKey ? -1 : 1;
    const index = currentIndex < 0 ? 0 : (currentIndex + step + matches.length) % matches.length;
    const match = matches[index];
    if (match === undefined) return;
    selectNode(ctx, match.id, false);
    ctx.centerNode(match.id);
  });
  searchGroup.append(search);

  const makeButton = (label: string, title: string, onClick: () => void) => {
    const button = ctx.doc.createElement('button');
    button.type = 'button';
    button.setAttribute('data-chatspace-toolbar-button', 'true');
    button.title = title;
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
  };
  const leaf = ctx.activePathIds[ctx.activePathIds.length - 1] ?? null;
  const viewGroup = ctx.doc.createElement('div');
  viewGroup.setAttribute('data-chatspace-toolbar-group', 'true');
  viewGroup.append(
    makeButton('Fit', 'Fit graph', ctx.fitGraph),
    makeButton('Center', 'Center current turn', () => { if (leaf !== null) ctx.centerNode(leaf); }),
  );
  toolbar.append(searchGroup, viewGroup);
}

export function renderChrome(ctx: RenderContext): void {
  renderToolbar(ctx);
  renderInspector(ctx, false);
  renderMinimap(ctx);
  renderComposerDock(ctx);
}

export function canvasElement(doc: Document): HTMLElement | null {
  const canvas = doc.getElementById(CANVAS_ID);
  return canvas instanceof HTMLElement ? canvas : null;
}
