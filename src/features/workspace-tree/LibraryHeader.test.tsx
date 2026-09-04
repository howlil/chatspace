import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LibraryHeader } from './LibraryHeader';

function renderHeader() {
  const callbacks = {
    onCreateNote: vi.fn(),
    onCreateFolder: vi.fn(),
    onQuickCapture: vi.fn(),
    onCollapse: vi.fn(),
  };
  render(<LibraryHeader {...callbacks} />);
  return callbacks;
}

describe('LibraryHeader', () => {
  it('owns one compact create menu for library-scoped creation', () => {
    const callbacks = renderHeader();

    fireEvent.click(screen.getByRole('button', { name: 'Create in library' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'New note' }));
    expect(callbacks.onCreateNote).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('button', { name: 'Create in library' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'New folder' }));
    expect(callbacks.onCreateFolder).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('button', { name: 'Create in library' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Quick capture' }));
    expect(callbacks.onQuickCapture).toHaveBeenCalledOnce();
  });

  it('keeps the collapse action on the surface it controls', () => {
    const callbacks = renderHeader();

    fireEvent.click(screen.getByRole('button', { name: 'Collapse library' }));
    expect(callbacks.onCollapse).toHaveBeenCalledOnce();
  });
});
