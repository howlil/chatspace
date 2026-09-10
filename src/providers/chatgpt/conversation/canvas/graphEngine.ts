import { responseIdentity, snapshotIdentityAliases } from './turnIdentity';

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
  providerAliases: Set<string>;
}

export interface CanvasGraphState {
  nodesById: Map<string, GraphNode>;
  childrenByParent: Map<string | null, string[]>;
  nodeIdByProviderAlias: Map<string, string>;
  paths: Map<string, string[]>;
  activeTarget: string | null;
  nextNodeId: number;
  nextOrder: number;
}

export interface ReconcileResult {
  activePathIds: string[];
  changedNodeIds: Set<string>;
  addedNodeIds: Set<string>;
  removedNodeIds: Set<string>;
  topologyChanged: boolean;
  activePathChanged: boolean;
}

export interface PersistedGraphNode {
  id: string;
  parentId: string | null;
  depth: number;
  order: number;
  stableKey: string | null;
  providerAliases: string[];
  targets: string[];
}

export interface PersistedGraphState {
  version: 2;
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
    nodeIdByProviderAlias: new Map(),
    paths: new Map(),
    activeTarget: null,
    nextNodeId: 1,
    nextOrder: 1,
  };
}

export function nodeById(state: CanvasGraphState, id: string | null): GraphNode | null {
  return id === null ? null : state.nodesById.get(id) ?? null;
}

export function graphNodes(state: CanvasGraphState): GraphNode[] {
  return Array.from(state.nodesById.values()).sort((a, b) => a.order - b.order);
}

export function childIds(state: CanvasGraphState, parentId: string | null): readonly string[] {
  return state.childrenByParent.get(parentId) ?? [];
}

function addChild(state: CanvasGraphState, parentId: string | null, childId: string): void {
  const children = state.childrenByParent.get(parentId);
  if (children === undefined) state.childrenByParent.set(parentId, [childId]);
  else if (!children.includes(childId)) children.push(childId);
}

function samePath(a: readonly string[] | undefined, b: readonly string[]): boolean {
  return a !== undefined && a.length === b.length && a.every((id, index) => id === b[index]);
}

function aliasesMatch(node: GraphNode, snapshot: TurnSnapshot): boolean {
  const aliases = snapshotIdentityAliases(snapshot);
  return aliases.some((alias) => node.providerAliases.has(alias));
}

function exactSnapshotMatch(node: GraphNode, snapshot: TurnSnapshot): boolean {
  if (aliasesMatch(node, snapshot)) return true;
  if (node.providerAliases.size > 0 && snapshotIdentityAliases(snapshot).length > 0) return false;
  return node.signature === snapshot.signature;
}

function streamingContinuation(node: GraphNode, snapshot: TurnSnapshot): boolean {
  if (!(node.streaming || snapshot.streaming)) return false;
  if (aliasesMatch(node, snapshot)) return true;
  if (node.promptKey !== null && snapshot.promptKey !== null) return node.promptKey === snapshot.promptKey;
  return node.promptText === snapshot.promptText;
}

function sameRenderedTurn(node: GraphNode, snapshot: TurnSnapshot): boolean {
  return exactSnapshotMatch(node, snapshot) || streamingContinuation(node, snapshot);
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

function resetGraph(state: CanvasGraphState): Set<string> {
  const removed = new Set(state.nodesById.keys());
  state.nodesById.clear();
  state.childrenByParent.clear();
  state.nodeIdByProviderAlias.clear();
  state.paths.clear();
  state.activeTarget = null;
  state.nextNodeId = 1;
  state.nextOrder = 1;
  return removed;
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
    || !node.hydrated;
}

function registerAliases(state: CanvasGraphState, node: GraphNode, snapshot: Pick<TurnSnapshot, 'promptKey' | 'responseKey'>): void {
  for (const alias of snapshotIdentityAliases(snapshot)) {
    const existing = state.nodeIdByProviderAlias.get(alias);
    if (existing === undefined || existing === node.id) {
      state.nodeIdByProviderAlias.set(alias, node.id);
      node.providerAliases.add(alias);
    }
  }
}

function updateNode(state: CanvasGraphState, node: GraphNode, snapshot: TurnSnapshot, target: string): boolean {
  const changed = contentChanged(node, snapshot);
  registerAliases(state, node, snapshot);
  const responseAlias = responseIdentity(snapshot);
  node.stableKey = responseAlias ?? node.stableKey ?? snapshotIdentityAliases(snapshot)[0] ?? null;
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
  return changed;
}

function createNode(state: CanvasGraphState, snapshot: TurnSnapshot, parentId: string | null, target: string): GraphNode {
  const parent = nodeById(state, parentId);
  const node: GraphNode = {
    ...snapshot,
    id: `turn-${state.nextNodeId++}`,
    parentId,
    depth: parent === null ? 0 : parent.depth + 1,
    order: state.nextOrder++,
    hydrated: true,
    targets: new Set([target]),
    providerAliases: new Set(),
  };
  state.nodesById.set(node.id, node);
  addChild(state, parentId, node.id);
  registerAliases(state, node, snapshot);
  node.stableKey = responseIdentity(snapshot) ?? snapshotIdentityAliases(snapshot)[0] ?? null;
  return node;
}

function reusableNodeForSnapshot(state: CanvasGraphState, snapshot: TurnSnapshot, parentId: string | null): GraphNode | null {
  for (const alias of snapshotIdentityAliases(snapshot)) {
    const id = state.nodeIdByProviderAlias.get(alias);
    if (id === undefined) continue;
    const node = nodeById(state, id);
    if (node !== null && node.parentId === parentId) return node;
  }
  return null;
}

export function reconcileGraph(state: CanvasGraphState, target: string, snapshots: readonly TurnSnapshot[]): ReconcileResult {
  const previousActiveTarget = state.activeTarget;
  const previousActivePath = previousActiveTarget === null ? undefined : state.paths.get(previousActiveTarget);
  const previousTargetPath = state.paths.get(target);
  let path = previousTargetPath;
  let topologyChanged = false;
  const changedNodeIds = new Set<string>();
  const addedNodeIds = new Set<string>();
  const removedNodeIds = new Set<string>();

  if (path === undefined) {
    if (previousActivePath !== undefined) {
      const prefixLength = commonPrefixLength(state, previousActivePath, snapshots);
      if (prefixLength > 0) path = previousActivePath.slice(0, prefixLength);
      else if (snapshots.length > 0) {
        for (const id of resetGraph(state)) removedNodeIds.add(id);
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
    addedNodeIds.add(node.id);
    nextPath.push(node.id);
    parentId = node.id;
    topologyChanged = true;
  }

  state.paths.set(target, nextPath);
  state.activeTarget = target;
  const activePathChanged = previousActiveTarget !== target || !samePath(previousTargetPath, nextPath);
  return { activePathIds: nextPath, changedNodeIds, addedNodeIds, removedNodeIds, topologyChanged, activePathChanged };
}

export function serializeGraphState(state: CanvasGraphState): PersistedGraphState {
  return {
    version: 2,
    nodes: graphNodes(state).map((node) => ({
      id: node.id,
      parentId: node.parentId,
      depth: node.depth,
      order: node.order,
      stableKey: node.stableKey,
      providerAliases: Array.from(node.providerAliases),
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
  if (value.version !== 2) return state;
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
      providerAliases: new Set(saved.providerAliases),
    };
    state.nodesById.set(node.id, node);
    addChild(state, node.parentId, node.id);
    for (const alias of node.providerAliases) state.nodeIdByProviderAlias.set(alias, node.id);
  }
  state.paths = new Map(value.paths.map(([target, path]) => [target, [...path]]));
  state.activeTarget = value.activeTarget;
  state.nextNodeId = Math.max(value.nextNodeId, value.nodes.length + 1);
  state.nextOrder = Math.max(value.nextOrder, value.nodes.length + 1);
  return state;
}
