import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChatspaceShell } from './ChatspaceShell';
import { WorkspaceErrorBoundary } from './WorkspaceErrorBoundary';

describe('ChatspaceShell', () => {
  it('can hide and restore without taking ownership of the host page', () => {
    render(<ChatspaceShell />);

    fireEvent.click(screen.getByRole('button', { name: 'Hide Chatspace' }));
    expect(screen.queryByRole('complementary', { name: 'Chatspace workspace' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open Chatspace' }));
    expect(screen.getByRole('complementary', { name: 'Chatspace workspace' })).toBeVisible();
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
