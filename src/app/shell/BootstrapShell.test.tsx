import { render, screen } from '@testing-library/react';

import { BootstrapShell } from './BootstrapShell';

describe('BootstrapShell', () => {
  it('shows the Chatspace foundation status', () => {
    render(<BootstrapShell />);

    expect(screen.getByText('Chatspace')).toBeVisible();
    expect(screen.getByText('Foundation ready')).toBeVisible();
  });
});
