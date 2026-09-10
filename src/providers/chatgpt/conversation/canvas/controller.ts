import { normalizeChatGptTarget } from '../../adapter';
import {
  CANVAS_ID,
  STYLE_ID,
  clearNativeSources,
  collectTurnSnapshots,
  markNativeSources,
  providerAliasFromMutationTarget,
  safeInnerHtml,
  snapshotFromNodeSources,
} from './dom';
import {
  createGraphState,
  nodeById,
  reconcileGraph,
  refreshKnownNode,
  type CanvasGraphState,
} from './graphEngine';
import { computeLayeredLayout, mergeStableLayout } from './layout';
import { loadGraphForTarget, persistGraphStructure } from './persistence';
import {
  patchCards,
  renderChrome,
  renderComposerDock,
  renderEdges,
  renderInspector,
  renderMinimap,
  renderSelection,
  updateConnectedEdges,
  updateMinimapViewport,
  type HtmlSnapshot,
  type RenderContext,
} from './renderer';
import { CANVAS_CSS } from './styles';
import {
  applyViewport,
  centerNode,
  createViewState,
  fitGraph,
  preserveNodeAnchor,
  setupViewportInteractions,
  zoomAround,
  type CanvasViewState,
} from './viewport';

const REFRESH_DELAY_MS = 80;

export interface TurnCardController {
  refresh(): void;
  disconnect(): void;
}

function ensureStyles(doc: Document): void {
  if (doc.getElementById(STYLE_ID) !== null) return;
  const style = doc.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CANVAS_CSS;
  (doc.head ?? doc.documentElement).append(style);
}

function ensureCanvas(doc: Document): HTMLElement | null {
  const existing = doc.getElementById(CANVAS_ID);
  if (existing instanceof HTMLElement) {
    doc.documentElement.setAttribute('data-chatspace-canvas-active', 'true');
    return existing;
  }
  const host = doc.querySelector<HTMLElement>('main') ?? doc.body;
  if (host === null) return null;

  const canvas = doc.createElement('section');
  canvas.id = CANVAS_ID;
  canvas.setAttribute('aria-label', 'Chatspace conversation canvas');
  canvas.setAttribute('data-chatspace-zoom-level', 'near');

  const viewport = doc.createElement('div');
  viewport.setAttribute('data-chatspace-viewport', 'true');
  const scene = doc.createElement('div');
  scene.setAttribute('data-chatspace-scene', 'true');
  const edges = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
  edges.setAttribute('data-chatspace-edges', 'true');
  edges.setAttribute('aria-hidden', 'true');
  scene.append(edges);
  viewport.append(scene);

  const toolbar = doc.createElement('div');
  toolbar.setAttribute('data-chatspace-toolbar', 'true');
  const minimap = doc.createElement('div');
  minimap.setAttribute('data-chatspace-minimap', 'true');
  const inspector = doc.createElement('aside');
  inspector.setAttribute('data-chatspace-inspector', 'true');
  inspector.setAttribute('data-chatspace-open', 'false');
  inspector.setAttribute('aria-label', 'Selected turn details');
  const dock = doc.createElement('div');
  dock.setAttribute('data-chatspace-composer-dock', 'true');

  canvas.append(viewport, toolbar, minimap, inspector, dock);
  host.prepend(canvas);
  doc.documentElement.setAttribute('data-chatspace-canvas-active', 'true');
  return canvas;
}

function cleanupView(doc: Document): void {
  clearNativeSources(doc);
  doc.getElementById(CANVAS_ID)?.remove();
  doc.documentElement.removeAttribute('data-chatspace-canvas-active');
}

function hydrateHtml(doc: Document, state: CanvasGraphState, cache: Map<string, HtmlSnapshot>, nodeIds: Iterable<string>): void {
  for (const nodeId of nodeIds) {
    const node = nodeById(state, nodeId);
    if (node === null) continue;
    cache.set(node.id, {
      prompt: safeInnerHtml(node.promptSource, doc),
      response: safeInnerHtml(node.responseSource, doc),
    });
  }
}

function createRenderContext(
  doc: Document,
  canvas: HTMLElement,
  state: CanvasGraphState,
  view: CanvasViewState,
  activePathIds: readonly string[],
  htmlCache: Map<string, HtmlSnapshot>,
): RenderContext {
  const ctx: RenderContext = {
    doc,
    canvas,
    state,
    view,
    activePathIds,
    htmlCache,
    centerNode(nodeId) {
      view.followLatest = false;
      centerNode(canvas, state, view, nodeId);
      updateMinimapViewport(ctx);
    },
    fitGraph() {
      fitGraph(canvas, state, view);
      updateMinimapViewport(ctx);
    },
    zoomBy(factor) {
      const viewport = canvas.querySelector<HTMLElement>('[data-chatspace-viewport]');
      if (viewport === null) return;
      const rect = viewport.getBoundingClientRect();
      zoomAround(canvas, view, rect.left + rect.width / 2, rect.top + rect.height / 2, view.zoom * factor);
      updateMinimapViewport(ctx);
    },
    arrangeGraph() {
      view.positions = computeLayeredLayout(state);
      view.followLatest = false;
      patchCards(ctx, new Set(), new Set(), new Set());
      renderEdges(ctx);
      renderMinimap(ctx);
      fitGraph(canvas, state, view);
      updateMinimapViewport(ctx);
    },
  };
  return ctx;
}

function renderTopology(
  doc: Document,
  state: CanvasGraphState,
  view: CanvasViewState,
  htmlCache: Map<string, HtmlSnapshot>,
  activePathIds: readonly string[],
  changedNodeIds: ReadonlySet<string>,
  addedNodeIds: ReadonlySet<string>,
  removedNodeIds: ReadonlySet<string>,
  firstRender: boolean,
): HTMLElement | null {
  const canvas = ensureCanvas(doc);
  if (canvas === null) return null;
  const anchorId = view.selectedNodeId ?? activePathIds[activePathIds.length - 1] ?? null;
  const computedPositions = computeLayeredLayout(state);
  const nextPositions = firstRender || view.positions.size === 0
    ? computedPositions
    : mergeStableLayout(state, view.positions, computedPositions);
  if (firstRender || view.positions.size === 0) view.positions = nextPositions;
  else preserveNodeAnchor(state, view, nextPositions, anchorId);
  if (view.selectedNodeId === null) view.selectedNodeId = activePathIds[activePathIds.length - 1] ?? null;

  const ctx = createRenderContext(doc, canvas, state, view, activePathIds, htmlCache);
  patchCards(ctx, changedNodeIds, addedNodeIds, removedNodeIds);
  renderEdges(ctx);
  renderChrome(ctx);
  setupViewportInteractions(canvas, state, view, {
    onViewChange: () => updateMinimapViewport(ctx),
    onNodeMove: (nodeId) => updateConnectedEdges(ctx, nodeId),
    onNodeMoveEnd: () => {
      renderEdges(ctx);
      renderMinimap(ctx);
    },
    onArrange: ctx.arrangeGraph,
  });
  applyViewport(canvas, view);
  return canvas;
}

function renderContentChanges(
  doc: Document,
  state: CanvasGraphState,
  view: CanvasViewState,
  htmlCache: Map<string, HtmlSnapshot>,
  activePathIds: readonly string[],
  changedNodeIds: ReadonlySet<string>,
): void {
  const canvas = doc.getElementById(CANVAS_ID);
  if (!(canvas instanceof HTMLElement)) return;
  const ctx = createRenderContext(doc, canvas, state, view, activePathIds, htmlCache);
  patchCards(ctx, changedNodeIds, new Set(), new Set());
  if (view.selectedNodeId !== null && changedNodeIds.has(view.selectedNodeId)) renderInspector(ctx, false);
  renderComposerDock(ctx);
}

function runFullRefresh(
  root: ParentNode,
  state: CanvasGraphState,
  view: CanvasViewState,
  htmlCache: Map<string, HtmlSnapshot>,
  target: string,
  hasRendered: boolean,
): { responses: HTMLElement[]; nodeCount: number; activePathIds: string[]; topologyRendered: boolean } {
  const doc = root instanceof Document ? root : root.ownerDocument ?? document;
  const snapshots = collectTurnSnapshots(root, doc);
  if (snapshots.length === 0) {
    cleanupView(doc);
    return { responses: [], nodeCount: 0, activePathIds: [], topologyRendered: false };
  }

  const result = reconcileGraph(state, target, snapshots);
  hydrateHtml(doc, state, htmlCache, result.changedNodeIds);
  const needsTopologyRender = !hasRendered || result.topologyChanged || result.activePathChanged;
  let canvas: HTMLElement | null = null;
  if (needsTopologyRender) {
    canvas = renderTopology(
      doc,
      state,
      view,
      htmlCache,
      result.activePathIds,
      result.changedNodeIds,
      result.addedNodeIds,
      result.removedNodeIds,
      !hasRendered,
    );
  } else if (result.changedNodeIds.size > 0) {
    renderContentChanges(doc, state, view, htmlCache, result.activePathIds, result.changedNodeIds);
    canvas = doc.getElementById(CANVAS_ID) as HTMLElement | null;
  } else {
    canvas = doc.getElementById(CANVAS_ID) as HTMLElement | null;
  }

  if (canvas !== null && state.nodesById.size > 0) markNativeSources(doc, snapshots);
  else clearNativeSources(doc);
  return {
    responses: snapshots.flatMap((snapshot) => snapshot.responseSource === null ? [] : [snapshot.responseSource]),
    nodeCount: state.nodesById.size,
    activePathIds: [...result.activePathIds],
    topologyRendered: needsTopologyRender && canvas !== null,
  };
}

export function refreshChatGptTurnCards(root: ParentNode = document): HTMLElement[] {
  const doc = root instanceof Document ? root : root.ownerDocument ?? document;
  ensureStyles(doc);
  const state = createGraphState();
  const view = createViewState();
  const htmlCache = new Map<string, HtmlSnapshot>();
  return runFullRefresh(root, state, view, htmlCache, 'chatspace://current', false).responses;
}

export function mountChatGptTurnCards(options: {
  doc?: Document;
  getHref?: () => string;
  persist?: boolean;
} = {}): TurnCardController {
  const doc = options.doc ?? document;
  const viewWindow = doc.defaultView ?? window;
  const getHref = options.getHref ?? (() => viewWindow.location.href);
  const persist = options.persist ?? options.doc === undefined;
  let state = createGraphState();
  const view = createViewState();
  const htmlCache = new Map<string, HtmlSnapshot>();
  let timer: number | undefined;
  let hasRendered = false;
  let ready = !persist;
  let lastNodeCount = 0;
  let lastActivePathIds: string[] = [];
  const pendingKnownNodeIds = new Set<string>();
  let fullRefreshPending = false;

  const fullRefresh = () => {
    const target = normalizeChatGptTarget(getHref());
    if (target === null) {
      cleanupView(doc);
      hasRendered = false;
      lastNodeCount = 0;
      return;
    }
    ensureStyles(doc);
    const result = runFullRefresh(doc, state, view, htmlCache, target, hasRendered);
    const previousCount = lastNodeCount;
    hasRendered = result.nodeCount > 0;
    lastActivePathIds = result.activePathIds;
    lastNodeCount = result.nodeCount;

    if (result.nodeCount > previousCount) {
      const canvas = doc.getElementById(CANVAS_ID);
      const latest = result.activePathIds[result.activePathIds.length - 1] ?? null;
      if (canvas instanceof HTMLElement && latest !== null && view.followLatest) {
        view.selectedNodeId = latest;
        const ctx = createRenderContext(doc, canvas, state, view, result.activePathIds, htmlCache);
        if (previousCount === 0) {
          fitGraph(canvas, state, view);
          view.followLatest = true;
        } else centerNode(canvas, state, view, latest);
        renderSelection(ctx);
        renderInspector(ctx, false);
        renderMinimap(ctx);
        renderComposerDock(ctx);
      }
    }
    if (persist && result.topologyRendered && result.activePathIds.length > 0) void persistGraphStructure(state, result.activePathIds);
  };

  const refreshKnownNodes = () => {
    const target = normalizeChatGptTarget(getHref());
    if (target === null || state.activeTarget !== target || !hasRendered) {
      fullRefresh();
      return;
    }
    const activePathIds = state.paths.get(target) ?? [];
    const changed = new Set<string>();
    for (const nodeId of pendingKnownNodeIds) {
      const node = nodeById(state, nodeId);
      if (node === null) {
        fullRefreshPending = true;
        break;
      }
      const snapshot = snapshotFromNodeSources(node);
      if (snapshot === null) {
        fullRefreshPending = true;
        break;
      }
      const before = node.signature;
      const beforeStreaming = node.streaming;
      if (!refreshKnownNode(state, target, nodeId, snapshot)) {
        fullRefreshPending = true;
        break;
      }
      if (before !== node.signature || beforeStreaming !== node.streaming) changed.add(nodeId);
    }
    pendingKnownNodeIds.clear();
    if (fullRefreshPending) {
      fullRefreshPending = false;
      fullRefresh();
      return;
    }
    if (changed.size === 0) return;
    hydrateHtml(doc, state, htmlCache, changed);
    renderContentChanges(doc, state, view, htmlCache, activePathIds, changed);
  };

  const flush = () => {
    timer = undefined;
    if (!ready) return;
    if (fullRefreshPending) {
      fullRefreshPending = false;
      pendingKnownNodeIds.clear();
      fullRefresh();
    } else refreshKnownNodes();
  };

  const schedule = () => {
    if (!ready || timer !== undefined) return;
    timer = viewWindow.setTimeout(flush, REFRESH_DELAY_MS);
  };

  const Observer = viewWindow.MutationObserver ?? MutationObserver;
  const observer = new Observer((records) => {
    const canvas = doc.getElementById(CANVAS_ID);
    for (const record of records) {
      if (canvas !== null && canvas.contains(record.target)) continue;
      const alias = providerAliasFromMutationTarget(record.target);
      const nodeId = alias === null ? undefined : state.nodeIdByProviderAlias.get(alias);
      if (nodeId === undefined) {
        fullRefreshPending = true;
        break;
      }
      pendingKnownNodeIds.add(nodeId);
    }
    schedule();
  });
  observer.observe(doc.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['data-message-author-role', 'data-message-id', 'aria-busy', 'data-is-streaming'],
  });

  const start = async () => {
    if (persist) {
      const initialTarget = normalizeChatGptTarget(getHref());
      if (initialTarget !== null) {
        const restored = await loadGraphForTarget(initialTarget);
        if (restored !== null) state = restored;
      }
    }
    ready = true;
    fullRefresh();
  };
  void start();

  return {
    refresh() {
      if (!ready) return;
      fullRefreshPending = false;
      pendingKnownNodeIds.clear();
      fullRefresh();
    },
    disconnect() {
      observer.disconnect();
      if (timer !== undefined) viewWindow.clearTimeout(timer);
      if (persist && lastActivePathIds.length > 0) void persistGraphStructure(state, lastActivePathIds);
      cleanupView(doc);
      doc.getElementById(STYLE_ID)?.remove();
    },
  };
}
