import { Maximize2, Search, ZoomIn, ZoomOut } from 'lucide-react';
import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

import { focusConversationGraph, searchConversation } from '../../domain/conversation/selectors';
import type { ConversationAnnotation, ConversationGraph as ConversationGraphModel, ConversationSnapshot } from '../../domain/conversation/model';
import { Button, IconButton, Input } from '../../ui/primitives';
import { ConversationInspector } from './ConversationInspector';
import { ConversationNode } from './ConversationNode';
import { ConversationOutline } from './ConversationOutline';
import { layoutConversationGraph } from './conversationLayout';

export function ConversationGraph({
  snapshot,
  graph,
  annotations,
  activeSourceId,
  onGoToSource,
  onUpdateAnnotation,
}: {
  snapshot: ConversationSnapshot;
  graph: ConversationGraphModel;
  annotations: ConversationAnnotation[];
  activeSourceId: string | null;
  onGoToSource: (sourceId: string) => void;
  onUpdateAnnotation: (sourceKey: string, patch: { note?: string; pinned?: boolean }) => void;
}) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panRef = useRef<{ clientX: number; clientY: number; startX: number; startY: number } | null>(null);
  const [outline, setOutline] = useState(false);
  const layout = useMemo(() => layoutConversationGraph(graph), [graph]);
  const searchMatches = useMemo(() => searchConversation(snapshot, graph, query), [graph, query, snapshot]);
  const focusedIds = useMemo(() => focusConversationGraph(graph, selectedId), [graph, selectedId]);
  const positions = layout.positions;
  const sourceNode = useMemo(() => {
    if (activeSourceId === null) return undefined;
    return graph.nodes.find((node) => node.kind === 'turn' && node.sourceIds.includes(activeSourceId)) ?? graph.nodes.find((node) => node.sourceIds.includes(activeSourceId));
  }, [activeSourceId, graph.nodes]);
  const effectiveSelectedId = graph.nodes.some((node) => node.id === selectedId) ? selectedId : sourceNode?.id;
  const selectedNode = graph.nodes.find((node) => node.id === effectiveSelectedId);
  const selectedAnnotation = selectedNode?.sourceIds.map((sourceId) => annotations.find((item) => item.sourceKey === sourceId)).find((item) => item !== undefined);
  const selectedTurnId = selectedNode?.turnId;

  function selectNode(nodeId: string): void {
    setSelectedId(nodeId);
  }

  function selectTurn(turnId: string): void {
    const node = graph.nodes.find((item) => item.turnId === turnId);
    if (node !== undefined) setSelectedId(node.id);
  }

  function toggleCollapse(turnId: string): void {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(turnId)) next.delete(turnId); else next.add(turnId);
      return next;
    });
  }

  function startPan(event: ReactPointerEvent<HTMLDivElement>): void {
    if (event.button !== 0 || (event.target as Element).closest('[data-conversation-node="true"]') !== null) return;
    panRef.current = { clientX: event.clientX, clientY: event.clientY, startX: pan.x, startY: pan.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function movePan(event: ReactPointerEvent<HTMLDivElement>): void {
    const start = panRef.current;
    if (start === null) return;
    setPan({ x: start.startX + event.clientX - start.clientX, y: start.startY + event.clientY - start.clientY });
  }

  function endPan(event: ReactPointerEvent<HTMLDivElement>): void {
    panRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <section className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] bg-cs-bg" aria-label="Conversation map">
      <header className="flex min-w-0 flex-wrap items-center gap-1.5 border-b border-cs-border bg-cs-panel/70 px-2.5 py-1.5">
        <div className="relative min-w-36 flex-1">
          <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-cs-subtle" size={12} aria-hidden="true" />
          <Input className="h-7 w-full pl-7 text-[10px]" aria-label="Search conversation" placeholder="Search this conversation…" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <span className="px-1 text-[9px] text-cs-subtle">{snapshot.turns.length} turns · {snapshot.messages.length} messages</span>
        <div className="ml-auto flex items-center gap-0.5">
          {effectiveSelectedId !== undefined && <Button variant="ghost" className="h-7 px-2 text-[10px]" onClick={() => setSelectedId(undefined)}>Show all</Button>}
          <Button variant={outline ? 'primary' : 'ghost'} className="h-7 px-2 text-[10px]" onClick={() => setOutline((value) => !value)}>{outline ? 'Graph' : 'Outline'}</Button>
          <IconButton aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(0.65, value - 0.1))}><ZoomOut size={12} aria-hidden="true" /></IconButton>
          <IconButton aria-label="Fit conversation map" onClick={() => setZoom(1)}><Maximize2 size={12} aria-hidden="true" /></IconButton>
          <IconButton aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(1.5, value + 0.1))}><ZoomIn size={12} aria-hidden="true" /></IconButton>
        </div>
      </header>
      {outline ? (
        <ConversationOutline snapshot={snapshot} selectedTurnId={selectedTurnId} collapsed={collapsed} onSelect={selectTurn} onToggleCollapse={toggleCollapse} />
      ) : (
        <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_236px] max-[720px]:grid-cols-1 max-[720px]:grid-rows-[minmax(0,1fr)_auto]">
          <div className="relative min-h-0 cursor-grab overflow-hidden bg-[radial-gradient(circle_at_center,color-mix(in_srgb,var(--color-cs-border)_55%,transparent)_1px,transparent_1px)] bg-[length:18px_18px] active:cursor-grabbing" role="application" aria-label="Spatial conversation canvas" onPointerDown={startPan} onPointerMove={movePan} onPointerUp={endPan} onPointerCancel={endPan}>
            <div className="relative origin-top-left" style={{ width: layout.width * zoom, height: layout.height * zoom }}>
              <div className="absolute left-0 top-0 origin-top-left" style={{ width: layout.width, height: layout.height, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
                <svg className="pointer-events-none absolute inset-0" width={layout.width} height={layout.height} aria-hidden="true">
                  {graph.edges.map((edge) => {
                    const source = positions.find((item) => item.node.id === edge.sourceId);
                    const target = positions.find((item) => item.node.id === edge.targetId);
                    if (source === undefined || target === undefined) return null;
                    const visible = effectiveSelectedId === undefined || edge.sourceId === effectiveSelectedId || edge.targetId === effectiveSelectedId;
                    return <line key={edge.id} x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke="var(--color-cs-focus)" strokeOpacity={visible ? 0.42 : 0.08} strokeWidth={edge.kind === 'next' ? 1.5 : 1} strokeDasharray={edge.kind === 'next' ? undefined : '3 3'} />;
                  })}
                </svg>
                {positions.map((item) => {
                  const { node } = item;
                  const match = searchMatches.has(node.id);
                  const focused = focusedIds.has(node.id);
                  const muted = !match || !focused;
                  return <ConversationNode key={node.id} item={item} selected={node.id === effectiveSelectedId} sourceActive={node.id === sourceNode?.id} muted={muted} collapsed={node.turnId !== undefined && collapsed.has(node.turnId)} onSelect={() => selectNode(node.id)} />;
                })}
              </div>
            </div>
          </div>
          <ConversationInspector node={graph.nodes.find((node) => node.id === effectiveSelectedId)} snapshot={snapshot} annotation={selectedAnnotation} onGoToSource={onGoToSource} onTogglePin={() => {
            const sourceKey = graph.nodes.find((node) => node.id === effectiveSelectedId)?.sourceIds[0];
            if (sourceKey !== undefined) onUpdateAnnotation(sourceKey, { pinned: !(selectedAnnotation?.pinned ?? false) });
          }} onSaveAnnotation={(note) => {
            const sourceKey = graph.nodes.find((node) => node.id === effectiveSelectedId)?.sourceIds[0];
            if (sourceKey !== undefined) onUpdateAnnotation(sourceKey, { note });
          }} />
        </div>
      )}
    </section>
  );
}
