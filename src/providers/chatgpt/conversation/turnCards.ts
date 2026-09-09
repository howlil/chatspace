import { normalizeChatGptTarget } from '../adapter';
import { findConversationElements } from './selectors';

const STYLE_ID = 'chatspace-turn-card-styles';
const CANVAS_ID = 'chatspace-conversation-canvas';
const SOURCE_ATTRIBUTE = 'data-chatspace-source-hidden';
const NODE_ATTRIBUTE = 'data-chatspace-node-id';
const REFRESH_DELAY_MS = 80;
const CARD_WIDTH = 320;
const CARD_HEIGHT = 236;
const X_GAP = 88;
const Y_GAP = 72;
const PADDING = 48;

const VARIANT_CONTROL_SELECTOR = [
  'button[aria-label*="previous response" i]',
  'button[aria-label*="next response" i]',
  'button[aria-label*="previous answer" i]',
  'button[aria-label*="next answer" i]',
  '[data-testid*="branch" i]',
].join(',');

const FORK_CONTROL_SELECTOR = [
  'button[aria-label*="branch in new chat" i]',
  'button[aria-label*="branch" i]',
  'button[aria-label*="fork" i]',
  '[data-testid*="branch" i] button',
].join(',');

const CARD_CSS = `
:root {
  --chatspace-card-ease: cubic-bezier(.22, 1, .36, 1);
  --chatspace-card-accent: #6f91b2;
}

[${SOURCE_ATTRIBUTE}="true"] {
  display: none !important;
}

#${CANVAS_ID} {
  position: relative;
  width: min(100%, 1600px);
  height: max(520px, calc(100vh - 180px));
  margin: 0 auto 96px;
  overflow: auto;
  overscroll-behavior: contain;
  border: 1px solid color-mix(in srgb, currentColor 10%, transparent);
  border-radius: 18px;
  background:
    linear-gradient(color-mix(in srgb, currentColor 4%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, currentColor 4%, transparent) 1px, transparent 1px),
    color-mix(in srgb, var(--main-surface-primary, Canvas) 98%, currentColor 2%);
  background-size: 24px 24px;
}

#${CANVAS_ID} [data-chatspace-scene] {
  position: relative;
  min-width: 100%;
  min-height: 100%;
}

#${CANVAS_ID} [data-chatspace-edges] {
  position: absolute;
  inset: 0;
  overflow: visible;
  pointer-events: none;
}

#${CANVAS_ID} [data-chatspace-edge] {
  fill: none;
  stroke: color-mix(in srgb, currentColor 28%, transparent);
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
}

#${CANVAS_ID} [${NODE_ATTRIBUTE}] {
  position: absolute;
  width: ${CARD_WIDTH}px;
  height: ${CARD_HEIGHT}px;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 10px;
  padding: 14px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, currentColor 13%, transparent);
  border-radius: 16px;
  background: color-mix(in srgb, var(--main-surface-primary, Canvas) 96%, currentColor 4%);
  box-shadow: 0 1px 2px rgb(0 0 0 / .04), 0 10px 30px rgb(0 0 0 / .05);
  transform-origin: 50% 0%;
  animation: chatspace-card-enter 260ms var(--chatspace-card-ease) both;
}

#${CANVAS_ID} [${NODE_ATTRIBUTE}][data-chatspace-active="true"] {
  border-color: color-mix(in srgb, var(--chatspace-card-accent) 56%, transparent);
}

#${CANVAS_ID} [${NODE_ATTRIBUTE}][data-chatspace-streaming="true"] {
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--chatspace-card-accent) 34%, transparent), 0 12px 34px rgb(0 0 0 / .07);
}

#${CANVAS_ID} [data-chatspace-card-header] {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 24px;
  font-size: 12px;
}

#${CANVAS_ID} [data-chatspace-card-title] {
  margin-right: auto;
  font-weight: 650;
}

#${CANVAS_ID} [data-chatspace-badge] {
  padding: 2px 7px;
  border: 1px solid color-mix(in srgb, currentColor 13%, transparent);
  border-radius: 999px;
  font-size: 10px;
  opacity: .74;
}

#${CANVAS_ID} [data-chatspace-fork] {
  appearance: none;
  padding: 3px 8px;
  border: 1px solid color-mix(in srgb, currentColor 16%, transparent);
  border-radius: 999px;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

#${CANVAS_ID} [data-chatspace-prompt] {
  max-height: 62px;
  padding: 8px 10px;
  overflow: auto;
  border-radius: 11px;
  background: color-mix(in srgb, var(--chatspace-card-accent) 10%, transparent);
  font-size: 12px;
}

#${CANVAS_ID} [data-chatspace-response] {
  min-height: 0;
  padding: 2px 4px 8px;
  overflow: auto;
  font-size: 12px;
  line-height: 1.48;
}

#${CANVAS_ID} [data-chatspace-prompt] > :first-child,
#${CANVAS_ID} [data-chatspace-response] > :first-child {
  margin-top: 0 !important;
}

#${CANVAS_ID} [data-chatspace-prompt] > :last-child,
#${CANVAS_ID} [data-chatspace-response] > :last-child {
  margin-bottom: 0 !important;
}

@keyframes chatspace-card-enter {
  from {
    opacity: 0;
    transform: translateY(8px) scale(.99);
    filter: blur(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  #${CANVAS_ID} [${NODE_ATTRIBUTE}] {
    animation: none;
  }
}
`;

interface TurnSnapshot {
  promptText: string;
  responseText: string;
  promptHtml: string;
  responseHtml: string;
  signature: string;
  streaming: boolean;
  hasVariants: boolean;
  promptSource: HTMLElement | null;
  responseSource: HTMLElement | null;
}

interface GraphNode extends TurnSnapshot {
  id: string;
  parentId: string | null;
  depth: number;
  lane: number;
  target: string;
}

interface CanvasGraphState {
  nodes: GraphNode[];
  paths: Map<string, string[]>;
  activeTarget: string | null;
  nextNodeId: number;
  nextLane: number;
}

export interface TurnCardController {
  refresh(): void;
  disconnect(): void;
}

function createGraphState(): CanvasGraphState {
  return {
    nodes: [],
    paths: new Map(),
    activeTarget: null,
    nextNodeId: 1,
    nextLane: 1,
  };
}

function ensureStyles(doc: Document): void {
  if (doc.getElementById(STYLE_ID) !== null) return;
  const style = doc.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CARD_CSS;
  (doc.head ?? doc.documentElement).append(style);
}

function nativeTurn(element: HTMLElement | null): HTMLElement | null {
  return element?.closest<HTMLElement>('[data-testid^="conversation-turn-"]') ?? element;
}

function isStreaming(element: HTMLElement | null): boolean {
  if (element === null) return false;
  const turn = nativeTurn(element);
  return element.getAttribute('aria-busy') === 'true'
    || element.matches('[data-is-streaming="true"]')
    || turn?.getAttribute('aria-busy') === 'true'
    || turn?.matches('[data-is-streaming="true"]') === true;
}

function hasVariants(element: HTMLElement | null): boolean {
  const turn = nativeTurn(element);
  return turn?.querySelector(VARIANT_CONTROL_SELECTOR) !== null && turn !== null;
}

function normalizeText(value: string | null): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function safeInnerHtml(element: HTMLElement | null, doc: Document): string {
  if (element === null) return '';
  const template = doc.createElement('template');
  template.innerHTML = element.innerHTML;
  for (const child of Array.from(template.content.querySelectorAll<HTMLElement>('*'))) {
    child.removeAttribute('id');
    child.removeAttribute('data-testid');
    child.removeAttribute('data-message-author-role');
    child.removeAttribute('aria-busy');
    child.removeAttribute('data-is-streaming');
  }
  for (const interactive of Array.from(template.content.querySelectorAll('script, style, form, button, input, textarea, select'))) {
    interactive.remove();
  }
  return template.innerHTML;
}

function snapshotFromSources(promptSource: HTMLElement | null, responseSource: HTMLElement | null, doc: Document): TurnSnapshot {
  const promptText = normalizeText(promptSource?.textContent ?? '');
  const responseText = normalizeText(responseSource?.textContent ?? '');
  return {
    promptText,
    responseText,
    promptHtml: safeInnerHtml(promptSource, doc),
    responseHtml: safeInnerHtml(responseSource, doc),
    signature: `${promptText}\u0000${responseText}`,
    streaming: isStreaming(responseSource),
    hasVariants: hasVariants(responseSource),
    promptSource,
    responseSource,
  };
}

function collectTurnSnapshots(root: ParentNode, doc: Document): TurnSnapshot[] {
  const matches = findConversationElements(root).matches
    .filter((match) => match.element.closest(`#${CANVAS_ID}`) === null)
    .filter((match) => match.role === 'user' || match.role === 'assistant');
  const snapshots: TurnSnapshot[] = [];
  let promptSource: HTMLElement | null = null;

  for (const match of matches) {
    if (match.role === 'user') {
      if (promptSource !== null) snapshots.push(snapshotFromSources(promptSource, null, doc));
      promptSource = match.element;
      continue;
    }

    snapshots.push(snapshotFromSources(promptSource, match.element, doc));
    promptSource = null;
  }

  if (promptSource !== null) snapshots.push(snapshotFromSources(promptSource, null, doc));
  return snapshots;
}

function markNativeSources(doc: Document, snapshots: TurnSnapshot[]): void {
  const active = new Set<HTMLElement>();
  for (const snapshot of snapshots) {
    const promptTurn = nativeTurn(snapshot.promptSource);
    const responseTurn = nativeTurn(snapshot.responseSource);
    if (promptTurn !== null) active.add(promptTurn);
    if (responseTurn !== null) active.add(responseTurn);
  }

  for (const existing of Array.from(doc.querySelectorAll<HTMLElement>(`[${SOURCE_ATTRIBUTE}]`))) {
    if (!active.has(existing)) existing.removeAttribute(SOURCE_ATTRIBUTE);
  }
  for (const element of active) element.setAttribute(SOURCE_ATTRIBUTE, 'true');
}

function nodeById(state: CanvasGraphState, id: string | null): GraphNode | null {
  if (id === null) return null;
  return state.nodes.find((node) => node.id === id) ?? null;
}

function updateNode(node: GraphNode, snapshot: TurnSnapshot, target: string): void {
  node.promptText = snapshot.promptText;
  node.responseText = snapshot.responseText;
  node.promptHtml = snapshot.promptHtml;
  node.responseHtml = snapshot.responseHtml;
  node.signature = snapshot.signature;
  node.streaming = snapshot.streaming;
  node.hasVariants = snapshot.hasVariants;
  node.promptSource = snapshot.promptSource;
  node.responseSource = snapshot.responseSource;
  node.target = target;
}

function createNode(state: CanvasGraphState, snapshot: TurnSnapshot, parentId: string | null, target: string): GraphNode {
  const parent = nodeById(state, parentId);
  const siblings = state.nodes.filter((node) => node.parentId === parentId);
  let lane = parent?.lane ?? 0;
  if (parent !== null && siblings.length > 0) lane = state.nextLane++;
  if (parent === null && siblings.length > 0) lane = state.nextLane++;

  const node: GraphNode = {
    ...snapshot,
    id: `turn-${state.nextNodeId++}`,
    parentId,
    depth: parent === null ? 0 : parent.depth + 1,
    lane,
    target,
  };
  state.nodes.push(node);
  return node;
}

function exactSnapshotMatch(node: GraphNode, snapshot: TurnSnapshot): boolean {
  return node.signature === snapshot.signature;
}

function streamingContinuation(node: GraphNode, snapshot: TurnSnapshot): boolean {
  return node.promptText === snapshot.promptText && (node.streaming || snapshot.streaming);
}

function commonPrefixLength(state: CanvasGraphState, path: string[], snapshots: TurnSnapshot[]): number {
  let index = 0;
  while (index < path.length && index < snapshots.length) {
    const pathId = path[index];
    const snapshot = snapshots[index];
    if (pathId === undefined || snapshot === undefined) break;
    const node = nodeById(state, pathId);
    if (node === null || (!exactSnapshotMatch(node, snapshot) && !streamingContinuation(node, snapshot))) break;
    index += 1;
  }
  return index;
}

function resetGraph(state: CanvasGraphState): void {
  state.nodes.length = 0;
  state.paths.clear();
  state.nextNodeId = 1;
  state.nextLane = 1;
}

function reconcileGraph(state: CanvasGraphState, target: string, snapshots: TurnSnapshot[]): string[] {
  let path = state.paths.get(target);

  if (path === undefined) {
    const previousPath = state.activeTarget === null ? undefined : state.paths.get(state.activeTarget);
    if (previousPath !== undefined) {
      const prefixLength = commonPrefixLength(state, previousPath, snapshots);
      if (prefixLength > 0) path = previousPath.slice(0, prefixLength);
      else if (snapshots.length > 0) resetGraph(state);
    }
    path ??= [];
  }

  let index = 0;
  while (index < path.length && index < snapshots.length) {
    const pathId = path[index];
    const snapshot = snapshots[index];
    if (pathId === undefined || snapshot === undefined) break;
    const node = nodeById(state, pathId);
    if (node === null) break;
    if (exactSnapshotMatch(node, snapshot) || streamingContinuation(node, snapshot)) {
      updateNode(node, snapshot, target);
      index += 1;
      continue;
    }
    break;
  }

  const nextPath = path.slice(0, index);
  let parentId: string | null = nextPath[nextPath.length - 1] ?? null;
  for (let snapshotIndex = index; snapshotIndex < snapshots.length; snapshotIndex += 1) {
    const snapshot = snapshots[snapshotIndex];
    if (snapshot === undefined) break;
    const node = createNode(state, snapshot, parentId, target);
    nextPath.push(node.id);
    parentId = node.id;
  }

  state.paths.set(target, nextPath);
  state.activeTarget = target;
  return nextPath;
}

function ensureCanvas(doc: Document): HTMLElement | null {
  const existing = doc.getElementById(CANVAS_ID);
  if (existing instanceof HTMLElement) return existing;
  const host = doc.querySelector<HTMLElement>('main') ?? doc.body;
  if (host === null) return null;

  const canvas = doc.createElement('section');
  canvas.id = CANVAS_ID;
  canvas.setAttribute('aria-label', 'Chatspace conversation canvas');
  const scene = doc.createElement('div');
  scene.setAttribute('data-chatspace-scene', 'true');
  const edges = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
  edges.setAttribute('data-chatspace-edges', 'true');
  edges.setAttribute('aria-hidden', 'true');
  scene.append(edges);
  canvas.append(scene);
  host.prepend(canvas);
  return canvas;
}

function sourceForkControl(node: GraphNode): HTMLElement | null {
  const source = nativeTurn(node.responseSource) ?? nativeTurn(node.promptSource);
  return source?.querySelector<HTMLElement>(FORK_CONTROL_SELECTOR) ?? null;
}

function renderCard(doc: Document, node: GraphNode, activePath: Set<string>, activeTarget: string): HTMLElement {
  const card = doc.createElement('article');
  card.setAttribute(NODE_ATTRIBUTE, node.id);
  card.setAttribute('data-chatspace-depth', String(node.depth));
  card.setAttribute('data-chatspace-lane', String(node.lane));
  card.setAttribute('data-chatspace-streaming', String(node.streaming));
  card.setAttribute('data-chatspace-active', String(activePath.has(node.id) && node.target === activeTarget));

  const header = doc.createElement('div');
  header.setAttribute('data-chatspace-card-header', 'true');
  const title = doc.createElement('span');
  title.setAttribute('data-chatspace-card-title', 'true');
  title.textContent = `Turn ${node.depth + 1}`;
  header.append(title);

  if (node.streaming) {
    const streaming = doc.createElement('span');
    streaming.setAttribute('data-chatspace-badge', 'true');
    streaming.textContent = 'Streaming';
    header.append(streaming);
  } else if (node.hasVariants) {
    const variants = doc.createElement('span');
    variants.setAttribute('data-chatspace-badge', 'true');
    variants.textContent = 'Variants';
    header.append(variants);
  }

  const nativeFork = sourceForkControl(node);
  if (nativeFork !== null) {
    const fork = doc.createElement('button');
    fork.type = 'button';
    fork.setAttribute('data-chatspace-fork', 'true');
    fork.textContent = 'Fork';
    fork.addEventListener('click', (event) => {
      event.stopPropagation();
      nativeFork.click();
    });
    header.append(fork);
  }

  const prompt = doc.createElement('div');
  prompt.setAttribute('data-chatspace-prompt', 'true');
  prompt.innerHTML = node.promptHtml || '<span>Continuation</span>';

  const response = doc.createElement('div');
  response.setAttribute('data-chatspace-response', 'true');
  response.innerHTML = node.responseHtml || '<span>Waiting for response…</span>';

  card.append(header, prompt, response);
  return card;
}

function cardPosition(node: GraphNode): { x: number; y: number } {
  return {
    x: PADDING + node.depth * (CARD_WIDTH + X_GAP),
    y: PADDING + node.lane * (CARD_HEIGHT + Y_GAP),
  };
}

function renderEdges(doc: Document, scene: HTMLElement, state: CanvasGraphState, width: number, height: number): void {
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

  for (const node of state.nodes) {
    const parent = nodeById(state, node.parentId);
    if (parent === null) continue;
    const from = cardPosition(parent);
    const to = cardPosition(node);
    const x1 = from.x + CARD_WIDTH;
    const y1 = from.y + CARD_HEIGHT / 2;
    const x2 = to.x;
    const y2 = to.y + CARD_HEIGHT / 2;
    const mid = x1 + Math.max(36, (x2 - x1) / 2);
    const path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('data-chatspace-edge', `${parent.id}:${node.id}`);
    path.setAttribute('d', `M ${x1} ${y1} H ${mid} V ${y2} H ${x2}`);
    svg.append(path);
  }
}

function renderGraph(doc: Document, state: CanvasGraphState, activeTarget: string, activePathIds: string[]): number {
  const canvas = ensureCanvas(doc);
  if (canvas === null) return 0;
  const scene = canvas.querySelector<HTMLElement>('[data-chatspace-scene]');
  if (scene === null) return 0;

  const maxDepth = state.nodes.reduce((max, node) => Math.max(max, node.depth), 0);
  const maxLane = state.nodes.reduce((max, node) => Math.max(max, node.lane), 0);
  const width = Math.max(720, PADDING * 2 + (maxDepth + 1) * CARD_WIDTH + maxDepth * X_GAP);
  const height = Math.max(460, PADDING * 2 + (maxLane + 1) * CARD_HEIGHT + maxLane * Y_GAP);
  scene.style.width = `${width}px`;
  scene.style.height = `${height}px`;
  renderEdges(doc, scene, state, width, height);

  const activePath = new Set(activePathIds);
  const existingCards = new Map(
    Array.from(scene.querySelectorAll<HTMLElement>(`[${NODE_ATTRIBUTE}]`)).map((card) => [card.getAttribute(NODE_ATTRIBUTE) ?? '', card]),
  );
  const activeIds = new Set(state.nodes.map((node) => node.id));
  for (const [id, card] of existingCards) {
    if (!activeIds.has(id)) card.remove();
  }

  for (const node of state.nodes) {
    let card = existingCards.get(node.id) ?? null;
    const renderKey = `${node.signature}\u0000${node.streaming}\u0000${node.hasVariants}\u0000${activePath.has(node.id)}\u0000${node.target}`;
    if (card === null || card.getAttribute('data-chatspace-render-key') !== renderKey) {
      const replacement = renderCard(doc, node, activePath, activeTarget);
      replacement.setAttribute('data-chatspace-render-key', renderKey);
      if (card === null) scene.append(replacement);
      else card.replaceWith(replacement);
      card = replacement;
    }
    const position = cardPosition(node);
    card.style.left = `${position.x}px`;
    card.style.top = `${position.y}px`;
  }

  return state.nodes.length;
}

function cleanupView(doc: Document): void {
  for (const source of Array.from(doc.querySelectorAll<HTMLElement>(`[${SOURCE_ATTRIBUTE}]`))) source.removeAttribute(SOURCE_ATTRIBUTE);
  doc.getElementById(CANVAS_ID)?.remove();
}

function renderCurrent(root: ParentNode, state: CanvasGraphState, target: string): HTMLElement[] {
  const doc = root instanceof Document ? root : root.ownerDocument ?? document;
  const snapshots = collectTurnSnapshots(root, doc);
  if (snapshots.length === 0) return [];
  markNativeSources(doc, snapshots);
  const activePath = reconcileGraph(state, target, snapshots);
  renderGraph(doc, state, target, activePath);
  return snapshots.flatMap((snapshot) => snapshot.responseSource === null ? [] : [snapshot.responseSource]);
}

export function refreshChatGptTurnCards(root: ParentNode = document): HTMLElement[] {
  const doc = root instanceof Document ? root : root.ownerDocument ?? document;
  ensureStyles(doc);
  return renderCurrent(root, createGraphState(), 'chatspace://current');
}

export function mountChatGptTurnCards(options: {
  doc?: Document;
  getHref?: () => string;
} = {}): TurnCardController {
  const doc = options.doc ?? document;
  const view = doc.defaultView ?? window;
  const getHref = options.getHref ?? (() => view.location.href);
  const state = createGraphState();
  let timer: number | undefined;
  let renderedNodeCount = 0;

  const refresh = () => {
    timer = undefined;
    const target = normalizeChatGptTarget(getHref());
    if (target === null) {
      cleanupView(doc);
      return;
    }

    ensureStyles(doc);
    const snapshots = collectTurnSnapshots(doc, doc);
    if (snapshots.length === 0) return;
    markNativeSources(doc, snapshots);
    const activePath = reconcileGraph(state, target, snapshots);
    const nextNodeCount = renderGraph(doc, state, target, activePath);
    if (nextNodeCount > renderedNodeCount) {
      const canvas = doc.getElementById(CANVAS_ID);
      if (canvas !== null && typeof canvas.scrollTo === 'function') {
        canvas.scrollTo({ left: canvas.scrollWidth, behavior: 'smooth' });
      }
    }
    renderedNodeCount = nextNodeCount;
  };

  const schedule = () => {
    if (timer !== undefined) return;
    timer = view.setTimeout(refresh, REFRESH_DELAY_MS);
  };

  const Observer = view.MutationObserver ?? MutationObserver;
  const observer = new Observer((records) => {
    const canvas = doc.getElementById(CANVAS_ID);
    const hasProviderMutation = records.some((record) => canvas === null || !canvas.contains(record.target));
    if (hasProviderMutation) schedule();
  });
  observer.observe(doc.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['data-message-author-role', 'data-message-id', 'aria-busy', 'data-is-streaming'],
  });
  refresh();

  return {
    refresh,
    disconnect() {
      observer.disconnect();
      if (timer !== undefined) view.clearTimeout(timer);
      cleanupView(doc);
      doc.getElementById(STYLE_ID)?.remove();
    },
  };
}
