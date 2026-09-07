import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatspaceShell } from './ChatspaceShell';
import { ErrorBoundary } from './ErrorBoundary';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe('ChatspaceShell', () => {
  it('renders as an extension-owned conversation map beside ChatGPT', () => {
    render(<ChatspaceShell><span>Conversation graph</span></ChatspaceShell>);

    expect(screen.getByRole('region', { name: 'Chatspace conversation map' })).toBeVisible();
    expect(screen.getByText('Conversation map beside ChatGPT')).toBeVisible();
    expect(screen.getByText('Conversation graph')).toBeVisible();
    expect(screen.getByRole('button', { name: /Switch to .* theme/ })).toBeVisible();
  });

  it('switches and persists the appearance theme', () => {
    window.localStorage.setItem('chatspace-theme', 'dark');
    render(<ChatspaceShell><span>Conversation graph</span></ChatspaceShell>);

    fireEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(window.localStorage.getItem('chatspace-theme')).toBe('light');
    expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeVisible();
  });

  it('fails closed while leaving the provider page conceptually available', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const Crasher = () => {
      throw new Error('boom');
    };

    render(
      <ErrorBoundary>
        <Crasher />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Chatspace stopped safely');
    expect(screen.getByRole('alert')).toHaveTextContent('ChatGPT is still available');
    consoleError.mockRestore();
  });
});
