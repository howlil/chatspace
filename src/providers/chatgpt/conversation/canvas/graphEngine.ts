export interface TurnSnapshot {
  stableKey: string | null;
  promptKey: string | null;
  responseKey: string | null;
  promptText: string;
  responseText: string;
  signature: string;
  streaming: boolean;
  hasVariants: boolean;
  promptSource: HTMLElement | null;
  responseSource: HTMLElement | null;
}

export interface GraphNode extends TurnSnapshot {
  id: string;
  parentId: string | null;
  depth: number;
  order: number;
  hydrated: boolean;
  targets: Set<string>;
}

export interface CanvasGraphState {
  nodesById: Map<string, GraphNode>;
  childrenByParent: Map<string | null, string[]>;
  nodeIdByStableKey: Map<string, string>;
  paths: Map<string, string[]>;
  activeTarget: string | null;
  nextNodeId: number;
  nextOrder: number;
}

export interface ReconcileResult {
  activePathIds: string[];
  changedNodeIds: Set<string>;
  topologyChanged: boolean;
  activePathChanged: boolean;
}

export interface PersistedGraphNode {
  id: string;
  parentId: string | null;
  depth: number;
  order: number;
  stableKey: string | null;
  targets: string[];
}

export interface PersistedGraphState {
  version: 1;
  nodes: PersistedGraphNode[];
  paths: Array<[string, string[]]>;
  activeTarget: string | null;
  nextNodeId: number;
  nextOrder: number;
}

export function createGraphState(): CanvasGraphState {
  return {
    nodesById: new Map(),
    childrenByParent: new Map(),
    nodeIdByStableKey: new Map(),
    paths: new Map(),
    activeTarget: null,
    nextNodeId: 1,
    nextOrder: 1,
  };
}

export function nodeById(state: CanvasGraphState, id: string | null): GraphNode | null {
  if (id === null) return null;
  return state.nodesById.get(id) ?? null;
}

export function graphNodes(state: CanvasGraphState): GraphNode[] {
  return Array.from(state.nodesById.values()).sort((a, b) => a.order - b.order);
}

export function childIds(state: CanvasGraphState, parentId: string | null): readonly string[] {
  return state.childrenByParent.get(parentId) ?? [];
}

function addChild(state: CanvasGraphState, parentId: string | null, childId: string): void {
  const children = state.childrenByParent.get(parentId);
  if (children === undefined) {
    state.childrenByParent.set(parentId, [childId]);
    return;
  }
  if (!children.includes(childId)) children.push(childId);
}

function samePath(a: readonly string[] | undefined, b: readonly string[]): boolean {
  if (a === undefined || a.length !== b.length) return false;
  return a.every((id, index) => id === b[index]);
}

function exactSnapshotMatch(node: GraphNode, snapshot: TurnSnapshot): boolean {
  if (node.stableKey !== null && snapshot.stableKey !== null) return node.stableKey === snapshot.stableKey;
  return node.signature === snapshot.signature;
}

function streamingContinuation(node: GraphNode, snapshot: TurnSnapshot): boolean {
  if (!(node.streaming || snapshot.streaming)) return false;
  if (node.promptKey !== null && snapshot.promptKey !== null) return node.promptKey === snapshot.promptKey;
  return node.promptText === snapshot.promptText;
}

function sameRenderedTurn(node: GraphNode, snapshot: TurnSnapshot): boolean {
  if (exactSnapshotMatch(node, snapshot)) return true;
  if (streamingContinuation(node, snapshot)) return true;
  if (node.responseKey !== null && snapshot.responseKey !== null) return node.responseKey === snapshot.responseKey;
  return false;
}

function commonPrefixLength(state: CanvasGraphState, path: readonly string[], snapshots: readonly TurnSnapshot[]): number {
  let index = 0;
  while (index < path.length && index < snapshots.length) {
    const id = path[index];
    const snapshot = snapshots[index];
    if (id === undefined || snapshot === undefined) break;
    const node = nodeById(state, id);
    if (node === null || !sameRenderedTurn(node, snapshot)) break;
    index += 1;
  }
  return index;
}

function resetGraph(state: CanvasGraphState): void {
  state.nodesById.clear();
  state.childrenByParent.clear();
  state.nodeIdByStableKey.clear();
  state.paths.clear();
  state.activeTarget = null;
  state.nextNodeId = 1;
  state.nextOrder = 1;
}

function contentChanged(node: GraphNode, snapshot: TurnSnapshot): boolean {
  return node.promptText !== snapshot.promptText
    || node.responseText !== snapshot.responseText
    || node.signature !== snapshot.signature
    || node.streaming !== snapshot.streaming
    || node.hasVariants !== snapshot.hasVariants
    || node.promptSource !== snapshot.promptSource
    || node.responseSource !== snapshot.responseSource
    || node.promptKey !== snapshot.promptKey
    || node.responseKey !== snapshot.responseKey
    || node.stableKey !== snapshot.stableKey
    || !node.hydrated;
}

function registerStableKey(state: CanvasGraphState, node: GraphNode, stableKey: string | null): void {
  if (stableKey === null) return;
  const existing = state.nodeIdByStableKey.get(stableKey);
  if (existing === undefined || existing === node.id) state.nodeIdByStableKey.set(stableKey, node.id);
}

function updateNode(state: CanvasGraphState, node: GraphNode, snapshot: TurnSnapshot, target: string): boolean {
  const changed = contentChanged(node, snapshot);
  if (node.stableKey === null && snapshot.stableKey !== null) node.stableKey = snapshot.stableKey;
  node.promptKey = snapshot.promptKey;
  node.responseKey = snapshot.responseKey;
  node.promptText = snapshot.promptText;
  node.responseText = snapshot.responseText;
  node.signature = snapshot.signature;
  node.streaming = snapshot.streaming;
  node.hasVariants = snapshot.hasVariants;
  node.promptSource = snapshot.promptSource;
  node.responseSource = snapshot.responseSource;
  node.hydrated = true;
  node.targets.add(target);
  registerStableKey(state, node, node.stableKey);
  return changed;
}

function createNode(
  state: CanvasGraphState,
  snapshot: TurnSnapshot,
  parentId: string | null,
  target: string,
): GraphNode {
  const parent = nodeById(state, parentId);
  const node: GraphNode = {
    ...snapshot,
    id: `turn-${state.nextNodeId++}`,
    parentId,
    depth: parent === null ? 0 : parent.depth + 1,
    order: state.nextOrder++,
    hydrated: true,
    targets: new Set([target]),
  };
  state.nodesById.set(node.id, node);
  addChild(state, parentId, node.id);
  registerStableKey(state, node, node.stableKey);
  return node;
}

function reusableNodeForSnapshot(
  state: CanvasGraphState,
  snapshot: TurnSnapshot,
  parentId: string | null,
): GraphNode | null {
  if (snapshot.stableKey === null) return null;
  const id = state.nodeIdByStableKey.get(snapshot.stableKey);
  if (id === undefined) return null;
  const node = nodeById(state, id);
  if (node === null || node.parentId !== parentId) return null;
  return node;
}

export function reconcileGraph(
  state: CanvasGraphState,
  target: string,
  snapshots: readonly TurnSnapshot[],
): ReconcileResult {
  const previousActiveTarget = state.activeTarget;
  const previousActivePath = previousActiveTarget === null ? undefined : state.paths.get(previousActiveTarget);
  const previousTargetPath = state.paths.get(target);
  let path = previousTargetPath;
  let topologyChanged = false;
  const changedNodeIds = new Set<string>();

  if (path === undefined) {
    if (previousActivePath !== undefined) {
      const prefixLength = commonPrefixLength(state, previousActivePath, snapshots);
      if (prefixLength > 0) {
        path = previousActivePath.slice(0, prefixLength);
      } else if (snapshots.length > 0) {
        resetGraph(state);
        topologyChanged = true;
      }
    }
    path ??= [];
  }

  let index = 0;
  while (index < path.length && index < snapshots.length) {
    const pathId = path[index];
    const snapshot = snapshots[index];
    if (pathId === undefined || snapshot === undefined) break;
    const node = nodeById(state, pathId);
    if (node === null || !sameRenderedTurn(node, snapshot)) break;
    if (updateNode(state, node, snapshot, target)) changedNodeIds.add(node.id);
    index += 1;
  }

  const nextPath = path.slice(0, index);
  let parentId: string | null = nextPath[nextPath.length - 1] ?? null;
  for (let snapshotIndex = index; snapshotIndex < snapshots.length; snapshotIndex += 1) {
    const snapshot = snapshots[snapshotIndex];
    if (snapshot === undefined) break;
    const reusable = reusableNodeForSnapshot(state, snapshot, parentId);
    if (reusable !== null) {
      if (updateNode(state, reusable, snapshot, target)) changedNodeIds.add(reusable.id);
      nextPath.push(reusable.id);
      parentId = reusable.id;
      continue;
    }

    const node = createNode(state, snapshot, parentId, target);
    changedNodeIds.add(node.id);
    nextPath.push(node.id);
    parentId = node.id;
    topologyChanged = true;
  }

  state.paths.set(target, nextPath);
  state.activeTarget = target;
  const activePathChanged = previousActiveTarget !== target || !samePath(previousTargetPath, nextPath);

  return {
    activePathIds: nextPath,
    changedNodeIds,
    topologyChanged,
    activePathChanged,
  };
}

export function serializeGraphState(state: CanvasGraphState): PersistedGraphState {
  return {
    version: 1,
    nodes: graphNodes(state).map((node) => ({
      id: node.id,
      parentId: node.parentId,
      depth: node.depth,
      order: node.order,
      stableKey: node.stableKey,
      targets: Array.from(node.targets),
    })),
    paths: Array.from(state.paths.entries()).map(([target, path]) => [target, [...path]]),
    activeTarget: state.activeTarget,
    nextNodeId: state.nextNodeId,
    nextOrder: state.nextOrder,
  };
}

export function restoreGraphState(value: PersistedGraphState): CanvasGraphState {
  const state = createGraphState();
  if (value.version !== 1) return state;

  for (const saved of value.nodes) {
    const node: GraphNode = {
      id: saved.id,
      parentId: saved.parentId,
      depth: saved.depth,
      order: saved.order,
      stableKey: saved.stableKey,
      promptKey: null,
      responseKey: null,
      promptText: '',
      responseText: '',
      signature: '',
      streaming: false,
      hasVariants: false,
      promptSource: null,
      responseSource: null,
      hydrated: false,
      targets: new Set(saved.targets),
    };
    state.nodesById.set(node.id, node);
    addChild(state, node.parentId, node.id);
    registerStableKey(state, node, node.stableKey);
  }

  state.paths = new Map(value.paths.map(([target, path]) => [target, [...path]]));
  state.activeTarget = value.activeTarget;
  state.nextNodeId = Math.max(value.nextNodeId, value.nodes.length + 1);
  state.nextOrder = Math.max(value.nextOrder, value.nodes.length + 1);
  return state;
}
