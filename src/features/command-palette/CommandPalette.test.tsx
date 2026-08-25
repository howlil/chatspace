import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CommandPalette, type WorkspaceCommand } from './CommandPalette';

describe('CommandPalette', () => {
  it('filters and executes the same explicit local commands exposed by the UI', () => {
    const runGraph = vi.fn();
    const commands: WorkspaceCommand[] = [
      { id: 'folder', label: 'Create folder', run: vi.fn() },
      { id: 'graph', label: 'Open graph', run: runGraph },
    ];
    const onClose = vi.fn();

    render(<CommandPalette commands={commands} onClose={onClose} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Search commands' }), {
      target: { value: 'graph' },
    });

    expect(screen.queryByRole('button', { name: 'Create folder' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open graph' }));
    expect(runGraph).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
