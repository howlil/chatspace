import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
    setData: (type: string, value: string) => {
      values.set(type, value);
    },
    getData: (type: string) => values.get(type) ?? '',
  } as unknown as DataTransfer;
}

describe('WorkspaceApp', () => {
  it('creates root folders globally and child items through the target folder context menu', async () => {
    const initial = createInitialWorkspace(1);
    initial.folders = [
      createFolder({ id: 'root-folder', name: 'Backend', parentId: null, now: 1 }),
      createFolder({ id: 'child-folder', name: 'Databases', parentId: 'root-folder', now: 1 }),
    ];
    const repository = new MemoryWorkspaceRepository(initial);

    render(<WorkspaceApp repository={repository} currentUrl={() => 'https://chatgpt.com/'} />);

    expect(await screen.findByText('Databases')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Create in library' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'New folder' }));

    await waitFor(async () => {
      const saved = await repository.load();
      expect(saved?.folders).toHaveLength(3);
      expect(saved?.folders[2]?.parentId).toBeNull();
    });

    const backendRow = screen.getByTitle('Backend').parentElement;
    if (backendRow === null) throw new Error('Backend row missing');
    fireEvent.contextMenu(backendRow, { clientX: 120, clientY: 100 });
    fireEvent.click(screen.getByRole('menuitem', { name: 'New subfolder' }));

    await waitFor(async () => {
      const saved = await repository.load();
      expect(saved?.folders).toHaveLength(4);
      expect(saved?.folders[3]?.parentId).toBe('root-folder');
    });

    fireEvent.contextMenu(backendRow, { clientX: 120, clientY: 100 });
    fireEvent.click(screen.getByRole('menuitem', { name: 'New note here' }));

    await waitFor(async () => {
      expect((await repository.load())?.notes[0]?.folderId).toBe('root-folder');
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
    await screen.findByRole('button', { name: 'Production debugging' });

    const backendRow = screen.getByTitle('Backend').parentElement;
    const platformRow = screen.getByTitle('Platform').parentElement;
    const databaseRow = screen.getByTitle('Database').parentElement;
    const chatRow = screen.getByRole('button', { name: 'Production debugging' }).parentElement;
    const noteRow = screen.getByRole('button', { name: 'Runbook' }).parentElement;
    if (backendRow === null || platformRow === null || databaseRow === null || chatRow === null || noteRow === null) {
      throw new Error('Explorer drag targets missing');
    }

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

    fireEvent.click(await screen.findByRole('button', { name: 'Save' }));
    const dialog = screen.getByRole('dialog', { name: 'Save conversation' });
    expect(dialog).toBeVisible();
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Conversation name' }), {
      target: { value: 'PostgreSQL locking' },
    });
    fireEvent.click(within(dialog).getByRole('combobox', { name: 'Conversation folder' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Database' }));
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Pin this conversation' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

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

  it('opens Quick Open and the advanced graph tab', async () => {
    render(
      <WorkspaceApp
        repository={new MemoryWorkspaceRepository()}
        currentUrl={() => 'https://chatgpt.com/'}
      />,
    );

    await screen.findByText('Local workspace ready.');
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(screen.getByRole('dialog', { name: 'Quick open' })).toBeVisible();
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

  it('creates, edits, links, and persists a local Markdown note while keeping the tab title aligned', async () => {
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

    fireEvent.click(await screen.findByRole('button', { name: 'Create in library' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'New note' }));
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
      expect(screen.getByRole('tab', { name: 'Transactions' })).toHaveAttribute('aria-selected', 'true');
    });
  });

  it('collapses note secondary context down to its chars/tags summary and expands it again', async () => {
    const initial = createInitialWorkspace(1);
    const note = createLocalNote({ id: 'note-one', title: 'Runbook', folderId: null, now: 1 });
    initial.notes = [note];
    initial.tabs = [
      ...initial.tabs,
      { id: 'tab-note-note-one', kind: 'note', entityId: note.id, title: note.title, pinned: false },
    ];
    initial.activeTabId = 'tab-note-note-one';

    render(<WorkspaceApp repository={new MemoryWorkspaceRepository(initial)} currentUrl={() => 'https://chatgpt.com/'} />);

    expect(await screen.findByRole('region', { name: 'Related local notes' })).toBeVisible();
    expect(screen.getByText('0 chars · 0 tags')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Collapse note context' }));
    expect(screen.queryByRole('region', { name: 'Related local notes' })).not.toBeInTheDocument();
    expect(screen.getByText('0 chars · 0 tags')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Expand note context' }));
    expect(screen.getByRole('region', { name: 'Related local notes' })).toBeVisible();
  });

  it('uses an internal confirmation dialog before deleting folders from the target context menu', async () => {
    const initial = createInitialWorkspace(1);
    initial.folders = [createFolder({ id: 'backend', name: 'Backend', parentId: null, now: 1 })];
    const repository = new MemoryWorkspaceRepository(initial);

    render(<WorkspaceApp repository={repository} currentUrl={() => 'https://chatgpt.com/'} />);

    const backendRow = (await screen.findByTitle('Backend')).parentElement;
    if (backendRow === null) throw new Error('Backend row missing');
    fireEvent.contextMenu(backendRow, { clientX: 120, clientY: 100 });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete folder' }));
    expect(screen.getByRole('alertdialog', { name: 'Delete folder?' })).toHaveTextContent('Child items will move to Workspace root.');

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('alertdialog', { name: 'Delete folder?' })).not.toBeInTheDocument();
    expect((await repository.load())?.folders).toHaveLength(1);

    fireEvent.contextMenu(backendRow, { clientX: 120, clientY: 100 });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete folder' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(async () => {
      expect((await repository.load())?.folders).toHaveLength(0);
    });
  });

  it('renames folders through the target context menu and internal input dialog', async () => {
    const initial = createInitialWorkspace(1);
    initial.folders = [createFolder({ id: 'backend', name: 'Backend', parentId: null, now: 1 })];
    const repository = new MemoryWorkspaceRepository(initial);

    render(<WorkspaceApp repository={repository} currentUrl={() => 'https://chatgpt.com/'} />);

    const backendRow = (await screen.findByTitle('Backend')).parentElement;
    if (backendRow === null) throw new Error('Backend row missing');
    fireEvent.contextMenu(backendRow, { clientX: 120, clientY: 100 });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Rename folder' }));
    expect(screen.getByRole('dialog', { name: 'Rename folder' })).toBeVisible();
    fireEvent.change(screen.getByRole('textbox', { name: 'Folder name' }), { target: { value: 'Platform' } });
    fireEvent.click(screen.getByRole('button', { name: 'Rename' }));

    await waitFor(async () => {
      expect((await repository.load())?.folders[0]?.name).toBe('Platform');
    });
  });

  it('renames and deletes notes from the note target context menu', async () => {
    const initial = createInitialWorkspace(1);
    initial.notes = [createLocalNote({ id: 'note-one', title: 'Runbook', folderId: null, now: 1 })];
    const repository = new MemoryWorkspaceRepository(initial);

    render(<WorkspaceApp repository={repository} currentUrl={() => 'https://chatgpt.com/'} />);

    let noteRow = (await screen.findByRole('button', { name: 'Runbook' })).parentElement;
    if (noteRow === null) throw new Error('Note row missing');
    fireEvent.contextMenu(noteRow, { clientX: 120, clientY: 100 });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Rename note' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Note title' }), { target: { value: 'Incident runbook' } });
    fireEvent.click(screen.getByRole('button', { name: 'Rename' }));

    await waitFor(async () => {
      expect((await repository.load())?.notes[0]?.title).toBe('Incident runbook');
    });

    noteRow = screen.getByRole('button', { name: 'Incident runbook' }).parentElement;
    if (noteRow === null) throw new Error('Renamed note row missing');
    fireEvent.contextMenu(noteRow, { clientX: 120, clientY: 100 });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete note' }));
    expect(screen.getByRole('alertdialog', { name: 'Delete note?' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(async () => {
      expect((await repository.load())?.notes).toHaveLength(0);
    });
  });

  it('renders Markdown sync as an ephemeral dedicated view without adding a persisted workspace tab', async () => {
    const initial = createInitialWorkspace(1);
    const note = createLocalNote({ id: 'note-one', title: 'Runbook', folderId: null, now: 1 });
    initial.notes = [note];
    initial.tabs = [
      ...initial.tabs,
      { id: 'tab-note-note-one', kind: 'note', entityId: note.id, title: note.title, pinned: false },
    ];
    initial.activeTabId = 'tab-note-note-one';
    const repository = new MemoryWorkspaceRepository(initial);
    const { rerender } = render(
      <WorkspaceApp repository={repository} currentUrl={() => 'https://chatgpt.com/'} view="workspace" />,
    );

    expect(await screen.findByRole('textbox', { name: 'Note title' })).toHaveValue('Runbook');
    expect(screen.queryByText('Local vault')).not.toBeInTheDocument();

    rerender(<WorkspaceApp repository={repository} currentUrl={() => 'https://chatgpt.com/'} view="markdown-sync" />);
    expect(screen.getByRole('main', { name: 'Markdown sync' })).toBeVisible();
    expect(screen.getByText('Obsidian vault')).toBeVisible();

    const saved = await repository.load();
    expect(saved?.tabs.map((tab) => tab.kind)).toEqual(['home', 'note']);

    rerender(<WorkspaceApp repository={repository} currentUrl={() => 'https://chatgpt.com/'} view="workspace" />);
    expect(screen.getByRole('textbox', { name: 'Note title' })).toHaveValue('Runbook');
  });

  it('persists library collapse and resize state as workspace layout', async () => {
    const repository = new MemoryWorkspaceRepository();
    render(<WorkspaceApp repository={repository} currentUrl={() => 'https://chatgpt.com/'} />);

    await screen.findByText('Local workspace ready.');
    const separator = screen.getByRole('separator', { name: 'Resize library' });
    const initialWidth = Number(separator.getAttribute('aria-valuenow'));
    fireEvent.keyDown(separator, { key: 'ArrowRight' });

    await waitFor(async () => {
      const saved = await repository.load();
      expect(saved?.layout.treeWidth).toBe(initialWidth + 16);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Collapse library' }));

    await waitFor(async () => {
      const saved = await repository.load();
      expect(saved?.layout.treeCollapsed).toBe(true);
    });
    expect(screen.queryByRole('navigation', { name: 'Workspace library' })).not.toBeInTheDocument();
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