import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SpatialWorkspace } from './SpatialWorkspace';

describe('SpatialWorkspace', () => {
  it('exposes a real explorer/workbench split without a fake provider panel', () => {
    render(<SpatialWorkspace />);

    expect(screen.getByRole('navigation', { name: 'Workspace explorer' })).toBeVisible();
    expect(screen.getByRole('main', { name: 'Workspace workbench' })).toBeVisible();
    expect(screen.queryByRole('region', { name: 'Provider surface' })).not.toBeInTheDocument();
  });

  it('supports keyboard resizing of the explorer', () => {
    const onTreeWidthChange = vi.fn();
    render(<SpatialWorkspace treeWidth={240} onTreeWidthChange={onTreeWidthChange} />);

    fireEvent.keyDown(screen.getByRole('separator', { name: 'Resize explorer' }), { key: 'ArrowRight' });
    expect(onTreeWidthChange).toHaveBeenCalledWith(256);
  });
});
