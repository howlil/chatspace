import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { WorkspaceGraph } from '../../domain/graph/projectGraph';
import { GraphNavigator } from './GraphNavigator';

const graph: WorkspaceGraph = {
  nodes: [
    { id: 'workspace:default', entityId: 'default', kind: 'workspace', label: 'Chatspace' },
    { id: 'note:n1', entityId: 'n1', kind: 'note', label: 'Transactions' },
    { id: 'chat:c1', entityId: 'c1', kind: 'chat', label: 'Database discussion' },
    { id: 'note:n2', entityId: 'n2', kind: 'note', label: 'Cache notes' },
  ],
  edges: [
    { id: 'references:note:n1:chat:c1', sourceId: 'note:n1', targetId: 'chat:c1', kind: 'references', provenance: 'canonical' },
    { id: 'manual:edge-1', sourceId: 'note:n1', targetId: 'note:n2', kind: 'related-manually', provenance: 'manual' },
  ],
};

afterEach(() => cleanup());

describe('GraphNavigator', () => {
  it('renders a spatial canvas and opens a selected node from the inspector', () => {
    const onOpenNode = vi.fn();
    render(<GraphNavigator graph={graph} onOpenNode={onOpenNode} onCreateManualEdge={vi.fn()} />);

    expect(screen.getByRole('application', { name: 'Spatial graph canvas' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'note Transactions' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(onOpenNode).toHaveBeenCalledWith(graph.nodes[1]);
    expect(screen.getByText('canonical')).toBeVisible();
  });

  it('creates a manual relationship by connecting two graph nodes', () => {
    const onCreateManualEdge = vi.fn();
    render(<GraphNavigator graph={graph} onOpenNode={vi.fn()} onCreateManualEdge={onCreateManualEdge} />);

    fireEvent.click(screen.getByRole('button', { name: 'note Cache notes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
    fireEvent.click(screen.getByRole('button', { name: 'chat Database discussion' }));

    expect(onCreateManualEdge).toHaveBeenCalledWith('n2', 'c1');
  });

  it('exposes deletion only for manual relationships when deletion is wired', () => {
    const onDeleteManualEdge = vi.fn();
    render(
      <GraphNavigator
        graph={graph}
        onOpenNode={vi.fn()}
        onCreateManualEdge={vi.fn()}
        onDeleteManualEdge={onDeleteManualEdge}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'note Transactions' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete manual relation with Cache notes' }));

    expect(onDeleteManualEdge).toHaveBeenCalledWith('manual:edge-1');
    expect(screen.queryByRole('button', { name: 'Delete manual relation with Database discussion' })).toBeNull();
  });
});
