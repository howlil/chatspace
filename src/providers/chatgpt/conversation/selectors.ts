export type ChatGptMessageRole = 'user' | 'assistant' | 'system' | 'tool' | 'unknown';
export type ConversationSelectorStrategy = 'semantic' | 'turn-container' | 'structural';

export interface ConversationElementMatch {
  element: HTMLElement;
  role: ChatGptMessageRole;
  strategy: ConversationSelectorStrategy;
}

function roleFromValue(value: string | null): ChatGptMessageRole {
  const normalized = value?.toLocaleLowerCase() ?? '';
  if (normalized.includes('user')) return 'user';
  if (normalized.includes('assistant') || normalized.includes('chatgpt')) return 'assistant';
  if (normalized.includes('system')) return 'system';
  if (normalized.includes('tool')) return 'tool';
  return 'unknown';
}

function uniqueMatches(matches: ConversationElementMatch[]): ConversationElementMatch[] {
  const seen = new Set<HTMLElement>();
  return matches.filter((match) => {
    if (seen.has(match.element)) return false;
    seen.add(match.element);
    return true;
  });
}

function messageRoleElements(root: ParentNode, strategy: ConversationSelectorStrategy): ConversationElementMatch[] {
  return Array.from(root.querySelectorAll<HTMLElement>('[data-message-author-role]'))
    .filter((element) => element.parentElement?.closest('[data-message-author-role]') === null)
    .map((element) => ({ element, role: roleFromValue(element.getAttribute('data-message-author-role')), strategy }));
}

export function findConversationElements(root: ParentNode = document): { matches: ConversationElementMatch[]; strategy: ConversationSelectorStrategy } {
  const semantic = uniqueMatches(messageRoleElements(root, 'semantic'));
  if (semantic.length > 0) return { matches: semantic, strategy: 'semantic' };

  const turnContainers = Array.from(root.querySelectorAll<HTMLElement>('[data-testid^="conversation-turn-"]'))
    .map((container): ConversationElementMatch | null => {
      const roleElement = container.querySelector<HTMLElement>('[data-message-author-role]');
      if (roleElement === null) return null;
      return { element: roleElement, role: roleFromValue(roleElement.getAttribute('data-message-author-role')), strategy: 'turn-container' };
    })
    .filter((match): match is ConversationElementMatch => match !== null);
  if (turnContainers.length > 0) return { matches: uniqueMatches(turnContainers), strategy: 'turn-container' };

  const structural = Array.from(root.querySelectorAll<HTMLElement>('main article, [role="article"]'))
    .map((element): ConversationElementMatch | null => {
      const value = element.getAttribute('data-role') ?? element.getAttribute('aria-label') ?? '';
      if (!/user|assistant|system|tool/i.test(value)) return null;
      return { element, role: roleFromValue(value), strategy: 'structural' };
    })
    .filter((match): match is ConversationElementMatch => match !== null);
  return { matches: uniqueMatches(structural), strategy: 'structural' };
}
