import { fireEvent, render, screen, within } from '@testing-library/react';
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

  it('groups empty-state retrieval around daily work and hides saved views until searched', () => {
    const items: WorkspaceQuickOpenItem[] = [
      { id: 'chat-1', kind: 'chat', label: 'Recent API work', updatedAt: 20, run: vi.fn() },
      { id: 'chat-2', kind: 'chat', label: 'Backend roadmap', pinned: true, updatedAt: 10, run: vi.fn() },
      { id: 'folder-1', kind: 'folder', label: 'Backend', run: vi.fn() },
      { id: 'view-1', kind: 'view', label: 'Reviewed notes', updatedAt: 30, run: vi.fn() },
    ];
    const commands: WorkspaceCommand[] = [{ id: 'capture', label: 'Quick capture', run: vi.fn() }];

    render(<CommandPalette commands={commands} items={items} onClose={vi.fn()} />);

    expect(within(screen.getByRole('region', { name: 'Continue' })).getByText('Recent API work')).toBeVisible();
    expect(within(screen.getByRole('region', { name: 'Pinned' })).getByText('Backend roadmap')).toBeVisible();
    expect(within(screen.getByRole('region', { name: 'Library' })).getByText('Backend')).toBeVisible();
    expect(within(screen.getByRole('region', { name: 'Actions' })).getByText('Quick capture')).toBeVisible();
    expect(screen.queryByText('Reviewed notes')).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'Search notes, chats, folders, views, or commands' }), {
      target: { value: 'Reviewed notes' },
    });
    expect(within(screen.getByRole('region', { name: 'Saved views' })).getByText('Reviewed notes')).toBeVisible();
  });
});
