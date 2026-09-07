import { getChatGptCapability } from '../../providers/chatgpt/adapter';
import { isChatGptBridgeEvent, type ChatGptBridgeEvent, type ChatGptBridgeRequest } from '../../providers/chatgpt/conversation/bridge';
import type { ConversationSnapshot } from '../../domain/conversation/model';

export interface ConversationTab {
  id: number | undefined;
  url: string | undefined;
  title: string | undefined;
}

export interface ConversationControllerPort {
  getActiveTab(): Promise<ConversationTab | undefined>;
  sendMessage(tabId: number, message: ChatGptBridgeRequest): Promise<unknown>;
  ensureContentScript(tabId: number): Promise<void>;
  subscribe(listener: (message: unknown, tabId: number | undefined) => void): () => void;
}

export interface ConversationControllerState {
  snapshot: ConversationSnapshot | null;
  tab: ConversationTab | undefined;
  phase: 'loading' | 'available' | 'unsupported' | 'unavailable';
  visibleSourceId: string | null;
  error: string | null;
}

const initialState: ConversationControllerState = {
  snapshot: null,
  tab: undefined,
  phase: 'loading',
  visibleSourceId: null,
  error: null,
};

export class ConversationController {
  private state = initialState;
  private readonly listeners = new Set<(state: ConversationControllerState) => void>();
  private activeTabId: number | undefined;

  constructor(private readonly port: ConversationControllerPort) {}

  getState(): ConversationControllerState {
    return this.state;
  }

  subscribe(listener: (state: ConversationControllerState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  start(): () => void {
    const stop = this.port.subscribe((message, tabId) => {
      if (tabId !== undefined && tabId !== this.activeTabId) return;
      if (isChatGptBridgeEvent(message)) this.applyEvent(message);
    });
    void this.refresh();
    return stop;
  }

  async refresh(): Promise<void> {
    const tab = await this.port.getActiveTab();
    this.activeTabId = tab?.id;
    const capability = getChatGptCapability(tab?.url ?? '');
    const supportedConversation = capability.supportedOrigin && capability.canCaptureCurrentReference;
    this.update({ tab, visibleSourceId: null, error: null, phase: supportedConversation ? 'loading' : 'unavailable', snapshot: null });
    if (!supportedConversation || tab?.id === undefined) return;
    try {
      const response = await this.readSnapshot(tab.id);
      if (isChatGptBridgeEvent(response) && response.type === 'chatspace/conversation/snapshot') {
        this.applyEvent(response);
      } else {
        this.update({ phase: 'unsupported', error: 'ChatGPT page did not expose a readable conversation.' });
      }
    } catch {
      try {
        // A tab that predates an extension reload has no content-script receiver.
        // Reconnect the isolated-world bridge without reloading ChatGPT, which
        // keeps an in-progress provider response and its viewport intact.
        await this.port.ensureContentScript(tab.id);
        const response = await this.readSnapshot(tab.id);
        if (isChatGptBridgeEvent(response) && response.type === 'chatspace/conversation/snapshot') {
          this.applyEvent(response);
        } else {
          this.update({ phase: 'unsupported', error: 'ChatGPT page did not expose a readable conversation.' });
        }
      } catch {
        this.update({ phase: 'unsupported', error: 'Chatspace could not reconnect to this ChatGPT tab automatically.' });
      }
    }
  }

  async revealSource(sourceId: string): Promise<boolean> {
    const tabId = this.activeTabId;
    if (tabId === undefined) return false;
    try {
      const response = await this.port.sendMessage(tabId, { type: 'chatspace/conversation/reveal', sourceId });
      return typeof response === 'object' && response !== null && 'ok' in response && (response as { ok?: unknown }).ok === true;
    } catch {
      return false;
    }
  }

  private applyEvent(event: ChatGptBridgeEvent): void {
    if (event.type === 'chatspace/conversation/source-visible') {
      this.update({ visibleSourceId: event.sourceId });
      return;
    }
    const snapshot = event.snapshot;
    this.update({ snapshot, phase: snapshot === null ? 'unsupported' : snapshot.availability === 'dom-unsupported' ? 'unsupported' : 'available', error: snapshot?.availability === 'dom-unsupported' ? 'Conversation structure changed. Chatspace could not read this conversation.' : null });
  }

  private readSnapshot(tabId: number): Promise<unknown> {
    return this.port.sendMessage(tabId, { type: 'chatspace/conversation/read' });
  }

  private update(patch: Partial<ConversationControllerState>): void {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener(this.state);
  }
}
