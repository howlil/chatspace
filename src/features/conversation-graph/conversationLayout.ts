import type { ConversationGraph, ConversationGraphNode } from '../../domain/conversation/model';

export interface ConversationPosition {
  node: ConversationGraphNode;
  x: number;
  y: number;
}

export interface ConversationLayout {
  width: number;
  height: number;
  positions: ConversationPosition[];
}

const COLUMN_GAP = 184;
const ROW_GAP = 112;
const PADDING = 80;

export function layoutConversationGraph(graph: ConversationGraph): ConversationLayout {
  const root = graph.nodes.find((node) => node.kind === 'conversation');
  const turns = graph.nodes.filter((node) => node.kind === 'turn').sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
  const positions: ConversationPosition[] = [];
  if (root !== undefined) positions.push({ node: root, x: PADDING, y: PADDING });
  turns.forEach((node, index) => positions.push({ node, x: PADDING + COLUMN_GAP + (index % 2) * COLUMN_GAP, y: PADDING + Math.floor(index / 2) * ROW_GAP }));
  return {
    width: Math.max(720, PADDING * 2 + COLUMN_GAP * 3),
    height: Math.max(520, PADDING * 2 + Math.ceil(turns.length / 2) * ROW_GAP),
    positions,
  };
}
