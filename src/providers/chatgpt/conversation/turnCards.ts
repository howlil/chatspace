import { normalizeChatGptTarget } from '../adapter';
import { findConversationElements } from './selectors';

const STYLE_ID = 'chatspace-turn-card-styles';
const CANVAS_ID = 'chatspace-conversation-canvas';
const SOURCE_ATTRIBUTE = 'data-chatspace-source-hidden';
const NODE_ATTRIBUTE = 'data-chatspace-node-id';
const REFRESH_DELAY_MS = 80;
const CARD_WIDTH = 296;
const CARD_HEIGHT = 166;
const X_GAP = 96;
const Y_GAP = 58;
const PADDING = 96;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;

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
  --chatspace-accent: #3978f6;
  --chatspace-accent-soft: color-mix(in srgb, var(--chatspace-accent) 10%, transparent);
  --chatspace-border: color-mix(in srgb, currentColor 11%, transparent);
  --chatspace-muted: color-mix(in srgb, currentColor 58%, transparent);
  --chatspace-surface: color-mix(in srgb, var(--main-surface-primary, Canvas) 97%, currentColor 3%);
  --chatspace-ease: cubic-bezier(.22, 1, .36, 1);
}

[${SOURCE_ATTRIBUTE}="true"] {
  display: none !important;
}

#${CANVAS_ID} {
  position: relative;
  width: 100%;
  height: max(560px, calc(100vh - 96px));
  margin: 0;
  overflow: hidden;
  isolation: isolate;
  border-block: 1px solid var(--chatspace-border);
  background:
    radial-gradient(circle, color-mix(in srgb, currentColor 11%, transparent) 1px, transparent 1px),
    color-mix(in srgb, var(--main-surface-primary, Canvas) 99%, currentColor 1%);
  background-size: 24px 24px;
  color: inherit;
  user-select: none;
}

#${CANVAS_ID} [data-chatspace-viewport] {
  position: absolute;
  inset: 0;
  overflow: hidden;
  touch-action: none;
  cursor: grab;
}

#${CANVAS_ID}[data-chatspace-panning="true"] [data-chatspace-viewport] {
  cursor: grabbing;
}

#${CANVAS_ID} [data-chatspace-scene] {
  position: absolute;
  inset: 0 auto auto 0;
  width: 1px;
  height: 1px;
  transform-origin: 0 0;
  will-change: transform;
}

#${CANVAS_ID} [data-chatspace-edges] {
  position: absolute;
  inset: 0;
  overflow: visible;
  pointer-events: none;
}

#${CANVAS_ID} [data-chatspace-edge] {
  fill: none;
  stroke: color-mix(in srgb, currentColor 20%, transparent);
  stroke-width: 1.35;
  vector-effect: non-scaling-stroke;
  transition: stroke 160ms ease, opacity 160ms ease, stroke-width 160ms ease;
}

#${CANVAS_ID} [data-chatspace-edge][data-chatspace-path="active"] {
  stroke: color-mix(in srgb, var(--chatspace-accent) 78%, currentColor 22%);
  stroke-width: 1.9;
  opacity: .95;
}

#${CANVAS_ID} [data-chatspace-edge][data-chatspace-path="inactive"] {
  opacity: .38;
}

#${CANVAS_ID} [data-chatspace-edge][data-chatspace-branch="true"] {
  stroke-dasharray: 5 5;
}

#${CANVAS_ID} [${NODE_ATTRIBUTE}] {
  position: absolute;
  width: ${CARD_WIDTH}px;
  height: ${CARD_HEIGHT}px;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  gap: 7px;
  padding: 12px 13px 11px;
  overflow: hidden;
  border: 1px solid var(--chatspace-border);
  border-radius: 15px;
  background: var(--chatspace-surface);
  box-shadow: 0 1px 2px rgb(0 0 0 / .035), 0 8px 24px rgb(0 0 0 / .045);
  color: inherit;
  cursor: pointer;
  user-select: text;
  transform-origin: 50% 50%;
  transition:
    border-color 160ms ease,
    box-shadow 180ms ease,
    opacity 160ms ease,
    background-color 160ms ease;
  animation: chatspace-node-enter 220ms var(--chatspace-ease) both;
}

#${CANVAS_ID} [${NODE_ATTRIBUTE}][data-chatspace-path="inactive"] {
  opacity: .58;
}

#${CANVAS_ID} [${NODE_ATTRIBUTE}][data-chatspace-active="true"] {
  border-color: color-mix(in srgb, var(--chatspace-accent) 44%, transparent);
}

#${CANVAS_ID} [${NODE_ATTRIBUTE}][data-chatspace-selected="true"] {
  border-color: color-mix(in srgb, var(--chatspace-accent) 82%, transparent);
  box-shadow:
    0 0 0 2px color-mix(in srgb, var(--chatspace-accent) 12%, transparent),
    0 10px 30px rgb(0 0 0 / .07);
}

#${CANVAS_ID} [${NODE_ATTRIBUTE}][data-chatspace-streaming="true"] {
  border-color: color-mix(in srgb, var(--chatspace-accent) 56%, transparent);
}

#${CANVAS_ID} [${NODE_ATTRIBUTE}][data-chatspace-search-match="false"] {
  opacity: .18;
}

@media (hover: hover) and (pointer: fine) {
  #${CANVAS_ID} [${NODE_ATTRIBUTE}]:hover {
    border-color: color-mix(in srgb, currentColor 21%, transparent);
    box-shadow: 0 1px 2px rgb(0 0 0 / .04), 0 12px 28px rgb(0 0 0 / .065);
  }
}

#${CANVAS_ID} [data-chatspace-card-header] {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  min-height: 20px;
  font-size: 11px;
  line-height: 1;
}

#${CANVAS_ID} [data-chatspace-card-title] {
  margin-right: auto;
  font-size: 12px;
  font-weight: 650;
  letter-spacing: -.01em;
}

#${CANVAS_ID} [data-chatspace-status-dot] {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--chatspace-accent);
  box-shadow: 0 0 0 3px var(--chatspace-accent-soft);
  flex: 0 0 auto;
}

#${CANVAS_ID} [data-chatspace-streaming="true"] [data-chatspace-status-dot] {
  animation: chatspace-pulse 1.4s ease-in-out infinite;
}

#${CANVAS_ID} [data-chatspace-badge] {
  max-width: 92px;
  padding: 3px 7px;
  overflow: hidden;
  border-radius: 999px;
  background: color-mix(in srgb, currentColor 6%, transparent);
  color: color-mix(in srgb, currentColor 70%, transparent);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

#${CANVAS_ID} [data-chatspace-prompt-label],
#${CANVAS_ID} [data-chatspace-response-label] {
  display: block;
  margin-bottom: 3px;
  color: var(--chatspace-muted);
  font-size: 9px;
  font-weight: 650;
  letter-spacing: .06em;
  text-transform: uppercase;
}

#${CANVAS_ID} [data-chatspace-prompt],
#${CANVAS_ID} [data-chatspace-response] {
  min-width: 0;
  overflow: hidden;
  color: color-mix(in srgb, currentColor 88%, transparent);
  font-size: 11.5px;
  line-height: 1.42;
  overflow-wrap: anywhere;
}

#${CANVAS_ID} [data-chatspace-prompt-text] {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

#${CANVAS_ID} [data-chatspace-response-text] {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
}

#${CANVAS_ID} [data-chatspace-card-actions] {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 20px;
  opacity: .72;
}

#${CANVAS_ID} [data-chatspace-card-action] {
  appearance: none;
  padding: 3px 7px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 10px;
  cursor: pointer;
}

#${CANVAS_ID} [data-chatspace-card-action]:hover {
  background: color-mix(in srgb, currentColor 7%, transparent);
}

#${CANVAS_ID}[data-chatspace-zoom-level="mid"] [data-chatspace-card-actions] {
  display: none;
}

#${CANVAS_ID}[data-chatspace-zoom-level="far"] [data-chatspace-prompt],
#${CANVAS_ID}[data-chatspace-zoom-level="far"] [data-chatspace-response],
#${CANVAS_ID}[data-chatspace-zoom-level="far"] [data-chatspace-card-actions] {
  display: none;
}

#${CANVAS_ID}[data-chatspace-zoom-level="far"] [${NODE_ATTRIBUTE}] {
  height: 72px;
  grid-template-rows: auto 1fr;
}

#${CANVAS_ID} [data-chatspace-toolbar] {
  position: absolute;
  top: 14px;
  left: 50%;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: calc(100% - 32px);
  transform: translateX(-50%);
  pointer-events: auto;
}

#${CANVAS_ID} [data-chatspace-toolbar-group] {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 38px;
  padding: 4px;
  border: 1px solid var(--chatspace-border);
  border-radius: 12px;
  background: color-mix(in srgb, var(--main-surface-primary, Canvas) 94%, transparent);
  box-shadow: 0 6px 24px rgb(0 0 0 / .055);
  backdrop-filter: blur(16px);
}

#${CANVAS_ID} [data-chatspace-search] {
  width: clamp(170px, 26vw, 330px);
  height: 30px;
  padding: 0 10px;
  border: 0;
  outline: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 12px;
}

#${CANVAS_ID} [data-chatspace-toolbar-button] {
  appearance: none;
  min-width: 30px;
  height: 30px;
  padding: 0 9px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}

#${CANVAS_ID} [data-chatspace-toolbar-button]:hover {
  background: color-mix(in srgb, currentColor 7%, transparent);
}

#${CANVAS_ID} [data-chatspace-zoom-readout] {
  min-width: 48px;
  text-align: center;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

#${CANVAS_ID} [data-chatspace-inspector] {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 26;
  width: min(390px, 36vw);
  min-width: 330px;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  border-left: 1px solid var(--chatspace-border);
  background: color-mix(in srgb, var(--main-surface-primary, Canvas) 97%, transparent);
  box-shadow: -14px 0 40px rgb(0 0 0 / .04);
  backdrop-filter: blur(18px);
  transform: translateX(102%);
  transition: transform 220ms var(--chatspace-ease);
  pointer-events: auto;
}

#${CANVAS_ID} [data-chatspace-inspector][data-chatspace-open="true"] {
  transform: translateX(0);
}

#${CANVAS_ID} [data-chatspace-inspector-header] {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 20px 20px 14px;
  border-bottom: 1px solid var(--chatspace-border);
}

#${CANVAS_ID} [data-chatspace-inspector-title] {
  margin-right: auto;
}

#${CANVAS_ID} [data-chatspace-inspector-title] strong {
  display: block;
  font-size: 16px;
}

#${CANVAS_ID} [data-chatspace-inspector-title] span {
  display: block;
  margin-top: 4px;
  color: var(--chatspace-muted);
  font-size: 11px;
}

#${CANVAS_ID} [data-chatspace-inspector-close] {
  appearance: none;
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font-size: 18px;
  cursor: pointer;
}

#${CANVAS_ID} [data-chatspace-inspector-body] {
  min-height: 0;
  overflow: auto;
  padding: 18px 20px 36px;
  user-select: text;
}

#${CANVAS_ID} [data-chatspace-inspector-section] + [data-chatspace-inspector-section] {
  margin-top: 24px;
}

#${CANVAS_ID} [data-chatspace-inspector-label] {
  margin-bottom: 8px;
  color: var(--chatspace-muted);
  font-size: 10px;
  font-weight: 650;
  letter-spacing: .06em;
  text-transform: uppercase;
}

#${CANVAS_ID} [data-chatspace-inspector-content] {
  font-size: 13px;
  line-height: 1.58;
  overflow-wrap: anywhere;
}

#${CANVAS_ID} [data-chatspace-inspector-content] pre {
  max-width: 100%;
  overflow: auto;
  border-radius: 10px;
}

#${CANVAS_ID} [data-chatspace-inspector-actions] {
  display: flex;
  gap: 8px;
  padding: 14px 20px 20px;
  border-top: 1px solid var(--chatspace-border);
}

#${CANVAS_ID} [data-chatspace-primary-action],
#${CANVAS_ID} [data-chatspace-secondary-action] {
  appearance: none;
  min-height: 34px;
  padding: 0 13px;
  border-radius: 9px;
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}

#${CANVAS_ID} [data-chatspace-primary-action] {
  border: 1px solid color-mix(in srgb, var(--chatspace-accent) 82%, transparent);
  background: var(--chatspace-accent);
  color: white;
}

#${CANVAS_ID} [data-chatspace-secondary-action] {
  border: 1px solid var(--chatspace-border);
  background: transparent;
  color: inherit;
}

#${CANVAS_ID} [data-chatspace-minimap] {
  position: absolute;
  left: 16px;
  bottom: 16px;
  z-index: 22;
  width: 188px;
  height: 112px;
  overflow: hidden;
  border: 1px solid var(--chatspace-border);
  border-radius: 12px;
  background: color-mix(in srgb, var(--main-surface-primary, Canvas) 92%, transparent);
  box-shadow: 0 6px 24px rgb(0 0 0 / .05);
  backdrop-filter: blur(12px);
  pointer-events: auto;
}

#${CANVAS_ID} [data-chatspace-minimap-node] {
  position: absolute;
  min-width: 8px;
  min-height: 5px;
  border-radius: 2px;
  background: color-mix(in srgb, currentColor 26%, transparent);
  cursor: pointer;
}

#${CANVAS_ID} [data-chatspace-minimap-node][data-chatspace-active="true"] {
  background: color-mix(in srgb, var(--chatspace-accent) 78%, transparent);
}

#${CANVAS_ID} [data-chatspace-minimap-node][data-chatspace-selected="true"] {
  box-shadow: 0 0 0 1px var(--chatspace-accent);
}

#${CANVAS_ID} [data-chatspace-minimap-viewport] {
  position: absolute;
  border: 1px solid color-mix(in srgb, var(--chatspace-accent) 72%, transparent);
  border-radius: 3px;
  background: color-mix(in srgb, var(--chatspace-accent) 7%, transparent);
  pointer-events: none;
}

#${CANVAS_ID} [data-chatspace-composer-dock] {
  position: absolute;
  left: 50%;
  bottom: 18px;
  z-index: 24;
  width: min(680px, calc(100% - 460px));
  min-width: 360px;
  transform: translateX(-50%);
  pointer-events: auto;
}

#${CANVAS_ID} [data-chatspace-composer-button] {
  appearance: none;
  width: 100%;
  min-height: 54px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid var(--chatspace-border);
  border-radius: 16px;
  background: color-mix(in srgb, var(--main-surface-primary, Canvas) 95%, transparent);
  box-shadow: 0 10px 34px rgb(0 0 0 / .08);
  color: inherit;
  text-align: left;
  cursor: pointer;
  backdrop-filter: blur(18px);
}

#${CANVAS_ID} [data-chatspace-composer-icon] {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 999px;
  background: var(--chatspace-accent-soft);
  color: var(--chatspace-accent);
  font-size: 15px;
}

#${CANVAS_ID} [data-chatspace-composer-copy] strong {
  display: block;
  font-size: 12px;
}

#${CANVAS_ID} [data-chatspace-composer-copy] span {
  display: block;
  margin-top: 3px;
  color: var(--chatspace-muted);
  font-size: 10px;
}

@keyframes chatspace-node-enter {
  from { opacity: 0; transform: translateY(6px) scale(.99); filter: blur(2px); }
  to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
}

@keyframes chatspace-pulse {
  0%, 100% { opacity: .45; transform: scale(.92); }
  50% { opacity: 1; transform: scale(1); }
}

@media (max-width: 980px) {
  #${CANVAS_ID} [data-chatspace-inspector] {
    width: min(360px, 88vw);
    min-width: 0;
  }

  #${CANVAS_ID} [data-chatspace-search] {
    display: none;
  }

  #${CANVAS_ID} [data-chatspace-composer-dock] {
    width: min(620px, calc(100% - 40px));
    min-width: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  #${CANVAS_ID} [${NODE_ATTRIBUTE}],
  #${CANVAS_ID} [data-chatspace-inspector] {
    animation: none;
    transition: none;
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

interface CanvasViewState {
  x: number;
  y: number;
  zoom: number;
  selectedNodeId: string | null;
  searchQuery: string;
  followLatest: boolean;
}

interface GraphBounds {
  x: number;
  y: number;
  width: number;
  height: number;
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

function createViewState(): CanvasViewState {
  return {
    x: 64,
    y: 92,
    zoom: 1,
    selectedNodeId: null,
    searchQuery: '',
    followLatest: true,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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
    for (const attribute of Array.from(child.attributes)) {
      if (attribute.name.toLocaleLowerCase().startsWith('on')) child.removeAttribute(attribute.name);
      if (attribute.name === 'href' && /^javascript:/i.test(attribute.value)) child.removeAttribute(attribute.name);
    }
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

function clearNativeSources(doc: Document): void {
  for (const source of Array.from(doc.querySelectorAll<HTMLElement>(`[${SOURCE_ATTRIBUTE}]`))) {
    source.removeAttribute(SOURCE_ATTRIBUTE);
  }
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
  if (siblings.length > 0) lane = state.nextLane++;

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
  state.activeTarget = null;
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

function cardPosition(node: GraphNode): { x: number; y: number } {
  return {
    x: PADDING + node.depth * (CARD_WIDTH + X_GAP),
    y: PADDING + node.lane * (CARD_HEIGHT + Y_GAP),
  };
}

function graphBounds(state: CanvasGraphState): GraphBounds {
  if (state.nodes.length === 0) return { x: 0, y: 0, width: 1, height: 1 };
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const node of state.nodes) {
    const point = cardPosition(node);
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

function sourceForkControl(node: GraphNode): HTMLElement | null {
  const source = nativeTurn(node.responseSource) ?? nativeTurn(node.promptSource);
  return source?.querySelector<HTMLElement>(FORK_CONTROL_SELECTOR) ?? null;
}

function findNativeComposer(doc: Document): HTMLElement | null {
  const candidates = [
    '#prompt-textarea',
    '[contenteditable="true"][data-virtualkeyboard]',
    'main textarea',
    'main [contenteditable="true"]',
  ];
  for (const selector of candidates) {
    const element = doc.querySelector<HTMLElement>(selector);
    if (element !== null && element.closest(`#${CANVAS_ID}`) === null) return element;
  }
  return null;
}

function focusNativeComposer(doc: Document): void {
  const composer = findNativeComposer(doc);
  if (composer === null) return;
  composer.focus();
  composer.scrollIntoView({ block: 'center', behavior: 'smooth' });
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

function zoomLevel(zoom: number): 'far' | 'mid' | 'near' {
  if (zoom < 0.48) return 'far';
  if (zoom < 0.78) return 'mid';
  return 'near';
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
  const point = cardPosition(node);
  centerWorldPoint(canvas, view, point.x + CARD_WIDTH / 2, point.y + CARD_HEIGHT / 2);
}

function fitGraph(canvas: HTMLElement, state: CanvasGraphState, view: CanvasViewState): void {
  const viewport = canvas.querySelector<HTMLElement>('[data-chatspace-viewport]');
  if (viewport === null || state.nodes.length === 0) return;
  const bounds = graphBounds(state);
  const width = viewport.clientWidth || 1100;
  const height = viewport.clientHeight || 680;
  const inspectorOpen = canvas.querySelector('[data-chatspace-inspector][data-chatspace-open="true"]') !== null;
  const usableWidth = Math.max(360, width - (inspectorOpen ? 390 : 0));
  const scaleX = (usableWidth - 120) / bounds.width;
  const scaleY = (height - 150) / bounds.height;
  const nextZoom = clamp(Math.min(scaleX, scaleY, 1.08), MIN_ZOOM, MAX_ZOOM);
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
  const clamped = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
  view.x = px - worldX * clamped;
  view.y = py - worldY * clamped;
  view.zoom = clamped;
  view.followLatest = false;
  applyViewport(canvas, view);
}

function applySearchFilter(canvas: HTMLElement, state: CanvasGraphState, query: string): void {
  const normalized = query.trim().toLocaleLowerCase();
  for (const node of state.nodes) {
    const card = canvas.querySelector<HTMLElement>(`[${NODE_ATTRIBUTE}="${node.id}"]`);
    if (card === null) continue;
    const matches = normalized.length === 0
      || node.promptText.toLocaleLowerCase().includes(normalized)
      || node.responseText.toLocaleLowerCase().includes(normalized);
    card.setAttribute('data-chatspace-search-match', String(matches));
  }
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
    const factor = Math.exp(-event.deltaY * 0.0014);
    zoomAround(canvas, view, event.clientX, event.clientY, view.zoom * factor);
    updateMinimapViewport(canvas, state, view);
  }, { passive: false });
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

function renderToolbar(doc: Document, canvas: HTMLElement, state: CanvasGraphState, view: CanvasViewState, activePathIds: string[]): void {
  const toolbar = canvas.querySelector<HTMLElement>('[data-chatspace-toolbar]');
  if (toolbar === null) return;
  toolbar.replaceChildren();

  const searchGroup = doc.createElement('div');
  searchGroup.setAttribute('data-chatspace-toolbar-group', 'true');
  const search = doc.createElement('input');
  search.setAttribute('data-chatspace-search', 'true');
  search.type = 'search';
  search.placeholder = 'Search this conversation…';
  search.value = view.searchQuery;
  search.addEventListener('input', () => {
    view.searchQuery = search.value;
    applySearchFilter(canvas, state, view.searchQuery);
  });
  search.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    const normalized = view.searchQuery.trim().toLocaleLowerCase();
    if (normalized.length === 0) return;
    const match = state.nodes.find((node) => node.promptText.toLocaleLowerCase().includes(normalized)
      || node.responseText.toLocaleLowerCase().includes(normalized));
    if (match === undefined) return;
    view.selectedNodeId = match.id;
    centerNode(canvas, state, view, match.id);
    renderInspector(doc, canvas, state, view, activePathIds);
    renderCardsSelection(canvas, state, view, new Set(activePathIds), state.activeTarget ?? '');
    renderMinimap(doc, canvas, state, view, new Set(activePathIds));
  });
  searchGroup.append(search);

  const viewGroup = doc.createElement('div');
  viewGroup.setAttribute('data-chatspace-toolbar-group', 'true');
  const activeLeaf = activePathIds[activePathIds.length - 1] ?? null;
  viewGroup.append(
    createToolbarButton(doc, 'Fit', 'Fit graph', () => {
      fitGraph(canvas, state, view);
      updateMinimapViewport(canvas, state, view);
    }),
    createToolbarButton(doc, 'Center', 'Center current turn', () => {
      if (activeLeaf === null) return;
      view.followLatest = true;
      centerNode(canvas, state, view, activeLeaf);
      updateMinimapViewport(canvas, state, view);
    }),
  );

  const zoomGroup = doc.createElement('div');
  zoomGroup.setAttribute('data-chatspace-toolbar-group', 'true');
  const readout = doc.createElement('span');
  readout.setAttribute('data-chatspace-zoom-readout', 'true');
  readout.textContent = `${Math.round(view.zoom * 100)}%`;
  zoomGroup.append(
    createToolbarButton(doc, '−', 'Zoom out', () => {
      const viewport = canvas.querySelector<HTMLElement>('[data-chatspace-viewport]');
      if (viewport === null) return;
      const rect = viewport.getBoundingClientRect();
      zoomAround(canvas, view, rect.left + rect.width / 2, rect.top + rect.height / 2, view.zoom / 1.18);
      updateMinimapViewport(canvas, state, view);
    }),
    readout,
    createToolbarButton(doc, '+', 'Zoom in', () => {
      const viewport = canvas.querySelector<HTMLElement>('[data-chatspace-viewport]');
      if (viewport === null) return;
      const rect = viewport.getBoundingClientRect();
      zoomAround(canvas, view, rect.left + rect.width / 2, rect.top + rect.height / 2, view.zoom * 1.18);
      updateMinimapViewport(canvas, state, view);
    }),
  );

  toolbar.append(searchGroup, viewGroup, zoomGroup);
}

function renderCardsSelection(
  canvas: HTMLElement,
  state: CanvasGraphState,
  view: CanvasViewState,
  activePath: Set<string>,
  activeTarget: string,
): void {
  for (const node of state.nodes) {
    const card = canvas.querySelector<HTMLElement>(`[${NODE_ATTRIBUTE}="${node.id}"]`);
    if (card === null) continue;
    const onActivePath = activePath.has(node.id);
    card.setAttribute('data-chatspace-active', String(onActivePath && node.target === activeTarget));
    card.setAttribute('data-chatspace-path', onActivePath ? 'active' : 'inactive');
    card.setAttribute('data-chatspace-selected', String(view.selectedNodeId === node.id));
  }
  applySearchFilter(canvas, state, view.searchQuery);
}

function renderCard(
  doc: Document,
  canvas: HTMLElement,
  state: CanvasGraphState,
  view: CanvasViewState,
  node: GraphNode,
  activePath: Set<string>,
  activeTarget: string,
  activePathIds: string[],
): HTMLElement {
  const card = doc.createElement('article');
  card.setAttribute(NODE_ATTRIBUTE, node.id);
  card.setAttribute('data-chatspace-depth', String(node.depth));
  card.setAttribute('data-chatspace-lane', String(node.lane));
  card.setAttribute('data-chatspace-streaming', String(node.streaming));
  const onActivePath = activePath.has(node.id);
  card.setAttribute('data-chatspace-active', String(onActivePath && node.target === activeTarget));
  card.setAttribute('data-chatspace-path', onActivePath ? 'active' : 'inactive');
  card.setAttribute('data-chatspace-selected', String(view.selectedNodeId === node.id));

  const header = doc.createElement('div');
  header.setAttribute('data-chatspace-card-header', 'true');
  const dot = doc.createElement('span');
  dot.setAttribute('data-chatspace-status-dot', 'true');
  const title = doc.createElement('span');
  title.setAttribute('data-chatspace-card-title', 'true');
  title.textContent = `Turn ${node.depth + 1}`;
  header.append(dot, title);

  if (node.streaming) {
    const badge = doc.createElement('span');
    badge.setAttribute('data-chatspace-badge', 'true');
    badge.textContent = 'Streaming';
    header.append(badge);
  } else {
    const siblingCount = state.nodes.filter((candidate) => candidate.parentId === node.parentId).length;
    if (siblingCount > 1) {
      const badge = doc.createElement('span');
      badge.setAttribute('data-chatspace-badge', 'true');
      badge.textContent = onActivePath ? 'Current branch' : 'Branch';
      header.append(badge);
    } else if (node.hasVariants) {
      const badge = doc.createElement('span');
      badge.setAttribute('data-chatspace-badge', 'true');
      badge.textContent = 'Variants';
      header.append(badge);
    }
  }

  const prompt = doc.createElement('div');
  prompt.setAttribute('data-chatspace-prompt', 'true');
  const promptLabel = doc.createElement('span');
  promptLabel.setAttribute('data-chatspace-prompt-label', 'true');
  promptLabel.textContent = 'User';
  const promptText = doc.createElement('span');
  promptText.setAttribute('data-chatspace-prompt-text', 'true');
  promptText.textContent = node.promptText || 'Continuation';
  prompt.append(promptLabel, promptText);

  const response = doc.createElement('div');
  response.setAttribute('data-chatspace-response', 'true');
  const responseLabel = doc.createElement('span');
  responseLabel.setAttribute('data-chatspace-response-label', 'true');
  responseLabel.textContent = 'Assistant';
  const responseText = doc.createElement('span');
  responseText.setAttribute('data-chatspace-response-text', 'true');
  responseText.textContent = node.responseText || 'Waiting for response…';
  response.append(responseLabel, responseText);

  const actions = doc.createElement('div');
  actions.setAttribute('data-chatspace-card-actions', 'true');
  const open = doc.createElement('button');
  open.type = 'button';
  open.setAttribute('data-chatspace-card-action', 'true');
  open.textContent = 'Open';
  open.addEventListener('click', (event) => {
    event.stopPropagation();
    view.selectedNodeId = node.id;
    renderCardsSelection(canvas, state, view, activePath, activeTarget);
    renderInspector(doc, canvas, state, view, activePathIds);
    renderMinimap(doc, canvas, state, view, activePath);
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

  card.addEventListener('click', () => {
    view.selectedNodeId = node.id;
    renderCardsSelection(canvas, state, view, activePath, activeTarget);
    renderInspector(doc, canvas, state, view, activePathIds);
    renderMinimap(doc, canvas, state, view, activePath);
    renderComposerDock(doc, canvas, state, view, activePathIds);
  });
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
  activePath: Set<string>,
  width: number,
  height: number,
): void {
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
    const mid = x1 + Math.max(38, (x2 - x1) / 2);
    const path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('data-chatspace-edge', `${parent.id}:${node.id}`);
    const isActive = activePath.has(parent.id) && activePath.has(node.id);
    path.setAttribute('data-chatspace-path', isActive ? 'active' : 'inactive');
    const childCount = state.nodes.filter((candidate) => candidate.parentId === parent.id).length;
    path.setAttribute('data-chatspace-branch', String(childCount > 1));
    path.setAttribute('d', `M ${x1} ${y1} H ${mid} V ${y2} H ${x2}`);
    svg.append(path);
  }
}

function renderInspector(
  doc: Document,
  canvas: HTMLElement,
  state: CanvasGraphState,
  view: CanvasViewState,
  activePathIds: string[],
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
  const active = activePathIds.includes(node.id);
  meta.textContent = node.streaming ? 'Streaming response' : active ? 'Current path' : 'Branch history';
  title.append(strong, meta);
  const close = doc.createElement('button');
  close.type = 'button';
  close.setAttribute('data-chatspace-inspector-close', 'true');
  close.setAttribute('aria-label', 'Close inspector');
  close.textContent = '×';
  close.addEventListener('click', () => {
    view.selectedNodeId = null;
    inspector.setAttribute('data-chatspace-open', 'false');
    renderCardsSelection(canvas, state, view, new Set(activePathIds), state.activeTarget ?? '');
    renderMinimap(doc, canvas, state, view, new Set(activePathIds));
    renderComposerDock(doc, canvas, state, view, activePathIds);
  });
  header.append(title, close);

  const body = doc.createElement('div');
  body.setAttribute('data-chatspace-inspector-body', 'true');
  const promptSection = doc.createElement('section');
  promptSection.setAttribute('data-chatspace-inspector-section', 'true');
  const promptLabel = doc.createElement('div');
  promptLabel.setAttribute('data-chatspace-inspector-label', 'true');
  promptLabel.textContent = 'User';
  const promptContent = doc.createElement('div');
  promptContent.setAttribute('data-chatspace-inspector-content', 'true');
  promptContent.innerHTML = node.promptHtml || '<span>Continuation</span>';
  promptSection.append(promptLabel, promptContent);

  const responseSection = doc.createElement('section');
  responseSection.setAttribute('data-chatspace-inspector-section', 'true');
  const responseLabel = doc.createElement('div');
  responseLabel.setAttribute('data-chatspace-inspector-label', 'true');
  responseLabel.textContent = 'Assistant';
  const responseContent = doc.createElement('div');
  responseContent.setAttribute('data-chatspace-inspector-content', 'true');
  responseContent.innerHTML = node.responseHtml || '<span>Waiting for response…</span>';
  responseSection.append(responseLabel, responseContent);
  body.append(promptSection, responseSection);

  const actions = doc.createElement('div');
  actions.setAttribute('data-chatspace-inspector-actions', 'true');
  const activeLeaf = activePathIds[activePathIds.length - 1] ?? null;
  if (node.id === activeLeaf) {
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
  activePathIds: string[],
): void {
  const dock = canvas.querySelector<HTMLElement>('[data-chatspace-composer-dock]');
  if (dock === null) return;
  dock.replaceChildren();
  const activeLeafId = activePathIds[activePathIds.length - 1] ?? null;
  const selected = nodeById(state, view.selectedNodeId) ?? nodeById(state, activeLeafId);
  if (selected === null) return;

  const button = doc.createElement('button');
  button.type = 'button';
  button.setAttribute('data-chatspace-composer-button', 'true');
  const icon = doc.createElement('span');
  icon.setAttribute('data-chatspace-composer-icon', 'true');
  icon.textContent = '✦';
  const copy = doc.createElement('span');
  copy.setAttribute('data-chatspace-composer-copy', 'true');
  const title = doc.createElement('strong');
  const hint = doc.createElement('span');
  const nativeFork = sourceForkControl(selected);
  if (selected.id === activeLeafId) {
    title.textContent = `Continue from Turn ${selected.depth + 1}`;
    hint.textContent = 'Jump to the native ChatGPT composer';
    button.addEventListener('click', () => focusNativeComposer(doc));
  } else if (nativeFork !== null) {
    title.textContent = `Fork from Turn ${selected.depth + 1}`;
    hint.textContent = 'Create a new ChatGPT branch from this point';
    button.addEventListener('click', () => nativeFork.click());
  } else {
    title.textContent = `Turn ${selected.depth + 1} selected`;
    hint.textContent = 'Open the inspector to review this branch';
    button.addEventListener('click', () => {
      renderInspector(doc, canvas, state, view, activePathIds);
    });
  }
  copy.append(title, hint);
  button.append(icon, copy);
  dock.append(button);
}

function minimapMetrics(state: CanvasGraphState): { bounds: GraphBounds; scale: number; offsetX: number; offsetY: number } {
  const bounds = graphBounds(state);
  const width = 188;
  const height = 112;
  const scale = Math.min((width - 20) / bounds.width, (height - 20) / bounds.height);
  return {
    bounds,
    scale,
    offsetX: (width - bounds.width * scale) / 2 - bounds.x * scale,
    offsetY: (height - bounds.height * scale) / 2 - bounds.y * scale,
  };
}

function updateMinimapViewport(canvas: HTMLElement, state: CanvasGraphState, view: CanvasViewState): void {
  const minimap = canvas.querySelector<HTMLElement>('[data-chatspace-minimap]');
  const viewport = canvas.querySelector<HTMLElement>('[data-chatspace-viewport]');
  const rect = minimap?.querySelector<HTMLElement>('[data-chatspace-minimap-viewport]') ?? null;
  if (minimap === null || viewport === null || rect === null || state.nodes.length === 0) return;
  const metrics = minimapMetrics(state);
  const viewportWidth = viewport.clientWidth || 1100;
  const viewportHeight = viewport.clientHeight || 680;
  const worldLeft = -view.x / view.zoom;
  const worldTop = -view.y / view.zoom;
  const worldWidth = viewportWidth / view.zoom;
  const worldHeight = viewportHeight / view.zoom;
  rect.style.left = `${metrics.offsetX + worldLeft * metrics.scale}px`;
  rect.style.top = `${metrics.offsetY + worldTop * metrics.scale}px`;
  rect.style.width = `${Math.max(8, worldWidth * metrics.scale)}px`;
  rect.style.height = `${Math.max(6, worldHeight * metrics.scale)}px`;
}

function renderMinimap(
  doc: Document,
  canvas: HTMLElement,
  state: CanvasGraphState,
  view: CanvasViewState,
  activePath: Set<string>,
): void {
  const minimap = canvas.querySelector<HTMLElement>('[data-chatspace-minimap]');
  if (minimap === null) return;
  minimap.replaceChildren();
  if (state.nodes.length === 0) return;
  const metrics = minimapMetrics(state);

  for (const node of state.nodes) {
    const point = cardPosition(node);
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
      view.selectedNodeId = node.id;
      centerNode(canvas, state, view, node.id);
      renderCardsSelection(canvas, state, view, activePath, state.activeTarget ?? '');
      renderInspector(doc, canvas, state, view, Array.from(activePath));
      renderComposerDock(doc, canvas, state, view, Array.from(activePath));
      renderMinimap(doc, canvas, state, view, activePath);
    });
    minimap.append(mini);
  }

  const viewportRect = doc.createElement('div');
  viewportRect.setAttribute('data-chatspace-minimap-viewport', 'true');
  minimap.append(viewportRect);
  updateMinimapViewport(canvas, state, view);
}

function renderGraph(
  doc: Document,
  state: CanvasGraphState,
  view: CanvasViewState,
  activeTarget: string,
  activePathIds: string[],
): number {
  const canvas = ensureCanvas(doc);
  if (canvas === null) return 0;
  const scene = canvas.querySelector<HTMLElement>('[data-chatspace-scene]');
  if (scene === null) return 0;

  const activePath = new Set(activePathIds);
  const bounds = graphBounds(state);
  const width = Math.max(960, bounds.x + bounds.width + PADDING);
  const height = Math.max(620, bounds.y + bounds.height + PADDING);
  renderEdges(doc, scene, state, activePath, width, height);

  const existingCards = new Map(
    Array.from(scene.querySelectorAll<HTMLElement>(`[${NODE_ATTRIBUTE}]`))
      .map((card) => [card.getAttribute(NODE_ATTRIBUTE) ?? '', card]),
  );
  const activeIds = new Set(state.nodes.map((node) => node.id));
  for (const [id, card] of existingCards) {
    if (!activeIds.has(id)) card.remove();
  }

  if (view.selectedNodeId === null) {
    view.selectedNodeId = activePathIds[activePathIds.length - 1] ?? null;
  }

  for (const node of state.nodes) {
    let card = existingCards.get(node.id) ?? null;
    const renderKey = `${node.signature}\u0000${node.streaming}\u0000${node.hasVariants}\u0000${activePath.has(node.id)}\u0000${node.target}`;
    if (card === null || card.getAttribute('data-chatspace-render-key') !== renderKey) {
      const replacement = renderCard(doc, canvas, state, view, node, activePath, activeTarget, activePathIds);
      replacement.setAttribute('data-chatspace-render-key', renderKey);
      if (card === null) scene.append(replacement);
      else card.replaceWith(replacement);
      card = replacement;
    }
    const point = cardPosition(node);
    card.style.left = `${point.x}px`;
    card.style.top = `${point.y}px`;
  }

  renderCardsSelection(canvas, state, view, activePath, activeTarget);
  renderToolbar(doc, canvas, state, view, activePathIds);
  renderInspector(doc, canvas, state, view, activePathIds);
  renderMinimap(doc, canvas, state, view, activePath);
  renderComposerDock(doc, canvas, state, view, activePathIds);
  setupViewportInteractions(canvas, state, view);
  applyViewport(canvas, view);
  updateMinimapViewport(canvas, state, view);
  return state.nodes.length;
}

function cleanupView(doc: Document): void {
  clearNativeSources(doc);
  doc.getElementById(CANVAS_ID)?.remove();
}

function renderCurrent(
  root: ParentNode,
  state: CanvasGraphState,
  view: CanvasViewState,
  target: string,
): HTMLElement[] {
  const doc = root instanceof Document ? root : root.ownerDocument ?? document;
  const snapshots = collectTurnSnapshots(root, doc);
  if (snapshots.length === 0) return [];
  const activePath = reconcileGraph(state, target, snapshots);
  const rendered = renderGraph(doc, state, view, target, activePath);
  if (rendered > 0) markNativeSources(doc, snapshots);
  return snapshots.flatMap((snapshot) => snapshot.responseSource === null ? [] : [snapshot.responseSource]);
}

export function refreshChatGptTurnCards(root: ParentNode = document): HTMLElement[] {
  const doc = root instanceof Document ? root : root.ownerDocument ?? document;
  ensureStyles(doc);
  return renderCurrent(root, createGraphState(), createViewState(), 'chatspace://current');
}

export function mountChatGptTurnCards(options: {
  doc?: Document;
  getHref?: () => string;
} = {}): TurnCardController {
  const doc = options.doc ?? document;
  const viewWindow = doc.defaultView ?? window;
  const getHref = options.getHref ?? (() => viewWindow.location.href);
  const state = createGraphState();
  const view = createViewState();
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
    if (snapshots.length === 0) {
      clearNativeSources(doc);
      return;
    }

    const activePath = reconcileGraph(state, target, snapshots);
    const nextNodeCount = renderGraph(doc, state, view, target, activePath);
    if (nextNodeCount > 0) markNativeSources(doc, snapshots);

    if (nextNodeCount > renderedNodeCount) {
      const canvas = doc.getElementById(CANVAS_ID);
      const latest = activePath[activePath.length - 1] ?? null;
      if (canvas !== null && latest !== null && view.followLatest) {
        view.selectedNodeId = latest;
        if (renderedNodeCount === 0) {
          fitGraph(canvas, state, view);
          view.followLatest = true;
        } else {
          centerNode(canvas, state, view, latest);
        }
        renderCardsSelection(canvas, state, view, new Set(activePath), target);
        renderInspector(doc, canvas, state, view, activePath);
        renderMinimap(doc, canvas, state, view, new Set(activePath));
        renderComposerDock(doc, canvas, state, view, activePath);
      }
    }
    renderedNodeCount = nextNodeCount;
  };

  const schedule = () => {
    if (timer !== undefined) return;
    timer = viewWindow.setTimeout(refresh, REFRESH_DELAY_MS);
  };

  const Observer = viewWindow.MutationObserver ?? MutationObserver;
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
      if (timer !== undefined) viewWindow.clearTimeout(timer);
      cleanupView(doc);
      doc.getElementById(STYLE_ID)?.remove();
    },
  };
}
