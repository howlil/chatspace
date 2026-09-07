import type {
  ConversationMessage,
  ConversationMessageRole,
  ConversationSnapshot,
  ConversationTurn,
  MessageSourceAnchor,
  SourceIdentityStrategy,
} from './model';

export interface RawConversationMessage {
  role: ConversationMessageRole;
  text: string;
  providerId?: string | null;
  domId?: string | null;
  codeBlockCount?: number;
  isStreaming?: boolean;
}

export interface RawConversationSnapshot {
  conversationId: string;
  target: string;
  messages: RawConversationMessage[];
  observedAt?: number;
  availability?: ConversationSnapshot['availability'];
  selectorStrategy?: string;
}

export const CONVERSATION_ADAPTER_VERSION = 'm21-dom-v1';

export function normalizeMessageText(text: string): string {
  return text.replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

export function semanticLabel(text: string): string {
  const line = text
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find((item) => item !== '') ?? 'Untitled turn';
  return line.replace(/^#{1,6}\s*/, '').replace(/^[-*+]\s+/, '').slice(0, 64).trim() || 'Untitled turn';
}

function fingerprint(raw: RawConversationMessage, sequence: number): string {
  // Structural position is deliberately the final fallback: rendered text changes while a response streams.
  return `${raw.role}:${sequence}`;
}

function sourceAnchor(raw: RawConversationMessage, sequence: number): MessageSourceAnchor {
  if (raw.providerId?.trim()) return { sourceId: raw.providerId.trim(), strategy: 'provider-id' };
  if (raw.domId?.trim()) return { sourceId: raw.domId.trim(), strategy: 'dom-id' };
  return { sourceId: `fingerprint:${fingerprint(raw, sequence)}`, strategy: 'fingerprint' };
}

function messageId(anchor: MessageSourceAnchor, seen: Map<string, number>): string {
  const count = seen.get(anchor.sourceId) ?? 0;
  seen.set(anchor.sourceId, count + 1);
  return count === 0 ? `message:${anchor.sourceId}` : `message:${anchor.sourceId}:${count}`;
}

function buildTurns(messages: ConversationMessage[]): ConversationTurn[] {
  const turns: ConversationTurn[] = [];
  let current: ConversationTurn | undefined;

  for (const message of messages) {
    if (message.role === 'user' || current === undefined) {
      const turn: ConversationTurn = {
        id: `turn:${message.id}`,
        userMessageId: message.id,
        responseMessageIds: message.role === 'user' ? [] : [message.id],
        previousTurnId: turns.at(-1)?.id ?? null,
        sequence: turns.length,
        label: semanticLabel(message.text),
        isStreaming: message.isStreaming,
      };
      turns.push(turn);
      current = turn;
      continue;
    }

    current.responseMessageIds.push(message.id);
    current.isStreaming ||= message.isStreaming;
  }

  return turns;
}

export function normalizeConversationSnapshot(raw: RawConversationSnapshot): ConversationSnapshot {
  const seen = new Map<string, number>();
  const messages: ConversationMessage[] = raw.messages.map((item, sequence) => {
    const text = normalizeMessageText(item.text);
    const anchor = sourceAnchor({ ...item, text }, sequence);
    return {
      id: messageId(anchor, seen),
      role: item.role,
      text,
      sequence,
      source: anchor,
      codeBlockCount: item.codeBlockCount ?? 0,
      isStreaming: item.isStreaming ?? false,
    };
  });

  const turns = buildTurns(messages);
  const roleCounts: Partial<Record<ConversationMessageRole, number>> = {};
  for (const message of messages) roleCounts[message.role] = (roleCounts[message.role] ?? 0) + 1;

  return {
    conversationId: raw.conversationId,
    target: raw.target,
    messages,
    turns,
    observedAt: raw.observedAt ?? Date.now(),
    availability: raw.availability ?? (messages.some((message) => message.isStreaming) ? 'conversation-streaming' : 'conversation-available'),
    adapterVersion: CONVERSATION_ADAPTER_VERSION,
    diagnostics: {
      selectorStrategy: raw.selectorStrategy ?? 'unknown',
      roleCounts,
    },
  };
}

export function sourceStrategyLabel(strategy: SourceIdentityStrategy): string {
  return strategy === 'provider-id' ? 'provider identity' : strategy === 'dom-id' ? 'DOM identity' : 'stable text fingerprint';
}
