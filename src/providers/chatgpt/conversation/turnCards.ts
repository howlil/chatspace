import { normalizeChatGptTarget } from '../adapter';
import { findConversationElements } from './selectors';

const STYLE_ID = 'chatspace-turn-card-styles';
const CARD_ATTRIBUTE = 'data-chatspace-card';
const STREAMING_ATTRIBUTE = 'data-chatspace-streaming';
const VARIANT_ATTRIBUTE = 'data-chatspace-has-variants';
const REFRESH_DELAY_MS = 80;

const VARIANT_CONTROL_SELECTOR = [
  'button[aria-label*="previous response" i]',
  'button[aria-label*="next response" i]',
  'button[aria-label*="previous answer" i]',
  'button[aria-label*="next answer" i]',
  '[data-testid*="branch" i]',
].join(',');

const CARD_CSS = `
:root {
  --chatspace-card-ease: cubic-bezier(.22, 1, .36, 1);
  --chatspace-card-accent: #6f91b2;
}

[${CARD_ATTRIBUTE}="response"] {
  position: relative;
  margin-block: 10px 16px;
  padding: clamp(14px, 1.7vw, 20px);
  border: 1px solid color-mix(in srgb, currentColor 13%, transparent);
  border-radius: 18px;
  background: color-mix(in srgb, var(--main-surface-primary, Canvas) 96%, currentColor 4%);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.04), 0 10px 30px rgb(0 0 0 / 0.05);
  transform-origin: 50% 0%;
  transition:
    transform 220ms var(--chatspace-card-ease),
    box-shadow 220ms var(--chatspace-card-ease),
    border-color 180ms ease,
    background-color 180ms ease;
  animation: chatspace-card-enter 280ms var(--chatspace-card-ease) both;
}

[${CARD_ATTRIBUTE}="response"][${STREAMING_ATTRIBUTE}="true"] {
  border-color: color-mix(in srgb, var(--chatspace-card-accent) 52%, transparent);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.04), 0 10px 34px rgb(0 0 0 / 0.07);
}

[${CARD_ATTRIBUTE}="response"][${VARIANT_ATTRIBUTE}="true"] {
  border-inline-start-color: color-mix(in srgb, var(--chatspace-card-accent) 66%, transparent);
}

@media (hover: hover) and (pointer: fine) {
  [${CARD_ATTRIBUTE}="response"]:hover {
    transform: translateY(-1px);
    border-color: color-mix(in srgb, currentColor 18%, transparent);
    box-shadow: 0 2px 4px rgb(0 0 0 / 0.05), 0 14px 36px rgb(0 0 0 / 0.08);
  }
}

@keyframes chatspace-card-enter {
  from {
    opacity: 0;
    transform: translateY(8px) scale(.995);
    filter: blur(3px);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  [${CARD_ATTRIBUTE}="response"] {
    animation: none;
    transition: none;
  }
}
`;

export interface TurnCardController {
  refresh(): void;
  disconnect(): void;
}

function isStreaming(element: HTMLElement): boolean {
  const turn = element.closest<HTMLElement>('[data-testid^="conversation-turn-"]');
  return element.getAttribute('aria-busy') === 'true'
    || element.matches('[data-is-streaming="true"]')
    || turn?.getAttribute('aria-busy') === 'true'
    || turn?.matches('[data-is-streaming="true"]') === true;
}

function hasVariants(element: HTMLElement): boolean {
  const turn = element.closest<HTMLElement>('[data-testid^="conversation-turn-"]') ?? element;
  return turn.querySelector(VARIANT_CONTROL_SELECTOR) !== null;
}

function ensureStyles(doc: Document): void {
  if (doc.getElementById(STYLE_ID) !== null) return;
  const style = doc.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CARD_CSS;
  (doc.head ?? doc.documentElement).append(style);
}

function clearCard(element: HTMLElement): void {
  element.removeAttribute(CARD_ATTRIBUTE);
  element.removeAttribute(STREAMING_ATTRIBUTE);
  element.removeAttribute(VARIANT_ATTRIBUTE);
}

export function refreshChatGptTurnCards(root: ParentNode = document): HTMLElement[] {
  const doc = root instanceof Document ? root : root.ownerDocument ?? document;
  const selected = findConversationElements(root);
  const responses = selected.matches.filter((match) => match.role === 'assistant').map((match) => match.element);
  const responseSet = new Set(responses);

  for (const existing of Array.from(doc.querySelectorAll<HTMLElement>(`[${CARD_ATTRIBUTE}]`))) {
    if (!responseSet.has(existing)) clearCard(existing);
  }

  for (const response of responses) {
    response.setAttribute(CARD_ATTRIBUTE, 'response');
    response.setAttribute(STREAMING_ATTRIBUTE, String(isStreaming(response)));
    response.setAttribute(VARIANT_ATTRIBUTE, String(hasVariants(response)));
  }
  return responses;
}

export function mountChatGptTurnCards(options: {
  doc?: Document;
  getHref?: () => string;
} = {}): TurnCardController {
  const doc = options.doc ?? document;
  const view = doc.defaultView ?? window;
  const getHref = options.getHref ?? (() => view.location.href);
  let timer: number | undefined;

  const refresh = () => {
    timer = undefined;
    if (normalizeChatGptTarget(getHref()) === null) {
      for (const element of Array.from(doc.querySelectorAll<HTMLElement>(`[${CARD_ATTRIBUTE}]`))) clearCard(element);
      return;
    }
    ensureStyles(doc);
    refreshChatGptTurnCards(doc);
  };

  const schedule = () => {
    if (timer !== undefined) return;
    timer = view.setTimeout(refresh, REFRESH_DELAY_MS);
  };

  const observer = new view.MutationObserver(schedule);
  observer.observe(doc.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-message-author-role', 'data-message-id', 'aria-busy', 'data-is-streaming'],
  });
  refresh();

  return {
    refresh,
    disconnect() {
      observer.disconnect();
      if (timer !== undefined) view.clearTimeout(timer);
      for (const element of Array.from(doc.querySelectorAll<HTMLElement>(`[${CARD_ATTRIBUTE}]`))) clearCard(element);
      doc.getElementById(STYLE_ID)?.remove();
    },
  };
}
