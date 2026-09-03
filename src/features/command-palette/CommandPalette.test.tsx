import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CommandPalette, type WorkspaceCommand, type WorkspaceQuickOpenItem } from './CommandPalette';

describe('CommandPalette', () => {
  it('filters and executes commands through the universal local search', () => {
    const runGraph = vi.fn();
    const commands: WorkspaceCommand[] = [
      { id: 'folder', label: 'Create folder', run: vi.fn() },
      { id: 'graph', label: 'Open graph', run: runGraph },
    ];
    const onClose = vi.fn();

    render(<CommandPalette commands={commands} onClose={onClose} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Search notes, chats, folders, views, or commands' }), {
      target: { value: 'graph' },
    });

    expect(screen.queryByRole('button', { name: 'Create folder' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open graph' }));
    expect(runGraph).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('quick-opens local artifacts before falling back to commands', () => {
    const openNote = vi.fn();
    const items: WorkspaceQuickOpenItem[] = [
      { id: 'note-1', kind: 'note', label: 'Storage recovery', searchText: 'Storage recovery persistence fail closed', run: openNote },
    ];

    render(<CommandPalette commands={[]} items={items} onClose={vi.fn()} />);
    const search = screen.getByRole('textbox', { name: 'Search notes, chats, folders, views, or commands' });
    fireEvent.change(search, { target: { value: 'persistence' } });
    fireEvent.keyDown(search, { key: 'Enter' });

    expect(openNote).toHaveBeenCalledOnce();
  });
});