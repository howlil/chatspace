import { ArrowRight, Maximize2, Network, Search, ZoomIn, ZoomOut } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { GraphNode, WorkspaceGraph } from '../../domain/graph/projectGraph';
import { cn } from '../../ui/cn';
import { Button, IconButton, SectionLabel, Select } from '../../ui/primitives';

interface GraphNavigatorProps {
  graph: WorkspaceGraph;
  onOpenNode: (node: GraphNode) => void;
  onCreateManualEdge: (sourceEntityId: string, targetEntityId: string) => void;
}

interface PositionedNode {
  node: GraphNode;
  x: number;
  y: number;
}

const CANVAS_WIDTH = 920;
const CANVAS_HEIGHT = 620;

function positionNodes(nodes: GraphNode[]): PositionedNode[] {
  if (nodes.length === 0) return [];
  const workspace = nodes.find((node) => node.kind === 'workspace') ?? nodes[0];
  const others = nodes.filter((node) => node.id !== workspace?.id);
  const centerX = CANVAS_WIDTH / 2;
  const centerY = CANVAS_HEIGHT / 2;
  const radius = Math.min(240, 120 + others.length * 12);
  const positioned: PositionedNode[] = workspace === undefined ? [] : [{ node: workspace, x: centerX, y: centerY }];

  others.forEach((node, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(1, others.length) - Math.PI / 2;
    positioned.push({
      node,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    });
  });
  return positioned;
}

function nodeKindClass(kind: GraphNode['kind']): string {
  if (kind === 'workspace') return 'border-white/25 bg-white/[0.10] text-cs-text';
  if (kind === 'folder') return 'border-blue-200/15 bg-blue-200/[0.045] text-blue-100/90';
  if (kind === 'chat') return 'border-emerald-200/15 bg-emerald-200/[0.045] text-emerald-100/90';
  return 'border-violet-200/15 bg-violet-200/[0.045] text-violet-100/90';
}

export function GraphNavigator({ graph, onOpenNode, onCreateManualEdge }: GraphNavigatorProps) {
  const [query, setQuery] = useState('');
  const [zoom, setZoom] = useState(1);
  const [selectedNodeId, setSelectedNodeId] = useState(graph.nodes[0]?.id ?? '');
  const entityNodes = graph.nodes.filter((node) => node.kind !== 'workspace');
  const [sourceEntityId, setSourceEntityId] = useState(entityNodes[0]?.entityId ?? '');
  const [targetEntityId, setTargetEntityId] = useState(entityNodes[1]?.entityId ?? '');
  const normalized = query.trim().toLowerCase();
  const positioned = useMemo(() => positionNodes(graph.nodes), [graph.nodes]);
  const positionById = useMemo(() => new Map(positioned.map((item) => [item.node.id, item])), [positioned]);
  const selectedNode = graph.nodes.find((node) => node.id === selectedNodeId) ?? graph.nodes[0];
  const selectedEdges = selectedNode === undefined ? [] : graph.edges.filter((edge) => edge.sourceId === selectedNode.id || edge.targetId === selectedNode.id);

  const visibleNodeIds = useMemo(() => {
    if (normalized === '') return new Set(graph.nodes.map((node) => node.id));
    return new Set(graph.nodes.filter((node) => node.label.toLowerCase().includes(normalized) || node.kind.includes(normalized)).map((node) => node.id));
  }, [graph.nodes, normalized]);

  return (
    <section className="grid h-full min-h-0 grid-rows-[38px_minmax(0,1fr)] bg-cs-bg" aria-label="Workspace graph">
      <header className="flex min-w-0 items-center gap-2 border-b border-white/[0.065] bg-cs-panel/70 px-2.5">
        <div className="relative min-w-0 flex-1 max-w-xs">
          <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-cs-subtle" size={11} aria-hidden="true" />
          <input
            className="h-7 w-full rounded-md border border-white/[0.08] bg-cs-bg pl-7 pr-2 text-[10px] text-cs-text outline-none placeholder:text-cs-subtle focus:border-white/20 focus:ring-1 focus:ring-white/15"
            aria-label="Search graph"
            placeholder="Find a node"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <span className="hidden shrink-0 text-[9px] text-cs-subtle min-[620px]:inline">
          {graph.nodes.length} nodes · {graph.edges.length} edges
        </span>
        <div className="ml-auto flex items-center gap-0.5" aria-label="Graph zoom controls">
          <IconButton aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(0.65, value - 0.1))}>
            <ZoomOut size={12} aria-hidden="true" />
          </IconButton>
          <IconButton aria-label="Reset graph view" onClick={() => setZoom(1)}>
            <Maximize2 size={12} aria-hidden="true" />
          </IconButton>
          <IconButton aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(1.6, value + 0.1))}>
            <ZoomIn size={12} aria-hidden="true" />
          </IconButton>
        </div>
      </header>

      <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_240px] max-[720px]:grid-cols-1 max-[720px]:grid-rows-[minmax(0,1fr)_auto]">
        <div
          className="relative min-h-0 overflow-auto bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.055)_1px,transparent_1px)] bg-[length:18px_18px]"
          role="application"
          aria-label="Spatial graph canvas"
        >
          <div
            className="relative origin-center transition-transform duration-150"
            style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, transform: `scale(${zoom})` }}
          >
            <svg className="pointer-events-none absolute inset-0 text-white/15" width={CANVAS_WIDTH} height={CANVAS_HEIGHT} aria-hidden="true">
              {graph.edges.map((edge) => {
                const source = positionById.get(edge.sourceId);
                const target = positionById.get(edge.targetId);
                if (source === undefined || target === undefined) return null;
                return <line className="stroke-current" strokeWidth="1" key={edge.id} x1={source.x} y1={source.y} x2={target.x} y2={target.y} />;
              })}
            </svg>
            {positioned.map(({ node, x, y }) => (
              <button
                type="button"
                key={node.id}
                data-kind={node.kind}
                data-selected={node.id === selectedNode?.id ? 'true' : 'false'}
                data-muted={visibleNodeIds.has(node.id) ? 'false' : 'true'}
                aria-label={`${node.kind} ${node.label}`}
                className={cn(
                  'absolute grid min-w-28 max-w-40 -translate-x-1/2 -translate-y-1/2 gap-0.5 rounded-lg border px-3 py-2 text-left shadow-lg outline-none transition-all duration-150 hover:brightness-125 focus-visible:ring-1 focus-visible:ring-white/40',
                  nodeKindClass(node.kind),
                  node.id === selectedNode?.id && 'ring-1 ring-white/40 shadow-[0_8px_30px_rgba(0,0,0,0.35)]',
                  !visibleNodeIds.has(node.id) && 'opacity-20',
                )}
                style={{ left: x, top: y }}
                onClick={() => setSelectedNodeId(node.id)}
                onDoubleClick={() => onOpenNode(node)}
              >
                <span className="text-[7px] font-semibold uppercase tracking-[0.14em] opacity-55">{node.kind}</span>
                <span className="truncate text-[10px] font-medium">{node.label}</span>
              </button>
            ))}
          </div>
        </div>

        <aside className="min-h-0 overflow-y-auto border-l border-white/[0.065] bg-cs-panel p-3 max-[720px]:max-h-56 max-[720px]:border-l-0 max-[720px]:border-t" aria-label="Graph selection details">
          {selectedNode === undefined ? (
            <div className="grid min-h-28 place-items-center text-[9px] text-cs-subtle">Select a node.</div>
          ) : (
            <>
              <div className="mb-3 grid gap-1">
                <SectionLabel>{selectedNode.kind}</SectionLabel>
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <strong className="min-w-0 truncate text-[12px] font-medium">{selectedNode.label}</strong>
                  <Button variant="ghost" className="h-6 px-1.5 text-[9px]" onClick={() => onOpenNode(selectedNode)}>
                    Open <ArrowRight size={10} aria-hidden="true" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-1">
                {selectedEdges.map((edge) => {
                  const otherId = edge.sourceId === selectedNode.id ? edge.targetId : edge.sourceId;
                  const other = graph.nodes.find((node) => node.id === otherId);
                  return (
                    <div key={edge.id} className="grid gap-0.5 rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-1.5">
                      <span className="text-[8px] text-cs-subtle">{edge.kind}</span>
                      <strong className="truncate text-[9px] font-medium text-cs-muted">{other?.label ?? otherId}</strong>
                      <small className="text-[8px] text-cs-subtle">{edge.provenance}</small>
                    </div>
                  );
                })}
                {selectedEdges.length === 0 && <p className="m-0 py-2 text-[9px] text-cs-subtle">No relationships yet.</p>}
              </div>
            </>
          )}

          {entityNodes.length >= 2 && (
            <form
              className="mt-4 grid gap-1.5 border-t border-white/[0.06] pt-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (sourceEntityId !== '' && targetEntityId !== '' && sourceEntityId !== targetEntityId) onCreateManualEdge(sourceEntityId, targetEntityId);
              }}
            >
              <div className="mb-0.5 flex items-center gap-1.5">
                <Network size={10} className="text-cs-subtle" aria-hidden="true" />
                <SectionLabel>Relate manually</SectionLabel>
              </div>
              <Select aria-label="Relationship source" value={sourceEntityId} onChange={(event) => setSourceEntityId(event.target.value)}>
                {entityNodes.map((node) => <option key={node.id} value={node.entityId}>{node.label}</option>)}
              </Select>
              <div className="text-center text-[9px] text-cs-subtle">↓</div>
              <Select aria-label="Relationship target" value={targetEntityId} onChange={(event) => setTargetEntityId(event.target.value)}>
                {entityNodes.map((node) => <option key={node.id} value={node.entityId}>{node.label}</option>)}
              </Select>
              <Button type="submit" disabled={sourceEntityId === targetEntityId}>Add relation</Button>
            </form>
          )}
        </aside>
      </div>
    </section>
  );
}
