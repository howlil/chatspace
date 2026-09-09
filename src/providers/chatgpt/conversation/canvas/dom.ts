import type { GraphNode, TurnSnapshot } from './graphEngine';
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

export function nativeTurn(element: HTMLElement | null): HTMLElement | null {
  return element?.closest<HTMLElement>('[data-testid^="conversation-turn-"]') ?? element;
}

function providerMessageId(element: HTMLElement | null): string | null {
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

function snapshotFromSources(promptSource: HTMLElement | null, responseSource: HTMLElement | null): TurnSnapshot {
  const promptText = normalizeText(promptSource?.textContent ?? '');
  const responseText = normalizeText(responseSource?.textContent ?? '');
  const promptKey = providerMessageId(promptSource);
  const responseKey = providerMessageId(responseSource);
  const stableKey = responseKey !== null
    ? `assistant:${responseKey}`
    : responseSource === null && promptKey !== null
      ? `pending:${promptKey}`
      : null;

  return {
    stableKey,
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

export function collectTurnSnapshots(root: ParentNode, doc: Document): TurnSnapshot[] {
  const matches = findConversationElements(root).matches
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
  void doc;
  return snapshots;
}

export function safeInnerHtml(element: HTMLElement | null, doc: Document): string {
  if (element === null) return '';
  const template = doc.createElement('template');
  template.innerHTML = element.innerHTML;
  for (const child of Array.from(template.content.querySelectorAll<HTMLElement>('*'))) {
    child.removeAttribute('id');
    child.removeAttribute('data-testid');
    child.removeAttribute('data-message-author-role');
    child.removeAttribute('data-message-id');
    child.removeAttribute('aria-busy');
    child.removeAttribute('data-is-streaming');
    for (const attribute of Array.from(child.attributes)) {
      const name = attribute.name.toLocaleLowerCase();
      if (name.startsWith('on')) child.removeAttribute(attribute.name);
      if ((name === 'href' || name === 'src') && /^javascript:/i.test(attribute.value.trim())) {
        child.removeAttribute(attribute.name);
      }
    }
  }
  for (const interactive of Array.from(template.content.querySelectorAll('script, style, form, button, input, textarea, select'))) {
    interactive.remove();
  }
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
  for (const source of Array.from(doc.querySelectorAll<HTMLElement>(`[${SOURCE_ATTRIBUTE}]`))) {
    source.removeAttribute(SOURCE_ATTRIBUTE);
  }
}

export function sourceForkControl(node: GraphNode): HTMLElement | null {
  const source = nativeTurn(node.responseSource) ?? nativeTurn(node.promptSource);
  return source?.querySelector<HTMLElement>(FORK_CONTROL_SELECTOR) ?? null;
}

export function findNativeComposer(doc: Document): HTMLElement | null {
  const selectors = [
    '#prompt-textarea',
    '[contenteditable="true"][data-virtualkeyboard]',
    'main textarea',
    'main [contenteditable="true"]',
  ];
  for (const selector of selectors) {
    const element = doc.querySelector<HTMLElement>(selector);
    if (element !== null && element.closest(`#${CANVAS_ID}`) === null) return element;
  }
  return null;
}

export function focusNativeComposer(doc: Document): void {
  const composer = findNativeComposer(doc);
  if (composer === null) return;
  composer.focus();
  composer.scrollIntoView({ block: 'center', behavior: 'smooth' });
}
