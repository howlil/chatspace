import type { GraphNode, TurnSnapshot } from './graphEngine';
import { promptIdentity, responseIdentity } from './turnIdentity';
import { findConversationElements } from '../selectors';

export const STYLE_ID = 'chatspace-turn-card-styles';
export const CANVAS_ID = 'chatspace-conversation-canvas';
export const SOURCE_ATTRIBUTE = 'data-chatspace-source-hidden';
export const NODE_ATTRIBUTE = 'data-chatspace-node-id';

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

const SAFE_TAGS = new Set([
  'A', 'B', 'BLOCKQUOTE', 'BR', 'CODE', 'DETAILS', 'DIV', 'EM', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HR',
  'I', 'IMG', 'KBD', 'LI', 'MARK', 'OL', 'P', 'PRE', 'S', 'SPAN', 'STRONG', 'SUB', 'SUMMARY', 'SUP',
  'TABLE', 'TBODY', 'TD', 'TFOOT', 'TH', 'THEAD', 'TR', 'U', 'UL',
]);
const DROP_CONTENT_TAGS = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'FORM', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'OPTION', 'VIDEO', 'AUDIO', 'CANVAS', 'SVG', 'MATH', 'NOSCRIPT']);

export function nativeTurn(element: HTMLElement | null): HTMLElement | null {
  return element?.closest<HTMLElement>('[data-testid^="conversation-turn-"]') ?? element;
}

export function providerMessageId(element: HTMLElement | null): string | null {
  if (element === null) return null;
  const direct = element.getAttribute('data-message-id');
  if (direct !== null && direct.trim() !== '') return direct.trim();
  const closest = element.closest<HTMLElement>('[data-message-id]')?.getAttribute('data-message-id');
  if (closest !== null && closest !== undefined && closest.trim() !== '') return closest.trim();
  const nested = nativeTurn(element)?.querySelector<HTMLElement>('[data-message-id]')?.getAttribute('data-message-id');
  return nested !== null && nested !== undefined && nested.trim() !== '' ? nested.trim() : null;
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
  return turn !== null && turn.querySelector(VARIANT_CONTROL_SELECTOR) !== null;
}

function normalizeText(value: string | null): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

export function snapshotFromSources(promptSource: HTMLElement | null, responseSource: HTMLElement | null): TurnSnapshot {
  const promptText = normalizeText(promptSource?.textContent ?? '');
  const responseText = normalizeText(responseSource?.textContent ?? '');
  const promptKey = providerMessageId(promptSource);
  const responseKey = providerMessageId(responseSource);
  return {
    stableKey: responseIdentity({ responseKey }) ?? promptIdentity({ promptKey }),
    promptKey,
    responseKey,
    promptText,
    responseText,
    signature: `${promptText}\u0000${responseText}`,
    streaming: isStreaming(responseSource),
    hasVariants: hasVariants(responseSource),
    promptSource,
    responseSource,
  };
}

function conversationRegion(root: ParentNode, doc: Document): ParentNode {
  if (!(root instanceof Document)) return root;
  return doc.querySelector<HTMLElement>('main') ?? root;
}

export function collectTurnSnapshots(root: ParentNode, doc: Document): TurnSnapshot[] {
  const region = conversationRegion(root, doc);
  const matches = findConversationElements(region).matches
    .filter((match) => match.element.closest(`#${CANVAS_ID}`) === null)
    .filter((match) => match.role === 'user' || match.role === 'assistant');
  const snapshots: TurnSnapshot[] = [];
  let promptSource: HTMLElement | null = null;

  for (const match of matches) {
    if (match.role === 'user') {
      if (promptSource !== null) snapshots.push(snapshotFromSources(promptSource, null));
      promptSource = match.element;
      continue;
    }
    snapshots.push(snapshotFromSources(promptSource, match.element));
    promptSource = null;
  }
  if (promptSource !== null) snapshots.push(snapshotFromSources(promptSource, null));
  return snapshots;
}

export function snapshotFromNodeSources(node: GraphNode): TurnSnapshot | null {
  const promptConnected = node.promptSource === null || node.promptSource.isConnected;
  const responseConnected = node.responseSource === null || node.responseSource.isConnected;
  if (!promptConnected || !responseConnected) return null;
  return snapshotFromSources(node.promptSource, node.responseSource);
}

export function providerAliasFromMutationTarget(target: Node): string | null {
  const element = target instanceof Element ? target : target.parentElement;
  if (!(element instanceof HTMLElement)) return null;
  const roleElement = element.matches('[data-message-author-role]')
    ? element
    : element.closest<HTMLElement>('[data-message-author-role]')
      ?? element.closest<HTMLElement>('[data-testid^="conversation-turn-"]')?.querySelector<HTMLElement>('[data-message-author-role]')
      ?? null;
  if (roleElement === null) return null;
  const role = roleElement.getAttribute('data-message-author-role')?.toLocaleLowerCase() ?? '';
  const id = providerMessageId(roleElement);
  if (id === null) return null;
  if (role.includes('assistant') || role.includes('chatgpt')) return `assistant:${id}`;
  if (role.includes('user')) return `user:${id}`;
  return null;
}

function safeUrl(value: string, kind: 'href' | 'src'): boolean {
  const normalized = value.trim().toLocaleLowerCase();
  if (normalized === '' || normalized.startsWith('#') || normalized.startsWith('/')) return true;
  if (kind === 'href') return /^(https?:|mailto:)/.test(normalized);
  return /^(https?:|blob:|data:image\/)/.test(normalized);
}

function sanitizeElement(element: HTMLElement): void {
  const tag = element.tagName;
  if (!SAFE_TAGS.has(tag)) {
    if (DROP_CONTENT_TAGS.has(tag)) element.remove();
    else element.replaceWith(...Array.from(element.childNodes));
    return;
  }

  const allowed = new Set<string>();
  if (tag === 'A') for (const name of ['href', 'title', 'target', 'rel']) allowed.add(name);
  if (tag === 'IMG') for (const name of ['src', 'alt', 'title', 'width', 'height']) allowed.add(name);
  if (tag === 'TD' || tag === 'TH') for (const name of ['colspan', 'rowspan']) allowed.add(name);
  if (tag === 'DETAILS') allowed.add('open');
  if (tag === 'PRE' || tag === 'CODE') allowed.add('class');
  allowed.add('aria-label');

  for (const attribute of Array.from(element.attributes)) {
    const name = attribute.name.toLocaleLowerCase();
    if (!allowed.has(name)) {
      element.removeAttribute(attribute.name);
      continue;
    }
    if ((name === 'href' || name === 'src') && !safeUrl(attribute.value, name)) element.removeAttribute(attribute.name);
  }
  if (tag === 'A' && element.hasAttribute('target')) element.setAttribute('rel', 'noopener noreferrer');
}

export function safeInnerHtml(element: HTMLElement | null, doc: Document): string {
  if (element === null) return '';
  const template = doc.createElement('template');
  template.innerHTML = element.innerHTML;
  const descendants = Array.from(template.content.querySelectorAll<HTMLElement>('*'));
  for (const child of descendants) if (child.isConnected || template.content.contains(child)) sanitizeElement(child);
  return template.innerHTML;
}

export function markNativeSources(doc: Document, snapshots: readonly TurnSnapshot[]): void {
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

export function clearNativeSources(doc: Document): void {
  for (const source of Array.from(doc.querySelectorAll<HTMLElement>(`[${SOURCE_ATTRIBUTE}]`))) source.removeAttribute(SOURCE_ATTRIBUTE);
}

export function sourceForkControl(node: GraphNode): HTMLElement | null {
  const source = nativeTurn(node.responseSource) ?? nativeTurn(node.promptSource);
  return source?.querySelector<HTMLElement>(FORK_CONTROL_SELECTOR) ?? null;
}

export function findNativeComposer(doc: Document): HTMLElement | null {
  const selectors = ['#prompt-textarea', '[contenteditable="true"][data-virtualkeyboard]', 'main textarea', 'main [contenteditable="true"]'];
  for (const selector of selectors) {
    const element = doc.querySelector<HTMLElement>(selector);
    if (element !== null && element.closest(`#${CANVAS_ID}`) === null) return element;
  }
  return null;
}

export function focusNativeComposer(doc: Document): void {
  const composer = findNativeComposer(doc);
  if (composer === null) return;
  composer.focus({ preventScroll: true });
  composer.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
