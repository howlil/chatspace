import type { ConversationGraph, ConversationGraphNode, ConversationSnapshot } from './model';

export function searchConversation(snapshot: ConversationSnapshot, graph: ConversationGraph, query: string): Set<string> {
  const normalized = query.trim().toLocaleLowerCase();
  if (normalized === '') return new Set(graph.nodes.map((node) => node.id));

  const matchedTurnIds = new Set(
    snapshot.turns
      .filter((turn) => {
        const messages = snapshot.messages.filter((message) => message.id === turn.userMessageId || turn.responseMessageIds.includes(message.id));
        return turn.label.toLocaleLowerCase().includes(normalized) || messages.some((message) => message.text.toLocaleLowerCase().includes(normalized));
      })
      .map((turn) => turn.id),
  );
  return new Set(graph.nodes.filter((node) => node.kind === 'conversation' || node.turnId !== undefined && matchedTurnIds.has(node.turnId)).map((node) => node.id));
}

export function focusConversationGraph(graph: ConversationGraph, selectedId: string | undefined): Set<string> {
  if (selectedId === undefined) return new Set(graph.nodes.map((node) => node.id));
  const focused = new Set([selectedId]);
  for (const edge of graph.edges) {
    if (edge.sourceId === selectedId) focused.add(edge.targetId);
    if (edge.targetId === selectedId) focused.add(edge.sourceId);
  }
  return focused;
}

export function conversationNodeSourceIds(node: ConversationGraphNode, snapshot: ConversationSnapshot): string[] {
  if (node.sourceIds.length > 0) return node.sourceIds;
  if (node.turnId === undefined) return [];
  const turn = snapshot.turns.find((item) => item.id === node.turnId);
  if (turn === undefined) return [];
  return snapshot.messages.filter((message) => message.id === turn.userMessageId || turn.responseMessageIds.includes(message.id)).map((message) => message.source.sourceId);
}
