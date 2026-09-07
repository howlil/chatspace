export type ConversationMessageRole = 'user' | 'assistant' | 'system' | 'tool' | 'unknown';

export type SourceIdentityStrategy = 'provider-id' | 'dom-id' | 'fingerprint';

export interface MessageSourceAnchor {
  sourceId: string;
  strategy: SourceIdentityStrategy;
}

export interface ConversationMessage {
  id: string;
  role: ConversationMessageRole;
  text: string;
  sequence: number;
  source: MessageSourceAnchor;
  codeBlockCount: number;
  isStreaming: boolean;
}

export interface ConversationTurn {
  id: string;
  userMessageId: string;
  responseMessageIds: string[];
  previousTurnId: string | null;
  sequence: number;
  label: string;
  isStreaming: boolean;
}

export type ConversationAvailability =
  | 'conversation-loading'
  | 'conversation-available'
  | 'conversation-streaming'
  | 'dom-partially-recognized'
  | 'dom-unsupported';

export interface ConversationSnapshot {
  conversationId: string;
  target: string;
  messages: ConversationMessage[];
  turns: ConversationTurn[];
  observedAt: number;
  availability: ConversationAvailability;
  adapterVersion: string;
  diagnostics: {
    selectorStrategy: string;
    roleCounts: Partial<Record<ConversationMessageRole, number>>;
  };
}

export interface ConversationTopic {
  id: string;
  label: string;
  turnIds: string[];
  provenance: 'manual' | 'derived';
}

export type ConversationGraphNodeKind = 'conversation' | 'turn' | 'message' | 'topic';

export type ConversationGraphEdgeKind = 'next' | 'responds-to' | 'contains' | 'branch' | 'topic';

export type EdgeConfidence = 'provider' | 'structural' | 'derived';

export interface ConversationGraphNode {
  id: string;
  kind: ConversationGraphNodeKind;
  label: string;
  sourceIds: string[];
  turnId?: string;
  messageIds?: string[];
  sequence?: number;
  isStreaming?: boolean;
}

export interface ConversationGraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  kind: ConversationGraphEdgeKind;
  confidence: EdgeConfidence;
}

export interface ConversationGraph {
  conversationId: string;
  nodes: ConversationGraphNode[];
  edges: ConversationGraphEdge[];
}

export interface ConversationAnnotation {
  id: string;
  conversationTarget: string;
  sourceKey: string;
  note: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}
