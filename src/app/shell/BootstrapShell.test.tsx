import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BootstrapShell } from './BootstrapShell';

describe('BootstrapShell', () => {
  it('shows the Chatspace foundation status', () => {
    render(<BootstrapShell />);

    expect(screen.getByText('Chatspace')).toBeVisible();
    expect(screen.getByText('Foundation ready')).toBeVisible();
  });
});
