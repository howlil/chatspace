import { normalizeChatGptTarget } from '../adapter';
import { normalizeConversationSnapshot, type RawConversationMessage } from '../../../domain/conversation/normalize';
import type { ConversationSnapshot } from '../../../domain/conversation/model';
import { findConversationElements, sourceIdentityForElement } from './selectors';

export interface ChatGptDomPort {
  readConversation(): ConversationSnapshot | null;
  subscribe(listener: (snapshot: ConversationSnapshot | null) => void): () => void;
  subscribeVisible(listener: (sourceId: string) => void): () => void;
  revealMessage(sourceId: string): boolean;
}

interface ElementRecord {
  element: HTMLElement;
  sourceId: string;
}

function conversationIdFromTarget(target: string): string | null {
  const match = target.match(/\/c\/([^/?#]+)/);
  return match?.[1] ?? null;
}

function renderedText(element: HTMLElement): string {
  return element.innerText || element.textContent || '';
}

function codeBlockCount(element: HTMLElement): number {
  return element.querySelectorAll('pre, code').length;
}

function isStreaming(element: HTMLElement): boolean {
  return element.getAttribute('aria-busy') === 'true' || element.matches('[data-is-streaming="true"]');
}

function stableSnapshotKey(snapshot: ConversationSnapshot | null): string {
  if (snapshot === null) return 'null';
  return JSON.stringify({
    id: snapshot.conversationId,
    availability: snapshot.availability,
    messages: snapshot.messages.map((message) => [message.id, message.role, message.text, message.isStreaming, message.codeBlockCount]),
  });
}

export class ChatGptDomAdapter implements ChatGptDomPort {
  private readonly records = new Map<string, ElementRecord>();
  private lastKey = '';

  constructor(private readonly getHref: () => string = () => window.location.href) {}

  readConversation(): ConversationSnapshot | null {
    const target = normalizeChatGptTarget(this.getHref());
    if (target === null) return null;
    const conversationId = conversationIdFromTarget(target);
    if (conversationId === null) return null;

    const selected = findConversationElements(document);
    this.records.clear();
    const rawMessages: RawConversationMessage[] = selected.matches.map(({ element, role }) => {
      const identity = sourceIdentityForElement(element);
      return {
        role,
        text: renderedText(element),
        providerId: identity.strategy === 'provider-id' ? identity.value : null,
        domId: identity.strategy === 'dom-id' ? identity.value : null,
        codeBlockCount: codeBlockCount(element),
        isStreaming: isStreaming(element),
      };
    });
    const snapshot = normalizeConversationSnapshot({
      conversationId,
      target,
      messages: rawMessages,
      availability: rawMessages.length === 0 ? 'dom-unsupported' : rawMessages.some((message) => message.isStreaming) ? 'conversation-streaming' : 'conversation-available',
      selectorStrategy: selected.strategy,
    });

    snapshot.messages.forEach((message, index) => {
      const element = selected.matches[index]?.element;
      if (element !== undefined) this.records.set(message.source.sourceId, { element, sourceId: message.source.sourceId });
    });
    return snapshot;
  }

  subscribe(listener: (snapshot: ConversationSnapshot | null) => void): () => void {
    let timer: number | undefined;
    const publish = () => {
      timer = undefined;
      const snapshot = this.readConversation();
      const nextKey = stableSnapshotKey(snapshot);
      if (nextKey === this.lastKey) return;
      this.lastKey = nextKey;
      listener(snapshot);
    };
    const observer = new MutationObserver(() => {
      if (timer !== undefined) return;
      timer = window.setTimeout(publish, 160);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['data-message-id', 'data-message-author-role', 'aria-busy', 'data-is-streaming'] });
    publish();
    return () => {
      observer.disconnect();
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }

  subscribeVisible(listener: (sourceId: string) => void): () => void {
    let observer: IntersectionObserver | undefined;
    const refresh = () => {
      observer?.disconnect();
      observer = new IntersectionObserver((entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target instanceof HTMLElement) {
          const record = [...this.records.values()].find((item) => item.element === visible.target);
          if (record !== undefined) listener(record.sourceId);
        }
      }, { threshold: [0.5] });
      for (const record of this.records.values()) observer.observe(record.element);
    };
    refresh();
    const interval = window.setInterval(refresh, 500);
    return () => {
      observer?.disconnect();
      window.clearInterval(interval);
    };
  }

  revealMessage(sourceId: string): boolean {
    const record = this.records.get(sourceId);
    if (record === undefined || !document.contains(record.element)) {
      this.readConversation();
    }
    const current = this.records.get(sourceId);
    if (current === undefined) return false;
    current.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const previousOutline = current.element.style.outline;
    const previousOffset = current.element.style.outlineOffset;
    current.element.style.outline = '3px solid color-mix(in srgb, #7fa6c9 80%, transparent)';
    current.element.style.outlineOffset = '4px';
    window.setTimeout(() => {
      current.element.style.outline = previousOutline;
      current.element.style.outlineOffset = previousOffset;
    }, 1800);
    return true;
  }
}

export function createChatGptDomAdapter(getHref?: () => string): ChatGptDomAdapter {
  return new ChatGptDomAdapter(getHref);
}
