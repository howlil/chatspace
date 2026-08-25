import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createChatReference, createInitialWorkspace, createLocalNote } from '../domain/workspace/model';
import { MemoryWorkspaceRepository } from '../persistence/workspaceRepository';
import { WorkspaceApp } from './WorkspaceApp';

afterEach(() => cleanup());

function dailyWorkspace() {
  const workspace = createInitialWorkspace(1);
  const older = createChatReference({ id: 'chat-old', label: 'Redis caching', target: 'https://chatgpt.com/c/redis', folderId: null, now: 10 });
  const newer = { ...createChatReference({ id: 'chat-new', label: 'PostgreSQL locking', target: 'https://chatgpt.com/c/postgres', folderId: null, now: 20 }), pinned: true };
  const note = createLocalNote({ id: 'note-one', title: 'MVCC notes', folderId: null, now: 15 });
  workspace.chatRefs = [older, newer];
  workspace.notes = [note];
  workspace.tabs = [
    workspace.tabs[0]!,
    { id: 'tab-chat-old', kind: 'chat', entityId: older.id, title: older.label, pinned: false },
    { id: 'tab-chat-new', kind: 'chat', entityId: newer.id, title: newer.label, pinned: false },
  ];
  workspace.activeTabId = 'tab-home';
  return workspace;
}

describe('WorkspaceApp daily-driver flow', () => {
  it('shows resume-oriented home content instead of workspace counters', async () => {
    render(<WorkspaceApp repository={new MemoryWorkspaceRepository(dailyWorkspace())} currentUrl={() => 'https://chatgpt.com/'} />);

    expect(await screen.findByRole('heading', { name: 'Continue' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Pinned' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Recent notes' })).toBeVisible();
    expect(screen.getAllByText('PostgreSQL locking').length).toBeGreaterThan(0);
    expect(screen.queryByText('Folders')).not.toBeInTheDocument();
  });

  it('switches native ChatGPT when a saved chat tab is activated', async () => {
    const navigate = vi.fn();
    render(<WorkspaceApp repository={new MemoryWorkspaceRepository(dailyWorkspace())} currentUrl={() => 'https://chatgpt.com/c/current'} navigate={navigate} />);

    const tab = await screen.findByRole('tab', { name: 'PostgreSQL locking' });
    fireEvent.click(tab);

    expect(navigate).toHaveBeenCalledWith('https://chatgpt.com/c/postgres');
    expect(screen.getByText('Workspace root · Pinned')).toBeVisible();
    expect(screen.queryByText('https://chatgpt.com/c/postgres')).not.toBeInTheDocument();
  });
});
