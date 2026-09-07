import type { ConversationSnapshot } from '../../../domain/conversation/model';

// WXT emits this stable path for the named chatgpt.content.ts entrypoint.
// It is used only by the Side Panel's one-time bridge reconnect path.
export const CHATGPT_CONTENT_SCRIPT_PATH = '/content-scripts/chatgpt.js';

export type ChatGptBridgeRequest =
  | { type: 'chatspace/conversation/read' }
  | { type: 'chatspace/conversation/reveal'; sourceId: string };

export type ChatGptBridgeEvent =
  | { type: 'chatspace/conversation/snapshot'; snapshot: ConversationSnapshot | null }
  | { type: 'chatspace/conversation/source-visible'; sourceId: string };

export function isChatGptBridgeEvent(value: unknown): value is ChatGptBridgeEvent {
  if (typeof value !== 'object' || value === null || !('type' in value)) return false;
  const type = (value as { type?: unknown }).type;
  return type === 'chatspace/conversation/snapshot' || type === 'chatspace/conversation/source-visible';
}
