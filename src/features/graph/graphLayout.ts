import type { GraphEdge, GraphNode, WorkspaceGraph } from '../../domain/graph/projectGraph';

export interface PositionedGraphNode {
  node: GraphNode;
  x: number;
  y: number;
}

export interface GraphLayout {
  width: number;
  height: number;
  nodes: PositionedGraphNode[];
}

const HORIZONTAL_GAP = 170;
const VERTICAL_GAP = 132;
const PADDING_X = 90;
const PADDING_Y = 76;
const MIN_WIDTH = 920;
const MIN_HEIGHT = 620;

function stableNodeOrder(a: GraphNode, b: GraphNode): number {
  return a.label.localeCompare(b.label) || a.id.localeCompare(b.id);
}

function containsChildren(graph: WorkspaceGraph): Map<string, GraphNode[]> {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const children = new Map<string, GraphNode[]>();

  for (const edge of graph.edges) {
    if (edge.kind !== 'contains') continue;
    const child = nodeById.get(edge.targetId);
    if (child === undefined) continue;
    const siblings = children.get(edge.sourceId) ?? [];
    siblings.push(child);
    children.set(edge.sourceId, siblings);
  }

  for (const siblings of children.values()) siblings.sort(stableNodeOrder);
  return children;
}

export function layoutWorkspaceGraph(graph: WorkspaceGraph): GraphLayout {
  if (graph.nodes.length === 0) return { width: MIN_WIDTH, height: MIN_HEIGHT, nodes: [] };

  const workspace = graph.nodes.find((node) => node.kind === 'workspace') ?? graph.nodes[0];
  if (workspace === undefined) return { width: MIN_WIDTH, height: MIN_HEIGHT, nodes: [] };

  const children = containsChildren(graph);
  const positioned = new Map<string, PositionedGraphNode>();
  const visiting = new Set<string>();
  let leafColumn = 0;
  let maxDepth = 0;

  function place(node: GraphNode, depth: number): number {
    maxDepth = Math.max(maxDepth, depth);
    if (visiting.has(node.id)) {
      const x = PADDING_X + leafColumn++ * HORIZONTAL_GAP;
      positioned.set(node.id, { node, x, y: PADDING_Y + depth * VERTICAL_GAP });
      return x;
    }

    visiting.add(node.id);
    const childNodes = children.get(node.id) ?? [];
    const childXs = childNodes.map((child) => place(child, depth + 1));
    visiting.delete(node.id);

    const x = childXs.length === 0
      ? PADDING_X + leafColumn++ * HORIZONTAL_GAP
      : childXs.reduce((sum, value) => sum + value, 0) / childXs.length;

    positioned.set(node.id, { node, x, y: PADDING_Y + depth * VERTICAL_GAP });
    return x;
  }

  place(workspace, 0);

  const unplaced = graph.nodes.filter((node) => !positioned.has(node.id)).sort(stableNodeOrder);
  for (const node of unplaced) {
    const x = PADDING_X + leafColumn++ * HORIZONTAL_GAP;
    const depth = maxDepth + 1;
    maxDepth = depth;
    positioned.set(node.id, { node, x, y: PADDING_Y + depth * VERTICAL_GAP });
  }

  const width = Math.max(MIN_WIDTH, PADDING_X * 2 + Math.max(1, leafColumn - 1) * HORIZONTAL_GAP);
  const height = Math.max(MIN_HEIGHT, PADDING_Y * 2 + maxDepth * VERTICAL_GAP);

  return {
    width,
    height,
    nodes: graph.nodes.map((node) => positioned.get(node.id)).filter((item): item is PositionedGraphNode => item !== undefined),
  };
}

export function directNeighborhood(graph: WorkspaceGraph, nodeId: string): Set<string> {
  const ids = new Set<string>([nodeId]);
  for (const edge of graph.edges) {
    if (edge.sourceId === nodeId) ids.add(edge.targetId);
    if (edge.targetId === nodeId) ids.add(edge.sourceId);
  }
  return ids;
}

export function edgeVisualWeight(edge: GraphEdge): 'canonical' | 'reference' | 'manual' | 'derived' {
  if (edge.kind === 'contains') return 'canonical';
  if (edge.kind === 'references' || edge.kind === 'note-link') return 'reference';
  if (edge.provenance === 'manual') return 'manual';
  return 'derived';
}
