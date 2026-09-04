import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  INBOX_FOLDER_ID,
  createChatReference,
  createInitialWorkspace,
  createLocalNote,
} from '../domain/workspace/model';
import { workspaceReducer } from '../domain/workspace/workspaceReducer';
import { MemoryWorkspaceRepository } from '../persistence/workspaceRepository';
import { WorkspaceApp } from './WorkspaceApp';

afterEach(() => cleanup());

describe('WorkspaceApp M19 conversation-to-knowledge distillation', () => {
  it('saves an unsaved current conversation then immediately creates a linked durable note', async () => {
    const repository = new MemoryWorkspaceRepository(createInitialWorkspace(1));

    render(
      <WorkspaceApp
        repository={repository}
        currentUrl={() => 'https://chatgpt.com/c/isolation?utm_source=test'}
        currentTitle={() => 'Postgres isolation - ChatGPT'}
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Distill' }));
    const dialog = screen.getByRole('dialog', { name: 'Save conversation' });
    expect(within(dialog).getByRole('textbox', { name: 'Conversation name' })).toHaveValue('Postgres isolation');
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Why saved' }), {
      target: { value: 'Source for transaction isolation notes' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('textbox', { name: 'Note title' })).toHaveValue('Postgres isolation');
    expect(screen.getByRole('button', { name: 'Resume Postgres isolation' })).toBeVisible();

    await waitFor(async () => {
      const stored = await repository.load();
      expect(stored?.chatRefs).toHaveLength(1);
      expect(stored?.chatRefs[0]).toMatchObject({
        label: 'Postgres isolation',
        annotation: 'Source for transaction isolation notes',
        target: 'https://chatgpt.com/c/isolation',
      });
      expect(stored?.notes).toHaveLength(1);
      expect(stored?.notes[0]).toMatchObject({ title: 'Postgres isolation', folderId: null });
      expect(stored?.notes[0]?.linkedChatIds).toEqual([stored?.chatRefs[0]?.id]);
    });
  });

  it('distills an already-saved conversation and closes the note-to-source round trip', async () => {
    const initial = createInitialWorkspace(1);
    const chat = createChatReference({
      id: 'chat-source',
      label: 'Serializable transactions',
      annotation: 'Retry behavior and write skew',
      target: 'https://chatgpt.com/c/serializable',
      folderId: null,
      now: 2,
    });
    initial.chatRefs = [chat];
    const repository = new MemoryWorkspaceRepository(initial);
    const navigate = vi.fn();

    render(
      <WorkspaceApp
        repository={repository}
        currentUrl={() => chat.target}
        currentTitle={() => 'Serializable transactions - ChatGPT'}
        navigate={navigate}
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Distill' }));
    const content = await screen.findByRole('textbox', { name: 'Markdown content' });
    fireEvent.change(content, { target: { value: 'Serializable transactions can require application-level retries.' } });

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    const search = screen.getByRole('textbox', { name: 'Search notes, chats, folders, views, or commands' });
    fireEvent.change(search, { target: { value: 'application-level retries' } });
    fireEvent.click(screen.getByRole('button', { name: 'Serializable transactions' }));

    expect(await screen.findByRole('button', { name: 'Resume Serializable transactions' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Resume Serializable transactions' }));
    expect(navigate).toHaveBeenCalledWith('https://chatgpt.com/c/serializable');
  });

  it('projects linked knowledge back onto the conversation and allows an explicit additional note', async () => {
    const initial = createInitialWorkspace(1);
    const chat = createChatReference({
      id: 'chat-db',
      label: 'Database consistency',
      target: 'https://chatgpt.com/c/db-consistency',
      folderId: null,
      now: 2,
    });
    const note = {
      ...createLocalNote({ id: 'note-summary', title: 'Consistency summary', folderId: null, now: 3 }),
      linkedChatIds: [chat.id],
    };
    initial.chatRefs = [chat];
    initial.notes = [note];
    initial.tabs = [...initial.tabs, { id: `tab-chat-${chat.id}`, kind: 'chat', entityId: chat.id, title: chat.label, pinned: false }];
    initial.activeTabId = `tab-chat-${chat.id}`;
    const repository = new MemoryWorkspaceRepository(initial);

    render(<WorkspaceApp repository={repository} currentUrl={() => chat.target} navigate={() => undefined} />);

    const knowledge = await screen.findByLabelText('Knowledge from this conversation');
    expect(within(knowledge).getByRole('button', { name: 'Consistency summary' })).toBeVisible();
    expect(within(knowledge).getByRole('button', { name: 'New note from conversation' })).toBeVisible();

    fireEvent.click(within(knowledge).getByRole('button', { name: 'New note from conversation' }));
    expect(await screen.findByRole('textbox', { name: 'Note title' })).toHaveValue('Database consistency');

    await waitFor(async () => {
      const notes = (await repository.load())?.notes ?? [];
      expect(notes).toHaveLength(2);
      expect(notes.filter((candidate) => candidate.linkedChatIds.includes(chat.id))).toHaveLength(2);
    });
  });

  it('opens an existing distilled note from the source conversation projection', async () => {
    const initial = createInitialWorkspace(1);
    const chat = createChatReference({ id: 'chat-api', label: 'API design', target: 'https://chatgpt.com/c/api', folderId: null, now: 2 });
    const note = {
      ...createLocalNote({ id: 'note-api', title: 'API design decisions', folderId: null, now: 3 }),
      linkedChatIds: [chat.id],
    };
    initial.chatRefs = [chat];
    initial.notes = [note];
    initial.tabs = [...initial.tabs, { id: `tab-chat-${chat.id}`, kind: 'chat', entityId: chat.id, title: chat.label, pinned: false }];
    initial.activeTabId = `tab-chat-${chat.id}`;

    render(<WorkspaceApp repository={new MemoryWorkspaceRepository(initial)} currentUrl={() => chat.target} navigate={() => undefined} />);

    fireEvent.click(await screen.findByRole('button', { name: 'API design decisions' }));
    expect(await screen.findByRole('textbox', { name: 'Note title' })).toHaveValue('API design decisions');
    expect(screen.getByRole('button', { name: 'Resume API design' })).toBeVisible();
  });

  it('preserves source provenance when an Inbox capture is organized outside Inbox', () => {
    const initial = createInitialWorkspace(1);
    const chat = createChatReference({ id: 'chat-capture', label: 'Caching discussion', target: 'https://chatgpt.com/c/cache', folderId: null, now: 2 });
    const capture = {
      ...createLocalNote({ id: 'note-capture', title: 'Cache invalidation thought', folderId: INBOX_FOLDER_ID, now: 3 }),
      linkedChatIds: [chat.id],
    };
    initial.chatRefs = [chat];
    initial.notes = [capture];

    const organized = workspaceReducer(initial, {
      type: 'note/update',
      note: { ...capture, folderId: null },
      now: 4,
    });

    expect(organized.notes[0]).toMatchObject({ folderId: null, linkedChatIds: [chat.id] });
  });
});
