import type { ConversationGraph, ConversationGraphEdge, ConversationGraphNode, ConversationSnapshot } from './model';

export function projectConversationGraph(snapshot: ConversationSnapshot): ConversationGraph {
  const nodes: ConversationGraphNode[] = [
    {
      id: `conversation:${snapshot.conversationId}`,
      kind: 'conversation',
      label: 'Conversation',
      sourceIds: snapshot.messages.map((message) => message.source.sourceId),
    },
  ];
  const edges: ConversationGraphEdge[] = [];
  const messageById = new Map(snapshot.messages.map((message) => [message.id, message]));
  const conversationId = `conversation:${snapshot.conversationId}`;

  for (const turn of snapshot.turns) {
    const turnNodeId = turn.id;
    const userMessage = messageById.get(turn.userMessageId);
    nodes.push({
      id: turnNodeId,
      kind: 'turn',
      label: turn.label,
      sourceIds: [userMessage?.source.sourceId, ...turn.responseMessageIds.map((id) => messageById.get(id)?.source.sourceId)].filter((id): id is string => id !== undefined),
      turnId: turn.id,
      messageIds: [turn.userMessageId, ...turn.responseMessageIds],
      sequence: turn.sequence,
      isStreaming: turn.isStreaming,
    });
    edges.push({ id: `contains:${conversationId}:${turnNodeId}`, sourceId: conversationId, targetId: turnNodeId, kind: 'contains', confidence: 'structural' });
    if (turn.previousTurnId !== null) edges.push({ id: `next:${turn.previousTurnId}:${turnNodeId}`, sourceId: turn.previousTurnId, targetId: turnNodeId, kind: 'next', confidence: 'structural' });
  }

  return { conversationId: snapshot.conversationId, nodes, edges };
}
