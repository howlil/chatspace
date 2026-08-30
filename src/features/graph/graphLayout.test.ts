import { describe, expect, it } from 'vitest';

import type { WorkspaceGraph } from '../../domain/graph/projectGraph';
import { directNeighborhood, edgeVisualWeight, layoutWorkspaceGraph } from './graphLayout';

const graph: WorkspaceGraph = {
  nodes: [
    { id: 'workspace:w1', entityId: 'w1', kind: 'workspace', label: 'Workspace' },
    { id: 'folder:f1', entityId: 'f1', kind: 'folder', label: 'Backend' },
    { id: 'note:n1', entityId: 'n1', kind: 'note', label: 'Transactions' },
    { id: 'chat:c1', entityId: 'c1', kind: 'chat', label: 'Database chat' },
  ],
  edges: [
    { id: 'contains:w:f', sourceId: 'workspace:w1', targetId: 'folder:f1', kind: 'contains', provenance: 'canonical' },
    { id: 'contains:f:n', sourceId: 'folder:f1', targetId: 'note:n1', kind: 'contains', provenance: 'canonical' },
    { id: 'contains:f:c', sourceId: 'folder:f1', targetId: 'chat:c1', kind: 'contains', provenance: 'canonical' },
    { id: 'references:n:c', sourceId: 'note:n1', targetId: 'chat:c1', kind: 'references', provenance: 'canonical' },
  ],
};

describe('graph layout', () => {
  it('projects containment into deterministic hierarchy depth', () => {
    const first = layoutWorkspaceGraph(graph);
    const second = layoutWorkspaceGraph(graph);
    const positions = new Map(first.nodes.map((item) => [item.node.id, item]));

    expect(first).toEqual(second);
    expect(positions.get('workspace:w1')?.y).toBeLessThan(positions.get('folder:f1')?.y ?? 0);
    expect(positions.get('folder:f1')?.y).toBeLessThan(positions.get('note:n1')?.y ?? 0);
    expect(first.width).toBeGreaterThanOrEqual(920);
    expect(first.height).toBeGreaterThanOrEqual(620);
  });

  it('returns only direct relationship neighbors for focus mode', () => {
    expect([...directNeighborhood(graph, 'note:n1')].sort()).toEqual(['chat:c1', 'folder:f1', 'note:n1']);
  });

  it('maps relationship provenance to stable visual semantics', () => {
    expect(edgeVisualWeight(graph.edges[0]!)).toBe('canonical');
    expect(edgeVisualWeight(graph.edges[3]!)).toBe('reference');
    expect(edgeVisualWeight({ id: 'manual', sourceId: 'note:n1', targetId: 'chat:c1', kind: 'related-manually', provenance: 'manual' })).toBe('manual');
    expect(edgeVisualWeight({ id: 'local', sourceId: 'note:n1', targetId: 'chat:c1', kind: 'related-local', provenance: 'derived-local' })).toBe('derived');
  });
});
