import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { WorkspaceTab } from '../../domain/workspace/model';
import { WorkspaceTabs } from './WorkspaceTabs';

const tabs: WorkspaceTab[] = [
  { id: 'tab-home', kind: 'home', entityId: null, title: 'Home', pinned: true },
  { id: 'tab-graph', kind: 'graph', entityId: null, title: 'Graph', pinned: false },
];

describe('WorkspaceTabs', () => {
  it('activates and closes workspace contexts without exposing close on pinned tabs', () => {
    const onActivate = vi.fn();
    const onClose = vi.fn();
    render(
      <WorkspaceTabs
        tabs={tabs}
        activeTabId="tab-home"
        onActivate={onActivate}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Graph' }));
    expect(onActivate).toHaveBeenCalledWith('tab-graph');
    expect(screen.queryByRole('button', { name: 'Close Home' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close Graph' }));
    expect(onClose).toHaveBeenCalledWith('tab-graph');
  });
});
