import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createChatReference,
  createFolder,
  createInitialWorkspace,
  createLocalNote,
  type WorkspaceSnapshot,
} from '../domain/workspace/model';
import {
  MemoryWorkspaceRepository,
  WorkspaceCorruptionError,
  type WorkspaceRepository,
} from '../persistence/workspaceRepository';
import { WorkspaceApp } from './WorkspaceApp';

afterEach(() => cleanup());

class CorruptWorkspaceRepository implements WorkspaceRepository {
  saveCalls = 0;

  async load(): Promise<WorkspaceSnapshot | null> {
    throw new WorkspaceCorruptionError();
  }

  async save(): Promise<void> {
    this.saveCalls += 1;
  }

  async clear(): Promise<void> {}

  async readRaw(): Promise<unknown | null> {
    return { schemaVersion: 999, broken: true };
  }
}

function dataTransfer(): DataTransfer {
  const values = new Map<string, string>();
  return {
    effectAllowed: 'none',
    dropEffect: 'none',
    setData: (type: string, value: string) => values.set(type, value),
    getData: (type: string) => values.get(type) ?? '',
  } as DataTransfer;
}

describe('WorkspaceApp', () => {
  it('creates root folders by default and subfolders only through the explicit folder action', async () => {
    const initial = createInitialWorkspace(1);
    initial.folders = [
      createFolder({ id: 'root-folder', name: 'Backend', parentId: null, now: 1 }),
      createFolder({ id: 'child-folder', name: 'Databases', parentId: 'root-folder', now: 1 }),
    ];
    const repository = new MemoryWorkspaceRepository(initial);

    render(<WorkspaceApp repository={repository} currentUrl={() => 'https://chatgpt.com/'} />);

    expect(await screen.findByText('Databases')).toBeVisible();
    fireEvent.click(screen.getByText('Backend'));
    fireEvent.click(screen.getByRole('button', { name: 'Folder' }));

    await waitFor(async () => {
      const saved = await repository.load();
      expect(saved?.folders).toHaveLength(3);
      expect(saved?.folders[2]?.parentId).toBeNull();
    });

    fireEvent.click(screen.getByText('Backend'));
    fireEvent.click(screen.getByRole('button', { name: 'New subfolder here' }));

    await waitFor(async () => {
      const saved = await repository.load();
      expect(saved?.folders).toHaveLength(4);
      expect(saved?.folders[3]?.parentId).toBe('root-folder');
    });
  });

  it('moves chats, notes, and folders through explorer drag and drop while preventing folder cycles', async () => {
    const initial = createInitialWorkspace(1);
    const backend = createFolder({ id: 'backend', name: 'Backend', parentId: null, now: 1 });
    const database = createFolder({ id: 'database', name: 'Database', parentId: 'backend', now: 1 });
    const platform = createFolder({ id: 'platform', name: 'Platform', parentId: null, now: 1 });
    const chat = createChatReference({ id: 'chat-one', label: 'Production debugging', target: 'https://chatgpt.com/c/debug', folderId: null, now: 1 });
    const note = createLocalNote({ id: 'note-one', title: 'Runbook', folderId: null, now: 1 });
    initial.folders = [backend, database, platform];
    initial.chatRefs = [chat];
    initial.notes = [note];
    const repository = new MemoryWorkspaceRepository(initial);

    render(<WorkspaceApp repository={repository} currentUrl={() => 'https://chatgpt.com/'} />);
    await screen.findByText('Production debugging');

    const backendRow = screen.getByTitle('Backend').parentElement;
    const platformRow = screen.getByTitle('Platform').parentElement;
    const databaseRow = screen.getByTitle('Database').parentElement;
    const chatRow = screen.getByRole('button', { name: 'Production debugging' }).parentElement;
    const noteRow = screen.getByRole('button', { name: 'Runbook' });
    if (backendRow === null || platformRow === null || databaseRow === null || chatRow === null) throw new Error('Explorer drag targets missing');

    const chatTransfer = dataTransfer();
    fireEvent.dragStart(chatRow, { dataTransfer: chatTransfer });
    fireEvent.dragOver(backendRow, { dataTransfer: chatTransfer });
    fireEvent.drop(backendRow, { dataTransfer: chatTransfer });

    const noteTransfer = dataTransfer();
    fireEvent.dragStart(noteRow, { dataTransfer: noteTransfer });
    fireEvent.dragOver(backendRow, { dataTransfer: noteTransfer });
    fireEvent.drop(backendRow, { dataTransfer: noteTransfer });

    const folderTransfer = dataTransfer();
    fireEvent.dragStart(platformRow, { dataTransfer: folderTransfer });
    fireEvent.dragOver(backendRow, { dataTransfer: folderTransfer });
    fireEvent.drop(backendRow, { dataTransfer: folderTransfer });

    await waitFor(async () => {
      const saved = await repository.load();
      expect(saved?.chatRefs.find((item) => item.id === 'chat-one')?.folderId).toBe('backend');
      expect(saved?.notes.find((item) => item.id === 'note-one')?.folderId).toBe('backend');
      expect(saved?.folders.find((item) => item.id === 'platform')?.parentId).toBe('backend');
    });

    const invalidTransfer = dataTransfer();
    fireEvent.dragStart(backendRow, { dataTransfer: invalidTransfer });
    fireEvent.dragOver(databaseRow, { dataTransfer: invalidTransfer });
    fireEvent.drop(databaseRow, { dataTransfer: invalidTransfer });

    await waitFor(async () => {
      const saved = await repository.load();
      expect(saved?.folders.find((item) => item.id === 'backend')?.parentId).toBeNull();
    });
  });

  it('saves a named conversation into a chosen folder and optionally pins it', async () => {
    const initial = createInitialWorkspace(1);
    initial.folders = [createFolder({ id: 'database', name: 'Database', parentId: null, now: 1 })];
    const repository = new MemoryWorkspaceRepository(initial);

    render(
      <WorkspaceApp
        repository={repository}
        currentUrl={() => 'https://chatgpt.com/c/abc-123?utm_source=test'}
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Save chat' }));
    expect(screen.getByRole('dialog', { name: 'Save conversation' })).toBeVisible();
    fireEvent.change(screen.getByRole('textbox', { name: 'Conversation name' }), {
      target: { value: 'PostgreSQL locking' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Conversation folder' }), {
      target: { value: 'database' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Pin this conversation' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(async () => {
      const saved = await repository.load();
      expect(saved?.chatRefs[0]).toMatchObject({
        label: 'PostgreSQL locking',
        target: 'https://chatgpt.com/c/abc-123',
        folderId: 'database',
        pinned: true,
      });
      expect(saved?.tabs.some((tab) => tab.kind === 'chat')).toBe(true);
    });
  });

  it('opens the local command palette and graph tab', async () => {
    render(
      <WorkspaceApp
        repository={new MemoryWorkspaceRepository()}
        currentUrl={() => 'https://chatgpt.com/'}
      />,
    );

    await screen.findByText('Local workspace ready.');
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    fireEvent.click(screen.getByRole('button', { name: 'Open graph' }));
    expect(screen.getByRole('tab', { name: 'Graph' })).toHaveAttribute('aria-selected', 'true');
  });

  it('navigates a saved chat only through the validated URL adapter', async () => {
    const initial = createInitialWorkspace(1);
    initial.chatRefs = [
      createChatReference({
        id: 'chat-one',
        label: 'Production debugging',
        target: 'https://chatgpt.com/c/abc-123',
        folderId: null,
        now: 1,
      }),
    ];
    const navigate = vi.fn();

    render(
      <WorkspaceApp
        repository={new MemoryWorkspaceRepository(initial)}
        currentUrl={() => 'https://chatgpt.com/c/current'}
        navigate={navigate}
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Production debugging' }));
    expect(navigate).toHaveBeenCalledWith('https://chatgpt.com/c/abc-123');
    expect(screen.getByText('Conversation detected')).toBeVisible();
  });

  it('creates, edits, links, and persists a local Markdown note', async () => {
    const initial = createInitialWorkspace(1);
    initial.chatRefs = [
      createChatReference({
        id: 'chat-one',
        label: 'Database discussion',
        target: 'https://chatgpt.com/c/db',
        folderId: null,
        now: 1,
      }),
    ];
    const repository = new MemoryWorkspaceRepository(initial);

    render(<WorkspaceApp repository={repository} currentUrl={() => 'https://chatgpt.com/'} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Note' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Note title' }), {
      target: { value: 'Transactions' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Markdown content' }), {
      target: { value: '# ACID\nAtomicity matters.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Link chat' }));

    await waitFor(async () => {
      const saved = await repository.load();
      expect(saved?.notes[0]?.title).toBe('Transactions');
      expect(saved?.notes[0]?.content).toContain('Atomicity');
      expect(saved?.notes[0]?.linkedChatIds).toEqual(['chat-one']);
    });
  });

  it('persists explorer collapse and resize state as workspace layout', async () => {
    const repository = new MemoryWorkspaceRepository();
    render(<WorkspaceApp repository={repository} currentUrl={() => 'https://chatgpt.com/'} />);

    await screen.findByText('Local workspace ready.');
    const separator = screen.getByRole('separator', { name: 'Resize explorer' });
    const initialWidth = Number(separator.getAttribute('aria-valuenow'));
    fireEvent.keyDown(separator, { key: 'ArrowRight' });

    await waitFor(async () => {
      const saved = await repository.load();
      expect(saved?.layout.treeWidth).toBe(initialWidth + 16);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Toggle explorer' }));

    await waitFor(async () => {
      const saved = await repository.load();
      expect(saved?.layout.treeCollapsed).toBe(true);
    });
    expect(screen.queryByRole('navigation', { name: 'Workspace explorer' })).not.toBeInTheDocument();
  });

  it('does not overwrite corrupted storage and exposes the raw recovery payload', async () => {
    const repository = new CorruptWorkspaceRepository();
    render(<WorkspaceApp repository={repository} currentUrl={() => 'https://chatgpt.com/'} />);

    const warning = await screen.findByRole('alert');
    expect(warning).toHaveTextContent('Storage recovery required');
    expect(repository.saveCalls).toBe(0);

    fireEvent.click(screen.getByRole('button', { name: 'Recover' }));
    const rawRecovery = screen.getByRole('textbox', {
      name: 'Raw recovery payload',
    }) as HTMLTextAreaElement;
    expect(rawRecovery.value).toContain('"broken": true');
    expect(repository.saveCalls).toBe(0);
  });
});
