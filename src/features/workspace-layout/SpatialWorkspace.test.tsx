import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SpatialWorkspace } from './SpatialWorkspace';

afterEach(() => cleanup());

describe('SpatialWorkspace', () => {
  it('exposes a real library/workspace split without a fake provider panel', () => {
    render(<SpatialWorkspace />);

    expect(screen.getByRole('navigation', { name: 'Workspace library' })).toBeVisible();
    expect(screen.getByRole('main', { name: 'Chatspace workspace' })).toBeVisible();
    expect(screen.queryByRole('region', { name: 'Provider surface' })).not.toBeInTheDocument();
  });

  it('supports keyboard resizing of the library', () => {
    const onTreeWidthChange = vi.fn();
    render(<SpatialWorkspace treeWidth={240} onTreeWidthChange={onTreeWidthChange} />);

    fireEvent.keyDown(screen.getByRole('separator', { name: 'Resize library' }), { key: 'ArrowRight' });
    expect(onTreeWidthChange).toHaveBeenCalledWith(256);
  });
});
