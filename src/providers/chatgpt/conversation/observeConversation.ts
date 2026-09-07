import type { ChatGptDomPort } from './domAdapter';
import type { ConversationSnapshot } from '../../../domain/conversation/model';

export function observeConversation(
  port: ChatGptDomPort,
  listener: (snapshot: ConversationSnapshot | null) => void,
): () => void {
  return port.subscribe(listener);
}
