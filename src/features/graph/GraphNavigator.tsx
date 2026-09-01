import { Link2, Maximize2, Network, Trash2, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

import type { GraphEdge, GraphNode, WorkspaceGraph } from '../../domain/graph/projectGraph';
import { cn } from '../../ui/cn';
import { Button, IconButton, SectionLabel } from '../../ui/primitives';
import { SearchField } from '../../ui/workspace';
import { directNeighborhood, edgeVisualWeight, layoutWorkspaceGraph, type PositionedGraphNode } from './graphLayout';

interface GraphNavigatorProps {
  graph: WorkspaceGraph;
  onOpenNode: (node: GraphNode) => void;
  onCreateManualEdge: (sourceEntityId: string, targetEntityId: string) => void;
  onDeleteManualEdge?: (edgeId: string) => void;
}

interface Point {
  x: number;
  y: number;
}

interface NodeDrag {
  nodeId: string;
  startClient: Point;
  startNode: Point;
}

interface CanvasPan {
  startClient: Point;
  startPan: Point;
}

const MIN_ZOOM = 0.55;
const MAX_ZOOM = 1.7;

function nodeKindClass(kind: GraphNode['kind']): string {
  if (kind === 'workspace') return 'border-cs-focus bg-cs-active text-cs-text';
  if (kind === 'folder') return 'border-cs-border bg-cs-raised text-cs-text';
  if (kind === 'chat') return 'border-cs-border bg-cs-surface text-cs-text';
  return 'border-cs-border bg-cs-control text-cs-text';
}

function edgeAppearance(edge: GraphEdge): { className: string; dash?: string; width: number } {
  const visual = edgeVisualWeight(edge);
  if (visual === 'reference') return { className: 'stroke-cs-focus', width: 1.6 };
  if (visual === 'manual') return { className: 'stroke-cs-muted', dash: '7 4', width: 1.5 };
  if (visual === 'derived') return { className: 'stroke-cs-subtle', dash: '2 5', width: 1.2 };
  return { className: 'stroke-cs-border', width: 1 };
}

function sameManualPair(graph: WorkspaceGraph, sourceEntityId: string, targetEntityId: string): boolean {
  const entityByNodeId = new Map(graph.nodes.map((node) => [node.id, node.entityId]));
  return graph.edges.some((edge) => {
    if (edge.provenance !== 'manual') return false;
    const source = entityByNodeId.get(edge.sourceId);
    const target = entityByNodeId.get(edge.targetId);
    return (source === sourceEntityId && target === targetEntityId) || (source === targetEntityId && target === sourceEntityId);
  });
}

export function GraphNavigator({ graph, onOpenNode, onCreateManualEdge, onDeleteManualEdge }: GraphNavigatorProps) {
  const [query, setQuery] = useState('');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState('');
  const [connectingFromEntityId, setConnectingFromEntityId] = useState<string | null>(null);
  const [manualPositions, setManualPositions] = useState<Record<string, Point>>({});
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const nodeDragRef = useRef<NodeDrag | null>(null);
  const canvasPanRef = useRef<CanvasPan | null>(null);

  const layout = useMemo(() => layoutWorkspaceGraph(graph), [graph]);
  const positioned = useMemo<PositionedGraphNode[]>(() => layout.nodes.map((item) => ({
    ...item,
    ...(manualPositions[item.node.id] ?? {}),
  })), [layout.nodes, manualPositions]);
  const positionById = useMemo(() => new Map(positioned.map((item) => [item.node.id, item])), [positioned]);
  const selectedNode = graph.nodes.find((node) => node.id === selectedNodeId);
  const selectedEdges = selectedNode === undefined
    ? []
    : graph.edges.filter((edge) => edge.sourceId === selectedNode.id || edge.targetId === selectedNode.id);
  const focusedNodeIds = useMemo(
    () => selectedNode === undefined ? new Set(graph.nodes.map((node) => node.id)) : directNeighborhood(graph, selectedNode.id),
    [graph, selectedNode],
  );
  const normalized = query.trim().toLowerCase();
  const searchMatches = useMemo(() => new Set(
    normalized === ''
      ? graph.nodes.map((node) => node.id)
      : graph.nodes
        .filter((node) => node.label.toLowerCase().includes(normalized) || node.kind.includes(normalized))
        .map((node) => node.id),
  ), [graph.nodes, normalized]);

  function centerNode(nodeId: string): void {
    const node = positionById.get(nodeId);
    const viewport = canvasRef.current?.getBoundingClientRect();
    if (node === undefined || viewport === undefined) return;
    setPan({
      x: viewport.width / 2 - node.x * zoom,
      y: viewport.height / 2 - node.y * zoom,
    });
  }

  function fitView(): void {
    const viewport = canvasRef.current?.getBoundingClientRect();
    if (viewport === undefined || viewport.width <= 0 || viewport.height <= 0) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }
    const nextZoom = Math.min(
      MAX_ZOOM,
      Math.max(MIN_ZOOM, Math.min((viewport.width - 32) / layout.width, (viewport.height - 32) / layout.height)),
    );
    setZoom(nextZoom);
    setPan({
      x: (viewport.width - layout.width * nextZoom) / 2,
      y: (viewport.height - layout.height * nextZoom) / 2,
    });
  }

  function selectNode(node: GraphNode): void {
    if (connectingFromEntityId !== null && node.kind !== 'workspace') {
      if (node.entityId !== connectingFromEntityId && !sameManualPair(graph, connectingFromEntityId, node.entityId)) {
        onCreateManualEdge(connectingFromEntityId, node.entityId);
      }
      setConnectingFromEntityId(null);
    }
    setSelectedNodeId(node.id);
  }

  function handleSearch(value: string): void {
    setQuery(value);
    const normalizedValue = value.trim().toLowerCase();
    if (normalizedValue === '') return;
    const match = graph.nodes.find((node) => node.label.toLowerCase().includes(normalizedValue) || node.kind.includes(normalizedValue));
    if (match === undefined) return;
    setSelectedNodeId(match.id);
    window.requestAnimationFrame(() => centerNode(match.id));
  }

  function beginCanvasPan(event: ReactPointerEvent<HTMLDivElement>): void {
    if (event.button !== 0) return;
    const target = event.target as Element;
    if (target.closest('[data-graph-node="true"]') !== null) return;
    canvasPanRef.current = {
      startClient: { x: event.clientX, y: event.clientY },
      startPan: pan,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveCanvas(event: ReactPointerEvent<HTMLDivElement>): void {
    const drag = canvasPanRef.current;
    if (drag === null) return;
    setPan({
      x: drag.startPan.x + event.clientX - drag.startClient.x,
      y: drag.startPan.y + event.clientY - drag.startClient.y,
    });
  }

  function endCanvasPan(event: ReactPointerEvent<HTMLDivElement>): void {
    if (canvasPanRef.current === null) return;
    canvasPanRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function beginNodeDrag(event: ReactPointerEvent<HTMLButtonElement>, item: PositionedGraphNode): void {
    if (event.button !== 0) return;
    event.stopPropagation();
    nodeDragRef.current = {
      nodeId: item.node.id,
      startClient: { x: event.clientX, y: event.clientY },
      startNode: { x: item.x, y: item.y },
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    selectNode(item.node);
  }

  function moveNode(event: ReactPointerEvent<HTMLButtonElement>): void {
    const drag = nodeDragRef.current;
    if (drag === null) return;
    event.stopPropagation();
    setManualPositions((current) => ({
      ...current,
      [drag.nodeId]: {
        x: drag.startNode.x + (event.clientX - drag.startClient.x) / zoom,
        y: drag.startNode.y + (event.clientY - drag.startClient.y) / zoom,
      },
    }));
  }

  function endNodeDrag(event: ReactPointerEvent<HTMLButtonElement>): void {
    if (nodeDragRef.current === null) return;
    event.stopPropagation();
    nodeDragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <section className="grid h-full min-h-0 grid-rows-[38px_minmax(0,1fr)] bg-cs-bg" aria-label="Workspace graph">
      <header className="flex min-w-0 items-center gap-2 border-b border-cs-border bg-cs-panel/70 px-2.5">
        <SearchField
          className="min-w-0 max-w-xs flex-1"
          aria-label="Search graph"
          placeholder="Find and focus a node"
          value={query}
          onValueChange={handleSearch}
        />
        <span className="hidden shrink-0 text-[9px] text-cs-subtle min-[620px]:inline">
          {graph.nodes.length} nodes · {graph.edges.length} edges
        </span>
        <div className="ml-auto flex items-center gap-0.5" aria-label="Graph zoom controls">
          <IconButton aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(MIN_ZOOM, value - 0.1))}>
            <ZoomOut size={12} aria-hidden="true" />
          </IconButton>
          <IconButton aria-label="Fit graph view" onClick={fitView}>
            <Maximize2 size={12} aria-hidden="true" />
          </IconButton>
          <IconButton aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(MAX_ZOOM, value + 0.1))}>
            <ZoomIn size={12} aria-hidden="true" />
          </IconButton>
        </div>
      </header>

      <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_240px] max-[720px]:grid-cols-1 max-[720px]:grid-rows-[minmax(0,1fr)_auto]">
        <div
          ref={canvasRef}
          className="relative min-h-0 cursor-grab overflow-hidden bg-[radial-gradient(circle_at_center,color-mix(in_srgb,var(--color-cs-border)_55%,transparent)_1px,transparent_1px)] bg-[length:18px_18px] active:cursor-grabbing"
          role="application"
          aria-label="Spatial graph canvas"
          onPointerDown={beginCanvasPan}
          onPointerMove={moveCanvas}
          onPointerUp={endCanvasPan}
          onPointerCancel={endCanvasPan}
        >
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={{ width: layout.width, height: layout.height, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          >
            <svg className="pointer-events-none absolute inset-0" width={layout.width} height={layout.height} aria-hidden="true">
              {graph.edges.map((edge) => {
                const source = positionById.get(edge.sourceId);
                const target = positionById.get(edge.targetId);
                if (source === undefined || target === undefined) return null;
                const appearance = edgeAppearance(edge);
                const emphasized = selectedNode === undefined || edge.sourceId === selectedNode.id || edge.targetId === selectedNode.id;
                return (
                  <line
                    className={cn(appearance.className, !emphasized && 'opacity-15')}
                    strokeWidth={appearance.width}
                    strokeDasharray={appearance.dash}
                    key={edge.id}
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                  />
                );
              })}
            </svg>
            {positioned.map((item) => {
              const { node, x, y } = item;
              const inFocus = focusedNodeIds.has(node.id);
              const searchVisible = normalized === '' || searchMatches.has(node.id) || inFocus;
              return (
                <button
                  type="button"
                  key={node.id}
                  data-graph-node="true"
                  data-kind={node.kind}
                  data-selected={node.id === selectedNode?.id ? 'true' : 'false'}
                  data-muted={inFocus && searchVisible ? 'false' : 'true'}
                  aria-label={`${node.kind} ${node.label}`}
                  className={cn(
                    'absolute grid min-w-28 max-w-40 -translate-x-1/2 -translate-y-1/2 touch-none gap-0.5 rounded-lg border px-3 py-2 text-left shadow-lg outline-none transition-[opacity,filter,box-shadow] duration-150 hover:brightness-105 focus-visible:ring-1 focus-visible:ring-cs-focus/50',
                    nodeKindClass(node.kind),
                    node.id === selectedNode?.id && 'ring-2 ring-cs-focus/60 shadow-[0_8px_30px_rgba(0,0,0,0.25)]',
                    (!inFocus || !searchVisible) && 'opacity-20',
                    connectingFromEntityId !== null && node.kind !== 'workspace' && node.entityId !== connectingFromEntityId && 'cursor-crosshair',
                  )}
                  style={{ left: x, top: y }}
                  onClick={() => selectNode(node)}
                  onDoubleClick={() => onOpenNode(node)}
                  onPointerDown={(event) => beginNodeDrag(event, item)}
                  onPointerMove={moveNode}
                  onPointerUp={endNodeDrag}
                  onPointerCancel={endNodeDrag}
                >
                  <span className="text-[7px] font-semibold uppercase tracking-[0.14em] opacity-55">{node.kind}</span>
                  <span className="truncate text-[10px] font-medium">{node.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="min-h-0 overflow-y-auto border-l border-cs-border bg-cs-panel p-3 max-[720px]:max-h-60 max-[720px]:border-l-0 max-[720px]:border-t" aria-label="Graph selection details">
          {selectedNode === undefined ? (
            <div className="grid min-h-28 place-items-center gap-1 text-center text-[9px] text-cs-subtle">
              <Network size={16} aria-hidden="true" />
              <span>Select a node to focus its relationships.</span>
            </div>
          ) : (
            <>
              <div className="mb-3 grid gap-1.5">
                <SectionLabel>{selectedNode.kind}</SectionLabel>
                <strong className="min-w-0 truncate text-[12px] font-medium">{selectedNode.label}</strong>
                <div className="flex flex-wrap gap-1">
                  <Button variant="ghost" className="h-6 px-1.5 text-[9px]" onClick={() => onOpenNode(selectedNode)}>Open</Button>
                  {selectedNode.kind !== 'workspace' && connectingFromEntityId === null && (
                    <Button variant="ghost" className="h-6 px-1.5 text-[9px]" onClick={() => setConnectingFromEntityId(selectedNode.entityId)}>
                      <Link2 size={10} aria-hidden="true" /> Connect
                    </Button>
                  )}
                  {connectingFromEntityId !== null && (
                    <Button variant="ghost" className="h-6 px-1.5 text-[9px]" onClick={() => setConnectingFromEntityId(null)}>
                      <X size={10} aria-hidden="true" /> Cancel
                    </Button>
                  )}
                </div>
                {connectingFromEntityId !== null && (
                  <p className="m-0 text-[8px] leading-4 text-cs-muted">Choose another node on the canvas to create a manual relation.</p>
                )}
              </div>

              <div className="grid gap-1">
                <SectionLabel>Relationships</SectionLabel>
                {selectedEdges.map((edge) => {
                  const otherId = edge.sourceId === selectedNode.id ? edge.targetId : edge.sourceId;
                  const other = graph.nodes.find((node) => node.id === otherId);
                  return (
                    <div key={edge.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1 rounded-md border border-cs-border bg-cs-control px-2 py-1.5">
                      <button
                        type="button"
                        className="grid min-w-0 gap-0.5 text-left outline-none focus-visible:ring-1 focus-visible:ring-cs-focus/50"
                        onClick={() => {
                          if (other === undefined) return;
                          setSelectedNodeId(other.id);
                          window.requestAnimationFrame(() => centerNode(other.id));
                        }}
                      >
                        <span className="text-[8px] text-cs-subtle">{edge.kind}</span>
                        <strong className="truncate text-[9px] font-medium text-cs-muted">{other?.label ?? otherId}</strong>
                        <small className="text-[8px] text-cs-subtle">{edge.provenance}</small>
                      </button>
                      {edge.provenance === 'manual' && onDeleteManualEdge !== undefined && (
                        <IconButton aria-label={`Delete manual relation with ${other?.label ?? otherId}`} onClick={() => onDeleteManualEdge(edge.id)}>
                          <Trash2 size={10} aria-hidden="true" />
                        </IconButton>
                      )}
                    </div>
                  );
                })}
                {selectedEdges.length === 0 && <p className="m-0 py-2 text-[9px] text-cs-subtle">No relationships yet.</p>}
              </div>

              <div className="mt-4 grid gap-1 border-t border-cs-border pt-3 text-[8px] text-cs-subtle" aria-label="Graph relationship legend">
                <span><strong className="font-medium text-cs-muted">contains</strong> · hierarchy</span>
                <span><strong className="font-medium text-cs-muted">references</strong> · explicit note → chat</span>
                <span><strong className="font-medium text-cs-muted">related-manually</strong> · user-created</span>
                <span><strong className="font-medium text-cs-muted">related-local</strong> · locally derived</span>
              </div>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
