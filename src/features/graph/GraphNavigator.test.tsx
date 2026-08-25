import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { WorkspaceGraph } from '../../domain/graph/projectGraph';
import { GraphNavigator } from './GraphNavigator';

const graph: WorkspaceGraph = {
  nodes: [
    { id:'workspace:default', entityId:'default', kind:'workspace', label:'Chatspace' },
    { id:'note:n1', entityId:'n1', kind:'note', label:'Transactions' },
    { id:'chat:c1', entityId:'c1', kind:'chat', label:'Database discussion' },
  ],
  edges: [
    { id:'references:note:n1:chat:c1', sourceId:'note:n1', targetId:'chat:c1', kind:'references', provenance:'canonical' },
  ],
};

afterEach(() => cleanup());

describe('GraphNavigator', () => {
  it('uses graph nodes for navigation and exposes provenance on relationships', () => {
    const onOpenNode = vi.fn();
    render(<GraphNavigator graph={graph} onOpenNode={onOpenNode} onCreateManualEdge={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name:'note Transactions' }));
    expect(onOpenNode).toHaveBeenCalledWith(graph.nodes[1]);
    expect(screen.getByText('canonical')).toBeVisible();
  });

  it('creates an explicit manual relationship from local entities', () => {
    const onCreateManualEdge = vi.fn();
    render(<GraphNavigator graph={graph} onOpenNode={vi.fn()} onCreateManualEdge={onCreateManualEdge} />);
    fireEvent.click(screen.getByRole('button', { name:'Add relation' }));
    expect(onCreateManualEdge).toHaveBeenCalledWith('n1','c1');
  });
});
