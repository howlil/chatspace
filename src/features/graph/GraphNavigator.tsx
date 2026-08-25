import { useMemo, useState } from 'react';

import type { GraphNode, WorkspaceGraph } from '../../domain/graph/projectGraph';

interface GraphNavigatorProps {
  graph: WorkspaceGraph;
  onOpenNode: (node: GraphNode) => void;
  onCreateManualEdge: (sourceEntityId: string, targetEntityId: string) => void;
}

export function GraphNavigator({ graph, onOpenNode, onCreateManualEdge }: GraphNavigatorProps) {
  const [query, setQuery] = useState('');
  const entityNodes = graph.nodes.filter((node) => node.kind !== 'workspace');
  const [sourceEntityId, setSourceEntityId] = useState(entityNodes[0]?.entityId ?? '');
  const [targetEntityId, setTargetEntityId] = useState(entityNodes[1]?.entityId ?? '');
  const normalized = query.trim().toLowerCase();
  const visibleNodes = useMemo(
    () => normalized === '' ? graph.nodes : graph.nodes.filter((node) => node.label.toLowerCase().includes(normalized) || node.kind.includes(normalized)),
    [graph.nodes, normalized],
  );
  const labelByNodeId = new Map(graph.nodes.map((node) => [node.id, node.label]));

  return (
    <section className="graph-navigator" aria-label="Workspace graph">
      <header className="graph-toolbar">
        <input aria-label="Search graph" placeholder="Find a node" value={query} onChange={(event) => setQuery(event.target.value)} />
        <span>{graph.nodes.length} nodes · {graph.edges.length} edges</span>
      </header>

      <div className="graph-columns">
        <div className="graph-section">
          <h3>Nodes</h3>
          <div className="graph-node-list">
            {visibleNodes.map((node) => (
              <button
                type="button"
                key={node.id}
                aria-label={`${node.kind} ${node.label}`}
                onClick={() => onOpenNode(node)}
              >
                <span className="graph-node-kind">{node.kind}</span>
                <span>{node.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="graph-section">
          <h3>Relationships</h3>
          <div className="graph-edge-list">
            {graph.edges.map((edge) => (
              <div key={edge.id} className="graph-edge-row">
                <span>{labelByNodeId.get(edge.sourceId) ?? edge.sourceId}</span>
                <span className="graph-edge-kind">{edge.kind}</span>
                <span>{labelByNodeId.get(edge.targetId) ?? edge.targetId}</span>
                <small>{edge.provenance}</small>
              </div>
            ))}
            {graph.edges.length === 0 && <p>No relationships yet.</p>}
          </div>
        </div>
      </div>

      {entityNodes.length >= 2 && (
        <form
          className="manual-edge-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (sourceEntityId !== '' && targetEntityId !== '' && sourceEntityId !== targetEntityId) {
              onCreateManualEdge(sourceEntityId, targetEntityId);
            }
          }}
        >
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
    </section>
  );
}
