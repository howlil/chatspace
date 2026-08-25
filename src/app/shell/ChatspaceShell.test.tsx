import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChatspaceShell } from './ChatspaceShell';
import { WorkspaceErrorBoundary } from './WorkspaceErrorBoundary';

describe('ChatspaceShell', () => {
  it('renders as an extension-owned workspace surface instead of a host-page overlay control', () => {
    render(<ChatspaceShell><span>Workbench</span></ChatspaceShell>);

    expect(screen.getByRole('region', { name: 'Chatspace workspace' })).toBeVisible();
    expect(screen.getByText('Workspace beside ChatGPT')).toBeVisible();
    expect(screen.getByText('Workbench')).toBeVisible();
  });

  it('fails closed while leaving the provider page conceptually available', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const Crasher = () => {
      throw new Error('boom');
    };

    render(
      <WorkspaceErrorBoundary>
        <Crasher />
      </WorkspaceErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Chatspace stopped safely');
    expect(screen.getByRole('alert')).toHaveTextContent('ChatGPT is still available');
    consoleError.mockRestore();
  });
});
