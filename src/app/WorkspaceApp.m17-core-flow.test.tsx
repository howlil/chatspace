import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  INBOX_FOLDER_ID,
  createChatReference,
  createInitialWorkspace,
  createLocalNote,
} from '../domain/workspace/model';
import { MemoryWorkspaceRepository } from '../persistence/workspaceRepository';
import { WorkspaceApp } from './WorkspaceApp';

afterEach(() => cleanup());

describe('WorkspaceApp M17 core flow', () => {
  it('saves why a conversation matters, edits it locally, then retrieves and resumes by that context', async () => {
    const repository = new MemoryWorkspaceRepository(createInitialWorkspace(1));
    const navigate = vi.fn();

    render(
      <WorkspaceApp
        repository={repository}
        currentUrl={() => 'https://chatgpt.com/c/postgres?utm_source=test'}
        navigate={navigate}
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Save current chat' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Conversation name' }), {
      target: { value: 'Postgres isolation levels' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Why saved' }), {
      target: { value: 'Clear explanation of write skew' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(async () => {
      expect((await repository.load())?.chatRefs[0]).toMatchObject({
        label: 'Postgres isolation levels',
        annotation: 'Clear explanation of write skew',
        target: 'https://chatgpt.com/c/postgres',
      });
    });

    const annotationEditor = await screen.findByRole('textbox', { name: 'Why saved' });
    fireEvent.change(annotationEditor, { target: { value: 'Write skew and snapshot isolation' } });
    await waitFor(async () => {
      expect((await repository.load())?.chatRefs[0]?.annotation).toBe('Write skew and snapshot isolation');
    });

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    fireEvent.change(screen.getByRole('textbox', { name: 'Search notes, chats, folders, views, or commands' }), {
      target: { value: 'snapshot isolation' },
    });
    expect(screen.getByRole('button', { name: 'Postgres isolation levels' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Postgres isolation levels' }));

    expect(navigate).toHaveBeenCalledWith('https://chatgpt.com/c/postgres');
  });

  it('presents chats and non-Inbox notes as one Continue working set while keeping Inbox separate', async () => {
    const initial = createInitialWorkspace(1);
    initial.chatRefs = [{
      ...createChatReference({
        id: 'chat-one',
        label: 'API design review',
        annotation: 'Continue endpoint versioning discussion',
        target: 'https://chatgpt.com/c/api',
        folderId: null,
        now: 10,
      }),
      updatedAt: 30,
    }];
    initial.notes = [
      { ...createLocalNote({ id: 'note-recent', title: 'Database indexing notes', folderId: null, now: 20 }), updatedAt: 40, tags: ['postgres'] },
      { ...createLocalNote({ id: 'note-inbox', title: 'Captured thought', folderId: INBOX_FOLDER_ID, now: 25 }), updatedAt: 50 },
    ];

    render(<WorkspaceApp repository={new MemoryWorkspaceRepository(initial)} currentUrl={() => 'https://chatgpt.com/'} />);

    const continueHeading = await screen.findByRole('heading', { name: 'Continue' });
    const continueSection = continueHeading.closest('section');
    if (continueSection === null) throw new Error('Continue section missing');
    const continueView = within(continueSection);
    expect(continueView.getByText('Database indexing notes')).toBeVisible();
    expect(continueView.getByText('API design review')).toBeVisible();
    expect(continueView.queryByText('Captured thought')).not.toBeInTheDocument();

    const inboxHeading = screen.getByRole('heading', { name: 'Inbox · 1' });
    const inboxSection = inboxHeading.closest('section');
    if (inboxSection === null) throw new Error('Inbox section missing');
    expect(within(inboxSection).getByText('Captured thought')).toBeVisible();
  });

  it('keeps legacy manual graph relations visible and deletable without offering new default Connect authoring', async () => {
    const initial = createInitialWorkspace(1);
    const note = createLocalNote({ id: 'note-one', title: 'Transactions', folderId: null, now: 2 });
    const chat = createChatReference({ id: 'chat-one', label: 'Database discussion', target: 'https://chatgpt.com/c/db', folderId: null, now: 3 });
    initial.notes = [note];
    initial.chatRefs = [chat];
    initial.manualEdges = [{ id: 'edge-one', sourceEntityId: note.id, targetEntityId: chat.id, kind: 'related-manually', createdAt: 4 }];
    initial.tabs = [...initial.tabs, { id: 'tab-graph', kind: 'graph', entityId: null, title: 'Graph', pinned: false }];
    initial.activeTabId = 'tab-graph';
    const repository = new MemoryWorkspaceRepository(initial);

    render(<WorkspaceApp repository={repository} currentUrl={() => 'https://chatgpt.com/'} />);

    fireEvent.click(await screen.findByRole('button', { name: 'note Transactions' }));
    expect(screen.queryByRole('button', { name: 'Connect' })).not.toBeInTheDocument();
    const deleteRelation = screen.getByRole('button', { name: 'Delete manual relation with Database discussion' });
    expect(deleteRelation).toBeVisible();
    fireEvent.click(deleteRelation);

    await waitFor(async () => {
      expect((await repository.load())?.manualEdges).toEqual([]);
    });
  });
});
