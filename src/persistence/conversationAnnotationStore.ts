import type { ConversationAnnotation } from '../domain/conversation/model';

export const CONVERSATION_ANNOTATIONS_KEY = 'chatspace-conversation-annotations';

export interface ConversationAnnotationStorage {
  get(key: string): Promise<unknown>;
  set(values: Record<string, unknown>): Promise<void>;
}

function isAnnotation(value: unknown): value is ConversationAnnotation {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Partial<ConversationAnnotation>;
  return typeof item.id === 'string' && typeof item.conversationTarget === 'string' && typeof item.sourceKey === 'string' && typeof item.note === 'string' && typeof item.pinned === 'boolean' && typeof item.createdAt === 'number' && typeof item.updatedAt === 'number';
}

export async function loadConversationAnnotations(storage: ConversationAnnotationStorage, conversationTarget: string): Promise<ConversationAnnotation[]> {
  const result = await storage.get(CONVERSATION_ANNOTATIONS_KEY);
  const values = typeof result === 'object' && result !== null ? (result as Record<string, unknown>)[CONVERSATION_ANNOTATIONS_KEY] : undefined;
  if (!Array.isArray(values)) return [];
  return values.filter(isAnnotation).filter((item) => item.conversationTarget === conversationTarget);
}

export async function saveConversationAnnotation(storage: ConversationAnnotationStorage, annotation: ConversationAnnotation): Promise<void> {
  const result = await storage.get(CONVERSATION_ANNOTATIONS_KEY);
  const values = typeof result === 'object' && result !== null ? (result as Record<string, unknown>)[CONVERSATION_ANNOTATIONS_KEY] : undefined;
  const annotations = Array.isArray(values) ? values.filter(isAnnotation) : [];
  const next = annotations.filter((item) => item.id !== annotation.id);
  if (annotation.note.trim() !== '' || annotation.pinned) next.push(annotation);
  await storage.set({ [CONVERSATION_ANNOTATIONS_KEY]: next });
}
