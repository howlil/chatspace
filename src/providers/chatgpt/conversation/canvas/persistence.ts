import { browser } from 'wxt/browser';

import {
  graphNodes,
  nodeById,
  restoreGraphState,
  serializeGraphState,
  type CanvasGraphState,
  type PersistedGraphState,
} from './graphEngine';

const FAMILY_PREFIX = 'chatspace.graph.family.v2:';
const TARGET_PREFIX = 'chatspace.graph.target.v2:';

interface StoredFamily {
  version: 2;
  graph: PersistedGraphState;
  updatedAt: number;
}

function familyKey(familyId: string): string {
  return `${FAMILY_PREFIX}${familyId}`;
}

function targetKey(target: string): string {
  return `${TARGET_PREFIX}${encodeURIComponent(target)}`;
}

function asStoredFamily(value: unknown): StoredFamily | null {
  if (typeof value !== 'object' || value === null) return null;
  const candidate = value as Partial<StoredFamily>;
  if (candidate.version !== 2 || candidate.graph?.version !== 2 || typeof candidate.updatedAt !== 'number') return null;
  return candidate as StoredFamily;
}

export async function loadGraphForTarget(target: string): Promise<CanvasGraphState | null> {
  try {
    const targetStorageKey = targetKey(target);
    const targetResult = await browser.storage.local.get(targetStorageKey) as Record<string, unknown>;
    const familyId = targetResult[targetStorageKey];
    if (typeof familyId !== 'string' || familyId === '') return null;
    const graphStorageKey = familyKey(familyId);
    const graphResult = await browser.storage.local.get(graphStorageKey) as Record<string, unknown>;
    const family = asStoredFamily(graphResult[graphStorageKey]);
    return family === null ? null : restoreGraphState(family.graph);
  } catch {
    return null;
  }
}

export async function persistGraphStructure(
  state: CanvasGraphState,
  activePathIds: readonly string[],
): Promise<void> {
  const rootId = activePathIds[0];
  if (rootId === undefined) return;
  const root = nodeById(state, rootId);
  if (root === null || root.providerAliases.size === 0) return;

  // Text fallback is useful in one live session but is not durable identity.
  if (graphNodes(state).some((node) => node.providerAliases.size === 0)) return;

  // The prompt id exists before the assistant response, so prefer it as the
  // stable family key across the pending -> completed lifecycle.
  const familyId = Array.from(root.providerAliases).find((alias) => alias.startsWith('user:'))
    ?? root.stableKey
    ?? Array.from(root.providerAliases)[0];
  if (familyId === undefined) return;

  const values: Record<string, unknown> = {
    [familyKey(familyId)]: {
      version: 2,
      graph: serializeGraphState(state),
      updatedAt: Date.now(),
    } satisfies StoredFamily,
  };
  for (const target of state.paths.keys()) values[targetKey(target)] = familyId;

  try {
    // Per-family and per-target keys avoid read-modify-write clobber when
    // multiple ChatGPT tabs persist unrelated graphs concurrently.
    await browser.storage.local.set(values);
  } catch {
    // Persistence is optional. Provider rendering must continue if storage fails.
  }
}
