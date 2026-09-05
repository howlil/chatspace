import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { WorkspaceTab } from '../../domain/workspace/model';
import { WorkbenchChrome } from './WorkbenchChrome';

const tabs: WorkspaceTab[] = [
  { id: 'tab-home', kind: 'home', entityId: null, title: 'Home', pinned: true },
];

function renderChrome(explorerCollapsed: boolean) {
  const onToggleExplorer = vi.fn();
  render(
    <WorkbenchChrome
      tabs={tabs}
      activeTabId="tab-home"
      explorerCollapsed={explorerCollapsed}
      providerSupported
      providerLabel="Conversation detected"
      onToggleExplorer={onToggleExplorer}
      onOpenHome={vi.fn()}
      onOpenSettings={vi.fn()}
      onOpenMore={vi.fn()}
      onActivateTab={vi.fn()}
      onCloseTab={vi.fn()}
    />,
  );
  return { onToggleExplorer };
}

describe('WorkbenchChrome', () => {
  it('does not duplicate Library as a primary destination while the library is already visible', () => {
    renderChrome(false);

    expect(screen.queryByRole('button', { name: 'Library' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open library' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Settings' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'More' })).toBeVisible();
  });

  it('places the library reopen control at the leading edge only when collapsed', () => {
    const { onToggleExplorer } = renderChrome(true);

    fireEvent.click(screen.getByRole('button', { name: 'Open library' }));
    expect(onToggleExplorer).toHaveBeenCalledOnce();
  });
});
