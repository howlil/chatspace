import { useMemo, useState } from 'react';

import type { GraphNode, WorkspaceGraph } from '../../domain/graph/projectGraph';

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
    <section className="graph-navigator" aria-label="Workspace graph">
      <header className="graph-toolbar">
        <input aria-label="Search graph" placeholder="Find a node" value={query} onChange={(event) => setQuery(event.target.value)} />
        <span>{graph.nodes.length} nodes · {graph.edges.length} edges</span>
        <div className="graph-zoom-controls" aria-label="Graph zoom controls">
          <button type="button" aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(0.65, value - 0.1))}>−</button>
          <button type="button" aria-label="Reset graph view" onClick={() => setZoom(1)}>Fit</button>
          <button type="button" aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(1.6, value + 0.1))}>+</button>
        </div>
      </header>

      <div className="graph-workspace">
        <div className="graph-canvas" role="application" aria-label="Spatial graph canvas">
          <div className="graph-stage" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, transform: `scale(${zoom})` }}>
            <svg className="graph-edge-layer" width={CANVAS_WIDTH} height={CANVAS_HEIGHT} aria-hidden="true">
              {graph.edges.map((edge) => {
                const source = positionById.get(edge.sourceId);
                const target = positionById.get(edge.targetId);
                if (source === undefined || target === undefined) return null;
                return <line key={edge.id} x1={source.x} y1={source.y} x2={target.x} y2={target.y} />;
              })}
            </svg>
            {positioned.map(({ node, x, y }) => (
              <button
                type="button"
                key={node.id}
                className="graph-node"
                data-kind={node.kind}
                data-selected={node.id === selectedNode?.id ? 'true' : 'false'}
                data-muted={visibleNodeIds.has(node.id) ? 'false' : 'true'}
                aria-label={`${node.kind} ${node.label}`}
                style={{ left: x, top: y }}
                onClick={() => setSelectedNodeId(node.id)}
                onDoubleClick={() => onOpenNode(node)}
              >
                <span className="graph-node-kind">{node.kind}</span>
                <span>{node.label}</span>
              </button>
            ))}
          </div>
        </div>

        <aside className="graph-inspector" aria-label="Graph selection details">
          {selectedNode === undefined ? (
            <p className="panel-empty">Select a node.</p>
          ) : (
            <>
              <div className="graph-inspector-heading">
                <span>{selectedNode.kind}</span>
                <strong>{selectedNode.label}</strong>
                <button type="button" onClick={() => onOpenNode(selectedNode)}>Open</button>
              </div>
              <div className="graph-edge-list">
                {selectedEdges.map((edge) => {
                  const otherId = edge.sourceId === selectedNode.id ? edge.targetId : edge.sourceId;
                  const other = graph.nodes.find((node) => node.id === otherId);
                  return (
                    <div key={edge.id} className="graph-edge-row">
                      <span>{edge.kind}</span>
                      <strong>{other?.label ?? otherId}</strong>
                      <small>{edge.provenance}</small>
                    </div>
                  );
                })}
                {selectedEdges.length === 0 && <p>No relationships yet.</p>}
              </div>
            </>
          )}

          {entityNodes.length >= 2 && (
            <form className="manual-edge-form" onSubmit={(event) => {
              event.preventDefault();
              if (sourceEntityId !== '' && targetEntityId !== '' && sourceEntityId !== targetEntityId) onCreateManualEdge(sourceEntityId, targetEntityId);
            }}>
              <span>Relate manually</span>
              <select aria-label="Relationship source" value={sourceEntityId} onChange={(event) => setSourceEntityId(event.target.value)}>
                {entityNodes.map((node) => <option key={node.id} value={node.entityId}>{node.label}</option>)}
              </select>
              <span>→</span>
              <select aria-label="Relationship target" value={targetEntityId} onChange={(event) => setTargetEntityId(event.target.value)}>
                {entityNodes.map((node) => <option key={node.id} value={node.entityId}>{node.label}</option>)}
              </select>
              <button type="submit" disabled={sourceEntityId === targetEntityId}>Add relation</button>
            </form>
          )}
        </aside>
      </div>
    </section>
  );
}
