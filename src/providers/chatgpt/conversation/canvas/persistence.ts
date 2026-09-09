import { browser } from 'wxt/browser';

import {
  graphNodes,
  nodeById,
  restoreGraphState,
  serializeGraphState,
  type CanvasGraphState,
  type PersistedGraphState,
} from './graphEngine';

const CACHE_KEY = 'chatspace.conversationGraph.v1';
const MAX_FAMILIES = 12;

interface CachedFamily {
  graph: PersistedGraphState;
  updatedAt: number;
}

interface GraphCache {
  version: 1;
  families: Record<string, CachedFamily>;
  targetToFamily: Record<string, string>;
}

function emptyCache(): GraphCache {
  return { version: 1, families: {}, targetToFamily: {} };
}

function asCache(value: unknown): GraphCache {
  if (typeof value !== 'object' || value === null) return emptyCache();
  const candidate = value as Partial<GraphCache>;
  if (candidate.version !== 1 || typeof candidate.families !== 'object' || typeof candidate.targetToFamily !== 'object') {
    return emptyCache();
  }
  return candidate as GraphCache;
}

async function readCache(): Promise<GraphCache> {
  try {
    const result = await browser.storage.local.get(CACHE_KEY) as Record<string, unknown>;
    return asCache(result[CACHE_KEY]);
  } catch {
    return emptyCache();
  }
}

function prune(cache: GraphCache): void {
  const entries = Object.entries(cache.families).sort((a, b) => b[1].updatedAt - a[1].updatedAt);
  const keep = new Set(entries.slice(0, MAX_FAMILIES).map(([familyId]) => familyId));
  for (const familyId of Object.keys(cache.families)) {
    if (!keep.has(familyId)) delete cache.families[familyId];
  }
  for (const [target, familyId] of Object.entries(cache.targetToFamily)) {
    if (!keep.has(familyId)) delete cache.targetToFamily[target];
  }
}

export async function loadGraphForTarget(target: string): Promise<CanvasGraphState | null> {
  const cache = await readCache();
  const familyId = cache.targetToFamily[target];
  if (familyId === undefined) return null;
  const family = cache.families[familyId];
  if (family === undefined || family.graph.version !== 1) return null;
  return restoreGraphState(family.graph);
}

export async function persistGraphStructure(
  state: CanvasGraphState,
  activePathIds: readonly string[],
): Promise<void> {
  const rootId = activePathIds[0];
  if (rootId === undefined) return;
  const root = nodeById(state, rootId);
  if (root?.stableKey === null || root?.stableKey === undefined) return;

  // Text fallback is safe for live reconciliation, but not durable identity.
  // Persist only families whose nodes can be matched deterministically after reload.
  if (graphNodes(state).some((node) => node.stableKey === null)) return;

  const familyId = root.stableKey;
  const cache = await readCache();
  cache.families[familyId] = {
    graph: serializeGraphState(state),
    updatedAt: Date.now(),
  };
  for (const target of state.paths.keys()) cache.targetToFamily[target] = familyId;
  prune(cache);
  try {
    await browser.storage.local.set({ [CACHE_KEY]: cache });
  } catch {
    // Persistence is an optimization. Provider rendering must continue if storage is unavailable.
  }
}
