import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SpatialWorkspace } from './SpatialWorkspace';

describe('SpatialWorkspace', () => {
  it('exposes distinct navigation, workspace, and provider boundaries', () => {
    render(<SpatialWorkspace />);

    expect(screen.getByRole('navigation', { name: 'Workspace tree' })).toBeVisible();
    expect(screen.getByRole('main', { name: 'Workspace surface' })).toBeVisible();
    expect(screen.getByRole('region', { name: 'Provider surface' })).toBeVisible();
  });
});
